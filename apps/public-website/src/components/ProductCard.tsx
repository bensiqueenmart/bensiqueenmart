import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, Check, Eye, Info, MessageSquare, ChevronDown } from 'lucide-react';
import type { PublicProduct } from '@bqm/types';
import { imageSrc, packOptions, prettyCategory } from '../api';
import { STORE_CONFIG } from '../config/storeConfig';
import { useCart } from '../context/CartContext';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductCardProps {
  product: PublicProduct;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const { addToCart } = useCart();
  const options = packOptions(product);
  const [selectedWeight, setSelectedWeight] = useState<string>(options[0] ?? '');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    if (!product.available) return;
    addToCart(product, selectedWeight, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleDirectWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Hello Bensi Queen, I would like to order: ${product.name}${product.tamilName ? ` (${product.tamilName})` : ''} - ${quantity} pack(s) of ${selectedWeight}. Please confirm doorstep delivery.`;
    const url = `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const imgSrc = imageSrc(product.image);
  const unavailable = !product.available;

  // Compact List Layout
  if (layout === 'list') {
    return (
      <>
        <div className="bg-white rounded-2xl border border-[#E8DFC8] p-4 shadow-xs hover:shadow-md hover:border-[#205C38]/40 transition-all duration-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            onClick={() => setShowDetailModal(true)}
            className="flex items-center space-x-4 cursor-pointer w-full sm:w-auto flex-1 min-w-0"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E8DFC8] flex-shrink-0 bg-white relative">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={`${product.name}${product.tamilName ? ` – ${product.tamilName}` : ''}`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/Products_Cover.jpg';
                  }}
                  className={`w-full h-full object-cover object-center${unavailable ? ' grayscale opacity-55' : ''}`}
                />
              ) : null}
              {unavailable && (
                <span className="absolute bottom-1 left-1 right-1 text-center bg-[#123B26]/85 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                  Out of stock
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-[#205C38] uppercase tracking-wide bg-[#DCE8C8]/60 px-2 py-0.5 rounded-full">
                  {prettyCategory(product.category)}
                </span>
              </div>
              <h3 className="font-poppins text-base font-bold text-[#123B26] truncate hover:text-[#205C38] transition-colors mt-0.5">
                {product.name}
              </h3>
              {product.tamilName && (
                <p className="font-mukta text-xs font-semibold text-[#205C38]">
                  {product.tamilName}
                </p>
              )}
            </div>
          </div>

          {/* Weight Dropdown (List Mode) */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(e.target.value)}
              className="appearance-none bg-[#FCFAF5] hover:bg-white border border-[#DCE8C8] focus:border-[#123B26] text-[#123B26] font-extrabold text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#A8C66C]/30 cursor-pointer shadow-xs transition-all"
            >
              {options.map((weight) => (
                <option key={weight} value={weight} className="bg-white text-[#123B26] font-bold">
                  {weight} Pack
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#205C38] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Stepper & Action */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-shrink-0">
            <div className="flex items-center border border-[#DCE8C8] rounded-xl bg-[#F7F5E8] overflow-hidden">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="p-1.5 text-gray-500 hover:text-[#123B26] hover:bg-[#DCE8C8]/60 disabled:opacity-30 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-bold text-xs text-[#123B26]">{quantity}</span>
              <button
                type="button"
                onClick={handleIncrement}
                className="p-1.5 text-gray-500 hover:text-[#123B26] hover:bg-[#DCE8C8]/60 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable}
              title={unavailable ? 'Out of stock — back soon' : 'Add to cart'}
              className={`flex items-center space-x-1.5 py-2 px-3.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 ${
                unavailable
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isAdded
                    ? 'bg-[#205C38] text-white'
                    : 'bg-[#123B26] hover:bg-[#205C38] text-white'
              }`}
            >
              {unavailable ? (
                <span>Out of stock</span>
              ) : isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#A8C66C]" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#A8C66C]" />
                  <span>Add</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDirectWhatsAppOrder}
              className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 transition-colors"
              title="Quick WhatsApp Order"
              aria-label="Quick WhatsApp Order"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showDetailModal && (
          <ProductDetailModal
            product={product}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </>
    );
  }

  // Standard Grid Layout
  return (
    <>
      <div className="bg-white rounded-3xl border border-[#E8DFC8] overflow-hidden shadow-sm hover:shadow-xl hover:border-[#205C38]/40 transition-all duration-300 flex flex-col group hover:-translate-y-1.5">

        {/* ── Image Canvas ── */}
        <div
          onClick={() => setShowDetailModal(true)}
          className="relative w-full h-52 sm:h-56 overflow-hidden cursor-pointer border-b border-[#F0EDE0] bg-white"
          title={`Click to view details for ${product.name}`}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={`${product.name}${product.tamilName ? ` – ${product.tamilName}` : ''}`}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/Products_Cover.jpg';
              }}
              className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500${unavailable ? ' grayscale opacity-55' : ''}`}
            />
          ) : null}

          {/* Category badge */}
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-[#123B26] text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs border border-[#DCE8C8] uppercase tracking-wider z-10">
            {prettyCategory(product.category)}
          </span>

          {/* Out-of-stock pill */}
          {unavailable && (
            <span className="absolute top-3 right-3 bg-[#123B26]/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wide z-10">
              Out of stock — back soon
            </span>
          )}

          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-[#123B26]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 backdrop-blur-xs text-[#123B26] font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5 border border-[#DCE8C8]">
              <Eye className="w-3.5 h-3.5 text-[#205C38]" />
              <span>Quick View</span>
            </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">

          {/* Names */}
          <div>
            <h3
              onClick={() => setShowDetailModal(true)}
              className="font-poppins text-base font-extrabold text-[#123B26] leading-snug cursor-pointer hover:text-[#205C38] transition-colors"
            >
              {product.name}
            </h3>
            {product.tamilName && (
              <p className="font-mukta text-sm font-semibold text-[#205C38] mt-0.5">
                {product.tamilName}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex-1">
            <p
              className={`text-xs text-gray-600 leading-relaxed font-poppins transition-all duration-200 ${
                isExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {product.description}
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[11px] font-bold text-[#205C38] hover:text-[#123B26] hover:underline"
              >
                {isExpanded ? 'Show less' : 'Read more...'}
              </button>
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="text-[11px] font-medium text-gray-500 hover:text-[#123B26] inline-flex items-center space-x-1"
              >
                <Info className="w-3 h-3 text-[#205C38]" />
                <span>Details</span>
              </button>
            </div>
          </div>

          {/* Pack Weight Dropdown */}
          <div className="pt-2 border-t border-[#F0EDE0] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label htmlFor={`weight-${product.id}`} className="font-bold text-gray-500 uppercase tracking-wider">
                Pack Weight:
              </label>
              <span className="font-extrabold text-[#205C38] bg-[#DCE8C8]/70 px-2 py-0.5 rounded-md">
                {selectedWeight}
              </span>
            </div>
            <div className="relative">
              <select
                id={`weight-${product.id}`}
                value={selectedWeight}
                onChange={(e) => setSelectedWeight(e.target.value)}
                className="w-full appearance-none bg-[#FCFAF5] hover:bg-white border border-[#DCE8C8] focus:border-[#123B26] text-[#123B26] font-extrabold text-xs rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-[#A8C66C]/30 cursor-pointer shadow-xs transition-all"
              >
                {options.map((weight) => (
                  <option key={weight} value={weight} className="bg-white text-[#123B26] font-bold">
                    {weight} Pack
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#205C38] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Stepper + Dual Actions */}
          <div className="flex items-center space-x-2 pt-1">

            {/* Quantity stepper */}
            <div className="flex items-center border border-[#DCE8C8] rounded-xl bg-[#F7F5E8] overflow-hidden flex-shrink-0">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="px-2.5 py-2 text-gray-500 hover:text-[#123B26] hover:bg-[#DCE8C8]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center font-black text-xs text-[#123B26]">{quantity}</span>
              <button
                type="button"
                onClick={handleIncrement}
                className="px-2.5 py-2 text-gray-500 hover:text-[#123B26] hover:bg-[#DCE8C8]/60 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Add to cart button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable}
              title={unavailable ? 'Out of stock — back soon' : 'Add to cart'}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm active:scale-95 ${
                unavailable
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isAdded
                    ? 'bg-[#205C38] text-white'
                    : 'bg-[#123B26] hover:bg-[#205C38] text-white'
              }`}
            >
              {unavailable ? (
                <span>Out of stock</span>
              ) : isAdded ? (
                <>
                  <Check className="w-4 h-4 text-[#A8C66C]" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#A8C66C]" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {/* Direct WhatsApp Order button */}
            <button
              type="button"
              onClick={handleDirectWhatsAppOrder}
              className="p-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 hover:border-[#25D366]/60 transition-all flex-shrink-0 active:scale-95"
              title="Order this directly on WhatsApp"
              aria-label="Order on WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>

      {showDetailModal && (
        <ProductDetailModal
          product={product}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
};
