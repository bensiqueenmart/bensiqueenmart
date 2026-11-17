import type { DataFileState } from './hooks/useDataFile';
import { Area, Field, Lines, ListEditor, Num, SaveBar, Select, Text, Toggle } from './components';
import { PILLAR_ICONS } from './types';
import type { About, Article, Business, Delivery, Faq, Home, Review } from './types';

function bar<T>(s: DataFileState<T>, file: string) {
  return {
    dirty: s.dirty, saving: s.saving, error: s.error,
    onSave: (message: string) => s.save(message || undefined).catch(() => {}),
    onDiscard: s.discard,
  };
}

function Loader({ s }: { s: { loading: boolean; error: string | null; editData: unknown; reload: () => void } }) {
  if (s.loading) return <p>Loading…</p>;
  if (!s.editData) return <p>Load failed: {s.error} <button onClick={s.reload}>Retry</button></p>;
  return null;
}

/* ── business.json ── */
export function BusinessEditor({ state }: { state: DataFileState<Business> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const d = state.editData;
  const set = (patch: Partial<Business>) => state.updateEditData(patch);
  const str = (k: keyof Business) => (
    <Field key={k} label={k}>
      <Text value={d[k] as string} onChange={(v) => set({ [k]: v } as Partial<Business>)} />
    </Field>
  );
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Business info</h2>
      {(['storeName', 'tagline', 'subTagline', 'ownerWhatsappNumber', 'phone', 'displayPhone', 'email'] as const).map(str)}
      <Field label="address"><Area value={d.address} onChange={(v) => set({ address: v })} rows={2} /></Field>
      {(['streetAddress', 'landmark', 'city', 'pincode', 'state', 'openTime', 'closeTime', 'businessHours'] as const).map(str)}
      <Field label="geo.lat"><Num value={d.geo.lat} onChange={(v) => set({ geo: { ...d.geo, lat: v } })} /></Field>
      <Field label="geo.lng"><Num value={d.geo.lng} onChange={(v) => set({ geo: { ...d.geo, lng: v } })} /></Field>
      {(['logoUrl', 'websiteUrl'] as const).map(str)}
      <SaveBar {...bar(state, 'business.json')} />
    </div>
  );
}

/* ── delivery.json ── */
export function DeliveryEditor({ state }: { state: DataFileState<Delivery> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const d = state.editData;
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Delivery</h2>
      <Field label="Service areas (one per line)">
        <Lines value={d.areas} onChange={(v) => state.updateEditData({ areas: v })} />
      </Field>
      <ListEditor
        title="Delivery zones" items={d.zones}
        onChange={(zones) => state.updateEditData({ zones })}
        onAdd={() => ({ area: '', time: '', status: '' })}
        addLabel="Add zone"
        renderItem={(z, update) => (<>
          <Field label="area"><Text value={z.area} onChange={(v) => update({ area: v })} /></Field>
          <Field label="time"><Text value={z.time} onChange={(v) => update({ time: v })} /></Field>
          <Field label="status"><Text value={z.status} onChange={(v) => update({ status: v })} /></Field>
        </>)}
      />
      <SaveBar {...bar(state, 'delivery.json')} />
    </div>
  );
}

/* ── faqs.json ── */
export function FaqsEditor({ state }: { state: DataFileState<Faq[]> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const items = state.editData;
  const nextId = Math.max(0, ...items.map((f) => f.id)) + 1;
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>FAQs</h2>
      <ListEditor
        title="Questions" items={items}
        onChange={state.setEditData}
        onAdd={(): Faq => ({ id: nextId, category: 'ordering', categoryLabel: '', question: '', answer: '', showOnHome: false })}
        addLabel="Add FAQ"
        renderItem={(f, update) => (<>
          <Field label="question"><Text value={f.question} onChange={(v) => update({ question: v })} /></Field>
          <Field label="answer"><Area value={f.answer} onChange={(v) => update({ answer: v })} rows={4} /></Field>
          <Field label="category"><Text value={f.category} onChange={(v) => update({ category: v })} /></Field>
          <Field label="categoryLabel"><Text value={f.categoryLabel} onChange={(v) => update({ categoryLabel: v })} /></Field>
          <Toggle label="popular" value={!!f.popular} onChange={(v) => update({ popular: v })} />
          <Toggle label="Show on home page" value={f.showOnHome} onChange={(v) => update({ showOnHome: v })} />
        </>)}
      />
      <SaveBar {...bar(state, 'faqs.json')} />
    </div>
  );
}

