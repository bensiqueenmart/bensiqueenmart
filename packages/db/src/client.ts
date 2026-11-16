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
  return {
    products: database.collection('products'),
    combos: database.collection('combos'),
    orders: database.collection('orders'),
    stockMovements: database.collection('stockMovements'),
  };
}
