import { X } from 'lucide-react';
import type { ComboProduct, Product, QuantizedCount } from '@bqm/types';

/**
 * Deliberate combo-component editor rows. One row = one component entry:
 * product dropdown → fixed pack size + count, or loose base-unit quantity,
 * plus a display-title override. Reference cost is computed read-only to
 * help price the combo; the combo's own totalPrice stays the single
 * authoritative price.
 */

export interface ComboRow {
  productSlug: string;
  /** Loose base-unit quantity (loose products). */
  qty: string;
  /** Fixed pack size (quantized products) — constrained to the product's tiers. */
  size: string;
  /** Fixed pack count (quantized products). */
  count: string;
  /** Display-title override; blank = product name. */
  title: string;
  tamilTitle: string;
}

export const emptyComboRow = (): ComboRow => ({
  productSlug: '', qty: '', size: '', count: '', title: '', tamilTitle: '',
});

/** Prefill rows from stored components (edit form). */
export function comboRowsFromComponents(comps: ComboProduct[]): ComboRow[] {
  return (comps ?? []).map((c) => {
    if (typeof c.quantity === 'number') {
      return {
        productSlug: c.productSlug, qty: String(c.quantity),
        size: '', count: '', title: c.name ?? '', tamilTitle: c.tamilName ?? '',
      };
    }
    const buckets = c.quantity as QuantizedCount[];
    const first = buckets[0];
    return {
      productSlug: c.productSlug, qty: '',
      size: first ? String(first.size) : '', count: first ? String(first.count) : '',
      title: c.name ?? '', tamilTitle: c.tamilName ?? '',
    };
  });
}

function refCost(product: Product, row: ComboRow): number | null {
  if (product.isQuantized) {
    const size = Number(row.size);
    const count = Number(row.count);
    if (!Number.isInteger(size) || !Number.isInteger(count)) return null;
    const tier = product.quantityPrice.find((t) => t.quantity === size);
    if (!tier) return null;
    return tier.price * count;
  }
  const qty = Number(row.qty);
  if (!Number.isFinite(qty) || product.pricePerUnit === undefined) return null;
  return product.pricePerUnit * qty;
}

/** Sum of reference costs for rows where a price is known. Null when none known. */
export function comboPartsTotal(rows: ComboRow[], products: Product[]): number | null {
  let sum = 0;
  let known = false;
  for (const row of rows) {
    const doc = products.find((p) => p.slug === row.productSlug);
    if (!doc) continue;
    const cost = refCost(doc, row);
    if (cost !== null && Number.isFinite(cost)) { sum += cost; known = true; }
  }
  return known ? sum : null;
}

export interface ComboInputComponent {
  productSlug: string;
  name?: string;
  tamilName?: string;
  quantity: number | QuantizedCount[];
}

/**
 * Validate rows and build the `products` payload for createCombo/patchCombo.
 * Throws on the first problem with a human-readable message.
 */
