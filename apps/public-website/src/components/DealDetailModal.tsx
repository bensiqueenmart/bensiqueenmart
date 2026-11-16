import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Flame,
  Check,
  Gift,
} from 'lucide-react';
import { ComboOffer } from '../types';
import { useCart } from '../context/CartContext';
import { resolveComboItems } from '../utils/comboUtils';
import { STORE_CONFIG } from '../config/storeConfig';

interface DealDetailModalProps {
  offer: ComboOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  offer,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { addComboToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  if (!isOpen || !offer) return null;

  const resolvedItems = resolveComboItems(offer);

  const summaryText =
    offer.includedSummary ||
    resolvedItems.map((r) => `${r.product.englishName} (${r.weight})`).join(', ');

  const handleAddToCart = () => {
    addComboToCart(
      offer.title,
      offer.id,
      offer.comboName || 'Combo',
      summaryText,
      offer.image || '/images/hero/dry-fruits-hero.jpg',
      offer.comboNumber
    );
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 3500);
  };

  const handleWhatsApp = () => {
    const text = `Hello Bensi Queen, I would like to inquire about the combo deal: "${offer.title}" (${offer.discountLabel}).`;
    window.open(
      `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 relative z-10">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#A8C66C]/40 flex flex-col my-8 animate-in zoom-in-95 duration-200">
          
          {/* ── Top Image Header ── */}
          <div className="relative h-60 sm:h-72 overflow-hidden bg-[#123B26]/10 flex-shrink-0">
            <img
              src={offer.image || '/images/combo-dry-fruits.jpg'}
              alt={offer.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/combo-dry-fruits.jpg';
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badges in Top Image */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
              <span className="inline-flex items-center gap-1.5 bg-[#F2C94C] text-[#123B26] text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                {offer.discountLabel}
              </span>

              <span className="inline-flex items-center gap-1.5 bg-[#123B26]/80 text-[#A8C66C] text-xs font-bold px-3 py-1.5 rounded-full border border-[#A8C66C]/40 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
                Combo Package
              </span>
            </div>

            {/* Title & Validity overlay at bottom of image */}
            <div className="absolute bottom-4 left-4 right-4 text-white z-10">
              <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white/90 text-xs px-3 py-1 rounded-full border border-white/20 mb-2">
                <Calendar className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>{offer.validUntil}</span>
              </div>
              <h2 className="font-playfair text-xl sm:text-2xl font-extrabold text-white leading-snug drop-shadow-md">
                {offer.title}
              </h2>
            </div>
          </div>

          {/* ── Modal Body Content ── */}
          <div className="p-6 sm:p-7 space-y-6 overflow-y-auto max-h-[60vh]">

            {/* Description */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#205C38]">
                Deal Overview
              </p>
              <p className="font-poppins text-sm text-gray-700 leading-relaxed">
                {offer.description}
              </p>
            </div>

            {/* ── Included in this Deal Section ── */}
            <div className="bg-[#F7F5E8] border border-[#DCE8C8] rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#205C38] text-white flex items-center justify-center">
                    <Gift className="w-4 h-4 text-[#A8C66C]" />
                  </div>
                  <div>
                    <h3 className="font-poppins text-sm font-bold text-[#123B26]">
                      Included in this Combo Package
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {resolvedItems.length} essential items packed fresh and sealed
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-extrabold bg-[#205C38] text-white px-2.5 py-1 rounded-full">
                  {resolvedItems.length} Items
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#DCE8C8] border-t border-b border-[#DCE8C8]">
                {resolvedItems.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${idx}`}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.product.image}
                        alt={item.product.englishName}
                        className="w-12 h-12 object-cover rounded-xl bg-white border border-[#DCE8C8] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-gray-400 font-mono text-xs">
                            {idx + 1}.
                          </span>
                          <span className="font-bold text-[#123B26] truncate">
                            {item.product.englishName}
                          </span>
                        </div>
                        <p className="font-mukta text-xs text-[#205C38] font-medium pl-5">
                          {item.product.tamilName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-white border border-[#A8C66C] text-[#123B26] font-bold text-xs px-2.5 py-1 rounded-lg">
                        {item.weight}
                      </span>
                      <span className="text-[11px] font-bold text-[#205C38] bg-[#DCE8C8]/60 px-2 py-1 rounded-md">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Terms note */}
              <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-[#205C38] flex-shrink-0 mt-0.5" />
                <span>{offer.termsAndConditions}</span>
              </div>
            </div>

            {/* Delivery & Billing note */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[#123B26] text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-[#205C38]">
                <CheckCircle2 className="w-4 h-4 text-[#205C38]" />
                Doorstep Delivery in Chitlapakkam & Chennai
              </p>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                When you add this deal to your cart, all {resolvedItems.length} items will be marked as a combo package. Prices are verified and payment is settled on delivery via Cash or UPI.
              </p>
            </div>

          </div>

          {/* ── Footer Actions ── */}
          <div className="p-5 sm:p-6 bg-[#F7F5E8] border-t border-[#DCE8C8] space-y-3">
            
            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Add to Cart button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 relative overflow-hidden inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 group/btn ${
                  justAdded
                    ? 'bg-[#123B26] text-white shadow-emerald-900/30'
                    : 'bg-[#205C38] hover:bg-[#164328] text-white shadow-[#205C38]/30'
                }`}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-[#A8C66C] animate-bounce" />
                    <span>✓ Added {offer.comboName || 'Combo'} to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#A8C66C]" />
                    <span>Add {offer.comboName || 'Combo'} to Cart</span>
                  </>
                )}
              </button>

              {/* WhatsApp chat button */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 flex-shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Inquire on WhatsApp</span>
              </button>
            </div>

            {/* Quick checkout shortcuts if added */}
            {justAdded && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#A8C66C] text-xs animate-in fade-in duration-300">
                <span className="font-semibold text-[#123B26]">
                  Combo items are ready in your cart!
                </span>
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
                      navigate('/checkout');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-[11px] transition-colors"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-3 h-3 text-[#A8C66C]" />
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

