import React, { useState } from 'react';
import type { Order, RecentOrderPreview } from '@bqm/types';
import { getOrder, rupees, formatSafeDateTime } from '../../api';
import OrderDetailsModal from './OrderDetailsModal';

interface Props {
  recentOrders?: RecentOrderPreview[];
  onViewAllOrders: () => void;
  onError: (msg: string) => void;
}

export default function RecentOrdersPreview({ recentOrders = [], onViewAllOrders, onError }: Props) {
  const safeOrders = Array.isArray(recentOrders) ? recentOrders : [];
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  const handleInspect = async (id: string) => {
    setLoadingOrderId(id);
    try {
      const fullOrder = await getOrder(id);
      setSelectedOrder(fullOrder);
    } catch (err) {
      onError(`Failed to load order ${id}: ${String(err)}`);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 700,
    color: '#123B26',
    background: '#F7F5E8',
    borderBottom: '1px solid #DCE8C8',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 13,
    borderBottom: '1px solid #edf2ed',
    color: '#1a2e1d',
  };

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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800, letterSpacing: '-0.01em' }}>
            Recent Orders Activity
          </h4>
          <span style={{ fontSize: 12, color: '#557258', marginTop: 2, display: 'inline-block' }}>
            Latest transactions recorded across in-store and online channels
          </span>
        </div>

        <button
          onClick={onViewAllOrders}
          style={{
            background: '#F7F5E8',
            border: '1px solid #E8DFC8',
            color: '#123B26',
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#123B26';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F7F5E8';
            e.currentTarget.style.color = '#123B26';
          }}
        >
          View Full Order History →
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2ece2' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Date &amp; Time</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Channel</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Items</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {safeOrders.length > 0 ? (
              safeOrders.map((o) => {
                const isConfirmed = o.status === 'confirmed';
                const isBusy = loadingOrderId === o.id;

                return (
                  <tr
                    key={o.id}
                    onClick={() => handleInspect(o.id)}
                    style={{
                      borderBottom: '1px solid #edf2ed',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f6fbf6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#123B26' }}>
                      {o.orderNo}
                    </td>
                    <td style={{ ...tdStyle, color: '#556957', whiteSpace: 'nowrap' }}>
                      {formatSafeDateTime(o.createdAt)}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: '#123B26' }}>{o.customerName}</span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 7px',
                          borderRadius: 4,
                          fontWeight: 600,
                          background: o.source === 'online' ? '#e0f2fe' : '#F7F5E8',
                          color: o.source === 'online' ? '#0369a1' : '#205C38',
                        }}
                      >
                        {o.source === 'online' ? 'Online' : 'In-Store POS'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#556957' }}>
                      {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#123B26' }}>
                      {rupees(o.totalPrice)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                          background: isConfirmed ? '#dcfce7' : '#fee2e2',
                          color: isConfirmed ? '#123B26' : '#991b1b',
                        }}
                      >
                        {isConfirmed ? '✓ Confirmed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspect(o.id);
                        }}
                        disabled={isBusy}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid #DCE8C8',
                          borderRadius: 4,
                          fontSize: 12,
                          background: '#fff',
                          color: '#123B26',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {isBusy ? '…' : 'Details'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                  No recent orders available in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

