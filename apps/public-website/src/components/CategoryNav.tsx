import React from 'react';
import { ProductCategory } from '../types';
import { CATEGORIES } from '../data/products';

interface CategoryNavProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories" className="py-6 bg-white border-b border-[#B9E769]/30 sticky top-[72px] sm:top-[76px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 sm:hidden">
          <span className="text-xs font-semibold text-[#155B32] uppercase tracking-wider">
            Browse Categories
          </span>
          <span className="font-kavivanar text-xs text-[#155B32]">பிரிவுகள்</span>
        </div>

        {/* Scrollable category pills */}
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  const el = document.getElementById('products');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`flex-shrink-0 flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#155B32] text-white border-[#155B32] shadow-sm scale-105'
                    : 'bg-[#F4F9EC] text-[#155B32] border-[#B9E769]/50 hover:bg-[#B9E769]/30 hover:border-[#75D900]'
                }`}
              >
                <span>{cat.englishLabel}</span>
                <span
                  className={`font-mukta text-[11px] sm:text-xs hidden md:inline ${
                    isActive ? 'text-[#B9E769]' : 'text-gray-500'
                  }`}
                >
                  ({cat.tamilLabel})
                </span>
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#75D900] text-[#155B32]'
                      : 'bg-white text-[#155B32] border border-[#B9E769]/40'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

