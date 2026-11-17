import { randomUUID } from 'node:crypto';
import type { ClientSession } from 'mongodb';
import type { Combo, CustomerData, Order, OrderItem, OrderItemInput, OrderSource, OrderStatus, Product, QuantizedCount, StockDeductionLine } from '@bqm/types';
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
  orderItems: OrderItemInput[];
  customerData?: CustomerData;
  source?: OrderSource;
}

export interface PatchOrderInput {
  status?: OrderStatus;
  orderItems?: OrderItemInput[];
  totalPrice?: number;
  customerData?: CustomerData;
}

export interface PatchOrderResult {
  order: Order;
  /** True when this call performed the stock deduction. */
  stockDeducted: boolean;
  /** True when this call restored previously deducted stock. */
  stockRestored: boolean;
  /** Slugs of deducted products that no longer exist — movement written, stock write skipped. */
  missingProducts: string[];
}

/** Structural check with no DB access: exactly one slug, sane quantity shape, sane price. */
function assertValidItem(item: OrderItemInput, i: number): void {
  const hasProduct = typeof item.productSlug === 'string' && item.productSlug.length > 0;
  const hasCombo = typeof item.comboSlug === 'string' && item.comboSlug.length > 0;
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
    throw new Error(`orderItems[${i}]: price must be a non-negative number (rupees line total)`);
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
  comboById: Map<string, Combo>;
  productById: Map<string, Product>;
}

/**
 * Shape-vs-catalog check on stored (id-keyed) lines: every product-line
 * quantity must match the product's own stock shape (number for loose,
 * QuantizedCount[] for quantized); every combo component must match its
 * product's shape. `isQuantized` is immutable, so a live-doc check is exact.
 * No Σ cross-checks — the shapes are the same type on both sides.
 */
