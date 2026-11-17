import { randomUUID } from 'node:crypto';
import type { Combo, Product, QuantityPrice, QuantizedCount } from '@bqm/types';
import { getCollections, getMongoClient } from './client.js';
import { buildMovementDocs, deltaBaseTotal } from './stock.js';

/** Reasons the admin console may write stock outside the order lifecycle. */
export const STOCK_ADJUST_REASONS = ['restock', 'adjust'] as const;
export type StockAdjustReason = (typeof STOCK_ADJUST_REASONS)[number];

export interface CreateProductInput {
  slug: string;
  name: string;
  description?: string;
  category: string;
  isQuantized: boolean;
  stockUnit: string;
  stock: number | QuantizedCount[];
  pricePerUnit?: number;
  quantityPrice?: QuantityPrice[];
  tamilName?: string;
  image?: string;
}

function assertNonEmptyString(value: unknown, what: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${what} must be a non-empty string`);
  }
}

function assertValidStockShape(stock: unknown, isQuantized: boolean, what: string): asserts stock is number | QuantizedCount[] {
  if (isQuantized) {
    if (!Array.isArray(stock)) throw new Error(`${what}: quantized product needs a QuantizedCount array stock`);
    for (const [i, q] of (stock as QuantizedCount[]).entries()) {
      if (!Number.isInteger(q.size) || q.size <= 0 || !Number.isInteger(q.count) || q.count < 0) {
        throw new Error(`${what}[${i}]: size must be a positive integer and count a non-negative integer`);
      }
    }
    return;
  }
  if (typeof stock !== 'number' || !Number.isFinite(stock) || stock < 0) {
    throw new Error(`${what}: loose product needs a non-negative base-unit number stock`);
  }
}

function assertValidTiers(tiers: unknown, what: string): asserts tiers is QuantityPrice[] {
  if (!Array.isArray(tiers)) throw new Error(`${what} must be an array of { quantity, price }`);
  tiers.forEach((t, i) => {
    if (typeof t?.quantity !== 'number' || !Number.isFinite(t.quantity) || t.quantity <= 0) {
      throw new Error(`${what}[${i}]: quantity must be a positive number`);
    }
    if (typeof t?.price !== 'number' || !Number.isFinite(t.price) || t.price < 0) {
      throw new Error(`${what}[${i}]: price must be a non-negative number (rupees)`);
    }
  });
}

/**
 * Create a brand-new product. Slug must be unique. Non-zero opening stock
 * writes one `create` movement so the audit trail starts at the product's
 * birth — zero-stock products write no movement.
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  assertNonEmptyString(input.slug, 'slug');
  assertNonEmptyString(input.name, 'name');
  assertNonEmptyString(input.category, 'category');
  assertNonEmptyString(input.stockUnit, 'stockUnit');
  if (typeof input.isQuantized !== 'boolean') throw new Error('isQuantized must be a boolean');
  assertValidStockShape(input.stock, input.isQuantized, 'stock');
  if (input.description !== undefined && typeof input.description !== 'string') {
    throw new Error('description must be a string');
  }
  if (input.pricePerUnit !== undefined && (!Number.isFinite(input.pricePerUnit) || input.pricePerUnit < 0)) {
    throw new Error('pricePerUnit must be a non-negative number (rupees)');
  }
  if (input.quantityPrice !== undefined) assertValidTiers(input.quantityPrice, 'quantityPrice');
  if (input.tamilName !== undefined && typeof input.tamilName !== 'string') {
    throw new Error('tamilName must be a string');
  }
  if (input.image !== undefined && typeof input.image !== 'string') {
    throw new Error('image must be a string');
  }

  const { products, stockMovements } = await getCollections();
  const slug = input.slug.trim();
  if (await products.findOne({ slug })) {
    throw new Error(`product already exists: ${slug}`);
  }
  const now = new Date().toISOString();
  const product: Product = {
    id: randomUUID(),
    slug,
    name: input.name.trim(),
    ...(input.tamilName !== undefined ? { tamilName: input.tamilName } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    description: input.description ?? '',
    category: input.category.trim(),
    isQuantized: input.isQuantized,
    stockUnit: input.stockUnit.trim(),
    stock: input.stock,
    ...(input.pricePerUnit !== undefined ? { pricePerUnit: input.pricePerUnit } : {}),
    quantityPrice: input.quantityPrice ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await products.insertOne(product);
  const opening = deltaBaseTotal(input.stock);
  if (opening !== 0) {
    await stockMovements.insertOne(buildMovementDocs(
      [{ productId: product.id, productSlug: slug, deltaBaseQty: opening }],
      'create',
      undefined,
      now,
    )[0] as never);
  }
  return product;
}

/**
 * Hard-delete a product by slug. Refused while any combo references it
 * (by product id) — delete or edit the combo first. Orders and stock
 * movements keep their id-keyed history, so a later product reusing the
 * slug can never inherit the old rows.
 */
export async function deleteProduct(slug: string): Promise<{ deleted: true; slug: string }> {
  assertNonEmptyString(slug, 'slug');
  const { products, combos } = await getCollections();
  const existing = await products.findOne({ slug });
  if (!existing) throw new Error(`product not found: ${slug}`);
  const refs = await combos.countDocuments({ 'products.productId': existing.id });
  if (refs > 0) throw new Error(`cannot delete ${slug}: still used by ${refs} combo${refs === 1 ? '' : 's'}`);
  const res = await products.deleteOne({ id: existing.id });
  if (res.deletedCount === 0) throw new Error(`product vanished during delete: ${slug}`);
  return { deleted: true as const, slug };
}

export interface PatchProductInput {
  name?: string;
  tamilName?: string;
  image?: string;
  description?: string;
  category?: string;
  stockUnit?: string;
  pricePerUnit?: number;
  quantityPrice?: QuantityPrice[];
}

const PRODUCT_IMMUTABLE_KEYS = ['id', 'slug', 'stock', 'isQuantized', 'createdAt', 'updatedAt'] as const;

/**
 * Edit product display/pricing data. Stock is NOT patchable here — it moves
 * only via `adjustStock` or the order lifecycle. `isQuantized` is immutable
 * (shape changes need a stock migration, not an edit). Unknown keys throw.
 */
export async function patchProduct(slug: string, patch: PatchProductInput & Record<string, unknown>): Promise<Product> {
  for (const key of PRODUCT_IMMUTABLE_KEYS) {
    if (patch[key] !== undefined) {
      throw new Error(`${key} cannot be patched${key === 'stock' ? ' — use adjustStock' : ''}`);
    }
  }
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    assertNonEmptyString(patch.name, 'name');
    update.name = patch.name.trim();
  }
  if (patch.tamilName !== undefined) {
    if (typeof patch.tamilName !== 'string') throw new Error('tamilName must be a string');
    update.tamilName = patch.tamilName;
  }
  if (patch.image !== undefined) {
    if (typeof patch.image !== 'string') throw new Error('image must be a string');
    update.image = patch.image;
  }
  if (patch.description !== undefined) {
    if (typeof patch.description !== 'string') throw new Error('description must be a string');
    update.description = patch.description;
  }
  if (patch.category !== undefined) {
    assertNonEmptyString(patch.category, 'category');
    update.category = patch.category.trim();
  }
  if (patch.stockUnit !== undefined) {
    assertNonEmptyString(patch.stockUnit, 'stockUnit');
    update.stockUnit = patch.stockUnit.trim();
  }
  if (patch.pricePerUnit !== undefined) {
    if (!Number.isFinite(patch.pricePerUnit) || patch.pricePerUnit < 0) {
      throw new Error('pricePerUnit must be a non-negative number (rupees)');
    }
    update.pricePerUnit = patch.pricePerUnit;
  }
  if (patch.quantityPrice !== undefined) {
    assertValidTiers(patch.quantityPrice, 'quantityPrice');
    update.quantityPrice = patch.quantityPrice;
  }
  if (Object.keys(update).length === 0) throw new Error('patch is empty — nothing to update');

  const { products } = await getCollections();
  update.updatedAt = new Date().toISOString();
  const res = await products.findOneAndUpdate({ slug }, { $set: update }, { returnDocument: 'after' });
  if (!res) throw new Error(`product not found: ${slug}`);
  return res;
}

export interface PatchComboInput {
  name?: string;
  tamilName?: string;
  image?: string;
  description?: string;
  isActive?: boolean;
  products?: Array<{ productSlug: string; name?: string; tamilName?: string; quantity: number | QuantizedCount[] }>;
  totalPrice?: number;
}

export interface CreateComboInput {
  slug: string;
  name: string;
  tamilName?: string;
  image?: string;
  description?: string;
  isActive?: boolean;
  products: Array<{ productSlug: string; name?: string; tamilName?: string; quantity: number | QuantizedCount[] }>;
  totalPrice: number;
}

/**
 * Create a brand-new combo. Slug must be unique. Components are validated
 * against live products (shape must match each product's isQuantized).
 */
export async function createCombo(input: CreateComboInput): Promise<Combo> {
  assertNonEmptyString(input.slug, 'slug');
  assertNonEmptyString(input.name, 'name');
  if (typeof input.totalPrice !== 'number' || !Number.isFinite(input.totalPrice) || input.totalPrice < 0) {
    throw new Error('totalPrice must be a non-negative number (rupees)');
  }
  if (!Array.isArray(input.products) || input.products.length === 0) {
    throw new Error('products must be a non-empty component array');
  }
  if (input.description !== undefined && typeof input.description !== 'string') {
    throw new Error('description must be a string');
  }
  if (input.tamilName !== undefined && typeof input.tamilName !== 'string') {
    throw new Error('tamilName must be a string');
  }
  if (input.image !== undefined && typeof input.image !== 'string') {
    throw new Error('image must be a string');
  }
  if (input.isActive !== undefined && typeof input.isActive !== 'boolean') {
    throw new Error('isActive must be a boolean');
  }
  const { combos, products } = await getCollections();
  const slug = input.slug.trim();
  if (await combos.findOne({ slug })) {
    throw new Error(`combo already exists: ${slug}`);
  }
  const slugs = [...new Set(input.products.map((c) => c?.productSlug))];
  const docs = await products.find({ slug: { $in: slugs } }).toArray();
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  const components = input.products.map((comp, i) => {
    assertNonEmptyString(comp?.productSlug, `products[${i}].productSlug`);
    const doc = bySlug.get(comp.productSlug);
    if (!doc) throw new Error(`products[${i}]: unknown productSlug ${comp.productSlug}`);
    if (doc.isQuantized) {
      if (!Array.isArray(comp.quantity)) {
        throw new Error(`products[${i}]: quantized component needs a QuantizedCount array quantity`);
      }
      for (const [j, q] of (comp.quantity as QuantizedCount[]).entries()) {
        if (!Number.isInteger(q.size) || q.size <= 0 || !Number.isInteger(q.count) || q.count <= 0) {
          throw new Error(`products[${i}].quantity[${j}]: size and count must be positive integers`);
        }
      }
    } else if (typeof comp.quantity !== 'number' || !Number.isFinite(comp.quantity) || comp.quantity <= 0) {
      throw new Error(`products[${i}]: loose component needs a positive base-unit number quantity`);
    }
    return {
      productId: doc.id,
      productSlug: comp.productSlug,
      name: typeof comp.name === 'string' ? comp.name : doc.name,
      ...(typeof comp.tamilName === 'string' ? { tamilName: comp.tamilName } : {}),
      quantity: comp.quantity,
    };
  });
  const now = new Date().toISOString();
  const combo: Combo = {
    id: randomUUID(),
    slug,
    name: input.name.trim(),
    ...(input.tamilName !== undefined ? { tamilName: input.tamilName } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    description: input.description ?? '',
    isActive: input.isActive ?? true,
    products: components,
    totalPrice: input.totalPrice,
    createdAt: now,
    updatedAt: now,
  };
  await combos.insertOne(combo as never);
  return combo;
}

const COMBO_IMMUTABLE_KEYS = ['id', 'slug', 'createdAt', 'updatedAt'] as const;

/** Edit combo display data, components, price, or active flag. Unknown keys throw. */
export async function patchCombo(slug: string, patch: PatchComboInput & Record<string, unknown>): Promise<Combo> {
  for (const key of COMBO_IMMUTABLE_KEYS) {
    if (patch[key] !== undefined) throw new Error(`${key} cannot be patched`);
  }
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    assertNonEmptyString(patch.name, 'name');
    update.name = patch.name.trim();
  }
  if (patch.tamilName !== undefined) {
    if (typeof patch.tamilName !== 'string') throw new Error('tamilName must be a string');
    update.tamilName = patch.tamilName;
  }
  if (patch.image !== undefined) {
    if (typeof patch.image !== 'string') throw new Error('image must be a string');
    update.image = patch.image;
  }
  if (patch.description !== undefined) {
    if (typeof patch.description !== 'string') throw new Error('description must be a string');
    update.description = patch.description;
  }
  if (patch.isActive !== undefined) {
    if (typeof patch.isActive !== 'boolean') throw new Error('isActive must be a boolean');
    update.isActive = patch.isActive;
  }
  if (patch.totalPrice !== undefined) {
    if (!Number.isFinite(patch.totalPrice) || patch.totalPrice < 0) {
      throw new Error('totalPrice must be a non-negative number (rupees)');
    }
    update.totalPrice = patch.totalPrice;
  }
  if (patch.products !== undefined) {
    if (!Array.isArray(patch.products) || patch.products.length === 0) {
      throw new Error('products must be a non-empty component array');
    }
    const { products } = await getCollections();
    const slugs = [...new Set(patch.products.map((c) => c?.productSlug))];
    const docs = await products.find({ slug: { $in: slugs } }).toArray();
    const bySlug = new Map(docs.map((d) => [d.slug, d]));
    update.products = patch.products.map((comp, i) => {
      assertNonEmptyString(comp?.productSlug, `products[${i}].productSlug`);
      const doc = bySlug.get(comp.productSlug);
      if (!doc) throw new Error(`products[${i}]: unknown productSlug ${comp.productSlug}`);
      if (doc.isQuantized) {
        if (!Array.isArray(comp.quantity)) {
          throw new Error(`products[${i}]: quantized component needs a QuantizedCount array quantity`);
        }
        for (const [j, q] of (comp.quantity as QuantizedCount[]).entries()) {
          if (!Number.isInteger(q.size) || q.size <= 0 || !Number.isInteger(q.count) || q.count <= 0) {
            throw new Error(`products[${i}].quantity[${j}]: size and count must be positive integers`);
          }
        }
      } else if (typeof comp.quantity !== 'number' || !Number.isFinite(comp.quantity) || comp.quantity <= 0) {
        throw new Error(`products[${i}]: loose component needs a positive base-unit number quantity`);
      }
      return {
        productId: doc.id,
        productSlug: comp.productSlug,
        name: typeof comp.name === 'string' ? comp.name : doc.name,
        ...(typeof comp.tamilName === 'string' ? { tamilName: comp.tamilName } : {}),
        quantity: comp.quantity,
      };
    });
  }
  if (Object.keys(update).length === 0) throw new Error('patch is empty — nothing to update');

  const { combos } = await getCollections();
  update.updatedAt = new Date().toISOString();
  const res = await combos.findOneAndUpdate({ slug }, { $set: update }, { returnDocument: 'after' });
  if (!res) throw new Error(`combo not found: ${slug}`);
  return res;
}

/**
 * Single-product stock write for the admin console: restock / manual
 * correction outside the order lifecycle. Signed delta matching the
 * product's shape (negative = take out). Takes are oversell-guarded;
 * additions are unconditional. Always writes exactly one StockMovement.
 */
export async function adjustStock(slug: string, delta: number | QuantizedCount[], reason: string): Promise<Product> {
  if (!(STOCK_ADJUST_REASONS as readonly string[]).includes(reason)) {
    throw new Error(`invalid reason: ${reason} (expected ${STOCK_ADJUST_REASONS.join(' | ')})`);
  }
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    let result: Product | null = null;
    await session.withTransaction(async () => {
      const { products, stockMovements } = await getCollections();
      const opts = { session };
      const existing = await products.findOne({ slug }, opts);
      if (!existing) throw new Error(`product not found: ${slug}`);
      const pid = existing.id;
      const now = new Date().toISOString();

      if (existing.isQuantized) {
        if (!Array.isArray(delta) || delta.length === 0) {
          throw new Error('quantized product needs a non-empty QuantizedCount array delta');
        }
        for (const [i, q] of delta.entries()) {
          if (!Number.isInteger(q.size) || q.size <= 0 || !Number.isInteger(q.count) || q.count === 0) {
            throw new Error(`delta[${i}]: size must be a positive integer and count a non-zero integer`);
          }
        }
        // Merge duplicate sizes so each bucket is touched once.
        const merged = new Map<number, number>();
        for (const q of delta) merged.set(q.size, (merged.get(q.size) ?? 0) + q.count);
        const touched = [...merged.entries()]
          .filter(([, count]) => count !== 0)
          .map(([size, count]) => ({ size, count }));
        if (touched.length === 0) throw new Error('adjustStock: net delta is zero');
        const have = new Set((existing.stock as QuantizedCount[]).map((q) => q.size));
        const missing = touched.filter((t) => !have.has(t.size));
        const missingTake = missing.filter((t) => t.count < 0);
        if (missingTake.length > 0) {
          throw new Error(`insufficient stock in packs for ${slug} (no ${missingTake.map((t) => t.size).join(', ')} packs)`);
        }
        const present = touched.filter((t) => have.has(t.size));
        const guards = present
          .filter((t) => t.count < 0)
          .map((t) => ({ stock: { $elemMatch: { size: t.size, count: { $gte: -t.count } } } }));
        const update: {
          $inc?: Record<string, number>;
          $set: Record<string, unknown>;
          $push?: { stock: { $each: Array<{ size: number; count: number }> } };
        } = { $set: { updatedAt: now } };
        const arrayFilters: Array<Record<string, unknown>> = [];
        present.forEach((t, idx) => {
          const key = `c${idx}`;
          (update.$inc ??= {})[`stock.$[${key}].count`] = t.count;
          arrayFilters.push({ [`${key}.size`]: t.size });
        });
        // New sizes arrive as brand-new buckets; an existing size in the delta
        // merges into its bucket via $inc above. Takes on missing sizes threw above.
        if (missing.length > 0) {
          update.$push = { stock: { $each: missing.map((t) => ({ size: t.size, count: t.count })) } };
        }
        const res = await products.updateOne(
          { id: pid, ...(guards.length > 0 ? { $and: guards } : {}) },
          update as never,
          { ...opts, arrayFilters },
        );
        if (res.matchedCount === 0) throw new Error(`insufficient stock in packs for ${slug}`);
      } else {
        if (typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) {
          throw new Error('loose product needs a non-zero finite number delta (base units)');
        }
        const res = await products.updateOne(
          delta < 0 ? { id: pid, stock: { $gte: -delta } } : { id: pid },
          { $inc: { stock: delta }, $set: { updatedAt: now } },
          opts,
        );
        if (res.matchedCount === 0) throw new Error(`insufficient stock for ${slug}`);
      }
      await stockMovements.insertOne(
        buildMovementDocs([{ productId: pid, productSlug: slug, deltaBaseQty: deltaBaseTotal(delta) }], reason, undefined, now)[0] as never,
        opts,
      );
      const updated = await products.findOne({ id: pid }, opts);
      if (!updated) throw new Error(`product vanished after adjust: ${slug}`);
      result = updated;
    });
    if (!result) throw new Error('adjustStock: transaction produced no result');
    return result;
  } finally {
    await session.endSession();
  }
}
