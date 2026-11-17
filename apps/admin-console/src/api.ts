import type { Combo, Order, OrderItemInput, OrderStatus, Product, QuantizedCount } from '@bqm/types';

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
