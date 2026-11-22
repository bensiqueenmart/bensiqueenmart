import React, { useState } from 'react';
import { MapPin, Phone, MessageSquare, Clock, Send, ExternalLink, CheckCircle2 } from 'lucide-react';
import { STORE_CONFIG } from '../config/storeConfig';
import { SEOHead } from '../components/SEOHead';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      alert('Please fill in your Name, Phone Number, and Message.');
      return;
    }

    const text = `Hello Bensi Queen!%0A%0AInquiry from Website:%0AName: ${encodeURIComponent(
      form.name
    )}%0APhone: ${encodeURIComponent(form.phone)}%0ASubject: ${encodeURIComponent(
      form.subject || 'General Inquiry'
    )}%0AMessage: ${encodeURIComponent(form.message)}`;

    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${text}`, '_blank');
    setSubmitted(false);
  };

  const directWhatsAppUrl = STORE_CONFIG.whatsappLink(
    'Hello Bensi Queen, I would like to inquire about your grocery availability.'
  );

  return (
    <div className="py-12 bg-[#F7F5E8] text-[#123B26] min-h-screen">
      <SEOHead
        title="Contact Bensi Queen | Grocery Enquiries, Orders & Directions — Chitlapakkam Chennai"
        description={`Get in touch with Bensi Queen in Chitlapakkam, Chennai 600064. Phone, WhatsApp, and delivery helpline: ${STORE_CONFIG.primaryPhone}. Open 7 days a week, 7:00 AM to 9:30 PM. Fast doorstep dispatch across Chromepet, Tambaram, and Selaiyur.`}
        canonical="https://bensiqueen.com/contact"
        keywords="contact bensi queen, chitlapakkam grocery contact, chennai grocery phone number, order groceries whatsapp, bensi queen address chitlapakkam"
        image="https://bensiqueen.com/images/bensi-queen-logo.jpg"
        imageAlt="Contact Bensi Queen Groceries in Chitlapakkam Chennai"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-[#DCE8C8] border border-[#A8C66C]/40 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#123B26]">
            <span>Get in Touch</span>
          </div>

          <h1 className="font-playfair text-3xl sm:text-5xl font-extrabold text-[#123B26]">
            Visit or Contact Our Store
          </h1>

          <p className="font-poppins text-xs sm:text-sm text-gray-700 leading-relaxed">
            Have a question about specific grocery items or need home delivery in Chitlapakkam? We are here to assist you daily.
          </p>
        </div>

        {/* Content Grid (White Cards on Cream Background) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Store Details (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white p-6 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-5">
              <h2 className="font-playfair text-xl font-bold text-[#123B26]">
                Store Contact Information
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                
                {/* Address */}
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#DCE8C8] text-[#205C38] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#123B26]">Store Address</h3>
                    <p className="text-gray-700 mt-0.5 leading-relaxed">
                      {STORE_CONFIG.address}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#DCE8C8] text-[#205C38] flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#123B26]">Phone & Order Helpline</h3>
                    <a
                      href={STORE_CONFIG.callLink}
                      className="text-[#205C38] hover:underline font-bold mt-0.5 block"
                    >
                      {STORE_CONFIG.primaryPhone}
                    </a>
                    {STORE_CONFIG.hasSecondaryPhone && (
                      <a
                        href={STORE_CONFIG.secondaryCallLink}
                        className="text-[#205C38] hover:underline font-bold mt-0.5 block"
                      >
                        {STORE_CONFIG.secondaryDisplayPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#DCE8C8] text-[#205C38] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#123B26]">Working Hours</h3>
                    <p className="text-gray-700 mt-0.5">{STORE_CONFIG.businessHours}</p>
                  </div>
                </div>

              </div>

              {/* Direct WhatsApp CTA */}
              <div className="pt-2 border-t border-gray-100">
                <a
                  href={directWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-button"
                >
                  <MessageSquare className="w-4 h-4 text-[#A8C66C]" />
                  <span>Start WhatsApp Conversation</span>
                </a>
              </div>
            </div>

            {/* Service Areas Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#DCE8C8] shadow-soft space-y-2 text-xs">
              <h3 className="font-bold text-[#123B26] uppercase tracking-wider text-[11px]">
                Neighborhood Delivery Areas
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We deliver to Chitlapakkam, Tambaram Sanatorium, Chromepet, Hasthinapuram, Nehru Nagar, and nearby residential zones.
              </p>
            </div>

          </div>

          {/* Contact Message Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-5">
            <div>
              <h2 className="font-playfair text-xl font-bold text-[#123B26]">
                Send an Enquiry
              </h2>
              <p className="font-poppins text-xs text-gray-600 mt-1">
                Fill out the form below to transmit your grocery inquiry directly to our shop owner on WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#123B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mobile Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#123B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Availability / Monthly Order"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#123B26]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Let us know what grocery provisions you are looking for..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#123B26]"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-button active:scale-95"
              >
                <Send className="w-4 h-4 text-[#A8C66C]" />
                <span>Send via WhatsApp</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
