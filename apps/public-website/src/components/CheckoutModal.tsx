import React, { useState } from 'react';
import {
  X,
  Send,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  Phone,
  MapPin,
  MessageSquare,
  Loader2,
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
import { OrderSummaryPDFTemplate } from './OrderSummaryPDFTemplate';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { items, totalPackagesCount, clearCart } = useCart();

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

  if (!isOpen) return null;

  const validate = (): boolean => {
    const err: { [key: string]: string } = {};

    if (!customer.name.trim()) {
      err.name = 'Please enter your full name (உங்கள் பெயரை உள்ளிடவும்)';
    }

    const cleanMobile = customer.mobile.replace(/\D/g, '');
    if (!customer.mobile.trim()) {
      err.mobile = 'Mobile number is required (மொபைல் எண் அவசியம்)';
    } else if (cleanMobile.length < 10) {
      err.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!customer.address.trim()) {
      err.address = 'Please enter complete delivery address (டெலிவரி முகவரி அவசியம்)';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleWhatsAppOrder = () => {
    if (!validate()) return;

    const message = generateWhatsAppMessage(customer, items, orderRef);
    const url = getWhatsAppOrderUrl(message);

    // Open WhatsApp
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 relative z-10">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#B9E769]/50 flex flex-col my-8">
          
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#F4F9EC] border-b border-[#B9E769]/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#155B32] text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-playfair text-xl font-bold text-[#155B32]">
                  Checkout & Order Summary
                </h2>
                <p className="font-mukta text-xs text-[#155B32]/80">
                  ஆர்டர் விவரங்கள் மற்றும் வாட்ஸ்அப் பதிவு
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form and Summary Content */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            
            {orderPlaced && (
              <div className="bg-[#E3EED7] border border-[#75D900] rounded-2xl p-4 text-[#155B32] space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#155B32]" />
                  <span>Order Pre-formatted! WhatsApp Chat Opened.</span>
                </div>
                <p className="text-xs text-gray-700">
                  <strong>Important:</strong> Please ensure you press the{' '}
                  <span className="font-bold underline">SEND</span> button inside
                  WhatsApp to transmit your order to the Bensi Queen shop owner!
                </p>
              </div>
            )}

            {/* Customer Details Form */}
            <div className="space-y-4">
              <div className="border-b border-[#B9E769]/40 pb-2 flex items-center justify-between">
                <h3 className="font-poppins text-sm font-bold text-[#155B32] uppercase tracking-wider">
                  1. Delivery Details (வாடிக்கையாளர் தகவல்)
                </h3>
                <span className="text-xs text-red-500 font-medium">* Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Name (பெயர்) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={customer.name}
                      onChange={(e) => {
                        setCustomer({ ...customer, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full bg-[#F8F8F2] border rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#155B32] focus:outline-none focus:ring-2 ${
                        errors.name
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-gray-200 focus:ring-[#75D900]'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number (கைபேசி எண்) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customer.mobile}
                      onChange={(e) => {
                        setCustomer({ ...customer, mobile: e.target.value });
                        if (errors.mobile) setErrors({ ...errors, mobile: '' });
                      }}
                      className={`w-full bg-[#F8F8F2] border rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#155B32] focus:outline-none focus:ring-2 ${
                        errors.mobile
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-gray-200 focus:ring-[#75D900]'
                      }`}
                    />
                  </div>
                  {errors.mobile && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.mobile}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Complete Delivery Address (முழு முகவரி) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    placeholder="House/Flat No, Street Name, Chitlapakkam, Chennai - 600064"
                    value={customer.address}
                    onChange={(e) => {
                      setCustomer({ ...customer, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: '' });
                    }}
                    className={`w-full bg-[#F8F8F2] border rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#155B32] focus:outline-none focus:ring-2 ${
                      errors.address
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-[#75D900]'
                    }`}
                  />
                </div>
                {errors.address && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>
                )}
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Instructions (கூடுதல் குறிப்பு - விருப்பத்திற்குரியது)
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Please deliver in the evening / Call before arrival"
                    value={customer.instructions}
                    onChange={(e) =>
                      setCustomer({ ...customer, instructions: e.target.value })
                    }
                    className="w-full bg-[#F8F8F2] border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#155B32] focus:outline-none focus:ring-2 focus:ring-[#75D900]"
                  />
                </div>
              </div>
            </div>

            {/* Order Items Review */}
            <div className="space-y-3">
              <div className="border-b border-[#B9E769]/40 pb-2 flex items-center justify-between">
                <h3 className="font-poppins text-sm font-bold text-[#155B32] uppercase tracking-wider">
                  2. Order Verification ({items.length} items, {totalPackagesCount} packs)
                </h3>
                <span className="text-xs text-gray-500 font-mono">Ref: {orderRef}</span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-5 text-gray-400 font-mono text-center">
                          {idx + 1}.
                        </span>
                        <div>
                          {item.isCombo ? (
                            <>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-[#F2C94C] text-[#123B26] uppercase tracking-wide mr-1.5 mb-0.5">
                                {item.comboName || 'COMBO'}
                              </span>
                              <p className="font-bold text-[#155B32] leading-snug">{item.englishName}</p>
                              {item.comboIncludedText && (
                                <p className="text-[10px] text-gray-600 mt-0.5 italic">
                                  Contains: {item.comboIncludedText}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-[#155B32]">{item.englishName}</p>
                              <p className="font-mukta text-xs text-[#155B32]/80">
                                {item.tamilName}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-[#F4F9EC] border border-[#B9E769] text-[#155B32] font-semibold text-xs px-2 py-0.5 rounded mr-2">
                          {item.weight}
                        </span>
                        <span className="font-bold text-[#155B32]">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Crucial Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Notice for WhatsApp Orders:</p>
                <p className="text-amber-800 mt-0.5">
                  Clicking &quot;Place Order via WhatsApp&quot; will pre-fill all order items
                  in your WhatsApp chat with Bensi Queen. <strong>You must press the Send button</strong> inside WhatsApp to finalize your order.
                </p>
              </div>
            </div>

            {/* Action Buttons: PDF & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white border-2 border-[#155B32] text-[#155B32] hover:bg-[#F4F9EC] font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-98 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Order Summary PDF</span>
                  </>
                )}
              </button>

              {/* WhatsApp Order Button */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-[#75D900] hover:bg-[#68c200] text-[#155B32] font-bold text-xs sm:text-sm uppercase tracking-wider shadow-button hover:shadow-md transition-all active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Place Order via WhatsApp</span>
              </button>
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

