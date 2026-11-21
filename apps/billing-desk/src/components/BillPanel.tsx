import { useState } from 'react';
import type { Order, OrderStatus, QuantizedCount } from '@bqm/types';
import { rupees } from '../api';

/** Round rupees to 2 decimals. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Display language for product/combo names. 'en' (default): English dominant, Tamil subtle; 'ta': vice-versa. */
export type DisplayLang = 'en' | 'ta';

/** One editable row on the running bill. quantity is in base units. */
export interface DraftLine {
  key: string;
  kind: 'product' | 'combo';
  slug: string;
  name: string;
  /** Tamil display name snapshot — shown alone when lang is 'ta'. */
  tamilName?: string;
  step: number;
  quantity: number;
  price: number; // line total, rupees (2-decimal) — editable (custom price)
  /** Fixed pack size in base units — set only for tier (fixed-quantity) lines. */
  packSize?: number;
  /** Display unit (product stockUnit, '' for combos). */
  unit: string;
  /** Canonical rate in rupees/base-unit — set once for loose lines, never sent to backend. */
  unitPrice?: number;
  /** Loose-line qty⇄price sync. True by default; pack/combo lines never set it. */
  locked?: boolean;
  /** Resolved combo contents snapshot — display only, never sent to backend. */
  comboContents?: ComboContent[];
}

/**
 * Resolved combo component for display: name/unit snapshotted from the
 * catalog at add time, quantity copied from the combo doc (loose: base-unit
 * number, quantized: QuantizedCount array).
 */
export interface ComboContent {
  slug: string;
  name: string;
  tamilName?: string;
  unit: string;
  quantity: number | QuantizedCount[];
}

/** Display label for one combo component: `230g` loose, `200g × 5` quantized. */
export const comboContentLabel = (c: ComboContent): string =>
  Array.isArray(c.quantity)
    ? c.quantity.map((q) => `${q.size}${c.unit} × ${q.count}`).join(' + ')
    : `${c.quantity}${c.unit}`;

