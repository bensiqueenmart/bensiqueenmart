import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Truck,
  HeartHandshake,
  Tag,
  CheckCircle2,
  Layers,
  ShoppingBag,
  Star,
  MapPin,
  MessageSquare,
  FileText,
  Leaf,
  Clock,
  Phone,
  Award,
  Zap,
  Users,
  Package,
  Quote,
  ThumbsUp,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { useOffers } from '../context/OffersContext';
import { useReviews } from '../context/ReviewsContext';
import { SEOHead } from '../components/SEOHead';
import { DealCard } from '../components/DealCard';
import { DealDetailModal } from '../components/DealDetailModal';
import { HeroProductCarousel } from '../components/HeroProductCarousel';
import { STORE_CONFIG } from '../config/storeConfig';

/* ─────────────────────────── DATA ──────────────────────────── */

const FEATURED_CATEGORIES = [
  {
    id: 'pulses',
    name: 'Pulses & Lentils',
    tamilName: 'பருப்பு வகைகள்',
    count: 5,
    image: '/images/pulses-and-lentils.jpg',
    tag: 'High Protein',
  },
  {
    id: 'spices',
    name: 'Spices & Powders',
    tamilName: 'மசாலா வகைகள்',
    count: 9,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
    tag: 'Stone Milled',
  },
  {
    id: 'nuts-dryfruits',
    name: 'Nuts & Dry Fruits',
    tamilName: 'கொட்டை வகைகள்',
    count: 5,
    image: '/images/nuts-and-dry-fruits.jpg',
    tag: 'Fresh Harvest',
  },
  {
    id: 'masalas',
    name: 'South Masalas',
    tamilName: 'தென்னிந்திய மசாலா',
    count: 7,
    image: '/images/south-masalas.jpg',
    tag: 'Home Style',
  },
  {
    id: 'rice-grains',
    name: 'Rice & Grains',
    tamilName: 'அரிசி வகைகள்',
    count: 2,
    image: '/images/rice-and-grains.jpg',
    tag: 'Fluffy Idlis',
  },
  {
    id: 'oils',
    name: 'Cooking Oils',
    tamilName: 'சமையல் எண்ணெய்',
    count: 3,
    image: '/images/cooking-oils.jpg',
    tag: 'Cold Pressed',
  },
];

const DELIVERY_ZONES = [
  { area: 'Chitlapakkam', time: 'Within 30–45 mins', status: 'Available Now' },
  { area: 'Selaiyur & Hasthinapuram', time: 'Morning & Evening Batches', status: 'Daily Route' },
  { area: 'Chromepet & MIT Road', time: 'Within 1 hour', status: 'Available Now' },
  { area: 'Tambaram Sanatorium', time: 'Evening Dispatch', status: 'Scheduled' },
  { area: 'Medavakkam & Sembakkam', time: 'Daily Morning Dispatch', status: 'Scheduled' },
];

const COMPARISON_POINTS = [
  {
    feature: 'Processing Method',
    bensi: 'Naturally dried & unpolished with no chemical waxing',
    supermarket: 'Industrial chemical buffing for cosmetic shine',
  },
  {
    feature: 'Spices & Aroma',
    bensi: 'Stone-milled in small batches for natural oils & aroma',
    supermarket: 'High-heat industrial grinding that strips natural oils',
  },
  {
    feature: 'Ordering Experience',
    bensi: '1-tap WhatsApp chat with friendly local store owner',
    supermarket: 'Impersonal checkouts, app logins & payment gateway bugs',
  },
  {
    feature: 'Payment Safety',
    bensi: 'Zero online prepayment — Pay with Cash / UPI at your doorstep',
    supermarket: 'Mandatory upfront cards/wallets before order confirmation',
  },
  {
    feature: 'Freshness Guarantee',
    bensi: 'Daily morning and evening fresh neighborhood dispatch',
    supermarket: 'Months-old warehouse central distribution stock',
  },
];

const MARQUEE_ITEMS = [
  'Toor Dal', 'Chana Dal', 'Urad Dal', 'Moong Dal', 'Rajma',
  'Turmeric Powder', 'Red Chilli Powder', 'Coriander Powder', 'Cumin Seeds',
  'Cashew Nuts', 'Almonds', 'Pista', 'Raisins', 'Walnuts',
  'Basmati Rice', 'Sesame Oil', 'Coconut Oil', 'Mustard Seeds',
];

const RATING_BARS = [
  { stars: 5, pct: 85 },
  { stars: 4, pct: 12 },
  { stars: 3, pct: 3 },
  { stars: 2, pct: 0 },
  { stars: 1, pct: 0 },
];

/* ─────────────────────── FLOATING PARTICLE CONFIG ─────────── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  delay: number;
}

function generateParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    opacity: Math.random() * 0.4 + 0.1,
    speed: Math.random() * 18 + 10,
    drift: Math.random() * 8 - 4,
    delay: Math.random() * -20,
  }));
}

const HERO_PARTICLES = generateParticles(22);

/* ─────────────────── TYPEWRITER CYCLING HOOK ───────────────── */
const CYCLE_WORDS = ['Pure Pulses', 'Fresh Spices', 'Premium Nuts', 'Cold-Press Oils', 'Pantry Essentials'];

