import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONFIG } from '../config/storeConfig';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    updateWeight,
    removeFromCart,
    totalProductsCount,
    totalPackagesCount,
  } = useCart();

  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F7F5E8] text-[#123B26] shadow-2xl flex flex-col border-l border-[#DCE8C8]">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#DCE8C8] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#123B26] text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#A8C66C]" />
              </div>
              <div>
                <h2 className="font-playfair text-lg font-bold text-[#123B26]">
                  Your Shopping Cart
                </h2>
                <p className="font-poppins text-xs text-[#205C38]">
                  {totalPackagesCount} packages selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full text-gray-500 hover:text-black hover:bg-[#F7F5E8] transition-colors"
              aria-label="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {items.length === 0 ? (
              /* Empty Cart State */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-[#A8C66C] flex items-center justify-center text-[#205C38]">
                  <ShoppingBag className="w-10 h-10 stroke-1" />
                </div>
                <div>
                  <h3 className="font-playfair text-xl font-bold text-[#123B26]">
                    Your Cart is Empty
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 font-poppins max-w-xs">
                    Browse our premium pulses, spices, oils, and dry fruits to add items to your cart.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/products');
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#123B26] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#205C38] shadow-button transition-all active:scale-95"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4 text-[#A8C66C]" />
                </button>
              </div>
            ) : (
              /* Items */
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex space-x-3.5 p-3.5 rounded-2xl border border-[#DCE8C8] bg-white shadow-soft"
                >
                  <img
                    src={item.image}
                    alt={item.englishName}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-[#F7F5E8] border border-[#DCE8C8] flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        {item.isCombo ? (
                          <>
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F2C94C] text-[#123B26] shadow-xs uppercase tracking-wide mb-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{item.comboName || 'Combo'}</span>
                            </div>
                            <h4 className="font-poppins text-xs sm:text-sm font-bold text-[#123B26] leading-snug">
                              {item.englishName}
                            </h4>
                            {item.comboIncludedText && (
                              <p className="text-[10px] text-gray-600 font-poppins mt-1 line-clamp-2 leading-tight">
                                <span className="font-semibold text-[#205C38]">Contains: </span>
                                {item.comboIncludedText}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <h4 className="font-poppins text-xs sm:text-sm font-bold text-[#123B26] truncate">
                              {item.englishName}
                            </h4>
                            <p className="font-mukta text-xs font-semibold text-[#205C38]">
                              {item.tamilName}
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Weight selector & Stepper */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] text-gray-500 font-poppins">Pack:</span>
                        {item.isCombo ? (
                          <span className="bg-[#DCE8C8] text-[#123B26] font-bold text-[11px] px-2 py-0.5 rounded-md">
                            Combo Pack
                          </span>
                        ) : (
                          <select
                            value={item.weight}
                            onChange={(e) =>
                              updateWeight(item.id, e.target.value)
                            }
                            className="bg-[#F7F5E8] border border-[#DCE8C8] text-xs font-bold text-[#123B26] rounded-md px-2 py-0.5 focus:outline-none"
                          >
                            {STORE_CONFIG.weightOptions.map((w) => (
                              <option key={w} value={w}>
                                {w}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex items-center border border-[#DCE8C8] rounded-lg bg-[#F7F5E8] overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-gray-600 hover:text-black hover:bg-[#DCE8C8]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[#123B26]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-gray-600 hover:text-black hover:bg-[#DCE8C8]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-[#DCE8C8] space-y-3">
              <div className="space-y-1.5 pb-2 text-xs text-[#123B26] font-poppins">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-600">Total Unique Products:</span>
                  <span className="font-bold">{totalProductsCount} items</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-600">Total Packages:</span>
                  <span className="font-bold text-[#205C38]">
                    {totalPackagesCount} packages
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 italic pt-1 border-t border-gray-100">
                  * Final pricing and payment confirmed directly via WhatsApp.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider shadow-button transition-all active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#A8C66C]" />
              </button>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/cart');
                }}
                className="w-full text-center py-1.5 text-xs text-[#205C38] hover:text-[#123B26] font-semibold transition-colors"
              >
                View Full Cart Page
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
