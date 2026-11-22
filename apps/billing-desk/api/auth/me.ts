import { isAuthenticated } from '../_auth.js';

/** GET /api/auth/me — session probe for the lock screen. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  res.status(200).json({ authenticated: isAuthenticated(req) });
}
