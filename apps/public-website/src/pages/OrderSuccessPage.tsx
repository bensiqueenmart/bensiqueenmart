import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, Loader2, MessageCircle, ShoppingBag } from 'lucide-react';
import type { CartItem, CustomerDetails } from '../types';
import { formatOrderDateTime, generateWhatsAppMessage, getWhatsAppOrderUrl } from '../utils/orderUtils';
import { formatPrice } from '../utils/pricing';
import { downloadOrderSummaryPdf } from '../utils/pdfGenerator';
import { OrderSummaryPDFTemplate } from '../components/OrderSummaryPDFTemplate';
import { SEOHead } from '../components/SEOHead';

const SUCCESS_STORAGE_KEY = 'bqm_last_order';

interface PlacedOrder {
  orderNo: string;
  createdAt: string;
  customer: CustomerDetails;
  items: CartItem[];
  /** Authoritative server totals (stored at checkout, never recomputed). */
  lineTotals?: number[];
  totalPrice?: number;
}

function loadPlacedOrder(): PlacedOrder | null {
  try {
    const raw = sessionStorage.getItem(SUCCESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlacedOrder;
    if (!parsed?.orderNo || !Array.isArray(parsed?.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const OrderSuccessPage: React.FC = () => {
  const [placed] = useState<PlacedOrder | null>(loadPlacedOrder);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!placed) {
    return (
      <div className="py-20 bg-[#F7F5E8] min-h-screen text-center px-4 text-[#123B26]">
        <SEOHead
          title="Order Placed | Bensi Queen"
          description="Your grocery order has been placed."
          canonical="https://bensiqueen.com/order-success"
          noindex={true}
        />
        <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-[#DCE8C8] shadow-soft space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#F7F5E8] border border-[#DCE8C8] flex items-center justify-center text-[#205C38] mx-auto">
            <ShoppingBag className="w-8 h-8 stroke-1 text-[#205C38]" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-[#123B26]">No order to show</h2>
          <p className="text-xs text-gray-600 font-poppins leading-relaxed">
            Your last order receipt isn&apos;t available here (it lives only on this device for
            this session). Browse the store to place a fresh order.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 rounded-full bg-[#123B26] hover:bg-[#205C38] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-button"
          >
            <span>Explore Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const { date, time } = formatOrderDateTime(placed.createdAt);
  const totalPackages = placed.items.reduce((sum, item) => sum + item.quantity, 0);
  const message = generateWhatsAppMessage(
    placed.customer,
    placed.items,
    placed.orderNo,
    placed.lineTotals,
    placed.totalPrice,
  );
  const waUrl = getWhatsAppOrderUrl(message);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadOrderSummaryPdf('order-summary-pdf-canvas', placed.orderNo);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not download PDF automatically. Please check your browser permissions.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 bg-[#F7F5E8] text-[#123B26] min-h-screen">
      <SEOHead
        title="Order Placed | Bensi Queen"
        description="Your grocery order has been placed. Download your receipt or confirm on WhatsApp."
        canonical="https://bensiqueen.com/order-success"
        noindex={true}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Confirmation card */}
        <div className="bg-white rounded-3xl border-2 border-[#205C38] p-5 sm:p-8 shadow-soft space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-[#DCE8C8] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-[#205C38]" />
          </div>
          <div>
            <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold text-[#123B26]">
              Order placed successfully
            </h1>
            <p className="font-poppins text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed max-w-xl mx-auto">
              <span className="font-mono font-bold text-[#123B26]">{placed.orderNo}</span>
              <span className="text-gray-400"> · </span>
              {date}, {time}
              <br />
              Our team will contact you on WhatsApp at{' '}
              <strong className="text-[#123B26]">{placed.customer.mobile}</strong> to confirm
              availability and payment. You can also start the conversation now with
              your order details pre-filled.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[#123B26] hover:bg-[#205C38] text-white font-bold text-sm uppercase tracking-wider shadow-button transition-all active:scale-[0.98] min-h-[52px]"
            >
              <MessageCircle className="w-4 h-4 text-[#A8C66C]" />
              <span>Message us on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-white border-2 border-[#123B26] text-[#123B26] hover:bg-[#F7F5E8] font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 min-h-[52px]"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#205C38]" />
                  <span>Generating PDF…</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#205C38]" />
                  <span>Download order copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Compact recap */}
        <div className="bg-white rounded-3xl border border-[#DCE8C8] p-5 sm:p-6 shadow-soft space-y-3">
          <h2 className="font-poppins text-sm font-bold text-[#123B26] uppercase tracking-wider border-b border-gray-100 pb-3">
            Order recap
          </h2>
          <div className="divide-y divide-gray-100">
            {placed.items.map((item, idx) => {
              const amount = placed.lineTotals?.[idx];
              return (
                <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <p className="font-bold text-[#123B26] font-poppins leading-snug min-w-0">
                    <span className="text-gray-400 font-mono mr-1.5">{idx + 1}.</span>
                    {item.englishName}
                    <span className="block sm:inline text-gray-500 font-medium">
                      {' '}
                      · {item.weight} × {item.quantity}
                    </span>
                  </p>
                  <span className="bg-[#F7F5E8] border border-[#DCE8C8] text-[#123B26] font-bold text-xs px-2 py-0.5 rounded flex-shrink-0">
                    {typeof amount === 'number' ? formatPrice(amount) : `${item.weight} × ${item.quantity}`}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-1 rounded-2xl bg-[#F7F5E8] border border-[#DCE8C8] px-4 py-3 text-sm">
            <span className="font-poppins font-semibold text-xs uppercase tracking-wider text-gray-600">
              {typeof placed.totalPrice === 'number' ? 'Order total' : 'Total quantity'}
            </span>
            <span className="font-extrabold text-base text-[#123B26]">
              {typeof placed.totalPrice === 'number'
                ? formatPrice(placed.totalPrice)
                : `${totalPackages} packs · ${placed.items.length} ${placed.items.length === 1 ? 'item' : 'items'}`}
            </span>
          </div>
          {typeof placed.totalPrice === 'number' && (
            <p className="text-[11px] text-gray-500 text-center font-poppins">
              {totalPackages} packs · {placed.items.length}{' '}
              {placed.items.length === 1 ? 'item' : 'items'}
            </p>
          )}
          <div className="pt-1 text-center">
            <Link
              to="/products"
              className="inline-flex items-center text-xs text-[#205C38] hover:text-[#123B26] font-semibold"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Hidden offscreen container for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
        <OrderSummaryPDFTemplate
          orderRef={placed.orderNo}
          orderDate={date}
          orderTime={time}
          customer={placed.customer}
          items={placed.items}
          lineTotals={placed.lineTotals}
          orderTotal={placed.totalPrice}
        />
      </div>
    </div>
  );
};
