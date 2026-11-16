import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 'dry-fruits',
    primary: '/images/hero/dry-fruits-hero.jpg',
    fallback: '/images/nuts-and-dry-fruits.jpg',
    alt: 'Premium sun-dried fruits collection',
  },
  {
    id: 'whole-nuts',
    primary: '/images/hero/whole-nuts-hero.jpg',
    fallback: '/images/Almond.jpg',
    alt: 'Crisp whole nuts assortment',
  },
  {
    id: 'aromatic-spices',
    primary: '/images/hero/aromatic-spices-hero.jpg',
    fallback: '/images/south-masalas.jpg',
    alt: 'Whole aromatic spices and seeds',
  },
  {
    id: 'masala-powders',
    primary: '/images/hero/masala-powders-hero.jpg',
    fallback: '/images/turmeric-powder.jpg',
    alt: 'Freshly ground stone-milled masala powders',
  },
  {
    id: 'pulses-lentils',
    primary: '/images/hero/pulses-lentils-hero.jpg',
    fallback: '/images/pulses-and-lentils.jpg',
    alt: 'Pure unpolished lentils and pulses',
  },
];

export const HeroProductCarousel: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  const total = HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Slow, smooth transition every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <div
      className="relative z-10 flex flex-col items-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartRef.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartRef.current === null) return;
        const diff = touchStartRef.current - e.changedTouches[0].clientX;
        if (diff > 40) nextSlide();
        if (diff < -40) prevSlide();
        touchStartRef.current = null;
      }}
    >
      {/* ── Keyframe for Slow Gliding Hover ── */}
      <style>{`
        @keyframes slowGlidingHover {
          0% {
            transform: scale(1.02) translate(0px, 0px);
          }
          50% {
            transform: scale(1.08) translate(-6px, -4px);
          }
          100% {
            transform: scale(1.05) translate(4px, -2px);
          }
        }
        .slow-gliding-image {
          animation: slowGlidingHover 9s ease-in-out infinite alternate;
        }
      `}</style>

      {/* ── Ambient Outer Glow Rings ── */}
      <div className="absolute w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] rounded-full bg-gradient-to-tr from-[#A8C66C]/20 via-[#205C38]/15 to-transparent border border-[#A8C66C]/25 -z-0 pointer-events-none animate-pulse" />
      <div className="absolute w-[440px] h-[440px] sm:w-[520px] sm:h-[520px] rounded-full border border-white/[0.05] -z-0 pointer-events-none" />

      {/* ── Main Showcase Frame (Pure Photography, Zero Text/Names) ── */}
      <div
        onClick={() => navigate('/products')}
        className="relative z-10 w-72 h-80 sm:w-88 sm:h-96 lg:w-[410px] lg:h-[430px] rounded-3xl overflow-hidden border-4 border-white/25 shadow-2xl shadow-black/60 bg-[#123B26]/80 backdrop-blur-md cursor-pointer group transition-all duration-500 hover:border-[#A8C66C]/70 hover:shadow-black/80"
        title="Explore all provisions at Bensi Queen"
      >
        {/* All 5 Images stacked for seamless cross-fade */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out overflow-hidden ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.primary}
                alt={slide.alt}
                className={`w-full h-full object-cover transition-transform duration-1000 ${
                  isActive ? 'slow-gliding-image' : 'scale-100'
                }`}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== slide.fallback) {
                    target.src = slide.fallback;
                  }
                }}
              />
            </div>
          );
        })}

        {/* Subtle glass vignette on the borders only */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none z-20 rounded-3xl" />

        {/* ── Subtle Manual Navigation Arrows (Appear on hover) ── */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-[#A8C66C] text-white hover:text-[#123B26] backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 cursor-pointer hover:scale-110 active:scale-95 shadow-lg"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-[#A8C66C] text-white hover:text-[#123B26] backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 cursor-pointer hover:scale-110 active:scale-95 shadow-lg"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Minimalist 5-Dash Progress Indicators (Zero text/names) ── */}
      <div className="flex items-center justify-center gap-2 mt-5 z-10 px-4 py-1.5 bg-black/35 backdrop-blur-md rounded-full border border-white/10">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative rounded-full transition-all duration-500 cursor-pointer overflow-hidden ${
                isActive
                  ? 'w-8 h-2 bg-[#A8C66C] shadow-md shadow-[#A8C66C]/40'
                  : 'w-2.5 h-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
};
