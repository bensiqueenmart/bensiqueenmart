import { randomUUID } from 'node:crypto';
import type { CustomerData, Order, OrderItem, OrderStatus } from '@bqm/types';
import { getCollections, getMongoClient } from './client.js';
import { buildMovementDocs } from './stock.js';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const;

/** Stock deducts once on the transition into this status. */
export const STOCK_DEDUCT_STATUS: OrderStatus = 'paid';

export interface CreateOrderInput {
  orderItems: OrderItem[];
  customerData?: CustomerData;
  source?: string;
}

export interface PatchOrderInput {
  status?: OrderStatus;
  orderItems?: OrderItem[];
  totalPrice?: number;
  customerData?: CustomerData;
}

export interface PatchOrderResult {
  order: Order;
  /** True when this call performed the stock deduction. */
  stockDeducted: boolean;
}

function assertValidItem(item: OrderItem, i: number): void {
  const hasProduct = typeof item.productSlug === 'string' && item.productSlug.length > 0;
  const hasCombo = typeof (item as OrderItem).comboSlug === 'string' && ((item as OrderItem).comboSlug as string).length > 0;
  if ((hasProduct ? 1 : 0) + (hasCombo ? 1 : 0) !== 1) {
    throw new Error(`orderItems[${i}]: exactly one of productSlug / comboSlug must be set`);
  }
  if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
    throw new Error(`orderItems[${i}]: quantity must be a positive number (base units)`);
  }
  if (!Number.isFinite(item.price) || item.price < 0) {
    throw new Error(`orderItems[${i}]: price must be a non-negative number (paise line total)`);
  }
  if (item.packs !== undefined) {
    if (hasCombo) throw new Error(`orderItems[${i}]: packs only allowed on product lines`);
    if (!Array.isArray(item.packs) || item.packs.length === 0) {
      throw new Error(`orderItems[${i}]: packs must be a non-empty array when set`);
    }
    let sum = 0;
    for (const [j, p] of item.packs.entries()) {
      if (!Number.isInteger(p.size) || p.size <= 0 || !Number.isInteger(p.count) || p.count <= 0) {
        throw new Error(`orderItems[${i}].packs[${j}]: size and count must be positive integers`);
      }
      sum += p.size * p.count;
    }
    if (sum !== item.quantity) {
      throw new Error(`orderItems[${i}]: packs sum (${sum}) must equal quantity (${item.quantity})`);
    }
  }
}

function sumLineTotals(items: OrderItem[]): number {
  return items.reduce((sum, it) => sum + it.price, 0);
}

