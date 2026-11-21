/**
 * Website pack sizes seed — Nov 2026.
 *
 * Sets websitePackSizes ([100, 500, 1000] base units) on loose products
 * that have none configured, so the website (fixed-packs-only) can sell
 * them with per-pack availability.
 *
 * Idempotent: only touches loose products whose websitePackSizes is
 * missing or empty — never overwrites admin edits. Safe to re-run.
 *
 * Usage (read-only dry run first):
 *   ./node_modules/.bin/tsx packages/db/seeds/website-pack-sizes-nov-2026.ts
 *   ./node_modules/.bin/tsx packages/db/seeds/website-pack-sizes-nov-2026.ts --apply
 */
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config({ path: new URL('../../../.env', import.meta.url) });

/** Default website packs for loose products (base units — stockUnit is 'g'). */
const SIZES = [100, 500, 1000];

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

    const missing = [{ websitePackSizes: { $exists: false } }, { websitePackSizes: { $size: 0 } }];
    const targets = await db
      .collection('products')
      .find({ isQuantized: false, $or: missing })
      .project({ slug: 1 })
      .toArray();
    console.log(`loose products missing website sizes: ${targets.length}`);
    if (targets.length > 0) console.log(targets.map((d) => d.slug as string).join(', '));

    if (!apply) {
      console.log('dry run — no writes. Re-run with --apply to write.');
      return;
    }

    const timestamp = new Date().toISOString();
    let n = 0;
    for (const t of targets) {
      const r = await db
        .collection('products')
        .updateOne({ slug: t.slug }, { $set: { websitePackSizes: SIZES, updatedAt: timestamp } });
      n += r.modifiedCount;
    }
    console.log(`wrote: ${n} products`);

    const remaining = await db
      .collection('products')
      .countDocuments({ isQuantized: false, $or: missing });
    console.log('verify — loose products still without sizes:', remaining);
    if (remaining > 0) throw new Error('verification failed: sizes remain unset');
    console.log('\nWEBSITE PACK SIZES APPLIED');
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
