import { useState } from 'react';
import type { Combo } from '@bqm/types';
import { rupees } from '../api';
import { comboContentLabel, type ComboContent, type DisplayLang } from './BillPanel';

const card: React.CSSProperties = { border: '1px solid #e0a100', borderRadius: 8, padding: 10, background: '#fff8e6', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };

export default function ComboCard({ combo: c, lang, contents, onAdd }: { combo: Combo; lang: DisplayLang; contents: ComboContent[]; onAdd: (combo: Combo) => void }) {
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
      <strong style={{ fontSize: 15 }}>{lang === 'ta' ? (c.tamilName ?? c.name) : c.name}</strong>
      {c.tamilName && (
        <div style={{ fontSize: 16, color: '#666' }}>{lang === 'ta' ? c.name : c.tamilName}</div>
      )}
      <div style={{ fontSize: 16, color: '#555' }}>
        {contents.map((cc) => {
          const primary = lang === 'ta' ? (cc.tamilName ?? cc.name) : cc.name;
          return (
            <div key={cc.slug} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#1a1a1a' }}><strong>{primary}</strong></div>
                {cc.tamilName && (
                  <div style={{ color: '#888' }}>{lang === 'ta' ? cc.name : cc.tamilName}</div>
                )}
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{comboContentLabel(cc)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
        <strong>{rupees(c.totalPrice)}</strong>
        <button style={btn} onClick={() => onAdd(c)}>Add</button>
      </div>
    </div>
  );
}
