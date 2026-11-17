import { useEffect, useState } from 'react';

const selStyle: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, flex: 1, minWidth: 0, background: '#fff' };
const rowInput: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, flex: 1, minWidth: 0 };
const segWrap: React.CSSProperties = { display: 'flex', background: '#eee', borderRadius: 8, padding: 3, gap: 3 };

/** Loose | Fixed two-option slider. Disabled in edit — isQuantized is immutable. */
export function TypeSlider({ loose, disabled, onPick }: { loose: boolean; disabled?: boolean; onPick?: (loose: boolean) => void }) {
  const seg = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, cursor: disabled ? 'default' : 'pointer',
    fontSize: 13, fontWeight: 700, background: active ? '#1a1a1a' : 'transparent', color: active ? '#fff' : '#555',
  });
  return (
    <div style={segWrap}>
      <button style={seg(loose)} disabled={disabled} onClick={() => onPick?.(true)}>Loose</button>
      <button style={seg(!loose)} disabled={disabled} onClick={() => onPick?.(false)}>Fixed</button>
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
    <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
      <select
        style={selStyle}
        value={custom ? 'custom' : value}
        onChange={(e) => {
          if (e.target.value === 'custom') { setCustom(true); onChange(''); }
          else { setCustom(false); onChange(e.target.value); }
        }}
      >
        <option value="" disabled>category…</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="custom">+ New category…</option>
      </select>
      {custom && (
        <input
          style={rowInput}
          placeholder="e.g. spices"
          value={value}
          onChange={(e) => {
            const hit = categories.find((c) => c.toLowerCase() === e.target.value.trim().toLowerCase());
            if (hit) { setCustom(false); onChange(hit); }
            else onChange(e.target.value);
          }}
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
    <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
      <select
        style={selStyle}
        value={custom ? 'custom' : value}
        onChange={(e) => {
          if (e.target.value === 'custom') { setCustom(true); onChange(''); }
          else { setCustom(false); onChange(e.target.value); }
        }}
      >
        <option value="" disabled>unit…</option>
        {units.map((u) => <option key={u} value={u}>{u}</option>)}
        <option value="custom">+ Custom…</option>
      </select>
      {custom && (
        <input
          style={rowInput}
          placeholder="e.g. pkt"
          value={value}
          onChange={(e) => {
            const hit = units.find((u) => u.toLowerCase() === e.target.value.trim().toLowerCase());
            if (hit) { setCustom(false); onChange(hit); }
            else onChange(e.target.value);
          }}
        />
      )}
    </div>
  );
}

export interface PackRow { size: string; price: string; count: string; }

/** Fixed-pack entries: size (= QuantizedCount.size) + price (= QuantityPrice.price) + stock (= QuantizedCount.count). */
export function PackRows({ rows, onChange, unit, countEditable }: { rows: PackRow[]; onChange: (r: PackRow[]) => void; unit: string; countEditable: boolean }) {
  const set = (i: number, k: keyof PackRow, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const u = unit.trim();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#666' }}>
        <div style={{ flex: 1, minWidth: 0 }}>Pack size</div>
        <div style={{ flex: 1, minWidth: 0 }}>Price (₹)</div>
        <div style={{ flex: 1, minWidth: 0 }}>Stock (packs)</div>
        <div style={{ width: 34, flexShrink: 0 }} />
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 6 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input
              style={{ ...rowInput, width: '100%', boxSizing: 'border-box', paddingRight: r.size.trim() !== '' && u !== '' ? 30 : undefined }}
              placeholder="e.g. 500"
              value={r.size}
              onChange={(e) => set(i, 'size', e.target.value)}
            />
            {r.size.trim() !== '' && u !== '' && (
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#aaa', pointerEvents: 'none' }}>{u}</span>
            )}
          </div>
          <input style={rowInput} placeholder="e.g. 120.50" value={r.price} onChange={(e) => set(i, 'price', e.target.value)} />
          {countEditable ? (
            <input style={rowInput} placeholder="e.g. 4" value={r.count} onChange={(e) => set(i, 'count', e.target.value)} />
          ) : (
            <div style={{ ...rowInput, flex: 1, minWidth: 0, background: '#f7f7f7', color: '#333' }}>{r.count === '' ? '—' : r.count}</div>
          )}
          <button style={{ width: 34, flexShrink: 0, padding: '6px 0', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' }} onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button style={{ padding: '6px 10px', border: '1px dashed #999', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13 }} onClick={() => onChange([...rows, { size: '', price: '', count: '' }])}>+ Add pack</button>
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
