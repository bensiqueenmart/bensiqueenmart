import React, { useState } from 'react';
import { login } from '../api';
import { KeyRound, Leaf, TriangleAlert } from 'lucide-react';

export default function LoginScreen({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const [username, setUsername] = useState('admin');
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
      if (msg.includes('401') || msg.toLowerCase().includes('invalid credentials')) {
        setLocalError('Invalid username or password. Please use admin / admin123.');
      } else {
        setLocalError(`Login error: ${msg}`);
      }
      onError(`Login failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f7f4',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #DCE8C8',
          borderRadius: 16,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 4px 20px rgba(18, 59, 38, 0.08)',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ marginBottom: 8, color: '#205C38' }}><Leaf size={40} /></div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#123B26', letterSpacing: '-0.02em' }}>
            Bensi Queen Mart
          </h2>
          <div style={{ fontSize: 13, color: '#557258', marginTop: 4, fontWeight: 500 }}>
            Owner &amp; Store Administration Console
          </div>
        </div>

        {/* Error Alert */}
        {localError && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#991b1b',
              fontSize: 12.5,
              fontWeight: 500,
              marginBottom: 18,
              lineHeight: 1.4,
            }}
          >
            <TriangleAlert size={14} style={{ verticalAlign: -2 }} /> {localError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: '#205C38',
                marginBottom: 6,
                letterSpacing: '0.02em',
              }}
            >
              Username
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #DCE8C8',
                borderRadius: 8,
                fontSize: 14,
                color: '#123B26',
                background: '#fafcfa',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              placeholder="admin"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setLocalError(null);
              }}
              autoFocus
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#205C38',
                  letterSpacing: '0.02em',
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 11.5,
                  color: '#205C38',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #DCE8C8',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#123B26',
                  background: '#fafcfa',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                placeholder="Enter password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError(null);
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || !username.trim() || !password}
            style={{
              padding: '11px',
              border: 'none',
              borderRadius: 8,
              background: busy || !username.trim() || !password ? '#7a967e' : '#123B26',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: busy || !username.trim() || !password ? 'not-allowed' : 'pointer',
              marginTop: 6,
              transition: 'background 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {busy ? 'Signing in…' : 'Sign In to Console'}
          </button>
        </form>

        {/* Credentials Helper Callout */}
        <div
          style={{
            marginTop: 20,
            padding: '12px 14px',
            background: '#F7F5E8',
            border: '1px solid #E8DFC8',
            borderRadius: 8,
            fontSize: 12,
            color: '#205C38',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}><KeyRound size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Sign-in Details:</div>
          <div>Username: <strong style={{ color: '#123B26' }}>admin</strong></div>
          <div>Password: <strong style={{ color: '#123B26' }}>admin123</strong></div>
        </div>
      </div>
    </div>
  );
}
