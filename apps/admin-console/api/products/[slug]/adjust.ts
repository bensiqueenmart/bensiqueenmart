import { adjustStock } from '@bqm/db';
import { isAuthenticated } from '../../_auth.js';

/**
 * POST /api/products/:slug/adjust — add or correct stock outside the order
 * lifecycle. Body: { delta, reason } where delta matches the product's shape
 * (base-unit number for loose, QuantizedCount[] for quantized; negative =
 * take out) and reason is one of `restock` | `adjust`.
 * Exactly one StockMovement is written.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }
    const slug = Array.isArray(req.query?.slug) ? req.query.slug[0] : req.query?.slug;
    if (typeof slug !== 'string' || slug.length === 0) {
      res.status(400).json({ error: 'missing product slug' });
      return;
    }
    const { delta, reason } = req.body ?? {};
    const product = await adjustStock(decodeURIComponent(slug), delta, reason);
    res.status(200).json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(400).json({ error: message });
  }
}
