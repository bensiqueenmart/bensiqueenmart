/** @bqm/types — shared domain types. Mirrors packages/er_diagram.md. */

export interface QuantityPrice {
  quantity: number;
  price: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  isQuantized: boolean;
  stockUnit: string;
  stockBaseQty: number;
  pricePerUnit?: number;
  quantityPrice: QuantityPrice[];
  createdAt: string;
  updatedAt: string;
}

export interface Combo {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  /** Slugs of the products included in this combo. */
  products: string[];
  /** Combo price in paise — usually less than the summed product price. */
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerData {
  customerName: string;
  mobile: string;
  fullAddress: string;
}

export interface OrderItem {
  productSlug: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNo: string;
  source: string;
  status: string;
  totalPrice: number;
  customerData: CustomerData;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productSlug: string;
  reason: string;
  orderId?: string;
  createdAt: string;
  quantity: number;
}
