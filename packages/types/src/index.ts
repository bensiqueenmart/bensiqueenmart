/** @bqm/types — shared domain types. Mirrors packages/er_diagram.md. */

export interface QuantityPrice {
  quantity: number;
  price: number;
}

/** One quantized count: `size` base units × `count` packs. The only quantity shape for quantized items. */
export interface QuantizedCount {
  size: number;
  count: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Website display name (Tamil). Optional — kept so the catalog import is lossless. */
  tamilName?: string;
  /** Website image path. Optional — kept so the catalog import is lossless. */
  image?: string;
  description: string;
  category: string;
  /**
   * Discriminator for every quantity field: loose products store plain base
   * units, quantized products store QuantizedCount buckets. Repo methods and
   * UI branch on this.
   */
  isQuantized: boolean;
  stockUnit: string;
  /**
   * On-hand stock, shape chosen by `isQuantized`: loose items store base
   * units (e.g. 15000); quantized items store the pack buckets themselves
   * (e.g. [{size:500,count:4}]) — the buckets ARE the stock. Total stock for
   * a quantized item is Σ(size × count), computed only for display.
   */
  stock: number | QuantizedCount[];
  pricePerUnit?: number;
  quantityPrice: QuantityPrice[];
  createdAt: string;
  updatedAt: string;
}

export interface Combo {
  id: string;
  slug: string;
  name: string;
  /** Tamil display name. Optional — same convention as Product.tamilName. */
  tamilName?: string;
  /** Cloudinary secure_url (or legacy local `/images/…` path). Optional. */
  image?: string;
  description: string;
  isActive: boolean;
  /**
   * Components included in one unit of this combo.
   * `quantity` is the authoritative base-unit amount of that component
   * (e.g. 200 grams when stockUnit is 'g'); quantized components also carry
   * `packs` with Σ(size × count) === quantity. Order quantity scales every
   * component: 2 combos deduct 2 × quantity each.
   */
  products: ComboProduct[];
  /** Combo price in rupees (2-decimal rounded) — usually less than the summed product price. */
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * One combo component. `productId` is the join key (immutable UUID — safe
 * across slug reuse after delete+recreate); `productSlug` / `name` /
 * `tamilName` are purchase-time snapshots for display and audit only.
 * `quantity` matches the component product's own stock shape: a base-unit
 * number for loose components, a QuantizedCount array for quantized ones.
 * Order quantity scales every component: 2 combos deduct 2 × quantity each
 * (counts multiply for quantized).
 */
export interface ComboProduct {
  productId: string;
  productSlug: string;
  name: string;
  tamilName?: string;
  quantity: number | QuantizedCount[];
}

export interface CustomerData {
  customerName: string;
  mobile: string;
  fullAddress: string;
  instructions?: string;
}

/**
 * Wire shape for a new order line. Slugs only — the server resolves them to
 * ids and snapshots display data at write time, so clients can never forge
 * or stale a stored reference.
 */
export interface OrderItemInput {
  productSlug?: string;
  comboSlug?: string;
  /**
   * Product lines store the product's own stock shape: a base-unit number
   * for loose products, a QuantizedCount array for quantized ones. Combo
   * lines store the combo-unit count (a plain number).
   */
  quantity: number | QuantizedCount[];
  /** Line total in rupees (2-decimal rounded). */
  price: number;
}

/**
 * One stored order line. `productId` / `comboId` are the behavioral join
 * keys (immutable UUIDs — slug reuse after delete+recreate can never
 * misattach history). Slugs, names, and unit are purchase-time snapshots for
 * display and audit only. `deduction` is the expanded per-product stock
 * movement snapshotted at first deduction; restores replay it verbatim so
 * later combo edits cannot drift the math.
 */
export interface OrderItem {
  productId?: string;
  comboId?: string;
  productSlug?: string;
  comboSlug?: string;
  name: string;
  tamilName?: string;
  /** Product stockUnit snapshot (product lines only) — renders qty without a catalog lookup. */
  stockUnit?: string;
  quantity: number | QuantizedCount[];
  /** Line total in rupees (2-decimal rounded). */
  price: number;
  deduction?: StockDeductionLine[];
}

/** One expanded per-product stock line: signed delta, negative = deduct. */
export interface StockDeductionLine {
  productId: string;
  productSlug: string;
  delta: number | QuantizedCount[];
}

/** Order lifecycle: unconfirmed <-> confirmed. The only distinction that
 * matters is stock: `unconfirmed` = stock untouched, `confirmed` = stock
 * deducted. Toggling back restores the exact deducted lines; deleting a
 * confirmed order may restore or skip restocking (explicit choice), always
 * recorded in stockMovements. Kept as plain strings in the DB; this union
 * is the enforced set for billing-desk writes. */
export type OrderStatus = 'unconfirmed' | 'confirmed';

/**
 * Where an order originated. Exactly two values for now:
 * - `in-store` — billing-desk POS terminal.
 * - `online`   — website order.
 * Stored as plain strings in the DB; this union is the enforced set for writes.
 */
export type OrderSource = 'in-store' | 'online';

export interface Order {
  id: string;
  orderNo: string;
  source: OrderSource;
  status: string;
  totalPrice: number;
  customerData: CustomerData;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  /** Authoritative join key (immutable product UUID). */
  productId: string;
  /** Slug snapshot at write time — display/audit only, never a join key. */
  productSlug: string;
  reason: string;
  orderId?: string;
  createdAt: string;
  /** Signed base-unit delta (negative = sale). Always a flat number, even for quantized products. */
  quantity: number;
}

/**
 * Public storefront product — the ONLY product shape the website may see.
 * Deliberately has no `stock` field: availability is a single boolean
 * computed server-side. Raw quantities never leave the server.
 * Prices stay in the payload for a future "show prices" switch; the
 * website UI must not render them today.
 */
export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  tamilName?: string;
  image?: string;
  description: string;
  category: string;
  isQuantized: boolean;
  stockUnit: string;
  /** True when at least the minimum purchasable quantity is on hand. The only stock signal. */
  available: boolean;
  pricePerUnit?: number;
  quantityPrice: QuantityPrice[];
}

