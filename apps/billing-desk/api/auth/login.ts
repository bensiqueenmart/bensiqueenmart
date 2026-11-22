import {
  clearLoginFailures,
  isAuthenticated,
  isRateLimited,
  mintToken,
  noteLoginFailure,
  sessionCookie,
  verifyCredentials,
} from '../_auth.js';

/**
 * POST /api/auth/login — { username, password } → 200 + session cookie.
 * 401 on bad credentials, 429 when the IP is throttled, 500 when auth env
 * is not configured (fail closed — never a default password).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    if (isAuthenticated(req)) {
      res.status(200).json({ ok: true });
      return;
    }
    if (isRateLimited(req)) {
      res.status(429).json({ error: 'too many attempts — try again in a few minutes' });
      return;
    }
    const { username, password } = req.body ?? {};
    if (!verifyCredentials(username, password)) {
      noteLoginFailure(req);
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    clearLoginFailures(req);
    res.setHeader('Set-Cookie', sessionCookie(mintToken(String(username).trim().toLowerCase())));
    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}
