// Central Store Configuration for BENSI QUEEN
// Edit these values to update contact information, phone, address, and social links across the entire store.

export const STORE_CONFIG = {
  storeName: "Bensi Queen",
  tagline: "Bringing Nature's Goodness to Your Kitchen.",
  subTagline: "Discover quality pulses, aromatic spices, delicious nuts and everyday grocery essentials at Bensi Queen.",
  
  // WhatsApp ordering destination (international format without + or spaces)
  OWNER_WHATSAPP_NUMBER: "916369448863",
  
  // Contact phone number displayed to customers
  phone: "6369448863",
  displayPhone: "+91 63694 48863",
  email: "contact@bensiqueen.com",
  
  // Physical store address
  address: "No. 3, Jothi Nagar, 5th Street, Sankara Apartment, Chitlapakkam, Chennai - 600064",
  landmark: "Near Chitlapakkam Lake / Tambaram Sanatorium",
  city: "Chennai",
  pincode: "600064",
  state: "Tamil Nadu",
  
  // Operating hours
  businessHours: "Monday to Sunday: 7:00 AM – 9:30 PM",
  
  // Assets
  logoUrl: "/images/bensi-queen-logo.jpg",
  websiteUrl: "https://bensiqueen.com",
  
  // Service Areas
  serviceAreas: [
    "Chitlapakkam",
    "Tambaram Sanatorium",
    "Chromepet",
    "Hasthinapuram",
    "Selaiyur",
    "East Tambaram",
    "Pallavaram",
    "Medavakkam"
  ],
  
  // Supported Weights across all products
  weightOptions: ["100g", "200g", "500g", "750g", "1kg"] as const,
};

export type WeightOption = typeof STORE_CONFIG.weightOptions[number];
