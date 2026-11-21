import { useEffect, useState } from 'react';
import { useDataFile } from '../edit/hooks/useDataFile';
import { API_BASE } from '../edit/components';
import { DATA_FILES, type DataFileKey } from '../edit/constants';
import type { About, Article, Business, Delivery, Faq, Home, Review } from '../edit/types';
import { AboutEditor, BlogEditor, BusinessEditor, DeliveryEditor, FaqsEditor, HomeEditor, ReviewsEditor } from '../edit/editors';
import { EDIT_SESSION_EXPIRED } from '../edit/lib/api';

interface FileTabDef {
  key: DataFileKey;
  label: string;
  icon: string;
  description: string;
}

const FILE_TABS: FileTabDef[] = [
  { key: 'business', label: 'Business Info', icon: '🏢', description: 'Store identity, address, phone, WhatsApp and operating hours' },
  { key: 'delivery', label: 'Delivery & Zones', icon: '🚚', description: 'Deliverable towns, pincodes and local delivery turnaround times' },
  { key: 'faqs', label: 'FAQs', icon: '❓', description: 'Customer questions, categorized answers and homepage highlights' },
  { key: 'reviews', label: 'Reviews', icon: '⭐', description: 'Customer testimonials, ratings, approvals and verified badges' },
  { key: 'about', label: 'About Page', icon: '📖', description: 'Story blocks, traditional trust pillars and store timeline' },
  { key: 'home', label: 'Home Page', icon: '🏠', description: 'Supermarket comparison table, top announcement marquee and hero keywords' },
  { key: 'blog', label: 'Blog & Articles', icon: '✍️', description: 'Kitchen-tips and health articles with English & Tamil titles' },
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

  const states: Record<DataFileKey, { dirty: boolean }> = {
    business,
    delivery,
    faqs,
    reviews,
    about,
    home,
    blog,
  };

  useEffect(() => {
    const onExpired = () => onError('Admin session expired — please log out and log in again.');
    window.addEventListener(EDIT_SESSION_EXPIRED, onExpired);
    return () => window.removeEventListener(EDIT_SESSION_EXPIRED, onExpired);
  }, [onError]);

  const activeTabDef = FILE_TABS.find((t) => t.key === file) ?? FILE_TABS[0];

  return (
    <div
      className="dashboard-container"
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxSizing: 'border-box',
      }}
    >
      {/* Header & GitHub Status */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#123B26', letterSpacing: '-0.02em' }}>
            Website Content Editor
          </h2>
          <div style={{ fontSize: 13, color: '#557258', marginTop: 3 }}>
            Manage public website copy, business details, FAQs and reviews. Changes commit directly to GitHub.
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#F7F5E8',
            border: '1px solid #E8DFC8',
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: '#123B26',
          }}
          title="Edits commit to the main GitHub repository branch"
        >
          <span>📦</span>
          <span>bensiqueenmart</span>
          <span style={{ color: '#8aa68e' }}>/</span>
          <span style={{ color: '#205C38', fontWeight: 700 }}>main</span>
        </div>
      </div>

      {/* Segmented Tab Navigation Bar */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #DCE8C8',
          borderRadius: 12,
          padding: '6px 8px',
          display: 'flex',
          gap: 6,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {FILE_TABS.map((t) => {
          const active = file === t.key;
          const isDirty = states[t.key]?.dirty;

          return (
            <button
              key={t.key}
              onClick={() => setFile(t.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                background: active ? '#123B26' : 'transparent',
                color: active ? '#fff' : '#205C38',
                transition: 'all 0.15s ease',
                position: 'relative',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#F7F5E8';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              <span>{t.label}</span>
              {isDirty && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: active ? '#39FF14' : '#d97706',
                    display: 'inline-block',
                    marginLeft: 2,
                  }}
                  title="Unsaved changes in this section"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Section Description Banner */}
      <div
        style={{
          background: '#F7F5E8',
          border: '1px solid #E8DFC8',
          borderRadius: 10,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12.5,
          color: '#205C38',
        }}
      >
        <span style={{ fontSize: 16 }}>{activeTabDef.icon}</span>
        <div>
          <strong>Editing {activeTabDef.label}:</strong> {activeTabDef.description}
        </div>
      </div>

      {/* Content Editor Component */}
      <div style={{ position: 'relative' }}>
        {file === 'business' && <BusinessEditor state={business} />}
        {file === 'delivery' && <DeliveryEditor state={delivery} />}
        {file === 'faqs' && <FaqsEditor state={faqs} />}
        {file === 'reviews' && <ReviewsEditor state={reviews} />}
        {file === 'about' && <AboutEditor state={about} />}
        {file === 'home' && <HomeEditor state={home} />}
        {file === 'blog' && <BlogEditor state={blog} />}
      </div>
    </div>
  );
}
