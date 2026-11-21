import React, { useEffect, useState } from 'react';
import type { ProductSalesDetailResponse } from '@bqm/types';
import { getProductSalesDetail, rupees, formatSafeDateTime } from '../../api';

interface Props {
  productId: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onError: (msg: string) => void;
}

export default function ProductDrilldownModal({ productId, startDate, endDate, onClose, onError }: Props) {
  const [detail, setDetail] = useState<ProductSalesDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProductSalesDetail(productId, startDate, endDate)
      .then((data) => {
        if (active) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setLoading(false);
          onError(`Failed to load product details: ${String(err)}`);
        }
      });

    return () => {
      active = false;
    };
  }, [productId, startDate, endDate, onError]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: '#123B26',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>
              {detail?.stats.name || (loading ? 'Loading Product…' : 'Product Sales Details')}
            </div>
            {detail?.stats.tamilName && (
              <div style={{ fontSize: 13, color: '#A8C66C', marginTop: 2, fontWeight: 600 }}>
                {detail.stats.tamilName} · {detail.stats.category}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: 30, color: '#668069' }}>Loading product sales details…</p>
          ) : detail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div style={{ background: '#f4f8f4', padding: 12, borderRadius: 8, border: '1px solid #d8e5d8' }}>
                  <div style={{ fontSize: 11, color: '#607963' }}>Total Revenue</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#163b22' }}>
                    {rupees(detail.stats.totalRevenue)}
                  </div>
                </div>

                <div style={{ background: '#f4f8f4', padding: 12, borderRadius: 8, border: '1px solid #d8e5d8' }}>
                  <div style={{ fontSize: 11, color: '#607963' }}>Quantity Sold</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#163b22' }}>
                    {detail.stats.quantityDisplay}
                  </div>
                </div>

                <div style={{ background: '#f4f8f4', padding: 12, borderRadius: 8, border: '1px solid #d8e5d8' }}>
                  <div style={{ fontSize: 11, color: '#607963' }}>Orders Count</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#163b22' }}>
                    {detail.stats.ordersCount}
                  </div>
                </div>

                <div style={{ background: '#f4f8f4', padding: 12, borderRadius: 8, border: '1px solid #d8e5d8' }}>
                  <div style={{ fontSize: 11, color: '#607963' }}>Current Stock</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2d6037' }}>
                    {detail.stats.currentStockDisplay}
                  </div>
                </div>
              </div>

              {/* Quantized Pack Breakdown */}
              {detail.stats.isQuantized && detail.stats.packBreakdown.length > 0 && (
                <div style={{ background: '#fafbfa', border: '1px solid #e1ebe1', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#163b22', marginBottom: 8 }}>
                    Pack Size Distribution Sold
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {detail.stats.packBreakdown.map((b) => (
                      <span
                        key={b.size}
                        style={{
                          background: '#fff',
                          border: '1px solid #c8d8c8',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#1a3b20',
                          fontWeight: 500,
                        }}
                      >
                        <strong>{b.size}{detail.stats.stockUnit}</strong>: {b.count} packs
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Orders */}
              <div>
                <h5 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#163b22' }}>
                  Orders Containing this Product ({detail.recentOrders.length})
                </h5>
                <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e2ece2', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#edf3ed', borderBottom: '1px solid #d5dfd5' }}>
                        <th style={{ padding: '8px 10px' }}>Order No</th>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                        <th style={{ padding: '8px 10px' }}>Customer</th>
                        <th style={{ padding: '8px 10px' }}>Quantity</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Line Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.recentOrders.map((o) => (
                        <tr key={o.id + o.orderNo} style={{ borderBottom: '1px solid #f0f4f0' }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600 }}>
                            {o.orderNo}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#668069' }}>
                            {formatSafeDateTime(o.createdAt)}
                          </td>
                          <td style={{ padding: '8px 10px' }}>{o.customerName}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 500 }}>{o.quantityDisplay}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#163b22' }}>
                            {rupees(o.price)}
                          </td>
                        </tr>
                      ))}
                      {detail.recentOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#888' }}>
                            No confirmed orders in this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#888' }}>Product not found.</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #edf2ed', textAlign: 'right', background: '#fafbfa' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              background: '#163b22',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

