import { ShieldCheck, MapPin, Truck, Heart, type LucideIcon } from 'lucide-react';
import businessJson from '../data/business.json';
import deliveryJson from '../data/delivery.json';
import faqsJson from '../data/faqs.json';
import reviewsJson from '../data/reviews.json';
import aboutJson from '../data/about.json';
import homeJson from '../data/home.json';
import blogJson from '../data/blog.json';
import type {
  BusinessInfo,
  DeliveryInfo,
  FaqItem,
  SiteReview,
  AboutInfo,
  HomeInfo,
  BlogArticle,
} from '../types/content';

export const BUSINESS: BusinessInfo = businessJson;
export const DELIVERY: DeliveryInfo = deliveryJson;
export const FAQS: FaqItem[] = faqsJson;
export const SITE_REVIEWS: SiteReview[] = reviewsJson;
export const ABOUT: AboutInfo = aboutJson;
export const HOME: HomeInfo = homeJson;
export const BLOG: BlogArticle[] = blogJson;

export const HOME_FAQS: FaqItem[] = FAQS.filter((f) => f.showOnHome);
export const SEED_REVIEWS: SiteReview[] = SITE_REVIEWS.filter((r) => !r.featuredOnAbout);
export const ABOUT_TESTIMONIALS: SiteReview[] = SITE_REVIEWS.filter((r) => r.featuredOnAbout);

const ICONS: Record<string, LucideIcon> = { ShieldCheck, MapPin, Truck, Heart };
export const pillarIcon = (key: string): LucideIcon => ICONS[key] ?? ShieldCheck;
