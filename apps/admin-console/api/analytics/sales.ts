import { getSalesAnalytics } from '@bqm/db';
import { isAuthenticated } from '../_auth.js';

/**
 * GET /api/analytics/sales?startDate=...&endDate=...&tzOffset=330
 * Returns comprehensive sales analytics, KPIs, trends, all-35-products stats, combo analytics.
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
    const now = new Date();
    // Default to last 30 days if not provided
    const defaultStart = new Date(now.getTime() - 29 * 24 * 3600 * 1000).toISOString();
    const defaultEnd = now.toISOString();

    const startDate = typeof req.query?.startDate === 'string' && req.query.startDate ? req.query.startDate : defaultStart;
    const endDate = typeof req.query?.endDate === 'string' && req.query.endDate ? req.query.endDate : defaultEnd;
    const timezoneOffsetMinutes = req.query?.tzOffset ? Number(req.query.tzOffset) : 330; // default IST (+5:30)

    const analytics = await getSalesAnalytics({
      startDate,
      endDate,
      timezoneOffsetMinutes,
    });

    res.status(200).json(analytics);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}

