import { useEffect, useMemo, useState } from 'react';
import type { Combo, Product } from '@bqm/types';
import { adjustStock, getCatalog, imageSrc, rupees } from '../api';
import CreatePopup from './CreatePopup';
import EditPopup from './EditPopup';

const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };
const input: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 };
const card: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 10, background: '#fff', cursor: 'pointer' };
const REASONS = [
  { value: 'restock', label: 'Restock' },
  { value: 'adjust', label: 'Adjust / correction' },
];

function ProductCard({ p, adding, onEdit, onToggleAdd, onUpdated, onError }: {
  p: Product;
  adding: boolean;
  onEdit: () => void;
  onToggleAdd: () => void;
  onUpdated: (u: Product) => void;
  onError: (m: string) => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const buckets = Array.isArray(p.stock) ? p.stock : [];
  const total = buckets.reduce((s, q) => s + q.size * q.count, 0);
  const baseQty = Array.isArray(p.stock) ? total : p.stock;
  const out = baseQty <= 0;
  const fmt = (n: number) => n.toLocaleString('en-IN');
  const rate = p.pricePerUnit !== undefined
    ? `${rupees(p.pricePerUnit)} / ${p.stockUnit}`
    : p.quantityPrice.length > 0
      ? p.quantityPrice.map((t) => `${t.quantity}${p.stockUnit} ${rupees(t.price)}`).join(' · ')
      : null;

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={onEdit}>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        {p.image && imgOk ? (
          <img
            src={imageSrc(p.image)}
            alt={p.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            style={{
              width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, display: 'block',
              ...(out ? { filter: 'grayscale(1)', opacity: 0.55 } : null),
            }}
          />
        ) : (
          <div style={{ width: '100%', height: 120, borderRadius: 6, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#888' }}>
            no photo
          </div>
        )}
        {out && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(198,40,40,0.92)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
            Out of stock
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
          padding: '3px 8px', borderRadius: 999, flexShrink: 0,
          background: p.isQuantized ? '#e3f2fd' : '#e8f5e9',
          color: p.isQuantized ? '#1565c0' : '#2e7d32',
        }}>
          {p.isQuantized ? 'fixed' : 'loose'}
        </span>
      </div>
      {p.tamilName && <div style={{ fontSize: 13, color: '#666', marginTop: 1 }}>{p.tamilName}</div>}
      {!p.isQuantized && (
        <div style={{ fontSize: 13, color: rate ? '#333' : '#999', marginTop: 8 }}>
          {rate ?? 'No price set'}
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: 10 }}>
        {p.isQuantized ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {buckets.length > 0 ? buckets.map((q) => (
              <div key={q.size} style={{ fontSize: 20, fontWeight: 800, color: q.count <= 0 ? '#c62828' : '#111' }}>
                {fmt(q.size)} <span style={{ fontSize: 13, fontWeight: 400, color: '#666' }}>{p.stockUnit} × {fmt(q.count)}</span>
              </div>
            )) : (
              <div style={{ fontSize: 16, fontWeight: 700, color: '#c62828' }}>Out of stock</div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 24, fontWeight: 800, color: out ? '#c62828' : '#111' }}>
            {fmt(baseQty)} <span style={{ fontSize: 14, fontWeight: 400, color: '#666' }}>{p.stockUnit}</span>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          {adding ? (
            <StockForm key={p.updatedAt} p={p} onError={onError} onUpdated={onUpdated} />
          ) : (
            <button style={{ ...btn, width: '100%' }} onClick={(e) => { e.stopPropagation(); onToggleAdd(); }}>
              Edit stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** One combo unit is fulfillable only when every component's required quantity is on hand. */
function comboShort(c: Combo, products: Product[]): boolean {
  for (const comp of c.products ?? []) {
    const doc = products.find((p) => p.id === comp.productId) ?? products.find((p) => p.slug === comp.productSlug);
    if (!doc) return true;
    if (typeof comp.quantity === 'number') {
      if (typeof doc.stock !== 'number' || doc.stock < comp.quantity) return true;
    } else {
      if (!Array.isArray(doc.stock)) return true;
      for (const need of comp.quantity) {
        const bucket = (doc.stock as Array<{ size: number; count: number }>).find((b) => b.size === need.size);
        if (!bucket || bucket.count < need.count) return true;
      }
    }
  }
  return false;
}

function ComboCard({ c, products, onEdit }: { c: Combo; products: Product[]; onEdit: () => void }) {
  const [imgOk, setImgOk] = useState(true);
  const short = comboShort(c, products);
  const dim = short || !c.isActive;
  const lookup = (productId: string, productSlug: string) =>
    products.find((p) => p.id === productId) ?? products.find((p) => p.slug === productSlug);
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column' }} onClick={onEdit}>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        {c.image && imgOk ? (
          <img
            src={imageSrc(c.image)}
            alt={c.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            style={{
              width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, display: 'block',
              ...(dim ? { filter: 'grayscale(1)', opacity: 0.55 } : null),
            }}
          />
        ) : (
          <div style={{ width: '100%', height: 120, borderRadius: 6, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#888' }}>
            no photo
          </div>
        )}
        {short && c.isActive && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(198,40,40,0.92)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
            Out of stock
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
          padding: '3px 8px', borderRadius: 999, flexShrink: 0,
          background: c.isActive ? '#e8f5e9' : '#eee',
          color: c.isActive ? '#2e7d32' : '#666',
        }}>
          {c.isActive ? 'active' : 'inactive'}
        </span>
      </div>
      {c.tamilName && <div style={{ fontSize: 13, color: '#666', marginTop: 1 }}>{c.tamilName}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
        {(c.products ?? []).map((comp) => {
          const doc = lookup(comp.productId, comp.productSlug);
          const unit = doc?.stockUnit ?? '';
          const qty = typeof comp.quantity === 'number'
            ? `${comp.quantity}${unit}`
            : comp.quantity.map((q) => `${q.size}${unit} × ${q.count}`).join(' + ');
          return (
            <div key={comp.productId} style={{ fontSize: 13, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {comp.name} <span style={{ color: '#666' }}>· {qty}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: !c.isActive ? '#aaa' : short ? '#c62828' : '#111' }}>{rupees(c.totalPrice)}</div>
      </div>
    </div>
  );
}

function StockForm({ p, onUpdated, onError }: { p: Product; onUpdated: (u: Product) => void; onError: (m: string) => void }) {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [qty, setQty] = useState('');
  const buckets = Array.isArray(p.stock) ? p.stock : [];
  const [picked, setPicked] = useState(buckets[0] ? String(buckets[0].size) : 'custom');
  const [customSize, setCustomSize] = useState('');
  const [reason, setReason] = useState('restock');
  const [busy, setBusy] = useState(false);

  const pickMode = (m: 'add' | 'remove') => {
    setMode(m);
    setReason(m === 'add' ? 'restock' : 'adjust');
  };

  const submit = async () => {
    // Magnitude only — the sign comes from the toggle, never the keystrokes.
    const mag = Math.abs(Number(qty));
    if (!Number.isFinite(mag) || mag <= 0) {
      onError('Enter an amount greater than 0');
      return;
    }
    let size = 0;
    if (p.isQuantized) {
      size = picked === 'custom' ? Number(customSize) : Number(picked);
      if (!Number.isInteger(size) || size <= 0) {
        onError('Pick a size or enter a positive whole-number custom size');
        return;
      }
    }
    setBusy(true);
    try {
      const signed = mode === 'add' ? mag : -mag;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delta: any = p.isQuantized ? [{ size, count: signed }] : signed;
      onUpdated(await adjustStock(p.slug, delta, reason));
      setQty('');
      setCustomSize('');
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const seg = (active: boolean): React.CSSProperties => ({
    ...btn,
    background: active ? '#1a1a1a' : '#fff',
    color: active ? '#fff' : '#000',
  });

  return (
    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
      <span style={{ display: 'inline-flex', gap: 4 }}>
        <button style={seg(mode === 'add')} onClick={() => pickMode('add')}>+ Add</button>
        <button style={seg(mode === 'remove')} onClick={() => pickMode('remove')}>− Remove</button>
      </span>
      {p.isQuantized && (
        <>
          <select style={input} value={picked} onChange={(e) => setPicked(e.target.value)}>
            {buckets.map((q) => (
              <option key={q.size} value={String(q.size)}>{q.size}{p.stockUnit}</option>
            ))}
            <option value="custom">+ New size…</option>
          </select>
          {picked === 'custom' && (
            <input style={{ ...input, width: 80 }} placeholder={`size (${p.stockUnit})`} value={customSize} onChange={(e) => setCustomSize(e.target.value)} />
          )}
        </>
      )}
      <input style={{ ...input, width: 90 }} placeholder={p.isQuantized ? 'packs' : p.stockUnit} value={qty} onChange={(e) => setQty(e.target.value)} />
      <select style={input} value={reason} onChange={(e) => setReason(e.target.value)}>
        {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <button style={btn} disabled={busy || !qty} onClick={submit}>{busy ? '…' : mode === 'add' ? 'Add' : 'Remove'}</button>
    </div>
  );
}

export default function InventoryTab({ onError }: { onError: (m: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [adding, setAdding] = useState<string | null>(null);
  const [creating, setCreating] = useState<'product' | 'combo' | null>(null);
  const [editSlug, setEditSlug] = useState<{ kind: 'product' | 'combo'; slug: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const catalog = await getCatalog();
      setProducts(catalog.products);
      setCombos(catalog.combos);
    } catch (e) {
      onError(`Couldn't load catalog: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const units = useMemo(() => [...new Set(products.map((p) => p.stockUnit))].sort(), [products]);
  const q = search.trim().toLowerCase();
  const visibleProducts = products.filter((p) =>
    (category === 'all' || p.category === category) &&
    (!q || p.name.toLowerCase().includes(q) || p.slug.includes(q)));
  const visibleCombos = combos.filter((c) => !q || c.name.toLowerCase().includes(q) || c.slug.includes(q));
  const editingProduct = editSlug?.kind === 'product' ? products.find((p) => p.slug === editSlug.slug) : undefined;
  const editingCombo = editSlug?.kind === 'combo' ? combos.find((c) => c.slug === editSlug.slug) : undefined;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...input, flex: 1 }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button style={btn} onClick={load}>Refresh</button>
      </div>

      {loading && <p>Loading catalog…</p>}

      <h3>Products {products.length > 0 && <span style={{ color: '#666', fontWeight: 400 }}>({visibleProducts.length}/{products.length})</span>}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        <div
          style={{ ...card, borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 200, color: '#666' }}
          onClick={() => setCreating('product')}
        >
          <div style={{ fontSize: 28, lineHeight: 1 }}>+</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>New product</div>
        </div>
        {visibleProducts.map((p) => (
          <ProductCard
            key={p.slug}
            p={p}
            adding={adding === p.slug}
            onEdit={() => setEditSlug({ kind: 'product', slug: p.slug })}
            onToggleAdd={() => setAdding(p.slug)}
            onUpdated={(u) => { setProducts((ps) => ps.map((x) => (x.slug === u.slug ? u : x))); setAdding(null); }}
            onError={onError}
          />
        ))}
      </div>

      <h3>Combos {combos.length > 0 && <span style={{ color: '#666', fontWeight: 400 }}>({visibleCombos.length}/{combos.length})</span>}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        <div
          style={{ ...card, borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 120, color: '#666' }}
          onClick={() => setCreating('combo')}
        >
          <div style={{ fontSize: 28, lineHeight: 1 }}>+</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>New combo</div>
        </div>
        {visibleCombos.map((c) => (
          <ComboCard key={c.slug} c={c} products={products} onEdit={() => setEditSlug({ kind: 'combo', slug: c.slug })} />
        ))}
      </div>
      {!loading && visibleProducts.length === 0 && visibleCombos.length === 0 && <p>No items match.</p>}

      {(editingProduct || editingCombo) && (
        <EditPopup
          product={editingProduct}
          combo={editingCombo}
          units={units}
          categories={categories}
          onClose={() => setEditSlug(null)}
          onSavedProduct={(u) => setProducts((ps) => ps.map((x) => (x.slug === u.slug ? u : x)))}
          onSavedCombo={(u) => setCombos((cs) => cs.map((x) => (x.slug === u.slug ? u : x)))}
          onDeletedProduct={(slug) => setProducts((ps) => ps.filter((x) => x.slug !== slug))}
          onError={onError}
        />
      )}
      {creating && (
        <CreatePopup
          kind={creating}
          categories={categories}
          units={units}
          onClose={() => setCreating(null)}
          onCreatedProduct={(p) => setProducts((ps) => [...ps, p])}
          onCreatedCombo={(c) => setCombos((cs) => [...cs, c])}
          onError={onError}
        />
      )}
    </div>
  );
}
