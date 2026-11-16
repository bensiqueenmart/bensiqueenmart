import { useState } from 'react';
import type { Product } from '@bqm/types';
import { paise } from '../api';
import type { DisplayLang } from './BillPanel';

const card: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 10, background: '#fff' };
const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };
const input: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 };

interface Props {
  product: Product;
  lang: DisplayLang;
  onAddTier: (product: Product, quantity: number, price: number) => void;
  onAddLoose: (product: Product, quantity: number) => void;
  onAddLooseByPrice: (product: Product, pricePaise: number) => void;
}

export default function ProductCard({ product: p, lang, onAddTier, onAddLoose, onAddLooseByPrice }: Props) {
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
  const derivedQty = priceOk ? Math.max(1, Math.round((priceNum * 100) / rate)) : 0;

  const addLooseClicked = () => {
    if (usePrice) {
      onAddLooseByPrice(p, Math.round(priceNum * 100));
    } else if (qtyOk) {
      onAddLoose(p, qtyNum);
    } else {
      return;
    }
    setLooseQty('');
    setLoosePrice('');
    setLooseLast(null);
  };

  return (
    <div style={card}>
      {p.image && imgOk ? (
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          onError={() => setImgOk(false)}
          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
        />
      ) : (
        <div style={{ width: '100%', height: 120, borderRadius: 6, marginBottom: 8, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#888' }}>
          no photo
        </div>
      )}
      <strong>{lang === 'ta' ? (p.tamilName ?? p.name) : p.name}</strong>
      {p.tamilName && (
        <div style={{ fontSize: 16, color: '#666' }}>{lang === 'ta' ? p.name : p.tamilName}</div>
      )}
      <div style={{ fontSize: 12, color: '#666' }}>
        {p.category} · stock: {Array.isArray(p.stock)
          ? (p.stock.length > 0
            ? p.stock.map((b) => `${b.count}×${b.size}${p.stockUnit}`).join(' + ')
            : 'out of stock')
          : `${p.stock}${p.stockUnit}`}
      </div>

      {hasTiers ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <select value={tierIdx} onChange={(e) => setTierIdx(Number(e.target.value))} style={{ ...input, flex: 1 }}>
            {tiers.map((t, i) => (
              <option key={t.quantity} value={i}>
                {t.quantity}{p.stockUnit} · {paise(t.price)}
              </option>
            ))}
          </select>
          <button style={btn} onClick={() => onAddTier(p, tiers[tierIdx].quantity, tiers[tierIdx].price)}>Add</button>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              min={1}
              placeholder={`qty (${p.stockUnit})`}
              value={looseQty}
              onChange={(e) => { setLooseQty(e.target.value); setLooseLast('qty'); }}
              style={{ ...input, flex: 1, minWidth: 0 }}
            />
            <input
              type="number"
              min={0.01}
              step={0.01}
              placeholder="₹ price"
              value={loosePrice}
              disabled={!canPrice}
              title={canPrice ? 'line total in ₹ — quantity derives from the unit rate' : 'no unit rate — add by quantity, set the price on the bill'}
              onChange={(e) => { setLoosePrice(e.target.value); setLooseLast('price'); }}
              style={{ ...input, flex: 1, minWidth: 0 }}
            />
            <button style={{ ...btn, ...(!canAdd ? { opacity: 0.5 } : null) }} disabled={!canAdd} onClick={addLooseClicked}>
              Add
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {!canPrice
              ? 'price not set — enter line total on the bill'
              : priceOk
                ? `≈ ${derivedQty}${p.stockUnit} for ₹${priceNum}`
                : `${paise(rate)}/${p.stockUnit}`}
          </div>
        </div>
      )}
    </div>
  );
}
