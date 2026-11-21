import React from 'react';
import { BadgeCheck, BookOpen, Building2, CheckCircle2, Globe, House, Leaf, MapPin, Sparkles, Star, Store, Truck } from 'lucide-react';
import type { DataFileState } from './hooks/useDataFile';
import { Area, Field, Lines, ListEditor, Num, SaveBar, Select, Text, Toggle } from './components';
import { PILLAR_ICONS } from './types';
import type { About, Article, Business, Delivery, Faq, Home, Review } from './types';

function bar<T>(s: DataFileState<T>, _file: string) {
  return {
    dirty: s.dirty,
    saving: s.saving,
    error: s.error,
    onSave: (message: string) => s.save(message || undefined).catch(() => {}),
    onDiscard: s.discard,
  };
}

function Loader({ s }: { s: { loading: boolean; error: string | null; editData: unknown; reload: () => void } }) {
  if (s.loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#205C38', fontWeight: 600 }}>
        Loading website content from GitHub…
      </div>
    );
  }
  if (!s.editData) {
    return (
      <div style={{ padding: 30, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b' }}>
        <strong>Load failed:</strong> {s.error}{' '}
        <button
          onClick={s.reload}
          style={{ marginLeft: 10, padding: '4px 10px', borderRadius: 4, border: '1px solid #991b1b', background: '#fff', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }
  return null;
}

const formCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #DCE8C8',
  borderRadius: 12,
  padding: '20px 22px',
  marginBottom: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
};

const formCardHeaderStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: 15,
  fontWeight: 700,
  color: '#123B26',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingBottom: 10,
  borderBottom: '1px solid #edf2ed',
};

const twoColGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '12px 18px',
};

const threeColGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '12px 18px',
};

