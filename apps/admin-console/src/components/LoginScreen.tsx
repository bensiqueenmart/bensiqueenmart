import { useState } from 'react';
import { login } from '../api';

const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, width: '100%', boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: '8px 12px', border: 'none', borderRadius: 6, background: '#1a1a1a', color: '#fff', cursor: 'pointer', width: '100%' };

export default function LoginScreen({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username, password);
      onDone();
    } catch (err) {
      onError(`Login failed: ${String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4' }}>
      <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 10, padding: 24, width: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0 }}>Admin Console</h2>
        <input style={input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        <input style={input} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button style={btn} disabled={busy || !username || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
