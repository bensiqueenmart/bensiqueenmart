import React from 'react';
import type { Order } from '@bqm/types';
import { rupees, formatSafeDateTime } from '../../api';

interface Props {
  order: Order | null;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: Props) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isConfirmed = order.status === 'confirmed';

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
        id="printable-order-receipt"
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 680,
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
            <div style={{ fontSize: 13, color: '#A8C66C', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Order Details
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace' }}>
              {order.orderNo}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8faf8', padding: 14, borderRadius: 8, border: '1px solid #dce8dc' }}>
            <div>
              <div style={{ fontSize: 11, color: '#668069' }}>Date &amp; Time:</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#163b22' }}>
                {formatSafeDateTime(order.createdAt)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#668069' }}>Order Channel:</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#163b22' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    background: order.source === 'online' ? '#dbeafe' : '#fef3c7',
                    color: order.source === 'online' ? '#1e40af' : '#92400e',
                  }}
                >
                  {order.source === 'online' ? 'Online Store' : 'In-Store POS'}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#668069' }}>Payment &amp; Status:</div>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: isConfirmed ? '#dcfce7' : '#fee2e2',
                    color: isConfirmed ? '#166534' : '#991b1b',
                  }}
                >
                  {isConfirmed ? '✓ Confirmed (Stock Deducted)' : '⏳ Unconfirmed / Draft'}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#668069' }}>Total Bill Amount:</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#163b22' }}>
                {rupees(order.totalPrice)}
              </div>
            </div>
          </div>

          {/* Customer Details */}
          {(order.customerData?.customerName || order.customerData?.mobile || order.customerData?.fullAddress) && (
            <div style={{ background: '#fff', border: '1px solid #e1ebe1', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#275231', marginBottom: 6 }}>
                Customer Information
              </div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {order.customerData.customerName && (
                  <div>
                    <span style={{ color: '#668069' }}>Name:</span>{' '}
                    <strong>{order.customerData.customerName}</strong>
                  </div>
                )}
                {order.customerData.mobile && (
                  <div>
                    <span style={{ color: '#668069' }}>Mobile:</span>{' '}
                    <strong>{order.customerData.mobile}</strong>
                  </div>
                )}
                {order.customerData.fullAddress && (
                  <div>
                    <span style={{ color: '#668069' }}>Address:</span>{' '}
                    <span>{order.customerData.fullAddress}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#163b22', marginBottom: 8 }}>
              Order Line Items ({order.orderItems?.length || 0})
            </div>
            <div style={{ border: '1px solid #e2ece2', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#edf3ed', borderBottom: '1px solid #d5dfd5', fontSize: 12, color: '#344d38' }}>
                    <th style={{ padding: '8px 10px' }}>Item Description</th>
                    <th style={{ padding: '8px 10px' }}>Quantity / Measure</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.orderItems || []).map((it, idx) => {
                    let qtyStr = '';
                    if (Array.isArray(it.quantity)) {
                      qtyStr = it.quantity.map((q) => `${q.count} × ${q.size}${it.stockUnit || 'g'}`).join(', ');
                    } else if (it.comboSlug || it.comboId) {
                      qtyStr = `${it.quantity} combo ${it.quantity === 1 ? 'pack' : 'packs'}`;
                    } else {
                      qtyStr = `${it.quantity} ${it.stockUnit || ''}`;
                    }

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f0f4f0' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 600, color: '#163b22' }}>{it.name}</div>
                          {it.tamilName && (
                            <div style={{ fontSize: 11, color: '#68826d' }}>{it.tamilName}</div>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#334d38', fontWeight: 500 }}>
                          {qtyStr}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#163b22' }}>
                          {rupees(it.price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8faf8', borderTop: '2px solid #d5dfd5' }}>
                    <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700, color: '#163b22' }}>
                      Grand Total:
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 15, color: '#163b22' }}>
                      {rupees(order.totalPrice)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #edf2ed',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafbfa',
          }}
        >
          <button
            onClick={handlePrint}
            style={{
              padding: '6px 14px',
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 13,
              color: '#334155',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            🖨️ Print Receipt
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '6px 18px',
              background: '#163b22',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

