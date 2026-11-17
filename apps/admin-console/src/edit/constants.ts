/**
 * Registry of owner-editable data files. Server enforces the same list —
 * keep both in sync (server/github.ts DATA_PATHS).
 */
export const DATA_FILES = {
  business: 'apps/public-website/src/data/business.json',
  delivery: 'apps/public-website/src/data/delivery.json',
  faqs: 'apps/public-website/src/data/faqs.json',
  reviews: 'apps/public-website/src/data/reviews.json',
  about: 'apps/public-website/src/data/about.json',
  home: 'apps/public-website/src/data/home.json',
  blog: 'apps/public-website/src/data/blog.json',
} as const;

export type DataFileKey = keyof typeof DATA_FILES;
