import { listCatalog } from '@bqm/db';
import { isAuthenticated } from './_auth.js';

/**
 * GET /api/products — whole catalog for the billing desk.
 * One call returns all products + combos; search/filter runs locally
 * in the UI. Refresh button re-fetches this endpoint.
 * Requires a billing session (401 otherwise).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const catalog = await listCatalog();
    res.status(200).json(catalog);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'internal error' });
  }
}
