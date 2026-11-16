/** @bqm/types — shared domain types. Mirrors packages/er_diagram.md. */

export interface QuantityPrice {
  quantity: number;
  price: number;
}

/** One fixed-size pack bucket: `size` base units × `count` packs. */
export interface PackCount {
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
  isQuantized: boolean;
  stockUnit: string;
  stockBaseQty: number;
  /**
   * Bucketed on-hand packs for isQuantized items only (e.g. [{size:500,count:4}]).
   * Informative breakdown of stockBaseQty: Σ(size × count) === stockBaseQty.
   * Loose items omit this; zero-stock quantized items use [].
   */
  stockPacks?: PackCount[];
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
  /** Product slug for a product line. Exactly one of productSlug / comboSlug is set. */
  productSlug?: string;
  /** Combo slug for a combo line. Exactly one of productSlug / comboSlug is set. */
  comboSlug?: string;
  /**
   * Count in base units (e.g. grams when stockUnit is 'g', count when 'pcs').
   * UI converts packs/tiers to base units before sending; server deducts stock
   * by exactly this amount. `price` is the line total in paise.
   */
  quantity: number;
  /** Line total in paise (unit price x quantity, incl. any custom-price edit). */
  price: number;
  /**
   * Quantized breakdown for isQuantized product lines only
   * (e.g. 2 × 100g = [{size:100,count:2}]).
   * Σ(size × count) must equal `quantity`. Loose and combo lines omit this.
   */
  packs?: PackCount[];
}

/** Order lifecycle: pending -> paid -> shipped -> delivered (+ cancelled).
 * Stock deducts once on the transition into `paid`. Kept as plain strings
 * in the DB; this union is the enforced set for billing-desk writes. */
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

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
