import { randomUUID } from 'node:crypto';
import type { Combo, Product, QuantityPrice, QuantizedCount } from '@bqm/types';
import { getCollections, getMongoClient } from './client.js';
import { buildMovementDocs, deltaBaseTotal } from './stock.js';

/** Reasons the admin console may write stock outside the order lifecycle. */
export const STOCK_ADJUST_REASONS = ['restock', 'manual-adjust', 'correction'] as const;
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
      throw new Error(`${what}[${i}]: price must be a non-negative number (paise)`);
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
    throw new Error('pricePerUnit must be a non-negative number (paise)');
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
      [{ productSlug: slug, deltaBaseQty: opening }],
      'create',
      undefined,
      now,
    )[0] as never);
  }
  return product;
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
      throw new Error('pricePerUnit must be a non-negative number (paise)');
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
  description?: string;
  isActive?: boolean;
  products?: Array<{ productSlug: string; name?: string; tamilName?: string; quantity: number | QuantizedCount[] }>;
  totalPrice?: number;
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
      throw new Error('totalPrice must be a non-negative number (paise)');
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
        const guards = delta
          .filter((q) => q.count < 0)
          .map((q) => ({ stock: { $elemMatch: { size: q.size, count: { $gte: -q.count } } } }));
        const inc: Record<string, number> = {};
        const arrayFilters: Array<Record<string, unknown>> = [];
        delta.forEach((q, idx) => {
          const key = `c${idx}`;
          inc[`stock.$[${key}].count`] = q.count;
          arrayFilters.push({ [`${key}.size`]: q.size });
        });
        const res = await products.updateOne(
          { slug, ...(guards.length > 0 ? { $and: guards } : {}) },
          { $inc: inc, $set: { updatedAt: now } },
          { ...opts, arrayFilters },
        );
        if (res.matchedCount === 0) throw new Error(`insufficient stock in packs for ${slug}`);
      } else {
        if (typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) {
          throw new Error('loose product needs a non-zero finite number delta (base units)');
        }
        const res = await products.updateOne(
          delta < 0 ? { slug, stock: { $gte: -delta } } : { slug },
          { $inc: { stock: delta }, $set: { updatedAt: now } },
          opts,
        );
        if (res.matchedCount === 0) throw new Error(`insufficient stock for ${slug}`);
      }
      await stockMovements.insertOne(
        buildMovementDocs([{ productSlug: slug, deltaBaseQty: deltaBaseTotal(delta) }], reason, undefined, now)[0] as never,
        opts,
      );
      const updated = await products.findOne({ slug }, opts);
      if (!updated) throw new Error(`product vanished after adjust: ${slug}`);
      result = updated;
    });
    if (!result) throw new Error('adjustStock: transaction produced no result');
    return result;
  } finally {
    await session.endSession();
  }
}
