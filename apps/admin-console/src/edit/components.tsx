import React, { useState } from 'react';

/** Shared primitives for the website editors. Styled to match the Bensi Queen Mart premium admin console. */
export const API_BASE = '/api/edit';

export const inp: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #DCE8C8',
  borderRadius: 8,
  fontSize: 13.5,
  color: '#123B26',
  background: '#fafcfa',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

export const lbl: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#205C38',
  marginBottom: 5,
  display: 'block',
  letterSpacing: '0.01em',
};

export const btn: React.CSSProperties = {
  padding: '7px 14px',
  border: '1px solid #DCE8C8',
  borderRadius: 6,
  cursor: 'pointer',
  background: '#fff',
  color: '#123B26',
  fontSize: 12.5,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.15s ease',
};

export const card: React.CSSProperties = {
  border: '1px solid #e2ebe2',
  borderRadius: 10,
  padding: '16px 18px',
  background: '#fff',
  marginBottom: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
};

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={lbl}>{label}</span>
        {hint && <span style={{ fontSize: 11, color: '#7a967e' }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function Text({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      style={inp}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#205C38';
        e.currentTarget.style.background = '#fff';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#DCE8C8';
        e.currentTarget.style.background = '#fafcfa';
      }}
    />
  );
}

export function Area({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      style={{ ...inp, minHeight: rows * 24, resize: 'vertical', lineHeight: 1.5 }}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#205C38';
        e.currentTarget.style.background = '#fff';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#DCE8C8';
        e.currentTarget.style.background = '#fafcfa';
      }}
    />
  );
}

export function Num({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      style={inp}
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#205C38';
        e.currentTarget.style.background = '#fff';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#DCE8C8';
        e.currentTarget.style.background = '#fafcfa';
      }}
    />
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        color: '#123B26',
        marginRight: 16,
        marginBottom: 8,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: 16,
          height: 16,
          accentColor: '#205C38',
          cursor: 'pointer',
        }}
      />
      {label}
    </label>
  );
}

export function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      style={{ ...inp, cursor: 'pointer' }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#205C38';
        e.currentTarget.style.background = '#fff';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#DCE8C8';
        e.currentTarget.style.background = '#fafcfa';
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** Multi-line text ↔ string[] bridge (areas, marquee, cycle words, category items). */
export function Lines({ value, onChange, rows = 5, placeholder }: { value: string[]; onChange: (v: string[]) => void; rows?: number; placeholder?: string }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <textarea
      style={{
        ...inp,
        minHeight: rows * 24,
        fontFamily: 'monospace',
        fontSize: 12.5,
        lineHeight: 1.5,
        resize: 'vertical',
      }}
      placeholder={placeholder}
      value={text ?? (value ?? []).join('\n')}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split('\n').map((l) => l.trim()).filter(Boolean));
      }}
      onBlur={() => setText(null)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#205C38';
        e.currentTarget.style.background = '#fff';
      }}
    />
  );
}

export interface ListActions<T> {
  move: (from: number, to: number) => void;
  remove: (index: number) => void;
}

export function ListEditor<T>({
  title,
  items,
  onChange,
  onAdd,
  addLabel,
  renderItem,
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
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#123B26', fontWeight: 700 }}>
            {title}
          </h3>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: '#F7F5E8',
              color: '#205C38',
              padding: '2px 8px',
              borderRadius: 10,
              border: '1px solid #E8DFC8',
            }}
          >
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <button
          style={{
            ...btn,
            background: '#205C38',
            color: '#fff',
            borderColor: '#205C38',
            fontWeight: 700,
          }}
          onClick={() => onChange([...items, onAdd()])}
        >
          + {addLabel}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #DCE8C8',
              borderRadius: 10,
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            {/* Header controls for each item */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f4f0',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: '#205C38', background: '#F7F5E8', padding: '2px 8px', borderRadius: 4 }}>
                #{i + 1}
              </span>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  style={{ ...btn, padding: '3px 8px', fontSize: 11 }}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  style={{ ...btn, padding: '3px 8px', fontSize: 11 }}
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  style={{
                    ...btn,
                    padding: '3px 10px',
                    fontSize: 11,
                    color: '#991b1b',
                    borderColor: '#fca5a5',
                    background: '#fef2f2',
                  }}
                  onClick={() => {
                    if (window.confirm('Remove this item?')) {
                      onChange(items.filter((_, j) => j !== i));
                    }
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            </div>

            {renderItem(item, (patch) => updateAt(i, patch), i)}
          </div>
        ))}

        {items.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: '#888',
              background: '#fafcfa',
              border: '1px dashed #DCE8C8',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            No items added yet. Click &ldquo;+ {addLabel}&rdquo; to create the first one.
          </div>
        )}
      </div>
    </section>
  );
}

export function SaveBar({
  dirty,
  saving,
  error,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  error: string | null;
  onSave: (message: string) => void;
  onDiscard: () => void;
}) {
  const [message, setMessage] = useState('');

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #DCE8C8',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
        padding: '14px 20px',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        borderRadius: '10px 10px 0 0',
        marginTop: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 12,
            fontSize: 11.5,
            fontWeight: 700,
            background: dirty ? '#fef3c7' : '#ecfdf5',
            color: dirty ? '#92400e' : '#065f46',
            border: dirty ? '1px solid #fde68a' : '1px solid #a7f3d0',
          }}
        >
          {dirty ? '● Unsaved Changes' : '✓ Up to date with GitHub'}
        </span>
      </div>

      <input
        style={{
          ...inp,
          width: 280,
          background: '#fff',
          fontSize: 12.5,
          padding: '7px 11px',
        }}
        placeholder="Commit message (e.g. Update business hours)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        style={{
          ...btn,
          background: dirty && !saving ? '#123B26' : '#68826d',
          color: '#fff',
          borderColor: 'transparent',
          fontWeight: 700,
          cursor: dirty && !saving ? 'pointer' : 'not-allowed',
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}
        disabled={!dirty || saving}
        onClick={() => {
          onSave(message);
          setMessage('');
        }}
      >
        {saving ? 'Saving to GitHub…' : '💾 Save to GitHub'}
      </button>

      <button
        style={{
          ...btn,
          cursor: !dirty || saving ? 'not-allowed' : 'pointer',
          opacity: !dirty || saving ? 0.5 : 1,
        }}
        disabled={!dirty || saving}
        onClick={onDiscard}
      >
        Discard
      </button>

      {error && (
        <span style={{ color: '#b91c1c', fontSize: 12, fontWeight: 600, marginLeft: 6 }}>
          ⚠️ {error}
        </span>
      )}
    </div>
  );
}
