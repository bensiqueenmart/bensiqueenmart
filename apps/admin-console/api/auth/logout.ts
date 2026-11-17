import { sessionCookie } from '../_auth.js';

/** POST /api/auth/logout — clears the session cookie. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  res.setHeader('Set-Cookie', sessionCookie(null));
  res.status(200).json({ ok: true });
}
