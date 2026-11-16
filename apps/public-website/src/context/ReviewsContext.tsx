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
}

const REVIEWS_STORAGE_KEY = 'bensi_queen_reviews_v1';

// Initial sample reviews for preview (clearly flagged as sample content)
const DEFAULT_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    authorName: 'S. Lakshmi',
    location: 'Chitlapakkam, Chennai',
    reviewText:
      'The Toor Dal is genuinely unpolished and cooks into the most aromatic, authentic sambar. The 1kg pack is clean, well-sealed, and delivered promptly via WhatsApp.',
    rating: 5,
    reviewDate: 'October 2026',
    verifiedPurchase: true,
    isApproved: true,
    isSample: true, // Marked as sample until owner approves real reviews
  },
  {
    id: 'rev-2',
    authorName: 'Karthik R.',
    location: 'Tambaram Sanatorium',
    reviewText:
      'Very impressed with the Cashew Nuts (முந்திரி பருப்பு) and Almonds. Crisp, fresh, and large-sized without any breakage. Placing the order on WhatsApp took less than a minute.',
    rating: 5,
    reviewDate: 'October 2026',
    verifiedPurchase: true,
    isApproved: true,
    isSample: true,
  },
  {
    id: 'rev-3',
    authorName: 'Meenakshi Sundaram',
    location: 'Chromepet, Chennai',
    reviewText:
      'Ordered Idli Rice and cold-pressed Sesame Oil. The idlis turned out soft and fluffy. Having five pack sizes (100g to 1kg) is very practical for our joint family pantry.',
    rating: 5,
    reviewDate: 'September 2026',
    verifiedPurchase: true,
    isApproved: true,
    isSample: true,
  },
];

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

