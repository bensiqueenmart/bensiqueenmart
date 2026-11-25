import { deleteOrder, getOrderById, patchOrder } from '@bqm/db';
import { isAuthenticated } from '../../server/_auth.js';

/**
 * /api/orders/:id — identical semantics to billing-desk's endpoint.
 * GET    — fetch one order.
 * PATCH  — status / orderItems / totalPrice / customerData. Entering
 *          `confirmed` deducts stock (`sale`); leaving it restores (`restore`).
 * DELETE — permanently delete. Body: `{ restoreStock?: boolean }`.
 *          Stock movements are audit history and are never deleted.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({ error: 'missing order id' });
      return;
    }

    if (req.method === 'GET') {
      const order = await getOrderById(id);
      if (!order) {
        res.status(404).json({ error: 'order not found' });
        return;
      }
      res.status(200).json(order);
      return;
    }

    if (req.method === 'PATCH') {
      const { status, orderItems, totalPrice, customerData } = req.body ?? {};
      const result = await patchOrder(id, { status, orderItems, totalPrice, customerData });
      res.status(200).json(result);
      return;
    }

    if (req.method === 'DELETE') {
      const { restoreStock } = req.body ?? {};
      const result = await deleteOrder(id, { restoreStock: restoreStock === true });
      res.status(200).json(result);
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(400).json({ error: message });
  }
}