export function comboRowsToInput(rows: ComboRow[], products: Product[]): ComboInputComponent[] {
  if (rows.length === 0) throw new Error('Add at least one product to the combo');
  return rows.map((row, i) => {
    const label = `Item ${i + 1}`;
    if (!row.productSlug) throw new Error(`${label}: pick a product`);
    const doc = products.find((p) => p.slug === row.productSlug);
    if (!doc) throw new Error(`${label}: unknown product ${row.productSlug}`);
    const title = row.title.trim();
    const tamilTitle = row.tamilTitle.trim();
    const extra = {
      ...(title && title !== doc.name ? { name: title } : {}),
      ...(tamilTitle ? { tamilName: tamilTitle } : {}),
    };
    if (doc.isQuantized) {
      const size = Number(row.size);
      const count = Number(row.count);
      if (!Number.isInteger(size) || size <= 0) throw new Error(`${label}: pick a pack size for ${doc.name}`);
      const tiers = doc.quantityPrice.map((t) => t.quantity);
      if (tiers.length > 0 && !tiers.includes(size)) {
        throw new Error(`${label}: ${size}${doc.stockUnit} is not sold for ${doc.name} (packs: ${tiers.join(', ')})`);
      }
      if (!Number.isInteger(count) || count <= 0) throw new Error(`${label}: pack count must be a positive whole number`);
      return { productSlug: doc.slug, ...extra, quantity: [{ size, count }] };
    }
    const qty = Number(row.qty);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error(`${label}: quantity must be more than 0 ${doc.stockUnit}`);
    return { productSlug: doc.slug, ...extra, quantity: qty };
  });
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function ComboComponentsEditor({ rows, onChange, products }: {
  rows: ComboRow[];
  onChange: (r: ComboRow[]) => void;
  products: Product[];
}) {
  const set = (i: number, patch: Partial<ComboRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
  const parts = comboPartsTotal(rows, products);

  return (
    <div>
      {rows.map((row, i) => {
        const doc = products.find((p) => p.slug === row.productSlug);
        const cost = doc ? refCost(doc, row) : null;
        return (
          <div key={i} className="combo-row">
            <div className="combo-row-num">Item {i + 1}</div>
            <label className="combo-cell combo-cell-product">
              <span className="pack-cell-label">Product</span>
              <select
                className="fkit-select"
                value={row.productSlug}
                onChange={(e) => {
                  const slug = e.target.value;
                  const next = products.find((p) => p.slug === slug);
                  set(i, {
                    productSlug: slug,
                    qty: '', size: '', count: '',
                    title: next ? next.name : row.title,
                    tamilTitle: next?.tamilName ?? '',
                  });
                }}
                aria-label={`Item ${i + 1} product`}
              >
                <option value="" disabled>Choose a product…</option>
                {sorted.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} — {p.isQuantized ? 'Fixed' : 'Loose'} ({p.stockUnit})
                  </option>
                ))}
              </select>
            </label>
            {doc && !doc.isQuantized && (
              <label className="combo-cell">
                <span className="pack-cell-label">Quantity ({doc.stockUnit})</span>
                <input
                  className="fkit-input fkit-num"
                  placeholder="e.g. 200"
                  value={row.qty}
                  onChange={(e) => set(i, { qty: e.target.value })}
                  inputMode="decimal"
                  aria-label={`Item ${i + 1} quantity in ${doc.stockUnit}`}
                />
              </label>
            )}
            {doc && doc.isQuantized && (
              <>
                <label className="combo-cell">
                  <span className="pack-cell-label">Pack size ({doc.stockUnit})</span>
                  <select
                    className="fkit-select"
                    value={row.size}
                    onChange={(e) => set(i, { size: e.target.value })}
                    aria-label={`Item ${i + 1} pack size`}
                  >
                    <option value="" disabled>Pick size…</option>
                    {doc.quantityPrice.map((t) => (
                      <option key={t.quantity} value={String(t.quantity)}>
                        {t.quantity}{doc.stockUnit} — {inr(t.price)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="combo-cell">
                  <span className="pack-cell-label">Packs</span>
                  <input
                    className="fkit-input fkit-num"
                    placeholder="e.g. 2"
                    value={row.count}
                    onChange={(e) => set(i, { count: e.target.value })}
                    inputMode="numeric"
                    aria-label={`Item ${i + 1} pack count`}
                  />
                </label>
              </>
            )}
            <label className="combo-cell combo-cell-title">
              <span className="pack-cell-label">Display title</span>
              <input
                className="fkit-input"
                placeholder={doc?.name ?? 'Product name on website'}
                value={row.title}
                onChange={(e) => set(i, { title: e.target.value })}
                aria-label={`Item ${i + 1} display title`}
              />
            </label>
            {cost !== null && (
              <div className="combo-cost">Reference cost&nbsp;<strong>{inr(cost)}</strong></div>
            )}
            <button
              type="button"
              className="pack-del combo-del"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              aria-label={`Remove item ${i + 1}`}
              title={`Remove item ${i + 1}`}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
      <button type="button" className="pack-add" onClick={() => onChange([...rows, emptyComboRow()])}>
        + Add product
      </button>
      {parts !== null && (
        <div className="fkit-hint">Sum of parts ≈ <strong>{inr(parts)}</strong> — price the combo below this to show a saving.</div>
      )}
      {products.length === 0 && (
        <div className="fkit-hint">No products loaded — create products before building combos.</div>
      )}
    </div>
  );
}
