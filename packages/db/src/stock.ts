import { randomUUID } from 'node:crypto';
import type { QuantizedCount } from '@bqm/types';

function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

/** Audit total for a delta: flat signed base units (movement log stays a plain number). */
export function deltaBaseTotal(delta: number | QuantizedCount[]): number {
  return typeof delta === 'number' ? delta : delta.reduce((s, q) => s + q.size * q.count, 0);
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
