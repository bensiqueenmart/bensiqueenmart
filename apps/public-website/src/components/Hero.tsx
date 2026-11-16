import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Truck, HeartHandshake } from 'lucide-react';
import { STORE_CONFIG } from '../config/storeConfig';

export const Hero: React.FC = () => {
  return (
    <section id="home" className="relative bg-[#F4F9EC] overflow-hidden pt-8 pb-16 lg:py-20 border-b border-[#B9E769]/40">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#B9E769]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#75D900]/15 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill Tagline */}
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-[#B9E769] rounded-full px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#75D900] animate-ping" />
              <span className="w-2 h-2 rounded-full bg-[#75D900]" />
              <span className="font-kavivanar text-[#155B32] text-sm md:text-base font-semibold">
                நலமான உணவு • சிறந்த தரம் • மகிழ்ச்சியான இல்லம்
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-playfair text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#155B32] tracking-tight leading-[1.15]">
              Good Food. <br className="hidden sm:inline" />
              <span className="text-[#155B32] relative inline-block">
                Great Quality.
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#B9E769] -z-10"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                >
                  <path d="M0,10 Q50,0 100,10" fill="none" stroke="currentColor" strokeWidth="8" />
                </svg>
              </span>{' '}
              <br />
              Happy Home.
            </h1>

            {/* Tamil Supporting Subheading */}
            <p className="font-mukta text-base sm:text-lg text-[#155B32]/90 font-medium">
              உங்கள் இல்லத்திற்குத் தேவையான உயர்தர பருப்பு வகைகள், வாசனை மசாலாக்கள், நட்ஸ் மற்றும் அன்றாட மளிகைப் பொருட்கள்.
            </p>

            {/* English Supporting Text */}
            <p className="font-poppins text-sm sm:text-base text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Your trusted destination for quality pulses, spices, nuts and everyday grocery essentials. Handpicked for aroma, purity, and wholesome family health.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#products"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-[#75D900] hover:bg-[#68c200] text-[#155B32] font-semibold text-sm sm:text-base shadow-button hover:shadow-lg transition-all active:scale-95 group"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="#categories"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-white hover:bg-[#F8F8F2] text-[#155B32] border border-[#155B32]/30 font-semibold text-sm sm:text-base shadow-sm hover:border-[#155B32] transition-all"
              >
                Explore Categories
              </a>
            </div>

            {/* Key Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-[#B9E769]/50">
              <div className="flex items-center space-x-2 text-left">
                <ShieldCheck className="w-5 h-5 text-[#155B32] flex-shrink-0" />
                <span className="text-xs text-gray-700 font-medium">
                  100% Quality Checked
                </span>
              </div>
              <div className="flex items-center space-x-2 text-left">
                <Sparkles className="w-5 h-5 text-[#155B32] flex-shrink-0" />
                <span className="text-xs text-gray-700 font-medium">
                  Fresh Packaging
                </span>
              </div>
              <div className="flex items-center space-x-2 text-left col-span-2 sm:col-span-1">
                <Truck className="w-5 h-5 text-[#155B32] flex-shrink-0" />
                <span className="text-xs text-gray-700 font-medium">
                  Direct WhatsApp Orders
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Grocery Arrangement */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Image Frame with Belle's Pantry Arched/Soft aesthetic */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=85"
                  alt="Assorted Indian Spices and Groceries at Bensi Queen"
                  className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#155B32]/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white space-y-1">
                    <span className="inline-block bg-[#75D900] text-[#155B32] text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Handpicked Selection
                    </span>
                    <h3 className="font-playfair text-xl font-bold">Pure Spices, Dals & Dry Fruits</h3>
                    <p className="font-mukta text-xs text-white/90">இயற்கை நலம் காக்கும் அஞ்சறைப்பெட்டி பொருட்கள்</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1: Store Location */}
              <div className="absolute -top-4 -left-4 sm:-left-6 bg-white rounded-2xl p-3 shadow-card border border-[#B9E769] flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#F4F9EC] flex items-center justify-center text-[#155B32] font-bold">
                  BQ
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#155B32]">Chitlapakkam</p>
                  <p className="text-[11px] text-gray-500">Chennai 600064</p>
                </div>
              </div>

              {/* Floating Badge 2: Easy WhatsApp ordering */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-white rounded-2xl p-3 shadow-card border border-[#75D900] flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#75D900]/20 flex items-center justify-center text-[#155B32]">
                  <HeartHandshake className="w-5 h-5 text-[#155B32]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#155B32]">Easy Ordering</p>
                  <p className="text-[11px] text-gray-500">No Advance Payment Needed</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

