import { useRef, useState } from 'react';
import { Package } from 'lucide-react';
import type { Combo, Product } from '@bqm/types';
import { createCombo, createProduct } from '../api';
import ImageEditor from './ImageEditor';
import { ContextStrip, Field, GhostButton, PopupShell, PrimaryButton, Section } from './formKit';
import { TypeSlider, UnitSelect, CategorySelect, PackRows, parsePacks, SizePills, normUnit, normCategory, type PackRow } from './productFields';
import { ComboComponentsEditor, comboPartsTotal, comboRowsToInput, emptyComboRow, type ComboRow } from './comboFields';

const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function ProductCreateForm({ categories, units, onCreated, onClose, onError }: {
  categories: string[];
  units: string[];
  onCreated: (p: Product) => void;
  onClose: () => void;
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
  const [websiteSizes, setWebsiteSizes] = useState<number[]>([]);
  const [rows, setRows] = useState<PackRow[]>([]);
  const [busy, setBusy] = useState(false);

  const initialCategory = useRef(categories[0] ?? '');
  const dirty =
    name !== '' || slug !== '' || tamilName !== '' || image !== '' || description !== '' ||
    pricePerUnit !== '' || websiteSizes.length > 0 || rows.length > 0 ||
    category !== initialCategory.current || stockUnit !== 'g' || isQuantized;

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
        ...(!isQuantized && websiteSizes.length > 0 ? { websitePackSizes: [...websiteSizes].sort((a, b) => a - b) } : {}),
      }));
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PopupShell
      eyebrow="New product"
      title={name.trim() || 'Untitled product'}
      badge={<span className={`bqm-type-chip ${!isQuantized ? 'loose' : 'fixed'}`}>{!isQuantized ? 'Loose' : 'Fixed'}</span>}
      dirty={dirty}
      onClose={onClose}
      footer={(close) => (
        <>
          <GhostButton disabled={busy} onClick={close}>Cancel</GhostButton>
          <PrimaryButton busy={busy} busyLabel="Creating…" disabled={!name.trim()} onClick={save}>Create product</PrimaryButton>
        </>
      )}
    >
      <Section title="Details">
        <Field label="Name" required>
          <input
            className="fkit-input"
            value={name}
            onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }}
            aria-label="Product name"
          />
        </Field>
        <Field label="Slug" required hint="Auto-filled from the name — override only if you need a custom URL.">
          <input
            className="fkit-input"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14 }}
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            placeholder="auto from name"
            aria-label="Slug"
          />
        </Field>
        <Field label="Tamil name" hint="Shown next to the English name on the website.">
          <input className="fkit-input" value={tamilName} onChange={(e) => setTamilName(e.target.value)} lang="ta" aria-label="Tamil name" />
        </Field>
        <Field label="Category" required>
          <CategorySelect value={category} onChange={setCategory} categories={categories} />
        </Field>
      </Section>

      <Section title="How it's sold">
        <Field label="Selling type" hint="Loose goods are weighed out per order; fixed goods sell in pre-set packs. Can't be changed later.">
          <TypeSlider loose={!isQuantized} onPick={(loose) => setIsQuantized(!loose)} />
        </Field>
        {!isQuantized ? (
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
            <Field label="Fixed packs" hint="Opening stock for each pack.">
              <PackRows rows={rows} onChange={setRows} unit={stockUnit} countEditable stockHeader="Opening stock" />
            </Field>
          </>
        )}
        <ContextStrip>
          <Package size={16} aria-hidden="true" />
          <span>Starts with zero stock — add it via <strong>Edit stock</strong> after creating.</span>
        </ContextStrip>
      </Section>

      <Section title="Presentation">
        <Field label="Image">
          <ImageEditor value={image} onChange={setImage} kind="products" onError={onError} />
        </Field>
        <Field label="Description">
          <textarea className="fkit-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" />
        </Field>
      </Section>
    </PopupShell>
  );
}

function ComboCreateForm({ products, onCreated, onClose, onError }: {
  products: Product[];
  onCreated: (c: Combo) => void;
  onClose: () => void;
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
  const [rows, setRows] = useState<ComboRow[]>([]);
  const [busy, setBusy] = useState(false);

  const dirty = name !== '' || slug !== '' || tamilName !== '' || image !== '' ||
    description !== '' || totalPrice !== '' || rows.length > 0 || !isActive;
  const parts = comboPartsTotal(rows, products);

  const save = async () => {
    if (!name.trim()) { onError('Name is required'); return; }
    const finalSlug = slugify(slug || name);
    if (!finalSlug) { onError('Slug is required'); return; }
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
      onCreated(await createCombo({
        slug: finalSlug,
        name: name.trim(),
        ...(tamilName.trim() ? { tamilName: tamilName.trim() } : {}),
        ...(image.trim() ? { image: image.trim() } : {}),
        description: description.trim(),
        totalPrice: price,
        isActive,
        products: components,
      }));
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PopupShell
      eyebrow="New combo"
      title={name.trim() || 'Untitled combo'}
      badge={<span className={`bqm-type-chip ${isActive ? 'active' : 'inactive'}`}>{isActive ? 'Active' : 'Inactive'}</span>}
      dirty={dirty}
      onClose={onClose}
      footer={(close) => (
        <>
          <GhostButton disabled={busy} onClick={close}>Cancel</GhostButton>
          <PrimaryButton busy={busy} busyLabel="Creating…" disabled={!name.trim() || !totalPrice} onClick={save}>Create combo</PrimaryButton>
        </>
      )}
    >
      <Section title="Details">
        <Field label="Name" required>
          <input
            className="fkit-input"
            value={name}
            onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }}
            aria-label="Combo name"
          />
        </Field>
        <Field label="Slug" required hint="Auto-filled from the name — override only if you need a custom URL.">
          <input
            className="fkit-input"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14 }}
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            placeholder="auto from name"
            aria-label="Slug"
          />
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
            placeholder="e.g. 250"
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
          hint="One unit of this combo deducts each line below."
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
    </PopupShell>
  );
}

export default function CreatePopup({ kind, categories, units, products, onClose, onCreatedProduct, onCreatedCombo, onError }: {
  kind: 'product' | 'combo';
  categories: string[];
  units: string[];
  products: Product[];
  onClose: () => void;
  onCreatedProduct: (p: Product) => void;
  onCreatedCombo: (c: Combo) => void;
  onError: (m: string) => void;
}) {
  if (kind === 'product') {
    return (
      <ProductCreateForm
        categories={categories}
        units={units}
        onCreated={(p) => { onCreatedProduct(p); onClose(); }}
        onClose={onClose}
        onError={onError}
      />
    );
  }
  return (
    <ComboCreateForm
      products={products}
      onCreated={(c) => { onCreatedCombo(c); onClose(); }}
      onClose={onClose}
      onError={onError}
    />
  );
}
