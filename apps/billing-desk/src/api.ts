import type { Combo, Order, OrderItemInput, OrderStatus, Product } from '@bqm/types';

/** Fired on any 401 response so the app can drop back to the lock screen. */
let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(fn: () => void): void {
  unauthorizedHandler = fn;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 401 && unauthorizedHandler) {
    try {
      unauthorizedHandler();
    } catch {
      /* lock-screen fallback is best-effort */
    }
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? `HTTP ${res.status}`);
  return body as T;
}

export const authMe = () => request<{ authenticated: boolean }>('/api/auth/me');
export function login(username: string, password: string) {
  return request<{ ok: true }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
export function refreshSession() {
  return request<{ ok: true }>('/api/auth/refresh', { method: 'POST' });
}
export const logout = () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' });

export interface Catalog {
  products: Product[];
  combos: Combo[];
}

export interface PatchOrderResult {
  order: Order;
  stockDeducted: boolean;
  stockRestored: boolean;
  missingProducts: string[];
}

export interface OrdersPage {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const getCatalog = () => request<Catalog>('/api/products');

export function createOrder(orderItems: OrderItemInput[], customerData?: Record<string, string>) {
  return request<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ orderItems, customerData }),
  });
}

export function patchOrder(id: string, patch: Partial<Record<'status' | 'totalPrice', OrderStatus | number>> & { orderItems?: OrderItemInput[]; customerData?: Record<string, string> }) {
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

export const listOrders = (page = 1, limit = 20) =>
  request<OrdersPage>(`/api/orders?page=${page}&limit=${limit}`);

export const getOrder = (id: string) => request<Order>(`/api/orders/${encodeURIComponent(id)}`);

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
