import { useState, useEffect, useRef } from 'react';
import NewOrderTab from './components/NewOrderTab';
import OrdersTab from './components/OrdersTab';
import LoginScreen from './components/LoginScreen';
import { authMe, logout, onUnauthorized, refreshSession } from './api';

// Renew well inside the 60-minute server window, so an active shift
// never loses auth mid-bill. Also renewed whenever the tab regains focus.
const RENEW_INTERVAL_MS = 15 * 60 * 1000;

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'new' | 'orders'>('new');
  const [error, setError] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const authedRef = useRef(authed);
  authedRef.current = authed;

  useEffect(() => {
    onUnauthorized(() => {
      // Any 401 (e.g. session expired server-side) drops to the lock screen.
      if (authedRef.current) setAuthed(false);
    });
    authMe().then((r) => setAuthed(r.authenticated)).catch(() => setAuthed(false));
  }, []);

  // Sliding renewal while signed in: tab focus + 15-minute heartbeat.
  useEffect(() => {
    if (!authed) return;
    const renew = () => {
      refreshSession().catch(() => setAuthed(false));
    };
    const onFocus = () => renew();
    window.addEventListener('focus', onFocus);
    const id = setInterval(renew, RENEW_INTERVAL_MS);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(id);
    };
  }, [authed]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (authed === null) {
    return (
      <main style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, background: '#123B26', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DCE8C8' }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!authed) {
    return (<>
      {error && <div style={{ background: '#fee', padding: '8px 20px', color: '#900' }}>{error} <button onClick={() => setError('')}>dismiss</button></div>}
      <LoginScreen onDone={() => setAuthed(true)} onError={setError} />
    </>);
  }

  return (
    <main style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, background: '#F8FAF8', minHeight: '100vh' }}>
      {/* POS Top Header */}
      <header
        style={{
          background: '#123B26',
          color: '#fff',
          padding: '10px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1C5234',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong style={{ fontSize: 17, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🌿</span> Bensi Queen Mart
          </strong>
          <span style={{ color: '#A8C66C', fontSize: 13, fontWeight: 500, borderLeft: '1px solid #205C38', paddingLeft: 12 }}>
            Retail POS Billing Desk
          </span>
        </div>

        {/* Status Pill & Real-time clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#1A4A2E',
              border: '1px solid #205C38',
              borderRadius: 20,
              padding: '3px 11px',
              fontSize: 11.5,
              color: '#DCE8C8',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#A8C66C', display: 'inline-block' }} />
            <span>POS Counter 1 · Active</span>
          </div>

          {timeStr && (
            <span style={{ fontSize: 13, color: '#DCE8C8', fontWeight: 600, fontFamily: 'monospace' }}>
              🕒 {timeStr}
            </span>
          )}

          <button
            onClick={() => logout().then(() => setAuthed(false)).catch((e) => setError(String(e)))}
            style={{
              padding: '8px 16px',
              border: '1px solid #205C38',
              borderRadius: 6,
              background: '#1A4A2E',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              minHeight: 40,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Error notification bar */}
      {error && (
        <div
          style={{
            background: '#FEE2E2',
            borderBottom: '1px solid #F87171',
            padding: '10px 24px',
            color: '#991B1B',
            fontSize: 13.5,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠ {error}</span>
          <button
            style={{
              padding: '4px 12px',
              border: '1px solid #F87171',
              borderRadius: 6,
              cursor: 'pointer',
              background: '#fff',
              color: '#991B1B',
              fontWeight: 600,
              fontSize: 12,
            }}
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="pos-layout">
        <nav className="pos-sidebar">
          <button
            className={`pos-nav-btn ${tab === 'new' ? 'active' : ''}`}
            onClick={() => setTab('new')}
          >
            <span style={{ fontSize: 16 }}>🛒</span> New Order
          </button>
          <button
            className={`pos-nav-btn ${tab === 'orders' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            <span style={{ fontSize: 16 }}>📋</span> Orders Register
          </button>
        </nav>

        <div style={{ flex: 1, minWidth: 0, background: '#F8FAF8' }}>
          {tab === 'new' ? <NewOrderTab onError={setError} /> : <OrdersTab onError={setError} />}
        </div>
      </div>
    </main>
  );
}
