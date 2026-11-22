import { BUSINESS, DELIVERY } from './siteContent';

// Central Store Configuration for BENSI QUEEN
// Numbers live ONLY in src/data/business.json — three fields, nothing else:
//   - whatsappNumber:        EVERY wa.me link and WhatsApp action uses this.
//   - primaryPhone:          every call (tel:) action and every number label.
//   - secondaryDisplayPhone: pure UI — extra store number shown next to the
//                            primary one in contact surfaces. Empty = hidden.

function digits(s: string | undefined): string {
  return (s ?? '').replace(/\D/g, '');
}

function toTelLink(s: string | undefined): string {
  const d = digits(s);
  if (!d) return 'tel:';
  if (d.length === 10) return `tel:+91${d}`;
  return `tel:+${d}`;
}

/** Pretty Indian display for digits-only input ("916369448863" → "+91 63694 48863"). */
function prettyDisplay(s: string | undefined): string {
  const d = digits(s);
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return (s ?? '').trim();
}

const whatsappDigits = digits(BUSINESS.whatsappNumber);
const primaryDigits = digits(BUSINESS.primaryPhone);
const secondaryDigits = digits(BUSINESS.secondaryDisplayPhone);

export const STORE_CONFIG = {
  storeName: BUSINESS.storeName,
  tagline: BUSINESS.tagline,
  subTagline: BUSINESS.subTagline,

  // The single WhatsApp destination for the whole site.
  whatsappNumber: whatsappDigits,
  whatsappDisplay: prettyDisplay(BUSINESS.whatsappNumber),
  whatsappLink: (text: string) =>
    `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(text)}`,

  // The single primary call number: every tel: action and every number label.
  primaryPhone: BUSINESS.primaryPhone.trim(),
  callLink: toTelLink(BUSINESS.primaryPhone),

  // Pure-UI secondary number. Empty string => hidden everywhere automatically.
  secondaryDisplayPhone: BUSINESS.secondaryDisplayPhone.trim(),
  secondaryCallLink: toTelLink(BUSINESS.secondaryDisplayPhone),
  hasSecondaryPhone: secondaryDigits.length >= 10,

  // True when WhatsApp and primary mobile are the same line (last-10 match),
  // so combined labels can collapse to a single number.
  whatsappIsPrimary:
    whatsappDigits.length >= 10 &&
    primaryDigits.length >= 10 &&
    whatsappDigits.slice(-10) === primaryDigits.slice(-10),

  email: BUSINESS.email,

  // Physical store address
  address: BUSINESS.address,
  landmark: BUSINESS.landmark,
  city: BUSINESS.city,
  pincode: BUSINESS.pincode,
  state: BUSINESS.state,

  // Operating hours
  businessHours: BUSINESS.businessHours,

  // Assets
  logoUrl: BUSINESS.logoUrl,
  websiteUrl: BUSINESS.websiteUrl,

  // Service Areas
  serviceAreas: DELIVERY.areas,
};
