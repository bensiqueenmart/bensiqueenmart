import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  User,
  Phone,
  MapPin,
  MessageSquare,
  AlertCircle,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { STORE_CONFIG } from '../config/storeConfig';
import { createOnlineOrder, packOptions } from '../api';
import { cartLineTotal, cartSubtotal, formatPrice } from '../utils/pricing';
import type { CustomerDetails } from '../types';
import { SEOHead } from '../components/SEOHead';

const SUCCESS_STORAGE_KEY = 'bqm_last_order';

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
  const { products, combos } = useCatalog();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    mobile: '',
    address: '',
    instructions: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const productById = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const comboById = React.useMemo(() => new Map(combos.map((c) => [c.id, c])), [combos]);
  const { subtotal, hasUnpriced } = React.useMemo(
    () => {
      const { total, hasUnpriced } = cartSubtotal(items, productById, comboById);
      return { subtotal: total, hasUnpriced };
    },
    [items, productById, comboById],
  );

  const validate = (): boolean => {
    const err: { [key: string]: string } = {};
    if (!customer.name.trim()) {
      err.name = 'Please enter your full name.';
    }
    const cleanMobile = customer.mobile.replace(/\D/g, '');
    if (!customer.mobile.trim()) {
      err.mobile = 'Contact number is required.';
    } else if (cleanMobile.length < 10) {
      err.mobile = 'Please enter a valid 10-digit contact number.';
    }
    if (!customer.address.trim()) {
      err.address = 'Please enter your complete delivery address.';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (submitting) return;
    setApiError(null);
    if (!validate()) return;
    if (items.length === 0) return;

    const lines = [];
    for (const item of items) {
      if (item.isCombo) {
        const comboId = item.comboId ?? item.productId;
        const combo = comboById.get(comboId);
        if (!combo || !combo.isActive || !combo.available) {
          setApiError(
            `"${item.englishName}" is no longer available. Please remove it and try again.`,
          );
          return;
        }
        lines.push({ comboId, quantity: item.quantity });
      } else {
        const product = productById.get(item.productId);
        const packOk =
          !!product && packOptions(product).some((o) => o.value === item.weight && o.available);
        if (!product || !product.available || !packOk) {
          setApiError(
            `"${item.englishName}" (${item.weight}) is no longer available. Please choose an available pack or remove it.`,
          );
          return;
        }
        lines.push({ productId: item.productId, weight: item.weight, quantity: item.quantity });
      }
    }

    setSubmitting(true);
    try {
      const order = await createOnlineOrder(
        {
          name: customer.name.trim(),
          mobile: customer.mobile.trim(),
          address: customer.address.trim(),
          ...(customer.instructions?.trim()
            ? { instructions: customer.instructions.trim() }
            : {}),
        },
        lines,
      );
      try {
        sessionStorage.setItem(
          SUCCESS_STORAGE_KEY,
          JSON.stringify({
            orderNo: order.orderNo,
            createdAt: order.createdAt,
            totalPrice: order.totalPrice,
            lineTotals: order.orderItems.map((l) => l.price),
            customer: {
              name: customer.name.trim(),
              mobile: customer.mobile.trim(),
              address: customer.address.trim(),
              ...(customer.instructions?.trim()
                ? { instructions: customer.instructions.trim() }
                : {}),
            },
            items,
          }),
        );
      } catch {
        // sessionStorage unavailable (private mode) — success page falls back gracefully.
      }
      clearCart();
      navigate('/order-success', { replace: true });
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (hasError: boolean) =>
    `w-full bg-[#F7F5E8] border rounded-xl pl-10 pr-3 py-3 text-base sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
      hasError
        ? 'border-red-400 focus:ring-red-400'
        : 'border-[#DCE8C8] focus:ring-[#123B26] focus:border-[#123B26]'
    }`;

  return (
    <div className="py-8 sm:py-12 bg-[#F7F5E8] text-[#123B26] min-h-screen">
      <SEOHead
        title="Your Order | Bensi Queen"
        description="Review your grocery items and place your order. Pulses, spices, nuts and dry fruits – confirmed directly via WhatsApp."
        canonical="https://bensiqueen.com/cart"
        noindex={true}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="border-b border-[#DCE8C8] pb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold text-[#123B26]">
              Your Order
            </h1>
            <p className="font-poppins text-xs sm:text-sm text-gray-600 mt-1">
              Review items, add contact details, and place your order in one step.
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all items from your order?')) {
                  clearCart();
                }
              }}
              className="text-xs text-red-600 hover:text-red-800 self-start underline flex-shrink-0 py-1"
            >
              Clear cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart View */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#DCE8C8] shadow-soft max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#F7F5E8] border-2 border-dashed border-[#A8C66C] flex items-center justify-center text-[#205C38] mx-auto">
              <ShoppingBag className="w-10 h-10 stroke-1" />
            </div>
            <h2 className="font-playfair text-2xl font-bold text-[#123B26]">
              Your Cart is Empty
            </h2>
            <p className="text-xs text-gray-600 font-poppins">
              You haven&apos;t added any grocery items yet. Explore our fresh collection of pulses,
              spices, oils, and nuts!
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-button"
              >
                <span>Browse Products</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Block 1 — Your Items */}
            <section className="bg-white p-4 sm:p-6 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-3">
              <h2 className="font-poppins text-sm font-bold text-[#123B26] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-[#123B26] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  1
                </span>
                <span>Your Items</span>
              </h2>

              {items.map((item) => {
                const product = !item.isCombo ? productById.get(item.productId) : undefined;
                const options = product
                  ? packOptions(product)
                  : [{ value: item.weight, label: item.weight, available: false }];
                // Keep the stored pack visible even if it is no longer offered,
                // so the customer can see what to change.
                const offered = options.some((o) => o.value === item.weight)
                  ? options
                  : [...options, { value: item.weight, label: item.weight, available: false }];
                const packAvailable = options.some(
                  (o) => o.value === item.weight && o.available,
                );
                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 rounded-2xl border border-[#DCE8C8] bg-white shadow-soft space-y-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.englishName}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl bg-[#F7F5E8] border border-[#DCE8C8] flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        {item.isCombo ? (
                          <>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F2C94C] text-[#123B26] uppercase tracking-wide mb-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{item.comboName || 'Combo'}</span>
                            </div>
                            <h3 className="font-poppins text-sm font-bold text-[#123B26] leading-snug">
                              {item.englishName}
                            </h3>
                            {item.comboIncludedText && (
                              <p className="text-[11px] text-gray-600 font-poppins mt-0.5 leading-snug line-clamp-2">
                                <span className="font-semibold text-[#205C38]">Contains: </span>
                                {item.comboIncludedText}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <h3 className="font-poppins text-sm font-bold text-[#123B26] leading-snug">
                              {item.englishName}
                            </h3>
                            <p className="font-mukta text-xs font-semibold text-[#205C38]">
                              {item.tamilName}
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 p-2 -m-1 transition-colors flex-shrink-0"
                        title="Remove from order"
                        aria-label={`Remove ${item.englishName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-600">Pack:</span>
                        {item.isCombo ? (
                          <span className="bg-[#DCE8C8] text-[#123B26] font-bold text-xs px-2.5 py-1 rounded-lg">
                            Combo Pack
                          </span>
                        ) : (
                          <select
                            value={item.weight}
                            onChange={(e) => updateWeight(item.id, e.target.value)}
                            className="bg-[#F7F5E8] border border-[#DCE8C8] text-xs font-bold text-[#123B26] rounded-lg px-2 py-1.5 focus:outline-none min-h-[40px]"
                            aria-label={`Pack size for ${item.englishName}`}
                          >
                            {offered.map((o) => (
                              <option key={o.value} value={o.value} disabled={!o.available}>
                                {o.available ? o.label : `${o.label} — out of stock`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex items-center border border-[#DCE8C8] rounded-xl bg-[#F7F5E8] overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-2 text-gray-600 hover:text-black hover:bg-[#DCE8C8] min-w-[40px] min-h-[40px] flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-bold text-[#123B26] min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-2 text-gray-600 hover:text-black hover:bg-[#DCE8C8] min-w-[40px] min-h-[40px] flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {(() => {
                        const line = cartLineTotal(item, productById, comboById);
                        if (line === null) {
                          return (
                            <span className="text-xs font-semibold text-gray-500">
                              Price on request
                            </span>
                          );
                        }
                        const per = line / item.quantity;
                        return (
                          <div className="text-right">
                            <div className="font-extrabold text-sm text-[#123B26]">
                              {formatPrice(line)}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">
                              {formatPrice(per)} × {item.quantity}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    {!item.isCombo && !packAvailable && (
                      <p className="text-[11px] text-red-600 font-semibold">
                        This pack is no longer available — please choose another pack or remove this
                        item.
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-1.5 text-xs text-[#205C38] hover:text-[#123B26] font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue shopping for more groceries</span>
                </Link>
              </div>

              {/* Bottom summary row */}
              <div className="rounded-2xl bg-[#123B26] text-white px-4 py-3 text-sm space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-poppins font-semibold text-xs uppercase tracking-wider text-white/80">
                    Subtotal
                  </span>
                  <span className="font-extrabold text-base">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-poppins font-semibold text-xs uppercase tracking-wider text-white/80">
                    Total quantity
                  </span>
                  <span className="font-bold">
                    {totalPackagesCount} packs · {totalProductsCount}{' '}
                    {totalProductsCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                {hasUnpriced && (
                  <p className="text-[11px] text-white/70">
                    Some items show “Price on request” — the store will confirm them on WhatsApp.
                  </p>
                )}
              </div>
            </section>

            {/* Block 2 — Contact & Delivery */}
            <section className="bg-white p-4 sm:p-6 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-4">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between gap-2">
                <h2 className="font-poppins text-sm font-bold text-[#123B26] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#123B26] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </span>
                  <span>Contact &amp; Delivery</span>
                </h2>
                <span className="text-xs text-gray-400 font-medium flex-shrink-0">* Required</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 font-poppins">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={customer.name}
                      onChange={(e) => {
                        setCustomer({ ...customer, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={inputCls(!!errors.name)}
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-red-500 mt-1 font-poppins">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 font-poppins">
                    Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customer.mobile}
                      onChange={(e) => {
                        setCustomer({ ...customer, mobile: e.target.value });
                        if (errors.mobile) setErrors({ ...errors, mobile: '' });
                      }}
                      className={inputCls(!!errors.mobile)}
                      autoComplete="tel"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 font-poppins">
                    The number we should contact you on — keep WhatsApp handy on this number.
                  </p>
                  {errors.mobile && (
                    <p className="text-[11px] text-red-500 mt-1 font-poppins">{errors.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 font-poppins">
                    Complete Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <textarea
                      rows={2}
                      placeholder="Door/Flat No, Street, Landmark, Chitlapakkam, Chennai - 600064"
                      value={customer.address}
                      onChange={(e) => {
                        setCustomer({ ...customer, address: e.target.value });
                        if (errors.address) setErrors({ ...errors, address: '' });
                      }}
                      className={`${inputCls(!!errors.address)} resize-y min-h-[76px]`}
                      autoComplete="street-address"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-[11px] text-red-500 mt-1 font-poppins">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 font-poppins">
                    Additional Delivery Instructions (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Please deliver between 5-7 PM / Call upon arrival"
                      value={customer.instructions}
                      onChange={(e) =>
                        setCustomer({ ...customer, instructions: e.target.value })
                      }
                      className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl pl-10 pr-3 py-3 text-base sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#123B26]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#DCE8C8]/60 border border-[#A8C66C]/40 text-[#123B26] text-xs flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-[#205C38] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#123B26]">No online payment needed</p>
                  <p className="text-gray-700 mt-0.5 text-[11.5px] leading-relaxed font-poppins">
                    Our store will contact you on WhatsApp to the number above to confirm
                    availability and payment. Please keep WhatsApp reachable.
                  </p>
                </div>
              </div>

              {apiError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 font-poppins">{apiError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-sm uppercase tracking-wider shadow-button transition-all active:scale-[0.98] disabled:opacity-60 min-h-[52px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#A8C66C]" />
                    <span>Placing your order…</span>
                  </>
                ) : (
                  <span>
                    Place Order <span className="text-white/60">for</span> {formatPrice(subtotal)}
                  </span>
                )}
              </button>

              <p className="text-[11px] text-gray-500 italic text-center font-poppins">
                * Prices reflect the website catalog at order time. Payment is confirmed via
                WhatsApp ({STORE_CONFIG.primaryPhone}).
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
