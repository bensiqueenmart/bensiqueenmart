import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  ShieldCheck,
  Sparkles,
  Truck,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { Product } from '../types';
import { WeightOption, STORE_CONFIG } from '../config/storeConfig';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
}) => {
  const { addToCart } = useCart();
  const [selectedWeight, setSelectedWeight] = useState<WeightOption>('500g');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  if (!product) return null;

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    addToCart(product, selectedWeight, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  const handleWhatsAppInquiry = () => {
    const text = `Hello Bensi Queen, I would like to inquire about ${product.englishName} (${product.tamilName}) - ${quantity} pack(s) of ${selectedWeight}.`;
    const url = `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-[#F7F5E8] text-[#123B26] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#DCE8C8] relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-black transition-colors shadow-sm"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="relative bg-white min-h-[260px] md:min-h-[380px] flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-[#DCE8C8]">
            <img
              src={product.image}
              alt={`${product.englishName} – ${product.tamilName}`}
              className="w-full h-full object-cover object-center"
            />
            {/* Category Badge */}
            <span className="absolute top-4 left-4 bg-[#DCE8C8]/95 backdrop-blur-xs text-[#123B26] text-xs font-bold px-3 py-1 rounded-full shadow-xs border border-[#A8C66C]/40 uppercase tracking-wider">
              {product.categoryName}
            </span>
            {product.popular && (
              <span className="absolute bottom-4 left-4 bg-[#F2C94C] text-[#123B26] text-xs font-black px-3 py-1 rounded-full shadow-xs uppercase tracking-wide">
                Popular Choice
              </span>
            )}
          </div>

          {/* Product Info & Detailed Description */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-5 bg-[#F7F5E8]">
            <div>
              {/* Product Names */}
              <h2 className="font-playfair text-2xl font-bold text-[#123B26] leading-tight">
                {product.englishName}
              </h2>
              <p className="font-mukta text-lg font-bold text-[#205C38] mt-0.5">
                {product.tamilName}
              </p>

              {/* Full Product Description */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-bold text-[#123B26] uppercase tracking-wider mb-1.5">
                  Product Description & Culinary Uses
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-poppins">
                  {product.description}
                </p>
              </div>

              {/* Quality Badges */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-1.5 text-[11px] text-gray-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#205C38] flex-shrink-0" />
                  <span>100% Quality Checked</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-gray-700 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#205C38] flex-shrink-0" />
                  <span>Fresh Batch Sealed</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-gray-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#205C38] flex-shrink-0" />
                  <span>No Artificial Colors</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-gray-700 font-semibold">
                  <Truck className="w-3.5 h-3.5 text-[#205C38] flex-shrink-0" />
                  <span>Doorstep Delivery</span>
                </div>
              </div>
            </div>

            {/* Weight Selection & Quantity */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              
              {/* Weight Selector Dropdown */}
              <div>
                <label
                  htmlFor={`modal-weight-${product.id}`}
                  className="block text-xs font-bold text-[#123B26] uppercase tracking-wider mb-2"
                >
                  Select Pack Weight:
                </label>
                <div className="relative">
                  <select
                    id={`modal-weight-${product.id}`}
                    value={selectedWeight}
                    onChange={(e) => setSelectedWeight(e.target.value as WeightOption)}
                    className="w-full appearance-none bg-white border-2 border-[#DCE8C8] hover:border-[#205C38] focus:border-[#123B26] text-[#123B26] font-black text-sm rounded-2xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#A8C66C]/40 cursor-pointer shadow-xs transition-all"
                  >
                    {STORE_CONFIG.weightOptions.map((weight) => (
                      <option key={weight} value={weight} className="bg-white text-[#123B26] font-bold">
                        {weight} Pack
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#205C38] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Quantity Stepper & Add to Cart */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-[#DCE8C8] rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="p-2 text-gray-600 hover:text-black hover:bg-[#F7F5E8] disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-[#123B26]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="p-2 text-gray-600 hover:text-black hover:bg-[#F7F5E8]"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-button active:scale-95 ${
                    isAdded
                      ? 'bg-[#205C38] text-white'
                      : 'bg-[#123B26] hover:bg-[#205C38] text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 text-[#A8C66C]" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#A8C66C]" />
                      <span>Add to Cart ({selectedWeight})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Fast WhatsApp Inquiry */}
              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-white hover:bg-[#E8DFC8] text-[#123B26] text-xs font-semibold transition-colors border border-[#DCE8C8]"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#205C38]" />
                <span>Quick Inquiry via WhatsApp</span>
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