/* ── reviews.json ── */
export function ReviewsEditor({ state }: { state: DataFileState<Review[]> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Reviews</h2>
      <ListEditor
        title="Reviews" items={state.editData}
        onChange={state.setEditData}
        onAdd={() : Review => ({ id: `rev-${Date.now()}`, authorName: '', location: '', reviewText: '', rating: 5, reviewDate: '', verifiedPurchase: false, isApproved: false, source: 'owner' })}
        addLabel="Add review"
        renderItem={(r, update) => (<>
          <Toggle label="Approved (visible on site)" value={r.isApproved} onChange={(v) => update({ isApproved: v })} />
          <Field label="author"><Text value={r.authorName} onChange={(v) => update({ authorName: v })} /></Field>
          <Field label="location"><Text value={r.location} onChange={(v) => update({ location: v })} /></Field>
          <Field label="review"><Area value={r.reviewText} onChange={(v) => update({ reviewText: v })} rows={3} /></Field>
          <Field label="rating (1–5)"><Num value={r.rating} onChange={(v) => update({ rating: Math.max(1, Math.min(5, Math.round(v))) })} /></Field>
          <Field label="date label"><Text value={r.reviewDate} onChange={(v) => update({ reviewDate: v })} /></Field>
          <Toggle label="Verified purchase" value={r.verifiedPurchase} onChange={(v) => update({ verifiedPurchase: v })} />
          <Toggle label="Feature on About page" value={!!r.featuredOnAbout} onChange={(v) => update({ featuredOnAbout: v })} />
        </>)}
      />
      <SaveBar {...bar(state, 'reviews.json')} />
    </div>
  );
}

/* ── about.json ── */
export function AboutEditor({ state }: { state: DataFileState<About> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const d = state.editData;
  const set = (patch: Partial<About>) => state.updateEditData(patch);
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>About page</h2>
      <ListEditor
        title="Category blocks" items={d.productCategories}
        onChange={(productCategories) => set({ productCategories })}
        onAdd={() => ({ num: '', title: '', tamilTitle: '', desc: '', items: [], image: '', tag: '', category: '' })}
        addLabel="Add block"
        renderItem={(c, update) => (<>
          <Field label="title"><Text value={c.title} onChange={(v) => update({ title: v })} /></Field>
          <Field label="tamilTitle"><Text value={c.tamilTitle} onChange={(v) => update({ tamilTitle: v })} /></Field>
          <Field label="desc"><Area value={c.desc} onChange={(v) => update({ desc: v })} rows={3} /></Field>
          <Field label="items (one per line)"><Lines value={c.items} onChange={(v) => update({ items: v })} rows={4} /></Field>
          <Field label="image"><Text value={c.image} onChange={(v) => update({ image: v })} /></Field>
          <Field label="tag"><Text value={c.tag} onChange={(v) => update({ tag: v })} /></Field>
          <Field label="category (catalog id)"><Text value={c.category} onChange={(v) => update({ category: v })} /></Field>
          <Field label="num"><Text value={c.num} onChange={(v) => update({ num: v })} /></Field>
        </>)}
      />
      <ListEditor
        title="Trust pillars" items={d.trustPillars}
        onChange={(trustPillars) => set({ trustPillars })}
        onAdd={() => ({ icon: PILLAR_ICONS[0], title: '', desc: '' })}
        addLabel="Add pillar"
        renderItem={(p, update) => (<>
          <Field label="icon"><Select value={p.icon} options={PILLAR_ICONS} onChange={(v) => update({ icon: v })} /></Field>
          <Field label="title"><Text value={p.title} onChange={(v) => update({ title: v })} /></Field>
          <Field label="desc"><Area value={p.desc} onChange={(v) => update({ desc: v })} rows={3} /></Field>
        </>)}
      />
      <ListEditor
        title="Timeline" items={d.timeline}
        onChange={(timeline) => set({ timeline })}
        onAdd={() => ({ year: '', title: '', desc: '' })}
        addLabel="Add entry"
        renderItem={(t, update) => (<>
          <Field label="year"><Text value={t.year} onChange={(v) => update({ year: v })} /></Field>
          <Field label="title"><Text value={t.title} onChange={(v) => update({ title: v })} /></Field>
          <Field label="desc"><Area value={t.desc} onChange={(v) => update({ desc: v })} rows={3} /></Field>
        </>)}
      />
      <SaveBar {...bar(state, 'about.json')} />
    </div>
  );
}

