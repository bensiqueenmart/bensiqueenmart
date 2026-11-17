import { createProduct, listCatalog } from '@bqm/db';
import { isAuthenticated } from './_auth.js';

/**
 * /api/products
 * GET  — whole catalog (products + combos). Admin sees everything, including
 *        inactive combos; search/filter runs locally in the UI.
 * POST — create a brand-new product. Body: { slug, name, category,
 *        isQuantized, stockUnit, stock, description?, pricePerUnit?,
 *        quantityPrice?, tamilName?, image? }. Non-zero opening stock writes
 *        one `create` movement.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    if (req.method === 'GET') {
      const catalog = await listCatalog();
      res.status(200).json(catalog);
      return;
    }
    if (req.method === 'POST') {
      const product = await createProduct(req.body ?? {});
      res.status(201).json(product);
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(400).json({ error: message });
  }
}
