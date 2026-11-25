import { useEffect, useState } from 'react';
import type { Order, OrderItem, OrderStatus } from '@bqm/types';
import { deleteOrder, formatSafeDateTime, getCatalog, getOrder, listOrders, rupees, patchOrder } from '../api';
import OrderInvoiceSheet from './OrderInvoiceSheet';
import { copyInvoiceImage, downloadInvoicePdf } from './invoiceShare';

export default function OrdersTab({ onError }: { onError: (msg: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; orderNo: string; status: string } | null>(null);
  const [restoreChoice, setRestoreChoice] = useState(true);
  const [names, setNames] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [stamp, setStamp] = useState(() => formatSafeDateTime(new Date()));

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const [result, catalog] = await Promise.all([listOrders(p, 20), getCatalog()]);
      setOrders(result.orders);
      setPage(result.page);
      setHasMore(result.hasMore);
      setTotal(result.total);
      const map: Record<string, string> = {};
      const umap: Record<string, string> = {};
      for (const pr of catalog.products) {
        map[pr.slug] = pr.name;
        umap[pr.slug] = pr.stockUnit;
      }
      for (const c of catalog.combos) map[c.slug] = c.name;
      setNames(map);
      setUnits(umap);
    } catch (e) {
      onError(`Couldn't load orders: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = async (id: string) => {
    setSelectedId(id);
    setMissing([]);
    setExportNote(null);
    try {
      setViewing(await getOrder(id));
    } catch (e) {
      onError(String(e));
    }
  };

  const setStatus = async (status: OrderStatus) => {
    if (!viewing) return;
    setBusy(true);
    try {
      const result = await patchOrder(viewing.id, { status });
      setViewing(result.order);
      setOrders((os) => os.map((o) => (o.id === result.order.id ? result.order : o)));
      setMissing(result.missingProducts ?? []);
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const restamp = async () => {
    // Re-stamp so the invoice footer shows the actual export time, then
    // wait two frames so the hidden sheet re-renders before capture.
    setStamp(formatSafeDateTime(new Date()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  };

  const handleDownload = async () => {
    if (!viewing || downloading || copying) return;
    setDownloading(true);
    setExportNote(null);
    await restamp();
    const res = await downloadInvoicePdf(viewing, 'billing-invoice-canvas');
    setDownloading(false);
    setExportNote(res.ok ? `Downloaded Bensi-Queen-Invoice-${viewing.orderNo}.pdf` : res.note);
  };

  const handleCopyImage = async () => {
    if (!viewing || downloading || copying) return;
    setCopying(true);
    setExportNote(null);
    await restamp();
    const res = await copyInvoiceImage(viewing, 'billing-invoice-canvas');
    setCopying(false);
    setExportNote(res.ok ? 'Invoice image copied — paste it in the chat (Ctrl+V).' : res.note);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const result = await deleteOrder(deleting.id, deleting.status === 'confirmed' && restoreChoice);
      setMissing(result.missingProducts ?? []);
      setOrders((os) => os.filter((o) => o.id !== deleting.id));
      setViewing(null);
      setSelectedId(null);
      setDeleting(null);
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const timeLabel = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const dStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const tStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      return `${dStr}, ${tStr}`;
    } catch {
      return iso.slice(0, 16);
    }
  };

  const label = (it: OrderItem) =>
    it.name ?? names[it.productSlug ?? it.comboSlug ?? ''] ?? it.productSlug ?? it.comboSlug ?? '?';

  const qtyLabel = (it: OrderItem) => {
    if (it.comboId ?? it.comboSlug) return `× ${it.quantity as number}`;
    const unit = it.stockUnit ?? (it.productSlug ? (units[it.productSlug] ?? '') : '');
    if (Array.isArray(it.quantity)) {
      return it.quantity.map((q) => `${q.size}${unit} × ${q.count}`).join(' + ');
    }
    return `× ${it.quantity}${unit}`;
  };

  const rowGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '110px 140px 110px 1fr 100px 80px 44px',
    gap: 12,
    alignItems: 'center',
  };

  return (
    <div style={{ maxWidth: 1380, margin: '0 auto', padding: '20px 24px' }}>
      {/* Header with Title and Pagination */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          border: '1px solid #DCE8C8',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 16,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#123B26', fontWeight: 800 }}>
              Orders History &amp; Register
            </h3>
            <span style={{ fontSize: 12, color: '#68826D' }}>
              {total} total orders recorded in terminal
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => load(page)}
            disabled={loading}
            style={{
              padding: '7px 14px',
              border: '1px solid #DCE8C8',
              borderRadius: 8,
              background: '#F7F5E8',
              color: '#123B26',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            ↻ Refresh
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#fff',
              border: '1px solid #DCE8C8',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            <button
              disabled={page <= 1 || loading}
              onClick={() => load(page - 1)}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: 'transparent',
                color: page <= 1 ? '#9CA3AF' : '#123B26',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#123B26', padding: '0 6px' }}>
              Page {page}
            </span>
            <button
              disabled={!hasMore || loading}
              onClick={() => load(page + 1)}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: 'transparent',
                color: !hasMore ? '#9CA3AF' : '#123B26',
                cursor: !hasMore ? 'not-allowed' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {missing.length > 0 && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: 12.5,
            color: '#92400E',
          }}
        >
          ℹ Deleted products skipped ({missing.join(', ')}) — stock movement recorded.
        </div>
      )}

      {loading && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 36, textAlign: 'center', border: '1px solid #DCE8C8' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#205C38', fontWeight: 600 }}>Loading orders register…</p>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px dashed #DCE8C8', color: '#68826D' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#123B26' }}>No orders found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Create and confirm an order from the New Order tab.</div>
        </div>
      )}

      {/* Orders List Table Header */}
      {!loading && orders.length > 0 && (
        <div
          style={{
            ...rowGrid,
            padding: '10px 16px',
            fontSize: 11,
            color: '#557258',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: '#F7F5E8',
            borderRadius: 8,
            border: '1px solid #E8DFC8',
            marginBottom: 8,
          }}
        >
          <span>Status</span>
          <span>Date &amp; Time</span>
          <span>Total</span>
          <span>Order &amp; Customer</span>
          <span>Channel</span>
          <span style={{ textAlign: 'right' }}>Items</span>
          <span style={{ textAlign: 'center' }}>Action</span>
        </div>
      )}

      {/* Orders Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {orders.map((o) => {
          const expanded = selectedId === o.id;
          const isConfirmed = o.status === 'confirmed';

          return (
            <div
              key={o.id}
              style={{
                background: '#ffffff',
                border: `1px solid ${expanded ? '#123B26' : '#DCE8C8'}`,
                borderRadius: 10,
                padding: '12px 16px',
                boxShadow: expanded ? '0 4px 14px rgba(18,59,38,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={rowGrid}>
                {/* Status Badge */}
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: isConfirmed ? '#E6F4EA' : '#FEF3C7',
                      color: isConfirmed ? '#137333' : '#B45309',
                      border: `1px solid ${isConfirmed ? '#A8DAB5' : '#FDE68A'}`,
                      textTransform: 'capitalize',
                    }}
                  >
                    <span>{isConfirmed ? '✓' : '⏳'}</span> {o.status}
                  </span>
                </div>

                {/* Time */}
                <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {timeLabel(o.createdAt)}
                </span>

                {/* Total */}
                <strong style={{ fontSize: 15, color: '#123B26', fontWeight: 800 }}>
                  {rupees(o.totalPrice)}
                </strong>

                {/* Order No & Customer */}
                <div style={{ minWidth: 0 }}>
                  <code style={{ fontSize: 12.5, fontWeight: 700, color: '#123B26', fontFamily: 'monospace' }}>
                    {o.orderNo}
                  </code>
                  {o.customerData?.customerName && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      👤 {o.customerData.customerName}
                    </div>
                  )}
                </div>

                {/* Source Channel Badge */}
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: (o.source as string) === 'online' ? '#EFF6FF' : '#F0FDF4',
                      color: (o.source as string) === 'online' ? '#1D4ED8' : '#15803D',
                    }}
                  >
                    {(o.source as string) === 'online' ? '🌐 Online' : '🏪 In-Store'}
                  </span>
                </div>

                {/* Items Count */}
                <span style={{ fontSize: 12, color: '#64748B', textAlign: 'right', fontWeight: 600 }}>
                  {o.orderItems.length} lines
                </span>

                {/* Expand / Collapse Button */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      if (expanded) {
                        setViewing(null);
                        setSelectedId(null);
                      } else {
                        view(o.id);
                      }
                    }}
                    style={{
                      border: '1px solid #DCE8C8',
                      background: expanded ? '#123B26' : '#F7F5E8',
                      color: expanded ? '#fff' : '#123B26',
                      borderRadius: 6,
                      width: 28,
                      height: 28,
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={expanded ? 'Collapse order details' : 'View order details'}
                  >
                    {expanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Expanded Order Details Drawer */}
              {expanded && viewing && viewing.id === o.id && (
                <div
                  style={{
                    borderTop: '1px solid #EAEFEA',
                    marginTop: 12,
                    paddingTop: 12,
                    background: '#FAFCFA',
                    borderRadius: 8,
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#205C38', textTransform: 'uppercase', marginBottom: 8 }}>
                    Order Line Items:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {viewing.orderItems.map((it, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 13,
                          padding: '4px 0',
                          borderBottom: '1px dotted #E2ECE2',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#123B26', fontWeight: 600 }}>• {label(it)}</span>
                          <span style={{ fontSize: 11.5, color: '#68826D', background: '#F0F5F0', padding: '1px 6px', borderRadius: 4 }}>
                            {qtyLabel(it)}
                          </span>
                        </div>
                        <strong style={{ color: '#123B26' }}>{rupees(it.price)}</strong>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px solid #DCE8C8',
                    }}
                  >
                    <div style={{ maxWidth: '60%' }}>
                      {viewing.customerData?.customerName && (
                        <div style={{ fontSize: 12, color: '#557258' }}>
                          Customer: <strong>{viewing.customerData.customerName}</strong>
                          {viewing.customerData.mobile ? ` (${viewing.customerData.mobile})` : ''}
                        </div>
                      )}
                      {viewing.customerData?.fullAddress && (
                        <div style={{ fontSize: 12, color: '#557258', marginTop: 2 }}>
                          📍 {viewing.customerData.fullAddress}
                        </div>
                      )}
                      {viewing.customerData?.instructions && (
                        <div style={{ fontSize: 12, color: '#557258', marginTop: 2 }}>
                          📝 <span style={{ fontStyle: 'italic' }}>{viewing.customerData.instructions}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 15 }}>
                      Total: <strong style={{ color: '#123B26', fontSize: 17 }}>{rupees(viewing.totalPrice)}</strong>
                    </div>
                  </div>

                  {/* Actions inside drawer */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          disabled={busy || downloading || copying}
                          onClick={handleDownload}
                          title="Download the invoice as a one-page PDF"
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            background: '#fff',
                            color: '#334155',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: busy || downloading || copying ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {downloading ? 'Downloading…' : '📥 Download'}
                        </button>
                        <button
                          disabled={busy || downloading || copying}
                          onClick={handleCopyImage}
                          title="Copy the invoice as an image — paste it straight into WhatsApp"
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            background: '#fff',
                            color: '#334155',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: busy || downloading || copying ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {copying ? 'Copying…' : '📋 Copy image'}
                        </button>
                      </div>
                      {exportNote && (
                        <div style={{ fontSize: 11, color: '#205C38', maxWidth: 260 }}>{exportNote}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                    {viewing.status === 'confirmed' ? (
                      <button
                        disabled={busy}
                        onClick={() => setStatus('unconfirmed')}
                        style={{
                          padding: '6px 14px',
                          border: '1px solid #FCD34D',
                          borderRadius: 6,
                          background: '#FFFBEB',
                          color: '#92400E',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: busy ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Mark Unconfirmed (Restores Stock)
                      </button>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => setStatus('confirmed')}
                        style={{
                          padding: '6px 14px',
                          border: 'none',
                          borderRadius: 6,
                          background: '#205C38',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: busy ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Confirm (Deducts Stock) ✓
                      </button>
                    )}

                    <button
                      disabled={busy}
                      onClick={() => {
                        setRestoreChoice(true);
                        setDeleting({ id: viewing.id, orderNo: viewing.orderNo, status: viewing.status });
                      }}
                      style={{
                        padding: '6px 14px',
                        border: '1px solid #FCA5A5',
                        borderRadius: 6,
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: busy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Delete Order ✕
                    </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 59, 38, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
          onClick={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #DCE8C8',
              borderRadius: 14,
              maxWidth: 440,
              width: '90%',
              padding: 22,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#123B26', marginBottom: 6 }}>
              Delete Order <code>#{deleting.orderNo}</code>?
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14, lineHeight: 1.4 }}>
              This will permanently remove this order from the database. This action cannot be undone.
            </div>

            {deleting.status === 'confirmed' && (
              <div
                style={{
                  background: '#F8FAF8',
                  border: '1px solid #E2ECE2',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="restoreOpt"
                    checked={restoreChoice}
                    onChange={() => setRestoreChoice(true)}
                    style={{ accentColor: '#123B26', marginTop: 2 }}
                  />
                  <div>
                    <strong style={{ color: '#123B26' }}>Restore stock quantities</strong>
                    <div style={{ fontSize: 11.5, color: '#68826D', marginTop: 1 }}>
                      Adds back the deducted inventory items as a cancellation movement.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="restoreOpt"
                    checked={!restoreChoice}
                    onChange={() => setRestoreChoice(false)}
                    style={{ accentColor: '#123B26', marginTop: 2 }}
                  />
                  <div>
                    <strong style={{ color: '#123B26' }}>Do not restore stock</strong>
                    <div style={{ fontSize: 11.5, color: '#68826D', marginTop: 1 }}>
                      Leaves inventory levels as-is.
                    </div>
                  </div>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                disabled={busy}
                onClick={() => setDeleting(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #DCE8C8',
                  borderRadius: 6,
                  background: '#fff',
                  color: '#123B26',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Keep Order
              </button>
              <button
                disabled={busy}
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 6,
                  background: '#DC2626',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? 'Deleting…' : 'Yes, Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen invoice document for Download / Copy image. Kept outside
          the rows so drawer action buttons can never leak into the file. */}
      {viewing && (
        <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden="true">
          <OrderInvoiceSheet order={viewing} generatedAt={stamp} />
        </div>
      )}
    </div>
  );
}
