import type {
  Combo,
  Order,
  OrderHistoryQuery,
  OrderItemInput,
  OrderStatus,
  PaginatedOrdersResponse,
  Product,
  ProductSalesDetailResponse,
  QuantizedCount,
  SalesAnalyticsResponse,
} from '@bqm/types';


async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? `HTTP ${res.status}`);
  return body as T;
}

export interface Catalog {
  products: Product[];
  combos: Combo[];
}

export interface OrdersPage {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PatchOrderResult {
  order: Order;
  stockDeducted: boolean;
  stockRestored: boolean;
  missingProducts: string[];
}

export const authMe = () => request<{ authenticated: boolean }>('/api/auth/me');
export function login(username: string, password: string) {
  return request<{ ok: true }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
export const logout = () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' });

export const getCatalog = () => request<Catalog>('/api/products');

export type StockDelta = number | QuantizedCount[];
export function adjustStock(slug: string, delta: StockDelta, reason: string) {
  return request<Product>(`/api/products/${encodeURIComponent(slug)}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ delta, reason }),
  });
}

export function patchProduct(slug: string, patch: Record<string, unknown>) {
  return request<Product>(`/api/products/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteProduct(slug: string) {
  return request<{ deleted: true; slug: string }>(`/api/products/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}

export function createProduct(body: Record<string, unknown>) {
  return request<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createCombo(body: Record<string, unknown>) {
  return request<Combo>('/api/combos', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function patchCombo(slug: string, patch: Record<string, unknown>) {
  return request<Combo>(`/api/combos/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export const listOrders = (page = 1, limit = 20) =>
  request<OrdersPage>(`/api/orders?page=${page}&limit=${limit}`);
export const getOrder = (id: string) => request<Order>(`/api/orders/${encodeURIComponent(id)}`);
export function patchOrder(id: string, patch: { status?: OrderStatus; orderItems?: OrderItemInput[]; totalPrice?: number; customerData?: Record<string, string> }) {
  return request<PatchOrderResult>(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
export function deleteOrder(id: string, restoreStock: boolean) {
  return request<{ deleted: true; stockRestored: boolean; missingProducts: string[] }>(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: JSON.stringify({ restoreStock }),
  });
}

/** ₹ formatting for rupee values (2 decimals). */
export const rupees = (n: number) => `₹${Number(n).toFixed(2)}`;

/**
 * Defensive date-time formatter that works across all browsers and Node/Electron runtimes
 * without ever throwing "TypeError: Invalid option : timeStyle".
 */
export function formatSafeDateTime(dateVal?: string | Date | number | null): string {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return String(dateVal);
  }
}

export function formatSafeDateOnly(dateVal?: string | Date | number | null): string {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(dateVal).slice(0, 10);
  }
}

/**
 * Resolve a product image path to a renderable src. Today images are local
 * (`/images/*` served from `public/`), so stored paths pass through
 * untouched. To migrate to cloud hosting, set `VITE_IMAGE_BASE` to the CDN
 * origin (e.g. `https://cdn.example.com`) — every `<img>` swaps over with
 * no code change. Absolute URLs in the DB are always used as-is.
 */
const IMAGE_BASE = (import.meta.env.VITE_IMAGE_BASE as string | undefined) ?? '';
export const imageSrc = (path?: string): string => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${IMAGE_BASE}${path}`;
};

/** Display total for either stock shape. */
export const stockLabel = (p: Product) =>
  Array.isArray(p.stock)
    ? `${p.stock.reduce((s, q) => s + q.size * q.count, 0)}${p.stockUnit} (${p.stock.map((q) => `${q.size}×${q.count}`).join(' + ')})`
    : `${p.stock}${p.stockUnit}`;

// ---------------------------------------------------------------------------
// Sales Analytics Client Methods
// ---------------------------------------------------------------------------

export function getSalesAnalytics(startDate: string, endDate: string, tzOffset = 330) {
  const q = new URLSearchParams({ startDate, endDate, tzOffset: String(tzOffset) });
  return request<SalesAnalyticsResponse>(`/api/analytics/sales?${q.toString()}`);
}

export function listHistoricalOrders(query: OrderHistoryQuery) {
  const q = new URLSearchParams();
  if (query.page) q.set('page', String(query.page));
  if (query.limit) q.set('limit', String(query.limit));
  if (query.startDate) q.set('startDate', query.startDate);
  if (query.endDate) q.set('endDate', query.endDate);
  if (query.source && query.source !== 'all') q.set('source', query.source);
  if (query.status && query.status !== 'all') q.set('status', query.status);
  if (query.search) q.set('search', query.search);
  if (query.sortBy) q.set('sortBy', query.sortBy);
  if (query.sortDir) q.set('sortDir', query.sortDir);
  return request<PaginatedOrdersResponse>(`/api/analytics/orders?${q.toString()}`);
}

export function getProductSalesDetail(productId: string, startDate: string, endDate: string, tzOffset = 330) {
  const q = new URLSearchParams({
    productId,
    startDate,
    endDate,
    tzOffset: String(tzOffset),
  });
  return request<ProductSalesDetailResponse>(`/api/analytics/product-detail?${q.toString()}`);
}

export function getExportOrdersUrl(query: OrderHistoryQuery): string {
  const q = new URLSearchParams();
  if (query.startDate) q.set('startDate', query.startDate);
  if (query.endDate) q.set('endDate', query.endDate);
  if (query.source && query.source !== 'all') q.set('source', query.source);
  if (query.status && query.status !== 'all') q.set('status', query.status);
  if (query.search) q.set('search', query.search);
  if (query.sortBy) q.set('sortBy', query.sortBy);
  if (query.sortDir) q.set('sortDir', query.sortDir);
  return `/api/analytics/export?${q.toString()}`;
}

