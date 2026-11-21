import { useState } from 'react';
import type { Combo, Product } from '@bqm/types';
import { adjustStock, deleteProduct, patchCombo, patchProduct } from '../api';
import ImageEditor from './ImageEditor';
import { TypeSlider, UnitSelect, CategorySelect, PackRows, parsePacks, normUnit, normCategory, type PackRow } from './productFields';

const input: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, width: '100%', boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
      <div style={{ color: '#666', marginBottom: 2 }}>{label}</div>
      {children}
    </label>
  );
}

function ProductForm({ p, units, categories, onSaved, onDeleted, onError }: { p: Product; units: string[]; categories: string[]; onSaved: (u: Product) => void; onDeleted: () => void; onError: (m: string) => void }) {
  const loose = !p.isQuantized;
  const [name, setName] = useState(p.name);
  const [tamilName, setTamilName] = useState(p.tamilName ?? '');
  const [image, setImage] = useState(p.image ?? '');
  const [description, setDescription] = useState(p.description);
  const [category, setCategory] = useState(p.category);
  const [stockUnit, setStockUnit] = useState(p.stockUnit);
  const [pricePerUnit, setPricePerUnit] = useState(p.pricePerUnit !== undefined ? String(p.pricePerUnit) : '');
  const [rows, setRows] = useState<PackRow[]>(() => {
    const stockBySize = new Map((Array.isArray(p.stock) ? p.stock : []).map((q) => [q.size, q.count]));
    return p.quantityPrice.map((t) => ({
      size: String(t.quantity),
      price: String(t.price),
      count: String(stockBySize.get(t.quantity) ?? 0),
    }));
  });
  const [busy, setBusy] = useState(false);

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

  return (
    <div>
      <p style={{ fontSize: 12, color: '#666', marginTop: 0 }}>
        Stock {Array.isArray(p.stock) ? p.stock.map((q) => `${q.size}×${q.count}`).join(' + ') : `${p.stock}${p.stockUnit}`} · {p.isQuantized ? 'fixed' : 'loose'} (pack counts save via an audited stock adjustment)
      </p>
      <Field label="Name"><input style={input} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Tamil name"><input style={input} value={tamilName} onChange={(e) => setTamilName(e.target.value)} /></Field>
      <Field label="Image"><ImageEditor value={image} onChange={setImage} kind="products" onError={onError} /></Field>
      <Field label="Description"><input style={input} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="Category"><CategorySelect value={category} onChange={setCategory} categories={categories} /></Field>
      <Field label="Type"><TypeSlider loose={loose} disabled /></Field>
      {loose ? (
        <Field label="Price per unit (₹ + unit)">
          <div style={{ display: 'flex', gap: 6 }}>
            <input style={{ ...input, flex: 1, minWidth: 0 }} value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} placeholder="e.g. 0.13" />
            <UnitSelect value={stockUnit} onChange={setStockUnit} units={units} />
          </div>
        </Field>
      ) : (
        <>
          <Field label="Base unit"><UnitSelect value={stockUnit} onChange={setStockUnit} units={units} /></Field>
          <Field label="Fixed packs (pack size · price · stock on hand)"><PackRows rows={rows} onChange={setRows} unit={stockUnit} countEditable /></Field>
        </>
      )}
      <button style={btn} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save product'}</button>
      <button
        style={{ ...btn, marginLeft: 8, color: '#c62828', borderColor: '#c62828' }}
        disabled={busy}
        onClick={async () => {
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
        }}
      >
        Delete product
      </button>
    </div>
  );
}

function ComboForm({ c, onSaved, onError }: { c: Combo; onSaved: (u: Combo) => void; onError: (m: string) => void }) {
  const [name, setName] = useState(c.name);
  const [tamilName, setTamilName] = useState(c.tamilName ?? '');
  const [image, setImage] = useState(c.image ?? '');
  const [description, setDescription] = useState(c.description);
  const [totalPrice, setTotalPrice] = useState(String(c.totalPrice));
  const [isActive, setIsActive] = useState(c.isActive);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      onSaved(await patchCombo(c.slug, {
        name, ...(tamilName ? { tamilName } : {}), ...(image ? { image } : {}), description,
        totalPrice: Number(totalPrice), isActive,
      }));
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Field label="Name"><input style={input} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Tamil name"><input style={input} value={tamilName} onChange={(e) => setTamilName(e.target.value)} /></Field>
      <Field label="Image"><ImageEditor value={image} onChange={setImage} kind="combos" onError={onError} /></Field>
      <Field label="Description"><input style={input} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="Total price (₹)"><input style={input} value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} /></Field>
      <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
      </label>
      <button style={btn} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save combo'}</button>
    </div>
  );
}

export default function EditPopup({ product, combo, units, categories, onClose, onSavedProduct, onSavedCombo, onDeletedProduct, onError }: {
  product?: Product;
  combo?: Combo;
  units: string[];
  categories: string[];
  onClose: () => void;
  onSavedProduct: (u: Product) => void;
  onSavedCombo: (u: Combo) => void;
  onDeletedProduct: (slug: string) => void;
  onError: (m: string) => void;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, width: 440, maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <strong>{product ? product.slug : combo?.slug}</strong>
          <button style={{ ...btn, marginLeft: 'auto' }} onClick={onClose}>Close</button>
        </div>
        {product && <ProductForm p={product} units={units} categories={categories} onSaved={(u) => { onSavedProduct(u); onClose(); }} onDeleted={() => { onDeletedProduct(product.slug); onClose(); }} onError={onError} />}
        {combo && <ComboForm c={combo} onSaved={(u) => { onSavedCombo(u); onClose(); }} onError={onError} />}
      </div>
    </div>
  );
}
