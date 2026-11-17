import { createCombo } from '@bqm/db';
import { isAuthenticated } from './_auth.js';

/**
 * POST /api/combos — create a brand-new combo. Body: { slug, name,
 * products, totalPrice, description?, tamilName?, isActive? }.
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
    const combo = await createCombo(req.body ?? {});
    res.status(201).json(combo);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(400).json({ error: message });
  }
}
