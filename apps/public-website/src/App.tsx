import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { OffersProvider } from './context/OffersContext';
import { ReviewsProvider } from './context/ReviewsContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ToastNotification } from './components/ToastNotification';
import { OwnerPortalModal } from './components/OwnerPortalModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { StructuredData } from './components/StructuredData';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { OffersPage } from './pages/OffersPage';
import { AboutPage } from './pages/AboutPage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

// Scroll to top automatically when route changes
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5E8] text-[#123B26] font-poppins selection:bg-[#DCE8C8] selection:text-[#123B26]">
      <ScrollToTop />
      
      {/* Global Structured Data / JSON-LD for SEO */}
      <StructuredData />

      {/* Shared Header across all pages */}
      <Header />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Shared Footer across all pages */}
      <Footer />

      {/* Cart Slide-out Drawer */}
      <CartDrawer />

      {/* Toast Notification */}
      <ToastNotification />

      {/* Owner Management Portal (Combo Offers + Reviews) */}
      <OwnerPortalModal />

      {/* Floating WhatsApp Quick Action Button */}
      <FloatingWhatsApp />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <OffersProvider>
        <ReviewsProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </ReviewsProvider>
      </OffersProvider>
    </BrowserRouter>
  );
}

export default App;
