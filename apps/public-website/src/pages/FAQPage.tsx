import React, { useState, useMemo } from 'react';
import {
  HelpCircle, ChevronDown, MessageSquare, Search, Sparkles,
  Package, Truck, ShieldCheck, Phone, MapPin, Clock, ArrowRight,
  CheckCircle2, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { STORE_CONFIG } from '../config/storeConfig';

type FAQCategory = 'all' | 'ordering' | 'weights' | 'delivery' | 'quality';

interface FAQItem {
  id: number;
  category: 'ordering' | 'weights' | 'delivery' | 'quality';
  categoryLabel: string;
  question: string;
  answer: string;
  popular?: boolean;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    category: 'ordering',
    categoryLabel: 'Ordering & WhatsApp',
    question: 'How can I place an order on this website?',
    answer:
      'Ordering is simple and requires zero account creation or advance online payments! Browse our 35-item provision catalog, pick your preferred weight (100g, 200g, 500g, 750g, or 1kg) and quantity, and click "Add to Cart". In your slide-out cart, click "Proceed to Checkout", fill in your delivery name, mobile, and neighborhood address, and click "Place Order via WhatsApp". A neat, itemized order is automatically opened in WhatsApp for you to send directly to the store owner.',
    popular: true,
  },
  {
    id: 2,
    category: 'weights',
    categoryLabel: 'Weights & Sizes',
    question: 'What pack sizes and weights are available for each product?',
    answer:
      'Every single item at Bensi Queen is conveniently available in five standard pack weights: 100g, 200g, 500g, 750g, and 1kg. You can choose your desired weight from the custom dropdown selector on each product card. If you want to buy different weights of the same product (for example, 500g Toor Dal for regular sambar and 1kg for a family gathering), each weight is added as an independent line item in your cart.',
    popular: true,
  },
  {
    id: 3,
    category: 'quality',
    categoryLabel: 'Purity & Quality',
    question: 'Why are commodity prices not displayed on the website?',
    answer:
      'Bensi Queen operates as a neighborhood family provision store. Prices of agricultural staples like dals, pulses, and dry fruits fluctuate daily based on market harvest rates. Rather than showing outdated online prices, our owner inspects the freshest batch in-store and shares the exact, transparent billing on your WhatsApp order chat before dispatch.',
    popular: true,
  },
  {
    id: 4,
    category: 'delivery',
    categoryLabel: 'Delivery & Payment',
    question: 'How does payment work? Do I need to pay online in advance?',
    answer:
      'Zero advance online prepayment is required! You pay only after receiving and inspecting your fresh grocery package at your doorstep. We accept Cash on Delivery (COD) as well as instant UPI payments (Google Pay, PhonePe, Paytm, or BHIM) directly to the delivery person or store UPI ID.',
    popular: true,
  },
  {
    id: 5,
    category: 'delivery',
    categoryLabel: 'Delivery & Payment',
    question: 'Which areas do you deliver to in Chennai?',
    answer:
      'We provide fast neighborhood doorstep delivery across Chitlapakkam, Tambaram Sanatorium, Chromepet, Hasthinapuram, Selaiyur, East Tambaram, Sembakkam, and Medavakkam. Chitlapakkam and Chromepet orders are typically dispatched within 30 to 45 minutes.',
  },
  {
    id: 6,
    category: 'ordering',
    categoryLabel: 'Ordering & WhatsApp',
    question: 'Can I download or print a PDF summary of my order?',
    answer:
      'Yes, absolutely! On the Checkout page, simply click "Download PDF". An itemized, printable document containing your unique order reference, date, customer details, and complete list of provisions with exact weights is immediately generated for your household records.',
  },
  {
    id: 7,
    category: 'quality',
    categoryLabel: 'Purity & Quality',
    question: 'What is the quality guarantee on pulses, dals, and spices?',
    answer:
      'All pulses and lentils at Bensi Queen are 100% naturally dried and unpolished — free from artificial yellow dyes, chalk powders, or chemical gloss wax. Our spice powders (turmeric, red chilli, coriander, and pepper) are stone-milled in small batches from whole, cleaned spices with zero artificial preservatives or synthetic colors.',
  },
  {
    id: 8,
    category: 'weights',
    categoryLabel: 'Weights & Sizes',
    question: 'Do you sell nuts, dry fruits, and cooking oils?',
    answer:
      'Yes! We offer whole crunchy Grade-W240 Cashew Nuts, California Almonds, Sun-dried seeded Black Raisins, and soft Dates (with and without seeds). We also stock cold-pressed sesame / gingelly oil, pure coconut oil, and double-filtered cooking oils.',
  },
  {
    id: 9,
    category: 'ordering',
    categoryLabel: 'Ordering & WhatsApp',
    question: 'What are your operating hours?',
    answer:
      'Bensi Queen is open 7 days a week, Monday through Sunday, from 7:00 AM to 9:30 PM. Orders submitted on WhatsApp during operating hours are reviewed immediately for packing and delivery dispatch.',
  },
  {
    id: 10,
    category: 'delivery',
    categoryLabel: 'Delivery & Payment',
    question: 'Where is your physical grocery store located?',
    answer:
      'Our retail store is located at No. 3, Jothi Nagar, 5th Street, Sankara Apartment, Chitlapakkam, Chennai - 600064 (near Chitlapakkam Lake & Tambaram Sanatorium). You are welcome to visit our shop in person or order via WhatsApp for doorstep delivery!',
  },
];

