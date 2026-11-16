/**
 * Mock stock levels — small-shop approximates (committed seed).
 *
 * Companion to mock-pricing-nov-2026.ts. Sets `stockBaseQty` (base units =
 * grams, since every product uses stockUnit 'g') with a spread that covers
 * every UI case: high stock, medium, low, very low, and out-of-stock (0).
 *
 * For isQuantized items it also sets `stockPacks` ([{size, count}] buckets
 * with Σ(size×count) === stockBaseQty) with variety for UI testing:
 * multi-size, single-size, few-packs, and empty (zero-stock).
 *
 * Bands in this seed:
 * - high (>= 20kg): idli-rice, toor-dal, cooking-oil, rava-sooji
 * - medium (5–15kg): dals, chickpeas, oils, spice powders, soaps
 * - low (1–4.5kg): seeds, masalas, dry fruits
 * - very low (< 1kg): pepper-powder 300g, cumin-powder 500g, bay-leaf 200g
 * - zero (0): star-anise, dates-without-seeds, rasam-powder
 *
 * Idempotent: matches docs by slug with updateOne. Safe to re-run.
 *
 * Usage (read-only dry run first):
 *   ./node_modules/.bin/tsx packages/db/seeds/mock-stock-nov-2026.ts
 *   ./node_modules/.bin/tsx packages/db/seeds/mock-stock-nov-2026.ts --apply
 */
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config({ path: new URL('../../../.env', import.meta.url) });

const now = () => new Date().toISOString();

/** slug -> stock in grams. Comment shows the human-scale equivalent. */
const STOCK: Record<string, { grams: number; note: string }> = {
  // staples — high
  'idli-rice': { grams: 50000, note: '50 kg' },
  'toor-dal': { grams: 30000, note: '30 kg' },
  'cooking-oil': { grams: 25000, note: '~25 L' },
  'rava-sooji': { grams: 20000, note: '20 kg' },
  // dals & chickpeas — medium
  'urad-dal': { grams: 15000, note: '15 kg' },
  'moong-dal': { grams: 12000, note: '12 kg' },
  'black-chickpeas': { grams: 10000, note: '10 kg' },
  'kadalai-paruppu': { grams: 8000, note: '8 kg' },
  'white-chickpeas': { grams: 7000, note: '7 kg' },
  rajma: { grams: 6000, note: '6 kg' },
  // oils & soaps — medium
  'coconut-oil': { grams: 12000, note: '~12 L' },
  'sesame-oil': { grams: 8000, note: '~8 L' },
  'detergent-soap': { grams: 5000, note: '20 x 250g' },
  'body-soap': { grams: 3000, note: '30 x 100g bars' },
  // spice powders — medium
  'turmeric-powder': { grams: 5000, note: '5 kg' },
  'coriander-powder': { grams: 4500, note: '4.5 kg' },
  'chilli-powder': { grams: 4000, note: '4 kg' },
  'sambar-powder': { grams: 3000, note: '3 kg' },
  'garam-masala': { grams: 2000, note: '2 kg' },
  'biryani-masala': { grams: 1800, note: '1.8 kg' },
  'chicken-masala': { grams: 1500, note: '1.5 kg' },
  // seeds & whole spices — low
  'mustard-seeds': { grams: 3000, note: '3 kg' },
  'fenugreek-seeds': { grams: 2500, note: '2.5 kg' },
  'fennel-seeds': { grams: 2000, note: '2 kg' },
  'black-pepper': { grams: 1500, note: '1.5 kg' },
  // dry fruits — low (high value, small shop keeps little)
  'dry-black-grapes': { grams: 4000, note: '4 kg' },
  'dates-with-seeds': { grams: 3500, note: '3.5 kg' },
  'cashew-nuts': { grams: 3000, note: '3 kg' },
  almonds: { grams: 2500, note: '2.5 kg' },
  // very low — near-out cases for UI warnings
  'cumin-powder': { grams: 500, note: '500 g' },
  'pepper-powder': { grams: 300, note: '300 g' },
  'bay-leaf': { grams: 200, note: '200 g' },
  // zero — out-of-stock cases
  'star-anise': { grams: 0, note: 'out of stock' },
  'dates-without-seeds': { grams: 0, note: 'out of stock' },
  'rasam-powder': { grams: 0, note: 'out of stock' },
};

