import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  Star,
  Truck,
  Heart,
  MessageSquare,
  Users,
  Package,
  Award,
  Zap,
  Quote,
  ChevronRight,
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { STORE_CONFIG } from '../config/storeConfig';

/* ─────────────────────────── AnimatedCounter ──────────────────────────── */
interface CounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}
const AnimatedCounter: React.FC<CounterProps> = ({
  target,
  suffix = '',
  duration = 1800,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

/* ───────────────────────────── DATA ARRAYS ─────────────────────────────── */
const PRODUCT_CATEGORIES = [
  {
    num: '01',
    title: 'Pulses & Lentils',
    tamilTitle: 'பருப்பு வகைகள்',
    desc: 'Unpolished Toor Dal, Urad Dal, Moong Dal, Kadalai Paruppu, and Rajma — protein-rich dals sourced for maximum nutrition and natural flavor.',
    items: ['Toor Dal', 'Urad Dal', 'Moong Dal', 'Kadalai Paruppu', 'Rajma'],
    image: '/images/pulses-and-lentils.jpg',
    tag: 'High Protein',
    category: 'pulses',
  },
  {
    num: '02',
    title: 'South Masalas',
    tamilTitle: 'தென்னிந்திய மசாலா',
    desc: 'Traditional South Indian spice blends ground in-house. Aromatic Sambar Powder, Pepper Rasam, authentic Biryani and Chicken Masalas.',
    items: ['Sambar Powder', 'Rasam Powder', 'Biryani Masala', 'Chicken Masala', 'Garam Masala'],
    image: '/images/south-masalas.jpg',
    tag: 'Stone-Ground',
    category: 'masalas',
  },
  {
    num: '03',
    title: 'Spices & Powders',
    tamilTitle: 'மசாலா தூள் & விதைகள்',
    desc: 'Pure Turmeric, Chilli, Coriander, Mustard, Black Pepper, Cumin, Fennel, and Fenugreek — with zero artificial colors or fillers.',
    items: ['Turmeric Powder', 'Red Chilli Powder', 'Coriander Powder', 'Cumin Seeds', 'Mustard'],
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
    tag: 'No Fillers',
    category: 'spices',
  },
  {
    num: '04',
    title: 'Nuts & Dry Fruits',
    tamilTitle: 'கொட்டை & உலர் பழங்கள்',
    desc: 'Whole Cashews, California Almonds, Seedless Black Raisins, and succulent Dates — hand-sorted for crunch, flavor, and freshness.',
    items: ['Whole Cashews', 'California Almonds', 'Black Raisins', 'Dates', 'Pista'],
    image: '/images/nuts-and-dry-fruits.jpg',
    tag: 'Fresh Harvest',
    category: 'nuts-dryfruits',
  },
  {
    num: '05',
    title: 'Rice & Grains',
    tamilTitle: 'அரிசி வகைகள்',
    desc: 'Clean parboiled Idli Rice and evenly roasted Sooji / Rava — staple grains for fluffy idlis, crispy dosas, and golden upma.',
    items: ['Idli Rice', 'Sooji / Rava'],
    image: '/images/rice-and-grains.jpg',
    tag: 'Fluffy Idlis',
    category: 'rice-grains',
  },
  {
    num: '06',
    title: 'Cooking Oils',
    tamilTitle: 'சமையல் எண்ணெய்',
    desc: 'Cold-pressed Sesame Oil, pure Coconut Oil, and double-filtered Refined Oil — authentic flavors trusted in South Indian kitchens for generations.',
    items: ['Sesame Oil', 'Coconut Oil', 'Refined Oil'],
    image: '/images/cooking-oils.jpg',
    tag: 'Cold Pressed',
    category: 'oils',
  },
];

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Purity First, Always',
    desc: 'Every product at Bensi Queen is selected with zero tolerance for artificial polish, synthetic colors, or chemical preservatives. What you receive is exactly what nature intended.',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Neighborhood Store',
    desc: 'We are proudly rooted in Chitlapakkam, Chennai — a friendly community grocery that knows your household preferences, respects your time, and grows with your family.',
  },
  {
    icon: Truck,
    title: 'Doorstep Delivery Promise',
    desc: 'Fresh dispatch every morning and evening across Chitlapakkam, Chromepet, Selaiyur, Tambaram, and surrounding areas. Cash or UPI accepted comfortably at your door.',
  },
  {
    icon: Heart,
    title: 'Community-Rooted Care',
    desc: 'Every order placed at Bensi Queen supports a local family business that has built its identity on honest pricing, clean products, and genuine neighborly service.',
  },
];

