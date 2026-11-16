import { WeightOption } from '../config/storeConfig';

export type ProductCategory =
  | 'all'
  | 'pulses'
  | 'rice-grains'
  | 'chickpeas'
  | 'spices'
  | 'masalas'
  | 'oils'
  | 'household'
  | 'nuts-dryfruits';

export interface CategoryInfo {
  id: ProductCategory;
  englishLabel: string;
  tamilLabel: string;
  iconName?: string;
  count?: number;
  seoDescription?: string;
  image?: string;
}

export interface Product {
  id: string;
  englishName: string;
  tamilName: string;
  category: ProductCategory;
  categoryName: string;
  image: string;
  description: string;
  availableWeights: WeightOption[];
  featured?: boolean;
  popular?: boolean;
  seoKeywords?: string[];
}

export interface CartItem {
  id: string; // unique item id: e.g. "toor-dal_500g" or "combo-1"
  productId: string;
  englishName: string;
  tamilName: string;
  categoryName: string;
  image: string;
  weight: WeightOption | string;
  quantity: number;
  isCombo?: boolean;
  comboName?: string; // e.g. "Combo 1"
  comboNumber?: number; // e.g. 1
  comboId?: string;
  comboIncludedText?: string; // e.g. "Grade-W240 Cashews (500g), California Almonds (500g), Sun-Dried Raisins (500g)"
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

export type OfferType =
  | 'percentage_discount'
  | 'bogo'
  | 'fixed_combo'
  | 'announcement';

export type OfferStatus = 'draft' | 'active' | 'inactive';

export interface ComboIncludedItem {
  productId: string;
  weight: WeightOption;
  quantity?: number;
  label?: string;
}

export interface ComboOffer {
  id: string;
  comboNumber?: number; // 1, 2, 3, etc.
  comboName?: string; // "Combo 1", "Combo 2", etc.
  title: string;
  description: string;
  offerType: OfferType;
  discountPercentage?: number;
  discountLabel: string;
  image: string; // 16:9 ratio recommended
  startDate?: string;
  endDate?: string;
  validUntil: string;
  termsAndConditions: string;
  ctaText?: string;
  status: OfferStatus;
  isActive: boolean; // computed/synced with status === 'active'
  featured?: boolean;
  createdAt: string;
  includedItems?: ComboIncludedItem[];
  includedSummary?: string;
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
