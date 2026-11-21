import { BUSINESS, DELIVERY } from './siteContent';

// Central Store Configuration for BENSI QUEEN
// Values come from src/data/business.json + src/data/delivery.json (single source of truth).
// Edit the JSON files (later via the /edit console) — never hardcode these elsewhere.

export const STORE_CONFIG = {
  storeName: BUSINESS.storeName,
  tagline: BUSINESS.tagline,
  subTagline: BUSINESS.subTagline,

  // WhatsApp ordering destination (international format without + or spaces)
  OWNER_WHATSAPP_NUMBER: BUSINESS.ownerWhatsappNumber,

  // Contact phone number displayed to customers
  phone: BUSINESS.phone,
  displayPhone: BUSINESS.displayPhone,
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
