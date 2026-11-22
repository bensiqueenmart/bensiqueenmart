import { useState } from 'react';
import { login } from '../api';

export default function LoginScreen({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLocalError(null);
    try {
      await login(username.trim(), password);
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429')) {
        setLocalError('Too many attempts — wait a few minutes and try again.');
      } else if (msg.includes('401') || msg.toLowerCase().includes('invalid credentials')) {
        setLocalError('Invalid username or password.');
      } else {
        setLocalError(`Login error: ${msg}`);
      }
      onError(`Login failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #CBD5C8',
    borderRadius: 8,
    fontSize: 16,
    color: '#123B26',
    background: '#F8FAF8',
    boxSizing: 'border-box',
    outline: 'none',
    minHeight: 48,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#123B26',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 12,
        margin: 0,
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'clip',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px 22px',
          width: '100%',
          maxWidth: 'min(380px, 100%)',
          minWidth: 0,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#123B26' }}>Bensi Queen Mart</h2>
          <div style={{ fontSize: 13, color: '#557258', marginTop: 4, fontWeight: 600 }}>
            Retail POS · Billing Desk
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '4px 12px',
              borderRadius: 20,
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              color: '#92400E',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            🔒 Counter access — sign in to continue
          </div>
        </div>

        {localError && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#991B1B',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 18,
              lineHeight: 1.4,
            }}
          >
            ⚠ {localError}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#205C38', marginBottom: 6 }}>
              Username
            </label>
            <input
              style={inputStyle}
              placeholder="Counter username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setLocalError(null);
              }}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#205C38' }}>Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', padding: 8, fontSize: 13, color: '#205C38', cursor: 'pointer', fontWeight: 600, minHeight: 40 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              style={inputStyle}
              placeholder="Enter password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError(null);
              }}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !username.trim() || !password}
            style={{
              padding: '13px',
              border: 'none',
              borderRadius: 8,
              background: busy || !username.trim() || !password ? '#7A967E' : '#123B26',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: busy || !username.trim() || !password ? 'not-allowed' : 'pointer',
              marginTop: 6,
              minHeight: 48,
            }}
          >
            {busy ? 'Signing in…' : 'Unlock Billing Desk'}
          </button>
        </form>
      </div>
    </div>
  );
}