const LockGlyph = ({ open }: { open: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    {open ? <path d="M8 11V7a4 4 0 0 1 8 0" /> : <path d="M8 11V7a4 4 0 0 1 8 0v4" />}
  </svg>
);

interface Props {
  lines: DraftLine[];
  lang: DisplayLang;
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
  const lockedForEdit = !!status && status !== 'unconfirmed';

  // Raw text for fields being typed. Lets users clear/retype freely without the input snapping back
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
          return { ...l, quantity, price: r2(unitRate * quantity) };
        })
        .filter((l): l is DraftLine => l !== null),
    );
  };

  const setPrice = (key: string, price: number) => {
    if (!Number.isFinite(price) || price < 0) return;
    price = r2(price);
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
        return { ...l, quantity, price: r2(unitRate * quantity) };
      }),
    );
  };

  const setQuantityText = (key: string, raw: string) => {
    const n = Number(raw);
    const ok = raw.trim() !== '' && Number.isInteger(n) && n > 0;
    setDraft(key, 'qty', ok && String(n) === raw.trim() ? undefined : raw);
    if (ok) {
      setDraft(key, 'price', undefined);
      setQuantity(key, n);
    } else {
      p.onLinesChange(p.lines.map((l) => (l.key === key ? { ...l, quantity: NaN } : l)));
    }
  };

  const setPriceText = (key: string, raw: string) => {
    const v = Number(raw);
    const ok = raw.trim() !== '' && Number.isFinite(v) && v >= 0;
    setDraft(key, 'price', ok && String(v) === raw.trim() ? undefined : raw);
    if (ok) {
      setDraft(key, 'qty', undefined);
      setPrice(key, v);
    } else {
      p.onLinesChange(p.lines.map((l) => (l.key === key ? { ...l, price: NaN } : l)));
    }
  };

  const toggleLock = (key: string) => {
    const line = p.lines.find((l) => l.key === key);
    if (line && !line.locked) clearDrafts(key);
    p.onLinesChange(
      p.lines.map((l) => {
        if (l.key !== key) return l;
        if (l.locked) return { ...l, locked: false };
        const rate = l.unitPrice ?? 0;
        return { ...l, locked: true, price: r2(l.quantity * rate) };
      }),
    );
  };

  return (
    <aside
      style={{
        background: '#ffffff',
        border: '1px solid #DCE8C8',
        borderRadius: 14,
        padding: '16px 18px',
        alignSelf: 'start',
        position: 'sticky',
        top: 74,
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
        boxSizing: 'border-box',
      }}
    >
      {/* Bill Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 12,
          borderBottom: '1px solid #EAEFEA',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🧾</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800 }}>
              Current Bill
            </h3>
            <span style={{ fontSize: 11.5, color: '#68826D' }}>
              {p.lines.length} {p.lines.length === 1 ? 'item' : 'items'} in cart
            </span>
          </div>
        </div>

        {p.order ? (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              background: status === 'confirmed' ? '#E6F4EA' : '#FEF3C7',
              color: status === 'confirmed' ? '#137333' : '#B45309',
              border: `1px solid ${status === 'confirmed' ? '#A8DAB5' : '#FDE68A'}`,
              fontFamily: 'monospace',
            }}
          >
            #{p.order.orderNo}
          </span>
        ) : (
          p.lines.length > 0 && (
            <button
              onClick={p.onNewBill}
              title="Reset bill"
              style={{
                border: 'none',
                background: 'transparent',
                color: '#DC2626',
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 6,
              }}
            >
              Clear
            </button>
          )
        )}
      </div>

      {/* Bill Items Container */}
      <div
        style={{
          maxHeight: 330,
          overflowY: 'auto',
          paddingRight: 2,
          marginBottom: 14,
        }}
      >
        {p.lines.length === 0 ? (
          <div
            style={{
              padding: '36px 12px',
              textAlign: 'center',
              color: '#68826D',
              background: '#FBFDFB',
              borderRadius: 8,
              border: '1px dashed #DCE8C8',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>🛒</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#123B26' }}>Bill is empty</div>
            <div style={{ fontSize: 11.5, color: '#889988', marginTop: 2 }}>
              Tap "Add" on any product or combo to build the bill.
            </div>
          </div>
        ) : (
          p.lines.map((l) => (
            <div
              key={l.key}
              style={{
                borderBottom: '1px solid #F0F4F0',
                padding: '10px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* Top row: Item Name and Remove action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ fontSize: 13.5, color: '#123B26', lineHeight: 1.25 }}>
                  {p.lang === 'ta' ? (l.tamilName ?? l.name) : l.name}
                </strong>
                {!lockedForEdit && (
                  <button
                    title="Remove item"
                    onClick={() => removeLine(l.key)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: '2px 4px',
                      borderRadius: 4,
                      transition: 'color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Bottom row: Stepper / Qty Input + Lock + Price */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 24px 105px',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                  {l.packSize || l.kind === 'combo' ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: '#F7F5E8',
                        borderRadius: 6,
                        border: '1px solid #E8DFC8',
                        padding: '1px 2px',
                      }}
                    >
                      <button
                        disabled={!!status && status !== 'unconfirmed'}
                        onClick={() => bump(l.key, -1)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: 14,
                          color: '#123B26',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: '#123B26',
                          padding: '0 6px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {l.packSize ? l.quantity / l.packSize : l.quantity}
                        {l.packSize && <span style={{ color: '#68826D', fontWeight: 500, fontSize: 11 }}> pkts</span>}
                      </span>
                      <button
                        disabled={!!status && status !== 'unconfirmed'}
                        onClick={() => bump(l.key, 1)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: 14,
                          color: '#123B26',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="number"
                        value={text[l.key]?.qty ?? (Number.isInteger(l.quantity) ? String(l.quantity) : '')}
                        min={1}
                        step={1}
                        title={`Quantity in ${l.unit}`}
                        disabled={lockedForEdit}
                        onChange={(e) => setQuantityText(l.key, e.target.value)}
                        onBlur={() => {
                          if (!isBadQty(l)) setDraft(l.key, 'qty', undefined);
                        }}
                        style={{
                          width: 68,
                          padding: '4px 6px',
                          border: `1px solid ${isBadQty(l) ? '#DC2626' : '#DCE8C8'}`,
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#123B26',
                          background: '#fff',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: 11.5, color: '#557258', fontWeight: 600 }}>{l.unit}</span>
                      {isBadQty(l) && <span style={{ color: '#DC2626', fontSize: 12 }} title="Invalid quantity">*</span>}
                    </div>
                  )}
                </div>

                {/* Lock Glyph for loose lines */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {!l.packSize && l.kind !== 'combo' && (
                    <button
                      title={l.locked ? 'Locked: price follows weight' : 'Unlocked: custom price mode'}
                      disabled={!!status && status !== 'unconfirmed'}
                      onClick={() => toggleLock(l.key)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        color: l.locked ? '#889988' : '#2563EB',
                        opacity: l.locked ? 0.6 : 1,
                      }}
                    >
                      <LockGlyph open={!l.locked} />
                    </button>
                  )}
                </div>

                {/* Line Total Price Input */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                  <span style={{ fontSize: 12, color: '#557258', fontWeight: 600 }}>₹</span>
                  <input
                    type="number"
                    value={text[l.key]?.price ?? (Number.isFinite(l.price) ? String(l.price) : '')}
                    min={0}
                    step={0.01}
                    title="Line total in ₹ (editable)"
                    disabled={lockedForEdit}
                    onChange={(e) => setPriceText(l.key, e.target.value)}
                    onBlur={() => {
                      if (!isBadPrice(l)) setDraft(l.key, 'price', undefined);
                    }}
                    style={{
                      width: 82,
                      padding: '4px 6px',
                      border: `1px solid ${isBadPrice(l) ? '#DC2626' : '#DCE8C8'}`,
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#123B26',
                      background: '#fff',
                      textAlign: 'right',
                      outline: 'none',
                    }}
                  />
                  {isBadPrice(l) && <span style={{ color: '#DC2626', fontSize: 12 }} title="Invalid price">*</span>}
                </div>
              </div>

              {/* Combo Contents summary */}
              {l.kind === 'combo' && l.comboContents && l.comboContents.length > 0 && (
                <div style={{ fontSize: 11, color: '#68826D', background: '#F8FAF8', padding: '3px 6px', borderRadius: 4 }}>
                  {l.comboContents.map((cc) => (
                    <div key={cc.slug}>
                      • {p.lang === 'ta' ? (cc.tamilName ?? cc.name) : cc.name} ({comboContentLabel(cc)})
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Customer Information Group */}
      <div
        style={{
          background: '#FBFDFB',
          border: '1px solid #EAEFEA',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#205C38', textTransform: 'uppercase', marginBottom: 6 }}>
          Customer Details (Optional)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: 6, fontSize: 12 }}>👤</span>
            <input
              placeholder="Customer Name"
              value={p.customerName}
              onChange={(e) => p.onCustomerChange(e.target.value, p.mobile)}
              style={{
                width: '100%',
                padding: '6px 8px 6px 28px',
                border: '1px solid #DCE8C8',
                borderRadius: 6,
                fontSize: 12,
                color: '#123B26',
                background: '#fff',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: 6, fontSize: 12 }}>📞</span>
            <input
              placeholder="Mobile Number"
              value={p.mobile}
              onChange={(e) => p.onCustomerChange(p.customerName, e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px 6px 28px',
                border: '1px solid #DCE8C8',
                borderRadius: 6,
                fontSize: 12,
                color: '#123B26',
                background: '#fff',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bill Grand Total Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F7F5E8',
          border: '1px solid #E8DFC8',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
        }}
      >
        <div>
          <span style={{ fontSize: 11.5, color: '#557258', fontWeight: 600, display: 'block' }}>
            Total Payable
          </span>
          <span style={{ fontSize: 10.5, color: '#889988' }}>
            {p.lines.length} {p.lines.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <strong style={{ fontSize: 20, color: '#123B26', fontWeight: 800 }}>
          {rupees(total)}
        </strong>
      </div>

      {/* Action Buttons: Create Bill, Confirm, Update, or Reset */}
      {!p.order && (
        <button
          style={{
            width: '100%',
            background: p.lines.length === 0 || hasBadLine || p.busy ? '#A8BAA8' : '#123B26',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '11px 16px',
            fontSize: 14.5,
            fontWeight: 800,
            letterSpacing: '0.01em',
            cursor: p.lines.length === 0 || hasBadLine || p.busy ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(18,59,38,0.2)',
            transition: 'background 0.15s ease',
          }}
          disabled={p.lines.length === 0 || hasBadLine || p.busy}
          onClick={p.onCreate}
          onMouseEnter={(e) => {
            if (p.lines.length > 0 && !hasBadLine && !p.busy) e.currentTarget.style.background = '#205C38';
          }}
          onMouseLeave={(e) => {
            if (p.lines.length > 0 && !hasBadLine && !p.busy) e.currentTarget.style.background = '#123B26';
          }}
        >
          {p.busy ? 'Saving Bill…' : 'Generate Bill →'}
        </button>
      )}

      {status === 'unconfirmed' && p.order && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontSize: 12,
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              borderRadius: 6,
              padding: '6px 10px',
              fontWeight: 500,
            }}
          >
            Bill <strong>{p.order.orderNo}</strong> saved. Stock is not yet deducted.
          </div>

          <button
            style={{
              width: '100%',
              background: '#205C38',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: 800,
              cursor: p.busy ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(32,92,56,0.25)',
              transition: 'background 0.12s ease',
            }}
            disabled={p.busy}
            onClick={() => p.onStatus('confirmed')}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#123B26')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#205C38')}
          >
            {p.busy ? 'Deducting Stock…' : 'Confirm Order — Deduct Stock ✓'}
          </button>

          <button
            style={{
              width: '100%',
              background: '#F7F5E8',
              color: '#123B26',
              border: '1px solid #E8DFC8',
              borderRadius: 6,
              padding: '7px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: p.busy || hasBadLine ? 'not-allowed' : 'pointer',
              opacity: hasBadLine ? 0.6 : 1,
            }}
            disabled={p.busy || hasBadLine}
            onClick={p.onUpdateItems}
          >
            Save Item Changes
          </button>
        </div>
      )}

      {status === 'confirmed' && p.order && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              background: '#E6F4EA',
              border: '1px solid #A8DAB5',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
              color: '#137333',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div style={{ fontWeight: 800 }}>✓ Order Confirmed</div>
            <div style={{ fontSize: 12 }}>
              Total: <strong>{rupees(p.order.totalPrice)}</strong> · Stock Deducted · #{p.order.orderNo}
            </div>
          </div>

          <button
            style={{
              width: '100%',
              background: '#123B26',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(18,59,38,0.2)',
            }}
            onClick={p.onNewBill}
          >
            Start New Bill +
          </button>
        </div>
      )}
    </aside>
  );
}
