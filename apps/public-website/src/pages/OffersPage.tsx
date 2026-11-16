import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tag, Calendar, ShieldCheck, ArrowRight, Sparkles, CheckCircle2,
  MessageSquare, Flame, Clock, Truck, Zap, Leaf, Package, Star,
  Gift, ShoppingBag, SlidersHorizontal, ChevronRight, Eye, Check,
} from 'lucide-react';
import { useOffers } from '../context/OffersContext';
import { useCart } from '../context/CartContext';
import { resolveComboItems } from '../utils/comboUtils';
import { DealDetailModal } from '../components/DealDetailModal';
import { SEOHead } from '../components/SEOHead';
import { STORE_CONFIG } from '../config/storeConfig';
import { ComboOffer } from '../types';

/* ── Days-left helper ───────────────────────────────────────── */
function useDaysLeft(endDate?: string) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!endDate) { setDays(null); return; }
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

/* ── Floating Particle Background Configuration ─────────────── */
interface Particle { id: number; x: number; size: number; opacity: number; speed: number; delay: number; drift: number }
const PARTICLES: Particle[] = Array.from({ length: 18 }, (_, i) => ({
  id: i, x: Math.random() * 100, size: Math.random() * 3 + 1.5,
  opacity: Math.random() * 0.4 + 0.1, speed: Math.random() * 16 + 10,
  delay: Math.random() * -18, drift: Math.random() * 8 - 4,
}));

/* ── Scroll-reveal hook ─────────────────────────────────────── */
function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

/* ── Extract or generate smart itemized tags for combos ──────── */
function getBundleHighlights(offer: ComboOffer): string[] {
  const t = (offer.title + ' ' + offer.description).toLowerCase();
  if (t.includes('spice') || t.includes('masala')) {
    return ['Turmeric (200g)', 'Red Chilli (200g)', 'Coriander (200g)', 'Malabar Pepper (100g)'];
  }
  if (t.includes('nut') || t.includes('almond') || t.includes('cashew') || t.includes('dry fruit')) {
    return ['Grade-W240 Cashews (500g)', 'California Almonds (500g)', 'Sun-Dried Raisins (500g)'];
  }
  if (t.includes('rice') || t.includes('breakfast') || t.includes('idli')) {
    return ['1kg Premium Idli Rice', '+ Free 200g Roasted Rava', 'Fluffy Idlis & Kesari'];
  }
  if (t.includes('dal') || t.includes('pulse')) {
    return ['Unpolished Toor Dal', 'Premium Urad Dal', 'Hand-Cleaned Moong'];
  }
  return ['100% Unpolished', 'Zero Preservatives', 'Stone-Milled Purity'];
}

/* ══════════════════════════════════════════════════════════════ */
/* §  MODERN 3-COLUMN DEAL CARD                                   */
/* ══════════════════════════════════════════════════════════════ */
interface DealGridCardProps {
  offer: ComboOffer;
  index: number;
  onOpenDetails: (offer: ComboOffer) => void;
}

