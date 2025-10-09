'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Product } from '@/types';
import { useRouter } from 'next/navigation';

interface ProductBannerProps {
  title: string;
  text: string;
  products: Product[];
  autoPlay?: boolean;
  interval?: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

export default function ProductBanner({ 
  title, 
  text, 
  products = [], 
  autoPlay = true, 
  interval = 8000 
}: ProductBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  
  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];

  useEffect(() => {
    if (autoPlay && safeProducts.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === safeProducts.length - 1 ? 0 : prevIndex + 1
        );
      }, interval);

      return () => clearInterval(timer);
    }
  }, [autoPlay, safeProducts.length, interval]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? safeProducts.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === safeProducts.length - 1 ? 0 : currentIndex + 1);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/producto/${productId}`);
  };

  if (safeProducts.length === 0) {
    // Fallback to gradient banner if no products
    return (
      <section className="text-white py-16" style={{ background: 'linear-gradient(135deg, #F16529 0%, #D64541 100%)' }}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {title}
          </h1>
          <p className="text-2xl md:text-3xl text-orange-100">
            {text}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-r from-orange-50 to-red-50 py-8">
      {/* Header */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#F16529' }}>
            {title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600">
            {text}
          </p>
        </div>
      </div>

      {/* Products Container */}
      <div className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden">
          {/* Products Slider */}
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {safeProducts.map((product) => (
              <div key={product.id} className="w-full flex-shrink-0">
                <div 
                  onClick={() => handleProductClick(product.id)}
                  className="bg-white rounded-xl shadow-lg p-6 mx-2 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Product Image */}
                    <div className="md:w-1/2">
                      <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={product.imagen}
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="md:w-1/2 text-center md:text-left">
                      <h3 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#333333' }}>
                        {product.nombre}
                      </h3>
                      <p className="text-lg text-gray-600 mb-6 line-clamp-3">
                        {product.descripcion}
                      </p>
                      
                      {/* Price */}
                      <div className="mb-6">
                        {product.precioOriginal && product.precioOriginal > product.precio && (
                          <div className="text-2xl line-through font-medium mb-2" style={{ color: '#C0392B' }}>
                            {formatPrice(product.precioOriginal)}
                          </div>
                        )}
                        <div className="text-4xl md:text-5xl font-bold" style={{ color: '#2E7D32' }}>
                          {formatPrice(product.precio)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">IVA incluido</div>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product.id);
                        }}
                        className="text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                        style={{ backgroundColor: '#D64541' }}
                      >
                        Ver Producto →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {safeProducts.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              style={{ zIndex: 10 }}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              style={{ zIndex: 10 }}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {safeProducts.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {safeProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-orange-500' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                style={{ 
                  backgroundColor: index === currentIndex ? '#F16529' : undefined 
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}