import React from 'react';
import type { ComboSalesStat } from '@bqm/types';
import { rupees } from '../../api';

interface Props {
  combos?: ComboSalesStat[];
}

export default function ComboSalesSection({ combos = [] }: Props) {
  const safeCombos = Array.isArray(combos) ? combos : [];
  const totalUnits = safeCombos.reduce((sum, c) => sum + (c.unitsSold || 0), 0);
  const totalRev = safeCombos.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  const topCombo = safeCombos.find((c) => c.unitsSold > 0 || c.totalRevenue > 0);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DCE8C8',
        borderRadius: 14,
        padding: '18px 22px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Combo Sales Analysis
            </h4>
            <span style={{ fontSize: 11, background: '#F7F5E8', color: '#205C38', padding: '3px 9px', borderRadius: 6, fontWeight: 700, border: '1px solid #E8DFC8' }}>
              {combos.length} Combos Configured
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#557258', marginTop: 2, display: 'inline-block' }}>
            Multi-product package performance. Tracked independently to avoid double-counting.
          </span>
        </div>
      </div>

      {/* Mini KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#F7F5E8', border: '1px solid #E8DFC8', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#557258', fontWeight: 600 }}>Total Combos Sold</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#123B26', marginTop: 2 }}>{totalUnits} units</div>
        </div>

        <div style={{ background: '#F7F5E8', border: '1px solid #E8DFC8', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#557258', fontWeight: 600 }}>Combo Revenue</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#123B26', marginTop: 2 }}>{rupees(totalRev)}</div>
        </div>

        <div style={{ background: '#F7F5E8', border: '1px solid #E8DFC8', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#557258', fontWeight: 600 }}>Top Performing Combo</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#123B26', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topCombo ? topCombo.name : '—'}
          </div>
          {topCombo && topCombo.tamilName && (
            <div style={{ fontSize: 11, color: '#557258' }}>{topCombo.tamilName}</div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E8DFC8' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F7F5E8', borderBottom: '1px solid #DCE8C8', color: '#123B26', fontSize: 12, fontWeight: 700 }}>
              <th style={{ padding: '10px 12px' }}>Combo Name</th>
              <th style={{ padding: '10px 12px' }}>Tamil Name</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Units Sold</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Orders Count</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Revenue</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>% Share</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((c) => {
              const hasSales = c.unitsSold > 0 || c.totalRevenue > 0;
              return (
                <tr key={c.comboId} style={{ borderBottom: '1px solid #edf2ed', background: hasSales ? '#fff' : '#f9fbf9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: hasSales ? 600 : 500, color: hasSales ? '#163b22' : '#738576' }}>
                    {c.name}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#68826d', fontSize: 12 }}>
                    {c.tamilName || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: hasSales ? 600 : 400 }}>
                    {c.unitsSold}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {c.ordersCount}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: hasSales ? 700 : 400, color: hasSales ? '#163b22' : '#888' }}>
                    {hasSales ? rupees(c.totalRevenue) : '₹0.00'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#557258', fontSize: 12 }}>
                    {c.percentOfTotalSales > 0 ? `${c.percentOfTotalSales}%` : '—'}
                  </td>
                </tr>
              );
            })}
            {combos.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                  No combos found in system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

