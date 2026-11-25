import { getProductSalesDetail, getSalesAnalytics, listHistoricalOrders } from '@bqm/db';
import { isAuthenticated } from '../../server/_auth.js';

/**
 * Consolidated analytics endpoint — one Vercel function for all reports.
 *
 * GET /api/analytics/sales           — sales analytics, KPIs, trends, combo stats
 * GET /api/analytics/orders          — paginated, filtered, searchable order history
 * GET /api/analytics/product-detail  — single-product sales detail
 * GET /api/analytics/export          — filtered orders as a CSV download
 *
 * Grouping related routes into one function keeps the project under the
 * serverless-function cap and lets Fluid compute reuse warm instances.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function escapeCsv(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/** GET /api/analytics/sales?startDate=...&endDate=...&tzOffset=330 */
async function salesReport(req: Req, res: Res): Promise<void> {
  try {
    const now = new Date();
    // Default to last 30 days if not provided
    const defaultStart = new Date(now.getTime() - 29 * 24 * 3600 * 1000).toISOString();
    const defaultEnd = now.toISOString();

    const startDate = typeof req.query?.startDate === 'string' && req.query.startDate ? req.query.startDate : defaultStart;
    const endDate = typeof req.query?.endDate === 'string' && req.query.endDate ? req.query.endDate : defaultEnd;
    const timezoneOffsetMinutes = req.query?.tzOffset ? Number(req.query.tzOffset) : 330; // default IST (+5:30)

    const analytics = await getSalesAnalytics({
      startDate,
      endDate,
      timezoneOffsetMinutes,
    });

    res.status(200).json(analytics);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}

/** GET /api/analytics/orders?page&limit&startDate&endDate&source&status&search&sortBy&sortDir */
async function ordersReport(req: Req, res: Res): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 15)));
    const startDate = typeof req.query?.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query?.endDate === 'string' ? req.query.endDate : undefined;
    const source = typeof req.query?.source === 'string' ? (req.query.source as any) : 'all';
    const status = typeof req.query?.status === 'string' ? (req.query.status as any) : 'all';
    const search = typeof req.query?.search === 'string' ? req.query.search : '';
    const sortBy = req.query?.sortBy === 'totalPrice' ? 'totalPrice' : 'createdAt';
    const sortDir = req.query?.sortDir === 'asc' ? 'asc' : 'desc';

    const result = await listHistoricalOrders({
      page,
      limit,
      startDate,
      endDate,
      source,
      status,
      search,
      sortBy,
      sortDir,
    });

    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}

/** GET /api/analytics/product-detail?productId=...&startDate=...&endDate=... */
async function productDetailReport(req: Req, res: Res): Promise<void> {
  try {
    const productId = typeof req.query?.productId === 'string' ? req.query.productId : '';
    if (!productId) {
      res.status(400).json({ error: 'missing productId' });
      return;
    }

    const now = new Date();
    const defaultStart = new Date(now.getTime() - 29 * 24 * 3600 * 1000).toISOString();
    const defaultEnd = now.toISOString();

    const startDate = typeof req.query?.startDate === 'string' && req.query.startDate ? req.query.startDate : defaultStart;
    const endDate = typeof req.query?.endDate === 'string' && req.query.endDate ? req.query.endDate : defaultEnd;
    const timezoneOffsetMinutes = req.query?.tzOffset ? Number(req.query.tzOffset) : 330;

    const detail = await getProductSalesDetail({
      productId,
      startDate,
      endDate,
      timezoneOffsetMinutes,
    });

    res.status(200).json(detail);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(500).json({ error: message });
  }
}

/** GET /api/analytics/export — filtered historical orders as CSV. */
async function exportReport(req: Req, res: Res): Promise<void> {
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

const reports: Record<string, (req: Req, res: Res) => Promise<void>> = {
  sales: salesReport,
  orders: ordersReport,
  'product-detail': productDetailReport,
  export: exportReport,
};

export default async function handler(req: Req, res: Res): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const raw = Array.isArray(req.query?.report) ? req.query.report[0] : req.query?.report;
  const report = typeof raw === 'string' ? reports[raw] : undefined;
  if (!report) {
    res.status(404).json({ error: 'not found' });
    return;
  }

  await report(req, res);
}