/** Quantized buckets: slug -> [{size, count}] in grams. Sums match STOCK above. */
const PACKS: Record<string, Array<{ size: number; count: number }>> = {
  // dry fruits — multi-size variety
  'cashew-nuts': [{ size: 1000, count: 2 }, { size: 500, count: 1 }, { size: 250, count: 2 }],
  almonds: [{ size: 1000, count: 1 }, { size: 500, count: 2 }, { size: 250, count: 2 }],
  'dry-black-grapes': [{ size: 1000, count: 2 }, { size: 500, count: 3 }, { size: 250, count: 2 }],
  'dates-with-seeds': [{ size: 1000, count: 2 }, { size: 500, count: 2 }, { size: 250, count: 2 }],
  'dates-without-seeds': [],
  // oils — bulk + small packs
  'cooking-oil': [{ size: 5000, count: 4 }, { size: 1000, count: 2 }, { size: 500, count: 6 }],
  'sesame-oil': [{ size: 1000, count: 6 }, { size: 500, count: 4 }],
  'coconut-oil': [{ size: 1000, count: 10 }, { size: 500, count: 4 }],
  // soaps — single-size packs
  'body-soap': [{ size: 100, count: 30 }],
  'detergent-soap': [{ size: 250, count: 20 }],
  // masalas — mixed small packs
  'garam-masala': [{ size: 500, count: 2 }, { size: 200, count: 3 }, { size: 100, count: 4 }],
  'chicken-masala': [{ size: 200, count: 5 }, { size: 100, count: 5 }],
  'sambar-powder': [{ size: 500, count: 4 }, { size: 200, count: 3 }, { size: 100, count: 4 }],
  'rasam-powder': [],
  'biryani-masala': [{ size: 200, count: 7 }, { size: 100, count: 4 }],
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

    // Guard: stock table must cover exactly the products in the DB.
    const slugs = (await db.collection('products').find({}).project({ slug: 1 }).toArray()).map(
      (d) => d.slug as string,
    );
    const stocked = new Set(Object.keys(STOCK));
    const missing = slugs.filter((s) => !stocked.has(s));
    const extra = [...stocked].filter((s) => !slugs.includes(s));
    if (missing.length > 0) throw new Error(`stock missing for: ${missing.join(', ')}`);
    if (extra.length > 0) throw new Error(`stock references unknown slugs: ${extra.join(', ')}`);
    const zeros = Object.entries(STOCK).filter(([, v]) => v.grams === 0).map(([s]) => s);
    console.log(`coverage OK: ${slugs.length} products (${zeros.length} zero-stock: ${zeros.join(', ')})`);

    // Guard: packs sums must equal grams for every quantized slug.
    for (const [slug, packs] of Object.entries(PACKS)) {
      const sum = packs.reduce((s, p) => s + p.size * p.count, 0);
      if (sum !== STOCK[slug].grams) throw new Error(`packs sum mismatch for ${slug}: ${sum} != ${STOCK[slug].grams}`);
    }

    if (!apply) {
      console.log('dry run — no writes. Re-run with --apply to write.');
      console.log(`packs cover ${Object.keys(PACKS).length} quantized products`);
      return;
    }

    const timestamp = now();
    let count = 0;
    for (const [slug, v] of Object.entries(STOCK)) {
      if (slug in PACKS) {
        const r = await db
          .collection('products')
          .updateOne({ slug }, { $set: { stockBaseQty: v.grams, stockPacks: PACKS[slug], updatedAt: timestamp } });
        count += r.modifiedCount;
      } else {
        const r = await db
          .collection('products')
          .updateOne({ slug }, { $set: { stockBaseQty: v.grams, updatedAt: timestamp }, $unset: { stockPacks: '' } });
        count += r.modifiedCount;
      }
    }
    console.log(`wrote: ${count} products`);

    // Verify: every product has a non-negative integer stock; spot-check bands.
    const bad = await db.collection('products').countDocuments({
      $expr: {
        $or: [
          { $lt: ['$stockBaseQty', 0] },
          { $ne: ['$stockBaseQty', { $trunc: '$stockBaseQty' }] },
        ],
      },
    });
    const band = await db
      .collection('products')
      .aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $eq: ['$stockBaseQty', 0] }, then: 'zero' },
                  { case: { $lt: ['$stockBaseQty', 1000] }, then: 'very-low' },
                  { case: { $lt: ['$stockBaseQty', 5000] }, then: 'low' },
                  { case: { $lt: ['$stockBaseQty', 20000] }, then: 'medium' },
                ],
                default: 'high',
              },
            },
            n: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    const spotHigh = await db.collection('products').findOne({ slug: 'idli-rice' });
    const spotZero = await db.collection('products').findOne({ slug: 'rasam-powder' });
    console.log('verify — invalid stock docs:', bad);
    console.log('verify — bands:', JSON.stringify(band.map((b) => `${b._id}:${b.n}`)));
    console.log('spot idli-rice:', spotHigh?.stockBaseQty, '| spot rasam-powder:', spotZero?.stockBaseQty);
    if (bad > 0) throw new Error('verification failed: invalid stock values');
    console.log('\nSTOCK APPLIED');
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
