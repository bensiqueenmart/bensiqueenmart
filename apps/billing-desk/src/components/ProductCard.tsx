import { useState } from 'react';
import type { Product } from '@bqm/types';
import { paise } from '../api';

const card: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 10, background: '#fff' };
const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };
const input: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 };

interface Props {
  product: Product;
  onAddTier: (product: Product, quantity: number, price: number) => void;
  onAddLoose: (product: Product, quantity: number) => void;
}

export default function ProductCard({ product: p, onAddTier, onAddLoose }: Props) {
  const tiers = p.quantityPrice ?? [];
  const [tierIdx, setTierIdx] = useState(0);
  const [looseQty, setLooseQty] = useState('');
  const [imgOk, setImgOk] = useState(true);

  const hasTiers = p.isQuantized && tiers.length > 0;

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
      <strong>{p.name}</strong>
      {p.tamilName && <div style={{ fontSize: 12, color: '#666' }}>{p.tamilName}</div>}
      <div style={{ fontSize: 12, color: '#666' }}>
        {p.category} · stock: {p.stockPacks && p.stockPacks.length > 0
          ? p.stockPacks.map((b) => `${b.count}×${b.size}${p.stockUnit}`).join(' + ')
          : p.stockPacks && p.stockPacks.length === 0
            ? 'out of stock'
            : `${p.stockBaseQty}${p.stockUnit}`}
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
              onChange={(e) => setLooseQty(e.target.value)}
              style={{ ...input, width: 110 }}
            />
            <button style={btn} onClick={() => { const q = Number(looseQty); if (q > 0) { onAddLoose(p, q); setLooseQty(''); } }}>
              Add
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {p.pricePerUnit ? `${paise(p.pricePerUnit)}/${p.stockUnit}` : 'price not set — enter line total on the bill'}
          </div>
        </div>
      )}
    </div>
  );
}
