/**
 * Mock catalog pricing — Nov 2026 Chennai estimates (committed seed).
 *
 * One-off data fix, kept as a reviewable artifact: sets realistic mock prices
 * on the 35 website-seeded products + 4 combos so the billing-desk APIs and
 * UI can be tested end to end. Real prices come from the admin console later.
 *
 * - Loose items: `pricePerUnit` in RUPEES per BASE UNIT (stockUnit is 'g',
 *   so ₹130/kg -> 0.13 ₹/g). Some rates need 3 decimals (e.g. 0.115);
 *   the billing UI rounds line totals to 2-decimal rupees.
 * - Quantized items: `quantityPrice` tiers, quantities in grams, prices in rupees.
 * - Combos: `totalPrice` in rupees (small discount vs. sum of parts).
 *
 * Idempotent: matches docs by slug with updateOne. Safe to re-run.
 *
 * Usage (read-only dry run first):
 *   ./node_modules/.bin/tsx packages/db/seeds/mock-pricing-nov-2026.ts
 *   ./node_modules/.bin/tsx packages/db/seeds/mock-pricing-nov-2026.ts --apply
 */
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config({ path: new URL('../../../.env', import.meta.url) });

const now = () => new Date().toISOString();

interface Tier {
  quantity: number; // grams (base units)
  price: number; // rupees
}

/** Loose items: slug -> rupees per gram (comment shows the ₹/kg estimate). */
const LOOSE: Record<string, { perGram: number; perKgNote: string }> = {
  'toor-dal': { perGram: 0.13, perKgNote: '₹130/kg' },
  'urad-dal': { perGram: 0.115, perKgNote: '₹115/kg' },
  'moong-dal': { perGram: 0.12, perKgNote: '₹120/kg' },
  'kadalai-paruppu': { perGram: 0.09, perKgNote: '₹90/kg' },
  rajma: { perGram: 0.16, perKgNote: '₹160/kg' },
  'idli-rice': { perGram: 0.06, perKgNote: '₹60/kg' },
  'rava-sooji': { perGram: 0.05, perKgNote: '₹50/kg' },
  'black-chickpeas': { perGram: 0.1, perKgNote: '₹100/kg' },
  'white-chickpeas': { perGram: 0.12, perKgNote: '₹120/kg' },
  'turmeric-powder': { perGram: 0.25, perKgNote: '₹250/kg' },
  'chilli-powder': { perGram: 0.32, perKgNote: '₹320/kg' },
  'coriander-powder': { perGram: 0.2, perKgNote: '₹200/kg' },
  'mustard-seeds': { perGram: 0.14, perKgNote: '₹140/kg' },
  'black-pepper': { perGram: 0.75, perKgNote: '₹750/kg' },
  'fennel-seeds': { perGram: 0.28, perKgNote: '₹280/kg' },
  'fenugreek-seeds': { perGram: 0.16, perKgNote: '₹160/kg' },
  'pepper-powder': { perGram: 0.8, perKgNote: '₹800/kg' },
  'cumin-powder': { perGram: 0.42, perKgNote: '₹420/kg' },
  'bay-leaf': { perGram: 0.2, perKgNote: '₹200/kg' },
  'star-anise': { perGram: 0.55, perKgNote: '₹550/kg' },
};

/** Fixed-pack items: slug -> tiers (grams -> rupees). */
const QUANTIZED: Record<string, Tier[]> = {
  'cashew-nuts': [
    { quantity: 250, price: 340 },
    { quantity: 500, price: 675 },
    { quantity: 1000, price: 1320 },
  ],
  almonds: [
    { quantity: 250, price: 220 },
    { quantity: 500, price: 435 },
    { quantity: 1000, price: 860 },
  ],
  'dry-black-grapes': [
    { quantity: 250, price: 105 },
    { quantity: 500, price: 205 },
    { quantity: 1000, price: 400 },
  ],
  'dates-with-seeds': [
    { quantity: 250, price: 65 },
    { quantity: 500, price: 128 },
    { quantity: 1000, price: 250 },
  ],
  'dates-without-seeds': [
    { quantity: 250, price: 90 },
    { quantity: 500, price: 178 },
    { quantity: 1000, price: 350 },
  ],
  'cooking-oil': [
    { quantity: 500, price: 72 },
    { quantity: 1000, price: 142 },
    { quantity: 5000, price: 690 },
  ],
  'sesame-oil': [
    { quantity: 500, price: 170 },
    { quantity: 1000, price: 330 },
  ],
  'coconut-oil': [
    { quantity: 500, price: 225 },
    { quantity: 1000, price: 440 },
  ],
  'body-soap': [{ quantity: 100, price: 42 }],
  'detergent-soap': [{ quantity: 250, price: 35 }],
  'garam-masala': [
    { quantity: 100, price: 55 },
    { quantity: 200, price: 105 },
    { quantity: 500, price: 250 },
  ],
  'chicken-masala': [
    { quantity: 100, price: 50 },
    { quantity: 200, price: 95 },
  ],
  'sambar-powder': [
    { quantity: 100, price: 35 },
    { quantity: 200, price: 65 },
    { quantity: 500, price: 155 },
  ],
  'rasam-powder': [
    { quantity: 100, price: 35 },
    { quantity: 200, price: 65 },
  ],
  'biryani-masala': [
    { quantity: 100, price: 60 },
    { quantity: 200, price: 115 },
  ],
};

