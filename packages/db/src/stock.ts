import { randomUUID } from 'node:crypto';
import type { ClientSession } from 'mongodb';
import { getCollections } from './client.js';

export interface PackDelta {
  /** Pack size in base units. */
  size: number;
  /** Signed pack count change (negative = sale, positive = restock). */
  deltaCount: number;
}

export interface ApplyStockChangeInput {
  productSlug: string;
  /** Signed delta in base units (negative = sale, positive = restock). */
  deltaBaseQty: number;
  reason: string;
  orderId?: string;
  /**
   * Bucket changes for isQuantized products (e.g. [{size:250,deltaCount:-2}]).
   * Σ(size × deltaCount) must equal deltaBaseQty. Loose products omit this
   * and deduct base qty only. Negative bucket deltas fail when the bucket
   * lacks enough packs (insufficient-stock error, no write).
   */
  packDeltas?: PackDelta[];
}

function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

/**
 * Single stock write. HARD RULE: every `stockBaseQty` mutation goes through
 * here (or the multi-line order path below, which uses the same shape).
 * $inc on the product + exactly one StockMovement row.
 *
 * Quantized path (packDeltas set): decrements/increments the matching
 * `stockPacks` buckets in the same update as `stockBaseQty`, guarded so a
 * sale fails instead of overselling a bucket. Loose path (no packDeltas):
 * base-qty $inc only, exactly as before.
 */
export async function applyStockChange(
  input: ApplyStockChangeInput,
  session?: ClientSession,
): Promise<void> {
  if (input.packDeltas && input.packDeltas.length > 0) {
    let sum = 0;
    for (const pd of input.packDeltas) {
      if (!Number.isInteger(pd.size) || pd.size <= 0 || !Number.isInteger(pd.deltaCount) || pd.deltaCount === 0) {
        throw new Error(`packDeltas: size must be a positive integer and deltaCount a non-zero integer`);
      }
      sum += pd.size * pd.deltaCount;
    }
    if (sum !== input.deltaBaseQty) {
      throw new Error(`packDeltas sum (${sum}) must equal deltaBaseQty (${input.deltaBaseQty})`);
    }
  }
  const { products, stockMovements } = await getCollections();
  const now = new Date().toISOString();
  const opts = session ? { session } : {};

  if (input.packDeltas && input.packDeltas.length > 0) {
    const need = input.packDeltas.filter((pd) => pd.deltaCount < 0);
    const filter: Record<string, unknown> = {
      slug: input.productSlug,
      ...(need.length > 0
        ? {
            $and: need.map((pd) => ({
              stockPacks: { $elemMatch: { size: pd.size, count: { $gte: -pd.deltaCount } } },
            })),
          }
        : {}),
    };
    const inc: Record<string, number> = { stockBaseQty: input.deltaBaseQty };
    const arrayFilters: Array<Record<string, unknown>> = [];
    input.packDeltas.forEach((pd, idx) => {
      const key = `a${idx}`;
      inc[`stockPacks.$[${key}].count`] = pd.deltaCount;
      arrayFilters.push({ [`${key}.size`]: pd.size });
    });
    const res = await products.updateOne(filter, { $inc: inc, $set: { updatedAt: now } }, { ...opts, arrayFilters });
    if (res.matchedCount === 0) {
      throw new Error(`insufficient stock in packs for ${input.productSlug}`);
    }
  } else {
    await products.updateOne(
      { slug: input.productSlug },
      { $inc: { stockBaseQty: input.deltaBaseQty }, $set: { updatedAt: now } },
      opts,
    );
  }
  await stockMovements.insertOne(
    {
      id: newId('mov'),
      productSlug: input.productSlug,
      reason: input.reason,
      ...(input.orderId ? { orderId: input.orderId } : {}),
      createdAt: now,
      quantity: input.deltaBaseQty,
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
