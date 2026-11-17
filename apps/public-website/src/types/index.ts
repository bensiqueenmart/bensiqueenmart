/** Product category slug (e.g. 'pulses', 'spices'). 'all' means no filter. */
export type ProductCategory = string;

export interface CategoryInfo {
  id: string;
  englishLabel: string;
  tamilLabel?: string;
  image?: string;
  count?: number;
}

export interface CartItem {
  id: string; // unique item id: e.g. "toor-dal_500g" or "combo-1"
  productId: string;
  englishName: string;
  tamilName: string;
  categoryName: string;
  image: string;
  weight: string;
  quantity: number;
  isCombo?: boolean;
  comboName?: string; // e.g. "Combo 1"
  comboNumber?: number; // e.g. 1
  comboId?: string;
  comboIncludedText?: string; // e.g. "Cashew Nuts (500g), Almonds (500g)"
}

export interface CustomerDetails {
  name: string;
  mobile: string;
  address: string;
  instructions?: string;
}

export interface OrderSummaryData {
  orderRef: string;
  date: string;
  time: string;
  customer: CustomerDetails;
  items: CartItem[];
  totalItemCount: number;
  totalQuantity: number;
}

export interface CustomerReview {
  id: string;
  authorName: string;
  location: string;
  reviewText: string;
  rating: number; // 1 to 5 stars
  reviewDate: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  isSample: boolean; // clearly flagged if sample/placeholder
}
