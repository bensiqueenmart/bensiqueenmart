import { useEffect, useState } from 'react';
import { getCatalog, listOrders, rupees } from '../api';

const card: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 14, background: '#fff' };

/**
 * Placeholder wired to live data via existing endpoints (no analytics API
 * yet — full spec pending). Shows counts, confirmed revenue, and recent
 * orders peek.
 */
export default function DashboardTab({ onError }: { onError: (m: string) => void }) {
  const [stats, setStats] = useState<{ products: number; combos: number; orders: number; revenue: number; unconfirmed: number; recent: Array<{ orderNo: string; totalPrice: number; status: string }> } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [catalog, page] = await Promise.all([getCatalog(), listOrders(1, 50)]);
        const all = page.orders;
        setStats({
          products: catalog.products.length,
          combos: catalog.combos.length,
          orders: page.total,
          revenue: all.filter((o) => o.status === 'confirmed').reduce((s, o) => s + o.totalPrice, 0),
          unconfirmed: all.filter((o) => o.status !== 'confirmed').length,
          recent: all.slice(0, 5).map((o) => ({ orderNo: o.orderNo, totalPrice: o.totalPrice, status: o.status })),
        });
      } catch (e) {
        onError(`Couldn't load dashboard: ${String(e)}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) return <p style={{ padding: 16 }}>Loading dashboard…</p>;
  const tiles: Array<[string, string]> = [
    ['Products', String(stats.products)],
    ['Combos', String(stats.combos)],
    ['Orders (total)', String(stats.orders)],
    ['Confirmed revenue (last 50)', rupees(stats.revenue)],
    ['Unconfirmed (last 50)', String(stats.unconfirmed)],
  ];
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Dashboard <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>(stub — full analytics spec pending)</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {tiles.map(([label, value]) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>
      <h4>Recent orders</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stats.recent.map((o) => (
          <div key={o.orderNo} style={card}>
            <code>{o.orderNo}</code> — {rupees(o.totalPrice)} · {o.status}
          </div>
        ))}
        {stats.recent.length === 0 && <p>No orders yet.</p>}
      </div>
    </div>
  );
}
