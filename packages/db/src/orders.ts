import { randomUUID } from 'node:crypto';
import type { ClientSession } from 'mongodb';
import type { Combo, CustomerData, Order, OrderItem, OrderSource, OrderStatus, QuantizedCount } from '@bqm/types';
import { getCollections, type BqmCollections, getMongoClient } from './client.js';
import { buildMovementDocs, deltaBaseTotal } from './stock.js';

export const ORDER_STATUSES: readonly OrderStatus[] = ['unconfirmed', 'confirmed'] as const;

/** Allowed order origins (`OrderSource`). Runtime owner lives here next to ORDER_STATUSES. */
export const ORDER_SOURCES: readonly OrderSource[] = ['in-store', 'online'] as const;

/**
 * The deducted state. Entering it deducts stock (`sale`); leaving it
 * restores the same lines (`restore`). State — not movement history — is
 * the source of truth, so toggling is symmetric and idempotent.
 */
export const STOCK_DEDUCT_STATUS: OrderStatus = 'confirmed';

export interface CreateOrderInput {
  orderItems: OrderItem[];
  customerData?: CustomerData;
  source?: OrderSource;
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
  /** True when this call restored previously deducted stock. */
  stockRestored: boolean;
}

/** Structural check with no DB access: exactly one slug, sane quantity shape, sane price. */
function assertValidItem(item: OrderItem, i: number): void {
  const hasProduct = typeof item.productSlug === 'string' && item.productSlug.length > 0;
  const hasCombo = typeof (item as OrderItem).comboSlug === 'string' && ((item as OrderItem).comboSlug as string).length > 0;
  if ((hasProduct ? 1 : 0) + (hasCombo ? 1 : 0) !== 1) {
    throw new Error(`orderItems[${i}]: exactly one of productSlug / comboSlug must be set`);
  }
  if (hasCombo) {
    if (!Number.isInteger(item.quantity) || (item.quantity as number) <= 0) {
      throw new Error(`orderItems[${i}]: combo-line quantity must be a positive integer (combo-unit count)`);
    }
  } else if (typeof item.quantity === 'number') {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(`orderItems[${i}]: quantity must be a positive number (base units)`);
    }
  } else {
    assertValidQuantized(item.quantity, `orderItems[${i}].quantity`);
  }
  if (!Number.isFinite(item.price) || item.price < 0) {
    throw new Error(`orderItems[${i}]: price must be a non-negative number (paise line total)`);
  }
}

function assertValidQuantized(qty: unknown, what: string): asserts qty is QuantizedCount[] {
  if (!Array.isArray(qty) || qty.length === 0) {
    throw new Error(`${what} must be a non-empty QuantizedCount array`);
  }
  for (const [j, q] of (qty as QuantizedCount[]).entries()) {
    if (!Number.isInteger(q.size) || q.size <= 0 || !Number.isInteger(q.count) || q.count <= 0) {
      throw new Error(`${what}[${j}]: size and count must be positive integers`);
    }
  }
}

interface CatalogMaps {
  comboBySlug: Map<string, Combo>;
  productBySlug: Map<string, { slug: string; isQuantized: boolean }>;
}

/**
 * Shape-vs-catalog check: every product-line quantity must match the
 * product's own stock shape (number for loose, QuantizedCount[] for
 * quantized); every combo component must match its product's shape.
 * No Σ cross-checks — the shapes are the same type on both sides.
 */
