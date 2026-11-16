import React from 'react';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export const ToastNotification: React.FC = () => {
  const { toastMessage, closeToast } = useCart();
  const navigate = useNavigate();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className="bg-[#123B26] text-white rounded-2xl p-4 shadow-2xl border-2 border-[#A8C66C] max-w-sm flex items-start space-x-3">
        <CheckCircle2 className="w-5 h-5 text-[#F2C94C] flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 space-y-1">
          <p className="font-poppins text-xs font-bold text-white">
            {toastMessage}
          </p>
          <button
            onClick={() => {
              closeToast();
              navigate('/cart');
            }}
            className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#F2C94C] hover:text-white uppercase tracking-wider pt-1 underline"
          >
            <ShoppingBag className="w-3.5 h-3.5 mr-0.5" />
            <span>Open Cart</span>
          </button>
        </div>

        <button
          onClick={closeToast}
          className="text-white/60 hover:text-white p-0.5"
          aria-label="Close Notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
