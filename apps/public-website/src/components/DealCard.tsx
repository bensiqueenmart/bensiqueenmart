import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  MessageSquare,
  Flame,
  Clock,
  Sparkles,
  Star,
  Gift,
  Zap,
  ShoppingBag,
  Eye,
  Check,
} from 'lucide-react';
import { ComboOffer } from '../types';
import { STORE_CONFIG } from '../config/storeConfig';
import { useCart } from '../context/CartContext';
import { resolveComboItems } from '../utils/comboUtils';

export interface DealCardProps {
  offer: ComboOffer;
  isPreview?: boolean;
  variant?: 'featured' | 'compact';
  onOpenDetails?: (offer: ComboOffer) => void;
}

/** Returns days left until endDate, or null if no endDate */
function useDaysLeft(endDate?: string): number | null {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!endDate) {
      setDays(null);
      return;
    }
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(diff / 86_400_000)));
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [endDate]);
  return days;
}

/* ─────────────── FEATURED (wide horizontal) card ─────────────── */
const FeaturedDealCard: React.FC<DealCardProps> = ({
  offer,
  isPreview = false,
  onOpenDetails,
}) => {
  const { addComboToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const daysLeft = useDaysLeft(offer.endDate);
  const [hovered, setHovered] = useState(false);
  const urgency = daysLeft !== null && daysLeft <= 7;
  const resolvedItems = resolveComboItems(offer);

  const summaryText =
    offer.includedSummary ||
    resolvedItems.map((r) => `${r.product.englishName} (${r.weight})`).join(', ');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) return;
    addComboToCart(
      offer.title,
      offer.id,
      offer.comboName || 'Combo 1',
      summaryText,
      offer.image || '/images/hero/dry-fruits-hero.jpg',
      offer.comboNumber || 1
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3000);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) return;
    const text = `Hello Bensi Queen! I'm interested in the "${offer.title}" offer (${offer.discountLabel}).`;
    window.open(
      `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div
      className="relative group flex flex-col lg:flex-row rounded-3xl overflow-hidden border border-[#A8C66C]/25 shadow-2xl hover:shadow-[0_20px_60px_rgba(168,198,108,0.18)] transition-all duration-500 bg-gradient-to-br from-[#0d2b1a] via-[#102e1e] to-[#0a2015]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ minHeight: '340px' }}
    >
      {/* Animated glow border */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none z-20 transition-opacity duration-500"
        style={{
          boxShadow: hovered
            ? 'inset 0 0 0 2px rgba(168,198,108,0.55)'
            : 'inset 0 0 0 1px rgba(168,198,108,0.18)',
        }}
      />

      {/* ── Image Panel (50% width on desktop) ── */}
      <div
        onClick={() => onOpenDetails?.(offer)}
        className="relative lg:w-[48%] flex-shrink-0 overflow-hidden cursor-pointer h-72 sm:h-80 lg:h-auto min-h-[280px] bg-[#0c2417]"
        title="Click to view full description and included items"
      >
        <img
          src={offer.image || '/images/combo-dry-fruits.jpg'}
          alt={offer.title}
          loading="eager"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/combo-dry-fruits.jpg';
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out ${
            hovered ? 'scale-108' : 'scale-100'
          }`}
        />

        {/* Soft subtle vignette for badges readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Hover click hint */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-xl">
            <Eye className="w-3.5 h-3.5 text-[#F2C94C]" />
            <span>Click to View Description & Items</span>
          </span>
        </div>

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[#123B26] text-[#A8C66C] border border-[#A8C66C]/40 text-xs font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
              {offer.comboName || 'Combo 1'}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#F2C94C] text-[#123B26] text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              {offer.discountLabel}
            </span>
          </div>

          {urgency ? (
            <span className="inline-flex items-center gap-1 bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-md backdrop-blur-sm">
              <Clock className="w-2.5 h-2.5" />
              Ends in {daysLeft}d
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-[#A8C66C]/85 text-[#123B26] text-[10px] font-black px-2.5 py-1.5 rounded-full shadow-md backdrop-blur-sm">
              <Star className="w-2.5 h-2.5" />
              BESTSELLER
            </span>
          )}
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-semibold px-3 py-1.5 rounded-full border border-white/15">
            <Gift className="w-3 h-3 text-[#F2C94C]" />
            {offer.validUntil}
          </span>
        </div>

        {/* Preview badge */}
        {isPreview && (
          <span className="absolute top-4 right-4 bg-black/80 text-[#F2C94C] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-[#F2C94C]/40 z-20">
            Preview
          </span>
        )}
      </div>

      {/* ── Content Panel ── */}
      <div className="flex-1 p-6 lg:p-7 flex flex-col justify-between gap-4 relative z-10">
        {/* Decorative corner sparkle */}
        <div className="absolute top-5 right-5 opacity-20 pointer-events-none">
          <Sparkles className="w-8 h-8 text-[#F2C94C]" />
        </div>

        <div className="space-y-2.5">
          <p className="font-poppins text-[10px] font-black uppercase tracking-[0.2em] text-[#A8C66C]">
            ✦ {offer.comboName || 'Combo Deal'} ({resolvedItems.length} Products Included as 1 Combo Package)
          </p>
          <h3
            onClick={() => onOpenDetails?.(offer)}
            className={`font-playfair text-xl lg:text-2xl font-extrabold leading-tight transition-colors duration-300 cursor-pointer ${
              hovered ? 'text-[#F2C94C]' : 'text-white'
            }`}
            title="Click to view details"
          >
            {offer.title}
          </h3>
          <p
            onClick={() => onOpenDetails?.(offer)}
            className="font-poppins text-xs lg:text-sm text-white/70 leading-relaxed cursor-pointer line-clamp-2"
          >
            {offer.description}
          </p>
        </div>

        {/* Included items breakdown text box */}
        <div
          onClick={() => onOpenDetails?.(offer)}
          className="cursor-pointer bg-[#A8C66C]/10 border border-[#A8C66C]/25 rounded-2xl p-3.5 space-y-1.5 hover:bg-[#A8C66C]/15 transition-colors"
          title="Click to view detailed items list"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#A8C66C] flex items-center gap-1">
              <Gift className="w-3 h-3 text-[#F2C94C]" />
              <span>Contains All {resolvedItems.length} Items Below:</span>
            </span>
            <span className="text-[10px] text-[#F2C94C] font-semibold underline">
              View Breakdown →
            </span>
          </div>
          <p className="text-xs text-white/85 font-poppins leading-relaxed">
            {summaryText}
          </p>
        </div>

        {/* CTA buttons: Add Combo to Cart + Details + WhatsApp */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Add Deal to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isPreview}
              className={`flex-1 relative overflow-hidden inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 group/btn cursor-pointer ${
                justAdded
                  ? 'bg-[#123B26] text-white border border-[#A8C66C]'
                  : 'bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26]'
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 text-[#A8C66C] relative z-10" />
                  <span className="relative z-10">✓ Added {offer.comboName || 'Combo'} to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Add {offer.comboName || 'Combo 1'} to Cart</span>
                </>
              )}
            </button>

            {/* View Details button */}
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

            {/* WhatsApp button */}
            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={isPreview}
              className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {daysLeft !== null && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-white/35">Offer validity</span>
              <span
                className={`font-bold ${
                  urgency ? 'text-red-400' : 'text-[#A8C66C]'
                }`}
              >
                {daysLeft === 0 ? '⚡ Ends today!' : `${daysLeft} days left`}
              </span>
            </div>
            <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  urgency
                    ? 'bg-gradient-to-r from-red-500 to-orange-400'
                    : 'bg-gradient-to-r from-[#A8C66C] to-[#F2C94C]'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(5, (daysLeft / 90) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────── COMPACT card ─────────────── */
const CompactDealCard: React.FC<DealCardProps> = ({
  offer,
  isPreview = false,
  onOpenDetails,
}) => {
  const { addComboToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const daysLeft = useDaysLeft(offer.endDate);
  const [hovered, setHovered] = useState(false);
  const urgency = daysLeft !== null && daysLeft <= 7;
  const resolvedItems = resolveComboItems(offer);

  const summaryText =
    offer.includedSummary ||
    resolvedItems.map((r) => `${r.product.englishName} (${r.weight})`).join(', ');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) return;
    addComboToCart(
      offer.title,
      offer.id,
      offer.comboName || 'Combo',
      summaryText,
      offer.image || '/images/hero/dry-fruits-hero.jpg',
      offer.comboNumber
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3000);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) return;
    const text = `Hello Bensi Queen! I'm interested in the "${offer.title}" offer (${offer.discountLabel}).`;
    window.open(
      `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div
      className="relative group flex flex-col rounded-3xl overflow-hidden border border-[#A8C66C]/20 shadow-xl hover:shadow-[0_16px_48px_rgba(168,198,108,0.15)] hover:-translate-y-1.5 transition-all duration-400 bg-gradient-to-b from-[#0f3020] to-[#0d2619]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow border */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none z-20 transition-opacity duration-400"
        style={{
          boxShadow: hovered
            ? 'inset 0 0 0 1.5px rgba(168,198,108,0.55)'
            : 'inset 0 0 0 1px rgba(168,198,108,0.12)',
        }}
      />

      {/* Image */}
      <div
        onClick={() => onOpenDetails?.(offer)}
        className="relative h-52 sm:h-56 overflow-hidden flex-shrink-0 cursor-pointer bg-[#0c2417]"
        title="Click to view full description"
      >
        <img
          src={offer.image || '/images/combo-nuts.jpg'}
          alt={offer.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/combo-nuts.jpg';
          }}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            hovered ? 'scale-110' : 'scale-100'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Hover click hint */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full border border-white/20">
            <Eye className="w-3 h-3 text-[#F2C94C]" />
            <span>View Details</span>
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 bg-[#123B26]/90 text-[#A8C66C] border border-[#A8C66C]/40 text-[10px] font-black px-2.5 py-1 rounded-full shadow backdrop-blur-md">
              <Sparkles className="w-2.5 h-2.5 text-[#F2C94C]" />
              {offer.comboName || 'Combo'}
            </span>
            <span className="inline-flex items-center gap-1 bg-[#F2C94C] text-[#123B26] text-[10px] font-black px-2.5 py-1 rounded-full shadow uppercase tracking-wide">
              <Zap className="w-3 h-3" />
              {offer.discountLabel}
            </span>
          </div>

          {urgency ? (
            <span className="inline-flex items-center gap-1 bg-red-500/90 text-white text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
              <Clock className="w-2 h-2" />
              {daysLeft}d left
            </span>
          ) : offer.featured ? (
            <span className="inline-flex items-center gap-1 bg-[#A8C66C]/85 text-[#123B26] text-[9px] font-black px-2 py-1 rounded-full backdrop-blur-sm">
              <Star className="w-2 h-2" />
              Hot Deal
            </span>
          ) : null}
        </div>

        {/* Valid until */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-[9px] text-white/60 font-poppins">
            {offer.validUntil}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="space-y-1.5">
          <h3
            onClick={() => onOpenDetails?.(offer)}
            className={`font-playfair text-base font-bold leading-snug transition-colors duration-300 cursor-pointer ${
              hovered ? 'text-[#F2C94C]' : 'text-white'
            }`}
            title="Click to view details"
          >
            {offer.title}
          </h3>
          <p
            onClick={() => onOpenDetails?.(offer)}
            className="font-poppins text-[11px] text-white/55 leading-relaxed line-clamp-2 cursor-pointer"
          >
            {offer.description}
          </p>
        </div>

        {/* Included items summary */}
        <div
          onClick={() => onOpenDetails?.(offer)}
          className="text-[10.5px] bg-[#A8C66C]/8 border border-[#A8C66C]/18 rounded-xl p-2.5 text-white/80 cursor-pointer hover:bg-[#A8C66C]/15 transition-colors leading-relaxed"
          title="Click to see included items"
        >
          <span className="font-semibold text-[#A8C66C] block mb-0.5">
            Package Contents:
          </span>
          <p className="line-clamp-2 font-poppins text-white/70">
            {summaryText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-2 pt-1">
          {/* Add Deal to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isPreview}
            className={`w-full relative overflow-hidden inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 group/btn cursor-pointer ${
              justAdded
                ? 'bg-[#123B26] text-white border border-[#A8C66C]'
                : 'bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26]'
            }`}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#A8C66C] relative z-10" />
                <span className="relative z-10">✓ Added {offer.comboName || 'Combo'} to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Add {offer.comboName || 'Combo'} to Cart</span>
              </>
            )}
          </button>

          {/* Details & WhatsApp buttons */}
          <div className="flex items-center gap-2">
            {onOpenDetails && (
              <button
                type="button"
                onClick={() => onOpenDetails(offer)}
                className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-[11px] transition-colors"
              >
                <Eye className="w-3 h-3 text-[#A8C66C]" />
                <span>Details</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={isPreview}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-[11px] uppercase tracking-wider shadow-xs transition-all active:scale-95"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Progress */}
        {daysLeft !== null && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[9px]">
              <span className="text-white/35">Offer validity</span>
              <span
                className={`font-bold ${
                  urgency ? 'text-red-400' : 'text-[#A8C66C]'
                }`}
              >
                {daysLeft === 0 ? 'Ends today!' : `${daysLeft}d left`}
              </span>
            </div>
            <div className="h-0.5 w-full bg-white/8 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  urgency
                    ? 'bg-red-400'
                    : 'bg-gradient-to-r from-[#A8C66C] to-[#F2C94C]'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(5, (daysLeft / 90) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────── PUBLIC EXPORT ─────────────── */
export const DealCard: React.FC<DealCardProps> = ({
  offer,
  isPreview = false,
  variant,
  onOpenDetails,
}) => {
  if (variant === 'featured') {
    return (
      <FeaturedDealCard
        offer={offer}
        isPreview={isPreview}
        onOpenDetails={onOpenDetails}
      />
    );
  }
  return (
    <CompactDealCard
      offer={offer}
      isPreview={isPreview}
      onOpenDetails={onOpenDetails}
    />
  );
};
