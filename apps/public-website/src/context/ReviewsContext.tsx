import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerReview } from '../types';

interface ReviewsContextType {
  reviews: CustomerReview[];
  activeReviews: CustomerReview[];
  addReview: (review: Omit<CustomerReview, 'id'>) => void;
  updateReview: (id: string, updated: Partial<CustomerReview>) => void;
  deleteReview: (id: string) => void;
  toggleApproval: (id: string) => void;
  resetToDefaultReviews: () => void;
  isOwnerModalOpen: boolean;
  setIsOwnerModalOpen: (open: boolean) => void;
}

const REVIEWS_STORAGE_KEY = 'bensi_queen_reviews_v1';

import { SEED_REVIEWS } from '../config/siteContent';

// Seed reviews — single source of truth is src/data/reviews.json (owner-editable).
const DEFAULT_REVIEWS: CustomerReview[] = SEED_REVIEWS.map((r) => ({ ...r, isSample: true }));

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load reviews from localStorage', e);
    }
    return DEFAULT_REVIEWS;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
      console.error('Failed to persist reviews to localStorage', e);
    }
  }, [reviews]);

  const addReview = (newReviewData: Omit<CustomerReview, 'id'>) => {
    const newRev: CustomerReview = {
      ...newReviewData,
      id: `rev-${Date.now()}`,
    };
    setReviews((prev) => [newRev, ...prev]);
  };

  const updateReview = (id: string, updated: Partial<CustomerReview>) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleApproval = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isApproved: !r.isApproved } : r))
    );
  };

  const resetToDefaultReviews = () => {
    setReviews(DEFAULT_REVIEWS);
  };

  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Only approved reviews are shown publicly to customers
  const activeReviews = reviews.filter((r) => r.isApproved);

  return (
    <ReviewsContext.Provider
      value={{
        reviews,
        activeReviews,
        addReview,
        updateReview,
        deleteReview,
        toggleApproval,
        resetToDefaultReviews,
        isOwnerModalOpen,
        setIsOwnerModalOpen,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  return context;
};

