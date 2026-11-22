import type { CartItem, CustomerDetails } from '../types';
import { STORE_CONFIG } from '../config/storeConfig';

/**
 * Formats order date & time in reader-friendly format
 */
export function formatOrderDateTime(iso?: string): { date: string; time: string } {
  const now = iso ? new Date(iso) : new Date();
  const date = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { date, time };
}

/**
 * WhatsApp message for an already-placed order. References the stored
 * orderNo so the shop can match it; never includes prices.
 */
export function generateWhatsAppMessage(
  customer: CustomerDetails,
  items: CartItem[],
  orderRef: string,
): string {
  const itemsText = items
    .map((item, index) => {
      if (item.isCombo) {
        const details = item.comboIncludedText ? `\n   Contains: ${item.comboIncludedText}` : '';
        return `${index + 1}. ${item.englishName}${details}\n   Pack: ${item.weight}\n   Quantity: ${item.quantity}`;
      }
      return `${index + 1}. ${item.englishName} (${item.tamilName})\n   Pack: ${item.weight}\n   Quantity: ${item.quantity}`;
    })
    .join('\n\n');

  const instructionsText =
    customer.instructions && customer.instructions.trim().length > 0
      ? `Additional Instructions: ${customer.instructions.trim()}\n\n`
      : '';

  const message = `Hello Bensi Queen!

I just placed an order on the website (Ref: ${orderRef}).

CUSTOMER DETAILS
Name: ${customer.name.trim()}
Contact Number: ${customer.mobile.trim()}
Delivery Address: ${customer.address.trim()}

ORDER DETAILS

${itemsText}

${instructionsText}Please confirm availability, pricing and payment for my order.

Thank you!
Bensi Queen Customer.`;

  return message;
}

/**
 * Generates the WhatsApp click-to-chat URL using the central whatsappNumber
 * (via STORE_CONFIG.whatsappLink — the single wa.me builder for the whole site).
 */
export function getWhatsAppOrderUrl(message: string): string {
  return STORE_CONFIG.whatsappLink(message);
}
