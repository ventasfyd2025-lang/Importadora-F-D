'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';

interface OfferPopupProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  selectedProducts?: string[];
  onClose: () => void;
}

export default function OfferPopup({
  title,
  description,
  buttonText = "Ver Ofertas",
  buttonLink = "/?filter=ofertas",
  isActive,
  selectedProducts = [],
  onClose
}: OfferPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const router = useRouter();
  const { products } = useProducts();

  // Get the filtered products to show in popup
  const popupProducts = selectedProducts.length > 0 
    ? products.filter(product => selectedProducts.includes(product.id))
    : products.filter(product => product.oferta || product.onSale);

  useEffect(() => {
    if (isActive && popupProducts.length > 0) {
      // Always show popup when active - appears on every page load/navigation
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 1500); // Show after 1.5 seconds
      return () => clearTimeout(timer);
    } else {
      setShowPopup(false);
    }
  }, [isActive, popupProducts.length]);

  // Auto-rotate products if multiple selected
  useEffect(() => {
    if (popupProducts.length > 1 && showPopup) {
      const interval = setInterval(() => {
        setCurrentProductIndex((prev) => (prev + 1) % popupProducts.length);
      }, 3000); // Change product every 3 seconds
      return () => clearInterval(interval);
    }
  }, [popupProducts.length, showPopup]);

  const handleClose = () => {
    setShowPopup(false);
    // Removed sessionStorage - popup will show on every page reload
    onClose();
  };

  const handleButtonClick = () => {
    // Use Next.js router for proper navigation
    if (buttonLink.startsWith('/')) {
      router.push(buttonLink);
    } else {
      window.open(buttonLink, '_blank');
    }
    handleClose();
  };

  if (!isActive || !showPopup) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm">
      {/* Corner Popup with Vibration Animation */}
      <div className="relative bg-gradient-to-r from-orange-600 to-pink-600 rounded-xl shadow-2xl w-80 overflow-hidden border-4 border-white popup-slide-in"
           style={{ 
             background: 'linear-gradient(135deg, #F16529 0%, #D64541 100%)'
           }}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200"
        >
          <XMarkIcon className="h-4 w-4 text-gray-600" />
        </button>

        {/* Content */}
        <div className="p-6 text-center text-white">
          {/* Show current product if any selected */}
          {popupProducts.length > 0 && (
            <div className="mb-4">
              <img 
                src={popupProducts[currentProductIndex].imagen || popupProducts[currentProductIndex].image} 
                alt={popupProducts[currentProductIndex].nombre || popupProducts[currentProductIndex].name}
                className="w-16 h-16 mx-auto rounded-lg object-cover mb-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <h3 className="text-sm font-semibold mb-1">
                {popupProducts[currentProductIndex].nombre || popupProducts[currentProductIndex].name}
              </h3>
              <div className="text-lg font-bold">
                ${(popupProducts[currentProductIndex].precio || popupProducts[currentProductIndex].price || 0).toLocaleString()}
                {(popupProducts[currentProductIndex].precioOriginal || popupProducts[currentProductIndex].originalPrice) && (
                  <span className="text-xs line-through opacity-70 ml-2">
                    ${(popupProducts[currentProductIndex].precioOriginal || popupProducts[currentProductIndex].originalPrice || 0).toLocaleString()}
                  </span>
                )}
              </div>
              {popupProducts.length > 1 && (
                <div className="flex justify-center mt-2 space-x-1">
                  {popupProducts.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentProductIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Fire emoji animation */}
          <div className="text-4xl mb-3 animate-pulse">🔥</div>
          
          <h2 className="text-xl font-bold mb-2">
            {title}
          </h2>
          
          <p className="text-sm mb-4 opacity-90">
            {description}
          </p>

          {/* Action Button */}
          <button
            onClick={handleButtonClick}
            className="bg-white font-bold py-3 px-6 rounded-lg text-sm transition-all duration-200 hover:shadow-lg hover:scale-105 transform shadow-lg"
            style={{ color: '#F16529' }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}