function assertCatalogMatch(items: OrderItem[], maps: CatalogMaps): void {
  items.forEach((item, i) => {
    const ref = item.comboSlug ?? item.productSlug ?? item.comboId ?? item.productId ?? `#${i}`;
    if (item.comboId) {
      const combo = maps.comboById.get(item.comboId);
      if (!combo) throw new Error(`orderItems[${i}]: unknown combo ${ref}`);
      if (!Array.isArray(combo.products) || combo.products.length === 0) {
        throw new Error(`orderItems[${i}]: combo ${ref} has no products`);
      }
      for (const [j, comp] of combo.products.entries()) {
        const doc = maps.productById.get(comp.productId);
        if (!doc) throw new Error(`orderItems[${i}]: combo ${ref} has unknown product ${comp.productSlug}`);
        assertComponentShape(comp.quantity, doc.isQuantized, `orderItems[${i}]: combo ${ref} products[${j}]`);
      }
      return;
    }
    const doc = maps.productById.get(item.productId as string);
    if (!doc) throw new Error(`orderItems[${i}]: unknown product ${ref}`);
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

/** Bulk-read combo + product docs for wire (slug-keyed) lines (one query each, no N+1). */
async function fetchDocsBySlug(
  items: OrderItemInput[],
  opts?: { session?: ClientSession },
): Promise<{ comboBySlug: Map<string, Combo>; productBySlug: Map<string, Product> }> {
  const { combos, products } = await getCollections();
  const comboSlugs = [...new Set(items.map((it) => it.comboSlug).filter((s): s is string => typeof s === 'string'))];
  const comboDocs =
    comboSlugs.length > 0 ? await combos.find({ slug: { $in: comboSlugs } }, opts).toArray() : [];
  const comboBySlug = new Map(comboDocs.map((c) => [c.slug, c as Combo]));
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
    involved.size > 0 ? await products.find({ slug: { $in: [...involved] } }, opts).toArray() : [];
  return { comboBySlug, productBySlug: new Map(productDocs.map((pd) => [pd.slug, pd as Product])) };
}

/** Bulk-read combo + product docs for stored (id-keyed) lines (one query each, no N+1). */
async function fetchDocsById(items: OrderItem[], opts?: { session?: ClientSession }): Promise<CatalogMaps> {
  const { combos, products } = await getCollections();
  const comboIds = [...new Set(items.map((it) => it.comboId).filter((s): s is string => typeof s === 'string'))];
  const comboDocs =
    comboIds.length > 0 ? await combos.find({ id: { $in: comboIds } }, opts).toArray() : [];
  const comboById = new Map(comboDocs.map((c) => [(c as Combo).id, c as Combo]));
  const involved = new Set<string>();
  for (const it of items) {
    if (it.comboId) {
      for (const comp of comboById.get(it.comboId)?.products ?? []) {
        if (typeof comp?.productId === 'string') involved.add(comp.productId);
      }
    } else if (typeof it.productId === 'string') {
      involved.add(it.productId);
    }
  }
  const productDocs =
    involved.size > 0 ? await products.find({ id: { $in: [...involved] } }, opts).toArray() : [];
  return { comboById, productById: new Map(productDocs.map((pd) => [(pd as Product).id, pd as Product])) };
}

/**
 * Resolve wire (slug-keyed) lines to stored (id-keyed) lines, snapshotting
 * combo/product display data at write time. Throws on unknown slugs.
 */
function enrichItems(
  inputs: OrderItemInput[],
  comboBySlug: Map<string, Combo>,
  productBySlug: Map<string, Product>,
): OrderItem[] {
  return inputs.map((item, i) => {
    if (item.comboSlug) {
      const combo = comboBySlug.get(item.comboSlug);
      if (!combo) throw new Error(`orderItems[${i}]: unknown comboSlug ${item.comboSlug}`);
      return {
        comboId: combo.id,
        comboSlug: combo.slug,
        name: combo.name,
        ...(combo.tamilName ? { tamilName: combo.tamilName } : {}),
        quantity: item.quantity,
        price: item.price,
      };
    }
    const doc = productBySlug.get(item.productSlug as string);
    if (!doc) throw new Error(`orderItems[${i}]: unknown productSlug ${item.productSlug}`);
    return {
      productId: doc.id,
      productSlug: doc.slug,
      name: doc.name,
      ...(doc.tamilName ? { tamilName: doc.tamilName } : {}),
      stockUnit: doc.stockUnit,
      quantity: item.quantity,
      price: item.price,
    };
  });
}

function sumLineTotals(items: Array<{ price: number }>): number {
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
  const { comboBySlug, productBySlug } = await fetchDocsBySlug(input.orderItems);
  const items = enrichItems(input.orderItems, comboBySlug, productBySlug);
  assertCatalogMatch(items, {
    comboById: new Map([...comboBySlug.values()].map((c) => [c.id, c])),
    productById: new Map([...productBySlug.values()].map((p) => [p.id, p])),
  });

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
      orderItems: items,
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
 * Expand stored order lines to signed id-keyed deltas (negative = deduct).
 * Combo lines expand to one line per component, counts scaled by the
 * combo-unit count. The SAME function feeds deduct and restore — restore
 * just negates the result — so the math cannot diverge between directions.
 */
/** Expand one stored line to its signed id-keyed deltas (negative = deduct). */
function expandLine(item: OrderItem, comboById: Map<string, Combo>): StockDeductionLine[] {
  if (item.comboId) {
    const lineQty = item.quantity as number;
    const out: StockDeductionLine[] = [];
    for (const comp of comboById.get(item.comboId)?.products ?? []) {
      if (typeof comp.quantity === 'number') {
        out.push({ productId: comp.productId, productSlug: comp.productSlug, delta: -(lineQty * comp.quantity) });
      } else {
        out.push({
          productId: comp.productId,
          productSlug: comp.productSlug,
          delta: (comp.quantity as QuantizedCount[]).map((q) => ({ size: q.size, count: -(q.count * lineQty) })),
        });
      }
    }
    return out;
  }
  if (typeof item.quantity === 'number') {
    return [{ productId: item.productId as string, productSlug: item.productSlug as string, delta: -item.quantity }];
  }
  return [{
    productId: item.productId as string,
    productSlug: item.productSlug as string,
    delta: (item.quantity as QuantizedCount[]).map((q) => ({ size: q.size, count: -q.count })),
  }];
}

function expandDeductionLines(items: OrderItem[], comboById: Map<string, Combo>): StockDeductionLine[] {
  return items.flatMap((item) => expandLine(item, comboById));
}

/** Sign-flip for restores: what was taken (negative) goes back (positive). */
function negateDeltas(lines: StockDeductionLine[]): StockDeductionLine[] {
  return lines.map((l) => ({
    productId: l.productId,
    productSlug: l.productSlug,
    delta: typeof l.delta === 'number' ? -l.delta : l.delta.map((q) => ({ size: q.size, count: -q.count })),
  }));
}

/**
 * Apply signed deltas to product stock (one bulkWrite, no N+1) + one
 * movement row per product with the given reason. Reasons are audit-only:
 * `sale` (confirm), `restore` (unconfirm), `delete-restore` (delete with
 * restock). The order doc stays the source of truth — these rows are never
 * replayed, restores always replay the order's own deduction snapshot.
 *
 * Deleted-product policy: the movement is always written (audit stays
 * truthful); the stock write is skipped for products that no longer exist.
 * Returns their slugs so callers can surface them.
 */
async function applyStockDeltas(
  collections: Pick<BqmCollections, 'products' | 'stockMovements'>,
  lines: StockDeductionLine[],
  reason: string,
  orderId: string,
  now: string,
  session: ClientSession,
): Promise<string[]> {
  const { products, stockMovements } = collections;
  const opts = { session };
  // Aggregate per product id: loose totals + per-size pack counts (no N+1 loop).
  const loose = new Map<string, { slug: string; delta: number }>();
  const quant = new Map<string, { slug: string; perSize: Map<number, number> }>();
  for (const d of lines) {
    if (typeof d.delta === 'number') {
      const e = loose.get(d.productId) ?? { slug: d.productSlug, delta: 0 };
      e.delta += d.delta;
      loose.set(d.productId, e);
    } else {
      let e = quant.get(d.productId);
      if (!e) {
        e = { slug: d.productSlug, perSize: new Map<number, number>() };
        quant.set(d.productId, e);
      }
      for (const q of d.delta) e.perSize.set(q.size, (e.perSize.get(q.size) ?? 0) + q.count);
    }
  }
  const ids = [...new Set([...loose.keys(), ...quant.keys()])];
  const existing = new Set(
    (await products.find({ id: { $in: ids } }, { ...opts, projection: { id: 1 } }).toArray()).map(
      (p) => (p as Product).id,
    ),
  );
  const missing = [
    ...new Set(
      [...loose.entries(), ...quant.entries()].filter(([id]) => !existing.has(id)).map(([, e]) => e.slug),
    ),
  ];
  const ops: Array<Record<string, unknown>> = [];
  const movementLines: Array<{ productId: string; productSlug: string; deltaBaseQty: number }> = [];
  for (const [id, e] of loose.entries()) {
    if (existing.has(id)) {
      ops.push({
        updateOne: {
          filter: e.delta < 0 ? { id, stock: { $gte: -e.delta } } : { id },
          update: { $inc: { stock: e.delta }, $set: { updatedAt: now } },
        },
      });
    }
    movementLines.push({ productId: id, productSlug: e.slug, deltaBaseQty: e.delta });
  }
  for (const [id, e] of quant.entries()) {
    const need = [...e.perSize.entries()];
    if (existing.has(id)) {
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
          filter: { id, ...(guards.length > 0 ? { $and: guards } : {}) },
          update: { $inc: inc, $set: { updatedAt: now } },
          arrayFilters,
        },
      });
    }
    movementLines.push({
      productId: id,
      productSlug: e.slug,
      deltaBaseQty: deltaBaseTotal(need.map(([size, count]) => ({ size, count }))),
    });
  }
  if (ops.length > 0) {
    const bulkRes = await products.bulkWrite(ops as never, opts);
    const { matchedCount, modifiedCount } = bulkRes as unknown as { matchedCount: number; modifiedCount: number };
    if (matchedCount !== ops.length || modifiedCount !== ops.length) {
      throw new Error('insufficient stock for one or more products');
    }
  }
  await stockMovements.insertMany(buildMovementDocs(movementLines, reason, orderId, now), opts);
  return missing;
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
  /** Slugs of deducted products that no longer exist — movement written, stock write skipped. */
  missingProducts: string[];
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
      const { orders, products, stockMovements } = await getCollections();
      const opts = { session };

      const existing = await orders.findOne({ id }, opts);
      if (!existing) throw new Error(`order not found: ${id}`);

      if (patch.orderItems !== undefined && existing.status === STOCK_DEDUCT_STATUS) {
        throw new Error('order items cannot be changed after stock deduction');
      }

      const nextItems = patch.orderItems ?? existing.orderItems;
      const nextTotal =
        patch.totalPrice ?? (patch.orderItems !== undefined ? sumLineTotals(patch.orderItems) : existing.totalPrice);
      const nextStatus = patch.status ?? existing.status;
      const now = new Date().toISOString();

      let stockDeducted = false;
      let stockRestored = false;
      let missingProducts: string[] = [];
      const enteringConfirmed = nextStatus === STOCK_DEDUCT_STATUS && existing.status !== STOCK_DEDUCT_STATUS;
      const leavingConfirmed = existing.status === STOCK_DEDUCT_STATUS && nextStatus !== STOCK_DEDUCT_STATUS;
      // Resolve wire lines once, validate against the live catalog and, on
      // a confirmed transition, move shape-identical stock — all in the txn.
      // Confirming snapshots the per-line expansion onto the order (`sale`);
      // unconfirming replays that snapshot (`restore`) so later combo edits
      // cannot drift the math.
      let storedItems: OrderItem[] | undefined;
      if (patch.orderItems !== undefined || enteringConfirmed || leavingConfirmed) {
        if (patch.orderItems !== undefined) {
          const bySlug = await fetchDocsBySlug(patch.orderItems, opts);
          storedItems = enrichItems(patch.orderItems, bySlug.comboBySlug, bySlug.productBySlug);
        } else {
          storedItems = existing.orderItems;
        }

        if (enteringConfirmed || patch.orderItems !== undefined) {
          // New/edited lines and every deduction require live products —
          // takes cannot target a deleted product.
          const maps = await fetchDocsById(storedItems, opts);
          assertCatalogMatch(storedItems, maps);
          if (enteringConfirmed) {
            storedItems = storedItems.map((it) => ({ ...it, deduction: expandLine(it, maps.comboById) }));
            const taken = storedItems.flatMap((it) => it.deduction ?? []);
            missingProducts = await applyStockDeltas({ products, stockMovements }, taken, 'sale', id, now, session);
            stockDeducted = true;
          }
        } else if (leavingConfirmed) {
          // Unconfirming replays the snapshot (`restore`) with no
          // live-catalog check: the snapshot is authoritative and deleted
          // products are policy-skipped downstream.
          const snapshots = existing.orderItems.flatMap((it: OrderItem) => it.deduction ?? []);
          const taken =
            snapshots.length > 0 || existing.orderItems.length === 0
              ? snapshots
              : expandDeductionLines(existing.orderItems, (await fetchDocsById(existing.orderItems, opts)).comboById);
          missingProducts = await applyStockDeltas({ products, stockMovements }, negateDeltas(taken), 'restore', id, now, session);
          stockRestored = true;
        }
      }

      await orders.updateOne(
        { id },
        {
          $set: {
            ...(patch.status ? { status: patch.status } : {}),
            ...(storedItems !== undefined ? { orderItems: storedItems } : {}),
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
      result = { order: updated, stockDeducted, stockRestored, missingProducts };
    });
    if (!result) throw new Error('patchOrder: transaction produced no result');
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Delete an order. One transaction:
 * - confirmed + `restoreStock: true` → replay the order's deduction
 *   snapshot (`delete-restore` movements), then delete the doc;
 * - confirmed + no restore → delete, stock stays as-is;
 * - unconfirmed → just delete (nothing was ever deducted).
 * Stock movements are audit history and are never deleted.
 * `missingProducts` lists deducted slugs whose product is gone (movement
 * written, stock write skipped).
 */
export async function deleteOrder(id: string, input: DeleteOrderInput = {}): Promise<DeleteOrderResult> {
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    let result: DeleteOrderResult | null = null;
    await session.withTransaction(async () => {
      const { orders, products, stockMovements } = await getCollections();
      const opts = { session };

      const existing = await orders.findOne({ id }, opts);
      if (!existing) throw new Error(`order not found: ${id}`);

      let stockRestored = false;
      let missingProducts: string[] = [];
      if (existing.status === STOCK_DEDUCT_STATUS && input.restoreStock) {
        const now = new Date().toISOString();
        const snapshots = existing.orderItems.flatMap((it: OrderItem) => it.deduction ?? []);
        const taken =
          snapshots.length > 0 || existing.orderItems.length === 0
            ? snapshots
            : expandDeductionLines(existing.orderItems, (await fetchDocsById(existing.orderItems, opts)).comboById);
        missingProducts = await applyStockDeltas(
          { products, stockMovements },
          negateDeltas(taken),
          'delete-restore',
          id,
          now,
          session,
        );
        stockRestored = true;
      }

      await orders.deleteOne({ id }, opts);
      result = { deleted: true as const, stockRestored, missingProducts };
    });
    if (!result) throw new Error('deleteOrder: transaction produced no result');
    return result;
  } finally {
    await session.endSession();
  }
}
