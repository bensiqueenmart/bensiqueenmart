/** Local mirrors of the website's content shapes (admin edits raw JSON, no cross-app imports). */
export interface Business {
  storeName: string; tagline: string; subTagline: string;
  ownerWhatsappNumber: string; phone: string; displayPhone: string; email: string;
  address: string; streetAddress: string; landmark: string;
  city: string; pincode: string; state: string;
  openTime: string; closeTime: string; businessHours: string;
  geo: { lat: number; lng: number };
  logoUrl: string; websiteUrl: string;
}

export interface Delivery {
  areas: string[];
  zones: { area: string; time: string; status: string }[];
}

export interface Faq {
  id: number; category: string; categoryLabel: string;
  question: string; answer: string; popular?: boolean; showOnHome: boolean;
}

export interface Review {
  id: string; authorName: string; location: string; reviewText: string;
  rating: number; reviewDate: string; verifiedPurchase: boolean;
  isApproved: boolean; featuredOnAbout?: boolean; source: string;
}

export interface About {
  productCategories: {
    num: string; title: string; tamilTitle: string; desc: string;
    items: string[]; image: string; tag: string; category: string;
  }[];
  trustPillars: { icon: string; title: string; desc: string }[];
  timeline: { year: string; title: string; desc: string }[];
}

export interface Home {
  comparisonPoints: { feature: string; bensi: string; supermarket: string }[];
  marqueeItems: string[];
  ratingBars: { stars: number; pct: number }[];
  cycleWords: string[];
}

export interface Article {
  id: string; titleEn: string; titleTa: string;
  excerptEn: string; excerptTa: string;
  category: string; readTime: string; image: string;
}

export const PILLAR_ICONS = ['ShieldCheck', 'MapPin', 'Truck', 'Heart'];
