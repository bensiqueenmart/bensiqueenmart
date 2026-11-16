import React, { createContext, useContext, useState, useEffect } from 'react';
import { ComboOffer, OfferStatus } from '../types';
import { resolveComboItems } from '../utils/comboUtils';

interface OffersContextType {
  offers: ComboOffer[];
  activeOffers: ComboOffer[];
  draftOffers: ComboOffer[];
  expiredOffers: ComboOffer[];
  addOffer: (offer: Omit<ComboOffer, 'id' | 'createdAt'>) => void;
  updateOffer: (id: string, updated: Partial<ComboOffer>) => void;
  deleteOffer: (id: string) => void;
  setOfferStatus: (id: string, status: OfferStatus) => void;
  isOwnerModalOpen: boolean;
  setIsOwnerModalOpen: (open: boolean) => void;
  resetToDefaults: () => void;
}

const OFFERS_STORAGE_KEY = 'bensi_queen_offers_v7';

// Check if an offer is currently valid (active status and endDate >= today if set)
export const isOfferValid = (offer: ComboOffer): boolean => {
  if (offer.status !== 'active') return false;
  if (!offer.endDate) return true;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    return offer.endDate >= today;
  } catch (e) {
    return true;
  }
};

const DEFAULT_OFFERS: ComboOffer[] = [
  {
    id: 'offer-1',
    comboNumber: 1,
    comboName: 'Combo 1',
    title: 'Combo 1: Dry Fruits & Whole Nuts Pantry Bundle',
    description: 'A curated household bundle featuring 500g Grade-W240 Cashews, 500g California Almonds, and 500g Sun-Dried Black Raisins packed fresh in food-grade pouches.',
    offerType: 'fixed_combo',
    discountLabel: 'COMBO SAVINGS',
    image: '/images/combo-dry-fruits.jpg',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    validUntil: 'Valid through 31 Dec 2026',
    termsAndConditions: 'Packed in sealed food-grade pouches. Subject to seasonal harvest availability in Chitlapakkam.',
    ctaText: 'Order Combo on WhatsApp',
    status: 'active',
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    includedSummary: 'Grade-W240 Cashews (500g), California Almonds (500g), Sun-Dried Raisins (500g)',
    includedItems: [
      { productId: 'cashew-nuts', weight: '500g', quantity: 1, label: 'Grade-W240 Cashews (500g)' },
      { productId: 'almonds', weight: '500g', quantity: 1, label: 'California Almonds (500g)' },
      { productId: 'dry-black-grapes', weight: '500g', quantity: 1, label: 'Sun-Dried Black Raisins (500g)' },
    ],
  },
  {
    id: 'offer-2',
    comboNumber: 2,
    comboName: 'Combo 2',
    title: 'Combo 2: Essential South Indian Kitchen Spice Pack',
    description: 'A complete spice rack replenishment containing Turmeric Powder (200g), Chilli Powder (200g), Coriander Powder (200g), and Malabar Black Pepper (100g).',
    offerType: 'fixed_combo',
    discountLabel: 'SPICE PACK',
    image: '/images/combo-spices.jpg',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    validUntil: 'Valid through 31 Dec 2026',
    termsAndConditions: 'All powders are 100% pure stone-milled with no artificial dyes or preservatives.',
    ctaText: 'Inquire via WhatsApp',
    status: 'active',
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    includedSummary: 'Turmeric Powder (200g), Chilli Powder (200g), Coriander Powder (200g), Malabar Black Pepper (100g)',
    includedItems: [
      { productId: 'turmeric-powder', weight: '200g', quantity: 1, label: 'Turmeric Powder (200g)' },
      { productId: 'chilli-powder', weight: '200g', quantity: 1, label: 'Chilli Powder (200g)' },
      { productId: 'coriander-powder', weight: '200g', quantity: 1, label: 'Coriander Powder (200g)' },
      { productId: 'black-pepper', weight: '100g', quantity: 1, label: 'Malabar Black Pepper (100g)' },
    ],
  },
  {
    id: 'offer-3',
    comboNumber: 3,
    comboName: 'Combo 3',
    title: 'Combo 3: Whole Nuts Value Pack (10% OFF)',
    description: 'Special neighborhood promotional discount applied when ordering any 1kg pack of California Almonds or Jumbo Whole Cashews.',
    offerType: 'percentage_discount',
    discountPercentage: 10,
    discountLabel: '10% DISCOUNT',
    image: '/images/combo-nuts.jpg',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    validUntil: 'Valid through 31 Dec 2026',
    termsAndConditions: 'Discount is automatically calculated and confirmed in your WhatsApp order chat.',
    ctaText: 'Claim 10% Savings',
    status: 'active',
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    includedSummary: 'California Almonds (1kg), Jumbo Whole Cashews (1kg)',
    includedItems: [
      { productId: 'almonds', weight: '1kg', quantity: 1, label: 'California Almonds (1kg)' },
      { productId: 'cashew-nuts', weight: '1kg', quantity: 1, label: 'Jumbo Whole Cashews (1kg)' },
    ],
  },
  {
    id: 'offer-4',
    comboNumber: 4,
    comboName: 'Combo 4',
    title: 'Combo 4: Weekend Breakfast Special (BOGO)',
    description: 'Order 1kg Idli Rice and receive a complimentary 200g pack of roasted Rava / Sooji for your weekend breakfast upma or kesari.',
    offerType: 'bogo',
    discountLabel: 'BUY 1 GET 1',
    image: '/images/combo-pulses.jpg',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    validUntil: 'Valid through 31 Dec 2026',
    termsAndConditions: 'One complimentary pack per household order while supplies last in Chitlapakkam.',
    ctaText: 'Claim Breakfast Special',
    status: 'active',
    isActive: true,
    featured: false,
    createdAt: new Date().toISOString(),
    includedSummary: 'Idli Rice (1kg), Roasted Rava / Sooji (200g)',
    includedItems: [
      { productId: 'idli-rice', weight: '1kg', quantity: 1, label: 'Idli Rice (1kg)' },
      { productId: 'rava-sooji', weight: '200g', quantity: 1, label: 'Roasted Rava / Sooji (200g)' },
    ],
  },
];

