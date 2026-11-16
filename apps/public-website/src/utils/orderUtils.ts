import { CartItem, CustomerDetails } from '../types';
import { STORE_CONFIG } from '../config/storeConfig';

/**
 * Generate a unique, professional Order Reference
 * e.g., BQ-20261107-9481
 */
export function generateOrderReference(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BQ-${yyyy}${mm}${dd}-${random}`;
}

/**
 * Formats order date & time in reader-friendly format
 */
export function formatOrderDateTime(): { date: string; time: string } {
  const now = new Date();
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
 * Constructs the WhatsApp message compliant with Section 8 specification
 * NEVER includes prices.
 */
export function generateWhatsAppMessage(
  customer: CustomerDetails,
  items: CartItem[],
  orderRef: string
): string {
  const itemsText = items
    .map((item, index) => {
      if (item.isCombo) {
        const details = item.comboIncludedText ? `\n   Contains: ${item.comboIncludedText}` : '';
        return `${index + 1}. [🎁 ${item.comboName || 'COMBO'}] ${item.englishName}${details}\n   Pack: ${item.weight}\n   Quantity: ${item.quantity}`;
      }
      return `${index + 1}. ${item.englishName} (${item.tamilName})\n   Weight: ${item.weight}\n   Quantity: ${item.quantity}`;
    })
    .join('\n\n');

  const instructionsText = customer.instructions && customer.instructions.trim().length > 0
    ? `Additional Instructions: ${customer.instructions.trim()}\n\n`
    : '';

  const message = `Hello Bensi Queen!

I would like to place an order (Ref: ${orderRef}).

CUSTOMER DETAILS
Name: ${customer.name.trim()}
Mobile: ${customer.mobile.trim()}
Delivery Address: ${customer.address.trim()}

ORDER DETAILS

${itemsText}

${instructionsText}Please confirm my order.

Thank you!
Bensi Queen Customer.`;

  return message;
}

/**
 * Generates the WhatsApp click-to-chat URL using the central OWNER_WHATSAPP_NUMBER
 */
export function getWhatsAppOrderUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${STORE_CONFIG.OWNER_WHATSAPP_NUMBER}?text=${encoded}`;
}

