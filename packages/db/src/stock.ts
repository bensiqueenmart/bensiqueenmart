import { randomUUID } from 'node:crypto';
import type { ClientSession } from 'mongodb';
import type { QuantizedCount } from '@bqm/types';
import { getCollections } from './client.js';

export interface ApplyStockChangeInput {
  productSlug: string;
  /**
   * Signed delta matching the product's stock shape: a base-unit number for
   * loose products, a QuantizedCount array with signed counts for quantized
   * ones (negative = sale, positive = restock). No cross-shape Σ check —
   * the shapes are the same type on both sides.
   */
  delta: number | QuantizedCount[];
  reason: string;
  orderId?: string;
}

function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

function assertValidDelta(delta: number | QuantizedCount[]): void {
  if (typeof delta === 'number') {
    if (!Number.isFinite(delta) || delta === 0) {
      throw new Error('delta must be a non-zero finite number for loose products');
    }
    return;
  }
  if (!Array.isArray(delta) || delta.length === 0) {
    throw new Error('delta must be a non-empty QuantizedCount array for quantized products');
  }
  for (const [i, q] of delta.entries()) {
    if (!Number.isInteger(q.size) || q.size <= 0 || !Number.isInteger(q.count) || q.count === 0) {
      throw new Error(`delta[${i}]: size must be a positive integer and count a non-zero integer`);
    }
  }
}

/** Audit total for a delta: flat signed base units (movement log stays a plain number). */
export function deltaBaseTotal(delta: number | QuantizedCount[]): number {
  return typeof delta === 'number' ? delta : delta.reduce((s, q) => s + q.size * q.count, 0);
}

/**
 * Single stock write. HARD RULE: every `stock` mutation goes through
 * here (or the multi-line order path below, which uses the same shape).
 * $inc on the product + exactly one StockMovement row.
 *
 * Quantized path (array delta): decrements/increments the matching `stock`
 * buckets in one update, guarded so a sale fails instead of overselling a
 * bucket. Loose path (number delta): base-qty $inc with an oversell guard.
 */
export async function applyStockChange(
  input: ApplyStockChangeInput,
  session?: ClientSession,
): Promise<void> {
  assertValidDelta(input.delta);
  const { products, stockMovements } = await getCollections();
  const now = new Date().toISOString();
  const opts = session ? { session } : {};

  if (typeof input.delta === 'number') {
    const filter: Record<string, unknown> =
      input.delta < 0 ? { slug: input.productSlug, stock: { $gte: -input.delta } } : { slug: input.productSlug };
    const res = await products.updateOne(
      filter,
      { $inc: { stock: input.delta }, $set: { updatedAt: now } },
      opts,
    );
    if (res.matchedCount === 0) {
      throw new Error(`insufficient stock for ${input.productSlug}`);
    }
  } else {
    const need = input.delta.filter((q) => q.count < 0);
    const filter: Record<string, unknown> = {
      slug: input.productSlug,
      ...(need.length > 0
        ? {
            $and: need.map((q) => ({
              stock: { $elemMatch: { size: q.size, count: { $gte: -q.count } } },
            })),
          }
        : {}),
    };
    const inc: Record<string, number> = {};
    const arrayFilters: Array<Record<string, unknown>> = [];
    input.delta.forEach((q, idx) => {
      const key = `a${idx}`;
      inc[`stock.$[${key}].count`] = q.count;
      arrayFilters.push({ [`${key}.size`]: q.size });
    });
    const res = await products.updateOne(filter, { $inc: inc, $set: { updatedAt: now } }, { ...opts, arrayFilters });
    if (res.matchedCount === 0) {
      throw new Error(`insufficient stock in packs for ${input.productSlug}`);
    }
  }
  await stockMovements.insertOne(
    {
      id: newId('mov'),
      productSlug: input.productSlug,
      reason: input.reason,
      ...(input.orderId ? { orderId: input.orderId } : {}),
      createdAt: now,
      quantity: deltaBaseTotal(input.delta),
    },
    opts,
  );
}

/** One movement row per product line — used by order deduction. */
export function buildMovementDocs(
  lines: Array<{ productSlug: string; deltaBaseQty: number }>,
  reason: string,
  orderId: string,
  now: string,
) {
  return lines.map((l) => ({
    id: newId('mov'),
    productSlug: l.productSlug,
    reason,
    orderId,
    createdAt: now,
    quantity: l.deltaBaseQty,
  }));
}
