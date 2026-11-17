import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PublicCombo, PublicProduct } from '@bqm/types';
import { getCatalog, prettyCategory } from '../api';
import type { CategoryInfo } from '../types';

/** Static display meta for known categories (labels, Tamil names, cover art). Counts come from the API. */
const CATEGORY_META: Record<string, { englishLabel: string; tamilLabel: string; image?: string }> = {
  pulses: { englishLabel: 'Pulses & Lentils', tamilLabel: 'பருப்பு வகைகள்', image: '/images/pulses-and-lentils.jpg' },
  'rice-grains': { englishLabel: 'Rice & Grains', tamilLabel: 'அரிசி & தானியங்கள்', image: '/images/rice-and-grains.jpg' },
  chickpeas: { englishLabel: 'Chickpeas', tamilLabel: 'கொண்டைக்கடலை' },
  spices: { englishLabel: 'Spices & Powders', tamilLabel: 'மசாலா தூள் & விதைகள்' },
  masalas: { englishLabel: 'South Masalas', tamilLabel: 'தென்னிந்திய மசாலா', image: '/images/south-masalas.jpg' },
  oils: { englishLabel: 'Cooking Oils', tamilLabel: 'சமையல் எண்ணெய்', image: '/images/cooking-oils.jpg' },
  household: { englishLabel: 'Household Essentials', tamilLabel: 'வீட்டு உபயோக பொருட்கள்' },
  'nuts-dryfruits': { englishLabel: 'Nuts & Dry Fruits', tamilLabel: 'கொட்டை & உலர் பழங்கள்', image: '/images/nuts-and-dry-fruits.jpg' },
};

const CATEGORY_ORDER = ['pulses', 'rice-grains', 'chickpeas', 'spices', 'masalas', 'oils', 'household', 'nuts-dryfruits'];

interface CatalogState {
  products: PublicProduct[];
  combos: PublicCombo[];
  categories: CategoryInfo[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const CatalogContext = createContext<CatalogState | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [combos, setCombos] = useState<PublicCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setProducts(catalog.products);
        setCombos(catalog.combos);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load catalogue');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  const categories = useMemo<CategoryInfo[]>(() => {
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    const known = CATEGORY_ORDER.filter((id) => counts.has(id));
    const extra = [...counts.keys()].filter((id) => !CATEGORY_ORDER.includes(id)).sort();
    return [...known, ...extra].map((id) => {
      const meta = CATEGORY_META[id];
      return {
        id,
        englishLabel: meta?.englishLabel ?? prettyCategory(id),
        ...(meta?.tamilLabel ? { tamilLabel: meta.tamilLabel } : {}),
        ...(meta?.image ? { image: meta.image } : {}),
        count: counts.get(id) ?? 0,
      };
    });
  }, [products]);

  return (
    <CatalogContext.Provider value={{ products, combos, categories, loading, error, retry }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = (): CatalogState => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider');
  return ctx;
};
