import type { Combo, Product, PublicCatalog, PublicCombo, PublicComboItem, PublicProduct, QuantizedCount } from '@bqm/types';

/**
 * Public-catalog redaction — the single choke point between the raw DB
 * catalog and the unauthenticated website API.
 *
 * Raw stock quantities (loose base-unit numbers, QuantizedCount buckets)
 * NEVER leave the server: each product/combo carries only `available`.
 * Prices pass through untouched for the future "show prices" switch — the
 * website UI is forbidden from rendering them today.
 */

function productAvailable(p: Product): boolean {
  if (Array.isArray(p.stock)) return p.stock.some((b) => b.count > 0);
  return typeof p.stock === 'number' && p.stock > 0;
}

/** One combo unit is fulfillable only when every component's required quantity is on hand. */
function comboFulfillable(c: Combo, byId: Map<string, Product>): boolean {
  for (const comp of c.products ?? []) {
    const doc = byId.get(comp.productId);
    if (!doc) return false;
    if (typeof comp.quantity === 'number') {
      if (typeof doc.stock !== 'number' || doc.stock < comp.quantity) return false;
    } else {
      if (!Array.isArray(doc.stock)) return false;
      for (const need of comp.quantity as QuantizedCount[]) {
        const bucket = (doc.stock as QuantizedCount[]).find((b) => b.size === need.size);
        if (!bucket || bucket.count < need.count) return false;
      }
    }
  }
  return true;
}

/** Preformatted pack string for a combo content line, e.g. "500g" or "2 × 500g". */
function displayQty(quantity: number | QuantizedCount[], unit: string): string {
  if (typeof quantity === 'number') return `${quantity}${unit}`;
  return (quantity as QuantizedCount[]).map((q) => `${q.count} × ${q.size}${unit}`).join(' + ');
}

function toPublicProduct(p: Product): PublicProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    ...(p.tamilName ? { tamilName: p.tamilName } : {}),
    ...(p.image ? { image: p.image } : {}),
    description: p.description,
    category: p.category,
    isQuantized: p.isQuantized,
    stockUnit: p.stockUnit,
    available: productAvailable(p),
    ...(p.pricePerUnit !== undefined ? { pricePerUnit: p.pricePerUnit } : {}),
    quantityPrice: p.quantityPrice ?? [],
  };
}

function toPublicCombo(c: Combo, byId: Map<string, Product>): PublicCombo {
  const contents: PublicComboItem[] = (c.products ?? []).map((comp) => {
    const doc = byId.get(comp.productId);
    const unit = doc?.stockUnit ?? '';
    return {
      name: comp.name,
      ...(comp.tamilName ? { tamilName: comp.tamilName } : {}),
      qty: displayQty(comp.quantity, unit),
    };
  });
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    ...(c.tamilName ? { tamilName: c.tamilName } : {}),
    ...(c.image ? { image: c.image } : {}),
    description: c.description,
    isActive: c.isActive,
    available: c.isActive && comboFulfillable(c, byId),
    contents,
    totalPrice: c.totalPrice,
  };
}

export function toPublicCatalog(products: Product[], combos: Combo[]): PublicCatalog {
  const byId = new Map(products.map((p) => [p.id, p]));
  return {
    products: products.map(toPublicProduct),
    combos: combos.map((c) => toPublicCombo(c, byId)),
  };
}