const OffersContext = createContext<OffersContextType | undefined>(undefined);

export const OffersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [offers, setOffers] = useState<ComboOffer[]>(() => {
    try {
      const saved = localStorage.getItem(OFFERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure each offer has proper combo number, clean local image, and included items
          return parsed.map((o: ComboOffer, idx: number) => {
            const num = o.comboNumber || idx + 1;
            const name = o.comboName || `Combo ${num}`;
            let img = o.image;
            if (!img || img.includes('unsplash') || img.startsWith('http')) {
              img = num === 1
                ? '/images/combo-dry-fruits.jpg'
                : num === 2
                ? '/images/combo-spices.jpg'
                : num === 3
                ? '/images/combo-nuts.jpg'
                : '/images/combo-pulses.jpg';
            }
            let title = o.title;
            if (!title.toLowerCase().startsWith('combo')) {
              title = `${name}: ${title}`;
            }

            let includedItems = o.includedItems;
            if (!includedItems || includedItems.length === 0) {
              const resolved = resolveComboItems(o);
              if (resolved.length > 0) {
                includedItems = resolved.map((r) => ({
                  productId: r.product.id,
                  weight: r.weight,
                  quantity: r.quantity,
                  label: r.label,
                }));
              }
            }

            return {
              ...o,
              comboNumber: num,
              comboName: name,
              title,
              image: img,
              includedItems,
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse saved offers from localStorage', e);
    }
    return DEFAULT_OFFERS;
  });

  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Sync to localStorage whenever offers change
  useEffect(() => {
    try {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
    } catch (e) {
      console.error('Failed to persist offers to localStorage', e);
    }
  }, [offers]);

  const addOffer = (offerData: Omit<ComboOffer, 'id' | 'createdAt'>) => {
    const newOffer: ComboOffer = {
      ...offerData,
      id: `offer-${Date.now()}`,
      isActive: offerData.status === 'active',
      createdAt: new Date().toISOString(),
    };
    setOffers((prev) => [newOffer, ...prev]);
  };

  const updateOffer = (id: string, updated: Partial<ComboOffer>) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const nextStatus = updated.status ?? o.status;
          return {
            ...o,
            ...updated,
            isActive: nextStatus === 'active',
          };
        }
        return o;
      })
    );
  };

  const setOfferStatus = (id: string, status: OfferStatus) => {
    updateOffer(id, { status, isActive: status === 'active' });
  };

  const deleteOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const resetToDefaults = () => {
    setOffers(DEFAULT_OFFERS);
  };

  const today = new Date().toISOString().split('T')[0];

  // Active offers: must be 'active' and not past endDate
  const activeOffers = offers.filter((o) => isOfferValid(o));

  // Draft offers: status === 'draft'
  const draftOffers = offers.filter((o) => o.status === 'draft');

  // Expired offers: status was active but endDate is in the past
  const expiredOffers = offers.filter((o) => o.endDate && o.endDate < today);

  return (
    <OffersContext.Provider
      value={{
        offers,
        activeOffers,
        draftOffers,
        expiredOffers,
        addOffer,
        updateOffer,
        deleteOffer,
        setOfferStatus,
        isOwnerModalOpen,
        setIsOwnerModalOpen,
        resetToDefaults,
      }}
    >
      {children}
    </OffersContext.Provider>
  );
};

export const useOffers = () => {
  const context = useContext(OffersContext);
  if (!context) {
    throw new Error('useOffers must be used within an OffersProvider');
  }
  return context;
};
