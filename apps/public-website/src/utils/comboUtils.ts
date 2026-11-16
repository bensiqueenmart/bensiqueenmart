import { ComboOffer, Product } from '../types';
import { ALL_PRODUCTS } from '../data/products';
import { WeightOption } from '../config/storeConfig';

export interface ResolvedComboItem {
  product: Product;
  weight: WeightOption;
  quantity: number;
  label?: string;
}

/**
 * Resolves the individual grocery products included in a combo offer.
 * First checks explicit `offer.includedItems`.
 * If not present, intelligently resolves based on offer title and description.
 */
export function resolveComboItems(offer: ComboOffer): ResolvedComboItem[] {
  // 1. Explicit includedItems if defined
  if (offer.includedItems && offer.includedItems.length > 0) {
    const list: ResolvedComboItem[] = [];
    for (const item of offer.includedItems) {
      const product = ALL_PRODUCTS.find((p: Product) => p.id === item.productId);
      if (product) {
        list.push({
          product,
          weight: item.weight,
          quantity: item.quantity || 1,
          label: item.label,
        });
      }
    }
    if (list.length > 0) return list;
  }

  // 2. Fallback heuristics based on title and description
  const t = (offer.title + ' ' + offer.description).toLowerCase();

  // Spices & Masala Bundles
  if (t.includes('spice') || t.includes('masala')) {
    const turmeric = ALL_PRODUCTS.find((p: Product) => p.id === 'turmeric-powder');
    const chilli = ALL_PRODUCTS.find((p: Product) => p.id === 'chilli-powder');
    const coriander = ALL_PRODUCTS.find((p: Product) => p.id === 'coriander-powder');
    const pepper =
      ALL_PRODUCTS.find((p: Product) => p.id === 'black-pepper') ||
      ALL_PRODUCTS.find((p: Product) => p.id === 'pepper-powder');

    const res: ResolvedComboItem[] = [];
    if (turmeric) res.push({ product: turmeric, weight: '200g', quantity: 1, label: 'Turmeric (200g)' });
    if (chilli) res.push({ product: chilli, weight: '200g', quantity: 1, label: 'Red Chilli (200g)' });
    if (coriander) res.push({ product: coriander, weight: '200g', quantity: 1, label: 'Coriander (200g)' });
    if (pepper) res.push({ product: pepper, weight: '100g', quantity: 1, label: 'Malabar Pepper (100g)' });
    return res;
  }

  // Dry Fruits & Whole Nuts Pantry Bundle
  if (t.includes('dry fruit') || (t.includes('nut') && (t.includes('bundle') || t.includes('pantry')))) {
    const cashew = ALL_PRODUCTS.find((p: Product) => p.id === 'cashew-nuts');
    const almond = ALL_PRODUCTS.find((p: Product) => p.id === 'almonds');
    const raisins = ALL_PRODUCTS.find((p: Product) => p.id === 'dry-black-grapes');

    const res: ResolvedComboItem[] = [];
    if (cashew) res.push({ product: cashew, weight: '500g', quantity: 1, label: 'Grade-W240 Cashews (500g)' });
    if (almond) res.push({ product: almond, weight: '500g', quantity: 1, label: 'California Almonds (500g)' });
    if (raisins) res.push({ product: raisins, weight: '500g', quantity: 1, label: 'Sun-Dried Raisins (500g)' });
    return res;
  }

  // 10% Savings on Whole Nuts
  if (t.includes('10%') && t.includes('nut')) {
    const almond = ALL_PRODUCTS.find((p: Product) => p.id === 'almonds');
    const cashew = ALL_PRODUCTS.find((p: Product) => p.id === 'cashew-nuts');

    const res: ResolvedComboItem[] = [];
    if (almond) res.push({ product: almond, weight: '1kg', quantity: 1, label: 'California Almonds (1kg)' });
    if (cashew) res.push({ product: cashew, weight: '1kg', quantity: 1, label: 'Whole Cashew Nuts (1kg)' });
    return res;
  }

  // Breakfast / Idli Rice Specials
  if (t.includes('rice') || t.includes('breakfast') || t.includes('idli')) {
    const rice = ALL_PRODUCTS.find((p: Product) => p.id === 'idli-rice');
    const rava = ALL_PRODUCTS.find((p: Product) => p.id === 'rava-sooji');

    const res: ResolvedComboItem[] = [];
    if (rice) res.push({ product: rice, weight: '1kg', quantity: 1, label: 'Idli Rice (1kg)' });
    if (rava) res.push({ product: rava, weight: '200g', quantity: 1, label: 'Roasted Rava / Sooji (200g)' });
    return res;
  }

  // Pulses / Dal Bundles
  if (t.includes('dal') || t.includes('pulse')) {
    const toor = ALL_PRODUCTS.find((p: Product) => p.id === 'toor-dal');
    const urad = ALL_PRODUCTS.find((p: Product) => p.id === 'urad-dal');
    const moong = ALL_PRODUCTS.find((p: Product) => p.id === 'moong-dal');

    const res: ResolvedComboItem[] = [];
    if (toor) res.push({ product: toor, weight: '500g', quantity: 1, label: 'Unpolished Toor Dal (500g)' });
    if (urad) res.push({ product: urad, weight: '500g', quantity: 1, label: 'Premium Urad Dal (500g)' });
    if (moong) res.push({ product: moong, weight: '500g', quantity: 1, label: 'Hand-Cleaned Moong (500g)' });
    return res;
  }

  return [];
}
