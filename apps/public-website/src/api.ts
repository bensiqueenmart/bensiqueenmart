import type { Order, PublicCatalog } from '@bqm/types';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? `HTTP ${res.status}`);
  return body as T;
}

/** Whole storefront catalog: redacted products + combos (availability booleans only — no stock quantities). */
export const getCatalog = () => request<PublicCatalog>('/api/products');

/**
 * Resolve a catalog image path to a renderable src. DB images are absolute
 * Cloudinary URLs and pass through; legacy `/images/…` paths resolve
 * against `VITE_IMAGE_BASE` (empty = same-origin `public/`).
 */
const IMAGE_BASE = (import.meta.env.VITE_IMAGE_BASE as string | undefined) ?? '';
export const imageSrc = (path?: string): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${IMAGE_BASE}${path}`;
};

/** Website checkout: create an `online` order. Prices are computed server-side. */
export interface OnlineOrderLine {
  productId?: string;
  comboId?: string;
  weight?: string;
  quantity: number;
}

export interface OnlineOrderCustomer {
  name: string;
  mobile: string;
  address: string;
  instructions?: string;
}

export async function createOnlineOrder(
  customer: OnlineOrderCustomer,
  lines: OnlineOrderLine[],
): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer, lines }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? `HTTP ${res.status}`);
  return body as Order;
}

/** "nuts-dryfruits" → "Nuts Dryfruits". Fallback label for categories without static meta. */
export const prettyCategory = (slug: string): string =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

/** "combo-1" → "Combo 1". */
export const comboLabel = (slug: string): string => {
  const m = slug.match(/(\d+)\s*$/);
  return m ? `Combo ${m[1]}` : prettyCategory(slug);
};

/**
 * One selectable pack in a weight dropdown. `value` is the cart/API pack
 * label (e.g. "500g"); `available` is the per-pack stock signal.
 */
export interface PackOption {
  value: string;
  label: string;
  available: boolean;
}

/**
 * Pack-size options for the weight dropdown. Quantized products offer
 * exactly their tier sizes; loose products offer only their configured
 * website packs (empty = hidden from the storefront).
 * Labels only — prices are confirmed on WhatsApp, never shown here.
 */
export const packOptions = (p: {
  isQuantized: boolean;
  quantityPrice: Array<{ quantity: number }>;
  stockUnit: string;
  websitePackSizes?: Array<{ size: number; available: boolean }>;
}): PackOption[] => {
  if (p.isQuantized) {
    return (p.quantityPrice ?? []).map((t) => ({
      value: `${t.quantity}${p.stockUnit}`,
      label: `${t.quantity}${p.stockUnit}`,
      available: true,
    }));
  }
  return (p.websitePackSizes ?? []).map((s) => ({
    value: `${s.size}${p.stockUnit}`,
    label: `${s.size}${p.stockUnit}`,
    available: s.available,
  }));
};
