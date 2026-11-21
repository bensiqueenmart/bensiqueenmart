import { useEffect, useMemo, useState } from 'react';
import type { Combo, OrderStatus, Product } from '@bqm/types';
import { createOrder, getCatalog, getOrder, patchOrder } from '../api';
import { clearBill as clearParked, loadBill, saveBill } from '../billCache';
import ProductCard from './ProductCard';
import ComboCard from './ComboCard';
import BillPanel, { type ComboContent, type DisplayLang, type DraftLine } from './BillPanel';

const looseStep = (p: Product) => (p.stockUnit === 'g' || p.stockUnit === 'ml' ? 100 : 1);

/** Round rupees to 2 decimals. */
const r2 = (n: number) => Math.round(n * 100) / 100;

export default function NewOrderTab({ onError }: { onError: (msg: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [lines, setLines] = useState<DraftLine[]>([]);
  const [lang, setLang] = useState<DisplayLang>('en');
  const [order, setOrder] = useState<import('@bqm/types').Order | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const catalog = await getCatalog();
      setProducts(catalog.products);
      setCombos(catalog.combos.filter((c) => c.isActive));
    } catch (e) {
      onError(`Couldn't load catalog: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore the parked bill (tab switch / refresh / restart proof).
  useEffect(() => {
    (async () => {
      const parked = loadBill();
      if (!parked || (!parked.order && parked.lines.length === 0)) {
        setHydrated(true);
        return;
      }
      if (!parked.order) {
        setLines(parked.lines);
        setCustomerName(parked.customerName);
        setMobile(parked.mobile);
        setHydrated(true);
        return;
      }
      try {
        const fresh = await getOrder(parked.order.id);
        if (fresh.status !== 'unconfirmed') {
          clearParked(); // finished elsewhere (e.g. Orders tab) — start fresh
        } else {
          setOrder(fresh);
          setLines(parked.lines);
          setCustomerName(parked.customerName);
          setMobile(parked.mobile);
        }
      } catch (e) {
        if (/not found|404/i.test(String(e))) {
          clearParked();
        } else {
          // Offline — keep the snapshot; the next save surfaces real problems.
          setOrder(parked.order);
          setLines(parked.lines);
          setCustomerName(parked.customerName);
          setMobile(parked.mobile);
        }
      }
      setHydrated(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist every bill change once hydration is done.
  useEffect(() => {
    if (!hydrated) return;
    saveBill({ order, lines, customerName, mobile });
  }, [hydrated, order, lines, customerName, mobile]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const productBySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  const resolveContents = (c: Combo): ComboContent[] =>
    c.products.map((comp) => {
      const p = productBySlug.get(comp.productSlug);
      return {
        slug: comp.productSlug,
        name: comp.name ?? p?.name ?? comp.productSlug,
        ...(comp.tamilName ?? p?.tamilName ? { tamilName: (comp.tamilName ?? p?.tamilName) as string } : {}),
        unit: p?.stockUnit ?? '',
        quantity: comp.quantity,
      };
    });

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.tamilName && p.tamilName.toLowerCase().includes(q))),
    );
  }, [products, search, category]);

  const visibleCombos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return combos.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.tamilName && c.tamilName.toLowerCase().includes(q)),
    );
  }, [combos, search]);

  const addTier = (p: Product, quantity: number, price: number) => {
    const key = `${p.slug}:${quantity}`;
    setLines((ls) => {
      const found = ls.find((l) => l.key === key);
      if (found)
        return ls.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + quantity, price: l.price + price } : l
        );
      return [
        ...ls,
        {
          key,
          kind: 'product',
          slug: p.slug,
          name: `${p.name} (${quantity}${p.stockUnit})`,
          ...(p.tamilName ? { tamilName: `${p.tamilName} (${quantity}${p.stockUnit})` } : {}),
          step: quantity,
          quantity,
          price,
          packSize: quantity,
          unit: p.stockUnit,
        },
      ];
    });
  };

  const addLoose = (p: Product, quantity: number) => {
    const unitRate = p.pricePerUnit ?? 0;
    setLines((ls) => [
      ...ls,
      {
        key: `${p.slug}:loose:${Date.now()}`,
        kind: 'product',
        slug: p.slug,
        name: `${p.name} (loose)`,
        ...(p.tamilName ? { tamilName: `${p.tamilName} (loose)` } : {}),
        step: looseStep(p),
        quantity,
        price: r2(unitRate * quantity),
        unit: p.stockUnit,
        unitPrice: unitRate,
        locked: true,
      },
    ]);
  };

  const addLooseByPrice = (p: Product, priceRupees: number) => {
    const unitRate = p.pricePerUnit ?? 0;
    if (!(unitRate > 0) || !Number.isFinite(priceRupees) || priceRupees <= 0) return;
    setLines((ls) => [
      ...ls,
      {
        key: `${p.slug}:loose:${Date.now()}`,
        kind: 'product',
        slug: p.slug,
        name: `${p.name} (loose)`,
        ...(p.tamilName ? { tamilName: `${p.tamilName} (loose)` } : {}),
        step: looseStep(p),
        // Customer pays entered price; quantity derives from the rate
        quantity: Math.max(1, Math.round(priceRupees / unitRate)),
        price: r2(priceRupees),
        unit: p.stockUnit,
        unitPrice: unitRate,
        locked: true,
      },
    ]);
  };

  const addCombo = (c: Combo) => {
    const contents: ComboContent[] = c.products.map((comp) => {
      const p = productBySlug.get(comp.productSlug);
      return {
        slug: comp.productSlug,
        name: comp.name ?? p?.name ?? comp.productSlug,
        ...(comp.tamilName ?? p?.tamilName ? { tamilName: (comp.tamilName ?? p?.tamilName) as string } : {}),
        unit: p?.stockUnit ?? '',
        quantity: comp.quantity,
      };
    });
    setLines((ls) => {
      const found = ls.find((l) => l.kind === 'combo' && l.slug === c.slug);
      if (found)
        return ls.map((l) =>
          l.kind === 'combo' && l.slug === c.slug
            ? { ...l, quantity: l.quantity + 1, price: l.price + c.totalPrice }
            : l
        );
      return [
        ...ls,
        {
          key: `combo:${c.slug}`,
          kind: 'combo',
          slug: c.slug,
          name: c.name,
          ...(c.tamilName ? { tamilName: c.tamilName } : {}),
          step: 1,
          quantity: 1,
          price: c.totalPrice,
          unit: '',
          comboContents: contents,
        },
      ];
    });
  };

  const toOrderItems = () =>
    lines.map((l) => {
      const quantity =
        l.kind === 'product' && l.packSize
          ? [{ size: l.packSize, count: l.quantity / l.packSize }]
          : l.quantity;
      return {
        ...(l.kind === 'product' ? { productSlug: l.slug } : { comboSlug: l.slug }),
        quantity,
        price: l.price,
      };
    });

  const handleCreate = async () => {
    setBusy(true);
    try {
      const created = await createOrder(toOrderItems(), { customerName, mobile, fullAddress: '' });
      setOrder(created);
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateItems = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const result = await patchOrder(order.id, { orderItems: toOrderItems() });
      setOrder(result.order);
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (status: OrderStatus) => {
    if (!order) return;
    setBusy(true);
    try {
      const result = await patchOrder(order.id, { status });
      if (result.order.status !== 'unconfirmed') {
        clearParked();
        setLines([]);
        setOrder(null);
        setCustomerName('');
        setMobile('');
      } else {
        setOrder(result.order);
      }
    } catch (e) {
      onError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const newBill = () => {
    clearParked();
    setLines([]);
    setOrder(null);
    setCustomerName('');
    setMobile('');
  };

  return (
    <div className="pos-workspace-grid">
      {/* LEFT: Product Catalog & Search Selection */}
      <section style={{ minWidth: 0 }}>
        {/* Search & Actions Toolbar */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #DCE8C8',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 14,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Top row: Search Bar and Quick Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* Search Input with Icon */}
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 14,
                  color: '#68826D',
                }}
              >
                🔍
              </span>
              <input
                placeholder="Search products, Tamil names, or categories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 30px 8px 32px',
                  border: '1px solid #DCE8C8',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#123B26',
                  background: '#FDFEFD',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#889988',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '2px 4px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Language Switcher */}
              <button
                onClick={() => setLang((l) => (l === 'en' ? 'ta' : 'en'))}
                title="Switch display language for product and combo names"
                style={{
                  padding: '7px 12px',
                  border: '1px solid #DCE8C8',
                  borderRadius: 8,
                  background: '#F7F5E8',
                  color: '#123B26',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'background 0.12s ease',
                }}
              >
                <span>🌐</span> {lang === 'en' ? 'தமிழ்' : 'English'}
              </button>

              {/* Refresh Catalog */}
              <button
                onClick={load}
                disabled={loading}
                title="Refresh product catalog"
                style={{
                  padding: '7px 12px',
                  border: '1px solid #DCE8C8',
                  borderRadius: 8,
                  background: '#fff',
                  color: '#123B26',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                ↻ Refresh
              </button>

              {/* Clear Bill */}
              <button
                onClick={newBill}
                disabled={busy}
                title="Discard current bill and start empty"
                style={{
                  padding: '7px 12px',
                  border: '1px solid #FCA5A5',
                  borderRadius: 8,
                  background: '#FEF2F2',
                  color: '#991B1B',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                🗑 Clear
              </button>
            </div>
          </div>

          {/* Category Filter Chips Bar */}
          <div className="category-chips-bar">
            <button
              onClick={() => setCategory('all')}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: category === 'all' ? 700 : 500,
                background: category === 'all' ? '#123B26' : '#F7F5E8',
                color: category === 'all' ? '#ffffff' : '#205C38',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease',
              }}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => {
              const active = category === c;
              const count = products.filter((p) => p.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    background: active ? '#123B26' : '#F7F5E8',
                    color: active ? '#ffffff' : '#205C38',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 36, textAlign: 'center', border: '1px solid #DCE8C8' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#205C38', fontWeight: 600 }}>Loading product catalog…</p>
          </div>
        )}

        {/* Section: Products Catalog */}
        {!loading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800 }}>
                Products Catalog
              </h3>
              <span style={{ fontSize: 12, color: '#68826D' }}>
                Showing {visibleProducts.length} of {products.length} products
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {visibleProducts.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  lang={lang}
                  onAddTier={addTier}
                  onAddLoose={addLoose}
                  onAddLooseByPrice={addLooseByPrice}
                />
              ))}
            </div>

            {visibleProducts.length === 0 && (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 32,
                  textAlign: 'center',
                  color: '#68826D',
                  border: '1px dashed #DCE8C8',
                  marginBottom: 20,
                }}
              >
                No products match "{search}". Try searching for another name or switch category.
              </div>
            )}
          </div>
        )}

        {/* Section: Combos Packages */}
        {!loading && visibleCombos.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>🎁</span>
                <h3 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800 }}>
                  Combo Packages &amp; Value Kits
                </h3>
              </div>
              <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                {visibleCombos.length} available
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              {visibleCombos.map((c) => (
                <ComboCard
                  key={c.slug}
                  combo={c}
                  lang={lang}
                  contents={resolveContents(c)}
                  onAdd={addCombo}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* RIGHT: Current Bill & Checkout Cart */}
      <BillPanel
        lines={lines}
        lang={lang}
        onLinesChange={setLines}
        order={order}
        customerName={customerName}
        mobile={mobile}
        onCustomerChange={(n, m) => {
          setCustomerName(n);
          setMobile(m);
        }}
        busy={busy}
        onCreate={handleCreate}
        onUpdateItems={handleUpdateItems}
        onStatus={handleStatus}
        onNewBill={newBill}
      />
    </div>
  );
}