function generateOrderNo(date = new Date()): string {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BQM-${ymd}-${rand}`;
}

const DEFAULT_CUSTOMER: CustomerData = { customerName: '', mobile: '', fullAddress: '' };

/** Create a new billing-desk order. Status always starts at `pending`; no stock moves. */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (!input.orderItems || input.orderItems.length === 0) {
    throw new Error('orderItems must be a non-empty array');
  }
  input.orderItems.forEach(assertValidItem);

  const { orders } = await getCollections();
  const now = new Date().toISOString();
  const totalPrice = sumLineTotals(input.orderItems);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const order: Order = {
      id: randomUUID(),
      orderNo: generateOrderNo(),
      source: input.source ?? 'billing-desk',
      status: 'pending',
      totalPrice,
      customerData: input.customerData ?? DEFAULT_CUSTOMER,
      orderItems: input.orderItems,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await orders.insertOne(order);
      return order;
    } catch (err: unknown) {
      // Retry once or twice on an orderNo collision; anything else rethrows.
      if (attempt < 2 && err instanceof Error && err.message.includes('orderNo')) continue;
      throw err;
    }
  }
  throw new Error('createOrder: failed to generate a unique orderNo');
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { orders } = await getCollections();
  return orders.findOne({ id });
}

export interface ListOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Newest-first paginated order list. Defaults: page 1, limit 50. */
export async function listOrders(page = 1, limit = 50): Promise<ListOrdersResult> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 50));
  const { orders } = await getCollections();
  const total = await orders.countDocuments({});
  const docs = await orders
    .find({})
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .toArray();
  return { orders: docs, total, page: safePage, limit: safeLimit, hasMore: safePage * safeLimit < total };
}

/**
 * PATCH an order: status / items / totalPrice / customerData.
 * - Item edits are allowed only while the order is still pending (crash-recovery
 *   path). Once stock has been deducted, item changes are rejected.
 * - Stock deducts exactly once, on the transition into `paid`, in the same
 *   transaction as the status flip. Repeat PATCHes to `paid` are no-ops for
 *   stock (idempotent: existing movements for the order mean "already done").
 * - Combo lines expand to one movement per component product, each decremented
 *   by the line quantity in base units.
 */
export async function patchOrder(id: string, patch: PatchOrderInput): Promise<PatchOrderResult> {
  if (patch.status && !(ORDER_STATUSES as readonly string[]).includes(patch.status)) {
    throw new Error(`invalid status: ${patch.status}`);
  }
  if (patch.orderItems !== undefined) {
    if (patch.orderItems.length === 0) throw new Error('orderItems must be a non-empty array');
    patch.orderItems.forEach(assertValidItem);
  }

  const client = await getMongoClient();
  const session = client.startSession();
  try {
    let result: PatchOrderResult | null = null;
    await session.withTransaction(async () => {
      const { orders, products, combos, stockMovements } = await getCollections();
      const opts = { session };

      const existing = await orders.findOne({ id }, opts);
      if (!existing) throw new Error(`order not found: ${id}`);

      const alreadyDeducted =
        (await stockMovements.countDocuments({ orderId: id }, opts)) > 0;

      if (patch.orderItems !== undefined && alreadyDeducted) {
        throw new Error('order items cannot be changed after stock deduction');
      }

      const nextItems = patch.orderItems ?? existing.orderItems;
      const nextTotal =
        patch.totalPrice ?? (patch.orderItems !== undefined ? sumLineTotals(nextItems) : existing.totalPrice);
      const nextStatus = patch.status ?? existing.status;
      const now = new Date().toISOString();

      let stockDeducted = false;
      const enteringPaid = nextStatus === STOCK_DEDUCT_STATUS && existing.status !== STOCK_DEDUCT_STATUS;
      if (enteringPaid && !alreadyDeducted) {
        // Resolve combo lines -> component product slugs (one query for all combos).
        const comboSlugs = [
          ...new Set(
            nextItems.map((it) => it.comboSlug).filter((s): s is string => typeof s === 'string'),
          ),
        ];
        const comboDocs =
          comboSlugs.length > 0
            ? await combos.find({ slug: { $in: comboSlugs } }).toArray()
            : [];
        const comboBySlug = new Map(comboDocs.map((c) => [c.slug, c]));

        const deductions: Array<{ productSlug: string; deltaBaseQty: number; packs?: Array<{ size: number; count: number }> }> = [];
        for (const [i, item] of nextItems.entries()) {
          if (item.comboSlug) {
            const combo = comboBySlug.get(item.comboSlug);
            if (!combo) throw new Error(`orderItems[${i}]: unknown comboSlug ${item.comboSlug}`);
            for (const slug of combo.products) {
              // Combo components carry no pack breakdown — base-qty only (existing behavior).
              deductions.push({ productSlug: slug, deltaBaseQty: -item.quantity });
            }
          } else {
            deductions.push({ productSlug: item.productSlug as string, deltaBaseQty: -item.quantity, packs: item.packs });
          }
        }

        // One product read for every involved slug: decides bucket vs base-only path.
        const involvedSlugs = [...new Set(deductions.map((d) => d.productSlug))];
        const productDocs = await products.find({ slug: { $in: involvedSlugs } }).toArray();
        const productBySlug = new Map(productDocs.map((pd) => [pd.slug, pd]));

        // Aggregate per product: base grams + required packs per size (no N+1 loop).
        const baseByProduct = new Map<string, number>();
        const packsByProduct = new Map<string, Map<number, number>>();
        for (const [i, d] of deductions.entries()) {
          baseByProduct.set(d.productSlug, (baseByProduct.get(d.productSlug) ?? 0) + d.deltaBaseQty);
          if (d.packs && d.packs.length > 0) {
            const doc = productBySlug.get(d.productSlug);
            if (!doc) throw new Error(`orderItems: unknown productSlug ${d.productSlug}`);
            if (!doc.isQuantized) throw new Error(`orderItems: packs not allowed for loose product ${d.productSlug}`);
            let perSize = packsByProduct.get(d.productSlug);
            if (!perSize) {
              perSize = new Map<number, number>();
              packsByProduct.set(d.productSlug, perSize);
            }
            for (const pk of d.packs) {
              perSize.set(pk.size, (perSize.get(pk.size) ?? 0) + pk.count);
            }
          }
        }
        const ops: Array<Record<string, unknown>> = [];
        for (const [slug, delta] of baseByProduct.entries()) {
          const perSize = packsByProduct.get(slug);
          if (perSize && perSize.size > 0) {
            const need = [...perSize.entries()];
            const inc: Record<string, number> = { stockBaseQty: delta };
            const arrayFilters: Array<Record<string, unknown>> = [];
            need.forEach(([size, count], idx) => {
              const key = `b${idx}`;
              inc[`stockPacks.$[${key}].count`] = -count;
              arrayFilters.push({ [`${key}.size`]: size });
            });
            ops.push({
              updateOne: {
                filter: {
                  slug,
                  stockBaseQty: { $gte: -delta },
                  $and: need.map(([size, count]) => ({
                    stockPacks: { $elemMatch: { size, count: { $gte: count } } },
                  })),
                },
                update: { $inc: inc, $set: { updatedAt: now } },
                arrayFilters,
              },
            });
          } else {
            // Loose lines and combo components: base-qty only, exactly as before.
            ops.push({
              updateOne: {
                filter: { slug },
                update: { $inc: { stockBaseQty: delta }, $set: { updatedAt: now } },
              },
            });
          }
        }
        const bulkRes = await products.bulkWrite(ops as never, opts);
        const matched = (bulkRes as unknown as { matchedCount: number }).matchedCount;
        if (matched !== ops.length) {
          throw new Error('insufficient stock in packs for one or more products');
        }
        await stockMovements.insertMany(
          buildMovementDocs(
            [...baseByProduct.entries()].map(([productSlug, deltaBaseQty]) => ({ productSlug, deltaBaseQty })),
            'sale',
            id,
            now,
          ),
          opts,
        );
        stockDeducted = true;
      }

      await orders.updateOne(
        { id },
        {
          $set: {
            ...(patch.status ? { status: patch.status } : {}),
            ...(patch.orderItems !== undefined ? { orderItems: patch.orderItems } : {}),
            ...(patch.totalPrice !== undefined || patch.orderItems !== undefined
              ? { totalPrice: nextTotal }
              : {}),
            ...(patch.customerData !== undefined ? { customerData: patch.customerData } : {}),
            updatedAt: now,
          },
        },
        opts,
      );

      const updated = await orders.findOne({ id }, opts);
      if (!updated) throw new Error(`order vanished after update: ${id}`);
      result = { order: updated, stockDeducted };
    });
    if (!result) throw new Error('patchOrder: transaction produced no result');
    return result;
  } finally {
    await session.endSession();
  }
}