function useTypewriter(words: string[], typingSpeed = 70, pauseMs = 1800, deletingSpeed = 40) {
  const [displayed, setDisplayed] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');
  const charIdx = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const word = words[wordIdx];

    if (phase === 'typing') {
      if (charIdx.current < word.length) {
        timer = setTimeout(() => {
          setDisplayed(word.slice(0, charIdx.current + 1));
          charIdx.current++;
        }, typingSpeed);
      } else {
        timer = setTimeout(() => setPhase('pausing'), pauseMs);
      }
    } else if (phase === 'pausing') {
      timer = setTimeout(() => setPhase('deleting'), 100);
    } else {
      if (charIdx.current > 0) {
        timer = setTimeout(() => {
          setDisplayed(word.slice(0, charIdx.current - 1));
          charIdx.current--;
        }, deletingSpeed);
      } else {
        setWordIdx((i) => (i + 1) % words.length);
        setPhase('typing');
      }
    }
    return () => clearTimeout(timer);
  }, [displayed, phase, wordIdx, words, typingSpeed, pauseMs, deletingSpeed]);

  return displayed;
}

/* ─────────────── SCROLL FADE-IN HOOK ───────────────────────── */
function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─────────────────────── COUNT-UP HOOK ─────────────────────── */

function useCountUp(target: number, duration = 1600) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          setCount(Math.floor(p * target));
          if (p < 1) requestAnimationFrame(tick);
          else setCount(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { count, ref };
}

/* ─────────────────────── COMPONENT ─────────────────────────── */

