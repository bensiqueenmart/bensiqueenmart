import type { Combo, Order, OrderItem, OrderStatus, Product } from '@bqm/types';

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

export interface PatchOrderResult {
  order: Order;
  stockDeducted: boolean;
  stockRestored: boolean;
}

export interface OrdersPage {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const getCatalog = () => request<Catalog>('/api/products');

export function createOrder(orderItems: OrderItem[], customerData?: Record<string, string>) {
  return request<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ orderItems, customerData }),
  });
}

export function patchOrder(id: string, patch: Partial<Record<'status' | 'totalPrice', OrderStatus | number>> & { orderItems?: OrderItem[]; customerData?: Record<string, string> }) {
  return request<PatchOrderResult>(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteOrder(id: string, restoreStock: boolean) {
  return request<{ deleted: true; stockRestored: boolean }>(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: JSON.stringify({ restoreStock }),
  });
}

export const listOrders = (page = 1, limit = 20) =>
  request<OrdersPage>(`/api/orders?page=${page}&limit=${limit}`);

export const getOrder = (id: string) => request<Order>(`/api/orders/${encodeURIComponent(id)}`);

/** ₹ formatting for integer-paise values. */
export const paise = (n: number) => `₹${(n / 100).toFixed(2)}`;
