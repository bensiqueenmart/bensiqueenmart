import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@bqm/types';
import { getCatalog, getOrder, listOrders, paise, patchOrder } from '../api';

const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };
const card: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 10, background: '#fff' };

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'paid',
  paid: 'shipped',
  shipped: 'delivered',
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Mark PAID (deducts stock)',
  paid: 'Mark Shipped',
  shipped: 'Mark Delivered',
};

export default function OrdersTab({ onError }: { onError: (msg: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
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
      for (const pr of catalog.products) map[pr.slug] = pr.name;
      for (const c of catalog.combos) map[c.slug] = c.name;
      setNames(map);
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

  const label = (slug: string) => names[slug] ?? slug;

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginTop: 12 }}>
        {orders.map((o) => (
          <div key={o.id} style={{ ...card, borderColor: selectedId === o.id ? '#1a1a1a' : '#ddd' }}>
            <div>
              <code>{o.orderNo}</code> · <strong>{o.status}</strong>
            </div>
            <div style={{ fontSize: 13, color: '#555' }}>
              {o.orderItems.length} lines · {paise(o.totalPrice)}
              {o.customerData?.customerName ? ` · ${o.customerData.customerName}` : ''}
            </div>
            <button style={{ ...btn, marginTop: 6 }} onClick={() => view(o.id)}>View</button>
          </div>
        ))}
      </div>

      {viewing && (
        <div style={{ ...card, marginTop: 12 }}>
          <h4 style={{ marginTop: 0 }}>
            Bill <code>{viewing.orderNo}</code> — {viewing.status}
            <button style={{ ...btn, marginLeft: 12 }} onClick={() => { setViewing(null); setSelectedId(null); }}>close</button>
          </h4>
          {viewing.orderItems.map((it, i) => (
            <div key={i} style={{ fontSize: 14 }}>
              {label(it.productSlug ?? it.comboSlug ?? '?')} × {it.quantity} — {paise(it.price)}
            </div>
          ))}
          <div style={{ marginTop: 6 }}><strong>Total {paise(viewing.totalPrice)}</strong></div>
          {viewing.customerData?.customerName && (
            <div style={{ fontSize: 13, color: '#555' }}>
              {viewing.customerData.customerName}{viewing.customerData.mobile ? ` · ${viewing.customerData.mobile}` : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {viewing.status !== 'delivered' && viewing.status !== 'cancelled' && (
              <>
                {NEXT[viewing.status as OrderStatus] && (
                  <button style={btn} disabled={busy} onClick={() => setStatus(NEXT[viewing.status as OrderStatus]!)}>
                    {NEXT_LABEL[viewing.status as OrderStatus]}
                  </button>
                )}
                {viewing.status === 'pending' && (
                  <button style={btn} disabled={busy} onClick={() => setStatus('cancelled')}>Cancel order</button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
