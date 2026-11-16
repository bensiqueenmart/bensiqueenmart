import { useState } from 'react';
import NewOrderTab from './components/NewOrderTab';
import OrdersTab from './components/OrdersTab';

export default function App() {
  const [tab, setTab] = useState<'new' | 'orders'>('new');
  const [error, setError] = useState('');

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    border: 'none',
    borderLeft: active ? '3px solid #fff' : '3px solid transparent',
    background: active ? '#2a2a2a' : 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: active ? 700 : 400,
    opacity: active ? 1 : 0.75,
    textAlign: 'left',
    width: '100%',
  });

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f4f4f4', minHeight: '100vh' }}>
      <header style={{ background: '#1a1a1a', color: '#fff', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 1 }}>
        <strong>Bensi Queen Mart — Billing Desk</strong>
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

      <div style={{ display: 'flex', alignItems: 'stretch', paddingTop: 12 }}>
        <nav style={{ background: '#1a1a1a', width: 168, flexShrink: 0, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 61, alignSelf: 'flex-start', minHeight: 'calc(100vh - 61px)', borderRadius: '0 8px 8px 0' }}>
          <button style={tabBtn(tab === 'new')} onClick={() => setTab('new')}>New Order</button>
          <button style={tabBtn(tab === 'orders')} onClick={() => setTab('orders')}>Orders</button>
        </nav>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === 'new' ? <NewOrderTab onError={setError} /> : <OrdersTab onError={setError} />}
        </div>
      </div>
    </main>
  );
}
