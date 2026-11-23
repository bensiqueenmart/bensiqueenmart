import React from 'react';
import { CartItem, CustomerDetails } from '../types';
import { STORE_CONFIG } from '../config/storeConfig';
import { formatPrice } from '../utils/pricing';

interface OrderSummaryPDFTemplateProps {
  orderRef: string;
  orderDate: string;
  orderTime: string;
  customer: CustomerDetails;
  items: CartItem[];
  lineTotals?: number[];
  orderTotal?: number;
}

export const OrderSummaryPDFTemplate: React.FC<OrderSummaryPDFTemplateProps> = ({
  orderRef,
  orderDate,
  orderTime,
  customer,
  items,
  lineTotals,
  orderTotal,
}) => {
  const totalPackages = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      id="order-summary-pdf-canvas"
      className="bg-white text-[#123B26] p-8 max-w-[800px] mx-auto border border-gray-200"
      style={{
        width: '794px',
        minHeight: '1123px',
        boxSizing: 'border-box',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* PDF Header with Dark Green Accent & Brand Logo */}
      <div className="border-b-2 border-[#123B26] pb-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full border-2 border-[#123B26] p-1 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={STORE_CONFIG.logoUrl}
                alt="Bensi Queen Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight text-[#123B26]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                BENSI QUEEN
              </h1>
              <p className="text-xs font-semibold text-[#205C38] tracking-wider uppercase">
                Quality Groceries & Provisions
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {STORE_CONFIG.address}
              </p>
              <p className="text-xs text-gray-600">
                Helpline: {STORE_CONFIG.primaryPhone}
                {STORE_CONFIG.hasSecondaryPhone && ` / ${STORE_CONFIG.secondaryDisplayPhone}`}
                {!STORE_CONFIG.whatsappIsPrimary && ` · WhatsApp: ${STORE_CONFIG.whatsappDisplay}`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block bg-[#123B26] text-white px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider mb-2">
              ORDER SUMMARY
            </div>
            <p className="text-xs font-semibold text-[#123B26]">
              Ref: <span className="font-mono text-xs font-bold">{orderRef}</span>
            </p>
            <p className="text-xs text-gray-600">
              Date: {orderDate}
            </p>
            <p className="text-xs text-gray-600">
              Time: {orderTime}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Information Card */}
      <div className="bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl p-4 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#123B26] border-b border-[#DCE8C8] pb-1 mb-2">
          Customer & Delivery Information
        </h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-500">Customer Name:</p>
            <p className="font-bold text-[#123B26] text-sm">{customer.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Contact Number:</p>
            <p className="font-bold text-[#123B26] text-sm">{customer.mobile}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Delivery Address:</p>
            <p className="font-medium text-gray-800 whitespace-pre-wrap">{customer.address}</p>
          </div>
          {customer.instructions && (
            <div className="col-span-2">
              <p className="text-gray-500">Additional Instructions:</p>
              <p className="font-medium text-gray-700 italic">{customer.instructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Itemised Product Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-[#123B26]/30 text-xs">
          <thead>
            <tr className="bg-[#123B26] text-white">
              <th className="border border-[#123B26] py-2.5 px-3 text-center w-12 font-semibold">
                S.No
              </th>
              <th className="border border-[#123B26] py-2.5 px-4 text-left font-semibold">
                Product Name (English / Tamil)
              </th>
              <th className="border border-[#123B26] py-2.5 px-3 text-center w-28 font-semibold">
                Selected Weight
              </th>
              <th className="border border-[#123B26] py-2.5 px-3 text-center w-24 font-semibold">
                Quantity
              </th>
              <th className="border border-[#123B26] py-2.5 px-3 text-center w-24 font-semibold">
                Rate
              </th>
              <th className="border border-[#123B26] py-2.5 px-3 text-center w-24 font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <tr
                  key={item.id}
                  className={isEven ? 'bg-[#F7F5E8]' : 'bg-white'}
                >
                  <td className="border border-gray-300 py-2.5 px-3 text-center font-medium">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 py-2.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[#123B26]">{item.englishName}</span>
                      {item.isCombo && item.comboName && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[8.5px] font-black bg-[#F2C94C] text-[#123B26] uppercase tracking-wide border border-[#d4ab33]">
                          {item.comboName}
                        </span>
                      )}
                    </div>
                    {item.isCombo && item.comboIncludedText ? (
                      <div className="text-[9.5px] text-gray-700 mt-0.5 leading-snug">
                        <span className="font-bold text-[#205C38]">Contains: </span>
                        <span>{item.comboIncludedText}</span>
                      </div>
                    ) : item.tamilName ? (
                      <span
                        className="font-medium text-gray-700 text-[11px] block mt-0.5"
                        style={{ fontFamily: "'Mukta Malar', sans-serif" }}
                      >
                        ({item.tamilName})
                      </span>
                    ) : null}
                  </td>
                  <td className="border border-gray-300 py-2.5 px-3 text-center font-semibold text-[#123B26]">
                    {item.weight}
                  </td>
                  <td className="border border-gray-300 py-2.5 px-3 text-center font-bold text-[#123B26]">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 py-2.5 px-3 text-center text-[#123B26]">
                    {(() => {
                      const amount = lineTotals?.[index];
                      if (typeof amount !== 'number' || !item.quantity) return '—';
                      return formatPrice(amount / item.quantity);
                    })()}
                  </td>
                  <td className="border border-gray-300 py-2.5 px-3 text-center font-bold text-[#123B26]">
                    {(() => {
                      const amount = lineTotals?.[index];
                      return typeof amount === 'number' ? formatPrice(amount) : '—';
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#DCE8C8] font-bold text-xs text-[#123B26]">
              <td colSpan={4} className="border border-gray-300 py-2.5 px-4 text-right">
                Total: {items.length} {items.length === 1 ? 'item' : 'items'} · {totalPackages}{' '}
                packs
              </td>
              <td colSpan={2} className="border border-gray-300 py-2.5 px-3 text-center text-sm">
                Order Total: {typeof orderTotal === 'number' ? formatPrice(orderTotal) : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Note & Policy Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px] text-gray-600 mb-8 space-y-1">
        <p className="font-semibold text-[#123B26]">
          Order Policy & Packing Checklist:
        </p>
        <p>
          • This document serves as an order summary and packing checklist. Payment is arranged with the store via WhatsApp.
        </p>
        <p>
          • Prices reflect the website catalog at order time. Payment is settled on delivery
          via Cash or UPI.
        </p>
        <p>
          • For any urgent modifications to this order, please contact{' '}
          <strong className="text-[#123B26]">
            {STORE_CONFIG.primaryPhone}
            {STORE_CONFIG.hasSecondaryPhone && ` / ${STORE_CONFIG.secondaryDisplayPhone}`}
          </strong>.
        </p>
      </div>

      {/* Footer Branding */}
      <div className="border-t-2 border-[#123B26] pt-4 text-center space-y-1">
        <p
          className="text-base font-bold text-[#123B26]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Thank you for choosing Bensi Queen!
        </p>
        <p className="text-xs text-gray-500">
          Good Food. Great Quality. Happy Home.
        </p>
      </div>
    </div>
  );
};
