import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductCategory } from '../types';
import {
  Search,
  X,
  PackageOpen,
  Filter,
  Sparkles,
  Grid3X3,
  List,
  ArrowUpDown,
  Flame,
  ShieldCheck,
  Truck,
  Clock,
  MessageSquare,
  Leaf,
  CheckCircle2,
  Tag,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { STORE_CONFIG } from '../config/storeConfig';
import { useCatalog } from '../context/CatalogContext';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') as ProductCategory) || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { products, categories, combos, loading } = useCatalog();
  const QUICK_SEARCH_TAGS = products.slice(0, 6).map((p) => p.name);
  const activeOffersCount = combos.filter((c) => c.available).length;

  useEffect(() => {
    const cat = (searchParams.get('category') as ProductCategory) || 'all';
    const s = searchParams.get('search') || '';
    setSelectedCategory(cat);
    setSearchQuery(s);
  }, [searchParams]);

  const handleCategorySelect = (category: ProductCategory) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('search', val.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSearchParams({});
  };

  // Filter products (availability badges live on the card; no featured/popular tags)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.tamilName ?? '').includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const activeCategoryInfo = categories.find((c) => c.id === selectedCategory);
  const pageTitle =
    selectedCategory === 'all'
      ? 'All Grocery Products & Kitchen Provisions | Bensi Queen'
      : `${activeCategoryInfo?.englishLabel || 'Products'} (${activeCategoryInfo?.tamilLabel || ''}) | Bensi Queen`;
  const pageDescription =
    'Browse the full Bensi Queen groceries catalogue. Pulses, whole spices, rice, cold-pressed oils, and premium dry fruits in Chitlapakkam, Chennai.';

  const handleWhatsAppCustomList = () => {
    const text = `Hello Bensi Queen, I would like to place an order with my custom grocery list. Please let me know how to share my list or send a photo of it.`;
    const url = `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' || searchQuery.trim() !== '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5E8] flex items-center justify-center text-[#205C38] font-poppins text-sm">
        Loading catalogue…
      </div>
    );
  }

  return (
    <div className="bg-[#F7F5E8] min-h-screen text-[#123B26]">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`https://bensiqueen.com/products${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`}
        keywords="shop pulses online, unpolished toor dal, stone milled spices, cashew nuts W240, California almonds, idli rice, groceries chitlapakkam, grocery delivery tambaram, chromepet grocery"
        image="https://bensiqueen.com/images/Products_Cover.jpg"
        imageAlt="Bensi Queen Grocery Provisions Collection in Chitlapakkam"
      />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §1  ATMOSPHERIC SHOP HERO                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-[#0D2B1B] via-[#123B26] to-[#1B4D31] text-white overflow-hidden py-12 sm:py-16 lg:py-20 border-b border-[#205C38]">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-[#A8C66C]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-[#205C38]/30 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left 7 Columns — Hero Text & Highlights */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">

              {/* Store Catalogue Pill */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-[#A8C66C]/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#A8C66C]">
                <Leaf className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>Bensi Queen Pantry</span>
                <span className="text-white/40">•</span>
                <span className="text-white font-extrabold">{products.length} Quality Provisions</span>
              </div>

              {/* Dynamic Headline */}
              <div>
                <h1 className="font-playfair text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                  {selectedCategory === 'all' ? (
                    <>Fresh Daily Provisions, <span className="text-[#A8C66C]">Pure Quality.</span></>
                  ) : (
                    <>{activeCategoryInfo?.englishLabel}</>
                  )}
                </h1>
                <p className="font-mukta text-lg sm:text-2xl text-[#F2C94C] font-semibold mt-1">
                  {selectedCategory === 'all'
                    ? 'தூய தரமான அன்றாட சமையல் மளிகைப் பொருட்கள்'
                    : activeCategoryInfo?.tamilLabel}
                </p>
              </div>

              {/* Description */}
              <p className="font-poppins text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {'Handpicked unpolished pulses, cold-pressed oils, stone-milled spices, and whole dry fruits. Pick custom weights from 100g to 1kg and enjoy doorstep delivery in Chitlapakkam with zero prepayment.'}
              </p>

              {/* Mini Trust Highlights */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs font-semibold text-white/90">
                <span className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10 shadow-xs">
                  <Truck className="w-3.5 h-3.5 text-[#A8C66C]" />
                  <span>30–45 Mins Local Dispatch</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A8C66C]" />
                  <span>100% Unpolished & Pure</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10 shadow-xs">
                  <Tag className="w-3.5 h-3.5 text-[#A8C66C]" />
                  <span>100g to 1kg Custom Packs</span>
                </span>
              </div>

            </div>

            {/* Right 5 Columns — Showcase Framed Image with Floating Badges */}
            <div className="lg:col-span-5 relative flex items-center justify-center">

              {/* Outer Decorative Gradient Ring */}
              <div className="absolute w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full bg-gradient-to-tr from-[#A8C66C]/20 to-transparent border border-[#A8C66C]/30 -z-0 pointer-events-none animate-pulse" />

              {/* Centerpiece Image Frame with Glass Edge */}
              <div className="relative z-10 w-full max-w-[420px] h-72 sm:h-88 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl shadow-black/50 bg-[#123B26]/60 backdrop-blur-md group">
                <img
                  src={
                    activeCategoryInfo?.image ||
                    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=85'
                  }
                  alt={activeCategoryInfo?.englishLabel || 'Bensi Queen fresh grocery provisions'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A2318]/75 via-transparent to-transparent pointer-events-none" />

                {/* Floating Badge Top Left */}
                <div className="absolute top-4 left-4 bg-[#123B26]/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-[#A8C66C]/40 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
                  <span>{selectedCategory === 'all' ? '100% Pure Pantry' : activeCategoryInfo?.englishLabel}</span>
                </div>

                {/* Floating Badge Bottom Right */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-[#123B26] text-[11px] font-black px-3.5 py-1.5 rounded-full shadow-lg border border-[#DCE8C8] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#205C38]" />
                  <span>Fresh Batches Daily</span>
                </div>

                {/* Floating Badge Bottom Left */}
                <div className="absolute bottom-4 left-4 bg-[#F2C94C] text-[#123B26] text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider flex items-center space-x-1">
                  <span>★ 4.9 Verified</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §2  VISUAL CATEGORY SHOWCASE BAR                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-[#E8DFC8] py-4 sm:py-5 shadow-xs sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex-shrink-0 flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl transition-all duration-200 text-left border ${
                    isActive
                      ? 'bg-[#123B26] text-white border-[#123B26] shadow-md scale-102 ring-2 ring-[#A8C66C]/40'
                      : 'bg-[#FCFAF5] text-[#123B26] border-[#E8DFC8] hover:border-[#205C38]/50 hover:bg-[#F7F5E8]'
                  }`}
                >
                  {cat.image ? (
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-black/10 flex-shrink-0 flex items-center justify-center p-0.5">
                      <img
                        src={cat.image}
                        alt={cat.englishLabel}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#DCE8C8] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-[#205C38]" />
                    </div>
                  )}

                  <div className="min-w-0 pr-1">
                    <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-[#123B26]'}`}>
                      {cat.englishLabel}
                    </p>
                    {cat.tamilLabel && (
                      <p className={`font-mukta text-[10px] leading-none mt-0.5 truncate ${isActive ? 'text-[#A8C66C]' : 'text-[#205C38]'}`}>
                        {cat.tamilLabel}
                      </p>
                    )}
                  </div>

                  {cat.count !== undefined && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-[#A8C66C] text-[#123B26]' : 'bg-[#DCE8C8] text-[#123B26]'
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §3  MAIN SHOP WORKSPACE & TOOLBAR                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">

        {/* Active Combo Deals Teaser Banner (if active) */}
        {activeOffersCount > 0 && (
          <div className="bg-gradient-to-r from-[#123B26] to-[#205C38] rounded-2xl p-4 sm:p-5 text-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#A8C66C]/40">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F2C94C] text-[#123B26] flex items-center justify-center flex-shrink-0 font-black">
                <Flame className="w-5 h-5 text-[#123B26]" />
              </div>
              <div>
                <p className="font-poppins text-sm font-bold leading-snug">
                  Special Savings Available: {activeOffersCount} Active Combo Deals Today!
                </p>
                <p className="text-xs text-white/80">
                  Save 10%–15% on pantry essentials and monthly grocery packs via WhatsApp.
                </p>
              </div>
            </div>

            <Link
              to="/offers"
              className="inline-flex items-center space-x-2 bg-[#F2C94C] hover:bg-[#e0b83e] text-[#123B26] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm flex-shrink-0"
            >
              <span>View Combo Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Filter & Search Control Hub (White Card) */}
        <div className="bg-white rounded-3xl border border-[#E8DFC8] p-5 sm:p-6 shadow-sm space-y-4">

          {/* Row 1: Search Input + Sort Dropdown + View Toggle */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search provisions: Toor Dal, Urad Dal, Sambar Powder, Sesame Oil..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-[#FCFAF5] border border-[#E8DFC8] focus:border-[#123B26] focus:bg-white rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C66C]/30 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Switcher (Grid vs List) */}
              <div className="flex items-center border border-[#E8DFC8] rounded-2xl bg-[#FCFAF5] p-1 space-x-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-xl transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#123B26] text-white shadow-xs'
                      : 'text-gray-400 hover:text-[#123B26]'
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-xl transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#123B26] text-white shadow-xs'
                      : 'text-gray-400 hover:text-[#123B26]'
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

          </div>

          {/* Row 2: Quick Search Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">
              Popular Searches:
            </span>
            {QUICK_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSearchChange(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all flex-shrink-0 ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? 'bg-[#123B26] text-white border-[#123B26]'
                    : 'bg-[#FCFAF5] text-[#123B26] border-[#E8DFC8] hover:border-[#205C38]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Row 3: Filter Badges + Summary */}
          <div className="pt-3 border-t border-[#F0EDE0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            {/* Results count & Clear */}
            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <span className="text-gray-500 font-medium">
                Showing <strong className="text-[#123B26] font-extrabold">{filteredProducts.length}</strong> of{' '}
                {products.length} products
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-bold text-[#205C38] hover:text-[#123B26] hover:underline inline-flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* §4  PRODUCTS GRID / LIST                                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {filteredProducts.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="list" />
              ))}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-[#E8DFC8] shadow-sm max-w-xl mx-auto my-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#DCE8C8] flex items-center justify-center mx-auto text-[#205C38]">
              <PackageOpen className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="font-playfair text-2xl font-bold text-[#123B26]">
              No Matching Provisions Found
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-poppins max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find items matching &quot;{searchQuery || activeCategoryInfo?.englishLabel}&quot;.
              Try checking spelling, removing active filters, or order directly via WhatsApp.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center px-6 py-2.5 rounded-full bg-[#123B26] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#205C38] transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
              <button
                type="button"
                onClick={handleWhatsAppCustomList}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#20ba5a] transition-colors shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask on WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* §5  HANDWRITTEN GROCERY LIST ASSISTANT BANNER             */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section className="bg-gradient-to-br from-[#123B26] to-[#0D2B1B] text-white rounded-3xl p-6 sm:p-8 border border-[#205C38] shadow-card relative overflow-hidden my-10">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#A8C66C]/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[#A8C66C]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Doorstep Packing</span>
              </span>
              <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold text-white">
                Have a Handwritten Grocery List?
              </h2>
              <p className="font-mukta text-[#F2C94C] font-semibold text-sm">
                உங்கள் மளிகைப் பட்டியல் உள்ளதா? வாட்ஸ்அப்பில் அனுப்புங்கள்!
              </p>
              <p className="font-poppins text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
                Snap a clear photo of your paper list or type out whatever you need. Our store team will pack your fresh provisions, verify every bag, and deliver directly to your doorstep with Cash / UPI payment upon delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppCustomList}
              className="inline-flex items-center space-x-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all duration-200 active:scale-95 flex-shrink-0"
            >
              <MessageSquare className="w-5 h-5 text-white" />
              <span>Send List on WhatsApp</span>
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* §6  NEIGHBORHOOD PURITY & DELIVERY GUARANTEES             */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {[
            {
              icon: Leaf,
              title: '100% Unpolished Purity',
              desc: 'Zero synthetic dyes, talc polish, or artificial aroma enhancers.',
            },
            {
              icon: Clock,
              title: 'Fresh Daily Batches',
              desc: 'Dispatch rounds every morning & evening to preserve maximum flavor.',
            },
            {
              icon: Truck,
              title: 'Chitlapakkam Doorstep',
              desc: 'Dedicated neighborhood dispatch team across Chromepet, Selaiyur & MIT.',
            },
            {
              icon: ShieldCheck,
              title: 'Pay at Delivery',
              desc: 'Verify packages at your door first, then pay comfortably via UPI or Cash.',
            },
          ].map(({ icon: Icon, title, desc }, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-[#E8DFC8] space-y-2 shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-[#DCE8C8] flex items-center justify-center text-[#205C38]">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="font-poppins text-sm font-bold text-[#123B26]">{title}</h4>
              <p className="font-poppins text-xs text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