function assertCatalogMatch(items: OrderItem[], maps: CatalogMaps): void {
  items.forEach((item, i) => {
    if (item.comboSlug) {
      const combo = maps.comboBySlug.get(item.comboSlug);
      if (!combo) throw new Error(`orderItems[${i}]: unknown comboSlug ${item.comboSlug}`);
      if (!Array.isArray(combo.products) || combo.products.length === 0) {
        throw new Error(`orderItems[${i}]: combo ${item.comboSlug} has no products`);
      }
      for (const [j, comp] of combo.products.entries()) {
        if (typeof comp?.productSlug !== 'string' || comp.productSlug.length === 0) {
          throw new Error(`orderItems[${i}]: combo ${item.comboSlug} products[${j}] has no productSlug`);
        }
        const doc = maps.productBySlug.get(comp.productSlug);
        if (!doc) throw new Error(`orderItems[${i}]: combo ${item.comboSlug} has unknown productSlug ${comp.productSlug}`);
        assertComponentShape(comp.quantity, doc.isQuantized, `orderItems[${i}]: combo ${item.comboSlug} products[${j}]`);
      }
      return;
    }
    const doc = maps.productBySlug.get(item.productSlug as string);
    if (!doc) throw new Error(`orderItems[${i}]: unknown productSlug ${item.productSlug}`);
    assertComponentShape(item.quantity, doc.isQuantized, `orderItems[${i}]`);
  });
}

function assertComponentShape(qty: number | QuantizedCount[], isQuantized: boolean, what: string): void {
  if (isQuantized) {
    if (!Array.isArray(qty)) throw new Error(`${what}: quantized product needs a QuantizedCount array quantity`);
    assertValidQuantized(qty, `${what}.quantity`);
  } else if (typeof qty !== 'number' || !Number.isFinite(qty) || qty <= 0) {
    throw new Error(`${what}: loose product needs a positive base-unit number quantity`);
  }
}

