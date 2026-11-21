import React from 'react';
import type { ProductSalesStat } from '@bqm/types';
import { rupees } from '../../api';

interface Props {
  products?: ProductSalesStat[];
  onSelectProduct: (productId: string) => void;
}

export default function TopProductsRanking({ products = [], onSelectProduct }: Props) {
  const safeProducts = Array.isArray(products) ? products : [];
  // Filter only items with sales, take top 6
  const topList = safeProducts.filter((p) => p.totalRevenue > 0 || p.ordersCount > 0).slice(0, 6);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DCE8C8',
        borderRadius: 14,
        padding: '18px 22px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Top Selling Products
            </h4>
            <span style={{ fontSize: 12, color: '#557258', marginTop: 2, display: 'inline-block' }}>
              Highest grossing products in period
            </span>
          </div>
          <span style={{ fontSize: 11, background: '#F7F5E8', color: '#205C38', padding: '3px 9px', borderRadius: 6, fontWeight: 700, border: '1px solid #E8DFC8' }}>
            Top {topList.length}
          </span>
        </div>

        {topList.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>
            No product sales recorded in this date range.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topList.map((prod, idx) => (
              <div
                key={prod.productId}
                onClick={() => onSelectProduct(prod.productId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: idx === 0 ? '#F7F5E8' : '#fafbfa',
                  border: idx === 0 ? '1px solid #E8DFC8' : '1px solid #edf2ed',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#eef5ee')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = idx === 0 ? '#F7F5E8' : '#fafbfa')
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: idx === 0 ? '#123B26' : idx === 1 ? '#205C38' : '#DCE8C8',
                      color: idx < 2 ? '#fff' : '#123B26',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#123B26', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#68826d', marginTop: 1 }}>
                      {prod.tamilName && <span>{prod.tamilName} · </span>}
                      <span>{prod.quantityDisplay}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#123B26' }}>
                    {rupees(prod.totalRevenue)}
                  </div>
                  <div style={{ fontSize: 11, color: '#205C38', fontWeight: 500 }}>
                    {prod.ordersCount} {prod.ordersCount === 1 ? 'order' : 'orders'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: '#68826d' }}>
        Click any product to inspect full order history and pack breakdown
      </div>
    </div>
  );
}

