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
  /** Combo price in paise — usually less than the summed product price. */
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * One combo component. `quantity` matches the component product's own stock
 * shape: a base-unit number for loose components, a QuantizedCount array for
 * quantized ones. Order quantity scales every component: 2 combos deduct
 * 2 × quantity each (counts multiply for quantized).
 * `productSlug` is the join key; `name` / `tamilName` are display snapshots
 * copied from the product so combo rows render without a catalog lookup.
 */
export interface ComboProduct {
  productSlug: string;
  name: string;
  tamilName?: string;
  quantity: number | QuantizedCount[];
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
   * Product lines store the product's own stock shape: a base-unit number
   * for loose products, a QuantizedCount array for quantized ones. Combo
   * lines store the combo-unit count (a plain number).
   * `price` is the line total in paise.
   */
  quantity: number | QuantizedCount[];
  /** Line total in paise (unit price x quantity, incl. any custom-price edit). */
  price: number;
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
  productSlug: string;
  reason: string;
  orderId?: string;
  createdAt: string;
  /** Signed base-unit delta (negative = sale). Always a flat number, even for quantized products. */
  quantity: number;
}
