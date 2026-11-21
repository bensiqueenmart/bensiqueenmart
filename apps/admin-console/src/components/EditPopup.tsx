import { useRef, useState } from 'react';
import { Package } from 'lucide-react';
import type { Combo, Product } from '@bqm/types';
import { adjustStock, deleteCombo, deleteProduct, patchCombo, patchProduct } from '../api';
import ImageEditor from './ImageEditor';
import { ContextStrip, Field, GhostButton, PopupShell, PrimaryButton, Section } from './formKit';
import { TypeSlider, UnitSelect, CategorySelect, PackRows, parsePacks, SizePills, normUnit, normCategory, type PackRow } from './productFields';
import { ComboComponentsEditor, comboPartsTotal, comboRowsFromComponents, comboRowsToInput, type ComboRow } from './comboFields';

const fmt = (n: number) => n.toLocaleString('en-IN');

function fmtStock(p: Product): string {
  if (Array.isArray(p.stock)) {
    return p.stock.length > 0
      ? p.stock.map((q) => `${fmt(q.size)} × ${fmt(q.count)}`).join(' + ') + ` ${p.stockUnit}`
      : `0 ${p.stockUnit}`;
  }
  return `${fmt(p.stock)} ${p.stockUnit}`;
}

function ProductForm({ p, units, categories, onSaved, onDeleted, onClose, onError }: {
  p: Product;
  units: string[];
  categories: string[];
  onSaved: (u: Product) => void;
  onDeleted: () => void;
  onClose: () => void;
  onError: (m: string) => void;
}) {
  const loose = !p.isQuantized;
  const [name, setName] = useState(p.name);
  const [tamilName, setTamilName] = useState(p.tamilName ?? '');
  const [image, setImage] = useState(p.image ?? '');
  const [description, setDescription] = useState(p.description);
  const [category, setCategory] = useState(p.category);
  const [stockUnit, setStockUnit] = useState(p.stockUnit);
  const [pricePerUnit, setPricePerUnit] = useState(p.pricePerUnit !== undefined ? String(p.pricePerUnit) : '');
  const [websiteSizes, setWebsiteSizes] = useState<number[]>(() => [...(p.websitePackSizes ?? [])].sort((a, b) => a - b));
  const [rows, setRows] = useState<PackRow[]>(() => {
    const stockBySize = new Map((Array.isArray(p.stock) ? p.stock : []).map((q) => [q.size, q.count]));
    return p.quantityPrice.map((t) => ({
      size: String(t.quantity),
      price: String(t.price),
      count: String(stockBySize.get(t.quantity) ?? 0),
    }));
  });
  const [busy, setBusy] = useState(false);

  // Snapshot for the discard-guard: dirty when anything differs.
  const initial = useRef(JSON.stringify({
    name: p.name, tamilName: p.tamilName ?? '', image: p.image ?? '', description: p.description,
    category: p.category, stockUnit: p.stockUnit, pricePerUnit: p.pricePerUnit !== undefined ? String(p.pricePerUnit) : '',
    websiteSizes: [...(p.websitePackSizes ?? [])].sort((a, b) => a - b),
    rows: p.quantityPrice.map((t) => {
      const b = (Array.isArray(p.stock) ? p.stock : []).find((q) => q.size === t.quantity);
      return { size: String(t.quantity), price: String(t.price), count: String(b?.count ?? 0) };
    }),
  }));
  const dirty = JSON.stringify({
    name, tamilName, image, description, category, stockUnit, pricePerUnit,
    websiteSizes: [...websiteSizes].sort((a, b) => a - b), rows,
  }) !== initial.current;

  const save = async () => {
    const unit = normUnit(stockUnit, units);
    if (!unit) { onError('Stock unit is required'); return; }
    const cat = normCategory(category, categories);
    if (!cat) { onError('Category is required'); return; }
    const patch: Record<string, unknown> = {
      name,
      ...(tamilName ? { tamilName } : {}),
      ...(image ? { image } : {}),
      description, category: cat, stockUnit: unit,
    };
    let delta: Array<{ size: number; count: number }> = [];
    if (loose) {
      if (pricePerUnit !== '') {
        const price = Number(pricePerUnit);
        if (!Number.isFinite(price) || price < 0) { onError('Price must be a non-negative number (₹)'); return; }
        patch.pricePerUnit = price;
      }
      patch.websitePackSizes = [...websiteSizes].sort((a, b) => a - b);
    } else {
      let stock: Array<{ size: number; count: number }>;
      try {
        const packs = parsePacks(rows);
        patch.quantityPrice = packs.quantityPrice;
        stock = packs.stock;
      } catch (e) {
        onError(String(e));
        return;
      }
      // Counts typed here are absolute; convert to a delta against current
      // stock so the move goes through the audited adjust path (PATCH
      // rejects stock outright).
      const oldBySize = new Map((Array.isArray(p.stock) ? p.stock : []).map((q) => [q.size, q.count]));
      delta = stock
        .map((s) => ({ size: s.size, count: s.count - (oldBySize.get(s.size) ?? 0) }))
        .filter((d) => d.count !== 0);
    }
    setBusy(true);
    try {
      let saved = await patchProduct(p.slug, patch);
      if (delta.length > 0) saved = await adjustStock(p.slug, delta, 'adjust');
      onSaved(saved);
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${p.slug}? Order history is kept; combos using it will block this.`)) return;
    setBusy(true);
    try {
      await deleteProduct(p.slug);
      onDeleted();
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PopupShell
      eyebrow="Edit product"
      title={name.trim() || p.name}
      sub={p.slug}
      badge={<span className={`bqm-type-chip ${loose ? 'loose' : 'fixed'}`}>{loose ? 'Loose' : 'Fixed'}</span>}
      dirty={dirty}
      onClose={onClose}
      footer={(close) => (
        <>
          <GhostButton disabled={busy} onClick={close}>Cancel</GhostButton>
          <PrimaryButton busy={busy} busyLabel="Saving…" onClick={save}>Save product</PrimaryButton>
        </>
      )}
    >
      <Section title="Details">
        <Field label="Name" required>
          <input className="fkit-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Product name" />
        </Field>
        <Field label="Tamil name" hint="Shown next to the English name on the website.">
          <input className="fkit-input" value={tamilName} onChange={(e) => setTamilName(e.target.value)} lang="ta" aria-label="Tamil name" />
        </Field>
        <Field label="Category" required>
          <CategorySelect value={category} onChange={setCategory} categories={categories} />
        </Field>
      </Section>

      <Section title="How it's sold">
        <Field
          label="Selling type"
          hint={loose
            ? 'Loose goods are weighed out per order. Locked after creation — delete and recreate to change it.'
            : 'Fixed goods sell in pre-set packs. Locked after creation — delete and recreate to change it.'}
        >
          <TypeSlider loose={loose} disabled />
        </Field>
        <ContextStrip>
          <Package size={16} aria-hidden="true" />
          <span>On hand&nbsp;<strong>{fmtStock(p)}</strong></span>
        </ContextStrip>
        {loose ? (
          <>
            <Field label="Price per unit (₹)" hint={`Cost of one ${stockUnit || 'unit'} of stock.`}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="fkit-input fkit-num"
                  style={{ flex: 1, minWidth: 0 }}
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  placeholder="e.g. 0.13"
                  inputMode="decimal"
                  aria-label="Price per unit in rupees"
                />
                <UnitSelect value={stockUnit} onChange={setStockUnit} units={units} />
              </div>
            </Field>
            <Field label={`Website pack sizes (${stockUnit || 'units'})`} hint="Only these packs can be ordered online. Empty hides the product from the website.">
              <SizePills sizes={websiteSizes} onChange={setWebsiteSizes} unit={stockUnit} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Base unit">
              <UnitSelect value={stockUnit} onChange={setStockUnit} units={units} />
            </Field>
            <Field label="Fixed packs" hint="Counts are absolute — saving adjusts stock through an audited entry.">
              <PackRows rows={rows} onChange={setRows} unit={stockUnit} countEditable />
            </Field>
          </>
        )}
      </Section>

      <Section title="Presentation">
        <Field label="Image">
          <ImageEditor value={image} onChange={setImage} kind="products" onError={onError} />
        </Field>
        <Field label="Description">
          <textarea className="fkit-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" />
        </Field>
      </Section>

      <Section title="Danger zone">
        <div className="fkit-danger-zone">
          <button type="button" className="fkit-btn-danger" disabled={busy} onClick={remove}>
            Delete product
          </button>
          <div className="fkit-hint">Order history is kept. Combos using this product will block deletion.</div>
        </div>
      </Section>
    </PopupShell>
  );
}

function ComboForm({ c, products, onSaved, onDeleted, onClose, onError }: { c: Combo; products: Product[]; onSaved: (u: Combo) => void; onDeleted: () => void; onClose: () => void; onError: (m: string) => void }) {
  const [name, setName] = useState(c.name);
  const [tamilName, setTamilName] = useState(c.tamilName ?? '');
  const [image, setImage] = useState(c.image ?? '');
  const [description, setDescription] = useState(c.description);
  const [totalPrice, setTotalPrice] = useState(String(c.totalPrice));
  const [isActive, setIsActive] = useState(c.isActive);
  const [rows, setRows] = useState<ComboRow[]>(() => comboRowsFromComponents(c.products ?? []));
  const [busy, setBusy] = useState(false);

  const initial = useRef(JSON.stringify({
    name: c.name, tamilName: c.tamilName ?? '', image: c.image ?? '',
    description: c.description, totalPrice: String(c.totalPrice), isActive: c.isActive,
    rows: comboRowsFromComponents(c.products ?? []),
  }));
  const dirty = JSON.stringify({ name, tamilName, image, description, totalPrice, isActive, rows }) !== initial.current;
  const parts = comboPartsTotal(rows, products);

  const save = async () => {
    let components;
    try {
      components = comboRowsToInput(rows, products);
    } catch (e) {
      onError(String(e));
      return;
    }
    const price = Number(totalPrice);
    if (!Number.isFinite(price) || price < 0) { onError('Total price must be a non-negative number (₹)'); return; }
    setBusy(true);
    try {
      onSaved(await patchCombo(c.slug, {
        name, ...(tamilName ? { tamilName } : {}), ...(image ? { image } : {}), description,
        totalPrice: price, isActive, products: components,
      }));
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${c.slug}? Order history is kept.`)) return;
    setBusy(true);
    try {
      await deleteCombo(c.slug);
      onDeleted();
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PopupShell
      eyebrow="Edit combo"
      title={name.trim() || c.name}
      sub={c.slug}
      badge={<span className={`bqm-type-chip ${isActive ? 'active' : 'inactive'}`}>{isActive ? 'Active' : 'Inactive'}</span>}
      dirty={dirty}
      onClose={onClose}
      footer={(close) => (
        <>
          <GhostButton disabled={busy} onClick={close}>Cancel</GhostButton>
          <PrimaryButton busy={busy} busyLabel="Saving…" onClick={save}>Save combo</PrimaryButton>
        </>
      )}
    >
      <Section title="Details">
        <Field label="Name" required>
          <input className="fkit-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Combo name" />
        </Field>
        <Field label="Tamil name">
          <input className="fkit-input" value={tamilName} onChange={(e) => setTamilName(e.target.value)} lang="ta" aria-label="Tamil name" />
        </Field>
      </Section>

      <Section title="Pricing & status">
        <Field
          label="Total price (₹)"
          required
          hint={parts !== null ? `Sum of parts ≈ ₹${parts.toLocaleString('en-IN', { maximumFractionDigits: 2 })} — price below this to show a saving.` : undefined}
        >
          <input
            className="fkit-input fkit-num"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            inputMode="decimal"
            aria-label="Total price in rupees"
          />
        </Field>
        <label className="fkit-check">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active — available for sale
        </label>
      </Section>

      <Section title="Contents">
        <Field
          label="What's inside"
          required
          hint="One unit of this combo deducts each line below. Past orders keep their original contents."
        >
          <ComboComponentsEditor rows={rows} onChange={setRows} products={products} />
        </Field>
      </Section>

      <Section title="Presentation">
        <Field label="Image">
          <ImageEditor value={image} onChange={setImage} kind="combos" onError={onError} />
        </Field>
        <Field label="Description">
          <textarea className="fkit-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" />
        </Field>
      </Section>

      <Section title="Danger zone">
        <div className="fkit-danger-zone">
          <button type="button" className="fkit-btn-danger" disabled={busy} onClick={remove}>
            Delete combo
          </button>
          <div className="fkit-hint">Order history is kept. Unconfirmed orders still holding this combo will fail at confirm time.</div>
        </div>
      </Section>
    </PopupShell>
  );
}

export default function EditPopup({ product, combo, products, units, categories, onClose, onSavedProduct, onSavedCombo, onDeletedProduct, onDeletedCombo, onError }: {
  product?: Product;
  combo?: Combo;
  products: Product[];
  units: string[];
  categories: string[];
  onClose: () => void;
  onSavedProduct: (u: Product) => void;
  onSavedCombo: (u: Combo) => void;
  onDeletedProduct: (slug: string) => void;
  onDeletedCombo: (slug: string) => void;
  onError: (m: string) => void;
}) {
  if (product) {
    return (
      <ProductForm
        p={product}
        units={units}
        categories={categories}
        onSaved={(u) => { onSavedProduct(u); onClose(); }}
        onDeleted={() => { onDeletedProduct(product.slug); onClose(); }}
        onClose={onClose}
        onError={onError}
      />
    );
  }
  if (combo) {
    return (
      <ComboForm
        c={combo}
        products={products}
        onSaved={(u) => { onSavedCombo(u); onClose(); }}
        onDeleted={() => { onDeletedCombo(combo.slug); onClose(); }}
        onClose={onClose}
        onError={onError}
      />
    );
  }
  return null;
}
