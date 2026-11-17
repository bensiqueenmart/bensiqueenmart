import { useState } from 'react';

/** Shared primitives for the website editors. Plain inline styles like the rest of the console. */
export const API_BASE = '/api/edit';

export const inp: React.CSSProperties = {
  width: '100%', padding: '6px 10px', border: '1px solid #bbb',
  borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4, display: 'block' };
const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };
const card: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#fff', marginBottom: 10 };

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={lbl}>{label}</span>
      {children}
    </label>
  );
}

export function Text({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input style={inp} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function Area({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea style={{ ...inp, minHeight: rows * 22 }} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

export function Num({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      style={inp} type="number" value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
    />
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 10, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select style={inp} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

/** Multi-line text ↔ string[] bridge (areas, marquee, cycle words, category items). */
export function Lines({ value, onChange, rows = 5 }: { value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <textarea
      style={{ ...inp, minHeight: rows * 22, fontFamily: 'monospace', fontSize: 13 }}
      value={text ?? (value ?? []).join('\n')}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split('\n').map((l) => l.trim()).filter(Boolean));
      }}
      onBlur={() => setText(null)}
    />
  );
}

export interface ListActions<T> {
  move: (from: number, to: number) => void;
  remove: (index: number) => void;
}

export function ListEditor<T>({
  title, items, onChange, onAdd, addLabel, renderItem,
}: {
  title: string;
  items: T[];
  onChange: (next: T[]) => void;
  onAdd: () => T;
  addLabel: string;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
}) {
  const updateAt = (i: number, patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it as T);
    onChange(next);
  };
  return (
    <section style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{title} ({items.length})</h3>
        <button style={{ ...btn, marginLeft: 'auto' }} onClick={() => onChange([...items, onAdd()])}>+ {addLabel}</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={card}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button style={btn} disabled={i === 0} onClick={() => move(i, i - 1)}>↑</button>
            <button style={btn} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>↓</button>
            <button
              style={{ ...btn, marginLeft: 'auto', color: '#a00', borderColor: '#c99' }}
              onClick={() => { if (window.confirm('Remove this item?')) onChange(items.filter((_, j) => j !== i)); }}
            >
              Remove
            </button>
          </div>
          {renderItem(item, (patch) => updateAt(i, patch), i)}
        </div>
      ))}
    </section>
  );
}

export function SaveBar({
  dirty, saving, error, onSave, onDiscard,
}: {
  dirty: boolean; saving: boolean; error: string | null;
  onSave: (message: string) => void; onDiscard: () => void;
}) {
  const [message, setMessage] = useState('');
  return (
    <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #ddd', padding: '10px 0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: dirty ? '#a60' : '#484' }}>{dirty ? '● Unsaved changes' : '✓ All saved'}</span>
      <input
        style={{ ...inp, width: 260 }} placeholder="Commit message (optional)"
        value={message} onChange={(e) => setMessage(e.target.value)}
      />
      <button style={{ ...btn, background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a', opacity: dirty && !saving ? 1 : 0.5 }} disabled={!dirty || saving} onClick={() => { onSave(message); setMessage(''); }}>
        {saving ? 'Saving…' : 'Save to GitHub'}
      </button>
      <button style={btn} disabled={!dirty || saving} onClick={onDiscard}>Discard</button>
      {error && <span style={{ color: '#a00', fontSize: 13 }}>{error}</span>}
    </div>
  );
}
