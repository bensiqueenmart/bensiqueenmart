import React from 'react';
import { Link } from 'react-router-dom';
import { STORE_CONFIG } from '../config/storeConfig';
import { BUSINESS } from '../config/siteContent';
import { Check, Heart, Shield, Sparkles, ArrowRight } from 'lucide-react';

export const AboutUs: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-24 bg-white border-t border-[#DCE8C8] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Visual Side */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              <div className="rounded-3xl overflow-hidden shadow-card border-4 border-[#F7F5E8]">
                <img
                  src="https://images.unsplash.com/photo-1596797882870-8c33deeac224?auto=format&fit=crop&w=800&q=80"
                  alt="Fresh lentils, spices and grains at Bensi Queen"
                  className="w-full h-80 sm:h-96 object-cover"
                />
              </div>

              <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-[#123B26] text-white p-5 rounded-2xl shadow-xl max-w-xs">
                <p className="font-playfair text-base font-bold text-[#F2C94C]">
                  Purity in Every Grain
                </p>
                <p className="text-[11px] text-white/80 mt-1 font-poppins">
                  Carefully sourced pulses and aromatic spices for your home kitchen.
                </p>
              </div>

            </div>
          </div>

          {/* Text Side */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            
            <div className="inline-block bg-[#DCE8C8] text-[#123B26] text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full">
              About Bensi Queen
            </div>

            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-[#123B26] leading-tight">
              Good Food Begins with Good Ingredients.
            </h2>

            <p className="font-poppins text-sm sm:text-base text-gray-700 leading-relaxed">
              At <strong className="text-[#123B26]">Bensi Queen</strong>, we believe that good food begins with good ingredients. We bring together a carefully selected range of quality pulses, spices, nuts, dry fruits and everyday essentials to make every household&apos;s kitchen a happier place.
            </p>

            <p className="font-poppins text-sm text-gray-600 leading-relaxed">
              From staple toor dal, urad dal, and wholesome idli rice to fragrant sambar powder, cold-pressed oils, and crisp California almonds — each product is packaged with care to retain natural flavor, aroma, and essential nutrition.
            </p>

            {/* Values Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#DCE8C8] flex items-center justify-center text-[#123B26] flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-[#205C38]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#123B26]">Uncompromised Purity</h4>
                  <p className="text-[11px] text-gray-500 font-poppins">Unpolished dals and naturally ground traditional spices.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#DCE8C8] flex items-center justify-center text-[#123B26] flex-shrink-0 mt-0.5">
                  <Heart className="w-4 h-4 text-[#205C38]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#123B26]">Neighborhood Care</h4>
                  <p className="text-[11px] text-gray-500 font-poppins">Convenient WhatsApp orders directly to your doorstep in {BUSINESS.city}.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center space-x-2 text-xs font-bold text-[#205C38] hover:text-[#123B26] uppercase tracking-wider"
              >
                <span>Read Full Story</span>
                <ArrowRight className="w-4 h-4 text-[#F2C94C]" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
