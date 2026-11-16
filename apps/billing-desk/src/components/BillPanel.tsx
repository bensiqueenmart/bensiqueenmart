import { useState } from 'react';
import type { Order, OrderStatus } from '@bqm/types';
import { paise } from '../api';

/** One editable row on the running bill. quantity is in base units. */
export interface DraftLine {
  key: string;
  kind: 'product' | 'combo';
  slug: string;
  name: string;
  step: number;
  quantity: number;
  price: number; // line total, paise — editable (custom price)
  /** Fixed pack size in base units — set only for tier (fixed-quantity) lines. */
  packSize?: number;
  /** Display unit (product stockUnit, '' for combos). */
  unit: string;
  /** Canonical rate in paise/base-unit — set once for loose lines, never sent to backend. */
  unitPrice?: number;
  /** Loose-line qty⇄price sync. True by default; pack/combo lines never set it. */
  locked?: boolean;
}

const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };
const primary: React.CSSProperties = { ...btn, background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' };
const input: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 };
const card: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#fff' };

const LockGlyph = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    {open ? <path d="M8 11V7a4 4 0 0 1 8 0" /> : <path d="M8 11V7a4 4 0 0 1 8 0v4" />}
  </svg>
);

interface Props {
  lines: DraftLine[];
  onLinesChange: (lines: DraftLine[]) => void;
  order: Order | null;
  customerName: string;
  mobile: string;
  onCustomerChange: (name: string, mobile: string) => void;
  busy: boolean;
  onCreate: () => void;
  onUpdateItems: () => void;
  onStatus: (status: OrderStatus) => void;
  onNewBill: () => void;
}

