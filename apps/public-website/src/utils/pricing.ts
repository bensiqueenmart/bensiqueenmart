import type { PublicCombo, PublicProduct } from '@bqm/types';
import type { CartItem } from '../types';

/** Round to 2 decimals — identical to the server's `r2`. */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** 240 → "₹240", 1299.5 → "₹1,299.50". */
export function formatPrice(n: number): string {
  const r = round2(n);
  const frac = r % 1 === 0 ? 0 : 2;
  return `₹${r.toLocaleString('en-IN', { minimumFractionDigits: frac, maximumFractionDigits: frac })}`;
}

/** "500g" → 500, "1kg" → 1000, "1L" → 1000. NaN when unparseable. Same as server. */
export function parsePackGrams(label: string): number {
  const m = String(label).trim().match(/^([\d.]+)\s*([a-zA-Z]*)/);
  if (!m) return NaN;
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value <= 0) return NaN;
  const unit = m[2].toLowerCase();
  if (unit.startsWith('kg') || unit === 'k') return value * 1000;
  if (unit === 'l' || unit === 'lt' || unit === 'ltr' || unit === 'litre' || unit === 'liter') {
    return value * 1000;
  }
  return value;
}

/**
 * Price of ONE pack. Mirrors apps/public-website/api/orders.ts:
 * quantized → quantityPrice tier, loose → pricePerUnit × pack size.
 * Null when the pack has no price (server rejects these at checkout).
 */
export function packPrice(p: PublicProduct, weight: string): number | null {
  if (p.isQuantized) {
    const grams = parsePackGrams(weight);
    if (!Number.isFinite(grams)) return null;
    const tier = (p.quantityPrice ?? []).find((t) => t.quantity === grams);
    return tier && tier.price > 0 ? tier.price : null;
  }
  const grams = parsePackGrams(weight);
  const rate = p.pricePerUnit ?? 0;
  if (!Number.isFinite(grams) || grams <= 0 || !(rate > 0)) return null;
  // Only configured website packs are sellable (server rejects the rest).
  const sizes = (p.websitePackSizes ?? []).map((s) => s.size);
  if (!sizes.includes(grams)) return null;
  return round2(rate * grams);
}

/** Price of ONE combo pack. Null when unpriced. */
export function comboUnitPrice(c: PublicCombo): number | null {
  return typeof c.totalPrice === 'number' && c.totalPrice > 0 ? c.totalPrice : null;
}

/**
 * Line total for a cart item (unit × quantity), server-identical:
 * loose uses r2(rate × grams × qty) so the cart subtotal matches
 * order.totalPrice exactly.
 */
export function cartLineTotal(
  item: CartItem,
  productById: Map<string, PublicProduct>,
  comboById: Map<string, PublicCombo>,
): number | null {
  const qty = item.quantity;
  if (!Number.isInteger(qty) || qty <= 0) return null;
  if (item.isCombo) {
    const c = comboById.get(item.comboId ?? item.productId);
    const unit = c ? comboUnitPrice(c) : null;
    return unit === null ? null : round2(unit * qty);
  }
  const p = productById.get(item.productId);
  if (!p) return null;
  const grams = parsePackGrams(item.weight);
  if (!Number.isFinite(grams) || grams <= 0) return null;
  if (p.isQuantized) {
    const tier = (p.quantityPrice ?? []).find((t) => t.quantity === grams);
    return tier && tier.price > 0 ? round2(tier.price * qty) : null;
  }
  // Stale/removed packs (not in websitePackSizes) price as null — the cart
  // flags them and the server rejects them at checkout.
  if (!(p.websitePackSizes ?? []).some((s) => s.size === grams)) return null;
  const rate = p.pricePerUnit ?? 0;
  if (!(rate > 0)) return null;
  return round2(rate * grams * qty);
}

/** Cart subtotal + whether any line is unpriced ("Price on request"). */
export function cartSubtotal(
  items: CartItem[],
  productById: Map<string, PublicProduct>,
  comboById: Map<string, PublicCombo>,
): { total: number; hasUnpriced: boolean } {
  let total = 0;
  let hasUnpriced = false;
  for (const item of items) {
    const line = cartLineTotal(item, productById, comboById);
    if (line === null) hasUnpriced = true;
    else total = round2(total + line);
  }
  return { total, hasUnpriced };
}
