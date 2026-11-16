/**
 * Mock combo contents — Nov 2026 (committed seed).
 *
 * Gives each of the 4 combos its component list in the ComboProduct shape:
 * { productSlug, quantity } where quantity matches the component product's
 * own stock shape (base-unit number for loose, QuantizedCount array for
 * quantized). Part quantities are chosen to match the parts-value comments
 * in the pricing seed (combo-1 parts ₹1,315; combo-2 parts ₹229; combo-3
 * parts ₹2,180; combo-4 parts ₹70).
 *
 * Idempotent: matches docs by slug with updateOne. Safe to re-run.
 * Touch composition only — prices stay in mock-pricing-nov-2026.ts.
 *
 * Usage (read-only dry run first):
 *   ./node_modules/.bin/tsx packages/db/seeds/mock-combos-nov-2026.ts
 *   ./node_modules/.bin/tsx packages/db/seeds/mock-combos-nov-2026.ts --apply
 */
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import type { QuantizedCount } from '@bqm/types';

config({ path: new URL('../../../.env', import.meta.url) });

const now = () => new Date().toISOString();

interface ComboComponent {
  productSlug: string;
  /** One combo unit's share: base units for loose, QuantizedCount array for quantized. */
  quantity: number | QuantizedCount[];
}

/** Combo slug -> components. Names are copied from the live product docs at write time. */
const COMBOS: Record<string, ComboComponent[]> = {
  // parts: cashew 500 (₹675) + almonds 500 (₹435) + grapes 500 (₹205) = ₹1,315
  'combo-1': [
    { productSlug: 'cashew-nuts', quantity: [{ size: 500, count: 1 }] },
    { productSlug: 'almonds', quantity: [{ size: 500, count: 1 }] },
    { productSlug: 'dry-black-grapes', quantity: [{ size: 500, count: 1 }] },
  ],
  // parts: turmeric 200g (₹50) + chilli 200g (₹64) + coriander 200g (₹40) + black-pepper 100g (₹75) = ₹229
  'combo-2': [
    { productSlug: 'turmeric-powder', quantity: 200 },
    { productSlug: 'chilli-powder', quantity: 200 },
    { productSlug: 'coriander-powder', quantity: 200 },
    { productSlug: 'black-pepper', quantity: 100 },
  ],
  // parts: almonds 1000 (₹860) + cashew 1000 (₹1,320) = ₹2,180
  'combo-3': [
    { productSlug: 'almonds', quantity: [{ size: 1000, count: 1 }] },
    { productSlug: 'cashew-nuts', quantity: [{ size: 1000, count: 1 }] },
  ],
  // parts: idli-rice 750g (₹45) + rava-sooji 500g (₹25) = ₹70
  'combo-4': [
    { productSlug: 'idli-rice', quantity: 750 },
    { productSlug: 'rava-sooji', quantity: 500 },
  ],
};

/** Combo slug -> Tamil display name (placeholder mock values, same convention as product Tamil names). */
const NAMES: Record<string, string> = {
  'combo-1': 'உலர் பழங்கள் & கொட்டைகள் தொகுப்பு',
  'combo-2': 'அத்தியாவசிய சமையல் மசாலா தொகுப்பு',
  'combo-3': 'கொட்டைகள் மதிப்பு தொகுப்பு (10% தள்ளுபடி)',
  'combo-4': 'வார இறுதி காலை உணவு சிறப்பு',
};

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) throw new Error('MONGODB_URI / MONGODB_DB missing (check .env)');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    await db.command({ ping: 1 });

    // Guard: combo slugs must match exactly the DB set.
    const slugs = (await db.collection('combos').find({}).project({ slug: 1 }).toArray()).map(
      (d) => d.slug as string,
    );
    const missing = slugs.filter((s) => !(s in COMBOS));
    const extra = Object.keys(COMBOS).filter((s) => !slugs.includes(s));
    if (missing.length > 0) throw new Error(`contents missing for combos: ${missing.join(', ')}`);
    if (extra.length > 0) throw new Error(`contents reference unknown combos: ${extra.join(', ')}`);
    const missingNames = slugs.filter((s) => !(s in NAMES));
    if (missingNames.length > 0) throw new Error(`tamil names missing for combos: ${missingNames.join(', ')}`);

    // Guard: component slugs exist; quantity shape matches isQuantized.
    // Names are snapshotted from the live product docs (slug stays the join key).
    const products = await db
      .collection('products')
      .find({})
      .project({ slug: 1, name: 1, tamilName: 1, isQuantized: 1 })
      .toArray();
    const productBySlug = new Map(
      products.map((p) => [
        p.slug as string,
        { name: p.name as string, tamilName: p.tamilName as string | undefined, isQuantized: p.isQuantized as boolean },
      ]),
    );
    const withNames: Record<string, Array<ComboComponent & { name: string; tamilName?: string }>> = {};
    for (const [comboSlug, comps] of Object.entries(COMBOS)) {
      if (comps.length === 0) throw new Error(`${comboSlug}: no components`);
      withNames[comboSlug] = comps.map((comp) => {
        const prod = productBySlug.get(comp.productSlug);
        if (!prod) throw new Error(`${comboSlug}: unknown productSlug ${comp.productSlug}`);
        if (!prod.name) throw new Error(`${comboSlug}: ${comp.productSlug} has no name`);
        const isQuantized = prod.isQuantized;
        if (isQuantized) {
          if (!Array.isArray(comp.quantity) || comp.quantity.length === 0) {
            throw new Error(`${comboSlug}: ${comp.productSlug} is quantized but quantity is not a QuantizedCount array`);
          }
          for (const q of comp.quantity) {
            if (!Number.isInteger(q.size) || q.size <= 0 || !Number.isInteger(q.count) || q.count <= 0) {
              throw new Error(`${comboSlug}: ${comp.productSlug} size and count must be positive integers`);
            }
          }
        } else if (typeof comp.quantity !== 'number' || !Number.isFinite(comp.quantity) || comp.quantity <= 0) {
          throw new Error(`${comboSlug}: ${comp.productSlug} quantity must be a positive base-unit number`);
        }
        return {
          ...comp,
          name: prod.name,
          ...(prod.tamilName ? { tamilName: prod.tamilName } : {}),
        };
      });
    }
    console.log(`coverage OK: ${Object.keys(COMBOS).length} combos with contents`);

    if (!apply) {
      console.log('dry run — no writes. Re-run with --apply to write.');
      for (const [slug, comps] of Object.entries(withNames)) {
        console.log(`  ${slug}: ${comps.map((c) => `${c.productSlug} (${c.name}) ${JSON.stringify(c.quantity)}`).join(' + ')}`);
      }
      return;
    }

    const timestamp = now();
    let count = 0;
    for (const [slug, comps] of Object.entries(withNames)) {
      const r = await db
        .collection('combos')
        .updateOne({ slug }, { $set: { products: comps, tamilName: NAMES[slug], updatedAt: timestamp } });
      count += r.modifiedCount;
    }
    console.log(`wrote: ${count} combos`);

    const spot = await db.collection('combos').findOne({ slug: 'combo-1' });
    console.log('spot combo-1:', JSON.stringify(spot?.products));
    console.log('\nCOMBO CONTENTS APPLIED');
  } finally {
    await client.close();
  }
}

try {
  await main();
} catch (err) {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
}
