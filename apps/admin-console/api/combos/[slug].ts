import { patchCombo } from '@bqm/db';
import { isAuthenticated } from '../_auth.js';

/**
 * PATCH /api/combos/:slug — edit combo display data, components, totalPrice,
 * or isActive flag.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    if (req.method !== 'PATCH') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }
    const slug = Array.isArray(req.query?.slug) ? req.query.slug[0] : req.query?.slug;
    if (typeof slug !== 'string' || slug.length === 0) {
      res.status(400).json({ error: 'missing combo slug' });
      return;
    }
    const combo = await patchCombo(decodeURIComponent(slug), req.body ?? {});
    res.status(200).json(combo);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(400).json({ error: message });
  }
}
