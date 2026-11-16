import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  User,
  Phone,
  MapPin,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Download,
  Send,
  Loader2,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CustomerDetails } from '../types';
import {
  generateOrderReference,
  formatOrderDateTime,
  generateWhatsAppMessage,
  getWhatsAppOrderUrl,
} from '../utils/orderUtils';
import { downloadOrderSummaryPdf } from '../utils/pdfGenerator';
import { OrderSummaryPDFTemplate } from '../components/OrderSummaryPDFTemplate';
import { SEOHead } from '../components/SEOHead';

export const CheckoutPage: React.FC = () => {
  const { items, totalPackagesCount, clearCart } = useCart();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    mobile: '',
    address: '',
    instructions: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderRef] = useState<string>(() => generateOrderReference());
  const { date: orderDate, time: orderTime } = formatOrderDateTime();

  if (items.length === 0) {
    return (
      <div className="py-20 bg-[#F7F5E8] min-h-screen text-center px-4 text-[#123B26]">
        <SEOHead
          title="Checkout | Bensi Queen"
          description="Complete your grocery order via WhatsApp. Bensi Queen – quality pulses, spices, nuts and dry fruits, Chitlapakkam, Chennai."
          canonical="https://bensiqueen.com/checkout"
          noindex={true}
        />
        <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#F7F5E8] border border-[#DCE8C8] flex items-center justify-center text-[#205C38] mx-auto">
            <ShoppingBag className="w-8 h-8 stroke-1 text-[#205C38]" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-[#123B26]">
            No Items in Checkout
          </h2>
          <p className="text-xs text-gray-600 font-poppins leading-relaxed">
            Please add grocery items to your cart before proceeding to checkout.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#123B26] hover:bg-[#205C38] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-button active:scale-95"
          >
            <span>Explore Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const err: { [key: string]: string } = {};

    if (!customer.name.trim()) {
      err.name = 'Please enter your full name.';
    }

    const cleanMobile = customer.mobile.replace(/\D/g, '');
    if (!customer.mobile.trim()) {
      err.mobile = 'Mobile number is required.';
    } else if (cleanMobile.length < 10) {
      err.mobile = 'Please enter a valid 10-digit mobile number.';
    }

    if (!customer.address.trim()) {
      err.address = 'Please enter complete delivery address in Chitlapakkam/Chennai.';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleWhatsAppOrder = () => {
    if (!validate()) return;

    const message = generateWhatsAppMessage(customer, items, orderRef);
    const url = getWhatsAppOrderUrl(message);

    window.open(url, '_blank');
    setOrderPlaced(true);
  };

  const handleDownloadPDF = async () => {
    if (!validate()) return;

    try {
      setIsGeneratingPdf(true);
      await downloadOrderSummaryPdf('order-summary-pdf-canvas', orderRef);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not download PDF automatically. Please check your browser permissions.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="py-12 bg-[#F7F5E8] text-[#123B26] min-h-screen">
      <SEOHead
        title="Checkout | Bensi Queen"
        description="Complete your grocery order via WhatsApp. Bensi Queen – quality pulses, spices, nuts and dry fruits, Chitlapakkam, Chennai."
        canonical="https://bensiqueen.com/checkout"
        noindex={true}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Title */}
        <div className="border-b border-[#DCE8C8] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#DCE8C8] border border-[#A8C66C]/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#123B26] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#205C38]" />
              <span>Step 2 of 2: Confirm Order</span>
            </div>
            <h1 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#123B26]">
              Checkout & Order Submission
            </h1>
            <p className="font-poppins text-xs sm:text-sm text-gray-600 mt-1">
              Submit your order directly to the Bensi Queen shop owner via WhatsApp.
            </p>
          </div>
          <Link
            to="/cart"
            className="text-xs font-bold text-[#205C38] hover:text-[#123B26] flex items-center self-start sm:self-auto transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Cart</span>
          </Link>
        </div>

        {orderPlaced && (
          <div className="bg-[#DCE8C8]/80 border-2 border-[#205C38] rounded-2xl p-5 text-[#123B26] space-y-2 shadow-soft animate-fade-in">
            <div className="flex items-center space-x-2 font-bold text-sm text-[#205C38]">
              <CheckCircle2 className="w-5 h-5 text-[#205C38]" />
              <span>WhatsApp Chat Opened with Pre-Formatted Order!</span>
            </div>
            <p className="text-xs text-gray-800 leading-relaxed font-poppins">
              <strong>Action Required:</strong> Please make sure you press the{' '}
              <span className="font-bold underline text-[#123B26]">Send button</span> inside WhatsApp to transmit your grocery list to the shop owner.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  clearCart();
                  navigate('/products');
                }}
                className="px-4 py-2 rounded-xl bg-[#123B26] text-white text-xs font-bold hover:bg-[#205C38] transition-colors shadow-button"
              >
                Clear Cart & Shop More
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-xl bg-white border border-[#DCE8C8] text-[#123B26] text-xs font-semibold hover:bg-[#F7F5E8] transition-colors"
              >
                Download Order PDF
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Customer Details Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-5">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <h2 className="font-poppins text-sm font-bold text-[#123B26] uppercase tracking-wider flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#123B26] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Delivery Details</span>
              </h2>
              <span className="text-xs text-red-500 font-semibold">* Required</span>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 font-poppins">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={customer.name}
                    onChange={(e) => {
                      setCustomer({ ...customer, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full bg-[#F7F5E8] border rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
                      errors.name
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-[#DCE8C8] focus:ring-[#123B26] focus:border-[#123B26]'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] text-red-500 mt-1 font-poppins">{errors.name}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 font-poppins">
                  Mobile Number (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={customer.mobile}
                    onChange={(e) => {
                      setCustomer({ ...customer, mobile: e.target.value });
                      if (errors.mobile) setErrors({ ...errors, mobile: '' });
                    }}
                    className={`w-full bg-[#F7F5E8] border rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
                      errors.mobile
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-[#DCE8C8] focus:ring-[#123B26] focus:border-[#123B26]'
                    }`}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-[11px] text-red-500 mt-1 font-poppins">{errors.mobile}</p>
                )}
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 font-poppins">
                  Complete Delivery Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    placeholder="Door/Flat No, Street, Landmark, Chitlapakkam, Chennai - 600064"
                    value={customer.address}
                    onChange={(e) => {
                      setCustomer({ ...customer, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: '' });
                    }}
                    className={`w-full bg-[#F7F5E8] border rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
                      errors.address
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-[#DCE8C8] focus:ring-[#123B26] focus:border-[#123B26]'
                    }`}
                  />
                </div>
                {errors.address && (
                  <p className="text-[11px] text-red-500 mt-1 font-poppins">{errors.address}</p>
                )}
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 font-poppins">
                  Additional Delivery Instructions (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Please deliver between 5-7 PM / Call upon arrival"
                    value={customer.instructions}
                    onChange={(e) =>
                      setCustomer({ ...customer, instructions: e.target.value })
                    }
                    className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#123B26] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#123B26]"
                  />
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="p-3.5 rounded-2xl bg-[#DCE8C8]/60 border border-[#A8C66C]/40 text-[#123B26] text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-[#205C38] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#123B26]">Direct WhatsApp Order Process:</p>
                <p className="text-gray-700 mt-0.5 text-[11.5px] leading-relaxed font-poppins">
                  Clicking &quot;Place Order via WhatsApp&quot; opens WhatsApp with your complete order formatted. <strong>You must tap Send inside WhatsApp</strong> to submit it to the owner.
                </p>
              </div>
            </div>

            {/* Actions: WhatsApp & PDF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white border-2 border-[#123B26] text-[#123B26] hover:bg-[#F7F5E8] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#205C38]" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#205C38]" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-xs uppercase tracking-wider shadow-button transition-all active:scale-98"
              >
                <Send className="w-4 h-4 text-[#A8C66C]" />
                <span>Place Order via WhatsApp</span>
              </button>
            </div>

          </div>

          {/* Order Summary Column (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <h2 className="font-poppins text-sm font-bold text-[#123B26] uppercase tracking-wider flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#123B26] text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Order Summary</span>
              </h2>
              <span className="text-xs text-gray-500 font-mono">Ref: {orderRef}</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-2xl bg-[#F7F5E8]/40">
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 flex items-start justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    {item.isCombo ? (
                      <>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-black bg-[#F2C94C] text-[#123B26] uppercase tracking-wide mb-1 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{item.comboName || 'COMBO'}</span>
                        </div>
                        <p className="font-bold text-[#123B26] font-poppins leading-snug">
                          {idx + 1}. {item.englishName}
                        </p>
                        {item.comboIncludedText && (
                          <p className="text-[10px] text-gray-600 font-poppins mt-0.5 leading-snug">
                            <span className="font-semibold text-[#205C38]">Contains: </span>
                            {item.comboIncludedText}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-[#123B26] truncate font-poppins">
                          {idx + 1}. {item.englishName}
                        </p>
                        <p className="font-mukta text-xs text-[#205C38] font-medium">
                          {item.tamilName}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 pt-0.5">
                    <span className="bg-white border border-[#DCE8C8] text-[#123B26] font-semibold text-[11px] px-2 py-0.5 rounded mr-1.5">
                      {item.weight}
                    </span>
                    <span className="font-bold text-[#123B26]">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs text-gray-700 pt-2 border-t border-gray-100 font-poppins">
              <div className="flex justify-between">
                <span>Total Unique Items:</span>
                <span className="font-bold text-[#123B26]">{items.length} items</span>
              </div>
              <div className="flex justify-between">
                <span>Total Packages:</span>
                <span className="font-bold text-[#205C38]">{totalPackagesCount} packs</span>
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

            <div className="text-[11px] text-gray-500 italic pt-1 font-poppins border-t border-gray-100">
              * Payment is settled upon delivery directly with the store owner.
            </div>
          </div>

        </div>

      </div>

      {/* Hidden Offscreen Container for Clean PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <OrderSummaryPDFTemplate
          orderRef={orderRef}
          orderDate={orderDate}
          orderTime={orderTime}
          customer={customer}
          items={items}
        />
      </div>
    </div>
  );
};