export const FAQPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<number[]>([1, 2]); // First 2 open by default

  const toggle = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setOpenIds(FAQ_ITEMS.map((item) => item.id));
  };

  const collapseAll = () => {
    setOpenIds([]);
  };

  // Filter items based on active category & search query
  const filteredFAQs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    }),
    []
  );

  return (
    <div className="bg-[#F7F5E8] text-[#123B26] min-h-screen selection:bg-[#DCE8C8] selection:text-[#123B26]">
      <SEOHead
        title="Frequently Asked Questions (FAQ) | Bensi Queen Groceries"
        description="Find answers to common questions about shopping, 100g to 1kg pack weights, WhatsApp ordering, PDF summaries, payment on delivery, and store location in Chitlapakkam, Chennai."
        canonical="https://bensiqueen.com/faq"
        keywords="bensi queen faq, how to order whatsapp grocery, grocery delivery chitlapakkam, pulses weights, spices delivery chennai, tambaram groceries faq"
        structuredData={faqSchema}
      />

      {/* ══════════════════════════════════════════ */}
      {/* §1  HERO BANNER                            */}
      {/* ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2318] via-[#123B26] to-[#1a4e32] text-white py-16 sm:py-20 border-b border-[#A8C66C]/20">
        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#A8C66C]/10 blur-[100px]" />
          <div className="absolute -bottom-10 left-1/3 w-80 h-80 rounded-full bg-[#205C38]/40 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'radial-gradient(circle, #A8C66C 1.5px, transparent 1.5px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-[#205C38] border border-[#A8C66C]/40 text-[#A8C66C] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
            <HelpCircle className="w-4 h-4 text-[#F2C94C]" />
            <span>Help Center & Knowledge Base</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-playfair text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Frequently Asked Questions
            </h1>
          </div>

          <p className="font-poppins text-xs sm:text-sm text-white/75 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about our unpolished pulses, stone-milled spices, 100g to 1kg pack weights, doorstep delivery in Chitlapakkam, and instant WhatsApp ordering.
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. WhatsApp, delivery, pulses, weights)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-full bg-white text-[#123B26] text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8C66C] shadow-lg font-poppins"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 4 Quick Highlight Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto text-left">
            {[
              { icon: MessageSquare, title: 'WhatsApp Orders', sub: 'Zero account hassle' },
              { icon: Package, title: '100g to 1kg Packs', sub: 'Flexible portions' },
              { icon: ShieldCheck, title: 'Pay on Delivery', sub: 'Cash or UPI' },
              { icon: Truck, title: '30-45 Min Dispatch', sub: 'Local Chitlapakkam' },
            ].map(({ icon: Icon, title, sub }, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 flex items-center space-x-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-[#A8C66C]/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#A8C66C]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white leading-tight">{title}</p>
                  <p className="text-[9px] text-white/60">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* §2  CATEGORY FILTER TABS & TOOLBAR         */}
      {/* ══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#DCE8C8]">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All (${FAQ_ITEMS.length})` },
              { id: 'ordering', label: '🛒 Ordering & WhatsApp' },
              { id: 'weights', label: '⚖️ Weights & Sizes' },
              { id: 'delivery', label: '🚚 Delivery & Payment' },
              { id: 'quality', label: '🌿 Purity & Quality' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as FAQCategory)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-[#123B26] text-[#A8C66C] shadow-sm'
                    : 'bg-white text-gray-600 hover:text-[#123B26] border border-[#DCE8C8] hover:bg-[#F7F5E8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Expand / Collapse All Controls */}
          <div className="flex items-center space-x-3 text-xs text-gray-500 font-semibold self-end sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={expandAll}
              className="text-[#205C38] hover:underline cursor-pointer"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-gray-500 hover:underline cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {searchQuery && (
          <div className="mt-3 text-xs text-gray-600">
            Showing results for <span className="font-bold text-[#123B26]">&ldquo;{searchQuery}&rdquo;</span> ({filteredFAQs.length} found)
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* §3  ENHANCED FAQ ACCORDION LIST            */}
      {/* ══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 space-y-4">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-white border-[#205C38]/40 shadow-md ring-1 ring-[#205C38]/20'
                    : 'bg-white/90 border-[#DCE8C8] shadow-sm hover:border-[#205C38]/30 hover:bg-white'
                }`}
              >
                {/* Header Question Button */}
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#DCE8C8] text-[#123B26] px-2.5 py-0.5 rounded-full">
                        {faq.categoryLabel}
                      </span>
                      {faq.popular && (
                        <span className="text-[10px] font-bold text-[#F2C94C] bg-[#123B26] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5 text-[#F2C94C]" />
                          <span>Popular Question</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-playfair text-base sm:text-lg font-bold text-[#123B26] leading-snug">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 mt-1 ${
                      isOpen
                        ? 'bg-[#123B26] text-[#A8C66C] rotate-180'
                        : 'bg-[#F7F5E8] text-[#123B26] hover:bg-[#DCE8C8]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Expanded Answer Content */}
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#DCE8C8]/60 space-y-4 font-poppins text-xs sm:text-sm leading-relaxed text-gray-700 animate-fadeIn">
                    <p className="leading-relaxed text-gray-800">
                      {faq.answer}
                    </p>

                    {/* Bottom Action Strip inside Accordion */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 border-t border-gray-100">
                      <div className="flex items-center space-x-1 text-[#205C38] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#205C38]" />
                        <span>Verified Store Policy</span>
                      </div>

                      <a
                        href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hello Bensi Queen, I have a question regarding: "${faq.question}".`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#205C38] hover:text-[#123B26] bg-[#DCE8C8]/50 hover:bg-[#DCE8C8] px-3 py-1.5 rounded-full transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>Ask Owner About This</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Empty search state */
          <div className="bg-white rounded-3xl p-12 text-center border border-[#DCE8C8] space-y-4 shadow-sm">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-playfair text-xl font-bold text-[#123B26]">
              No questions found matching your search
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Try searching with another keyword like &ldquo;pulse&rdquo;, &ldquo;delivery&rdquo;, or message the owner directly on WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-5 py-2 rounded-full bg-[#123B26] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#205C38] transition-colors"
            >
              Reset Search
            </button>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* §4  STILL HAVE QUESTIONS? WHATSAPP CARD   */}
      {/* ══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#123B26] via-[#1b4d30] to-[#123B26] text-white p-8 sm:p-10 shadow-xl border border-[#A8C66C]/30 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#A8C66C]/20 border border-[#A8C66C]/30 flex items-center justify-center mx-auto">
            <MessageSquare className="w-7 h-7 text-[#25D366]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold text-white">
              Still Have a Question? Chat with Us!
            </h2>
            <p className="font-poppins text-xs sm:text-sm text-white/75 max-w-lg mx-auto leading-relaxed">
              Our store owner in Chitlapakkam is available 7 days a week from 7:00 AM to 9:30 PM to answer product availability, custom weights, and fast neighborhood delivery queries.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                'Hello Bensi Queen, I have a question regarding grocery orders and delivery.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>Chat on WhatsApp ({STORE_CONFIG.displayPhone})</span>
            </a>

            <a
              href={`tel:${STORE_CONFIG.phone}`}
              className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-full border border-white/30 hover:border-white text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <Phone className="w-4 h-4 text-[#A8C66C]" />
              <span>Call Us Directly</span>
            </a>

            <Link
              to="/products"
              className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              <Package className="w-4 h-4 text-[#123B26]" />
              <span>Browse Catalog</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-white/10 text-xs text-white/60">
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#A8C66C]" />
              <span>Chitlapakkam, Chennai - 600064</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#A8C66C]" />
              <span>Mon–Sun: 7:00 AM – 9:30 PM</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
