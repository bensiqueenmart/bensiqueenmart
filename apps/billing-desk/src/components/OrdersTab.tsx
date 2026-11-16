import { useEffect, useState } from 'react';
import type { Order, OrderItem, OrderStatus } from '@bqm/types';
import { deleteOrder, getCatalog, getOrder, listOrders, paise, patchOrder } from '../api';

const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };
const card: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 10, background: '#fff' };

const STATUS_COLOR: Partial<Record<OrderStatus, string>> = {
  unconfirmed: '#c62828',
  confirmed: '#2e7d32',
};

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
      for (const pr of catalog.products) { map[pr.slug] = pr.name; umap[pr.slug] = pr.stockUnit; }
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
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      // Unconfirmed orders hold no stock, so the choice only matters when confirmed.
      await deleteOrder(deleting.id, deleting.status === 'confirmed' && restoreChoice);
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

  /** `2026-11-16T10:30:00Z` -> `16 Nov, 10:30 AM`. Short enough for a list column. */
  const timeLabel = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const label = (slug: string) => names[slug] ?? slug;

  /** Fixed columns shared by the header and every row: status, time, price, order id, items, toggle. */
  const rowGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '90px 150px 110px 1fr 70px 40px',
    gap: 12,
    alignItems: 'center',
  };

  /** Line quantity in its own shape: `230g` loose, `200g × 5` quantized, plain count for combos. */
  const qtyLabel = (it: OrderItem) => {
    if (it.comboSlug) return `× ${it.quantity as number}`;
    if (Array.isArray(it.quantity)) {
      const unit = it.productSlug ? (units[it.productSlug] ?? '') : '';
      return it.quantity.map((q) => `${q.size}${unit} × ${q.count}`).join(' + ');
    }
    return `× ${it.quantity}${it.productSlug ? (units[it.productSlug] ?? '') : ''}`;
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Orders {total > 0 && <span style={{ color: '#666', fontWeight: 400 }}>({total})</span>}</h3>
        <button style={btn} onClick={() => load(page)}>Refresh</button>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btn} disabled={page <= 1 || loading} onClick={() => load(page - 1)}>← Prev</button>
          <button style={btn} disabled={!hasMore || loading} onClick={() => load(page + 1)}>Next →</button>
        </span>
      </div>

      {loading && <p>Loading orders…</p>}
      {!loading && orders.length === 0 && <p>No orders yet. Create one from the New Order tab.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {!loading && orders.length > 0 && (
          <div style={{ ...rowGrid, padding: '0 10px', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <span>Status</span>
            <span>Time</span>
            <span>Price</span>
            <span>Order</span>
            <span style={{ textAlign: 'right' }}>Items</span>
            <span />
          </div>
        )}
        {orders.map((o) => {
          const expanded = selectedId === o.id;
          return (
            <div key={o.id} style={{ ...card, borderColor: expanded ? '#1a1a1a' : '#ddd' }}>
              <div style={rowGrid}>
                <strong style={{ fontSize: 14, color: STATUS_COLOR[o.status as OrderStatus] ?? 'inherit' }}>{o.status}</strong>
                <span style={{ fontSize: 13, color: '#333' }}>{timeLabel(o.createdAt)}</span>
                <strong style={{ fontSize: 16 }}>{paise(o.totalPrice)}</strong>
                <span style={{ minWidth: 0 }}>
                  <code style={{ fontSize: 13 }}>{o.orderNo}</code>
                  {o.customerData?.customerName && (
                    <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.customerData.customerName}
                    </div>
                  )}
                </span>
                <span style={{ fontSize: 13, color: '#555', textAlign: 'right' }}>{o.orderItems.length} lines</span>
                <button
                  style={{ ...btn, padding: '6px 8px' }}
                  onClick={() => {
                    if (expanded) { setViewing(null); setSelectedId(null); }
                    else view(o.id);
                  }}
                >
                  {expanded ? '▴' : '▾'}
                </button>
              </div>
              {expanded && viewing && viewing.id === o.id && (
                <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8 }}>
                  {viewing.orderItems.map((it, i) => (
                    <div key={i} style={{ fontSize: 14 }}>
                      {label(it.productSlug ?? it.comboSlug ?? '?')} {qtyLabel(it)} — {paise(it.price)}
                    </div>
                  ))}
                  <div style={{ marginTop: 6 }}><strong>Total {paise(viewing.totalPrice)}</strong></div>
                  {viewing.customerData?.customerName && (
                    <div style={{ fontSize: 13, color: '#555' }}>
                      {viewing.customerData.customerName}{viewing.customerData.mobile ? ` · ${viewing.customerData.mobile}` : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {viewing.status === 'confirmed' ? (
                      <button style={btn} disabled={busy} onClick={() => setStatus('unconfirmed')}>
                        Mark unconfirmed (restores stock)
                      </button>
                    ) : (
                      <button style={btn} disabled={busy} onClick={() => setStatus('confirmed')}>
                        Confirm (deducts stock)
                      </button>
                    )}
                    <button
                      style={btn}
                      disabled={busy}
                      onClick={() => {
                        setRestoreChoice(true);
                        setDeleting({ id: viewing.id, orderNo: viewing.orderNo, status: viewing.status });
                      }}
                    >
                      Delete order
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {deleting && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => { if (!busy) setDeleting(null); }}
        >
          <div style={{ ...card, maxWidth: 420, padding: 16 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, marginBottom: 8 }}>
              <strong>Delete order <code>{deleting.orderNo}</code>?</strong>
            </div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>
              This will permanently delete the order. This cannot be undone.
            </div>
            {deleting.status === 'confirmed' && (
              <div style={{ fontSize: 14, marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>
                  <input type="radio" checked={restoreChoice} onChange={() => setRestoreChoice(true)} /> Restore stock
                  <div style={{ fontSize: 12, color: '#555', marginLeft: 22 }}>
                    Add back what this order deducted (recorded in stock movements).
                  </div>
                </label>
                <label style={{ display: 'block' }}>
                  <input type="radio" checked={!restoreChoice} onChange={() => setRestoreChoice(false)} /> Don't restore
                  <div style={{ fontSize: 12, color: '#555', marginLeft: 22 }}>
                    Leave stock as-is; the order just disappears.
                  </div>
                </label>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btn} disabled={busy} onClick={() => setDeleting(null)}>Keep order</button>
              <button style={btn} disabled={busy} onClick={confirmDelete}>
                {busy ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
