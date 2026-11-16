import { useEffect, useMemo, useState } from 'react';
import type { Combo, OrderStatus, Product } from '@bqm/types';
import { createOrder, getCatalog, getOrder, patchOrder } from '../api';
import { clearBill as clearParked, loadBill, saveBill } from '../billCache';
import ProductCard from './ProductCard';
import ComboCard from './ComboCard';
import BillPanel, { type DraftLine } from './BillPanel';

const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, cursor: 'pointer', background: '#fff' };
const input: React.CSSProperties = { padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 };

const looseStep = (p: Product) => (p.stockUnit === 'g' || p.stockUnit === 'ml' ? 100 : 1);

export default function NewOrderTab({ onError }: { onError: (msg: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [lines, setLines] = useState<DraftLine[]>([]);
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
        if (fresh.status !== 'pending') {
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

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)),
    );
  }, [products, search, category]);

  const visibleCombos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return combos.filter((c) => !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [combos, search]);

  const addTier = (p: Product, quantity: number, price: number) => {
    const key = `${p.slug}:${quantity}`;
    setLines((ls) => {
      const found = ls.find((l) => l.key === key);
      if (found) return ls.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity, price: l.price + price } : l));
      return [...ls, { key, kind: 'product', slug: p.slug, name: `${p.name} (${quantity}${p.stockUnit})`, step: quantity, quantity, price, packSize: quantity, unit: p.stockUnit }];
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
        step: looseStep(p),
        quantity,
        price: Math.round(unitRate * quantity),
        unit: p.stockUnit,
        unitPrice: unitRate,
        locked: true,
      },
    ]);
  };

  const addLooseByPrice = (p: Product, pricePaise: number) => {
    const unitRate = p.pricePerUnit ?? 0;
    if (!(unitRate > 0) || !Number.isFinite(pricePaise) || pricePaise <= 0) return;
    setLines((ls) => [
      ...ls,
      {
        key: `${p.slug}:loose:${Date.now()}`,
        kind: 'product',
        slug: p.slug,
        name: `${p.name} (loose)`,
        step: looseStep(p),
        // Customer pays the entered price; quantity derives from the canonical rate.
        quantity: Math.max(1, Math.round(pricePaise / unitRate)),
        price: Math.round(pricePaise),
        unit: p.stockUnit,
        unitPrice: unitRate,
        locked: true,
      },
    ]);
  };

  const addCombo = (c: Combo) => {
    setLines((ls) => {
      const found = ls.find((l) => l.kind === 'combo' && l.slug === c.slug);
      if (found) return ls.map((l) => (l.kind === 'combo' && l.slug === c.slug ? { ...l, quantity: l.quantity + 1, price: l.price + c.totalPrice } : l));
      return [...ls, { key: `combo:${c.slug}`, kind: 'combo', slug: c.slug, name: c.name, step: 1, quantity: 1, price: c.totalPrice, unit: '' }];
    });
  };

  const toOrderItems = () =>
    lines.map((l) => {
      const base = {
        ...(l.kind === 'product' ? { productSlug: l.slug } : { comboSlug: l.slug }),
        quantity: l.quantity,
        price: l.price,
      };
      // Quantized tier lines carry their pack breakdown; Σ(size×count) = quantity.
      if (l.kind === 'product' && l.packSize && l.quantity % l.packSize === 0) {
        return { ...base, packs: [{ size: l.packSize, count: l.quantity / l.packSize }] };
      }
      return base;
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
      if (result.order.status !== 'pending') {
        // Terminal (paid/cancelled/...): deduction done, bill cleared to empty.
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, padding: 16, maxWidth: 1280, margin: '0 auto' }}>
      <section>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...input, flex: 1 }} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button style={btn} onClick={load}>Refresh</button>
          <button
            style={btn}
            title="Discard the current bill and start empty (a saved pending order stays in the Orders tab)"
            disabled={busy}
            onClick={newBill}
          >
            Clear bill
          </button>
        </div>

        {loading && <p>Loading catalog…</p>}

        {!loading && visibleCombos.length > 0 && (
          <>
            <h3>Combos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 16 }}>
              {visibleCombos.map((c) => (
                <ComboCard key={c.slug} combo={c} onAdd={addCombo} />
              ))}
            </div>
          </>
        )}

        <h3>Products</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {visibleProducts.map((p) => (
            <ProductCard key={p.slug} product={p} onAddTier={addTier} onAddLoose={addLoose} onAddLooseByPrice={addLooseByPrice} />
          ))}
        </div>
        {!loading && visibleProducts.length === 0 && <p>No products match. Seed some in the DB first.</p>}
      </section>

      <BillPanel
        lines={lines}
        onLinesChange={setLines}
        order={order}
        customerName={customerName}
        mobile={mobile}
        onCustomerChange={(n, m) => { setCustomerName(n); setMobile(m); }}
        busy={busy}
        onCreate={handleCreate}
        onUpdateItems={handleUpdateItems}
        onStatus={handleStatus}
        onNewBill={newBill}
      />
    </div>
  );
}
