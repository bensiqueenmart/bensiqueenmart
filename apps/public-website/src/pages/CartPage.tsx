import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, Sparkles, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORE_CONFIG, WeightOption } from '../config/storeConfig';
import { SEOHead } from '../components/SEOHead';

export const CartPage: React.FC = () => {
  const {
    items,
    updateQuantity,
    updateWeight,
    removeFromCart,
    clearCart,
    totalProductsCount,
    totalPackagesCount,
  } = useCart();

  const navigate = useNavigate();

  return (
    <div className="py-12 bg-[#F7F5E8] text-[#123B26] min-h-screen">
      <SEOHead
        title="Shopping Cart | Bensi Queen"
        description="Review your selected grocery items before checkout. Pulses, spices, nuts and dry fruits – ready for WhatsApp ordering."
        canonical="https://bensiqueen.com/cart"
        noindex={true}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-[#DCE8C8] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-extrabold text-[#123B26]">
              Shopping Cart Review
            </h1>
            <p className="font-poppins text-xs sm:text-sm text-gray-600 mt-1">
              Verify your selected products, package weights, and quantities before checkout.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all items from your cart?')) {
                  clearCart();
                }
              }}
              className="text-xs text-red-600 hover:text-red-800 self-start sm:self-auto underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart View */
          <div className="bg-white rounded-3xl p-12 text-center border border-[#DCE8C8] shadow-soft max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#F7F5E8] border-2 border-dashed border-[#A8C66C] flex items-center justify-center text-[#205C38] mx-auto">
              <ShoppingBag className="w-10 h-10 stroke-1" />
            </div>
            <h2 className="font-playfair text-2xl font-bold text-[#123B26]">
              Your Cart is Empty
            </h2>
            <p className="text-xs text-gray-600 font-poppins">
              You haven&apos;t added any grocery items yet. Explore our fresh collection of pulses, spices, oils, and nuts!
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-button"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4 text-[#A8C66C]" />
              </Link>
            </div>
          </div>
        ) : (
          /* Populated Cart */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Items Column (8 cols) */}
            <div className="lg:col-span-8 space-y-3.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8C8] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Product Details */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <img
                      src={item.image}
                      alt={item.englishName}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-[#F7F5E8] border border-[#DCE8C8] flex-shrink-0"
                    />
                    <div>
                      {item.isCombo ? (
                        <>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#F2C94C] text-[#123B26] shadow-xs uppercase tracking-wider mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#123B26]" />
                            <span>{item.comboName || 'Combo'}</span>
                          </div>
                          <h3 className="font-playfair text-base sm:text-lg font-bold text-[#123B26] leading-snug">
                            {item.englishName}
                          </h3>
                          {item.comboIncludedText && (
                            <div className="mt-2 bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl p-3 max-w-lg">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#205C38] block mb-1">
                                Package Contains:
                              </span>
                              <p className="font-poppins text-xs text-gray-700 leading-relaxed">
                                {item.comboIncludedText}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h3 className="font-poppins text-sm sm:text-base font-bold text-[#123B26]">
                            {item.englishName}
                          </h3>
                          <p className="font-mukta text-xs sm:text-sm font-semibold text-[#205C38]">
                            {item.tamilName}
                          </p>
                          <span className="text-[11px] text-gray-500 uppercase tracking-wider block mt-1">
                            {item.categoryName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Weight, Stepper & Delete */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* Weight display / selector */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-gray-600">Pack:</span>
                      {item.isCombo ? (
                        <span className="bg-[#DCE8C8] text-[#123B26] font-bold text-xs px-2.5 py-1 rounded-lg">
                          Combo Pack
                        </span>
                      ) : (
                        <select
                          value={item.weight}
                          onChange={(e) =>
                            updateWeight(item.id, e.target.value as WeightOption)
                          }
                          className="bg-[#F7F5E8] border border-[#DCE8C8] text-xs font-bold text-[#123B26] rounded-lg px-2 py-1 focus:outline-none"
                        >
                          {STORE_CONFIG.weightOptions.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-[#DCE8C8] rounded-xl bg-[#F7F5E8] overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-gray-600 hover:text-black hover:bg-[#DCE8C8]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-[#123B26]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-gray-600 hover:text-black hover:bg-[#DCE8C8]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center space-x-1.5 text-xs text-[#205C38] hover:text-[#123B26] font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue Shopping for More Groceries</span>
                </Link>
              </div>
            </div>

            {/* Order Summary Column (4 cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-4">
              <h2 className="font-playfair text-xl font-bold text-[#123B26] border-b border-gray-100 pb-3">
                Order Review
              </h2>

              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>Unique Grocery Items:</span>
                  <span className="font-bold text-[#123B26]">{totalProductsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Packaged Units:</span>
                  <span className="font-bold text-[#205C38]">{totalPackagesCount}</span>
                </div>
                {items.some((i) => i.isCombo) && (
                  <div className="flex justify-between text-[#205C38] font-bold pt-1 border-t border-dashed border-gray-200">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#F2C94C]" />
                      <span>Combo Package Items:</span>
                    </span>
                    <span>{items.filter((i) => i.isCombo).length} items</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 italic">
                * Note: Bensi Queen confirms current item prices and final bill total directly via WhatsApp. Payment is made on delivery.
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider shadow-button transition-all active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#A8C66C]" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
