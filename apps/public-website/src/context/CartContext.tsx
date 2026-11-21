import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PublicCombo, PublicProduct } from '@bqm/types';
import type { CartItem } from '../types';

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: PublicProduct, weight: string, quantity?: number) => void;
  addComboToCart: (combo: PublicCombo, includedText?: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateWeight: (itemId: string, newWeight: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalProductsCount: number;
  totalPackagesCount: number;
  toastMessage: string | null;
  closeToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bensi_queen_cart_v2';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart to localStorage', e);
    }
  }, [items]);

  // Auto-hide toast notification after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const closeToast = () => setToastMessage(null);

  const addToCart = (product: PublicProduct, weight: string, quantity: number = 1) => {
    const itemId = `${product.id}-${weight}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === itemId);
      if (existingIndex > -1) {
        // Increment quantity of existing item
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        // Add new separate entry for this specific weight
        const newItem: CartItem = {
          id: itemId,
          productId: product.id,
          englishName: product.name,
          tamilName: product.tamilName ?? '',
          categoryName: product.category,
          image: product.image ?? '',
          weight,
          quantity,
        };
        return [...prevItems, newItem];
      }
    });

    setToastMessage(`Added ${product.name} (${weight}) to your cart.`);
  };

  /**
   * Adds a combo deal as a single item to the cart.
   * All included products are preserved in `comboIncludedText` to display below the title.
   * Multiple combos can be added and adjusted cleanly.
   */
  const addComboToCart = (combo: PublicCombo, includedText?: string) => {
    const itemId = `combo-${combo.id}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.id === itemId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      } else {
        const newComboItem: CartItem = {
          id: itemId,
          productId: combo.id,
          englishName: combo.name,
          tamilName: combo.tamilName ?? '',
          categoryName: 'Special Combo',
          image: combo.image ?? '',
          weight: 'Combo Pack',
          quantity: 1,
          isCombo: true,
          comboName: combo.name,
          comboId: combo.id,
          comboIncludedText: includedText ?? '',
        };
        return [...prevItems, newComboItem];
      }
    });

    setToastMessage(`Added "${combo.name}" to your cart!`);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const updateWeight = (itemId: string, newWeight: string) => {
    setItems((prev) => {
      const currentItem = prev.find((item) => item.id === itemId);
      if (!currentItem) return prev;

      // If it's a fixed combo, weight cannot be changed
      if (currentItem.isCombo) return prev;

      const newId = `${currentItem.productId}-${newWeight}`;
      const existingNewWeightItem = prev.find((item) => item.id === newId);

      if (existingNewWeightItem && existingNewWeightItem.id !== itemId) {
        return prev
          .filter((item) => item.id !== itemId)
          .map((item) =>
            item.id === newId
              ? { ...item, quantity: item.quantity + currentItem.quantity }
              : item
          );
      } else {
        return prev.map((item) =>
          item.id === itemId
            ? { ...item, id: newId, weight: newWeight }
            : item
        );
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalProductsCount = items.length;
  const totalPackagesCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addComboToCart,
        updateQuantity,
        updateWeight,
        removeFromCart,
        clearCart,
        totalProductsCount,
        totalPackagesCount,
        toastMessage,
        closeToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
