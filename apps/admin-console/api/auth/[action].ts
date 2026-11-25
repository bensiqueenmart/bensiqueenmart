import { isAuthenticated, mintToken, sessionCookie, verifyCredentials } from '../../server/_auth.js';

/**
 * Consolidated auth endpoint — one Vercel function for the whole auth surface.
 *
 * POST /api/auth/login   — { username, password } → 200 + session cookie
 * POST /api/auth/logout  — clears the session cookie
 * GET  /api/auth/me      — session probe (always 200, `authenticated` boolean)
 *
 * Login and the probe are intentionally unauthenticated; only credential
 * verification decides access. Per-action method checks keep the original
 * status codes exactly as they were.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

async function login(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    if (isAuthenticated(req)) {
      res.status(200).json({ ok: true });
      return;
    }
    const { username, password } = req.body ?? {};
    if (!verifyCredentials(username, password)) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    res.setHeader('Set-Cookie', sessionCookie(mintToken(username as string)));
    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}

async function logout(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  res.setHeader('Set-Cookie', sessionCookie(null));
  res.status(200).json({ ok: true });
}

async function me(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  res.status(200).json({ authenticated: isAuthenticated(req) });
}

const actions: Record<string, (req: Req, res: Res) => Promise<void>> = {
  login,
  logout,
  me,
};

export default async function handler(req: Req, res: Res): Promise<void> {
  const raw = Array.isArray(req.query?.action) ? req.query.action[0] : req.query?.action;
  const action = typeof raw === 'string' ? actions[raw] : undefined;
  if (!action) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  await action(req, res);
}
