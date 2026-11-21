import { useEffect, useState } from 'react';
import { Lock, X } from 'lucide-react';

/**
 * Shared inputs for the product editor dialogs. Styling comes from the
 * form-kit classes in index.css; behaviour contracts are unchanged:
 * - TypeSlider: Loose | Fixed. Disabled in edit (isQuantized is immutable).
 * - CategorySelect / UnitSelect: dropdown with a typable custom option.
 * - PackRows: fixed-pack size · price · stock rows.
 * - SizePills: loose website pack sizes as editable pills.
 */

/** Loose | Fixed two-option slider. Disabled in edit — isQuantized is immutable. */
export function TypeSlider({ loose, disabled, onPick }: { loose: boolean; disabled?: boolean; onPick?: (loose: boolean) => void }) {
  return (
    <div className={`fkit-seg${disabled ? ' is-locked' : ''}`} role={disabled ? undefined : 'radiogroup'} aria-label="Selling type" aria-disabled={disabled}>
      <button
        type="button"
        className={`fkit-seg-btn${loose ? ' on' : ''}`}
        disabled={disabled}
        aria-pressed={loose}
        onClick={() => onPick?.(true)}
      >
        Loose
        {disabled && loose && <Lock size={13} aria-hidden="true" />}
      </button>
      <button
        type="button"
        className={`fkit-seg-btn${!loose ? ' on' : ''}`}
        disabled={disabled}
        aria-pressed={!loose}
        onClick={() => onPick?.(false)}
      >
        Fixed
        {disabled && !loose && <Lock size={13} aria-hidden="true" />}
      </button>
    </div>
  );
}

/** Snap a typed unit to the existing set (case-insensitive) or keep it trimmed. */
export function normUnit(u: string, units: string[]): string {
  return units.find((x) => x.toLowerCase() === u.trim().toLowerCase()) ?? u.trim();
}

/** Snap a typed category to the existing set (case-insensitive) or keep it trimmed. */
export function normCategory(c: string, categories: string[]): string {
  return categories.find((x) => x.toLowerCase() === c.trim().toLowerCase()) ?? c.trim();
}

/** Category dropdown with a typable custom option. Typing an existing category snaps to it. */
export function CategorySelect({ value, onChange, categories }: { value: string; onChange: (c: string) => void; categories: string[] }) {
  const [custom, setCustom] = useState(() => value !== '' && !categories.includes(value));
  useEffect(() => { if (categories.includes(value)) setCustom(false); }, [value, categories]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select
        className="fkit-select"
        value={custom ? 'custom' : value}
        onChange={(e) => {
          if (e.target.value === 'custom') { setCustom(true); onChange(''); }
          else { setCustom(false); onChange(e.target.value); }
        }}
        aria-label="Category"
      >
        <option value="" disabled>Choose a category…</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="custom">+ New category…</option>
      </select>
      {custom && (
        <input
          className="fkit-input"
          placeholder="e.g. spices"
          value={value}
          onChange={(e) => {
            const hit = categories.find((c) => c.toLowerCase() === e.target.value.trim().toLowerCase());
            if (hit) { setCustom(false); onChange(hit); }
            else onChange(e.target.value);
          }}
          aria-label="New category name"
        />
      )}
    </div>
  );
}

/** Unit dropdown with a typable custom option. Typing an existing unit snaps to it. */
export function UnitSelect({ value, onChange, units }: { value: string; onChange: (u: string) => void; units: string[] }) {
  const [custom, setCustom] = useState(() => value !== '' && !units.includes(value));
  useEffect(() => { if (units.includes(value)) setCustom(false); }, [value, units]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
      <select
        className="fkit-select"
        value={custom ? 'custom' : value}
        onChange={(e) => {
          if (e.target.value === 'custom') { setCustom(true); onChange(''); }
          else { setCustom(false); onChange(e.target.value); }
        }}
        aria-label="Unit"
      >
        <option value="" disabled>unit…</option>
        {units.map((u) => <option key={u} value={u}>{u}</option>)}
        <option value="custom">+ Custom…</option>
      </select>
      {custom && (
        <input
          className="fkit-input"
          placeholder="e.g. pkt"
          value={value}
          onChange={(e) => {
            const hit = units.find((u) => u.toLowerCase() === e.target.value.trim().toLowerCase());
            if (hit) { setCustom(false); onChange(hit); }
            else onChange(e.target.value);
          }}
          aria-label="New unit name"
        />
      )}
    </div>
  );
}

export interface PackRow { size: string; price: string; count: string; }

/**
 * Fixed-pack entries: size (= QuantizedCount.size) + price (= QuantityPrice.price)
 * + stock (= QuantizedCount.count). Table-like on desktop, stacked cards on
 * mobile. `stockHeader` labels the count column ("Stock (packs)" in edit,
 * "Opening stock" in create).
 */
