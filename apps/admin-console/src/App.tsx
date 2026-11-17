import { useEffect, useState } from 'react';
import { authMe, logout } from './api';
import LoginScreen from './components/LoginScreen';
import DashboardTab from './components/DashboardTab';
import InventoryTab from './components/InventoryTab';
import OrdersTab from './components/OrdersTab';
import WebsiteTab from './components/WebsiteTab';

type Tab = 'dashboard' | 'inventory' | 'orders' | 'website';

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [error, setError] = useState('');

  useEffect(() => {
    authMe().then((r) => setAuthed(r.authenticated)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <p style={{ padding: 32 }}>Loading…</p>;
  if (!authed) return (<>
    {error && <div style={{ background: '#fee', padding: '8px 20px', color: '#900' }}>{error} <button onClick={() => setError('')}>dismiss</button></div>}
    <LoginScreen onDone={() => setAuthed(true)} onError={setError} />
  </>);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 16px', border: 'none',
    borderLeft: active ? '3px solid #fff' : '3px solid transparent',
    background: active ? '#2a2a2a' : 'transparent',
    color: '#fff', cursor: 'pointer', fontSize: 15,
    fontWeight: active ? 700 : 400, opacity: active ? 1 : 0.75,
    textAlign: 'left', width: '100%',
  });

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f4f4f4', minHeight: '100vh' }}>
      <header style={{ background: '#1a1a1a', color: '#fff', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'center' }}>
        <strong>Admin Console</strong>
        <button
          style={{ marginLeft: 'auto', padding: '6px 12px', border: '1px solid #666', borderRadius: 6, background: 'transparent', color: '#fff', cursor: 'pointer' }}
          onClick={() => logout().then(() => setAuthed(false)).catch((e) => setError(String(e)))}
        >
          Logout
        </button>
      </header>

      {error && (
        <div style={{ background: '#fee', borderBottom: '1px solid #f99', padding: '8px 20px', color: '#900' }}>
          {error}{' '}
          <button style={{ padding: '4px 10px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' }} onClick={() => setError('')}>dismiss</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'stretch', paddingTop: 12 }}>
        <nav style={{ background: '#1a1a1a', width: 168, flexShrink: 0, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 61, alignSelf: 'flex-start', minHeight: 'calc(100vh - 61px)', borderRadius: '0 8px 8px 0' }}>
          {(['dashboard', 'inventory', 'orders', 'website'] as Tab[]).map((t) => (
            <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === 'dashboard' && <DashboardTab onError={setError} />}
          {tab === 'inventory' && <InventoryTab onError={setError} />}
          {tab === 'orders' && <OrdersTab onError={setError} />}
          {tab === 'website' && <WebsiteTab onError={setError} />}
        </div>
      </div>
    </main>
  );
}
