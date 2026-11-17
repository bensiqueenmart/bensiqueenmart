import { listCatalog, toPublicCatalog } from '@bqm/db';

/**
 * GET /api/products — public storefront catalog. No auth (public site).
 * Returns the REDACTED catalog: products/combos carry only `available`
 * (boolean) — raw stock quantities never leave the server. Prices are in
 * the payload for a future price-display switch; the UI must not render
 * them today.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const { products, combos } = await listCatalog();
    res.status(200).json(toPublicCatalog(products, combos));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'internal error' });
  }
}
