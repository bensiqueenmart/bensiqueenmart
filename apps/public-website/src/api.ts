import type { PublicCatalog } from '@bqm/types';
import { STORE_CONFIG } from './config/storeConfig';

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
 * Pack-size options for the weight dropdown. Quantized products offer
 * exactly their tier sizes; loose products offer the standard weights.
 * Labels only — prices are confirmed on WhatsApp, never shown here.
 */
export const packOptions = (p: {
  isQuantized: boolean;
  quantityPrice: Array<{ quantity: number }>;
  stockUnit: string;
}): string[] =>
  p.isQuantized && p.quantityPrice.length > 0
    ? p.quantityPrice.map((t) => `${t.quantity}${p.stockUnit}`)
    : [...STORE_CONFIG.weightOptions];
