import { deleteProduct, patchProduct } from '@bqm/db';
import { isAuthenticated } from '../../server/_auth.js';

/**
 * /api/products/:slug
 * PATCH — edit product display/pricing data (name, tamilName, image,
 *   description, category, stockUnit, pricePerUnit, quantityPrice). Stock
 *   and isQuantized are rejected here; stock moves only via
 *   POST /api/products/:slug/adjust.
 * DELETE — hard-delete the product. Refused while any combo references it.
 *   Orders/movements keep id-keyed history, so slug reuse is safe.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    if (req.method !== 'PATCH' && req.method !== 'DELETE') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }
    const slug = Array.isArray(req.query?.slug) ? req.query.slug[0] : req.query?.slug;
    if (typeof slug !== 'string' || slug.length === 0) {
      res.status(400).json({ error: 'missing product slug' });
      return;
    }
    if (req.method === 'DELETE') {
      const result = await deleteProduct(decodeURIComponent(slug));
      res.status(200).json(result);
      return;
    }
    const product = await patchProduct(decodeURIComponent(slug), req.body ?? {});
    res.status(200).json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(400).json({ error: message });
  }
}
