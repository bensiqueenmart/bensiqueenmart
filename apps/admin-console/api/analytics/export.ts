import { listHistoricalOrders } from '@bqm/db';
import { isAuthenticated } from '../_auth.js';

function escapeCsv(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * GET /api/analytics/export
 * Exports filtered historical orders to CSV.
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
    const startDate = typeof req.query?.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query?.endDate === 'string' ? req.query.endDate : undefined;
    const source = typeof req.query?.source === 'string' ? (req.query.source as any) : 'all';
    const status = typeof req.query?.status === 'string' ? (req.query.status as any) : 'all';
    const search = typeof req.query?.search === 'string' ? req.query.search : '';
    const sortBy = req.query?.sortBy === 'totalPrice' ? 'totalPrice' : 'createdAt';
    const sortDir = req.query?.sortDir === 'asc' ? 'asc' : 'desc';

    const result = await listHistoricalOrders({
      page: 1,
      limit: 10000,
      startDate,
      endDate,
      source,
      status,
      search,
      sortBy,
      sortDir,
    });

    const headers = [
      'Order ID',
      'Date (UTC)',
      'Customer Name',
      'Mobile Number',
      'Delivery Address',
      'Order Source',
      'Status',
      'Item Count',
      'Products & Quantities',
      'Total Amount (INR)',
    ];

    const rows = result.orders.map((o) => {
      const itemsSummary = (o.orderItems || [])
        .map((it) => {
          let q = '';
          if (Array.isArray(it.quantity)) {
            q = it.quantity.map((p) => `${p.count}x${p.size}${it.stockUnit || 'g'}`).join(' ');
          } else {
            q = `${it.quantity}${it.stockUnit || ''}`;
          }
          return `${it.name} (${q} - Rs.${it.price})`;
        })
        .join('; ');

      return [
        escapeCsv(o.orderNo),
        escapeCsv(o.createdAt),
        escapeCsv(o.customerData?.customerName || ''),
        escapeCsv(o.customerData?.mobile || ''),
        escapeCsv(o.customerData?.fullAddress || ''),
        escapeCsv(o.source || 'in-store'),
        escapeCsv(o.status || 'unconfirmed'),
        escapeCsv(o.orderItems?.length || 0),
        escapeCsv(itemsSummary),
        escapeCsv(o.totalPrice || 0),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bensi-queen-mart-orders.csv"');
    res.status(200);
    if (typeof res.send === 'function') {
      res.send(csvContent);
    } else {
      res.end(csvContent);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}

