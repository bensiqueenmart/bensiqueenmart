import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, CheckCircle2, MessageSquare, Check, Gift } from 'lucide-react';
import type { PublicCombo } from '@bqm/types';
import { useCart } from '../context/CartContext';
import { STORE_CONFIG } from '../config/storeConfig';
import { imageSrc, comboLabel } from '../api';

interface DealDetailModalProps {
  offer: PublicCombo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({ offer, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addComboToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  if (!isOpen || !offer) return null;
  const unavailable = !offer.available;

  const contentsText = offer.contents.map((c) => `${c.name} (${c.qty})`).join(', ');

  const handleAddToCart = () => {
    addComboToCart(offer, contentsText);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3500);
  };

  const handleWhatsApp = () => {
    const text = `Hello Bensi Queen, I would like to inquire about the combo deal: "${offer.name}".`;
    window.open(
      STORE_CONFIG.whatsappLink(text),
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 relative z-10">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#A8C66C]/40 flex flex-col my-8">
          {/* Top Image Header */}
          <div className="relative h-60 sm:h-72 overflow-hidden bg-[#123B26]/10 flex-shrink-0">
            <img
              src={imageSrc(offer.image) || '/images/combo-dry-fruits.jpg'}
              alt={offer.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/combo-dry-fruits.jpg';
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-4 right-4 text-white z-10">
              <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white/90 text-xs px-3 py-1 rounded-full border border-white/20 mb-2">
                <Gift className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>{comboLabel(offer.slug)}</span>
              </span>
              <h2 className="font-playfair text-xl sm:text-2xl font-extrabold leading-snug drop-shadow-md">
                {offer.name}
              </h2>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7 space-y-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#205C38]">
                Deal Overview
              </p>
              <p className="font-poppins text-sm text-gray-700 leading-relaxed">{offer.description}</p>
            </div>

            <div className="bg-[#F7F5E8] border border-[#DCE8C8] rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#205C38] text-white flex items-center justify-center">
                    <Gift className="w-4 h-4 text-[#A8C66C]" />
                  </div>
                  <h3 className="font-poppins text-sm font-bold text-[#123B26]">
                    Included in this Combo Package
                  </h3>
                </div>
                <span className="text-[11px] font-extrabold bg-[#205C38] text-white px-2.5 py-1 rounded-full">
                  {offer.contents.length} Items
                </span>
              </div>

              <div className="divide-y divide-[#DCE8C8] border-t border-b border-[#DCE8C8]">
                {offer.contents.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-gray-400 font-mono">{idx + 1}.</span>
                      <div className="min-w-0">
                        <span className="font-bold text-[#123B26] truncate block">{item.name}</span>
                        {item.tamilName && (
                          <p className="font-mukta text-xs text-[#205C38] font-medium">
                            {item.tamilName}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="bg-white border border-[#A8C66C] text-[#123B26] font-bold px-2.5 py-1 rounded-lg flex-shrink-0">
                      {item.qty}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-[#205C38] flex-shrink-0 mt-0.5" />
                <span>
                  All {offer.contents.length} items arrive packed together as one combo package.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[#123B26] text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-[#205C38]">
                <CheckCircle2 className="w-4 h-4 text-[#205C38]" />
                Doorstep Delivery in Chitlapakkam & Chennai
              </p>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Prices are verified and payment is settled on delivery via Cash or UPI.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 sm:p-6 bg-[#F7F5E8] border-t border-[#DCE8C8] space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={unavailable}
                title={unavailable ? 'Out of stock — back soon' : 'Add to cart'}
                className={`flex-1 inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 ${
                  unavailable
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : justAdded
                      ? 'bg-[#123B26] text-white'
                      : 'bg-[#205C38] hover:bg-[#164328] text-white'
                }`}
              >
                {unavailable ? (
                  <span>Out of stock</span>
                ) : justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-[#A8C66C]" />
                    <span>✓ Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#A8C66C]" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex-shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Inquire on WhatsApp</span>
              </button>
            </div>

            {justAdded && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#A8C66C] text-xs">
                <span className="font-semibold text-[#123B26]">Combo is ready in your cart!</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/cart');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#F7F5E8] hover:bg-[#DCE8C8] text-[#123B26] font-bold text-[11px] transition-colors"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/cart');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-[11px] transition-colors"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            <div className="text-center pt-1">
              <button
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-[#123B26] font-medium transition-colors"
              >
                Continue Browsing Deals
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
