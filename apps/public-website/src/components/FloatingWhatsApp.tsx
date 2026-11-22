import React from 'react';
import { MessageSquare } from 'lucide-react';
import { STORE_CONFIG } from '../config/storeConfig';

export const FloatingWhatsApp: React.FC = () => {
  const directWhatsAppUrl = STORE_CONFIG.whatsappLink(
    'Hello Bensi Queen, I would like to inquire about your grocery availability.'
  );

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <a
        href={directWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-[#205C38] hover:bg-[#123B26] text-white flex items-center justify-center shadow-2xl border-2 border-[#A8C66C] transition-transform duration-300 hover:scale-110 relative"
        aria-label="Order via WhatsApp"
        title="WhatsApp Order"
      >
        <MessageSquare className="w-6 h-6 text-[#F2C94C]" />
        <span className="absolute -inset-1 rounded-full border-2 border-[#A8C66C] animate-ping opacity-25 pointer-events-none" />
      </a>
    </div>
  );
};