/** Bulk-read the catalog maps for a set of items (one combo query + one product query, no N+1). */
async function fetchCatalogMaps(items: OrderItem[]): Promise<CatalogMaps> {
  const { combos, products } = await getCollections();
  const comboSlugs = [...new Set(items.map((it) => it.comboSlug).filter((s): s is string => typeof s === 'string'))];
  const comboDocs =
    comboSlugs.length > 0 ? await combos.find({ slug: { $in: comboSlugs } }).toArray() : [];
  const comboBySlug = new Map(comboDocs.map((c) => [c.slug, c]));
  const involved = new Set<string>();
  for (const it of items) {
    if (it.comboSlug) {
      for (const comp of comboBySlug.get(it.comboSlug)?.products ?? []) {
        if (typeof comp?.productSlug === 'string') involved.add(comp.productSlug);
      }
    } else if (typeof it.productSlug === 'string') {
      involved.add(it.productSlug);
    }
  }
  const productDocs =
    involved.size > 0 ? await products.find({ slug: { $in: [...involved] } }).toArray() : [];
  return {
    comboBySlug: comboBySlug as CatalogMaps['comboBySlug'],
    productBySlug: new Map(productDocs.map((pd) => [pd.slug, pd])),
  };
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

/** Create a new billing-desk order. Status always starts `unconfirmed`; no stock moves. */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (!input.orderItems || input.orderItems.length === 0) {
    throw new Error('orderItems must be a non-empty array');
  }
  // Legacy callers passed 'billing-desk'; that terminal is `in-store` now.
  const rawSource = (input.source as string | undefined) ?? 'in-store';
  const source: OrderSource = rawSource === 'billing-desk' ? 'in-store' : (rawSource as OrderSource);
  if (!(ORDER_SOURCES as readonly string[]).includes(source)) {
    throw new Error(`invalid source: ${rawSource}`);
  }
  input.orderItems.forEach(assertValidItem);
  assertCatalogMatch(input.orderItems, await fetchCatalogMaps(input.orderItems));

  const { orders } = await getCollections();
  const now = new Date().toISOString();
  const totalPrice = sumLineTotals(input.orderItems);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const order: Order = {
      id: randomUUID(),
      orderNo: generateOrderNo(),
      source,
      status: 'unconfirmed',
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

/** One signed line per affected product. Negative = take from stock. */
interface StockDeltaLine {
  productSlug: string;
  delta: number | QuantizedCount[];
}

/**
 * Expand order lines to signed shape-matched deltas (negative = deduct).
 * Combo lines expand to one line per component, counts scaled by the
 * combo-unit count. The SAME function feeds deduct and restore — restore
 * just negates the result — so the math cannot diverge between directions.
 */
function expandDeductionLines(items: OrderItem[], comboBySlug: Map<string, Combo>): StockDeltaLine[] {
  const out: StockDeltaLine[] = [];
  for (const item of items) {
    if (item.comboSlug) {
      const lineQty = item.quantity as number;
      for (const comp of comboBySlug.get(item.comboSlug)?.products ?? []) {
        if (typeof comp.quantity === 'number') {
          out.push({ productSlug: comp.productSlug, delta: -(lineQty * comp.quantity) });
        } else {
          out.push({
            productSlug: comp.productSlug,
            delta: (comp.quantity as QuantizedCount[]).map((q) => ({ size: q.size, count: -(q.count * lineQty) })),
          });
        }
      }
    } else if (typeof item.quantity === 'number') {
      out.push({ productSlug: item.productSlug as string, delta: -item.quantity });
    } else {
      out.push({
        productSlug: item.productSlug as string,
        delta: (item.quantity as QuantizedCount[]).map((q) => ({ size: q.size, count: -q.count })),
      });
    }
  }
  return out;
}

/** Sign-flip for restores: what was taken (negative) goes back (positive). */
function negateDeltas(lines: StockDeltaLine[]): StockDeltaLine[] {
  return lines.map((l) => ({
    productSlug: l.productSlug,
    delta: typeof l.delta === 'number' ? -l.delta : l.delta.map((q) => ({ size: q.size, count: -q.count })),
  }));
}

/**
 * Apply signed deltas to product stock (one bulkWrite, no N+1) + one
 * movement row per product with the given reason. Reasons are audit-only:
 * `sale` (confirm), `restore` (unconfirm), `delete-restore` (delete with
 * restock). The order doc stays the source of truth — these rows are never
 * replayed, restores always derive from the order's own items.
 */
async function applyStockDeltas(
  collections: Pick<BqmCollections, 'products' | 'stockMovements'>,
  lines: StockDeltaLine[],
  reason: string,
  orderId: string,
  now: string,
  session: ClientSession,
): Promise<void> {
  const { products, stockMovements } = collections;
  const opts = { session };
  // Aggregate per product: loose totals + per-size pack counts (no N+1 loop).
  const looseByProduct = new Map<string, number>();
  const quantByProduct = new Map<string, Map<number, number>>();
  for (const d of lines) {
    if (typeof d.delta === 'number') {
      looseByProduct.set(d.productSlug, (looseByProduct.get(d.productSlug) ?? 0) + d.delta);
    } else {
      let perSize = quantByProduct.get(d.productSlug);
      if (!perSize) {
        perSize = new Map<number, number>();
        quantByProduct.set(d.productSlug, perSize);
      }
      for (const q of d.delta) {
        perSize.set(q.size, (perSize.get(q.size) ?? 0) + q.count);
      }
    }
  }
  const ops: Array<Record<string, unknown>> = [];
  const movementLines: Array<{ productSlug: string; deltaBaseQty: number }> = [];
  for (const [slug, delta] of looseByProduct.entries()) {
    ops.push({
      updateOne: {
        filter: delta < 0 ? { slug, stock: { $gte: -delta } } : { slug },
        update: { $inc: { stock: delta }, $set: { updatedAt: now } },
      },
    });
    movementLines.push({ productSlug: slug, deltaBaseQty: delta });
  }
  for (const [slug, perSize] of quantByProduct.entries()) {
    const need = [...perSize.entries()];
    // Oversell guards only constrain takes; restores add back unconditionally.
    const guards = need
      .filter(([, count]) => count < 0)
      .map(([size, count]) => ({
        stock: { $elemMatch: { size, count: { $gte: -count } } },
      }));
    const inc: Record<string, number> = {};
    const arrayFilters: Array<Record<string, unknown>> = [];
    need.forEach(([size, count], idx) => {
      const key = `b${idx}`;
      inc[`stock.$[${key}].count`] = count;
      arrayFilters.push({ [`${key}.size`]: size });
    });
    ops.push({
      updateOne: {
        filter: { slug, ...(guards.length > 0 ? { $and: guards } : {}) },
        update: { $inc: inc, $set: { updatedAt: now } },
        arrayFilters,
      },
    });
    movementLines.push({
      productSlug: slug,
      deltaBaseQty: deltaBaseTotal(need.map(([size, count]) => ({ size, count }))),
    });
  }
  const bulkRes = await products.bulkWrite(ops as never, opts);
  const { matchedCount, modifiedCount } = bulkRes as unknown as { matchedCount: number; modifiedCount: number };
  if (matchedCount !== ops.length || modifiedCount !== ops.length) {
    throw new Error('insufficient stock for one or more products');
  }
  await stockMovements.insertMany(buildMovementDocs(movementLines, reason, orderId, now), opts);
}

export interface DeleteOrderInput {
  /**
   * Confirmed orders only: true = add the deducted stock back (recorded as
   * `delete-restore`) before deleting; false = delete and leave stock as-is.
   * Ignored for unconfirmed orders (nothing was ever deducted).
   */
  restoreStock?: boolean;
}

export interface DeleteOrderResult {
  deleted: true;
  /** True when stock was added back before deletion. */
  stockRestored: boolean;
}

/**
 * PATCH an order: status / items / totalPrice / customerData.
 * - Item edits are allowed only while the order is still unconfirmed
 *   (crash-recovery path). Once stock has been deducted, item changes are
 *   rejected.
 * - Entering `confirmed` deducts shape-identical stock (`sale`); leaving
 *   `confirmed` restores the same lines (`restore`) — both in the same
 *   transaction as the status flip, so state and stock stay consistent.
 *   Repeat PATCHes to the current status are stock no-ops.
 * - Combo lines expand to one movement per component product, each moved
 *   by the shape-matched component quantity times the combo-unit count.
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

      if (patch.orderItems !== undefined && existing.status === STOCK_DEDUCT_STATUS) {
        throw new Error('order items cannot be changed after stock deduction');
      }

      const nextItems = patch.orderItems ?? existing.orderItems;
      const nextTotal =
        patch.totalPrice ?? (patch.orderItems !== undefined ? sumLineTotals(nextItems) : existing.totalPrice);
      const nextStatus = patch.status ?? existing.status;
      const now = new Date().toISOString();

      let stockDeducted = false;
      let stockRestored = false;
      const enteringConfirmed = nextStatus === STOCK_DEDUCT_STATUS && existing.status !== STOCK_DEDUCT_STATUS;
      const leavingConfirmed = existing.status === STOCK_DEDUCT_STATUS && nextStatus !== STOCK_DEDUCT_STATUS;
      // Validate new items against the live catalog and, on a confirmed
      // transition, move shape-identical stock — all in the txn snapshot.
      if (patch.orderItems !== undefined || enteringConfirmed || leavingConfirmed) {
        // Resolve combo lines -> component products (one query for all combos).
        const comboSlugs = [
          ...new Set(
            nextItems.map((it) => it.comboSlug).filter((s): s is string => typeof s === 'string'),
          ),
        ];
        const comboDocs =
          comboSlugs.length > 0
            ? await combos.find({ slug: { $in: comboSlugs } }, opts).toArray()
            : [];
        const comboBySlug = new Map(comboDocs.map((c) => [c.slug, c]));

        // One product read for every involved slug (lines + combo components).
        const involved = new Set<string>();
        for (const it of nextItems) {
          if (it.comboSlug) {
            for (const comp of comboBySlug.get(it.comboSlug)?.products ?? []) {
              if (typeof comp?.productSlug === 'string') involved.add(comp.productSlug);
            }
          } else if (typeof it.productSlug === 'string') {
            involved.add(it.productSlug);
          }
        }
        const productDocs =
          involved.size > 0
            ? await products.find({ slug: { $in: [...involved] } }, opts).toArray()
            : [];
        const productBySlug = new Map(productDocs.map((pd) => [pd.slug, pd]));
        const maps = {
          comboBySlug: comboBySlug as CatalogMaps['comboBySlug'],
          productBySlug: productBySlug as CatalogMaps['productBySlug'],
        };
        assertCatalogMatch(nextItems, maps);

        if (enteringConfirmed || leavingConfirmed) {
          // One shared expansion for both directions: confirming takes stock
          // away (`sale`), unconfirming puts the same lines back (`restore`).
          const taken = expandDeductionLines(nextItems, comboBySlug);
          const reason = enteringConfirmed ? 'sale' : 'restore';
          await applyStockDeltas(
            { products, stockMovements },
            enteringConfirmed ? taken : negateDeltas(taken),
            reason,
            id,
            now,
            session,
          );
          if (enteringConfirmed) stockDeducted = true;
          else stockRestored = true;
        }
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
      result = { order: updated, stockDeducted, stockRestored };
    });
    if (!result) throw new Error('patchOrder: transaction produced no result');
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Delete an order. One transaction:
 * - confirmed + `restoreStock: true` → add the deducted lines back first
 *   (`delete-restore` movements), then delete the doc;
 * - confirmed + no restore → delete, stock stays as-is;
 * - unconfirmed → just delete (nothing was ever deducted).
 * Stock movements are audit history and are never deleted.
 */
export async function deleteOrder(id: string, input: DeleteOrderInput = {}): Promise<DeleteOrderResult> {
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    let result: DeleteOrderResult | null = null;
    await session.withTransaction(async () => {
      const { orders, products, combos, stockMovements } = await getCollections();
      const opts = { session };

      const existing = await orders.findOne({ id }, opts);
      if (!existing) throw new Error(`order not found: ${id}`);

      let stockRestored = false;
      if (existing.status === STOCK_DEDUCT_STATUS && input.restoreStock) {
        const now = new Date().toISOString();
        const comboSlugs = [
          ...new Set(
            existing.orderItems.map((it) => it.comboSlug).filter((s): s is string => typeof s === 'string'),
          ),
        ];
        const comboDocs =
          comboSlugs.length > 0
            ? await combos.find({ slug: { $in: comboSlugs } }, opts).toArray()
            : [];
        const comboBySlug = new Map(comboDocs.map((c) => [c.slug, c as Combo]));
        const involved = new Set<string>();
        for (const it of existing.orderItems) {
          if (it.comboSlug) {
            for (const comp of comboBySlug.get(it.comboSlug)?.products ?? []) {
              if (typeof comp?.productSlug === 'string') involved.add(comp.productSlug);
            }
          } else if (typeof it.productSlug === 'string') {
            involved.add(it.productSlug);
          }
        }
        const productDocs =
          involved.size > 0
            ? await products.find({ slug: { $in: [...involved] } }, opts).toArray()
            : [];
        assertCatalogMatch(existing.orderItems, {
          comboBySlug,
          productBySlug: new Map(productDocs.map((pd) => [pd.slug, pd])),
        });
        await applyStockDeltas(
          { products, stockMovements },
          negateDeltas(expandDeductionLines(existing.orderItems, comboBySlug)),
          'delete-restore',
          id,
          now,
          session,
        );
        stockRestored = true;
      }

      await orders.deleteOne({ id }, opts);
      result = { deleted: true as const, stockRestored };
    });
    if (!result) throw new Error('deleteOrder: transaction produced no result');
    return result;
  } finally {
    await session.endSession();
  }
}