const TIMELINE = [
  {
    year: '2019',
    title: 'The Beginning',
    desc: 'Bensi Queen opened as a small neighborhood provisions store in Chitlapakkam, Jothi Nagar — serving a handful of trusted families with quality kitchen essentials.',
  },
  {
    year: '2021',
    title: 'Growing the Catalogue',
    desc: 'Expanded from core pulses and spices to include premium dry fruits, cold-pressed oils, traditional South Indian masalas, and household essentials — growing to 35+ products.',
  },
  {
    year: '2023',
    title: 'WhatsApp Ordering',
    desc: 'Launched a simple WhatsApp ordering system to serve busy families who could now order from home without visiting the store, with same-day doorstep delivery.',
  },
  {
    year: '2025',
    title: 'Online Store Launch',
    desc: 'Launched our full digital storefront to help Chennai families browse the complete catalogue, select custom pack weights, and place orders anytime — 24/7.',
  },
];

const SERVICE_AREAS = [
  'Chitlapakkam',
  'Tambaram Sanatorium',
  'Chromepet & MIT Road',
  'Hasthinapuram',
  'Selaiyur',
  'East Tambaram',
  'Pallavaram',
  'Medavakkam',
];

const TESTIMONIALS = [
  {
    name: 'Kavitha S.',
    location: 'Chitlapakkam',
    text: 'The Toor Dal is genuinely unpolished — the sambar turns out so much more aromatic than anything from a supermarket. Bensi Queen is now my permanent go-to store.',
    rating: 5,
  },
  {
    name: 'Murali R.',
    location: 'Chromepet',
    text: 'Ordered Cashew Nuts and California Almonds. They arrived the same evening, perfectly packed, super fresh. The WhatsApp ordering made everything so simple.',
    rating: 5,
  },
  {
    name: 'Priya N.',
    location: 'Selaiyur',
    text: 'The Sambar Powder smells exactly like home-ground masala. No artificial color, genuine flavor. I have been ordering monthly supplies for over a year now.',
    rating: 5,
  },
];

