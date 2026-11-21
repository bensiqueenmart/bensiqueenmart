import { useState } from 'react';
import type { Combo } from '@bqm/types';
import { rupees } from '../api';
import { comboContentLabel, type ComboContent, type DisplayLang } from './BillPanel';

interface Props {
  combo: Combo;
  lang: DisplayLang;
  contents: ComboContent[];
  onAdd: (combo: Combo) => void;
}

export default function ComboCard({ combo: c, lang, contents, onAdd }: Props) {
  const [imgOk, setImgOk] = useState(true);

  const primaryName = lang === 'ta' ? (c.tamilName ?? c.name) : c.name;
  const secondaryName = lang === 'ta' ? c.name : c.tamilName;

  return (
    <div
      style={{
        background: '#FFFDF7',
        border: '1px solid #E8DFC8',
        borderRadius: 14,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(242, 201, 76, 0.2)';
        e.currentTarget.style.borderColor = '#F2C94C';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.03)';
        e.currentTarget.style.borderColor = '#E8DFC8';
      }}
    >
      <div>
        {/* Image / Fallback */}
        <div style={{ position: 'relative', width: '100%', height: 110, marginBottom: 10 }}>
          {imgOk ? (
            <img
              src={`/images/${c.slug}.jpg`}
              alt={c.name}
              loading="lazy"
              onError={() => setImgOk(false)}
              style={{
                width: '100%',
                height: 110,
                objectFit: 'cover',
                borderRadius: 10,
                background: '#FDF7E7',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: 110,
                borderRadius: 10,
                background: '#FDF7E7',
                border: '1px dashed #E8DFC8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              🎁
            </div>
          )}

          {/* Value Combo Badge */}
          <span
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              background: '#FEF3C7',
              color: '#92400E',
              fontSize: 10.5,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid #FDE68A',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            ⭐ VALUE COMBO
          </span>
        </div>

        {/* Combo Title */}
        <div style={{ minHeight: 40 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: '#123B26',
              lineHeight: 1.3,
            }}
          >
            {primaryName}
          </div>
          {secondaryName && (
            <div style={{ fontSize: 12, color: '#557258', marginTop: 2 }}>
              {secondaryName}
            </div>
          )}
        </div>

        {/* Contents Checklist */}
        <div
          style={{
            fontSize: 12,
            color: '#475569',
            background: '#FBF8F0',
            border: '1px solid #F0E8D5',
            borderRadius: 8,
            padding: '8px 10px',
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', marginBottom: 4 }}>
            Includes {contents.length} Items:
          </div>
          {contents.map((cc) => {
            const primary = lang === 'ta' ? (cc.tamilName ?? cc.name) : cc.name;
            return (
              <div
                key={cc.slug}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  padding: '3px 0',
                  borderBottom: '1px dotted #EAE2CF',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  • {primary}
                </span>
                <span style={{ fontWeight: 600, color: '#123B26', whiteSpace: 'nowrap', fontSize: 11 }}>
                  {comboContentLabel(cc)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Price & Add Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: '1px solid #F0E8D5',
        }}
      >
        <div>
          <span style={{ fontSize: 10.5, color: '#78716C', display: 'block', fontWeight: 600 }}>Package Price</span>
          <strong style={{ fontSize: 17, color: '#123B26', fontWeight: 800 }}>
            {rupees(c.totalPrice)}
          </strong>
        </div>

        <button
          onClick={() => onAdd(c)}
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
          Add Combo +
        </button>
      </div>
    </div>
  );
}
