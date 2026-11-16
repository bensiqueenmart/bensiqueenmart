import { useState } from 'react';
import NewOrderTab from './components/NewOrderTab';
import OrdersTab from './components/OrdersTab';

export default function App() {
  const [tab, setTab] = useState<'new' | 'orders'>('new');
  const [error, setError] = useState('');

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    border: 'none',
    borderBottom: active ? '3px solid #fff' : '3px solid transparent',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: active ? 700 : 400,
    opacity: active ? 1 : 0.75,
  });

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f4f4f4', minHeight: '100vh' }}>
      <header style={{ background: '#1a1a1a', color: '#fff', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', top: 0, zIndex: 1 }}>
        <strong style={{ marginRight: 12 }}>Bensi Queen Mart — Billing Desk</strong>
        <button style={tabBtn(tab === 'new')} onClick={() => setTab('new')}>New Order</button>
        <button style={tabBtn(tab === 'orders')} onClick={() => setTab('orders')}>Orders</button>
      </header>

      {error && (
        <div style={{ background: '#fee', borderBottom: '1px solid #f99', padding: '8px 20px', color: '#900' }}>
          {error}{' '}
          <button
            style={{ padding: '4px 10px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' }}
            onClick={() => setError('')}
          >
            dismiss
          </button>
        </div>
      )}

      {tab === 'new' ? <NewOrderTab onError={setError} /> : <OrdersTab onError={setError} />}
    </main>
  );
}
