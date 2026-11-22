import { mintToken, sessionCookie, sessionUser } from '../_auth.js';

/**
 * POST /api/auth/refresh — sliding session renewal.
 *
 * Called by the desk UI every 15 minutes (and when the tab regains focus),
 * so a valid 60-minute session is pushed back to a full hour without ever
 * interrupting a bill. Re-mints the token for the session's own username
 * and resets the cookie Max-Age. 401 when the session is already gone —
 * the UI then shows the lock screen.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const username = sessionUser(req);
    if (!username) {
      res.status(401).json({ error: 'session expired' });
      return;
    }
    res.setHeader('Set-Cookie', sessionCookie(mintToken(username)));
    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}
