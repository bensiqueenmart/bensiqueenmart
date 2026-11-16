import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Phone,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  Sparkles,
  LayoutGrid,
  Headphones,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONFIG } from '../config/storeConfig';
import { CATEGORIES } from '../data/products';

export const Header: React.FC = () => {
  const { totalPackagesCount, setIsCartOpen } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
      if (productsMenuRef.current && !productsMenuRef.current.contains(event.target as Node)) {
        setProductsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoriesDropdownOpen(false);
    setProductsDropdownOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput('');
      setMobileMenuOpen(false);
    }
  };

  const NAV_LINKS = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products', hasDropdown: true },
    { name: 'Shop', path: '/products' },
    { name: 'Deals', path: '/offers', badge: 'Hot' },
    { name: 'About', path: '/about' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-[#123B26] text-white transition-all duration-300 ${isScrolled
            ? 'shadow-2xl shadow-black/20 border-b border-[#205C38]'
            : 'border-b border-[#205C38]/60'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── TIER 1: Logo | Search | Actions ── */}
          <div className="py-3 sm:py-4 flex items-center justify-between gap-4 lg:gap-8">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group flex-shrink-0">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-[#A8C66C]/70 shadow-md bg-white p-0.5 flex-shrink-0 transition-all duration-300 group-hover:border-[#A8C66C] group-hover:shadow-lg group-hover:shadow-[#A8C66C]/20">
                <img
                  src={STORE_CONFIG.logoUrl}
                  alt="Bensi Queen Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-playfair text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-[#A8C66C] transition-colors duration-300">
                  BENSI QUEEN
                </span>
                <span className="text-[9px] text-[#A8C66C]/80 tracking-[0.18em] uppercase font-semibold mt-0.5">
                  Nuts & Spices &amp; Provisions
                </span>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
                <Search className="w-4 h-4 text-[#A8C66C]/70 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search pulses, spices, dry fruits..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-[#1a4a30] hover:bg-[#1f5536] focus:bg-[#1f5536] border border-[#205C38] focus:border-[#A8C66C]/60 rounded-full pl-11 pr-24 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#A8C66C]/20 transition-all duration-200"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-3.5 text-white/40 hover:text-white p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="absolute right-1.5 px-4 py-1.5 bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold rounded-full text-xs transition-all duration-200 shadow-sm"
                  >
                    Search
                  </button>
                )}
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">

              {/* Phone — desktop only */}
              <a
                href={`tel:${STORE_CONFIG.phone}`}
                className="hidden xl:flex items-center space-x-1.5 text-xs text-white/60 hover:text-[#A8C66C] font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{STORE_CONFIG.displayPhone}</span>
              </a>

              {/* WhatsApp — desktop */}
              <a
                href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Bensi Queen, I would like to inquire about groceries.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-[#205C38]/80 hover:bg-[#205C38] text-white font-semibold text-xs border border-[#A8C66C]/25 hover:border-[#A8C66C]/50 transition-all duration-200"
                title="WhatsApp Support"
              >
                <Headphones className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>Help &amp; Support</span>
              </a>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full bg-[#205C38] hover:bg-[#286f45] text-white transition-all duration-200 flex items-center justify-center border border-[#A8C66C]/25 hover:border-[#A8C66C]/50 shadow-sm hover:shadow-md group cursor-pointer"
                aria-label="View Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                {totalPackagesCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#F2C94C] text-[#123B26] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#123B26] shadow-sm">
                    {totalPackagesCount}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 bg-[#A8C66C]/30 text-white/70 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    0
                  </span>
                )}
              </button>

              {/* Shop Now CTA — desktop */}
              <Link
                to="/products"
                className="hidden lg:inline-flex items-center space-x-2 pl-4 pr-1.5 py-1.5 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group"
              >
                <span>Shop Now</span>
                <span className="w-6 h-6 rounded-full bg-[#123B26] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3 h-3 text-[#A8C66C]" />
                </span>
              </Link>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-white hover:bg-[#205C38] transition-colors duration-200"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* ── TIER 2: Secondary Nav ── */}
          <div className="hidden lg:flex items-center justify-between py-2.5 border-t border-white/[0.08] text-xs">

            {/* Explore All Categories */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#205C38] hover:bg-[#286f45] text-white font-bold transition-all duration-200 border border-[#A8C66C]/20 hover:border-[#A8C66C]/40 shadow-sm"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>All Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoriesDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-[#0f2e1c] rounded-2xl shadow-2xl border border-[#205C38]/80 py-2 z-50 text-white overflow-hidden">
                  <div className="px-4 py-2 text-[10px] font-bold text-[#A8C66C] uppercase tracking-wider border-b border-white/[0.08] flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Store Categories</span>
                    </span>
                    <span className="bg-[#205C38] text-[#A8C66C] px-2 py-0.5 rounded-full text-[9px] font-black">35 Items</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {CATEGORIES.slice(1).map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${cat.id}`}
                        onClick={() => setCategoriesDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-[#205C38]/60 hover:text-[#A8C66C] transition-colors duration-150"
                      >
                        <span>{cat.englishLabel}</span>
                        <span className="text-[10px] bg-[#205C38]/80 text-[#A8C66C] px-2 py-0.5 rounded-full font-bold border border-[#A8C66C]/15">
                          {cat.count} items
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="pt-2 px-3 border-t border-white/[0.08]">
                    <Link
                      to="/products"
                      onClick={() => setCategoriesDropdownOpen(false)}
                      className="flex items-center justify-center space-x-1.5 w-full py-2.5 rounded-xl bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold text-xs transition-colors duration-200"
                    >
                      <span>View All 35 Products</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <nav className="flex items-center space-x-6 font-poppins font-semibold">

              {/* Products with dropdown */}
              <div className="relative" ref={productsMenuRef}>
                <button
                  type="button"
                  onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                  className={`flex items-center space-x-1 hover:text-[#A8C66C] transition-colors duration-200 py-1 ${location.pathname === '/products' ? 'text-[#A8C66C]' : 'text-white/80'
                    }`}
                >
                  <span>Products</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>

                {productsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-[#0f2e1c] rounded-2xl shadow-2xl border border-[#205C38]/80 py-2 z-50 text-white">
                    <Link
                      to="/products"
                      onClick={() => setProductsDropdownOpen(false)}
                      className="block px-4 py-2.5 text-xs font-bold text-[#A8C66C] hover:bg-[#205C38]/60 border-b border-white/[0.08]"
                    >
                      All Products (35 Items)
                    </Link>
                    {CATEGORIES.slice(1).map((c) => (
                      <Link
                        key={c.id}
                        to={`/products?category=${c.id}`}
                        onClick={() => setProductsDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-white/70 hover:text-[#A8C66C] hover:bg-[#205C38]/50 transition-colors"
                      >
                        {c.englishLabel}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {[
                { name: 'Shop', path: '/products' },
                { name: 'Deals', path: '/offers', badge: 'Hot' },
                { name: 'About', path: '/about' },
                { name: 'FAQ', path: '/faq' },
                { name: 'Contact', path: '/contact' },
              ].map(({ name, path, badge }) => (
                <NavLink
                  key={path + name}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 transition-colors duration-200 hover:text-[#A8C66C] ${isActive ? 'text-[#A8C66C] font-bold' : 'text-white/80'
                    }`
                  }
                >
                  <span>{name}</span>
                  {badge && (
                    <span className="bg-[#F2C94C] text-[#123B26] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right: WhatsApp + Phone */}
            <div className="flex items-center space-x-4">
              <a
                href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Bensi Queen, I would like to inquire about groceries.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#205C38]/60 hover:bg-[#205C38] text-white font-semibold border border-[#A8C66C]/20 hover:border-[#A8C66C]/40 transition-all duration-200"
                title="WhatsApp Support"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>WhatsApp Us</span>
              </a>
              <a
                href={`tel:${STORE_CONFIG.phone}`}
                className="text-xs text-white/50 hover:text-[#A8C66C] font-medium transition-colors duration-200"
              >
                {STORE_CONFIG.displayPhone}
              </a>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden py-2.5 border-t border-white/[0.08]">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-[#A8C66C]/70 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-[#1a4a30] border border-[#205C38] focus:border-[#A8C66C]/50 rounded-full pl-10 pr-9 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#A8C66C]/20 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 text-white/40 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0f2e1c] border-t border-[#205C38]/60 px-4 pt-4 pb-6 space-y-4 shadow-2xl">

            {/* Categories Grid */}
            <div className="bg-[#123B26] rounded-2xl border border-[#205C38]/80 overflow-hidden">
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.08]">
                <span className="text-[10px] font-bold text-[#A8C66C] uppercase tracking-wider flex items-center space-x-1.5">
                  <LayoutGrid className="w-3 h-3" />
                  <span>Explore Categories</span>
                </span>
                <span className="text-[10px] text-white/40">8 categories</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-3 text-xs">
                {CATEGORIES.slice(1).map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-xl bg-[#205C38]/60 border border-white/[0.06] text-white/90 font-semibold truncate hover:bg-[#205C38] hover:text-[#A8C66C] transition-colors"
                  >
                    {cat.englishLabel}
                  </Link>
                ))}
              </div>
            </div>

            {/* Nav Links */}
            <div className="space-y-1">
              {[
                { name: 'Home', path: '/' },
                { name: 'Products', path: '/products' },
                { name: 'Combo Deals', path: '/offers', badge: 'Hot' },
                { name: 'About Us', path: '/about' },
                { name: 'FAQ', path: '/faq' },
                { name: 'Contact', path: '/contact' },
              ].map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${location.pathname === link.path
                      ? 'bg-[#205C38] text-[#A8C66C]'
                      : 'text-white/80 hover:bg-[#205C38]/50 hover:text-white'
                    }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="bg-[#F2C94C] text-[#123B26] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile Actions */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold text-sm uppercase tracking-wider shadow-md transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop All 35 Products</span>
              </Link>
              <a
                href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-full bg-[#205C38]/60 border border-[#A8C66C]/25 text-white font-semibold text-sm transition-all"
              >
                <Headphones className="w-4 h-4 text-[#A8C66C]" />
                <span>WhatsApp: {STORE_CONFIG.displayPhone}</span>
              </a>
            </div>

          </div>
        )}
      </header>
    </>
  );
};