const DealGridCard: React.FC<DealGridCardProps> = ({ offer, index, onOpenDetails }) => {
  const { addComboToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const daysLeft = useDaysLeft(offer.endDate);
  const urgency = daysLeft !== null && daysLeft <= 7;
  const highlights = getBundleHighlights(offer);
  const resolvedItems = resolveComboItems(offer);
  const fade = useFadeIn(0.08);

  const whatsappMessage = encodeURIComponent(
    `Hello Bensi Queen, I would like to claim the promotional offer: "${offer.title}" (${offer.discountLabel}).`
  );

  const summaryText =
    offer.includedSummary ||
    resolvedItems.map((r) => `${r.product.englishName} (${r.weight})`).join(', ');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addComboToCart(
      offer.title,
      offer.id,
      offer.comboName || `Combo ${index + 1}`,
      summaryText,
      offer.image || '/images/hero/dry-fruits-hero.jpg',
      offer.comboNumber || index + 1
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3000);
  };

  return (
    <div
      ref={fade.ref}
      className="group relative bg-white rounded-3xl overflow-hidden border border-[#DCE8C8] hover:border-[#205C38] shadow-card hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
      style={{
        opacity: fade.vis ? 1 : 0,
        transform: fade.vis ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s, box-shadow 0.3s, border-color 0.3s`,
      }}
    >
      {/* ── Top Image (Click to View Description & Items) ── */}
      <div
        onClick={() => onOpenDetails(offer)}
        className="relative h-60 sm:h-64 overflow-hidden bg-[#123B26]/10 flex-shrink-0 cursor-pointer"
        title="Click to view deal description and included items"
      >
        <img
          src={offer.image || '/images/combo-dry-fruits.jpg'}
          alt={offer.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/combo-dry-fruits.jpg';
          }}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
        />

        {/* Soft bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />

        {/* Hover pill indicator */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-xl">
            <Eye className="w-3.5 h-3.5 text-[#F2C94C]" />
            <span>Click to View Deal Details</span>
          </span>
        </div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-[#123B26]/90 text-[#A8C66C] border border-[#A8C66C]/40 text-xs font-black px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span>{offer.comboName || `Combo ${index + 1}`}</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 bg-[#F2C94C] text-[#123B26] text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-[#123B26]" />
              <span>{offer.discountLabel}</span>
            </span>
          </div>

          {urgency ? (
            <span className="inline-flex items-center space-x-1 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm animate-pulse">
              <Clock className="w-3 h-3" />
              <span>Ends in {daysLeft}d</span>
            </span>
          ) : offer.featured ? (
            <span className="inline-flex items-center space-x-1 bg-[#123B26]/90 backdrop-blur-sm text-[#A8C66C] border border-[#A8C66C]/40 text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
              <Sparkles className="w-3 h-3 text-[#F2C94C]" />
              <span>Store Special</span>
            </span>
          ) : null}
        </div>

        {/* Bottom Validity Bar */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white z-10">
          <span className="inline-flex items-center space-x-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full border border-white/15">
            <Calendar className="w-3 h-3 text-[#A8C66C]" />
            <span>{offer.validUntil}</span>
          </span>

          <span className="text-[10px] font-bold text-[#A8C66C] bg-[#123B26]/85 px-2.5 py-0.5 rounded-full border border-[#A8C66C]/30 backdrop-blur-sm">
            WhatsApp Verified
          </span>
        </div>
      </div>

      {/* ── Card Content Body ── */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-3">
          {/* Title (Clickable) */}
          <h3
            onClick={() => onOpenDetails(offer)}
            className="font-playfair text-xl font-bold text-[#123B26] group-hover:text-[#205C38] transition-colors leading-snug cursor-pointer"
            title="Click to view full description"
          >
            {offer.title}
          </h3>

          {/* Description */}
          <p
            onClick={() => onOpenDetails(offer)}
            className="font-poppins text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3 cursor-pointer"
          >
            {offer.description}
          </p>

          {/* Included Items Pills (Clickable) */}
          <div
            onClick={() => onOpenDetails(offer)}
            className="pt-1 cursor-pointer group/items"
            title="Click to view all item details"
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#205C38] flex items-center gap-1">
                <Package className="w-3 h-3 text-[#205C38]" />
                <span>Included in this deal:</span>
              </p>
              <span className="text-[10px] font-bold text-[#205C38] group-hover/items:underline flex items-center gap-0.5">
                <span>View Items</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#123B26] bg-[#DCE8C8]/60 border border-[#A8C66C]/40 px-2.5 py-1 rounded-lg group-hover/items:bg-[#DCE8C8]"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#205C38]" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Terms Box & Action Buttons ── */}
        <div className="space-y-3.5 pt-3 border-t border-[#E8DFC8]">
          {/* Terms note */}
          <div className="flex items-start space-x-2 bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl p-2.5 text-[11px] text-gray-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#205C38] flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2 italic">{offer.termsAndConditions}</span>
          </div>

          {/* Action Buttons: Add Deal to Cart + View Details + WhatsApp */}
          <div className="space-y-2 pt-1">
            {/* Primary: Add Deal to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full relative overflow-hidden inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 group/btn cursor-pointer ${
                justAdded
                  ? 'bg-[#123B26] text-white shadow-emerald-900/30'
                  : 'bg-[#205C38] hover:bg-[#164328] text-white shadow-[#205C38]/25'
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
                  <ShoppingBag className="w-4 h-4 text-[#A8C66C] relative z-10" />
                  <span className="relative z-10">Add {offer.comboName || 'Combo'} to Cart</span>
                </>
              )}
            </button>

            {/* Secondary: View Details modal & WhatsApp */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenDetails(offer)}
                className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-[#F7F5E8] hover:bg-[#DCE8C8] text-[#123B26] font-bold text-xs border border-[#DCE8C8] transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#205C38]" />
                <span>View Details</span>
              </button>

              <a
                href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Claim or inquire on WhatsApp"
                className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1fab57] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/* §  MAIN DEALS & OFFERS PAGE                                    */
/* ══════════════════════════════════════════════════════════════ */
export const OffersPage: React.FC = () => {
  const { activeOffers, setIsOwnerModalOpen } = useOffers();
  const [activeTab, setActiveTab] = useState<'all' | 'combos' | 'spices' | 'discounts'>('all');
  const [selectedOffer, setSelectedOffer] = useState<ComboOffer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const heroFade = useFadeIn(0.05);
  const filterFade = useFadeIn(0.1);
  const stepsFade = useFadeIn(0.1);
  const customFade = useFadeIn(0.1);

  const handleOpenDetails = (offer: ComboOffer) => {
    setSelectedOffer(offer);
    setIsDetailModalOpen(true);
  };

  // Filter offers based on tab selection
  const filteredOffers = activeOffers.filter((o) => {
    if (activeTab === 'all') return true;
    const text = (o.title + ' ' + o.description + ' ' + o.discountLabel).toLowerCase();
    if (activeTab === 'combos') return text.includes('combo') || text.includes('bundle') || text.includes('pack');
    if (activeTab === 'spices') return text.includes('spice') || text.includes('powder') || text.includes('masala');
    if (activeTab === 'discounts') return text.includes('%') || text.includes('discount') || text.includes('buy 1');
    return true;
  });

  return (
    <div className="bg-[#F7F5E8] text-[#123B26] min-h-screen overflow-x-hidden">

      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes floatUpDeals {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-110vh) translateX(var(--dd)); opacity: 0; }
        }
        @keyframes gradShiftDeals {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
        @keyframes pulseGreenDeals {
          0%   { box-shadow: 0 0 0 0 rgba(37,211,102,0.55); }
          70%  { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
        }
        @keyframes spinDeals {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blinkDeals {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.2; }
        }
        .deals-hero-bg {
          background: linear-gradient(135deg, #0A2318 0%, #123B26 40%, #1b5e39 70%, #123B26 100%);
          background-size: 300% 300%;
          animation: gradShiftDeals 12s ease infinite;
        }
        .wa-pulse-deals { animation: pulseGreenDeals 2s infinite; }
        .spin-ring { animation: spinDeals 20s linear infinite; }
      `}</style>

      <SEOHead
        title="Exclusive Combo Offers & Deals | Bensi Queen Chitlapakkam"
        description="Save more on household groceries with Bensi Queen combo packs! Handpicked dry fruits bundles, stone-milled kitchen spice packs, and whole nuts discounts with fast doorstep delivery in Chitlapakkam, Chennai."
        canonical="https://bensiqueen.com/offers"
        keywords="grocery combo offers, dry fruits bundle chennai, spice pack combo, grocery deals chitlapakkam, bensi queen offers, tambaram grocery combos"
        image="https://bensiqueen.com/images/combo-dry-fruits.jpg"
        imageAlt="Bensi Queen Grocery Combo Packs and Special Promotions"
      />

      {/* ══════════════════════════════════════════ */}
      {/* §1  HERO BANNER                            */}
      {/* ══════════════════════════════════════════ */}
      <section className="deals-hero-bg relative overflow-hidden text-white min-h-[50vh] flex items-center">

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {PARTICLES.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full bg-[#A8C66C]"
              style={{
                left: `${p.x}%`, bottom: '-8px',
                width: p.size, height: p.size, opacity: p.opacity,
                animationName: 'floatUpDeals',
                animationDuration: `${p.speed}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationDelay: `${p.delay}s`,
                // @ts-ignore
                '--dd': `${p.drift}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Spinning ring decorations */}
        <div className="spin-ring absolute -top-20 -right-20 w-[440px] h-[440px] rounded-full border border-[#A8C66C]/10 pointer-events-none" aria-hidden />
        <div className="spin-ring absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full border border-[#A8C66C]/8 pointer-events-none" style={{ animationDirection: 'reverse' }} aria-hidden />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #A8C66C 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} aria-hidden />

        <div ref={heroFade.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Left text */}
            <div
              className="lg:col-span-7 space-y-6"
              style={{
                opacity: heroFade.vis ? 1 : 0,
                transform: heroFade.vis ? 'translateY(0)' : 'translateY(28px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
              }}
            >
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-[#F2C94C]/15 border border-[#F2C94C]/30 text-[#F2C94C] px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest">
                <Flame className="w-3.5 h-3.5" />
                <span>🔥 Exclusive Store Savings · Chitlapakkam, Chennai</span>
              </div>

              <div>
                <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] text-white">
                  Exclusive Combo<br />
                  <span className="text-[#A8C66C]">Deals & Family Packs</span>
                </h1>
                <p className="font-mukta text-[#A8C66C]/80 text-base mt-2">
                  பிரத்யேக காம்போ சலுகைகள் · குடும்ப பேக்குகள்
                </p>
              </div>

              <p className="font-poppins text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
                Hand-inspected unpolished dals, cold-pressed oils, and freshly stone-milled spices — bundled into unbeatable neighborhood combo deals. Claim instantly via WhatsApp with zero online prepayment.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="relative overflow-hidden inline-flex items-center space-x-2 px-7 py-3.5 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-extrabold text-sm uppercase tracking-wider shadow-xl transition-all active:scale-95 group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Sparkles className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Browse Eligible Products</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsOwnerModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-[#A8C66C]" />
                  <span>Owner Portal</span>
                </button>
              </div>
            </div>

            {/* Right — 4 trust cards */}
            <div
              className="lg:col-span-5 grid grid-cols-2 gap-4"
              style={{
                opacity: heroFade.vis ? 1 : 0,
                transform: heroFade.vis ? 'translateY(0)' : 'translateY(28px)',
                transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
              }}
            >
              {[
                { icon: Zap, label: 'Direct WhatsApp Claim', sub: 'Zero payment hassle', color: 'bg-[#F2C94C]/15 border-[#F2C94C]/25' },
                { icon: Leaf, label: 'Purity Assured', sub: 'Every pack guaranteed', color: 'bg-[#A8C66C]/15 border-[#A8C66C]/25' },
                { icon: Package, label: 'Flexible Weights', sub: '100g to 1kg bundles', color: 'bg-[#A8C66C]/15 border-[#A8C66C]/25' },
                { icon: Truck, label: 'Cash / UPI on Delivery', sub: 'Zero prepayment needed', color: 'bg-[#F2C94C]/15 border-[#F2C94C]/25' },
              ].map(({ icon: Icon, label, sub, color }, i) => (
                <div key={i} className={`${color} border rounded-2xl p-4 backdrop-blur-sm flex flex-col space-y-2 hover:scale-105 transition-transform duration-300`}>
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-[#A8C66C]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{label}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* SVG wave edge */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 56" preserveAspectRatio="none" className="w-full" style={{ height: 56 }} fill="#F7F5E8">
            <path d="M0,56 L0,28 Q180,0 360,18 Q540,36 720,12 Q900,0 1080,22 Q1260,40 1440,18 L1440,56 Z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* §2  CATEGORY FILTER TABS & HEADER          */}
      {/* ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <div
          ref={filterFade.ref}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DCE8C8]"
          style={{
            opacity: filterFade.vis ? 1 : 0,
            transform: filterFade.vis ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}
        >
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest text-[#205C38]">
              <Tag className="w-3.5 h-3.5" />
              <span>Store Promotions</span>
            </div>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
              Active Store Deals & Bundles
            </h2>
            <p className="font-poppins text-xs sm:text-sm text-gray-500">
              All combo offers can be claimed directly through WhatsApp order confirmation.
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-full border border-[#DCE8C8] shadow-sm self-start md:self-auto">
            {[
              { id: 'all', label: `All Deals (${activeOffers.length})` },
              { id: 'combos', label: 'Pantry Combos' },
              { id: 'spices', label: 'Spice Packs' },
              { id: 'discounts', label: 'Discounts & BOGO' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#123B26] text-[#A8C66C] shadow-sm'
                    : 'text-gray-600 hover:text-[#123B26] hover:bg-[#F7F5E8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* §3  3-COLUMN CARD GRID (TRANSFORMED!)      */}
      {/* ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOffers.map((offer, index) => (
              <DealGridCard
                key={offer.id}
                offer={offer}
                index={index}
                onOpenDetails={handleOpenDetails}
              />
            ))}

            {/* Custom Combo Request Feature Card */}
            <div className="bg-gradient-to-br from-[#123B26] via-[#1a4e32] to-[#0A2318] text-white rounded-3xl p-7 border-2 border-[#A8C66C]/40 shadow-xl flex flex-col justify-between space-y-6 hover:-translate-y-2 transition-all duration-300 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#A8C66C]/20 border border-[#A8C66C]/30 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-[#F2C94C]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#F2C94C] text-[#123B26] px-3 py-1 rounded-full shadow-sm">
                    Custom Bundle
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-playfair text-2xl font-bold text-white group-hover:text-[#A8C66C] transition-colors leading-tight">
                    Curate Your Own Family Pack
                  </h3>
                  <p className="font-poppins text-xs text-white/75 leading-relaxed">
                    Need a personalized combination? Mix and match your choice of dals, spices, and oils in custom pack sizes (100g – 1kg).
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {[
                    'Customizable 100g to 1kg sizes',
                    'Zero online prepayment hassle',
                    'Direct chat with store owner',
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-white/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14] flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <a
                  href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    'Hello Bensi Queen, I would like to create a custom grocery combo pack for my family.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-[#F2C94C] hover:bg-[#e0b738] text-[#123B26] font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Custom Pack</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Empty tab filter state */
          <div className="bg-white rounded-3xl p-14 text-center border border-[#DCE8C8] max-w-lg mx-auto space-y-4 shadow-soft">
            <div className="w-16 h-16 rounded-full bg-[#DCE8C8] flex items-center justify-center mx-auto">
              <Tag className="w-8 h-8 text-[#205C38]" />
            </div>
            <h3 className="font-playfair text-xl font-bold text-[#123B26]">No Offers in this Category</h3>
            <p className="text-sm text-gray-500 font-poppins leading-relaxed">
              Check all active deals or ask the owner directly via WhatsApp for today&apos;s special in-store grocery savings.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="px-6 py-2.5 rounded-full bg-[#123B26] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#205C38] transition-all"
            >
              View All Deals
            </button>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* §4  HOW TO CLAIM — 3-STEP PROCESS         */}
      {/* ══════════════════════════════════════════ */}
      <section className="bg-[#123B26] text-white relative overflow-hidden py-16">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #A8C66C 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />

        <div
          ref={stepsFade.ref}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
          style={{
            opacity: stepsFade.vis ? 1 : 0,
            transform: stepsFade.vis ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div className="text-center space-y-2 mb-12">
            <div className="inline-flex items-center space-x-2 bg-[#A8C66C]/15 border border-[#A8C66C]/30 text-[#A8C66C] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>Simple Claim Process</span>
            </div>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-white">
              How to Claim a Deal in 3 Steps
            </h2>
            <p className="font-poppins text-sm text-white/55 max-w-xl mx-auto">
              No app downloads or online payment gateways. Everything is confirmed directly with the local store owner.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-0.5 bg-gradient-to-r from-transparent via-[#A8C66C]/40 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01', icon: Sparkles, color: 'bg-[#F2C94C]', textColor: 'text-[#123B26]',
                  title: 'Choose Your Deal',
                  desc: 'Browse our active store promotions, bundles, or seasonal deals.',
                },
                {
                  step: '02', icon: MessageSquare, color: 'bg-[#25D366]', textColor: 'text-white',
                  title: 'Message on WhatsApp',
                  desc: 'Tap "Claim on WhatsApp" — your message is pre-filled with the deal title. Confirm details with the owner.',
                },
                {
                  step: '03', icon: Truck, color: 'bg-[#A8C66C]', textColor: 'text-[#123B26]',
                  title: 'Doorstep Delivery',
                  desc: 'Inspect your fresh groceries at your doorstep in Chitlapakkam and pay via Cash or UPI on delivery.',
                },
              ].map(({ step, icon: Icon, color, textColor, title, desc }, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="relative mb-6 z-10">
                    <div className={`w-20 h-20 rounded-full ${color} border-4 border-[#123B26] shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-8 h-8 ${textColor}`} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-[#123B26] text-[11px] font-black flex items-center justify-center border-2 border-[#123B26] shadow-sm">
                      {step}
                    </span>
                  </div>
                  <div className="bg-[#205C38]/50 border border-[#A8C66C]/20 rounded-2xl p-6 w-full hover:border-[#A8C66C]/40 hover:-translate-y-1 transition-all duration-300">
                    <h3 className="font-playfair text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="font-poppins text-xs text-white/65 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* §5  TRUST PILLARS FOOTER STRIP             */}
      {/* ══════════════════════════════════════════ */}
      <section className="bg-[#F7F5E8] border-t border-[#DCE8C8] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Leaf, label: '100% Pure & Natural', sub: 'Zero artificial polish or color' },
              { icon: CheckCircle2, label: 'Verified Quality', sub: 'Hand-inspected every batch' },
              { icon: Star, label: '4.9★ Neighborhood Rating', sub: 'Trusted by 500+ homes' },
              { icon: ShieldCheck, label: 'Pay on Delivery', sub: 'Cash or UPI at your door' },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex items-start space-x-3 bg-white rounded-2xl p-4 border border-[#DCE8C8] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#DCE8C8] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#205C38]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#123B26] leading-tight">{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deal Detail & Included Items Modal */}
      <DealDetailModal
        offer={selectedOffer}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOffer(null);
        }}
      />

    </div>
  );
};