export const HomePage: React.FC = () => {
  const { activeOffers } = useOffers();
  const { activeReviews } = useReviews();
  const navigate = useNavigate();

  // ── Live effects state ─────────────────────────────────────
  const typedWord = useTypewriter(CYCLE_WORDS);
  const heroFade = useFadeIn(0.05);
  const trustFade = useFadeIn(0.1);
  const catFade = useFadeIn(0.1);
  const offerFade = useFadeIn(0.1);
  const philFade = useFadeIn(0.1);
  const delivFade = useFadeIn(0.1);
  const howFade = useFadeIn(0.1);
  const compFade = useFadeIn(0.1);
  const qualFade = useFadeIn(0.1);
  const reviewFade = useFadeIn(0.1);
  const ctaFade = useFadeIn(0.1);
  const finalFade = useFadeIn(0.1);

  // Offer Detail Modal state
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleOpenDetails = (offer: any) => {
    setSelectedOffer(offer);
    setIsDetailModalOpen(true);
  };

  // "Open Now" live badge state
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const checkOpen = () => {
      const now = new Date();
      const h = now.getHours();
      setIsOpen(h >= 7 && h < 21.5); // 7 AM – 9:30 PM
    };
    checkOpen();
    const id = setInterval(checkOpen, 60_000);
    return () => clearInterval(id);
  }, []);

  // Review section filter state
  const [reviewFilter, setReviewFilter] = useState<'all' | 'verified' | '5stars'>('all');
  const [reviewPage, setReviewPage] = useState(0);

  // Delivery zone interactive checker
  const [selectedZone, setSelectedZone] = useState(DELIVERY_ZONES[0]);

  // Animated counters
  const productsCount = useCountUp(35);
  const homesCount = useCountUp(500);
  const yearsCount = useCountUp(5);

  // Filtered reviews
  const filteredReviews = activeReviews.filter((r) => {
    if (reviewFilter === 'verified') return r.verifiedPurchase;
    if (reviewFilter === '5stars') return r.rating === 5;
    return true;
  });

  const perPage = 3;
  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / perPage));
  const visibleReviews = filteredReviews.slice(reviewPage * perPage, reviewPage * perPage + perPage);

  const googleReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Bensi Queen Grocery store ${STORE_CONFIG.address}`
  )}`;

  return (
    <div className="bg-[#F7F5E8] text-[#123B26] overflow-x-hidden selection:bg-[#DCE8C8] selection:text-[#123B26]">
      {/* ── Global Live-Effect CSS ───────────────────────────────── */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-110vh) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(2.2); opacity: 0;   }
          100% { transform: scale(2.2); opacity: 0;   }
        }
        @keyframes pulseRingGreen {
          0%   { box-shadow: 0 0 0 0 rgba(37,211,102,0.55); }
          70%  { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
        }
        @keyframes gradShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .live-hero-bg {
          background: linear-gradient(135deg, #0A2318 0%, #123B26 35%, #205C38 65%, #123B26 100%);
          background-size: 300% 300%;
          animation: gradShift 10s ease infinite;
        }
        .fade-slide-up { animation: fadeSlideUp 0.65s ease both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .wa-pulse { animation: pulseRingGreen 1.8s infinite; }
        .cursor-blink::after {
          content: '|';
          display: inline-block;
          margin-left: 2px;
          animation: blink 0.85s step-end infinite;
          color: #A8C66C;
        }
        .spin-slow { animation: spinSlow 18s linear infinite; }
        .section-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .section-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .card-shimmer:hover::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
          background-size: 400px 100%;
          animation: shimmer 1.2s linear;
          pointer-events: none;
        }
      `}</style>
      <SEOHead
        title="Bensi Queen | Quality Pulses, Spices, Nuts & Groceries — Chitlapakkam, Chennai"
        description="Discover premium unpolished pulses, stone-milled spices, aromatic masalas, California almonds, and combo deals at Bensi Queen. Enjoy easy 1-tap WhatsApp ordering with doorstep delivery across Chitlapakkam, Chromepet, and Tambaram."
        canonical="https://bensiqueen.com/"
        keywords="Bensi Queen, grocery store chitlapakkam, grocery shop chennai, unpolished pulses, stone milled spices, nuts and dry fruits, toor dal, urad dal, turmeric powder, cashew nuts W240, combo deals grocery chennai, tambaram grocery delivery"
        image="https://bensiqueen.com/images/bensi-queen-logo.jpg"
        imageAlt="Bensi Queen Quality Groceries and Provisions in Chitlapakkam Chennai"
      />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §1  HERO SECTION — Rich, Layered, Innovative               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={heroFade.ref as React.RefObject<HTMLElement>} className="live-hero-bg relative text-white overflow-hidden min-h-[88vh] flex items-center">

        {/* ── Floating Particle Field ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {HERO_PARTICLES.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full bg-[#A8C66C]"
              style={{
                left: `${p.x}%`,
                bottom: '-10px',
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                animationName: 'floatUp',
                animationDuration: `${p.speed}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationDelay: `${p.delay}s`,
                // @ts-ignore CSS custom property
                '--drift': `${p.drift}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* ── Spinning decorative ring ── */}
        <div
          className="spin-slow absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full border border-[#A8C66C]/10 pointer-events-none"
          aria-hidden
        />
        <div
          className="spin-slow absolute -bottom-32 -left-32 w-[380px] h-[380px] rounded-full border border-[#A8C66C]/8 pointer-events-none"
          style={{ animationDirection: 'reverse' }}
          aria-hidden
        />

        {/* Ambient Graphic Layers */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div className="absolute top-1/4 left-10 w-[500px] h-[500px] rounded-full bg-[#A8C66C]/10 blur-[110px]" />
          <div className="absolute -top-20 -right-20 w-[640px] h-[640px] rounded-full bg-[#205C38]/60 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage: 'radial-gradient(circle, #A8C66C 1.5px, transparent 1.5px)',
              backgroundSize: '30px 30px',
            }}
          />
          <svg className="absolute -bottom-10 -left-10 w-80 h-80 opacity-[0.035]" viewBox="0 0 200 200" fill="white">
            <path d="M100,10 Q140,30 160,80 Q180,130 140,170 Q100,200 60,170 Q20,140 30,90 Q45,30 100,10Z" />
            <path d="M100,10 Q70,50 80,100 Q90,140 100,160 Q110,140 120,100 Q130,50 100,10Z" opacity="0.4" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10 w-full py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left Content Column */}
            <div className={`lg:col-span-7 flex flex-col items-start space-y-7 ${heroFade.visible ? 'fade-slide-up' : 'opacity-0'}`}>

              {/* Live Open / Closed Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center space-x-2 bg-[#A8C66C] text-[#123B26] text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-none shadow-sm">
                  <Leaf className="w-3.5 h-3.5 text-[#123B26]" />
                  <span>100% Organic Fresh Food</span>
                </span>
                <span className={`inline-flex items-center space-x-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${isOpen ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-red-500/10 border-red-400/40 text-red-300'}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isOpen ? '#39FF14' : '#f87171', animation: 'blink 1.2s step-end infinite' }} />
                  <span>{isOpen ? 'Open Now' : 'Closed'}</span>
                </span>
              </div>

              {/* Main Headline with typewriter */}
              <div className={`space-y-1 ${heroFade.visible ? 'fade-slide-up delay-100' : 'opacity-0'}`}>
                <h1 className="font-playfair font-black leading-[1.04] tracking-tight">
                  <span className="block text-5xl sm:text-6xl lg:text-7xl xl:text-[76px] text-white">
                    Fresh Foods,
                  </span>
                  <span className="block text-5xl sm:text-6xl lg:text-7xl xl:text-[76px] text-[#A8C66C]">
                    Pure Quality.
                  </span>
                </h1>
                {/* Typewriter line */}
                <p className="font-poppins text-sm font-semibold text-white/60 mt-2 cursor-blink min-h-[1.4em]">
                  {typedWord}
                </p>
              </div>

              {/* Subtitle */}
              <p className={`font-poppins text-sm sm:text-base text-white/75 max-w-xl leading-relaxed ${heroFade.visible ? 'fade-slide-up delay-200' : 'opacity-0'}`}>
                Thoughtfully gathered pulses, hand-inspected spices, crisp whole nuts and pantry essentials.
                Order in seconds through WhatsApp with zero online prepayment hassle.
              </p>

              {/* Action Buttons */}
              <div className={`flex flex-wrap items-center gap-3.5 pt-1 ${heroFade.visible ? 'fade-slide-up delay-300' : 'opacity-0'}`}>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="relative inline-flex items-center space-x-2.5 px-8 py-4 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-black/25 transition-all duration-200 active:scale-95 cursor-pointer group overflow-hidden"
                >
                  {/* shimmer sweep on hover */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <ShoppingBag className="w-4 h-4 text-[#123B26] relative z-10" />
                  <span className="relative z-10">Explore Pantry</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
                </button>

                <a
                  href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    'Hello Bensi Queen, I would like to inquire about grocery delivery in Chitlapakkam.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-pulse inline-flex items-center space-x-2 px-7 py-4 rounded-full border-2 border-white/25 hover:border-[#A8C66C]/70 bg-white/5 hover:bg-white/10 text-white hover:text-[#A8C66C] font-bold text-sm transition-all duration-200"
                >
                  <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>

              {/* Social Proof Strip */}
              <div className={`flex items-center gap-6 pt-3 border-t border-white/[0.12] w-full max-w-lg ${heroFade.visible ? 'fade-slide-up delay-400' : 'opacity-0'}`}>
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    {['L', 'K', 'M', 'R'].map((initial, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 border-[#123B26] flex items-center justify-center text-[10px] font-black ${i % 2 === 0 ? 'bg-[#A8C66C] text-[#123B26]' : 'bg-[#205C38] text-white'
                          }`}
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-white/70">
                    <span className="font-bold text-white">500+</span> Local Chennai Families
                  </div>
                </div>

                <div className="h-6 w-px bg-white/20" />

                <div className="flex items-center space-x-1.5 text-xs text-white/70">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-[#F2C94C] text-[#F2C94C]" />
                    ))}
                  </div>
                  <span className="font-extrabold text-white text-sm">4.9</span>
                  <span>(Verified)</span>
                </div>
              </div>

            </div>

            {/* Right Graphic Column — 35 Provisions Auto-Cycling Showcase */}
            <div className={`lg:col-span-5 relative flex items-center justify-center ${heroFade.visible ? 'fade-slide-up delay-500' : 'opacity-0'}`}>
              <HeroProductCarousel />
            </div>

          </div>
        </div>

        {/* Clean Architectural SVG Edge Wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full" style={{ height: 60 }} fill="#F7F5E8">
            <path d="M0,60 L0,30 Q180,0 360,20 Q540,40 720,15 Q900,0 1080,25 Q1260,45 1440,20 L1440,60 Z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §2  TRUST STRIP & LIVE DISPATCH TRACKER                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={trustFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${trustFade.visible ? 'visible' : ''} bg-white border-b border-[#E8DFC8] py-4 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E8DFC8]">
            {[
              { icon: Leaf, label: '100% Pure & Natural', sub: 'Zero artificial color or polish' },
              { icon: Clock, label: 'Mon–Sun 7:00 AM – 9:30 PM', sub: 'Daily morning & evening dispatch' },
              { icon: MapPin, label: 'Chitlapakkam, Chennai', sub: 'Friendly neighborhood store' },
              { icon: Phone, label: 'Direct WhatsApp Ordering', sub: 'Zero account or app required' },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex items-center space-x-3 px-3 sm:px-6 py-2">
                <div className="w-10 h-10 rounded-full bg-[#DCE8C8] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#205C38]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#123B26] leading-tight">{label}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §3  EXPLORE CATEGORIES                                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={catFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${catFade.visible ? 'visible' : ''} py-16 sm:py-20 bg-[#F7F5E8]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center space-x-1.5 text-[11px] font-black uppercase tracking-widest text-[#205C38]">
                <Sparkles className="w-3.5 h-3.5 text-[#205C38]" />
                <span>Store Catalog</span>
              </span>
              <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
                Explore Categories
              </h2>
              <p className="font-poppins text-sm text-gray-600 max-w-lg">
                Freshly milled South Indian spices, hand-inspected unpolished dals, premium nuts, and kitchen staples.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center space-x-2 text-xs font-bold text-[#123B26] hover:text-[#205C38] border-2 border-[#123B26] hover:bg-[#123B26] hover:text-white px-5 py-2.5 rounded-full transition-all duration-200 self-start sm:self-auto"
            >
              <span>View All 35 Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="card-shimmer group relative bg-white rounded-2xl overflow-hidden border border-[#DCE8C8] hover:border-[#205C38] hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="h-32 overflow-hidden bg-[#F7F5E8] relative">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <span className="absolute top-2 right-2 bg-[#123B26] text-[#A8C66C] text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      {cat.count} Items
                    </span>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <span className="text-[9px] font-bold text-[#205C38] uppercase tracking-wider block">
                      {cat.tag}
                    </span>
                    <h3 className="font-poppins text-xs sm:text-sm font-bold text-[#123B26] group-hover:text-[#205C38] transition-colors leading-tight">
                      {cat.name}
                    </h3>
                    <p className="font-mukta text-[11px] text-[#205C38]/80 font-medium">
                      {cat.tamilName}
                    </p>
                  </div>
                </div>

                <div className="px-3.5 pb-3 pt-1 flex items-center justify-between border-t border-gray-100 text-[11px] font-bold text-[#205C38]">
                  <span>Browse</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §4  EXCLUSIVE COMBO OFFERS (Directly Below Categories)    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={offerFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${offerFade.visible ? 'visible' : ''} py-16 sm:py-20 bg-[#123B26] text-white relative overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#205C38]/50" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-[#A8C66C]/8 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #A8C66C 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-5 border-b border-white/10 gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 bg-[#F2C94C]/15 border border-[#F2C94C]/30 rounded-full px-4 py-1.5">
                <Tag className="w-3.5 h-3.5 text-[#F2C94C]" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#F2C94C]">
                  Special Promotions & Bundles
                </span>
              </div>
              <h2 className="font-playfair text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                Exclusive Combo Offers
              </h2>
              <p className="font-poppins text-sm text-white/60 max-w-lg">
                Curated pantry packages, volume savings and seasonal customer promotions — fresh deals every week.
              </p>
            </div>

            <Link
              to="/offers"
              className="inline-flex items-center space-x-2 text-xs font-bold text-[#F2C94C] hover:text-white uppercase tracking-wider bg-[#205C38]/60 hover:bg-[#205C38] px-5 py-3 rounded-full border border-[#A8C66C]/25 hover:border-[#A8C66C]/50 transition-all duration-200 self-start md:self-auto flex-shrink-0"
            >
              <span>View All Offers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeOffers.length > 0 ? (
            <div className="space-y-6">
              {/* Featured (first) deal — wide horizontal card */}
              {activeOffers[0] && (
                <DealCard
                  key={activeOffers[0].id}
                  offer={activeOffers[0]}
                  variant="featured"
                  onOpenDetails={handleOpenDetails}
                />
              )}
              {/* Remaining deals — 2-column compact grid */}
              {activeOffers.slice(1, 3).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeOffers.slice(1, 3).map((offer) => (
                    <DealCard
                      key={offer.id}
                      offer={offer}
                      variant="compact"
                      onOpenDetails={handleOpenDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#205C38]/40 border border-[#A8C66C]/20 rounded-3xl p-12 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#A8C66C]/20 flex items-center justify-center mx-auto mb-4">
                <Tag className="w-7 h-7 text-[#A8C66C] opacity-70" />
              </div>
              <h3 className="font-playfair text-xl font-bold text-white mb-2">Exciting Offers Coming Soon</h3>
              <p className="text-sm text-white/55 font-poppins">
                Stay connected for seasonal deals, festive packages and volume bundles.
              </p>
              <Link
                to="/offers"
                className="mt-6 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#A8C66C] text-[#123B26] font-bold text-sm hover:bg-[#97b55b] transition-all"
              >
                <span>Check Offers Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §5  OUR PHILOSOPHY (Directly Below Combo Offers)          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={philFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${philFade.visible ? 'visible' : ''} py-16 sm:py-24 bg-[#F7F5E8] relative overflow-hidden`}>
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#DCE8C8]/60 pointer-events-none" aria-hidden />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Graphic Column with Floating Count-up Stats */}
            <div className="relative order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] group bg-[#123B26]/10">
                <img
                  src="/images/bensi-queen-shop.jpg"
                  alt="Bensi Queen authentic neighborhood provision store in Chitlapakkam, Chennai"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/pulses-and-lentils.jpg';
                  }}
                />
              </div>

              {/* Floating Stat 1 — Products */}
              <div className="absolute -bottom-5 -right-3 sm:-right-6 bg-[#123B26] text-white rounded-2xl px-6 py-4 shadow-2xl border border-[#205C38] flex flex-col items-center">
                <div ref={productsCount.ref} className="font-playfair text-3xl font-black text-[#A8C66C] leading-none">
                  {productsCount.count}+
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mt-0.5">Kitchen Staples</p>
              </div>

              {/* Floating Stat 2 — Happy Homes */}
              <div className="absolute -top-4 -left-3 sm:-left-6 bg-[#F2C94C] text-[#123B26] rounded-2xl px-6 py-4 shadow-2xl flex flex-col items-center">
                <div ref={homesCount.ref} className="font-playfair text-3xl font-black leading-none">
                  {homesCount.count}+
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mt-0.5">Happy Homes</p>
              </div>

              {/* Floating Stat 3 — Years Serving */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-7 bg-white border border-[#DCE8C8] text-[#123B26] rounded-2xl px-5 py-3.5 shadow-xl hidden lg:flex flex-col items-center">
                <div ref={yearsCount.ref} className="font-playfair text-2xl font-black text-[#205C38] leading-none">
                  {yearsCount.count}+
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">Years Trusted</p>
              </div>
            </div>

            {/* Right Story Text Column */}
            <div className="space-y-6 order-1 lg:order-2">
              <span className="inline-flex items-center space-x-1.5 text-[11px] font-black uppercase tracking-widest text-[#205C38]">
                <Leaf className="w-3.5 h-3.5" />
                <span>Our Philosophy</span>
              </span>

              <h2 className="font-playfair text-4xl sm:text-5xl font-extrabold text-[#123B26] leading-[1.1]">
                Good Food.<br />
                <span className="text-[#205C38]">Happy Home.</span>
              </h2>

              <p className="font-poppins text-base text-gray-700 leading-relaxed">
                At Bensi Queen, we bring together everyday grocery essentials, quality unpolished pulses, aromatic stone-milled
                spices and delicious whole nuts to make your kitchen shopping pure and effortless.
              </p>

              <p className="font-poppins text-sm text-gray-600 leading-relaxed">
                We believe that authentic family health begins with untouched ingredients. That is why our products are curated
                with meticulous care — ensuring every bag of dal, bottle of oil, and packet of pepper meets the highest standard of nourishment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Award, text: 'Trusted Suppliers' },
                  { icon: Leaf, text: 'Zero Chemical Wax' },
                  { icon: Zap, text: 'Pay on Delivery' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center space-x-2.5 bg-white border border-[#DCE8C8] rounded-xl px-4 py-3 shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-[#DCE8C8] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[#205C38]" />
                    </div>
                    <span className="text-xs font-bold text-[#123B26]">{text}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/about"
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-full bg-[#123B26] hover:bg-[#205C38] text-white text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                <span>Learn More About Us</span>
                <ArrowRight className="w-4 h-4 text-[#A8C66C]" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §6  INTERACTIVE DELIVERY ZONE CHECKER                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={delivFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${delivFade.visible ? 'visible' : ''} py-14 bg-[#205C38] text-white relative overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            <div className="lg:col-span-5 space-y-2">
              <span className="text-[11px] font-black text-[#A8C66C] uppercase tracking-widest flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Local Neighborhood Service</span>
              </span>
              <h3 className="font-playfair text-2xl sm:text-3xl font-extrabold">
                Fast Doorstep Delivery in Chitlapakkam & Chromepet
              </h3>
              <p className="font-poppins text-xs sm:text-sm text-white/75 leading-relaxed">
                Check delivery schedules for your street or neighborhood. Orders confirmed on WhatsApp within minutes.
              </p>
            </div>

            <div className="lg:col-span-7 bg-[#123B26] rounded-2xl p-5 border border-[#A8C66C]/30 shadow-xl space-y-4">
              <div className="text-xs font-bold text-[#A8C66C] uppercase tracking-wider">
                Select your area to see delivery schedule:
              </div>

              <div className="flex flex-wrap gap-2">
                {DELIVERY_ZONES.map((zone) => (
                  <button
                    key={zone.area}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedZone.area === zone.area
                        ? 'bg-[#A8C66C] text-[#123B26] font-bold shadow-sm'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                  >
                    {zone.area}
                  </button>
                ))}
              </div>

              <div className="bg-[#205C38]/50 rounded-xl p-3.5 border border-[#A8C66C]/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                    <span>{selectedZone.area}: {selectedZone.status}</span>
                  </p>
                  <p className="text-xs text-[#A8C66C] mt-0.5">
                    Estimated Time: {selectedZone.time} · Free Doorstep Delivery
                  </p>
                </div>

                <a
                  href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Hello Bensi Queen, I would like to order groceries to ${selectedZone.area}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-sm flex-shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Order for {selectedZone.area.split(' ')[0]}</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §8  HOW IT WORKS (Simple 3-Step Experience)               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={howFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${howFade.visible ? 'visible' : ''} py-16 sm:py-20 bg-[#F7F5E8]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center space-y-3 mb-14">
            <span className="inline-flex items-center space-x-2 bg-[#DCE8C8] border border-[#A8C66C]/40 text-[#205C38] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>Simple Shopping Experience</span>
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#123B26]">
              How Shopping Works at Bensi Queen
            </h2>
            <p className="font-poppins text-sm text-gray-600 max-w-xl mx-auto">
              Wholesome kitchen groceries delivered with zero payment hassle. No complicated account logins or advance online card charges.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-0.5 bg-gradient-to-r from-[#DCE8C8] via-[#A8C66C]/60 to-[#DCE8C8]" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: ShoppingBag,
                  title: 'Browse & Pick Staples',
                  desc: 'Explore 35 kitchen provisions — unpolished pulses, stone-milled spices and premium crunchy nuts. Select weights from 100g to 1kg.',
                  badge: '35 Clean Provisions',
                },
                {
                  step: '02',
                  icon: FileText,
                  title: 'Review Cart & Instant PDF',
                  desc: 'Review selected items in the slide-out cart. Instantly download or print an itemized PDF packing summary for your household.',
                  badge: 'Zero Hidden Charges',
                },
                {
                  step: '03',
                  icon: Truck,
                  title: '1-Tap WhatsApp Delivery',
                  desc: 'Send your cart summary directly via WhatsApp. Order confirmed immediately — delivered fresh to your Chitlapakkam doorstep.',
                  badge: 'Pay Cash / UPI at Door',
                },
              ].map(({ step, icon: Icon, title, desc, badge }, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="relative mb-6 z-10">
                    <div className="w-20 h-20 rounded-full bg-[#123B26] border-4 border-white shadow-lg flex items-center justify-center group-hover:bg-[#205C38] transition-colors duration-300">
                      <Icon className="w-8 h-8 text-[#A8C66C]" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#A8C66C] text-[#123B26] text-[11px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                      {step}
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-[#E8DFC8] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 w-full">
                    <h3 className="font-playfair text-xl font-bold text-[#123B26] mb-2">{title}</h3>
                    <p className="font-poppins text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">{desc}</p>
                    <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-[#205C38] bg-[#DCE8C8] px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-[#205C38]" />
                      <span>{badge}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §9  NEW FEATURE: BENSI QUEEN VS COMMERCIAL SUPERMARKETS   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={compFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${compFade.visible ? 'visible' : ''} py-16 sm:py-20 bg-[#E8DFC8]/40 border-y border-[#DCE8C8]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center space-y-2 mb-12">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#205C38]">
              The Neighborhood Difference
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
              Why Local Beats Commercial Supermarkets
            </h2>
            <p className="font-poppins text-sm text-gray-600 max-w-xl mx-auto">
              How Bensi Queen provides higher quality, fresher harvests, and genuine neighborhood service.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#DCE8C8] shadow-card overflow-hidden">
            <div className="grid grid-cols-12 bg-[#123B26] text-white p-4 sm:p-5 text-xs font-bold uppercase tracking-wider">
              <div className="col-span-4 sm:col-span-3">Pantry Quality Metric</div>
              <div className="col-span-4 sm:col-span-5 text-[#A8C66C] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#A8C66C]" />
                <span>Bensi Queen Standards</span>
              </div>
              <div className="col-span-4 sm:col-span-4 text-white/50">Commercial Supermarkets</div>
            </div>

            <div className="divide-y divide-gray-100 font-poppins text-xs sm:text-sm">
              {COMPARISON_POINTS.map((pt, i) => (
                <div key={i} className="grid grid-cols-12 p-4 sm:p-5 items-center hover:bg-[#F7F5E8]/60 transition-colors">
                  <div className="col-span-4 sm:col-span-3 font-bold text-[#123B26]">
                    {pt.feature}
                  </div>
                  <div className="col-span-4 sm:col-span-5 text-[#123B26] font-semibold flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#205C38] mt-1.5 flex-shrink-0" />
                    <span>{pt.bensi}</span>
                  </div>
                  <div className="col-span-4 sm:col-span-4 text-gray-500 text-xs">
                    {pt.supermarket}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §10 QUALITY PROMISE & BENTO GRID                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={qualFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${qualFade.visible ? 'visible' : ''} py-16 sm:py-20 bg-[#F7F5E8]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center space-y-2 mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#205C38]">
              Our Guarantee
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
              Why Choose Bensi Queen?
            </h2>
            <p className="font-poppins text-sm text-gray-500 max-w-xl mx-auto">
              We stand for wholesome quality, unadulterated purity, and friendly neighborhood convenience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
            {/* Featured Card */}
            <div className="lg:col-span-2 bg-[#123B26] text-white rounded-3xl p-8 flex flex-col justify-between min-h-[220px] group relative overflow-hidden shadow-xl">
              <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-[#205C38]/60 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-[#A8C66C]/20 border border-[#A8C66C]/30 flex items-center justify-center mb-4 relative z-10">
                <CheckCircle2 className="w-7 h-7 text-[#A8C66C]" />
              </div>
              <div className="relative z-10 space-y-1">
                <h3 className="font-playfair text-xl font-bold text-white">Handpicked Quality</h3>
                <p className="text-xs sm:text-sm text-white/70 font-poppins leading-relaxed">
                  Hand-inspected pulses and naturally dried whole spices with zero artificial coloring or polish.
                </p>
              </div>
            </div>

            {/* Other 4 Cards */}
            {[
              { icon: Layers, title: 'Wide Variety', desc: '35 kitchen essentials across 8 categories in multiple weights.' },
              { icon: Truck, title: 'Convenient Ordering', desc: 'Instant WhatsApp order submission and packing summary downloads.' },
              { icon: HeartHandshake, title: 'Friendly Care', desc: 'Direct owner contact with no payment gateway friction.' },
              { icon: Leaf, title: 'Kitchen Essentials', desc: 'All your daily dals, oils, and nuts in 100g to 1kg sizes.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="lg:col-span-1 bg-white rounded-2xl p-6 border border-[#DCE8C8] shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start space-y-3 group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#A8C66C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />
                <div className="w-12 h-12 rounded-xl bg-[#123B26] group-hover:bg-[#205C38] transition-colors duration-300 flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6 text-[#A8C66C]" />
                </div>
                <h3 className="font-poppins text-sm font-bold text-[#123B26]">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-poppins">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §11 SCROLLING PRODUCT TICKER MARQUEE                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#123B26] py-3.5 overflow-hidden border-y border-[#205C38]">
        <div className="flex items-center space-x-6 whitespace-nowrap" style={{ animation: 'marquee 28s linear infinite' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center space-x-3 text-[11px] font-semibold text-[#A8C66C]/75 uppercase tracking-wider flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8C66C]/60 flex-shrink-0" />
              <span>{item}</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §12 COMPLETELY REDESIGNED CUSTOMER REVIEWS SHOWCASE       */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={reviewFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${reviewFade.visible ? 'visible' : ''} relative bg-[#123B26] text-white overflow-hidden py-20 sm:py-24`}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#205C38]/40" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-[#A8C66C]/8" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, #A8C66C 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-white/10 gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 bg-[#205C38]/70 border border-[#A8C66C]/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#A8C66C]">
                <Star className="w-3.5 h-3.5 fill-[#F2C94C] text-[#F2C94C]" />
                <span>WHAT OUR CUSTOMERS SAY</span>
              </div>
              <h2 className="font-playfair text-3xl sm:text-5xl font-extrabold text-white">
                Good Food, Happy Homes, Happy Customers.
              </h2>
              <p className="font-poppins text-xs sm:text-sm text-white/60 max-w-xl">
                Genuine, owner-verified feedback from households in Chitlapakkam, Chromepet, and South Chennai.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 bg-[#205C38]/50 p-1.5 rounded-full border border-[#A8C66C]/20 self-start md:self-auto">
              {[
                { id: 'all', label: `All (${activeReviews.length})` },
                { id: 'verified', label: 'Verified Orders' },
                { id: '5stars', label: '5-Star Ratings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setReviewFilter(tab.id as typeof reviewFilter);
                    setReviewPage(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${reviewFilter === tab.id
                      ? 'bg-[#A8C66C] text-[#123B26] font-bold shadow-sm'
                      : 'text-white/70 hover:text-white'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Scorecard Card (4 cols) */}
              <div className="lg:col-span-4 bg-[#205C38]/50 border border-[#A8C66C]/25 rounded-3xl p-7 flex flex-col items-center text-center space-y-4">
                <span className="font-playfair text-[76px] font-black text-[#A8C66C] leading-none">
                  4.9
                </span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 fill-[#F2C94C] text-[#F2C94C]" />
                  ))}
                </div>
                <p className="text-xs text-white/60 font-poppins">
                  Based on <span className="text-white font-bold">{activeReviews.length}</span> verified customer reviews
                </p>

                {/* Rating Bar Distribution */}
                <div className="w-full pt-3 space-y-2">
                  {RATING_BARS.map(({ stars, pct }) => (
                    <div key={stars} className="flex items-center space-x-2.5 text-xs">
                      <span className="w-3 text-right font-bold text-white/50">{stars}</span>
                      <Star className="w-3 h-3 fill-[#F2C94C] text-[#F2C94C] flex-shrink-0" />
                      <div className="flex-1 h-1.5 bg-[#123B26] rounded-full overflow-hidden">
                        <div className="h-full bg-[#F2C94C] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-7 text-right text-[11px] text-white/40">{pct}%</span>
                    </div>
                  ))}
                </div>

                <div className="w-full pt-5 border-t border-white/10 space-y-2.5">
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#123B26]" />
                    <span>Review on Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <p className="text-[11px] text-white/40 flex items-center justify-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#A8C66C]" />
                    <span>100% Genuine Owner-Approved Feedback</span>
                  </p>
                </div>
              </div>

              {/* Right Reviews Grid (8 cols) */}
              <div className="lg:col-span-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {visibleReviews.map((review, i) => (
                    <div
                      key={review.id}
                      className={`bg-[#205C38]/40 border border-[#A8C66C]/20 rounded-2xl p-6 hover:border-[#A8C66C]/50 hover:-translate-y-1 hover:bg-[#205C38]/60 transition-all duration-300 flex flex-col justify-between space-y-4 relative ${i === 0 ? 'md:col-span-2' : ''
                        }`}
                    >
                      <Quote className="absolute top-4 right-4 w-9 h-9 text-[#A8C66C]/10 rotate-180 pointer-events-none" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${s <= review.rating ? 'fill-[#F2C94C] text-[#F2C94C]' : 'text-white/20'
                                  }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-white/70 ml-1.5">{review.rating}.0</span>
                          </div>

                          {review.verifiedPurchase && (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#A8C66C] bg-[#A8C66C]/15 border border-[#A8C66C]/30 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#39FF14]" />
                              <span>Verified Order</span>
                            </span>
                          )}
                        </div>

                        <p className="font-poppins text-xs sm:text-sm text-white/80 leading-relaxed italic">
                          &ldquo;{review.reviewText}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-[#A8C66C] flex items-center justify-center flex-shrink-0 text-[#123B26] font-black text-sm">
                            {review.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{review.authorName}</p>
                            <p className="text-[11px] text-[#A8C66C]/80 mt-0.5">{review.location}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-0.5">
                          <span className="text-[10px] text-white/40">{review.reviewDate}</span>
                          <span className="text-[10px] text-white/50 flex items-center space-x-0.5">
                            <ThumbsUp className="w-2.5 h-2.5 text-[#A8C66C]" />
                            <span>Helpful</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalReviewPages > 1 && (
                  <div className="flex items-center justify-between pt-3">
                    <p className="text-xs text-white/40">
                      Showing page {reviewPage + 1} of {totalReviewPages}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                        disabled={reviewPage === 0}
                        className="p-2 rounded-full bg-[#205C38] hover:bg-[#205C38]/80 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        aria-label="Previous reviews page"
                      >
                        <ChevronLeft className="w-4 h-4 text-[#A8C66C]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewPage((p) => Math.min(totalReviewPages - 1, p + 1))}
                        disabled={reviewPage === totalReviewPages - 1}
                        className="p-2 rounded-full bg-[#205C38] hover:bg-[#205C38]/80 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        aria-label="Next reviews page"
                      >
                        <ChevronRight className="w-4 h-4 text-[#A8C66C]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[#205C38]/40 border border-[#A8C66C]/20 rounded-3xl p-14 text-center max-w-lg mx-auto space-y-3">
              <MessageSquare className="w-10 h-10 text-[#A8C66C] mx-auto opacity-70" />
              <h3 className="font-playfair text-xl font-bold text-white">No Reviews in this Filter</h3>
              <p className="text-xs text-white/60">
                Customer reviews appear here once verified and published by the owner.
              </p>
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className="mt-3 px-5 py-2 rounded-full bg-[#A8C66C] text-[#123B26] font-bold text-xs uppercase"
              >
                Reset Filters
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §13 DIRECT WHATSAPP ORDER CALLOUT BANNER                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={ctaFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${ctaFade.visible ? 'visible' : ''} bg-gradient-to-r from-[#1b5e39] via-[#207044] to-[#1b5e39] py-12 relative overflow-hidden text-white border-t border-[#A8C66C]/20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

            <div className="flex items-center space-x-5 text-center lg:text-left">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                <MessageSquare className="w-8 h-8 text-[#25D366]" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-[#A8C66C]">
                  <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" />
                  <span>Immediate Owner Confirmation</span>
                </div>
                <h3 className="font-playfair text-2xl sm:text-3xl font-extrabold">
                  Order Directly Through WhatsApp
                </h3>
                <p className="font-poppins text-xs sm:text-sm text-white/75 max-w-xl">
                  No payment gate bugs or app downloads. Send your grocery list, get the weight & price confirmed immediately.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 flex-shrink-0">
              <a
                href={`tel:${STORE_CONFIG.phone}`}
                className="px-6 py-3.5 rounded-full border border-white/30 hover:border-white text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Call {STORE_CONFIG.displayPhone}
              </a>

              <a
                href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  'Hello Bensi Queen, I would like to place an order for groceries.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-pulse inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* §14 FINAL PROMOTIONAL CALL TO ACTION                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section ref={finalFade.ref as React.RefObject<HTMLElement>} className={`section-reveal ${finalFade.visible ? 'visible' : ''} py-20 bg-[#123B26] text-white relative overflow-hidden text-center`}>
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #A8C66C 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <span className="inline-flex items-center space-x-2 bg-[#205C38] border border-[#A8C66C]/30 text-[#A8C66C] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>Ready to Cook Something Delicious?</span>
          </span>

          <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Make Every Meal Special<br />
            <span className="text-[#A8C66C]">with Bensi Queen.</span>
          </h2>

          <p className="font-poppins text-sm sm:text-base text-white/65 max-w-xl mx-auto leading-relaxed">
            Browse our complete 35-item grocery catalogue, choose your required pack weights, and place your order directly via WhatsApp.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/products"
              className="inline-flex items-center space-x-2.5 px-9 py-4 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold text-sm uppercase tracking-wider shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Start Shopping</span>
            </Link>

            <a
              href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                'Hello Bensi Queen, I would like to place a grocery order.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2.5 px-7 py-4 rounded-full border border-white/20 hover:border-[#A8C66C]/60 text-white/80 hover:text-[#A8C66C] font-semibold text-sm transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Order via WhatsApp</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/[0.08]">
            {[
              { n: '35+', l: 'Quality Provisions' },
              { n: '500+', l: 'Happy Homes' },
              { n: '4.9★', l: 'Verified Rating' },
              { n: '8', l: 'Clean Categories' },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <p className="font-playfair text-xl font-black text-[#A8C66C]">{n}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mt-0.5">{l}</p>
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
