import type {
  Combo,
  Order,
  OrderHistoryQuery,
  PaginatedOrdersResponse,
  Product,
  ProductPackBreakdown,
  ProductSalesDetailResponse,
  ProductSalesStat,
  QuantizedCount,
  SalesAnalyticsResponse,
  TrendPoint,
} from '@bqm/types';
import { getCollections } from './client.js';

function formatLooseQty(qty: number, unit: string): string {
  if (qty <= 0) return `0 ${unit}`;
  if (unit === 'g' && qty >= 1000) {
    const kg = (qty / 1000).toFixed(2).replace(/\.00$/, '');
    return `${kg} kg (${qty.toLocaleString('en-IN')} g)`;
  }
  if (unit === 'ml' && qty >= 1000) {
    const l = (qty / 1000).toFixed(2).replace(/\.00$/, '');
    return `${l} L (${qty.toLocaleString('en-IN')} ml)`;
  }
  return `${qty.toLocaleString('en-IN')} ${unit}`;
}

function formatPacksBreakdown(packs: ProductPackBreakdown[], unit: string): string {
  if (!packs || packs.length === 0) return '0 packs';
  const totalPacks = packs.reduce((sum, p) => sum + p.count, 0);
  const totalBase = packs.reduce((sum, p) => sum + p.size * p.count, 0);
  const breakdownStr = packs
    .filter((p) => p.count > 0)
    .sort((a, b) => a.size - b.size)
    .map((p) => `${p.count} × ${p.size}${unit}`)
    .join(', ');
  if (!breakdownStr) return '0 packs';
  return `${breakdownStr} (Total ${totalPacks} packs, ${totalBase.toLocaleString('en-IN')}${unit})`;
}

function formatCurrentStock(prod: Product): string {
  if (!prod.isQuantized) {
    const loose = typeof prod.stock === 'number' ? prod.stock : 0;
    return formatLooseQty(loose, prod.stockUnit);
  }
  if (Array.isArray(prod.stock)) {
    const breakdown = prod.stock.map((p) => ({ size: p.size, count: p.count }));
    return formatPacksBreakdown(breakdown, prod.stockUnit);
  }
  return '0 packs';
}

function pctChange(curr: number, prev: number): number | null {
  if (prev <= 0) {
    if (curr > 0) return 100;
    return 0;
  }
  return Number((((curr - prev) / prev) * 100).toFixed(1));
}

