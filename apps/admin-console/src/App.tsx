import { useEffect, useState } from 'react';
import { authMe, logout } from './api';
import LoginScreen from './components/LoginScreen';
import DashboardTab from './components/DashboardTab';
import InventoryTab from './components/InventoryTab';
import WebsiteTab from './components/WebsiteTab';
import { BarChart3, ClipboardList, Globe, Leaf, Package } from 'lucide-react';
import OrderHistorySection from './components/analytics/OrderHistorySection';

type Tab = 'dashboard' | 'orders' | 'inventory' | 'website';

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [error, setError] = useState('');
  // Share the dashboard date range with the Orders tab so navigating
  // from "View Full Order History" preserves the selected period.
  const [sharedStartIso, setSharedStartIso] = useState<string | undefined>(undefined);
  const [sharedEndIso, setSharedEndIso] = useState<string | undefined>(undefined);

  useEffect(() => {
    authMe().then((r) => setAuthed(r.authenticated)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <p style={{ padding: 32 }}>Loading…</p>;
  if (!authed) return (<>
    {error && <div style={{ background: '#fee', padding: '8px 20px', color: '#900' }}>{error} <button onClick={() => setError('')}>dismiss</button></div>}
    <LoginScreen onDone={() => setAuthed(true)} onError={setError} />
  </>);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '11px 18px',
    border: 'none',
    borderLeft: active ? '3px solid #39FF14' : '3px solid transparent',
    background: active ? '#1a4a2e' : 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13.5,
    fontWeight: active ? 700 : 500,
    opacity: active ? 1 : 0.82,
    textAlign: 'left',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.15s ease',
  });

  return (
    <main style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, background: '#f8faf8', minHeight: '100vh' }}>
      <header style={{ background: '#123B26', color: '#fff', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', borderBottom: '1px solid #1c5234' }}>
        <strong style={{ fontSize: 16, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Leaf size={18} color="#A8C66C" /> Bensi Queen Mart <span style={{ fontWeight: 400, opacity: 0.8, fontSize: 13 }}>| Admin Console</span>
        </strong>
        <button
          style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid #205C38', borderRadius: 6, background: '#1a4a2e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
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

      <div className="app-layout">
        <nav className="app-sidebar">
          <button style={tabBtn(tab === 'dashboard')} onClick={() => setTab('dashboard')}>
            <BarChart3 size={15} /> Sales Overview
          </button>
          <button style={tabBtn(tab === 'orders')} onClick={() => setTab('orders')}>
            <ClipboardList size={15} /> Orders
          </button>
          <button style={tabBtn(tab === 'inventory')} onClick={() => setTab('inventory')}>
            <Package size={15} /> Inventory
          </button>
          <button style={tabBtn(tab === 'website')} onClick={() => setTab('website')}>
            <Globe size={15} /> Website Content
          </button>
        </nav>
        <div style={{ flex: 1, minWidth: 0, background: '#f8faf8' }}>
          {tab === 'dashboard' && (
            <DashboardTab
              onError={setError}
              onNavigateToOrders={(startIso, endIso) => {
                setSharedStartIso(startIso);
                setSharedEndIso(endIso);
                setTab('orders');
              }}
            />
          )}
          {tab === 'orders' && (
            <div style={{ maxWidth: 1380, margin: '0 auto', padding: '24px 28px' }}>
              <OrderHistorySection
                onError={setError}
                initialStartIso={sharedStartIso}
                initialEndIso={sharedEndIso}
              />
            </div>
          )}
          {tab === 'inventory' && <InventoryTab onError={setError} />}
          {tab === 'website' && <WebsiteTab onError={setError} />}
        </div>
      </div>
    </main>
  );
}
