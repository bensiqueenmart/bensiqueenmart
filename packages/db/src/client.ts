import { MongoClient, type Collection, type Db, type Document } from 'mongodb';
import type { Combo, Order, Product, StockMovement } from '@bqm/types';

/** Domain-typed collection handle (collections listed in er_diagram.md). */
export type CollectionOf<T> = Collection<T & Document>;

export interface BqmCollections {
  products: CollectionOf<Product>;
  combos: CollectionOf<Combo>;
  orders: CollectionOf<Order>;
  stockMovements: CollectionOf<StockMovement>;
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<username>')) {
    throw new Error('MONGODB_URI is missing or still a placeholder — fill in the root .env');
  }
  return uri;
}

export function getDbName(): string {
  return process.env.MONGODB_DB ?? 'bensi-queen-mart';
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(getMongoUri());
  await client.connect();
  cachedClient = client;
  return client;
}

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  cachedDb = (await getMongoClient()).db(getDbName());
  return cachedDb;
}

export async function getCollections(db?: Db): Promise<BqmCollections> {
  const database = db ?? (await getDb());
  const collections: BqmCollections = {
    products: database.collection('products'),
    combos: database.collection('combos'),
    orders: database.collection('orders'),
    stockMovements: database.collection('stockMovements'),
  };
  await ensureIndexes(collections);
  return collections;
};

// Indexes are created once per cold start; warm invocations skip via the
// cached promise. createIndex is idempotent, so concurrent cold starts racing
// here is harmless.
let indexesPromise: Promise<void> | null = null;

function ensureIndexes(collections: BqmCollections): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      // Orders tab + recent-orders peek both read newest-first.
      await collections.orders.createIndex({ createdAt: -1 });
      // Id is the behavioral join key everywhere; slug stays unique so the
      // live catalog can resolve wire (slug-keyed) input exactly once.
      await Promise.all([
        collections.products.createIndex({ id: 1 }, { unique: true }),
        collections.products.createIndex({ slug: 1 }, { unique: true }),
        collections.combos.createIndex({ id: 1 }, { unique: true }),
        collections.combos.createIndex({ slug: 1 }, { unique: true }),
        collections.orders.createIndex({ id: 1 }, { unique: true }),
        collections.stockMovements.createIndex({ id: 1 }, { unique: true }),
      ]);
    })().catch((err) => {
      indexesPromise = null;
      throw err;
    });
  }
  return indexesPromise;
}
