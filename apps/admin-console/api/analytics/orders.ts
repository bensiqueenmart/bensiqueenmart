import { listHistoricalOrders } from '@bqm/db';
import { isAuthenticated } from '../_auth.js';

/**
 * GET /api/analytics/orders
 * Paginated, filtered, searchable order history.
 * Query: page, limit, startDate, endDate, source, status, search, sortBy, sortDir
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 15)));
    const startDate = typeof req.query?.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query?.endDate === 'string' ? req.query.endDate : undefined;
    const source = typeof req.query?.source === 'string' ? (req.query.source as any) : 'all';
    const status = typeof req.query?.status === 'string' ? (req.query.status as any) : 'all';
    const search = typeof req.query?.search === 'string' ? req.query.search : '';
    const sortBy = req.query?.sortBy === 'totalPrice' ? 'totalPrice' : 'createdAt';
    const sortDir = req.query?.sortDir === 'asc' ? 'asc' : 'desc';

    const result = await listHistoricalOrders({
      page,
      limit,
      startDate,
      endDate,
      source,
      status,
      search,
      sortBy,
      sortDir,
    });

    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}