/**
 * One combo content line, display-safe: names + a preformatted pack string
 * (e.g. "500g", "2 × 500g"). No ids, no stock shapes.
 */
export interface PublicComboItem {
  name: string;
  tamilName?: string;
  qty: string;
}

/**
 * Public storefront combo — same redaction contract as PublicProduct.
 * `available` means active AND every component fulfillable from stock.
 * `totalPrice` stays in the payload for the future price switch; not rendered today.
 */
export interface PublicCombo {
  id: string;
  slug: string;
  name: string;
  tamilName?: string;
  image?: string;
  description: string;
  isActive: boolean;
  available: boolean;
  contents: PublicComboItem[];
  totalPrice: number;
}

/** What GET /api/products on public-website returns. No stock quantities anywhere. */
export interface PublicCatalog {
  products: PublicProduct[];
  combos: PublicCombo[];
}

// ---------------------------------------------------------------------------
// Sales Analytics & Reporting Types
// ---------------------------------------------------------------------------

export interface SalesKPIs {
  totalRevenue: number;
  totalConfirmedOrders: number;
  totalUnconfirmedOrders: number;
  averageOrderValue: number;
  totalLooseQuantitySold: number;
  totalPacketsSold: number;
  totalLineItemsSold: number;
  bestSellingProduct: {
    productId: string;
    productSlug: string;
    name: string;
    tamilName?: string;
    quantityDisplay: string;
    totalRevenue: number;
  } | null;
  revenueChangePct: number | null;
  ordersChangePct: number | null;
  aovChangePct: number | null;
}

export interface TrendPoint {
  date: string;
  label: string;
  revenue: number;
  ordersCount: number;
  priorRevenue?: number;
  priorOrdersCount?: number;
}

export interface ProductPackBreakdown {
  size: number;
  count: number;
}

export interface ProductSalesStat {
  productId: string;
  productSlug: string;
  name: string;
  tamilName?: string;
  category: string;
  isQuantized: boolean;
  stockUnit: string;
  totalLooseQuantity: number;
  packBreakdown: ProductPackBreakdown[];
  totalPacksCount: number;
  quantityDisplay: string;
  ordersCount: number;
  totalRevenue: number;
  percentOfTotalSales: number;
  currentStockDisplay: string;
}

export interface ComboSalesStat {
  comboId: string;
  comboSlug: string;
  name: string;
  tamilName?: string;
  unitsSold: number;
  ordersCount: number;
  totalRevenue: number;
  percentOfTotalSales: number;
}

export interface DistributionSlice {
  key: string;
  label: string;
  count: number;
  revenue?: number;
  percentage: number;
}

export interface RecentOrderPreview {
  id: string;
  orderNo: string;
  createdAt: string;
  status: string;
  source: string;
  customerName: string;
  itemCount: number;
  totalPrice: number;
}

export interface SalesAnalyticsResponse {
  dateRange: {
    startDate: string;
    endDate: string;
    priorStartDate: string;
    priorEndDate: string;
  };
  kpis: SalesKPIs;
  trend: TrendPoint[];
  sourceDistribution: DistributionSlice[];
  statusDistribution: DistributionSlice[];
  productSales: ProductSalesStat[];
  comboSales: ComboSalesStat[];
  recentOrdersPreview: RecentOrderPreview[];
}


export interface OrderHistoryQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  source?: 'all' | 'in-store' | 'online';
  status?: 'all' | 'confirmed' | 'unconfirmed' | 'cancelled';
  search?: string;
  sortBy?: 'createdAt' | 'totalPrice';
  sortDir?: 'desc' | 'asc';
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductSalesDetailResponse {
  product: Product | null;
  stats: ProductSalesStat;
  salesTrend: TrendPoint[];
  recentOrders: Array<{
    id: string;
    orderNo: string;
    createdAt: string;
    status: string;
    source: string;
    customerName: string;
    quantityDisplay: string;
    price: number;
  }>;
}

