import React, { useState } from 'react';
import { MessageSquare, Sparkles, ShoppingBag, Eye, Check, Gift } from 'lucide-react';
import type { PublicCombo } from '@bqm/types';
import { STORE_CONFIG } from '../config/storeConfig';
import { useCart } from '../context/CartContext';
import { imageSrc, comboLabel } from '../api';

export interface DealCardProps {
  offer: PublicCombo;
  isPreview?: boolean;
  variant?: 'featured' | 'compact';
  onOpenDetails?: (offer: PublicCombo) => void;
}

const contentsText = (c: PublicCombo) => c.contents.map((i) => `${i.name} (${i.qty})`).join(', ');

export const DealCard: React.FC<DealCardProps> = ({
  offer,
  isPreview = false,
  variant = 'compact',
  onOpenDetails,
}) => {
  const { addComboToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const unavailable = !offer.available;
  const featured = variant === 'featured';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview || unavailable) return;
    addComboToCart(offer, contentsText(offer));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3000);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) return;
    const text = `Hello Bensi Queen! I'm interested in the "${offer.name}" combo.`;
    window.open(
      STORE_CONFIG.whatsappLink(text),
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div
      className={`relative group flex rounded-3xl overflow-hidden border border-[#A8C66C]/25 shadow-xl hover:shadow-2xl transition-all duration-500 ${
        featured
          ? 'flex-col lg:flex-row bg-gradient-to-br from-[#0d2b1a] via-[#102e1e] to-[#0a2015]'
          : 'flex-col bg-gradient-to-b from-[#0f3020] to-[#0d2619] hover:-translate-y-1.5'
      }`}
    >
      {/* Image Panel */}
      <div
        onClick={() => onOpenDetails?.(offer)}
        className={`relative overflow-hidden cursor-pointer bg-[#0c2417] flex-shrink-0 ${
          featured ? 'lg:w-[48%] h-72 sm:h-80 lg:h-auto min-h-[280px]' : 'h-52 sm:h-56'
        }`}
        title="Click to view full description and included items"
      >
        <img
          src={imageSrc(offer.image) || '/images/combo-dry-fruits.jpg'}
          alt={offer.name}
          loading={featured ? 'eager' : 'lazy'}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/combo-dry-fruits.jpg';
          }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-xl">
            <Eye className="w-3.5 h-3.5 text-[#F2C94C]" />
            <span>View Details</span>
          </span>
        </div>

        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1 bg-[#123B26] text-[#A8C66C] border border-[#A8C66C]/40 text-xs font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
            {comboLabel(offer.slug)}
          </span>
        </div>

        {unavailable && (
          <span className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-md text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
            Out of stock — back soon
          </span>
        )}
      </div>

      {/* Content Panel */}
      <div className="flex-1 p-6 flex flex-col justify-between gap-4 relative z-10">
        <div className="space-y-2.5">
          <p className="font-poppins text-[10px] font-black uppercase tracking-[0.2em] text-[#A8C66C]">
            ✦ {comboLabel(offer.slug)} ({offer.contents.length} items as 1 combo package)
          </p>
          <h3
            onClick={() => onOpenDetails?.(offer)}
            className="font-playfair text-xl lg:text-2xl font-extrabold text-white leading-tight cursor-pointer hover:text-[#F2C94C] transition-colors"
            title="Click to view details"
          >
            {offer.name}
          </h3>
          <p
            onClick={() => onOpenDetails?.(offer)}
            className="font-poppins text-xs lg:text-sm text-white/70 leading-relaxed cursor-pointer line-clamp-2"
          >
            {offer.description}
          </p>
        </div>

        <div
          onClick={() => onOpenDetails?.(offer)}
          className="cursor-pointer bg-[#A8C66C]/10 border border-[#A8C66C]/25 rounded-2xl p-3.5 space-y-1.5 hover:bg-[#A8C66C]/15 transition-colors"
          title="Click to view the full items list"
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-[#A8C66C] flex items-center gap-1">
            <Gift className="w-3 h-3 text-[#F2C94C]" />
            <span>Contains all {offer.contents.length} items:</span>
          </span>
          <p className="text-xs text-white/85 font-poppins leading-relaxed">{contentsText(offer)}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isPreview || unavailable}
            title={unavailable ? 'Out of stock — back soon' : 'Add to cart'}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 ${
              unavailable
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : justAdded
                  ? 'bg-[#123B26] text-white border border-[#A8C66C]'
                  : 'bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26]'
            }`}
          >
            {unavailable ? (
              <span>Out of stock</span>
            ) : justAdded ? (
              <>
                <Check className="w-4 h-4 text-[#A8C66C]" />
                <span>✓ Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          {onOpenDetails && (
            <button
              type="button"
              onClick={() => onOpenDetails(offer)}
              className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#A8C66C]" />
              <span>Details</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