/* ── 1. business.json ── */
export function BusinessEditor({ state }: { state: DataFileState<Business> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const d = state.editData;
  const set = (patch: Partial<Business>) => state.updateEditData(patch);

  return (
    <div>
      {/* Card A: Identity & Contact */}
      <div style={formCardStyle}>
        <h3 style={formCardHeaderStyle}><Store size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Store Identity &amp; Contact Information</h3>
        <div style={twoColGrid}>
          <Field label="Store Name">
            <Text value={d.storeName} onChange={(v) => set({ storeName: v })} placeholder="Bensi Queen Mart" />
          </Field>
          <Field label="Tagline">
            <Text value={d.tagline} onChange={(v) => set({ tagline: v })} placeholder="Pure, Natural & Chemical-Free" />
          </Field>
        </div>
        <Field label="Sub-Tagline">
          <Text value={d.subTagline} onChange={(v) => set({ subTagline: v })} placeholder="Cold pressed oils, traditional rice, spices and natural groceries" />
        </Field>
        <div style={twoColGrid}>
          <Field label="Primary Phone">
            <Text value={d.phone} onChange={(v) => set({ phone: v })} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Display Phone (formatted)">
            <Text value={d.displayPhone} onChange={(v) => set({ displayPhone: v })} placeholder="98765 43210" />
          </Field>
          <Field label="Owner WhatsApp Number">
            <Text value={d.ownerWhatsappNumber} onChange={(v) => set({ ownerWhatsappNumber: v })} placeholder="919876543210" />
          </Field>
          <Field label="Store Email">
            <Text value={d.email} onChange={(v) => set({ email: v })} placeholder="contact@bensiqueenmart.com" />
          </Field>
        </div>
      </div>

      {/* Card B: Physical Location & Address */}
      <div style={formCardStyle}>
        <h3 style={formCardHeaderStyle}><MapPin size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Store Location &amp; Address</h3>
        <Field label="Full Address (Multi-line)">
          <Area value={d.address} onChange={(v) => set({ address: v })} rows={2} placeholder="Complete physical address displayed on website" />
        </Field>
        <div style={twoColGrid}>
          <Field label="Street Address">
            <Text value={d.streetAddress} onChange={(v) => set({ streetAddress: v })} placeholder="Door No, Street Name" />
          </Field>
          <Field label="Landmark">
            <Text value={d.landmark} onChange={(v) => set({ landmark: v })} placeholder="Near Temple / Bus Stop" />
          </Field>
        </div>
        <div style={threeColGrid}>
          <Field label="City">
            <Text value={d.city} onChange={(v) => set({ city: v })} placeholder="Tirunelveli" />
          </Field>
          <Field label="State">
            <Text value={d.state} onChange={(v) => set({ state: v })} placeholder="Tamil Nadu" />
          </Field>
          <Field label="Pincode">
            <Text value={d.pincode} onChange={(v) => set({ pincode: v })} placeholder="627001" />
          </Field>
        </div>
        <div style={twoColGrid}>
          <Field label="GPS Latitude (lat)" hint="For Google Maps pin">
            <Num value={d.geo.lat} onChange={(v) => set({ geo: { ...d.geo, lat: v } })} />
          </Field>
          <Field label="GPS Longitude (lng)" hint="For Google Maps pin">
            <Num value={d.geo.lng} onChange={(v) => set({ geo: { ...d.geo, lng: v } })} />
          </Field>
        </div>
      </div>

      {/* Card C: Operating Hours */}
      <div style={formCardStyle}>
        <h3 style={formCardHeaderStyle}>⏰ Operating Hours</h3>
        <div style={threeColGrid}>
          <Field label="Opening Time">
            <Text value={d.openTime} onChange={(v) => set({ openTime: v })} placeholder="09:00 AM" />
          </Field>
          <Field label="Closing Time">
            <Text value={d.closeTime} onChange={(v) => set({ closeTime: v })} placeholder="09:00 PM" />
          </Field>
          <Field label="Business Hours Summary">
            <Text value={d.businessHours} onChange={(v) => set({ businessHours: v })} placeholder="Mon–Sat: 9AM–9PM" />
          </Field>
        </div>
      </div>

      {/* Card D: Branding & URLs */}
      <div style={formCardStyle}>
        <h3 style={formCardHeaderStyle}><Globe size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Branding &amp; Links</h3>
        <div style={twoColGrid}>
          <Field label="Logo Image URL">
            <Text value={d.logoUrl} onChange={(v) => set({ logoUrl: v })} placeholder="/images/logo.png" />
          </Field>
          <Field label="Public Website URL">
            <Text value={d.websiteUrl} onChange={(v) => set({ websiteUrl: v })} placeholder="https://bensiqueenmart.com" />
          </Field>
        </div>
      </div>

      <SaveBar {...bar(state, 'business.json')} />
    </div>
  );
}

/* ── 2. delivery.json ── */
export function DeliveryEditor({ state }: { state: DataFileState<Delivery> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const d = state.editData;

  return (
    <div>
      <div style={formCardStyle}>
        <h3 style={formCardHeaderStyle}><Truck size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Service Coverage Areas</h3>
        <Field label="Deliverable Pincodes &amp; Towns (One entry per line)">
          <Lines
            value={d.areas}
            onChange={(v) => state.updateEditData({ areas: v })}
            rows={5}
            placeholder="Tirunelveli Town&#10;Palayamkottai&#10;Melapalayam&#10;Vannarpettai"
          />
        </Field>
      </div>

      <ListEditor
        title="Delivery Zones &amp; Estimated Times"
        items={d.zones}
        onChange={(zones) => state.updateEditData({ zones })}
        onAdd={() => ({ area: '', time: '', status: 'Active' })}
        addLabel="Add Delivery Zone"
        renderItem={(z, update) => (
          <div style={threeColGrid}>
            <Field label="Area / Zone Name">
              <Text value={z.area} onChange={(v) => update({ area: v })} placeholder="Local Tirunelveli" />
            </Field>
            <Field label="Estimated Delivery Time">
              <Text value={z.time} onChange={(v) => update({ time: v })} placeholder="Within 2 Hours" />
            </Field>
            <Field label="Status / Badge">
              <Text value={z.status} onChange={(v) => update({ status: v })} placeholder="Available / Free Delivery" />
            </Field>
          </div>
        )}
      />

      <SaveBar {...bar(state, 'delivery.json')} />
    </div>
  );
}

/* ── 3. faqs.json ── */
export function FaqsEditor({ state }: { state: DataFileState<Faq[]> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const items = state.editData;
  const nextId = Math.max(0, ...items.map((f) => f.id)) + 1;

  return (
    <div>
      <ListEditor
        title="Frequently Asked Questions"
        items={items}
        onChange={state.setEditData}
        onAdd={(): Faq => ({
          id: nextId,
          category: 'general',
          categoryLabel: 'General Questions',
          question: '',
          answer: '',
          popular: false,
          showOnHome: false,
        })}
        addLabel="Add Question"
        renderItem={(f, update) => (
          <div>
            <Field label="Question">
              <Text value={f.question} onChange={(v) => update({ question: v })} placeholder="e.g. How are your wood-pressed oils made?" />
            </Field>
            <Field label="Answer">
              <Area value={f.answer} onChange={(v) => update({ answer: v })} rows={3} placeholder="Detailed answer displayed on the website" />
            </Field>
            <div style={twoColGrid}>
              <Field label="Category Identifier (internal key)">
                <Text value={f.category} onChange={(v) => update({ category: v })} placeholder="oils / shipping / organic" />
              </Field>
              <Field label="Category Label (display title)">
                <Text value={f.categoryLabel} onChange={(v) => update({ categoryLabel: v })} placeholder="Wood-Pressed Oils" />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <Toggle label={<><Star size={13} style={{ verticalAlign: -2 }} /> Popular / Featured FAQ</>} value={!!f.popular} onChange={(v) => update({ popular: v })} />
              <Toggle label={<><House size={13} style={{ verticalAlign: -2 }} /> Show on Homepage</>} value={f.showOnHome} onChange={(v) => update({ showOnHome: v })} />
            </div>
          </div>
        )}
      />

      <SaveBar {...bar(state, 'faqs.json')} />
    </div>
  );
}

/* ── 4. reviews.json ── */
export function ReviewsEditor({ state }: { state: DataFileState<Review[]> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;

  return (
    <div>
      <ListEditor
        title="Customer Testimonials &amp; Reviews"
        items={state.editData}
        onChange={state.setEditData}
        onAdd={(): Review => ({
          id: `rev-${Date.now()}`,
          authorName: '',
          location: '',
          reviewText: '',
          rating: 5,
          reviewDate: 'Recently',
          verifiedPurchase: true,
          isApproved: true,
          featuredOnAbout: false,
          source: 'owner',
        })}
        addLabel="Add Customer Review"
        renderItem={(r, update) => (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 10 }}>
              <Toggle label={<><CheckCircle2 size={13} style={{ verticalAlign: -2 }} /> Approved (Visible on live site)</>} value={r.isApproved} onChange={(v) => update({ isApproved: v })} />
              <Toggle label={<><BadgeCheck size={13} style={{ verticalAlign: -2 }} /> Verified Purchase Badge</>} value={r.verifiedPurchase} onChange={(v) => update({ verifiedPurchase: v })} />
              <Toggle label={<><BookOpen size={13} style={{ verticalAlign: -2 }} /> Feature on About Page</>} value={!!r.featuredOnAbout} onChange={(v) => update({ featuredOnAbout: v })} />
            </div>

            <div style={threeColGrid}>
              <Field label="Customer / Author Name">
                <Text value={r.authorName} onChange={(v) => update({ authorName: v })} placeholder="e.g. Meena Sundaram" />
              </Field>
              <Field label="Customer Location">
                <Text value={r.location} onChange={(v) => update({ location: v })} placeholder="e.g. Tirunelveli" />
              </Field>
              <Field label="Star Rating (1–5)">
                <Num value={r.rating} onChange={(v) => update({ rating: Math.max(1, Math.min(5, Math.round(v))) })} />
              </Field>
            </div>

            <Field label="Review Text">
              <Area value={r.reviewText} onChange={(v) => update({ reviewText: v })} rows={3} placeholder="Customer testimonial words" />
            </Field>

            <div style={twoColGrid}>
              <Field label="Date Label">
                <Text value={r.reviewDate} onChange={(v) => update({ reviewDate: v })} placeholder="e.g. 2 days ago / Oct 2024" />
              </Field>
              <Field label="Source Tag">
                <Text value={r.source} onChange={(v) => update({ source: v })} placeholder="google / walk-in / website" />
              </Field>
            </div>
          </div>
        )}
      />

      <SaveBar {...bar(state, 'reviews.json')} />
    </div>
  );
}

/* ── 5. about.json ── */
export function AboutEditor({ state }: { state: DataFileState<About> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const d = state.editData;
  const set = (patch: Partial<About>) => state.updateEditData(patch);

  return (
    <div>
      {/* Product Category Blocks */}
      <ListEditor
        title="Product Story Category Blocks"
        items={d.productCategories}
        onChange={(productCategories) => set({ productCategories })}
        onAdd={() => ({ num: '01', title: '', tamilTitle: '', desc: '', items: [], image: '', tag: '', category: '' })}
        addLabel="Add Story Block"
        renderItem={(c, update) => (
          <div>
            <div style={threeColGrid}>
              <Field label="Block Number">
                <Text value={c.num} onChange={(v) => update({ num: v })} placeholder="01" />
              </Field>
              <Field label="Category Title (English)">
                <Text value={c.title} onChange={(v) => update({ title: v })} placeholder="Wood-Pressed Oils" />
              </Field>
              <Field label="Tamil Title">
                <Text value={c.tamilTitle} onChange={(v) => update({ tamilTitle: v })} placeholder="மரச்செக்கு எண்ணெய்" />
              </Field>
            </div>

            <Field label="Description">
              <Area value={c.desc} onChange={(v) => update({ desc: v })} rows={2} placeholder="Tradition, preparation and benefits story" />
            </Field>

            <Field label="Key Items / Varieties (One per line)">
              <Lines value={c.items} onChange={(v) => update({ items: v })} rows={3} placeholder="Sesame Oil&#10;Groundnut Oil&#10;Coconut Oil" />
            </Field>

            <div style={threeColGrid}>
              <Field label="Image URL">
                <Text value={c.image} onChange={(v) => update({ image: v })} placeholder="/images/categories/oils.jpg" />
              </Field>
              <Field label="Highlight Tag">
                <Text value={c.tag} onChange={(v) => update({ tag: v })} placeholder="100% Traditional" />
              </Field>
              <Field label="Category Link Slug">
                <Text value={c.category} onChange={(v) => update({ category: v })} placeholder="cold-pressed-oils" />
              </Field>
            </div>
          </div>
        )}
      />

      {/* Trust Pillars */}
      <ListEditor
        title="Brand Trust Pillars"
        items={d.trustPillars}
        onChange={(trustPillars) => set({ trustPillars })}
        onAdd={() => ({ icon: PILLAR_ICONS[0], title: '', desc: '' })}
        addLabel="Add Trust Pillar"
        renderItem={(p, update) => (
          <div>
            <div style={twoColGrid}>
              <Field label="Pillar Icon">
                <Select value={p.icon} options={PILLAR_ICONS} onChange={(v) => update({ icon: v })} />
              </Field>
              <Field label="Pillar Title">
                <Text value={p.title} onChange={(v) => update({ title: v })} placeholder="Farm Direct Quality" />
              </Field>
            </div>
            <Field label="Description">
              <Area value={p.desc} onChange={(v) => update({ desc: v })} rows={2} placeholder="Details explaining this guarantee to the customer" />
            </Field>
          </div>
        )}
      />

      {/* Timeline Milestones */}
      <ListEditor
        title="Store Journey &amp; Milestones Timeline"
        items={d.timeline}
        onChange={(timeline) => set({ timeline })}
        onAdd={() => ({ year: '2024', title: '', desc: '' })}
        addLabel="Add Milestone"
        renderItem={(t, update) => (
          <div>
            <div style={twoColGrid}>
              <Field label="Year / Date">
                <Text value={t.year} onChange={(v) => update({ year: v })} placeholder="2022" />
              </Field>
              <Field label="Milestone Title">
                <Text value={t.title} onChange={(v) => update({ title: v })} placeholder="Our First Traditional Wood Press" />
              </Field>
            </div>
            <Field label="Milestone Story">
              <Area value={t.desc} onChange={(v) => update({ desc: v })} rows={2} placeholder="Story behind this milestone" />
            </Field>
          </div>
        )}
      />

      <SaveBar {...bar(state, 'about.json')} />
    </div>
  );
}

/* ── 6. home.json ── */
export function HomeEditor({ state }: { state: DataFileState<Home> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const d = state.editData;
  const set = (patch: Partial<Home>) => state.updateEditData(patch);

  return (
    <div>
      {/* Supermarket Comparison */}
      <ListEditor
        title="Bensi Queen vs Supermarket Comparison Table"
        items={d.comparisonPoints}
        onChange={(comparisonPoints) => set({ comparisonPoints })}
        onAdd={() => ({ feature: '', bensi: '', supermarket: '' })}
        addLabel="Add Comparison Point"
        renderItem={(p, update) => (
          <div>
            <Field label="Feature / Aspect">
              <Text value={p.feature} onChange={(v) => update({ feature: v })} placeholder="e.g. Processing Method" />
            </Field>
            <div style={twoColGrid}>
              <Field label={<><Leaf size={13} style={{ verticalAlign: -2 }} /> Bensi Queen Mart Standard</>}>
                <Area value={p.bensi} onChange={(v) => update({ bensi: v })} rows={2} placeholder="Traditional stone mill, zero chemicals" />
              </Field>
              <Field label={<><Building2 size={13} style={{ verticalAlign: -2 }} /> Commercial Supermarkets</>}>
                <Area value={p.supermarket} onChange={(v) => update({ supermarket: v })} rows={2} placeholder="Refined with chemical solvents" />
              </Field>
            </div>
          </div>
        )}
      />

      {/* Marquee & Cycle Words */}
      <div style={formCardStyle}>
        <h3 style={formCardHeaderStyle}><Sparkles size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Homepage Tickers &amp; Animations</h3>
        <Field label="Top Marquee Announcement Ticker (One item per line)">
          <Lines
            value={d.marqueeItems}
            onChange={(marqueeItems) => set({ marqueeItems })}
            rows={3}
            placeholder="Fresh Harvest Cold-Pressed Oils&#10;Free Home Delivery across Tirunelveli on Orders Above ₹500"
          />
        </Field>

        <Field label="Hero Rotating Highlight Words (One per line)">
          <Lines
            value={d.cycleWords}
            onChange={(cycleWords) => set({ cycleWords })}
            rows={4}
            placeholder="Pure&#10;Natural&#10;Authentic&#10;Chemical-Free"
          />
        </Field>
      </div>

      {/* Rating Bars */}
      <ListEditor
        title="Customer Rating Breakdown Bars"
        items={d.ratingBars}
        onChange={(ratingBars) => set({ ratingBars })}
        onAdd={() => ({ stars: 5, pct: 100 })}
        addLabel="Add Rating Bar"
        renderItem={(r, update) => (
          <div style={twoColGrid}>
            <Field label="Star Tier (1–5)">
              <Num value={r.stars} onChange={(v) => update({ stars: v })} />
            </Field>
            <Field label="Percentage Share (0–100%)">
              <Num value={r.pct} onChange={(v) => update({ pct: v })} />
            </Field>
          </div>
        )}
      />

      <SaveBar {...bar(state, 'home.json')} />
    </div>
  );
}

/* ── 7. blog.json ── */
export function BlogEditor({ state }: { state: DataFileState<Article[]> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;

  return (
    <div>
      <ListEditor
        title="Kitchen Tips &amp; Wellness Articles"
        items={state.editData}
        onChange={state.setEditData}
        onAdd={(): Article => ({
          id: `post-${Date.now()}`,
          titleEn: '',
          titleTa: '',
          excerptEn: '',
          excerptTa: '',
          category: 'Health & Nutrition',
          readTime: '3 min read',
          image: '/images/blog/default.jpg',
        })}
        addLabel="Add Article"
        renderItem={(a, update) => (
          <div>
            <div style={twoColGrid}>
              <Field label="Article Title (English)">
                <Text value={a.titleEn} onChange={(v) => update({ titleEn: v })} placeholder="e.g. Why Wood-Pressed Oils Are Better For Heart Health" />
              </Field>
              <Field label="Article Title (Tamil)">
                <Text value={a.titleTa} onChange={(v) => update({ titleTa: v })} placeholder="மரச்செக்கு எண்ணெயின் ஆரோக்கிய நன்மைகள்" />
              </Field>
            </div>

            <div style={twoColGrid}>
              <Field label="Excerpt Summary (English)">
                <Area value={a.excerptEn} onChange={(v) => update({ excerptEn: v })} rows={3} placeholder="Brief summary displayed on article card" />
              </Field>
              <Field label="Excerpt Summary (Tamil)">
                <Area value={a.excerptTa} onChange={(v) => update({ excerptTa: v })} rows={3} placeholder="கட்டுரையின் சுருக்கம்" />
              </Field>
            </div>

            <div style={threeColGrid}>
              <Field label="Article Category">
                <Text value={a.category} onChange={(v) => update({ category: v })} placeholder="Wellness / Kitchen Tips" />
              </Field>
              <Field label="Estimated Read Time">
                <Text value={a.readTime} onChange={(v) => update({ readTime: v })} placeholder="4 min read" />
              </Field>
              <Field label="Cover Image URL">
                <Text value={a.image} onChange={(v) => update({ image: v })} placeholder="/images/blog/cold-press-guide.jpg" />
              </Field>
            </div>
          </div>
        )}
      />

      <SaveBar {...bar(state, 'blog.json')} />
    </div>
  );
}