export function PackRows({ rows, onChange, unit, countEditable, stockHeader = 'Stock (packs)' }: {
  rows: PackRow[];
  onChange: (r: PackRow[]) => void;
  unit: string;
  countEditable: boolean;
  stockHeader?: string;
}) {
  const set = (i: number, k: keyof PackRow, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const u = unit.trim();
  return (
    <div>
      <div className="pack-head" aria-hidden="true">
        <div>Pack size{u ? ` (${u})` : ''}</div>
        <div>Price (₹)</div>
        <div>{stockHeader}</div>
        <div />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="pack-row">
          <div className="pack-row-num">Pack {i + 1}</div>
          <label className="pack-cell">
            <span className="pack-cell-label">Pack size{u ? ` (${u})` : ''}</span>
            <input
              className="fkit-input fkit-num"
              placeholder="e.g. 500"
              value={r.size}
              onChange={(e) => set(i, 'size', e.target.value)}
              inputMode="numeric"
              aria-label={`Pack ${i + 1} size${u ? ` in ${u}` : ''}`}
            />
          </label>
          <label className="pack-cell">
            <span className="pack-cell-label">Price (₹)</span>
            <input
              className="fkit-input fkit-num"
              placeholder="e.g. 120.50"
              value={r.price}
              onChange={(e) => set(i, 'price', e.target.value)}
              inputMode="decimal"
              aria-label={`Pack ${i + 1} price in rupees`}
            />
          </label>
          <label className="pack-cell pack-cell-stock">
            <span className="pack-cell-label">{stockHeader}</span>
            {countEditable ? (
              <input
                className="fkit-input fkit-num"
                placeholder="e.g. 4"
                value={r.count}
                onChange={(e) => set(i, 'count', e.target.value)}
                inputMode="numeric"
                aria-label={`Pack ${i + 1} ${stockHeader.toLowerCase()}`}
              />
            ) : (
              <div className="fkit-input" style={{ background: '#f1f5f1', color: '#333' }} aria-label={`Pack ${i + 1} ${stockHeader.toLowerCase()}`}>
                {r.count === '' ? '—' : r.count}
              </div>
            )}
          </label>
          <button
            type="button"
            className="pack-del"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label={`Remove pack ${i + 1}`}
            title={`Remove pack ${i + 1}`}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="pack-add" onClick={() => onChange([...rows, { size: '', price: '', count: '' }])}>
        + Add pack
      </button>
    </div>
  );
}

/** Parse + validate pack rows. Sizes must be unique positive integers. */
export function parsePacks(rows: PackRow[]): { quantityPrice: Array<{ quantity: number; price: number }>; stock: Array<{ size: number; count: number }> } {
  const seen = new Set<number>();
  const quantityPrice: Array<{ quantity: number; price: number }> = [];
  const stock: Array<{ size: number; count: number }> = [];
  rows.forEach((r) => {
    const size = Number(r.size);
    const price = Number(r.price);
    const count = r.count.trim() === '' ? NaN : Number(r.count);
    if (!Number.isInteger(size) || size <= 0) throw new Error(`bad pack size: ${r.size || '(empty)'}`);
    if (!Number.isFinite(price) || price < 0) throw new Error(`bad price: ${r.price || '(empty)'}`);
    if (!Number.isInteger(count) || count < 0) throw new Error(`bad stock count: ${r.count || '(empty)'}`);
    if (seen.has(size)) throw new Error(`duplicate pack size: ${size}`);
    seen.add(size);
    quantityPrice.push({ quantity: size, price });
    stock.push({ size, count });
  });
  return { quantityPrice, stock };
}

/**
 * Loose website pack sizes as editable pills: each size is a touch-sized
 * rounded rectangle with a delete badge; clicking a pill edits it inline
 * (Enter/blur commits, Escape cancels). Empty = hidden from the website.
 */
export function SizePills({ sizes, onChange, unit }: { sizes: number[]; onChange: (s: number[]) => void; unit: string }) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');
  const u = unit.trim();

  const commit = (list: number[]) => onChange([...new Set(list)].sort((a, b) => a - b));

  const add = () => {
    const t = draft.trim();
    if (t === '') return;
    const n = Number(t);
    if (!Number.isInteger(n) || n <= 0) { setError(`bad website pack size: ${t}`); return; }
    if (sizes.includes(n)) { setError(`duplicate website pack size: ${n}`); return; }
    setError('');
    setDraft('');
    commit([...sizes, n]);
  };

  const commitEdit = (old: number) => {
    setEditing(null);
    const t = editText.trim();
    if (t === '' || t === String(old)) return;
    const n = Number(t);
    if (!Number.isInteger(n) || n <= 0) { setError(`bad website pack size: ${t}`); return; }
    if (sizes.includes(n)) { setError(`duplicate website pack size: ${n}`); return; }
    setError('');
    commit(sizes.map((s) => (s === old ? n : s)));
  };

  return (
    <div>
      {sizes.length > 0 && (
        <div className="sizepills-row">
          {sizes.map((s) => (
            <span
              key={s}
              className="sizepill"
              onClick={() => { setEditing(s); setEditText(String(s)); setError(''); }}
              title="Click to edit"
            >
              {editing === s ? (
                <input
                  autoFocus
                  className="sizepill-edit"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => commitEdit(s)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(s); if (e.key === 'Escape') setEditing(null); }}
                  onClick={(e) => e.stopPropagation()}
                  inputMode="numeric"
                  aria-label={`Edit pack size ${s}${u}`}
                />
              ) : (
                <span>{s}{u}</span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setError(''); commit(sizes.filter((x) => x !== s)); }}
                title={`Remove ${s}${u}`}
                aria-label={`Remove pack size ${s}${u}`}
                className="sizepill-del"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="sizepill-addrow">
        <input
          className="fkit-input fkit-num"
          placeholder="e.g. 500"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          inputMode="numeric"
          aria-label="New pack size"
        />
        <button type="button" className="pack-add" style={{ width: 'auto', paddingLeft: 16, paddingRight: 16 }} onClick={add}>+ Add size</button>
      </div>
      {error !== '' && <div className="fkit-error" role="alert">{error}</div>}
      {sizes.length === 0 && error === '' && (
        <div className="fkit-hint">No sizes yet — the product stays hidden from the website until you add one.</div>
      )}
    </div>
  );
}