/** Combos: slug -> totalPrice in rupees. */
const COMBOS: Record<string, number> = {
  'combo-1': 1249, // nuts bundle vs ₹1,315 parts
  'combo-2': 199, // spice pack vs ₹229 parts
  'combo-3': 1949, // nuts value 10% off vs ₹2,180 parts
  'combo-4': 60, // breakfast BOGO vs ₹70 parts
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

    // Guard: pricing table must cover exactly the products in the DB.
    const slugs = (await db.collection('products').find({}).project({ slug: 1 }).toArray()).map(
      (d) => d.slug as string,
    );
    const priced = new Set([...Object.keys(LOOSE), ...Object.keys(QUANTIZED)]);
    const missing = slugs.filter((s) => !priced.has(s));
    const extra = [...priced].filter((s) => !slugs.includes(s));
    if (missing.length > 0) throw new Error(`pricing missing for: ${missing.join(', ')}`);
    if (extra.length > 0) throw new Error(`pricing references unknown slugs: ${extra.join(', ')}`);
    console.log(`coverage OK: ${slugs.length} products priced (${Object.keys(LOOSE).length} loose, ${Object.keys(QUANTIZED).length} quantized)`);

    const comboSlugs = (await db.collection('combos').find({}).project({ slug: 1 }).toArray()).map(
      (d) => d.slug as string,
    );
    const missingCombos = comboSlugs.filter((s) => !(s in COMBOS));
    if (missingCombos.length > 0) throw new Error(`pricing missing for combos: ${missingCombos.join(', ')}`);
    console.log(`coverage OK: ${comboSlugs.length} combos priced`);

    if (!apply) {
      console.log('dry run — no writes. Re-run with --apply to write.');
      return;
    }

    const timestamp = now();
    let pCount = 0;
    for (const [slug, v] of Object.entries(LOOSE)) {
      const r = await db
        .collection('products')
        .updateOne({ slug }, { $set: { isQuantized: false, quantityPrice: [], pricePerUnit: v.perGram, updatedAt: timestamp } });
      pCount += r.modifiedCount;
    }
    for (const [slug, tiers] of Object.entries(QUANTIZED)) {
      const r = await db.collection('products').updateOne(
        { slug },
        {
          $set: { isQuantized: true, quantityPrice: tiers, updatedAt: timestamp },
          $unset: { pricePerUnit: '' },
        },
      );
      pCount += r.modifiedCount;
    }
    let cCount = 0;
    for (const [slug, totalPrice] of Object.entries(COMBOS)) {
      const r = await db
        .collection('combos')
        .updateOne({ slug }, { $set: { totalPrice, updatedAt: timestamp } });
      cCount += r.modifiedCount;
    }
    console.log(`wrote: ${pCount} products, ${cCount} combos`);

    // Verify: no zero prices left, spot-check tiers.
    const zeroPrice = await db.collection('products').countDocuments({
      $or: [
        { isQuantized: false, pricePerUnit: 0 },
        { isQuantized: true, quantityPrice: { $size: 0 } },
      ],
    });
    const zeroCombo = await db.collection('combos').countDocuments({ totalPrice: 0 });
    const spot = await db.collection('products').findOne({ slug: 'toor-dal' });
    const spotQ = await db.collection('products').findOne({ slug: 'cashew-nuts' });
    const spotC = await db.collection('combos').findOne({ slug: 'combo-1' });
    console.log('verify — zero-price products:', zeroPrice, '| zero-price combos:', zeroCombo);
    console.log('spot toor-dal:', JSON.stringify({ ppu: spot?.pricePerUnit, q: spot?.isQuantized }));
    console.log('spot cashew-nuts:', JSON.stringify({ tiers: spotQ?.quantityPrice, q: spotQ?.isQuantized }));
    console.log('spot combo-1:', JSON.stringify({ totalPrice: spotC?.totalPrice }));
    if (zeroPrice > 0 || zeroCombo > 0) throw new Error('verification failed: zero prices remain');
    console.log('\nPRICING APPLIED');
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
