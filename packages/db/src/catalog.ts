import { getCollections } from './client.js';

/**
 * Whole-catalog read for the billing desk: all products + all combos in two
 * parallel queries (one per collection). Search/filter happens in the UI on
 * this payload; refresh button re-fetches. Hundreds of docs, not millions.
 */
export async function listCatalog() {
  const { products, combos } = await getCollections();
  const [productDocs, comboDocs] = await Promise.all([
    products.find({}).toArray(),
    combos.find({}).toArray(),
  ]);
  return { products: productDocs, combos: comboDocs };
}
