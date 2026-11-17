import { useEffect, useState } from 'react';
import { useDataFile } from '../edit/hooks/useDataFile';
import { API_BASE } from '../edit/components';
import { DATA_FILES, type DataFileKey } from '../edit/constants';
import type { About, Article, Business, Delivery, Faq, Home, Review } from '../edit/types';
import { AboutEditor, BlogEditor, BusinessEditor, DeliveryEditor, FaqsEditor, HomeEditor, ReviewsEditor } from '../edit/editors';
import { EDIT_SESSION_EXPIRED } from '../edit/lib/api';

const FILE_TABS: { key: DataFileKey; label: string }[] = [
  { key: 'business', label: 'Business' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'about', label: 'About' },
  { key: 'home', label: 'Home' },
  { key: 'blog', label: 'Blog' },
];

export default function WebsiteTab({ onError }: { onError: (m: string) => void }) {
  const [file, setFile] = useState<DataFileKey>('business');

  const business = useDataFile<Business>(DATA_FILES.business, API_BASE, 'Update business info');
  const delivery = useDataFile<Delivery>(DATA_FILES.delivery, API_BASE, 'Update delivery info');
  const faqs = useDataFile<Faq[]>(DATA_FILES.faqs, API_BASE, 'Update FAQs');
  const reviews = useDataFile<Review[]>(DATA_FILES.reviews, API_BASE, 'Update reviews');
  const about = useDataFile<About>(DATA_FILES.about, API_BASE, 'Update about page');
  const home = useDataFile<Home>(DATA_FILES.home, API_BASE, 'Update home page');
  const blog = useDataFile<Article[]>(DATA_FILES.blog, API_BASE, 'Update blog');

  useEffect(() => {
    const onExpired = () => onError('Admin session expired — please log out and log in again.');
    window.addEventListener(EDIT_SESSION_EXPIRED, onExpired);
    return () => window.removeEventListener(EDIT_SESSION_EXPIRED, onExpired);
  }, [onError]);

  return (
    <div style={{ padding: 20, maxWidth: 860 }}>
      <h2 style={{ margin: '0 0 4px' }}>Website content</h2>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>
        Edits commit to GitHub and go live on the next website build.
      </p>
      <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '2px solid #ddd', marginBottom: 16 }}>
        {FILE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFile(t.key)}
            style={{
              padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: file === t.key ? 700 : 400,
              borderBottom: file === t.key ? '2px solid #1a1a1a' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {file === 'business' && <BusinessEditor state={business} />}
      {file === 'delivery' && <DeliveryEditor state={delivery} />}
      {file === 'faqs' && <FaqsEditor state={faqs} />}
      {file === 'reviews' && <ReviewsEditor state={reviews} />}
      {file === 'about' && <AboutEditor state={about} />}
      {file === 'home' && <HomeEditor state={home} />}
      {file === 'blog' && <BlogEditor state={blog} />}
    </div>
  );
}
