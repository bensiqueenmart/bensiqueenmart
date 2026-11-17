import { useState } from 'react';
import type { Combo, Product } from '@bqm/types';
import { createCombo, createProduct } from '../api';
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

const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function ProductCreateForm({ categories, units, onCreated, onError }: {
  categories: string[];
  units: string[];
  onCreated: (p: Product) => void;
  onError: (m: string) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [tamilName, setTamilName] = useState('');
  const [category, setCategory] = useState(categories[0] ?? '');
  const [isQuantized, setIsQuantized] = useState(false);
  const [stockUnit, setStockUnit] = useState('g');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [rows, setRows] = useState<PackRow[]>([]);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) { onError('Name is required'); return; }
    const finalSlug = slugify(slug || name);
    if (!finalSlug) { onError('Slug is required'); return; }
    const cat = normCategory(category, categories);
    if (!cat) { onError('Category is required'); return; }
    const unit = normUnit(stockUnit, units);
    if (!unit) { onError('Stock unit is required'); return; }
    let quantityPrice: Array<{ quantity: number; price: number }> = [];
    let openingStock: Array<{ size: number; count: number }> = [];
    let price: number | undefined;
    if (isQuantized) {
      try {
        const parsed = parsePacks(rows);
        quantityPrice = parsed.quantityPrice;
        openingStock = parsed.stock;
      } catch (e) {
        onError(String(e));
        return;
      }
    } else if (pricePerUnit !== '') {
      price = Number(pricePerUnit);
      if (!Number.isFinite(price) || price < 0) { onError('Price must be a non-negative number (₹)'); return; }
    }
    setBusy(true);
    try {
      onCreated(await createProduct({
        slug: finalSlug,
        name: name.trim(),
        ...(tamilName.trim() ? { tamilName: tamilName.trim() } : {}),
        ...(image.trim() ? { image: image.trim() } : {}),
        description: description.trim(),
        category: cat,
        isQuantized,
        stockUnit: unit,
        stock: isQuantized ? openingStock : 0,
        ...(price !== undefined ? { pricePerUnit: price } : {}),
        ...(isQuantized && quantityPrice.length > 0 ? { quantityPrice } : {}),
      }));
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 12, color: '#666', marginTop: 0 }}>Starts with zero stock — add it via Add stock after creating.</p>
      <Field label="Name *"><input style={input} value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} /></Field>
      <Field label="Slug *"><input style={input} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder="auto from name" /></Field>
      <Field label="Tamil name"><input style={input} value={tamilName} onChange={(e) => setTamilName(e.target.value)} /></Field>
      <Field label="Category *"><CategorySelect value={category} onChange={setCategory} categories={categories} /></Field>
      <Field label="Type"><TypeSlider loose={!isQuantized} onPick={(loose) => setIsQuantized(!loose)} /></Field>
      {!isQuantized ? (
        <Field label="Price per unit (₹ + unit)">
          <div style={{ display: 'flex', gap: 6 }}>
            <input style={{ ...input, flex: 1, minWidth: 0 }} value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} placeholder="e.g. 0.13" />
            <UnitSelect value={stockUnit} onChange={setStockUnit} units={units} />
          </div>
        </Field>
      ) : (
        <>
          <Field label="Base unit"><UnitSelect value={stockUnit} onChange={setStockUnit} units={units} /></Field>
          <Field label="Fixed packs (pack size · price · opening stock)"><PackRows rows={rows} onChange={setRows} unit={stockUnit} countEditable /></Field>
        </>
      )}
      <Field label="Image"><ImageEditor value={image} onChange={setImage} kind="products" onError={onError} /></Field>
      <Field label="Description"><input style={input} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <button style={btn} disabled={busy || !name.trim()} onClick={save}>{busy ? 'Creating…' : 'Create product'}</button>
    </div>
  );
}

function ComboCreateForm({ onCreated, onError }: {
  onCreated: (c: Combo) => void;
  onError: (m: string) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [tamilName, setTamilName] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [comps, setComps] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) { onError('Name is required'); return; }
    const finalSlug = slugify(slug || name);
    if (!finalSlug) { onError('Slug is required'); return; }
    let products: unknown;
    try {
      products = JSON.parse(comps || '[]');
    } catch {
      onError('Components is not valid JSON');
      return;
    }
    setBusy(true);
    try {
      onCreated(await createCombo({
        slug: finalSlug,
        name: name.trim(),
        ...(tamilName.trim() ? { tamilName: tamilName.trim() } : {}),
        ...(image.trim() ? { image: image.trim() } : {}),
        description: description.trim(),
        totalPrice: Number(totalPrice),
        isActive,
        products,
      }));
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Field label="Name *"><input style={input} value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} /></Field>
      <Field label="Slug *"><input style={input} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder="auto from name" /></Field>
      <Field label="Tamil name"><input style={input} value={tamilName} onChange={(e) => setTamilName(e.target.value)} /></Field>
      <Field label="Image"><ImageEditor value={image} onChange={setImage} kind="combos" onError={onError} /></Field>
      <Field label="Description"><input style={input} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="Total price (₹) *"><input style={input} value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="e.g. 250" /></Field>
      <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
      </label>
      <Field label="Components (JSON)"><textarea style={{ ...input, fontFamily: 'monospace' }} rows={6} value={comps} onChange={(e) => setComps(e.target.value)} placeholder='[{"productSlug":"toor-dal","quantity":500}]' /></Field>
      <button style={btn} disabled={busy || !name.trim() || !totalPrice} onClick={save}>{busy ? 'Creating…' : 'Create combo'}</button>
    </div>
  );
}

export default function CreatePopup({ kind, categories, units, onClose, onCreatedProduct, onCreatedCombo, onError }: {
  kind: 'product' | 'combo';
  categories: string[];
  units: string[];
  onClose: () => void;
  onCreatedProduct: (p: Product) => void;
  onCreatedCombo: (c: Combo) => void;
  onError: (m: string) => void;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, width: 440, maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <strong>{kind === 'product' ? 'New product' : 'New combo'}</strong>
          <button style={{ ...btn, marginLeft: 'auto' }} onClick={onClose}>Close</button>
        </div>
        {kind === 'product'
          ? <ProductCreateForm categories={categories} units={units} onCreated={(p) => { onCreatedProduct(p); onClose(); }} onError={onError} />
          : <ComboCreateForm onCreated={(c) => { onCreatedCombo(c); onClose(); }} onError={onError} />}
      </div>
    </div>
  );
}
