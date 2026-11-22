import React, { useState, useMemo } from 'react';
import {
  HelpCircle, ChevronDown, MessageSquare, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { STORE_CONFIG } from '../config/storeConfig';
import { HOME_FAQS } from '../config/siteContent';
import type { FaqItem } from '../types/content';

type FAQCategory = 'all' | 'ordering' | 'weights' | 'delivery' | 'quality';

const FAQ_ITEMS: FaqItem[] = HOME_FAQS;

export const FAQSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('all');
  const [openIds, setOpenIds] = useState<number[]>([1, 2]);

  const toggle = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      return activeCategory === 'all' || item.category === activeCategory;
    });
  }, [activeCategory]);

  return (
    <section id="faq" className="py-16 sm:py-20 bg-[#F7F5E8] border-t border-[#DCE8C8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-[#DCE8C8] border border-[#A8C66C]/40 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#123B26]">
            <HelpCircle className="w-3.5 h-3.5 text-[#205C38]" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
            Got Questions? We&apos;ve Got Answers.
          </h2>

          <p className="font-poppins text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Quick information about our unpolished dals, 100g–1kg weights, WhatsApp ordering, and local delivery in Chitlapakkam.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {[
            { id: 'all', label: `All Questions (${FAQ_ITEMS.length})` },
            { id: 'ordering', label: '🛒 Ordering' },
            { id: 'weights', label: '⚖️ Weights & Sizes' },
            { id: 'delivery', label: '🚚 Delivery' },
            { id: 'quality', label: '🌿 Purity' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as FAQCategory)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-[#123B26] text-[#A8C66C] shadow-sm'
                  : 'bg-white text-gray-600 hover:text-[#123B26] border border-[#DCE8C8] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Accordion Cards */}
        <div className="space-y-3.5">
          {filteredFAQs.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-white border-[#205C38]/40 shadow-md ring-1 ring-[#205C38]/20'
                    : 'bg-white/90 border-[#DCE8C8] shadow-xs hover:border-[#205C38]/30 hover:bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#DCE8C8] text-[#123B26] px-2.5 py-0.5 rounded-full">
                        {faq.categoryLabel}
                      </span>
                      {faq.popular && (
                        <span className="text-[10px] font-bold text-[#F2C94C] bg-[#123B26] px-2 py-0.5 rounded-full">
                          ★ Popular
                        </span>
                      )}
                    </div>

                    <h3 className="font-playfair text-base sm:text-lg font-bold text-[#123B26] leading-snug">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 mt-1 ${
                      isOpen
                        ? 'bg-[#123B26] text-[#A8C66C] rotate-180'
                        : 'bg-[#F7F5E8] text-[#123B26] hover:bg-[#DCE8C8]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-[#DCE8C8]/60 space-y-3 font-poppins text-xs sm:text-sm text-gray-700 leading-relaxed bg-white">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* View All FAQ Link + WhatsApp Shortcut */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/faq"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            <span>View Complete FAQ (10 Questions)</span>
            <ArrowRight className="w-4 h-4 text-[#A8C66C]" />
          </Link>

          <a
            href={STORE_CONFIG.whatsappLink(
              'Hello Bensi Queen, I have a question about groceries and delivery.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span>Ask on WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  );
};
