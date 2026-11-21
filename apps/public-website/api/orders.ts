import { createOrder, listCatalog } from '@bqm/db';
import type { OrderItemInput } from '@bqm/types';

/**
 * POST /api/orders — public website checkout.
 * Creates an `online`, `unconfirmed` order (no stock moves; the owner
 * confirms in admin-console). Prices are computed server-side from the
 * current catalog so the stored total is a real indicative amount —
 * the website UI never renders prices.
 *
 * Body: { customer: { name, mobile, address, instructions? },
 *         lines: [{ productId?, comboId?, weight?, quantity }] }
 * `productId`/`comboId` are the public catalog ids; `weight` is the
 * pack label (e.g. "500g") — resolved against quantityPrice tiers
 * (quantized) or websitePackSizes (loose).
 */

interface LineIn {
  productId?: string;
  comboId?: string;
  weight?: string;
  quantity?: unknown;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** "500g" → 500, "1kg" → 1000 (base units). NaN when unparseable. */
function parsePackGrams(label: string): number {
  const m = String(label).trim().match(/^([\d.]+)\s*([a-zA-Z]*)/);
  if (!m) return NaN;
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value <= 0) return NaN;
  const unit = m[2].toLowerCase();
  if (unit.startsWith('kg') || (unit === 'k' )) return value * 1000;
  if (unit === 'l' || unit === 'lt' || unit === 'ltr' || unit === 'litre' || unit === 'liter') {
    return value * 1000;
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const { customer, lines } = (req.body ?? {}) as {
      customer?: { name?: unknown; mobile?: unknown; address?: unknown; instructions?: unknown };
      lines?: LineIn[];
    };

    const name = String(customer?.name ?? '').trim();
    const mobileDigits = String(customer?.mobile ?? '').replace(/\D/g, '');
    const address = String(customer?.address ?? '').trim();
    const instructions = String(customer?.instructions ?? '').trim();

    if (!name) throw new Error('customer name is required');
    if (mobileDigits.length < 10) throw new Error('a valid 10-digit contact number is required');
    if (!address) throw new Error('delivery address is required');
    if (!Array.isArray(lines) || lines.length === 0) throw new Error('order must contain at least one item');
    if (lines.length > 50) throw new Error('order must contain at most 50 lines');

    const { products, combos } = await listCatalog();
    const productById = new Map(products.map((p) => [p.id, p]));
    const comboById = new Map(combos.map((c) => [c.id, c]));

    const orderItems: OrderItemInput[] = lines.map((l, i) => {
      const qty = Number(l?.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 999) {
        throw new Error(`lines[${i}]: quantity must be an integer 1–999`);
      }
      if (l?.comboId) {
        const combo = comboById.get(String(l.comboId));
        if (!combo || !combo.isActive) throw new Error(`lines[${i}]: combo is no longer available`);
        return { comboSlug: combo.slug, quantity: qty, price: r2(combo.totalPrice * qty) };
      }
      const product = productById.get(String(l?.productId ?? ''));
      if (!product) throw new Error(`lines[${i}]: product is no longer available`);
      if (product.isQuantized) {
        const grams = parsePackGrams(String(l?.weight ?? ''));
        if (!Number.isFinite(grams) || grams <= 0) {
          throw new Error(`lines[${i}]: invalid pack size for ${product.name}`);
        }
        const tier = (product.quantityPrice ?? []).find((t) => t.quantity === grams);
        if (!tier) throw new Error(`lines[${i}]: ${l?.weight} is not available for ${product.name}`);
        return {
          productSlug: product.slug,
          quantity: [{ size: grams, count: qty }],
          price: r2(tier.price * qty),
        };
      }
      // Loose product: only configured website packs, priced by pricePerUnit.
      // Single-pack fulfillability only (stock >= size); multi-pack totals
      // are confirmed by the owner, same as quantized tiers.
      const grams = parsePackGrams(String(l?.weight ?? ''));
      const sizes = product.websitePackSizes ?? [];
      if (!Number.isFinite(grams) || grams <= 0 || !sizes.includes(grams)) {
        throw new Error(`lines[${i}]: ${l?.weight} is not available for ${product.name}`);
      }
      const unitRate = product.pricePerUnit ?? 0;
      if (!(unitRate > 0)) throw new Error(`lines[${i}]: ${product.name} is not available right now`);
      if (typeof product.stock !== 'number' || product.stock < grams) {
        throw new Error(`lines[${i}]: ${l?.weight} is not available for ${product.name}`);
      }
      const baseUnits = grams * qty;
      return { productSlug: product.slug, quantity: baseUnits, price: r2(unitRate * baseUnits) };
    });

    const order = await createOrder(
      {
        orderItems,
        customerData: {
          customerName: name.slice(0, 120),
          mobile: mobileDigits.slice(0, 15),
          fullAddress: address.slice(0, 500),
          ...(instructions ? { instructions: instructions.slice(0, 500) } : {}),
        },
        source: 'online',
      },
    );
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'internal error' });
  }
}