export default function BillPanel(p: Props) {
  const total = p.lines.reduce((s, l) => s + (Number.isFinite(l.price) ? l.price : 0), 0);
  const status = p.order?.status;
  const lockedForEdit = !!status && status !== 'pending';

  // Raw text for fields being typed. Lets users clear/retype freely (e.g. "45.")
  // without the input snapping back; the parsed value still flows to the line.
  const [text, setText] = useState<Record<string, { qty?: string; price?: string }>>({});
  const setDraft = (key: string, field: 'qty' | 'price', raw: string | undefined) =>
    setText((t) => {
      const entry = { ...(t[key] ?? {}) };
      if (raw === undefined) delete entry[field];
      else entry[field] = raw;
      const next = { ...t };
      if (entry.qty === undefined && entry.price === undefined) delete next[key];
      else next[key] = entry;
      return next;
    });
  const clearDrafts = (key: string) =>
    setText((t) => {
      if (!(key in t)) return t;
      const next = { ...t };
      delete next[key];
      return next;
    });

  const isBadQty = (l: DraftLine) => !Number.isInteger(l.quantity) || l.quantity <= 0;
  const isBadPrice = (l: DraftLine) => !Number.isFinite(l.price) || l.price < 0;
  const hasBadLine = p.lines.some((l) => isBadQty(l) || isBadPrice(l));

  const removeLine = (key: string) => {
    clearDrafts(key);
    p.onLinesChange(p.lines.filter((l) => l.key !== key));
  };

  const bump = (key: string, dir: 1 | -1) => {
    clearDrafts(key);
    p.onLinesChange(
      p.lines
        .map((l) => {
          if (l.key !== key) return l;
          const quantity = l.quantity + dir * l.step;
          if (quantity <= 0) return null;
          // Re-price proportionally from the current line total (preserves custom prices).
          const unitRate = l.quantity > 0 ? l.price / l.quantity : 0;
          return { ...l, quantity, price: Math.round(unitRate * quantity) };
        })
        .filter((l): l is DraftLine => l !== null),
    );
  };

  const setPrice = (key: string, price: number) => {
    if (!Number.isFinite(price) || price < 0) return;
    price = Math.round(price);
    p.onLinesChange(
      p.lines.map((l) => {
        if (l.key !== key) return l;
        const rate = l.locked ? (l.unitPrice ?? 0) : 0;
        if (rate > 0) return { ...l, quantity: Math.max(1, Math.round(price / rate)), price };
        return { ...l, price };
      }),
    );
  };

  const setQuantity = (key: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    p.onLinesChange(
      p.lines.map((l) => {
        if (l.key !== key) return l;
        const rate = l.locked ? (l.unitPrice ?? 0) : 0;
        // Locked: canonical rate. Unlocked: re-price proportionally (preserves custom prices).
        const unitRate = rate > 0 ? rate : l.quantity > 0 ? l.price / l.quantity : 0;
        return { ...l, quantity, price: Math.round(unitRate * quantity) };
      }),
    );
  };

  const setQuantityText = (key: string, raw: string) => {
    const n = Number(raw);
    const ok = raw.trim() !== '' && Number.isInteger(n) && n > 0;
    // Keep partial forms ("010") as typed; drop the draft once it matches canonical.
    setDraft(key, 'qty', ok && String(n) === raw.trim() ? undefined : raw);
    if (ok) {
      setDraft(key, 'price', undefined); // reprice rewrites the price
      setQuantity(key, n);
    } else {
      p.onLinesChange(p.lines.map((l) => (l.key === key ? { ...l, quantity: NaN } : l)));
    }
  };

  const setPriceText = (key: string, raw: string) => {
    const v = Number(raw);
    const ok = raw.trim() !== '' && Number.isFinite(v) && v >= 0;
    // Keep partial forms ("45.") as typed so decimals remain typeable.
    setDraft(key, 'price', ok && String(v) === raw.trim() ? undefined : raw);
    if (ok) {
      setDraft(key, 'qty', undefined); // locked derive may rewrite the quantity
      setPrice(key, v * 100);
    } else {
      p.onLinesChange(p.lines.map((l) => (l.key === key ? { ...l, price: NaN } : l)));
    }
  };

  const toggleLock = (key: string) => {
    const line = p.lines.find((l) => l.key === key);
    if (line && !line.locked) clearDrafts(key); // re-locking rewrites the price
    p.onLinesChange(
      p.lines.map((l) => {
        if (l.key !== key) return l;
        if (l.locked) return { ...l, locked: false };
        // Re-locking: keep quantity, snap price back to the canonical rate.
        const rate = l.unitPrice ?? 0;
        return { ...l, locked: true, price: Math.round(l.quantity * rate) };
      }),
    );
  };

  return (
    <aside style={{ ...card, alignSelf: 'start', position: 'sticky', top: 70 }}>
      <h3 style={{ marginTop: 0 }}>Current bill</h3>
      {p.lines.length === 0 && <p style={{ color: '#777' }}>Tap Add on any item to start a bill.</p>}

      {p.lines.map((l) => (
        <div key={l.key} style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <strong style={{ fontSize: 14 }}>{l.name}</strong>
            {!lockedForEdit && (
              <button
                title="Remove item"
                onClick={() => removeLine(l.key)}
                style={{ border: 'none', background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 2px' }}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {l.packSize || l.kind === 'combo' ? (
                <>
                  <button style={btn} disabled={!!status && status !== 'pending'} onClick={() => bump(l.key, -1)}>−</button>
                  <span style={{ fontSize: 13 }}>
                    {l.packSize ? l.quantity / l.packSize : l.quantity}
                    {l.packSize && <span style={{ color: '#888' }}> × {l.packSize}{l.unit}</span>}
                  </span>
                  <button style={btn} disabled={!!status && status !== 'pending'} onClick={() => bump(l.key, 1)}>+</button>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    value={text[l.key]?.qty ?? (Number.isInteger(l.quantity) ? String(l.quantity) : '')}
                    min={1}
                    step={1}
                    title={`quantity in ${l.unit}`}
                    disabled={lockedForEdit}
                    onChange={(e) => setQuantityText(l.key, e.target.value)}
                    onBlur={() => { if (!isBadQty(l)) setDraft(l.key, 'qty', undefined); }}
                    style={{ ...input, width: 80, ...(isBadQty(l) ? { borderColor: '#d00' } : null) }}
                  />
                  <span style={{ fontSize: 13, color: '#888' }}>{l.unit}</span>
                  {isBadQty(l) && <span style={{ color: '#d00', fontSize: 13 }} title="Enter a quantity">*</span>}
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {!l.packSize && l.kind !== 'combo' && (
                <button
                  title={l.locked ? 'locked: price follows quantity' : 'unlocked: custom price'}
                  disabled={!!status && status !== 'pending'}
                  onClick={() => toggleLock(l.key)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    color: l.locked ? '#999' : '#1a73e8',
                    opacity: l.locked ? 0.6 : 0.95,
                  }}
                >
                  <LockGlyph open={!l.locked} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 13, color: '#888' }}>₹</span>
              <input
                type="number"
                value={text[l.key]?.price ?? (Number.isFinite(l.price) ? String(l.price / 100) : '')}
                min={0}
                step={0.01}
                title="line total in ₹ (editable = custom price)"
                disabled={lockedForEdit}
                onChange={(e) => setPriceText(l.key, e.target.value)}
                onBlur={() => { if (!isBadPrice(l)) setDraft(l.key, 'price', undefined); }}
                style={{ ...input, width: 90, ...(isBadPrice(l) ? { borderColor: '#d00' } : null) }}
              />
              {isBadPrice(l) && <span style={{ color: '#d00', fontSize: 13 }} title="Enter a price">*</span>}
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', fontSize: 18 }}>
        <span>Total</span>
        <strong>{paise(total)}</strong>
      </div>

      <input
        placeholder="Customer name (optional)"
        value={p.customerName}
        onChange={(e) => p.onCustomerChange(e.target.value, p.mobile)}
        style={{ ...input, width: '100%', marginBottom: 6, boxSizing: 'border-box' }}
      />
      <input
        placeholder="Mobile (optional)"
        value={p.mobile}
        onChange={(e) => p.onCustomerChange(p.customerName, e.target.value)}
        style={{ ...input, width: '100%', marginBottom: 10, boxSizing: 'border-box' }}
      />

      {!p.order && (
        <button
          style={{ ...primary, width: '100%', ...(p.lines.length === 0 || hasBadLine ? { opacity: 0.5 } : null) }}
          disabled={p.lines.length === 0 || hasBadLine || p.busy}
          onClick={p.onCreate}
        >
          {p.busy ? 'Saving…' : 'Create bill'}
        </button>
      )}

      {status === 'pending' && p.order && (
        <>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            Bill <code>{p.order.orderNo}</code> saved as <strong>PENDING</strong> — stock not deducted yet.
          </div>
          <button style={{ ...primary, width: '100%', marginBottom: 6 }} disabled={p.busy} onClick={() => p.onStatus('paid')}>
            Collect {paise(p.order.totalPrice)} — mark PAID
          </button>
          <button
            style={{ ...btn, width: '100%', marginBottom: 6, ...(hasBadLine ? { opacity: 0.5 } : null) }}
            disabled={p.busy || hasBadLine}
            onClick={p.onUpdateItems}
          >
            Save item changes
          </button>
          <button style={{ ...btn, width: '100%' }} disabled={p.busy} onClick={() => p.onStatus('cancelled')}>
            Cancel order
          </button>
        </>
      )}

      {status === 'paid' && p.order && (
        <>
          <div style={{ background: '#e6f7e6', border: '1px solid #6c6', borderRadius: 6, padding: 8, marginBottom: 8, fontSize: 14 }}>
            Paid {paise(p.order.totalPrice)} · stock deducted · <code>{p.order.orderNo}</code>
          </div>
          <button style={{ ...primary, width: '100%', marginBottom: 6 }} disabled={p.busy} onClick={() => p.onStatus('shipped')}>
            Mark Shipped
          </button>
          <button style={{ ...btn, width: '100%' }} onClick={p.onNewBill}>Start new bill</button>
        </>
      )}

      {status === 'shipped' && p.order && (
        <>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Shipped · <code>{p.order.orderNo}</code></div>
          <button style={{ ...primary, width: '100%', marginBottom: 6 }} disabled={p.busy} onClick={() => p.onStatus('delivered')}>
            Mark Delivered
          </button>
          <button style={{ ...btn, width: '100%' }} onClick={p.onNewBill}>Start new bill</button>
        </>
      )}

      {(status === 'delivered' || status === 'cancelled') && p.order && (
        <>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            {status === 'delivered' ? 'Delivered' : 'Cancelled'} · <code>{p.order.orderNo}</code> · {paise(p.order.totalPrice)}
          </div>
          <button style={{ ...btn, width: '100%' }} onClick={p.onNewBill}>Start new bill</button>
        </>
      )}
    </aside>
  );
}
