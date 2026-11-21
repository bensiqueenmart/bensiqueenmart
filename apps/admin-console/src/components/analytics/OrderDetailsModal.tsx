import React, { useState } from 'react';
import type { Order } from '@bqm/types';
import { rupees, formatSafeDateTime } from '../../api';
import { Check, Hourglass, Loader2, Copy, Download } from 'lucide-react';
import OrderInvoiceSheet from './OrderInvoiceSheet';
import { copyInvoiceImage, downloadInvoicePdf } from './invoiceShare';

interface Props {
  order: Order | null;
  onClose: () => void;
  busy?: boolean;
  onSetStatus?: (status: 'confirmed' | 'unconfirmed') => void;
  onDeleteRequest?: () => void;
}

export default function OrderDetailsModal({ order, onClose, busy = false, onSetStatus, onDeleteRequest }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [stamp, setStamp] = useState(() => formatSafeDateTime(new Date()));
  if (!order) return null;

  const restamp = async () => {
    // Re-stamp so the invoice footer shows the actual export time, then
    // wait two frames so the hidden sheet re-renders before capture.
    setStamp(formatSafeDateTime(new Date()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  };

  const handleDownload = async () => {
    if (downloading || copying) return;
    setDownloading(true);
    setNote(null);
    await restamp();
    const res = await downloadInvoicePdf(order, 'admin-invoice-canvas');
    setDownloading(false);
    setNote(res.ok ? `Downloaded Bensi-Queen-Invoice-${order.orderNo}.pdf` : res.note);
  };

  const handleCopy = async () => {
    if (downloading || copying) return;
    setCopying(true);
    setNote(null);
    await restamp();
    const res = await copyInvoiceImage(order, 'admin-invoice-canvas');
    setCopying(false);
    setNote(res.ok ? 'Invoice image copied — paste it in the chat (Ctrl+V).' : res.note);
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
                  {isConfirmed ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={11} /> Confirmed (Stock Deducted)</span>) : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Hourglass size={11} /> Unconfirmed / Draft</span>)}
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
                {order.customerData.instructions && (
                  <div>
                    <span style={{ color: '#668069' }}>Instructions:</span>{' '}
                    <span>{order.customerData.instructions}</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDownload}
                disabled={downloading || copying}
                title="Download the invoice as a one-page PDF"
                style={{
                  padding: '6px 14px',
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#334155',
                  cursor: downloading || copying ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {downloading ? <Loader2 size={14} /> : <Download size={14} />} Download
              </button>
              <button
                onClick={handleCopy}
                disabled={downloading || copying}
                title="Copy the invoice as an image — paste it straight into WhatsApp"
                style={{
                  padding: '6px 14px',
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#334155',
                  cursor: downloading || copying ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {copying ? <Loader2 size={14} /> : <Copy size={14} />} Copy image
              </button>
            </div>
            {note && (
              <div style={{ fontSize: 11, color: '#205C38', maxWidth: 240 }}>{note}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onSetStatus && (isConfirmed ? (
              <button
                disabled={busy}
                onClick={() => onSetStatus('unconfirmed')}
                title="Mark unconfirmed — restores stock"
                style={{
                  padding: '6px 14px',
                  border: '1px solid #FCD34D',
                  borderRadius: 6,
                  background: '#FFFBEB',
                  color: '#92400E',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Mark Unconfirmed
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() => onSetStatus('confirmed')}
                title="Confirm — deducts stock"
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: 6,
                  background: '#205C38',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Confirm Order
              </button>
            ))}
            {onDeleteRequest && (
              <button
                disabled={busy}
                onClick={onDeleteRequest}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #FCA5A5',
                  borderRadius: 6,
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Delete
              </button>
            )}
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

      {/* Offscreen invoice document for share-as-PDF. Kept outside the
          visible card so modal action buttons can never leak into the file. */}
      <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden="true">
        <OrderInvoiceSheet order={order} generatedAt={stamp} />
      </div>
    </div>
  );
}

