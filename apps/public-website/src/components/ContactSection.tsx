import React from 'react';
import { Phone, MapPin, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { STORE_CONFIG } from '../config/storeConfig';

export const ContactSection: React.FC = () => {
  const directWhatsAppUrl = `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hello Bensi Queen, I would like to inquire about your grocery products.'
  )}`;

  return (
    <section id="contact" className="py-16 bg-[#F7F5E8] border-t border-[#DCE8C8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-2 mb-12">
          <div className="inline-block bg-[#DCE8C8] text-[#123B26] text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full">
            Customer Support
          </div>
          <h2 className="font-playfair text-2xl sm:text-4xl font-bold text-[#123B26]">
            Visit Our Store or Message Us Directly
          </h2>
          <p className="font-poppins text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
            Convenient neighborhood grocery shopping with doorstep delivery across Chitlapakkam and nearby Chennai suburbs.
          </p>
        </div>

        {/* 3 Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Address */}
          <div className="bg-white rounded-2xl p-6 border border-[#DCE8C8] shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F5E8] text-[#123B26] flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#205C38]" />
            </div>
            <h3 className="font-poppins text-base font-bold text-[#123B26]">
              Store Location
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed font-poppins">
              {STORE_CONFIG.address}
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Landmark: {STORE_CONFIG.landmark}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                STORE_CONFIG.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-bold text-[#205C38] hover:text-[#123B26] pt-1"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>

          {/* Card 2: Phone & WhatsApp */}
          <div className="bg-white rounded-2xl p-6 border border-[#DCE8C8] shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F5E8] text-[#123B26] flex items-center justify-center">
              <Phone className="w-6 h-6 text-[#205C38]" />
            </div>
            <h3 className="font-poppins text-base font-bold text-[#123B26]">
              Phone & WhatsApp
            </h3>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">Customer Helpline:</p>
              <a
                href={`tel:${STORE_CONFIG.phone}`}
                className="text-lg font-bold text-[#123B26] hover:text-[#205C38] block"
              >
                {STORE_CONFIG.displayPhone}
              </a>
            </div>
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#205C38] text-white font-bold text-xs hover:bg-[#123B26] transition-colors shadow-button"
            >
              <MessageSquare className="w-4 h-4 text-[#F2C94C]" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          {/* Card 3: Business Hours & Delivery */}
          <div className="bg-white rounded-2xl p-6 border border-[#DCE8C8] shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7F5E8] text-[#123B26] flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#205C38]" />
            </div>
            <h3 className="font-poppins text-base font-bold text-[#123B26]">
              Store & Delivery Hours
            </h3>
            <p className="text-xs text-gray-700 font-semibold font-poppins">
              {STORE_CONFIG.businessHours}
            </p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-500 font-medium">
                Delivery Suburbs: Chitlapakkam, Tambaram Sanatorium, Chromepet, Hasthinapuram & nearby areas.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
