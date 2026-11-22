export interface BusinessInfo {
  storeName: string;
  tagline: string;
  subTagline: string;
  whatsappNumber: string;
  primaryPhone: string;
  secondaryDisplayPhone: string;
  email: string;
  address: string;
  streetAddress: string;
  landmark: string;
  city: string;
  pincode: string;
  state: string;
  openTime: string;
  closeTime: string;
  businessHours: string;
  geo: { lat: number; lng: number };
  logoUrl: string;
  websiteUrl: string;
}

export interface DeliveryInfo {
  areas: string[];
  zones: { area: string; time: string; status: string }[];
}

export interface FaqItem {
  id: number;
  category: string;
  categoryLabel: string;
  question: string;
  answer: string;
  popular?: boolean;
  showOnHome: boolean;
}

export interface SiteReview {
  id: string;
  authorName: string;
  location: string;
  reviewText: string;
  rating: number;
  reviewDate: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  featuredOnAbout?: boolean;
  source: string;
}

export interface TrustPillar {
  icon: string;
  title: string;
  desc: string;
}

export interface AboutCategory {
  num: string;
  title: string;
  tamilTitle: string;
  desc: string;
  items: string[];
  image: string;
  tag: string;
  category: string;
}

export interface TimelineEntry {
  year: string;
  title: string;
  desc: string;
}

export interface AboutInfo {
  productCategories: AboutCategory[];
  trustPillars: TrustPillar[];
  timeline: TimelineEntry[];
}

export interface ComparisonPoint {
  feature: string;
  bensi: string;
  supermarket: string;
}

export interface RatingBar {
  stars: number;
  pct: number;
}

export interface HomeInfo {
  comparisonPoints: ComparisonPoint[];
  marqueeItems: string[];
  ratingBars: RatingBar[];
  cycleWords: string[];
}

export interface BlogArticle {
  id: string;
  titleEn: string;
  titleTa: string;
  excerptEn: string;
  excerptTa: string;
  category: string;
  readTime: string;
  image: string;
}