/* ── home.json ── */
export function HomeEditor({ state }: { state: DataFileState<Home> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  const d = state.editData;
  const set = (patch: Partial<Home>) => state.updateEditData(patch);
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Home page</h2>
      <ListEditor
        title="Comparison rows" items={d.comparisonPoints}
        onChange={(comparisonPoints) => set({ comparisonPoints })}
        onAdd={() => ({ feature: '', bensi: '', supermarket: '' })}
        addLabel="Add row"
        renderItem={(p, update) => (<>
          <Field label="feature"><Text value={p.feature} onChange={(v) => update({ feature: v })} /></Field>
          <Field label="bensi"><Area value={p.bensi} onChange={(v) => update({ bensi: v })} rows={2} /></Field>
          <Field label="supermarket"><Area value={p.supermarket} onChange={(v) => update({ supermarket: v })} rows={2} /></Field>
        </>)}
      />
      <Field label="Marquee items (one per line)">
        <Lines value={d.marqueeItems} onChange={(marqueeItems) => set({ marqueeItems })} />
      </Field>
      <Field label="Rotating hero words (one per line)">
        <Lines value={d.cycleWords} onChange={(cycleWords) => set({ cycleWords })} rows={5} />
      </Field>
      <ListEditor
        title="Rating bars" items={d.ratingBars}
        onChange={(ratingBars) => set({ ratingBars })}
        onAdd={() => ({ stars: 5, pct: 0 })}
        addLabel="Add bar"
        renderItem={(r, update) => (<div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Field label="stars"><Num value={r.stars} onChange={(v) => update({ stars: v })} /></Field></div>
          <div style={{ flex: 1 }}><Field label="pct"><Num value={r.pct} onChange={(v) => update({ pct: v })} /></Field></div>
        </div>)}
      />
      <SaveBar {...bar(state, 'home.json')} />
    </div>
  );
}

/* ── blog.json ── */
export function BlogEditor({ state }: { state: DataFileState<Article[]> }) {
  const loader = Loader({ s: state });
  if (loader || !state.editData) return loader;
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Kitchen-tips articles</h2>
      <ListEditor
        title="Articles" items={state.editData}
        onChange={state.setEditData}
        onAdd={() => ({ id: `post-${Date.now()}`, titleEn: '', titleTa: '', excerptEn: '', excerptTa: '', category: '', readTime: '', image: '' })}
        addLabel="Add article"
        renderItem={(a, update) => (<>
          <Field label="titleEn"><Text value={a.titleEn} onChange={(v) => update({ titleEn: v })} /></Field>
          <Field label="titleTa"><Text value={a.titleTa} onChange={(v) => update({ titleTa: v })} /></Field>
          <Field label="excerptEn"><Area value={a.excerptEn} onChange={(v) => update({ excerptEn: v })} rows={3} /></Field>
          <Field label="excerptTa"><Area value={a.excerptTa} onChange={(v) => update({ excerptTa: v })} rows={3} /></Field>
          <Field label="category"><Text value={a.category} onChange={(v) => update({ category: v })} /></Field>
          <Field label="readTime"><Text value={a.readTime} onChange={(v) => update({ readTime: v })} /></Field>
          <Field label="image"><Text value={a.image} onChange={(v) => update({ image: v })} /></Field>
        </>)}
      />
      <SaveBar {...bar(state, 'blog.json')} />
    </div>
  );
}
