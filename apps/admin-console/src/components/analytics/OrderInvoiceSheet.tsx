import type { Order } from '@bqm/types';
import { rupees, formatSafeDateTime } from '../../api';

/**
 * Offscreen one-page invoice document for share-as-PDF.
 * Rendered in a hidden container (never the visible modal) so modal
 * action buttons can never leak into the file. Inline styles only —
 * html2canvas captures computed inline styles reliably; no Tailwind
 * (admin-console has no Tailwind pipeline).
 *
 * Payment rule (owner-defined): confirmed = paid, unconfirmed = unpaid.
 */

const STORE = {
  name: 'BENSI QUEEN',
  tagline: "Bringing Nature's Goodness to Your Kitchen.",
  address: 'No. 3, Jothi Nagar, 5th Street, Sankara Apartment, Chitlapakkam, Chennai - 600064',
  phone: '+91 63694 48863',
  logoUrl: '/images/bensi-queen-logo.jpg',
};

export function qtyLabel(it: Order['orderItems'][number]): string {
  if (Array.isArray(it.quantity)) {
    return it.quantity.map((q) => `${q.count} × ${q.size}${it.stockUnit || 'g'}`).join(', ');
  }
  if (it.comboSlug || it.comboId) {
    return `${it.quantity} combo ${(it.quantity as number) === 1 ? 'pack' : 'packs'}`;
  }
  return `${it.quantity} ${it.stockUnit || ''}`;
}

export default function OrderInvoiceSheet({ order, generatedAt }: { order: Order; generatedAt: string }) {
  const isConfirmed = order.status === 'confirmed';
  const items = order.orderItems || [];
  const totalPacks = items.reduce((sum, it) => {
    if (Array.isArray(it.quantity)) return sum + it.quantity.reduce((s, q) => s + q.count, 0);
    // Loose lines store base-unit grams — one line = one bag, not N packs.
    if (it.comboSlug || it.comboId) return sum + (typeof it.quantity === 'number' ? it.quantity : 0);
    return sum + 1;
  }, 0);

  return (
    <div
      id="admin-invoice-canvas"
      style={{
        width: 794,
        boxSizing: 'border-box',
        background: '#fff',
        color: '#123B26',
        padding: '28px 32px',
        fontFamily: "'Poppins', Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #123B26', paddingBottom: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '2px solid #123B26',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#fff',
              }}
            >
              <img src={STORE.logoUrl} alt="Bensi Queen Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: 'Georgia, serif' }}>
                {STORE.name}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#205C38', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Quality Groceries &amp; Provisions
              </div>
              <div style={{ fontSize: 10, color: '#5b6f5e', marginTop: 2, maxWidth: 340 }}>{STORE.address}</div>
              <div style={{ fontSize: 10, color: '#5b6f5e' }}>Helpline / WhatsApp: {STORE.phone}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                display: 'inline-block',
                background: '#123B26',
                color: '#fff',
                padding: '5px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              INVOICE
            </div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>
              Ref: <span style={{ fontFamily: 'monospace' }}>{order.orderNo}</span>
            </div>
            <div style={{ fontSize: 11, color: '#44584a' }}>Ordered: {formatSafeDateTime(order.createdAt)}</div>
            <div style={{ marginTop: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  background: isConfirmed ? '#dcfce7' : '#fee2e2',
                  color: isConfirmed ? '#166534' : '#991b1b',
                }}
              >
                {isConfirmed ? 'PAID' : 'UNPAID'}
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#5b6f5e', marginTop: 4 }}>
              {isConfirmed ? 'Confirmed — payment received' : 'Unconfirmed — payment not received'}
            </div>
          </div>
        </div>
      </div>

      {/* Customer */}
      {(order.customerData?.customerName || order.customerData?.mobile || order.customerData?.fullAddress) && (
        <div style={{ background: '#F7F5E8', border: '1px solid #DCE8C8', borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #DCE8C8', paddingBottom: 4, marginBottom: 8 }}>
            Customer &amp; Delivery Information
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#7a967e' }}>Customer Name:</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{order.customerData.customerName || '—'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#7a967e' }}>Contact Number:</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{order.customerData.mobile || '—'}</div>
              <div style={{ color: '#7a967e', marginTop: 6 }}>
                Channel: {order.source === 'online' ? 'Online Store' : 'In-Store POS'}
              </div>
            </div>
          </div>
          {order.customerData.fullAddress && (
            <div style={{ fontSize: 11, marginTop: 6 }}>
              <span style={{ color: '#7a967e' }}>Delivery Address: </span>
              <span>{order.customerData.fullAddress}</span>
            </div>
          )}
          {order.customerData.instructions && (
            <div style={{ fontSize: 11, marginTop: 4 }}>
              <span style={{ color: '#7a967e' }}>Instructions: </span>
              <span style={{ fontStyle: 'italic' }}>{order.customerData.instructions}</span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
        <thead>
          <tr style={{ background: '#123B26', color: '#fff' }}>
            <th style={{ padding: '7px 8px', textAlign: 'center', width: 36, fontWeight: 700 }}>S.No</th>
            <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700 }}>Item</th>
            <th style={{ padding: '7px 8px', textAlign: 'center', width: 130, fontWeight: 700 }}>Quantity</th>
            <th style={{ padding: '7px 10px', textAlign: 'right', width: 100, fontWeight: 700 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#F7F5E8' : '#fff' }}>
              <td style={{ border: '1px solid #dfe7df', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #dfe7df', padding: '6px 10px' }}>
                <div style={{ fontWeight: 700 }}>{it.name}</div>
                {it.tamilName && <div style={{ fontSize: 10, color: '#68826d' }}>{it.tamilName}</div>}
              </td>
              <td style={{ border: '1px solid #dfe7df', padding: '6px 8px', textAlign: 'center' }}>{qtyLabel(it)}</td>
              <td style={{ border: '1px solid #dfe7df', padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>
                {rupees(it.price)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#DCE8C8', fontWeight: 800 }}>
            <td colSpan={2} style={{ border: '1px solid #cfdccf', padding: '7px 10px', textAlign: 'right' }}>
              Grand Total ({items.length} {items.length === 1 ? 'item' : 'items'} · {totalPacks} packs):
            </td>
            <td style={{ border: '1px solid #cfdccf', padding: '7px 8px', textAlign: 'center' }}>{totalPacks}</td>
            <td style={{ border: '1px solid #cfdccf', padding: '7px 10px', textAlign: 'right', fontSize: 13 }}>
              {rupees(order.totalPrice)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Record note */}
      <div style={{ background: '#f6f8f6', border: '1px solid #e1ebe1', borderRadius: 8, padding: 10, fontSize: 10, color: '#5b6f5e', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, color: '#123B26', marginBottom: 2 }}>Transaction record</div>
        <div>
          {isConfirmed
            ? 'Payment received. This invoice is the record of the purchase.'
            : 'Payment not yet received — due on confirmation. Prices confirmed with the store via WhatsApp/phone.'}{' '}
          For changes to this order, contact {STORE.phone}.
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px solid #123B26', paddingTop: 10, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Georgia, serif' }}>
          Thank you for choosing Bensi Queen!
        </div>
        <div style={{ fontSize: 10, color: '#7a967e' }}>Good Food. Great Quality. Happy Home.</div>
        <div style={{ fontSize: 9, color: '#9aa5a0', marginTop: 4 }}>
          Invoice generated: {generatedAt} · Ref {order.orderNo}
        </div>
      </div>
    </div>
  );
}
