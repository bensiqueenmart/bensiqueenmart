import { useState } from 'react';
import type { Combo } from '@bqm/types';
import { paise } from '../api';

const card: React.CSSProperties = { border: '1px solid #e0a100', borderRadius: 8, padding: 10, background: '#fff8e6' };
const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };

export default function ComboCard({ combo: c, onAdd }: { combo: Combo; onAdd: (combo: Combo) => void }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div style={card}>
      {imgOk && (
        <img
          src={`/images/${c.slug}.jpg`}
          alt=""
          loading="lazy"
          onError={() => setImgOk(false)}
          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
        />
      )}
      <strong>{c.name}</strong>
      <div style={{ fontSize: 12, color: '#555' }}>{c.products.join(' + ')}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <strong>{paise(c.totalPrice)}</strong>
        <button style={btn} onClick={() => onAdd(c)}>Add</button>
      </div>
    </div>
  );
}