/* ════════════════════════════════════════════════════════════════════════ */
export const AboutPage: React.FC = () => {
  const handleWhatsApp = () => {
    const text = `Hello Bensi Queen! I would like to know more about your products and services.`;
    const url = `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#F7F5E8] text-[#123B26]">
      <SEOHead
        title="About Bensi Queen | Quality Groceries & Provisions — Chitlapakkam, Chennai"
        description="Bensi Queen is a trusted neighborhood grocery and provisions store in Chitlapakkam, Chennai. We supply unpolished pulses, stone-ground masalas, cold-pressed oils, premium dry fruits, and 35+ quality kitchen essentials with doorstep delivery across Chitlapakkam, Chromepet, Selaiyur, and Tambaram. Order easily on WhatsApp."
        canonical="https://bensiqueen.com/about"
        keywords="about bensi queen, chitlapakkam grocery store, unpolished pulses chitlapakkam, south indian spices chennai, doorstep grocery delivery chitlapakkam, quality kitchen essentials chennai, neighborhood grocery store tambaram, best grocery store chitlapakkam"
        image="https://bensiqueen.com/images/bensi-queen-shop.jpg"
        imageAlt="Bensi Queen Grocery Store in Chitlapakkam Chennai"
      />

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §1  CINEMATIC HERO WITH DARK GREEN GRADIENT                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-[#0A2318] via-[#123B26] to-[#1B4D31] text-white overflow-hidden py-20 sm:py-28">
        {/* Background texture blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full bg-[#A8C66C]/10 blur-3xl" />
          <div className="absolute bottom-[-100px] left-[-80px] w-[400px] h-[400px] rounded-full bg-[#205C38]/40 blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left — Story Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-[#A8C66C]/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#A8C66C]">
                <Leaf className="w-3.5 h-3.5" />
                <span>Our Story</span>
                <span className="text-white/40">•</span>
                <span className="text-white font-extrabold">Chitlapakkam, Chennai</span>
              </div>

              <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                Good Food Begins with{' '}
                <span className="text-[#A8C66C]">Good Choices.</span>
              </h1>

              <p className="font-mukta text-xl text-[#F2C94C] font-semibold">
                நல்ல உணவு, நல்ல தேர்வில் தொடங்குகிறது.
              </p>

              <p className="font-poppins text-sm sm:text-base text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                At <strong className="text-white">Bensi Queen</strong>, we are a family-rooted neighborhood grocery store in Chitlapakkam, Chennai — built on a simple promise: to bring your household the purest, most wholesome kitchen provisions, without shortcuts or compromises.
              </p>

              <p className="font-poppins text-sm text-white/70 leading-relaxed max-w-xl mx-auto lg:mx-0">
                From unpolished pulses and stone-ground spice masalas to cold-pressed cooking oils and hand-sorted premium dry fruits — every product on our shelves is selected to honor the authentic tastes of South Indian cooking traditions.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 text-[#123B26]" />
                  <span>Browse 35 Products</span>
                </Link>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>WhatsApp Us</span>
                </button>
              </div>
            </div>

            {/* Right — Photo with floating badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Main image */}
                <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 ring-4 ring-[#A8C66C]/20">
                  <img
                    src="/images/bensi-queen-shop.jpg"
                    alt="Bensi Queen authentic neighborhood provision store in Chitlapakkam, Chennai"
                    className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/pulses-and-lentils.jpg';
                    }}
                  />
                </div>

                {/* Floating stat badges */}
                <div className="absolute -top-4 -left-4 bg-[#F2C94C] text-[#123B26] rounded-2xl px-4 py-3 shadow-xl font-poppins">
                  <p className="text-2xl font-black leading-none">500+</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider">Happy Homes</p>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-[#123B26] text-white border border-[#A8C66C]/40 rounded-2xl px-4 py-3 shadow-xl font-poppins">
                  <p className="text-2xl font-black leading-none text-[#A8C66C]">35+</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">Kitchen Provisions</p>
                </div>

                {/* Rating badge */}
                <div className="absolute top-1/2 -right-5 -translate-y-1/2 bg-white text-[#123B26] rounded-2xl px-4 py-3 shadow-xl font-poppins border border-[#DCE8C8]">
                  <div className="flex items-center space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-[#F2C94C] fill-[#F2C94C]" />
                    ))}
                  </div>
                  <p className="text-xs font-black text-[#123B26] mt-0.5">4.9 Rating</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full" style={{ height: 48 }} fill="#F7F5E8">
            <path d="M0,48 L0,24 Q360,0 720,20 Q1080,40 1440,16 L1440,48 Z" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §2  ANIMATED STATS ROW                                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 bg-white border-b border-[#E8DFC8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E8DFC8]">
            {[
              { icon: Users, value: 500, suffix: '+', label: 'Happy Families', sublabel: 'Across Chitlapakkam & Chennai' },
              { icon: Package, value: 35, suffix: '+', label: 'Kitchen Provisions', sublabel: 'Pulses, Spices, Oils & More' },
              { icon: Truck, value: 7, suffix: ' Zones', label: 'Delivery Areas', sublabel: 'From Chitlapakkam to Pallavaram' },
              { icon: Award, value: 4, suffix: '.9 ★', label: 'Customer Rating', sublabel: 'Verified by Real Families' },
            ].map(({ icon: Icon, value, suffix, label, sublabel }, i) => (
              <div key={i} className="text-center px-4 py-4 sm:py-0 space-y-1.5">
                <div className="w-11 h-11 rounded-2xl bg-[#DCE8C8] text-[#205C38] flex items-center justify-center mx-auto">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
                  <AnimatedCounter target={value} suffix={suffix} />
                </p>
                <p className="font-poppins text-sm font-bold text-[#123B26]">{label}</p>
                <p className="font-poppins text-[11px] text-gray-500">{sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §3  OUR PHILOSOPHY & TRUST PILLARS                             */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[#F7F5E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[#205C38]">
              <Sparkles className="w-3.5 h-3.5 text-[#205C38]" />
              <span>What We Stand For</span>
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
              Our Philosophy of Purity & Service
            </h2>
            <p className="font-poppins text-sm text-gray-600 leading-relaxed">
              Four core commitments that have guided every product we stock and every delivery we make since day one.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRUST_PILLARS.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-7 border border-[#E8DFC8] shadow-sm hover:shadow-md hover:border-[#205C38]/40 transition-all duration-300 flex space-x-5"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#DCE8C8] to-[#A8C66C]/30 text-[#205C38] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-poppins text-base font-extrabold text-[#123B26]">{title}</h3>
                  <p className="font-poppins text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §4  PRODUCT CATEGORIES SHOWCASE                                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-white border-y border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[#205C38]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Store Catalogue</span>
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
              35+ Kitchen Provisions, 8 Categories
            </h2>
            <p className="font-poppins text-sm text-gray-600 leading-relaxed">
              A thoughtfully curated range of South Indian kitchen staples that bring authentic home-cooking flavors to your table, every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                to={`/products?category=${cat.category}`}
                className="group bg-[#FCFAF5] rounded-3xl border border-[#E8DFC8] overflow-hidden hover:shadow-xl hover:border-[#205C38]/40 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-[#F7F5E8]">
                  <img
                    src={cat.image}
                    alt={`${cat.title} - Bensi Queen grocery store`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#123B26]/70 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 font-poppins text-xs font-black text-white/60 bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20">
                    {cat.num}
                  </span>
                  <span className="absolute top-3 right-3 bg-[#F2C94C] text-[#123B26] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    {cat.tag}
                  </span>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-playfair text-lg font-bold text-white leading-tight">{cat.title}</h3>
                    <p className="font-mukta text-xs text-[#A8C66C] font-semibold">{cat.tamilTitle}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 flex-1">
                  <p className="font-poppins text-xs text-gray-600 leading-relaxed">{cat.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((item) => (
                      <span key={item} className="text-[10px] font-bold bg-[#DCE8C8] text-[#205C38] px-2 py-0.5 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 flex items-center text-xs font-bold text-[#205C38] group-hover:text-[#123B26] transition-colors">
                    <span>Browse {cat.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-[#A8C66C]" />
              <span>Explore Full Catalogue (35 Products)</span>
              <ArrowRight className="w-4 h-4 text-[#A8C66C]" />
            </Link>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §5  OUR STORY TIMELINE                                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[#F7F5E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-3">
            <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[#205C38]">
              <Zap className="w-3.5 h-3.5" />
              <span>Our Journey</span>
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
              How Bensi Queen Was Born & Grew
            </h2>
            <p className="font-poppins text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
              A neighborhood story of honest groceries, loyal families, and the quiet pursuit of quality every single day.
            </p>
          </div>

          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#A8C66C] via-[#DCE8C8] to-transparent hidden sm:block" />

            <div className="space-y-8">
              {TIMELINE.map((item, i) => (
                <div key={i} className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 pl-0 sm:pl-20">
                  {/* Year Node */}
                  <div className="hidden sm:flex absolute left-0 w-16 h-16 rounded-2xl bg-[#123B26] text-white items-center justify-center flex-shrink-0 font-playfair text-sm font-black shadow-lg border-2 border-[#A8C66C]/40">
                    {item.year}
                  </div>
                  <span className="sm:hidden inline-flex items-center bg-[#123B26] text-white text-xs font-black px-3 py-1.5 rounded-full w-fit">
                    {item.year}
                  </span>
                  <div className="bg-white rounded-2xl p-6 border border-[#E8DFC8] shadow-xs hover:shadow-md hover:border-[#205C38]/30 transition-all flex-1">
                    <h3 className="font-poppins text-base font-extrabold text-[#123B26]">{item.title}</h3>
                    <p className="font-poppins text-sm text-gray-600 leading-relaxed mt-1.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §6  3-STEP ORDERING ON DARK GREEN                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#123B26] to-[#0D2B1B] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#A8C66C]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#205C38]/30 blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-14">

          <div className="text-center space-y-3">
            <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[#A8C66C]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>How to Order</span>
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-white">
              Order Fresh Groceries in 3 Simple Steps
            </h2>
            <p className="font-poppins text-sm text-white/80 leading-relaxed max-w-xl mx-auto">
              No app required, no account to create, no prepayment needed. Just WhatsApp and your grocery list.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: ShoppingBag,
                title: 'Browse & Choose',
                desc: 'Explore 35+ kitchen provisions on our website. Pick your products and select pack weights from 100g to 1kg.',
                isWhatsApp: false,
              },
              {
                step: '02',
                icon: MessageSquare,
                title: 'Send on WhatsApp',
                desc: 'Share your grocery list via WhatsApp message or photo. Our team confirms your order and estimated delivery time instantly.',
                isWhatsApp: true,
              },
              {
                step: '03',
                icon: Truck,
                title: 'Fresh at Your Door',
                desc: 'Receive your packed, verified groceries at your doorstep. Pay by Cash or UPI only after inspecting your delivery.',
                isWhatsApp: false,
              },
            ].map(({ step, icon: Icon, title, desc, isWhatsApp }, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xs rounded-3xl p-7 border border-white/15 hover:bg-white/15 transition-all duration-300 relative">
                <div className="absolute -top-4 left-6 bg-[#F2C94C] text-[#123B26] text-sm font-black w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg">
                  {step}
                </div>
                <div className="mt-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#A8C66C]/20 text-[#A8C66C] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-poppins text-base font-extrabold text-white">{title}</h3>
                  <p className="font-poppins text-sm text-white/80 leading-relaxed">{desc}</p>
                  {i === 0 && (
                    <Link to="/products" className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#A8C66C] hover:text-white transition-colors">
                      <span>Browse Catalogue</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {isWhatsApp && (
                    <button type="button" onClick={handleWhatsApp} className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#A8C66C] hover:text-white transition-colors">
                      <span>Open WhatsApp</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §7  WHAT CUSTOMERS SAY                                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-white border-y border-[#E8DFC8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-3">
            <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[#205C38]">
              <Star className="w-3.5 h-3.5" />
              <span>Family Testimonials</span>
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
              Voices From Our Neighborhood
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#FCFAF5] rounded-3xl p-7 border border-[#E8DFC8] shadow-xs hover:shadow-md hover:border-[#205C38]/30 transition-all space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-[#F2C94C] fill-[#F2C94C]" />
                  ))}
                </div>
                <div className="relative pl-5">
                  <Quote className="w-5 h-5 text-[#A8C66C] absolute left-0 top-0" />
                  <p className="font-poppins text-sm text-gray-700 leading-relaxed italic">{t.text}</p>
                </div>
                <div className="pt-2 border-t border-[#E8DFC8] flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#DCE8C8] text-[#205C38] flex items-center justify-center font-black text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-poppins text-xs font-bold text-[#123B26]">{t.name}</p>
                    <p className="font-poppins text-[11px] text-gray-500 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-[#205C38]" />
                      <span>{t.location}</span>
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold text-[#205C38] bg-[#DCE8C8] px-2 py-0.5 rounded-full uppercase">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §8  DELIVERY SERVICE AREAS                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-[#F7F5E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Text side */}
            <div className="space-y-6">
              <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[#205C38]">
                <MapPin className="w-3.5 h-3.5" />
                <span>Delivery Coverage</span>
              </span>
              <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
                Serving Homes Across South Chennai
              </h2>
              <p className="font-poppins text-sm text-gray-600 leading-relaxed">
                Our dedicated dispatch team delivers fresh provisions to families across Chitlapakkam and neighboring areas. We run morning and evening delivery batches, Monday to Sunday, 7:00 AM – 9:30 PM.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {SERVICE_AREAS.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#205C38] flex-shrink-0" />
                    <span className="font-poppins text-sm text-[#123B26] font-semibold">{area}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-2 text-sm text-gray-700">
                <div className="flex items-start space-x-3">
                  <Clock className="w-4 h-4 text-[#205C38] flex-shrink-0 mt-0.5" />
                  <p><strong className="text-[#123B26]">Store Hours:</strong> {STORE_CONFIG.businessHours}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-[#205C38] flex-shrink-0 mt-0.5" />
                  <p><strong className="text-[#123B26]">Address:</strong> {STORE_CONFIG.address}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-[#205C38] flex-shrink-0 mt-0.5" />
                  <p><strong className="text-[#123B26]">Call / WhatsApp:</strong> {STORE_CONFIG.displayPhone}</p>
                </div>
              </div>
            </div>

            {/* Zone Status Card */}
            <div className="bg-white rounded-3xl border border-[#E8DFC8] overflow-hidden shadow-lg">
              <div className="bg-gradient-to-br from-[#123B26] to-[#205C38] p-6 text-white space-y-1">
                <h3 className="font-playfair text-xl font-bold">Bensi Queen</h3>
                <p className="font-mukta text-[#A8C66C] font-semibold text-sm">பென்ஸி குவீன் மளிகைக் கடை</p>
                <p className="text-xs text-white/80 mt-2">{STORE_CONFIG.address}</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { zone: 'Chitlapakkam', time: '30–45 mins', status: 'Active', active: true },
                  { zone: 'Chromepet & MIT Road', time: 'Within 1 hour', status: 'Active', active: true },
                  { zone: 'Selaiyur & Hasthinapuram', time: 'Morning & Evening Batch', status: 'Scheduled', active: false },
                  { zone: 'Tambaram Sanatorium', time: 'Evening Dispatch', status: 'Scheduled', active: false },
                ].map(({ zone, time, status, active }) => (
                  <div key={zone} className="flex items-center justify-between py-3 border-b border-[#F0EDE0] last:border-0">
                    <div>
                      <p className="font-poppins text-xs font-bold text-[#123B26]">{zone}</p>
                      <p className="font-poppins text-[11px] text-gray-500 mt-0.5">{time}</p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-[#F2C94C]'}`} />
                      <span className="text-[11px] font-bold text-gray-600">{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* §9  PACK SIZES & CLOSING CTA                                   */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#123B26] to-[#0D2B1B] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,198,108,0.08)_0%,_transparent_70%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">

          <div className="space-y-3">
            <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-[#A8C66C]">
              <Package className="w-3.5 h-3.5" />
              <span>Flexible Pack Sizes</span>
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-white">
              100g to 1kg — Your Pantry, Your Way
            </h2>
            <p className="font-poppins text-sm text-white/80 leading-relaxed max-w-2xl mx-auto">
              Every product is available in five pack weights: <strong className="text-white">100g, 200g, 500g, 750g, and 1kg</strong>. Whether you need a small trial pack or bulk monthly stocking, we have you covered with no minimum order requirement.
            </p>
          </div>

          {/* Pack size chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {['100g', '200g', '500g', '750g', '1kg'].map((w) => (
              <span key={w} className="font-poppins font-black text-sm px-5 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white backdrop-blur-xs">
                {w}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-[#123B26]" />
              <span>Browse All 35 Products</span>
            </Link>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>Order via WhatsApp</span>
            </button>
          </div>

          {/* Trust micro-row */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 text-xs text-white/70">
            {['✓ No Prepayment', '✓ Cash / UPI at Door', '✓ 7 AM – 9:30 PM Daily', '✓ Chitlapakkam Doorstep'].map((t) => (
              <span key={t} className="font-semibold">{t}</span>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
};
