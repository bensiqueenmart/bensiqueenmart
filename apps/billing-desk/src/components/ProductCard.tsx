import { useState } from 'react';
import type { Product } from '@bqm/types';
import { rupees } from '../api';
import type { DisplayLang } from './BillPanel';

/** Round rupees to 2 decimals. */
const r2 = (n: number) => Math.round(n * 100) / 100;

interface Props {
  product: Product;
  lang: DisplayLang;
  onAddTier: (product: Product, quantity: number, price: number) => void;
  onAddLoose: (product: Product, quantity: number) => void;
  onAddLooseByPrice: (product: Product, priceRupees: number) => void;
}

export default function ProductCard({
  product: p,
  lang,
  onAddTier,
  onAddLoose,
  onAddLooseByPrice,
}: Props) {
  const tiers = p.quantityPrice ?? [];
  const [tierIdx, setTierIdx] = useState(0);
  const [looseQty, setLooseQty] = useState('');
  const [loosePrice, setLoosePrice] = useState('');
  const [looseLast, setLooseLast] = useState<'qty' | 'price' | null>(null);
  const [imgOk, setImgOk] = useState(true);

  const hasTiers = p.isQuantized && tiers.length > 0;
  const rate = p.pricePerUnit ?? 0;
  const canPrice = rate > 0;

  const qtyNum = Number(looseQty);
  const qtyOk = looseQty.trim() !== '' && Number.isFinite(qtyNum) && qtyNum > 0;
  const priceNum = Number(loosePrice);
  const priceOk = canPrice && loosePrice.trim() !== '' && Number.isFinite(priceNum) && priceNum > 0;
  // The field touched most recently wins when both hold valid values.
  const usePrice = priceOk && (!qtyOk || looseLast === 'price');
  const canAdd = qtyOk || priceOk;
  const derivedQty = priceOk ? Math.max(1, Math.round(priceNum / rate)) : 0;

  const addLooseClicked = () => {
    if (usePrice) {
      onAddLooseByPrice(p, r2(priceNum));
    } else if (qtyOk) {
      onAddLoose(p, qtyNum);
    } else {
      return;
    }
    setLooseQty('');
    setLoosePrice('');
    setLooseLast(null);
  };

  // Stock representation
  const stockInfo = Array.isArray(p.stock)
    ? p.stock.length > 0
      ? p.stock.map((b) => `${b.count}×${b.size}${p.stockUnit}`).join(' + ')
      : 'Out of stock'
    : `${p.stock}${p.stockUnit}`;

  const isOutOfStock = Array.isArray(p.stock) ? p.stock.length === 0 : Number(p.stock) <= 0;

  const primaryName = lang === 'ta' ? (p.tamilName ?? p.name) : p.name;
  const secondaryName = lang === 'ta' ? p.name : p.tamilName;

  return (
    <div className="pos-product-card">
      <div>
        {/* Product Image */}
        <div style={{ position: 'relative', width: '100%', height: 125, marginBottom: 10 }}>
          {p.image && imgOk ? (
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              onError={() => setImgOk(false)}
              style={{
                width: '100%',
                height: 125,
                objectFit: 'cover',
                borderRadius: 10,
                background: '#F7F5E8',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: 125,
                borderRadius: 10,
                background: '#F7F5E8',
                border: '1px dashed #DCE8C8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                color: '#557258',
              }}
            >
              <span style={{ fontSize: 24 }}>🌿</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{p.category}</span>
            </div>
          )}

          {/* Category Badge Floating on Image */}
          <span
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(4px)',
              color: '#123B26',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid #DCE8C8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {p.category}
          </span>
        </div>

        {/* Product Name (Primary & Secondary Language) */}
        <div style={{ minHeight: 44 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: '#123B26',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={primaryName}
          >
            {primaryName}
          </div>
          {secondaryName && (
            <div
              style={{
                fontSize: 12,
                color: '#557258',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {secondaryName}
            </div>
          )}
        </div>

        {/* Stock Information */}
        <div
          style={{
            fontSize: 11,
            color: isOutOfStock ? '#DC2626' : '#557258',
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isOutOfStock ? '#DC2626' : '#16A34A',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 500 }}>
            Stock: <strong>{stockInfo}</strong>
          </span>
        </div>
      </div>

      {/* Pricing and Add-to-Bill Controls */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F0F4F0' }}>
        {hasTiers ? (
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select
                value={tierIdx}
                onChange={(e) => setTierIdx(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  border: '1px solid #DCE8C8',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#123B26',
                  background: '#FDFEFD',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {tiers.map((t, i) => (
                  <option key={t.quantity} value={i}>
                    {t.quantity} {p.stockUnit} · {rupees(t.price)}
                  </option>
                ))}
              </select>

              <button
                onClick={() => onAddTier(p, tiers[tierIdx].quantity, tiers[tierIdx].price)}
                style={{
                  background: '#205C38',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 14px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 1px 3px rgba(32,92,56,0.25)',
                  transition: 'background 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#123B26')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#205C38')}
              >
                Add +
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#557258', marginTop: 4, textAlign: 'right' }}>
              Unit: <strong>{rupees(tiers[tierIdx]?.price || 0)}</strong>
            </div>
          </div>
        ) : (
          <div>
            {/* Loose Rate Indicator */}
            {canPrice && (
              <div style={{ fontSize: 11, color: '#557258', marginBottom: 6, display: 'flex', justifyContent: 'space-between', background: '#F7F5E8', padding: '3px 8px', borderRadius: 4, border: '1px solid #E8DFC8' }}>
                <span>Rate: <strong>{rupees(rate)}/{p.stockUnit}</strong></span>
                {priceOk && usePrice && (
                  <span style={{ color: '#205C38', fontWeight: 600 }}>~{derivedQty}{p.stockUnit}</span>
                )}
              </div>
            )}

            {/* Inputs: By Qty or By Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              <div>
                <input
                  type="number"
                  min={1}
                  placeholder={`Qty (${p.stockUnit})`}
                  value={looseQty}
                  onChange={(e) => {
                    setLooseQty(e.target.value);
                    setLooseLast('qty');
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #DCE8C8',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#123B26',
                    background: '#FDFEFD',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="Price (₹)"
                  value={loosePrice}
                  onChange={(e) => {
                    setLoosePrice(e.target.value);
                    setLooseLast('price');
                  }}
                  disabled={!canPrice}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #DCE8C8',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#123B26',
                    background: canPrice ? '#FDFEFD' : '#F5F5F5',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Add Loose Button */}
            <button
              disabled={!canAdd}
              onClick={addLooseClicked}
              style={{
                width: '100%',
                background: canAdd ? '#205C38' : '#E8EFE8',
                color: canAdd ? '#fff' : '#889988',
                border: 'none',
                borderRadius: 6,
                padding: '7px 10px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: canAdd ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                boxShadow: canAdd ? '0 1px 3px rgba(32,92,56,0.25)' : 'none',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                if (canAdd) e.currentTarget.style.background = '#123B26';
              }}
              onMouseLeave={(e) => {
                if (canAdd) e.currentTarget.style.background = '#205C38';
              }}
            >
              Add Loose +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
