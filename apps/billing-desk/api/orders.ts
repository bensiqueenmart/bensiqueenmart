import { createOrder, listOrders } from '@bqm/db';
import { isAuthenticated } from './_auth.js';

/**
 * /api/orders — requires a billing session (401 otherwise).
 * GET  — paginated order list, newest first. ?page=1&limit=50.
 * POST — create a new order (status starts at `unconfirmed`, no stock moves).
 *        Body: { orderItems: [{ productSlug?, comboSlug?, quantity, price }],
 *                customerData?: { customerName, mobile, fullAddress } }
 *        Wire lines are slug-keyed; the server resolves them to ids and
 *        snapshots display data at write time (stored refs are id-keyed).
 *        Product-line quantity matches the product's stock shape (loose:
 *        base-unit number; quantized: QuantizedCount[]); combo-line quantity
 *        is the combo-unit count.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    if (req.method === 'GET') {
      const page = Number(req.query?.page ?? 1);
      const limit = Number(req.query?.limit ?? 50);
      const result = await listOrders(page, limit);
      res.status(200).json(result);
      return;
    }

    if (req.method === 'POST') {
      const { orderItems, customerData } = req.body ?? {};
      const order = await createOrder({
        orderItems,
        customerData,
        source: 'in-store',
      });
      res.status(201).json(order);
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(400).json({ error: message });
  }
}