export async function getSalesAnalytics(params: {
  startDate: string;
  endDate: string;
  timezoneOffsetMinutes?: number;
}): Promise<SalesAnalyticsResponse> {
  const { startDate, endDate, timezoneOffsetMinutes = 330 } = params;
  const { products, combos, orders } = await getCollections();

  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = Math.max(1000, end.getTime() - start.getTime());
  const priorEnd = new Date(start.getTime() - 1);
  const priorStart = new Date(priorEnd.getTime() - durationMs);

  const [allProducts, allCombos] = await Promise.all([
    products.find({}).sort({ name: 1 }).toArray(),
    combos.find({}).sort({ name: 1 }).toArray(),
  ]);

  const [currentConfirmed, currentUnconfirmed, priorConfirmed] = await Promise.all([
    orders
      .find({
        status: 'confirmed',
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ createdAt: 1 })
      .toArray(),
    orders
      .find({
        status: { $ne: 'confirmed' },
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .toArray(),
    orders
      .find({
        status: 'confirmed',
        createdAt: { $gte: priorStart.toISOString(), $lte: priorEnd.toISOString() },
      })
      .toArray(),
  ]);

  // Current period KPIs
  const totalRevenue = Number(
    currentConfirmed.reduce((sum, o) => sum + (typeof o.totalPrice === 'number' ? o.totalPrice : 0), 0).toFixed(2),
  );
  const totalConfirmedOrders = currentConfirmed.length;
  const totalUnconfirmedOrders = currentUnconfirmed.length;
  const averageOrderValue =
    totalConfirmedOrders > 0 ? Number((totalRevenue / totalConfirmedOrders).toFixed(2)) : 0;

  // Prior period KPIs
  const priorRevenue = Number(
    priorConfirmed.reduce((sum, o) => sum + (typeof o.totalPrice === 'number' ? o.totalPrice : 0), 0).toFixed(2),
  );
  const priorConfirmedOrders = priorConfirmed.length;
  const priorAov = priorConfirmedOrders > 0 ? Number((priorRevenue / priorConfirmedOrders).toFixed(2)) : 0;

  // Track product stats - initialized with all catalog products
  const productStatsMap = new Map<
    string,
    {
      productId: string;
      productSlug: string;
      name: string;
      tamilName?: string;
      category: string;
      isQuantized: boolean;
      stockUnit: string;
      totalLooseQuantity: number;
      packBuckets: Map<number, number>;
      ordersSet: Set<string>;
      totalRevenue: number;
      currentStockDisplay: string;
    }
  >();

  for (const prod of allProducts) {
    productStatsMap.set(prod.id, {
      productId: prod.id,
      productSlug: prod.slug,
      name: prod.name,
      tamilName: prod.tamilName,
      category: prod.category || 'General',
      isQuantized: !!prod.isQuantized,
      stockUnit: prod.stockUnit || 'g',
      totalLooseQuantity: 0,
      packBuckets: new Map<number, number>(),
      ordersSet: new Set<string>(),
      totalRevenue: 0,
      currentStockDisplay: formatCurrentStock(prod),
    });
  }

  // Track combo stats
  const comboStatsMap = new Map<
    string,
    {
      comboId: string;
      comboSlug: string;
      name: string;
      tamilName?: string;
      unitsSold: number;
      ordersSet: Set<string>;
      totalRevenue: number;
    }
  >();

  for (const combo of allCombos) {
    comboStatsMap.set(combo.id, {
      comboId: combo.id,
      comboSlug: combo.slug,
      name: combo.name,
      tamilName: combo.tamilName,
      unitsSold: 0,
      ordersSet: new Set<string>(),
      totalRevenue: 0,
    });
  }

  let totalLooseQuantitySold = 0;
  let totalPacketsSold = 0;
  let totalLineItemsSold = 0;

  // Process current confirmed orders
  for (const order of currentConfirmed) {
    if (!Array.isArray(order.orderItems)) continue;

    for (const item of order.orderItems) {
      totalLineItemsSold += 1;
      const linePrice = typeof item.price === 'number' ? item.price : 0;

      // Combo line
      if (item.comboId || item.comboSlug) {
        let cStat = item.comboId ? comboStatsMap.get(item.comboId) : undefined;
        if (!cStat && item.comboSlug) {
          for (const s of comboStatsMap.values()) {
            if (s.comboSlug === item.comboSlug) {
              cStat = s;
              break;
            }
          }
        }
        if (!cStat) {
          const newId = item.comboId || item.comboSlug || 'unknown-combo';
          cStat = {
            comboId: newId,
            comboSlug: item.comboSlug || newId,
            name: item.name || item.comboSlug || 'Combo',
            tamilName: item.tamilName,
            unitsSold: 0,
            ordersSet: new Set<string>(),
            totalRevenue: 0,
          };
          comboStatsMap.set(newId, cStat);
        }
        const comboQty = typeof item.quantity === 'number' ? item.quantity : 1;
        cStat.unitsSold += comboQty;
        cStat.ordersSet.add(order.id);
        cStat.totalRevenue = Number((cStat.totalRevenue + linePrice).toFixed(2));
        continue;
      }

      // Product line
      let pStat = item.productId ? productStatsMap.get(item.productId) : undefined;
      if (!pStat && item.productSlug) {
        for (const s of productStatsMap.values()) {
          if (s.productSlug === item.productSlug) {
            pStat = s;
            break;
          }
        }
      }

      // If product was deleted but exists in historical orders
      if (!pStat) {
        const fallbackId = item.productId || item.productSlug || 'unknown-product';
        const isQ = Array.isArray(item.quantity);
        pStat = {
          productId: fallbackId,
          productSlug: item.productSlug || fallbackId,
          name: item.name || item.productSlug || 'Deleted Product',
          tamilName: item.tamilName,
          category: 'Archived',
          isQuantized: isQ,
          stockUnit: item.stockUnit || (isQ ? 'pkts' : 'g'),
          totalLooseQuantity: 0,
          packBuckets: new Map<number, number>(),
          ordersSet: new Set<string>(),
          totalRevenue: 0,
          currentStockDisplay: 'Archived (0 on hand)',
        };
        productStatsMap.set(fallbackId, pStat);
      }

      pStat.ordersSet.add(order.id);
      pStat.totalRevenue = Number((pStat.totalRevenue + linePrice).toFixed(2));

      if (pStat.isQuantized) {
        if (Array.isArray(item.quantity)) {
          for (const q of item.quantity as QuantizedCount[]) {
            const size = Number(q.size) || 0;
            const count = Number(q.count) || 0;
            const prevCount = pStat.packBuckets.get(size) || 0;
            pStat.packBuckets.set(size, prevCount + count);
            pStat.totalLooseQuantity += size * count;
            totalPacketsSold += count;
          }
        }
      } else {
        const looseUnits = typeof item.quantity === 'number' ? item.quantity : 0;
        pStat.totalLooseQuantity += looseUnits;
        totalLooseQuantitySold += looseUnits;
      }
    }
  }

  // Convert product map to ProductSalesStat array
  const productSales: ProductSalesStat[] = Array.from(productStatsMap.values()).map((p) => {
    const packBreakdown: ProductPackBreakdown[] = Array.from(p.packBuckets.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => a.size - b.size);
    const totalPacksCount = packBreakdown.reduce((sum, b) => sum + b.count, 0);

    const quantityDisplay = p.isQuantized
      ? formatPacksBreakdown(packBreakdown, p.stockUnit)
      : formatLooseQty(p.totalLooseQuantity, p.stockUnit);

    const percentOfTotalSales =
      totalRevenue > 0 ? Number(((p.totalRevenue / totalRevenue) * 100).toFixed(1)) : 0;

    return {
      productId: p.productId,
      productSlug: p.productSlug,
      name: p.name,
      tamilName: p.tamilName,
      category: p.category,
      isQuantized: p.isQuantized,
      stockUnit: p.stockUnit,
      totalLooseQuantity: p.totalLooseQuantity,
      packBreakdown,
      totalPacksCount,
      quantityDisplay,
      ordersCount: p.ordersSet.size,
      totalRevenue: p.totalRevenue,
      percentOfTotalSales,
      currentStockDisplay: p.currentStockDisplay,
    };
  });

  // Sort by revenue descending by default
  productSales.sort((a, b) => b.totalRevenue - a.totalRevenue || b.ordersCount - a.ordersCount);

  // Best selling product
  const topProduct = productSales.find((p) => p.totalRevenue > 0 || p.ordersCount > 0);
  const bestSellingProduct = topProduct
    ? {
        productId: topProduct.productId,
        productSlug: topProduct.productSlug,
        name: topProduct.name,
        tamilName: topProduct.tamilName,
        quantityDisplay: topProduct.quantityDisplay,
        totalRevenue: topProduct.totalRevenue,
      }
    : null;

  // Convert combo map to ComboSalesStat array
  const comboSales = Array.from(comboStatsMap.values())
    .map((c) => ({
      comboId: c.comboId,
      comboSlug: c.comboSlug,
      name: c.name,
      tamilName: c.tamilName,
      unitsSold: c.unitsSold,
      ordersCount: c.ordersSet.size,
      totalRevenue: c.totalRevenue,
      percentOfTotalSales:
        totalRevenue > 0 ? Number(((c.totalRevenue / totalRevenue) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue || b.unitsSold - a.unitsSold);

  // Time aggregation for trend chart
  const isHourly = durationMs <= 25 * 3600 * 1000; // <= 25 hours -> hourly
  const trendMap = new Map<
    string,
    { label: string; date: string; revenue: number; ordersCount: number; priorRevenue: number; priorOrdersCount: number }
  >();

  if (isHourly) {
    // 24 hourly points
    for (let h = 0; h < 24; h++) {
      const hh = h.toString().padStart(2, '0');
      const label = `${hh}:00`;
      trendMap.set(label, {
        label,
        date: label,
        revenue: 0,
        ordersCount: 0,
        priorRevenue: 0,
        priorOrdersCount: 0,
      });
    }

    for (const o of currentConfirmed) {
      const oDate = new Date(new Date(o.createdAt).getTime() + timezoneOffsetMinutes * 60000);
      const label = `${oDate.getUTCHours().toString().padStart(2, '0')}:00`;
      const pt = trendMap.get(label);
      if (pt) {
        pt.revenue = Number((pt.revenue + (o.totalPrice || 0)).toFixed(2));
        pt.ordersCount += 1;
      }
    }

    for (const o of priorConfirmed) {
      const oDate = new Date(new Date(o.createdAt).getTime() + timezoneOffsetMinutes * 60000);
      const label = `${oDate.getUTCHours().toString().padStart(2, '0')}:00`;
      const pt = trendMap.get(label);
      if (pt) {
        pt.priorRevenue = Number((pt.priorRevenue + (o.totalPrice || 0)).toFixed(2));
        pt.priorOrdersCount += 1;
      }
    }
  } else {
    // Daily points
    const cur = new Date(start.getTime());
    while (cur <= end) {
      const localCur = new Date(cur.getTime() + timezoneOffsetMinutes * 60000);
      const yyyy = localCur.getUTCFullYear();
      const mm = (localCur.getUTCMonth() + 1).toString().padStart(2, '0');
      const dd = localCur.getUTCDate().toString().padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${dd} ${monthNames[localCur.getUTCMonth()]}`;

      trendMap.set(key, {
        label,
        date: key,
        revenue: 0,
        ordersCount: 0,
        priorRevenue: 0,
        priorOrdersCount: 0,
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    for (const o of currentConfirmed) {
      const oDate = new Date(new Date(o.createdAt).getTime() + timezoneOffsetMinutes * 60000);
      const yyyy = oDate.getUTCFullYear();
      const mm = (oDate.getUTCMonth() + 1).toString().padStart(2, '0');
      const dd = oDate.getUTCDate().toString().padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const pt = trendMap.get(key);
      if (pt) {
        pt.revenue = Number((pt.revenue + (o.totalPrice || 0)).toFixed(2));
        pt.ordersCount += 1;
      }
    }

    // Map prior period daily trend if same duration
    const trendKeys = Array.from(trendMap.keys());
    for (const o of priorConfirmed) {
      const oOffset = new Date(o.createdAt).getTime() - priorStart.getTime();
      const index = Math.floor((oOffset / durationMs) * trendKeys.length);
      const key = trendKeys[Math.min(index, trendKeys.length - 1)];
      if (key) {
        const pt = trendMap.get(key);
        if (pt) {
          pt.priorRevenue = Number((pt.priorRevenue + (o.totalPrice || 0)).toFixed(2));
          pt.priorOrdersCount += 1;
        }
      }
    }
  }

  const trend: TrendPoint[] = Array.from(trendMap.values());

  // Distribution calculations
  const allCurrentOrders = [...currentConfirmed, ...currentUnconfirmed].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const totalAllOrdersCount = allCurrentOrders.length;

  // Source Distribution
  let inStoreCount = 0;
  let inStoreRev = 0;
  let onlineCount = 0;
  let onlineRev = 0;

  for (const o of allCurrentOrders) {
    const isOnline = o.source === 'online';
    const isConf = o.status === 'confirmed';
    const rev = isConf && typeof o.totalPrice === 'number' ? o.totalPrice : 0;
    if (isOnline) {
      onlineCount += 1;
      onlineRev += rev;
    } else {
      inStoreCount += 1;
      inStoreRev += rev;
    }
  }

  const sourceDistribution = [
    {
      key: 'in-store',
      label: 'In-Store POS',
      count: inStoreCount,
      revenue: Number(inStoreRev.toFixed(2)),
      percentage: totalAllOrdersCount > 0 ? Number(((inStoreCount / totalAllOrdersCount) * 100).toFixed(1)) : 0,
    },
    {
      key: 'online',
      label: 'Online Store',
      count: onlineCount,
      revenue: Number(onlineRev.toFixed(2)),
      percentage: totalAllOrdersCount > 0 ? Number(((onlineCount / totalAllOrdersCount) * 100).toFixed(1)) : 0,
    },
  ];

  // Status Distribution
  const confirmedCount = currentConfirmed.length;
  const unconfirmedCount = currentUnconfirmed.length;

  const statusDistribution = [
    {
      key: 'confirmed',
      label: 'Confirmed',
      count: confirmedCount,
      percentage: totalAllOrdersCount > 0 ? Number(((confirmedCount / totalAllOrdersCount) * 100).toFixed(1)) : 0,
    },
    {
      key: 'unconfirmed',
      label: 'Unconfirmed / Pending',
      count: unconfirmedCount,
      percentage: totalAllOrdersCount > 0 ? Number(((unconfirmedCount / totalAllOrdersCount) * 100).toFixed(1)) : 0,
    },
  ];

  // Recent Orders Preview (up to 5)
  const recentOrdersPreview = allCurrentOrders.slice(0, 5).map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    createdAt: o.createdAt,
    status: o.status,
    source: o.source,
    customerName: o.customerData?.customerName || 'Walk-in Customer',
    itemCount: Array.isArray(o.orderItems) ? o.orderItems.length : 0,
    totalPrice: typeof o.totalPrice === 'number' ? o.totalPrice : 0,
  }));

  return {
    dateRange: {
      startDate,
      endDate,
      priorStartDate: priorStart.toISOString(),
      priorEndDate: priorEnd.toISOString(),
    },
    kpis: {
      totalRevenue,
      totalConfirmedOrders,
      totalUnconfirmedOrders,
      averageOrderValue,
      totalLooseQuantitySold,
      totalPacketsSold,
      totalLineItemsSold,
      bestSellingProduct,
      revenueChangePct: pctChange(totalRevenue, priorRevenue),
      ordersChangePct: pctChange(totalConfirmedOrders, priorConfirmedOrders),
      aovChangePct: pctChange(averageOrderValue, priorAov),
    },
    trend,
    sourceDistribution,
    statusDistribution,
    productSales,
    comboSales,
    recentOrdersPreview,
  };
}

export async function listHistoricalOrders(query: OrderHistoryQuery): Promise<PaginatedOrdersResponse> {
  const {
    page = 1,
    limit = 15,
    startDate,
    endDate,
    source = 'all',
    status = 'all',
    search = '',
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = query;

  const { orders } = await getCollections();
  const filter: Record<string, any> = {};

  if (startDate && endDate) {
    filter.createdAt = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.createdAt = { $gte: startDate };
  } else if (endDate) {
    filter.createdAt = { $lte: endDate };
  }

  if (source && source !== 'all') {
    filter.source = source;
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const sRegex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { orderNo: sRegex },
      { 'customerData.customerName': sRegex },
      { 'customerData.mobile': sRegex },
      { 'orderItems.name': sRegex },
      { 'orderItems.productSlug': sRegex },
    ];
  }

  const sortDirection = sortDir === 'asc' ? 1 : -1;
  const sortKey = sortBy === 'totalPrice' ? 'totalPrice' : 'createdAt';

  const skip = (Math.max(1, page) - 1) * limit;

  const [total, items] = await Promise.all([
    orders.countDocuments(filter),
    orders.find(filter).sort({ [sortKey]: sortDirection }).skip(skip).limit(limit).toArray(),
  ]);

  return {
    orders: items as Order[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProductSalesDetail(params: {
  productId: string;
  startDate: string;
  endDate: string;
  timezoneOffsetMinutes?: number;
}): Promise<ProductSalesDetailResponse> {
  const { productId, startDate, endDate, timezoneOffsetMinutes = 330 } = params;
  const { products, orders } = await getCollections();

  const product = (await products.findOne({ id: productId })) || (await products.findOne({ slug: productId }));

  const confirmedOrders = await orders
    .find({
      status: 'confirmed',
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [
        { 'orderItems.productId': productId },
        ...(product ? [{ 'orderItems.productSlug': product.slug }] : []),
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  let totalLoose = 0;
  const packBuckets = new Map<number, number>();
  let totalRevenue = 0;
  const isQ = product ? product.isQuantized : false;
  const stockUnit = product ? product.stockUnit : 'g';

  const recentOrders: ProductSalesDetailResponse['recentOrders'] = [];

  for (const o of confirmedOrders) {
    for (const item of o.orderItems) {
      const match = item.productId === productId || (product && item.productSlug === product.slug);
      if (!match) continue;

      const price = typeof item.price === 'number' ? item.price : 0;
      totalRevenue = Number((totalRevenue + price).toFixed(2));

      let qDisp = '';
      if (isQ && Array.isArray(item.quantity)) {
        for (const q of item.quantity as QuantizedCount[]) {
          packBuckets.set(q.size, (packBuckets.get(q.size) || 0) + q.count);
          totalLoose += q.size * q.count;
        }
        qDisp = (item.quantity as QuantizedCount[]).map((q) => `${q.count} × ${q.size}${stockUnit}`).join(', ');
      } else {
        const loose = typeof item.quantity === 'number' ? item.quantity : 0;
        totalLoose += loose;
        qDisp = formatLooseQty(loose, stockUnit);
      }

      recentOrders.push({
        id: o.id,
        orderNo: o.orderNo,
        createdAt: o.createdAt,
        status: o.status,
        source: o.source,
        customerName: o.customerData?.customerName || 'Walk-in Customer',
        quantityDisplay: qDisp,
        price,
      });
    }
  }

  const packBreakdown: ProductPackBreakdown[] = Array.from(packBuckets.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => a.size - b.size);

  const stats: ProductSalesStat = {
    productId,
    productSlug: product ? product.slug : productId,
    name: product ? product.name : (recentOrders[0]?.quantityDisplay || 'Unknown'),
    tamilName: product ? product.tamilName : undefined,
    category: product ? product.category : 'General',
    isQuantized: isQ,
    stockUnit,
    totalLooseQuantity: totalLoose,
    packBreakdown,
    totalPacksCount: packBreakdown.reduce((s, b) => s + b.count, 0),
    quantityDisplay: isQ ? formatPacksBreakdown(packBreakdown, stockUnit) : formatLooseQty(totalLoose, stockUnit),
    ordersCount: confirmedOrders.length,
    totalRevenue,
    percentOfTotalSales: 0,
    currentStockDisplay: product ? formatCurrentStock(product) : '0',
  };

  // Trend aggregation for single product
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start.getTime());
  const trendMap = new Map<string, TrendPoint>();

  while (cur <= end) {
    const localCur = new Date(cur.getTime() + timezoneOffsetMinutes * 60000);
    const yyyy = localCur.getUTCFullYear();
    const mm = (localCur.getUTCMonth() + 1).toString().padStart(2, '0');
    const dd = localCur.getUTCDate().toString().padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${dd} ${monthNames[localCur.getUTCMonth()]}`;
    trendMap.set(key, { label, date: key, revenue: 0, ordersCount: 0 });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  for (const o of confirmedOrders) {
    const oDate = new Date(new Date(o.createdAt).getTime() + timezoneOffsetMinutes * 60000);
    const key = `${oDate.getUTCFullYear()}-${(oDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${oDate.getUTCDate().toString().padStart(2, '0')}`;
    const pt = trendMap.get(key);
    if (pt) {
      for (const it of o.orderItems) {
        if (it.productId === productId || (product && it.productSlug === product.slug)) {
          pt.revenue = Number((pt.revenue + (it.price || 0)).toFixed(2));
          pt.ordersCount += 1;
        }
      }
    }
  }

  return {
    product: product as Product | null,
    stats,
    salesTrend: Array.from(trendMap.values()),
    recentOrders,
  };
}
