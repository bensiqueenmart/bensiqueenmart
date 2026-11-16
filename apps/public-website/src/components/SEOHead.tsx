import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'product' | 'article';
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonical = 'https://bensiqueen.com/',
  noindex = false,
  keywords,
  image = 'https://bensiqueen.com/images/bensi-queen-logo.jpg',
  imageAlt = 'Bensi Queen - Quality Pulses, Spices, Nuts & Everyday Groceries',
  type = 'website',
  structuredData,
}) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper to update or create a meta tag
    const setMetaTag = (attr: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Meta Description
    setMetaTag('name', 'description', description);

    // 3. Meta Robots (noindex on cart/checkout)
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');

    // 4. Meta Keywords
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 5. Open Graph Tags
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonical);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:image:alt', imageAlt);
    setMetaTag('property', 'og:site_name', 'Bensi Queen');

    // 6. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);
    setMetaTag('name', 'twitter:image:alt', imageAlt);

    // 7. Canonical Link Tag
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonical);

    // 8. Injected Page Schema
    const scriptId = 'page-specific-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (structuredData) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(structuredData);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [title, description, canonical, noindex, keywords, image, imageAlt, type, structuredData]);

  return null;
};

