import React from 'react';
import { Link } from 'react-router-dom';
import { STORE_CONFIG } from '../config/storeConfig';
import { CATEGORIES } from '../data/products';
import { MapPin, Phone, MessageSquare, ShieldCheck, Tag } from 'lucide-react';
import { useOffers } from '../context/OffersContext';

export const Footer: React.FC = () => {
  const { setIsOwnerModalOpen } = useOffers();

  const directWhatsAppUrl = `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hello Bensi Queen, I would like to inquire about your grocery products.'
  )}`;

  return (
    <footer className="bg-[#123B26] text-white pt-16 pb-8 border-t-4 border-[#205C38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          
          {/* Brand Presentation (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-full bg-white p-1 overflow-hidden flex-shrink-0 border-2 border-[#A8C66C]">
                <img
                  src={STORE_CONFIG.logoUrl}
                  alt="Bensi Queen Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <span className="font-playfair text-2xl font-bold tracking-tight text-white block">
                  BENSI QUEEN
                </span>
                <span className="font-poppins text-xs text-[#A8C66C] uppercase tracking-wider font-semibold">
                  Groceries & Provisions
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm">
              At Bensi Queen, we bring together everyday grocery essentials, quality pulses, aromatic spices and delicious nuts to make your kitchen shopping simple and convenient.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-[#205C38] hover:bg-[#123B26] border border-[#A8C66C]/40 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-button"
              >
                <MessageSquare className="w-4 h-4 text-[#A8C66C]" />
                <span>Order on WhatsApp</span>
              </a>

              <Link
                to="/offers"
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#F2C94C] hover:bg-[#e0b738] text-[#123B26] font-bold text-xs uppercase tracking-wider transition-colors"
              >
                <Tag className="w-4 h-4" />
                <span>View Offers</span>
              </Link>
            </div>
          </div>

          {/* Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-poppins text-xs font-bold text-[#A8C66C] uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-white/80 hover:text-[#A8C66C] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/80 hover:text-[#A8C66C] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-white/80 hover:text-[#A8C66C] transition-colors">
                  Our Products
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-white/80 hover:text-[#A8C66C] transition-colors">
                  Combo Offers
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-white/80 hover:text-[#A8C66C] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/80 hover:text-[#A8C66C] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-white/80 hover:text-[#A8C66C] transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Grocery Categories (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-poppins text-xs font-bold text-[#A8C66C] uppercase tracking-wider">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {CATEGORIES.slice(1).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/products?category=${cat.id}`}
                    className="text-white/80 hover:text-[#A8C66C] transition-colors"
                  >
                    {cat.englishLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Store Information (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-poppins text-xs font-bold text-[#A8C66C] uppercase tracking-wider">
              Store Information
            </h4>
            
            <div className="space-y-2.5 text-xs text-white/80">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-[#A8C66C] flex-shrink-0 mt-0.5" />
                <span>{STORE_CONFIG.address}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#A8C66C] flex-shrink-0" />
                <a
                  href={`tel:${STORE_CONFIG.phone}`}
                  className="hover:text-[#A8C66C] transition-colors font-semibold"
                >
                  {STORE_CONFIG.displayPhone}
                </a>
              </div>

              <div className="pt-2 border-t border-white/10 text-[11px] text-white/60">
                <p className="font-semibold text-white/80">Service Locations:</p>
                <p>Chitlapakkam, Tambaram, Chromepet, Hasthinapuram, Chennai - 600064</p>
              </div>

              {/* Owner Portal Link */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsOwnerModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 text-[11px] text-[#F2C94C] hover:underline font-semibold"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Owner Admin: Manage Combo Offers</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-3">
          <p>
            &copy; {new Date().getFullYear()} BENSI QUEEN. All rights reserved. Bringing nature&apos;s goodness to your kitchen.
          </p>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Chitlapakkam, Chennai</span>
            <span>•</span>
            <span>WhatsApp Ordering</span>
            <span>•</span>
            <span>Direct Delivery</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
