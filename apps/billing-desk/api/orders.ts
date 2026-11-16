import { createOrder, listOrders } from '@bqm/db';

/**
 * /api/orders
 * GET  — paginated order list, newest first. ?page=1&limit=50.
 * POST — create a new order (status starts at `pending`, no stock moves).
 *        Body: { orderItems: [{ productSlug?, comboSlug?, quantity, price }],
 *                customerData?: { customerName, mobile, fullAddress } }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
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
        source: 'billing-desk',
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
