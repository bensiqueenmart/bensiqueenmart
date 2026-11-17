import React from 'react';
import type { PublicProduct } from '@bqm/types';
import { ProductCard } from './ProductCard';
import { useCatalog } from '../context/CatalogContext';
import { Search, X, PackageOpen, Loader2 } from 'lucide-react';

interface ProductListProps {
  selectedCategory: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onResetFilters: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  selectedCategory,
  searchQuery,
  setSearchQuery,
  onResetFilters,
}) => {
  const { products, categories, loading, error, retry } = useCatalog();

  if (loading) {
    return (
      <section id="products" className="py-12 bg-[#F7F5E8] min-h-[600px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-24 text-[#205C38]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="font-poppins text-sm font-semibold">Loading fresh provisions…</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="products" className="py-12 bg-[#F7F5E8] min-h-[600px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8DFC8] max-w-lg mx-auto my-12">
            <h3 className="font-playfair text-xl font-bold text-[#123B26]">Couldn&apos;t load the catalogue</h3>
            <p className="text-xs text-gray-500 mt-2 font-poppins">{error}</p>
            <button
              onClick={retry}
              className="mt-6 inline-flex items-center px-5 py-2.5 rounded-full bg-[#123B26] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#205C38] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  const filteredProducts = products.filter((product: PublicProduct) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      (product.tamilName ?? '').includes(q) ||
      product.category.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const activeCategoryInfo = categories.find((c) => c.id === selectedCategory);

  return (
    <section id="products" className="py-12 bg-[#F7F5E8] min-h-[600px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#DCE8C8] gap-4">
          <div>
            <div className="inline-block bg-[#DCE8C8] text-[#123B26] text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full mb-2">
              Bensi Queen Catalogue
            </div>
            <h2 className="font-playfair text-2xl sm:text-4xl font-bold text-[#123B26]">
              Our Fresh Grocery Products
            </h2>
            <p className="font-poppins text-xs sm:text-sm text-gray-600 mt-1">
              {activeCategoryInfo?.englishLabel}
            </p>
          </div>

          <div className="w-full md:w-80 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search pulses, spices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#DCE8C8] rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#205C38]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 text-right">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#DCE8C8] shadow-soft max-w-lg mx-auto my-12">
            <PackageOpen className="w-16 h-16 text-gray-400 mx-auto mb-4 stroke-1" />
            <h3 className="font-playfair text-xl font-bold text-[#123B26]">
              No Products Found
            </h3>
            <p className="text-xs text-gray-500 mt-2 font-poppins">
              We couldn&apos;t find any products matching &quot;{searchQuery}&quot; in{' '}
              {activeCategoryInfo?.englishLabel}.
            </p>
            <button
              onClick={onResetFilters}
              className="mt-6 inline-flex items-center px-5 py-2.5 rounded-full bg-[#123B26] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#205C38] transition-colors"
            >
              Reset Filters & View All
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
