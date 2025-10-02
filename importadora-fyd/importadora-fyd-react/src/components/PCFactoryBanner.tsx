'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Product } from '@/types';
import { useRouter } from 'next/navigation';

interface PCFactoryBannerProps {
  title: string;
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

const calculateDiscount = (original: number, current: number) => {
  return Math.round(((original - current) / original) * 100);
};

export default function PCFactoryBanner({ 
  title, 
  products = [], 
  autoPlay = true, 
  interval = 6000 
}: PCFactoryBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  
  const safeProducts = Array.isArray(products) ? products : [];
  
  // Crear slides de 6 productos cada uno
  const productsPerSlide = 6;
  const slides = [];
  for (let i = 0; i < safeProducts.length; i += productsPerSlide) {
    slides.push(safeProducts.slice(i, i + productsPerSlide));
  }

  useEffect(() => {
    if (autoPlay && slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => 
          prev === slides.length - 1 ? 0 : prev + 1
        );
      }, interval);

      return () => clearInterval(timer);
    }
  }, [autoPlay, slides.length, interval]);

  const handleProductClick = (productId: string) => {
    router.push(`/producto/${productId}`);
  };

  if (safeProducts.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          
          {/* Navigation Arrows */}
          {slides.length > 1 && (
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentSlide(currentSlide === slides.length - 1 ? 0 : currentSlide + 1)}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slideProducts, slideIndex) => (
              <div key={slideIndex} className="w-full flex-shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {slideProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-orange-300"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                        <img
                          src={product.imagen || ''}
                          alt={product.nombre || 'Producto'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Discount Badge */}
                        {((product.precioOriginal && product.precioOriginal > (product.precio || 0)) || 
                          false) && (
                          <div 
                            className="absolute top-2 left-2 text-white text-xs font-bold py-1 px-2 rounded"
                            style={{ backgroundColor: '#D64541' }}
                          >
                            -{calculateDiscount(
                              product.precioOriginal || 0, 
                              product.precio || 0
                            )}%
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-3">
                        {/* Product Name */}
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
                          {product.nombre || 'Producto'}
                        </h3>
                        
                        {/* Price Section */}
                        <div className="space-y-1">
                          {/* Original Price */}
                          {((product.precioOriginal && product.precioOriginal > (product.precio || 0)) || 
                            false) && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatPrice(product.precioOriginal || 0)}
                            </div>
                          )}
                          
                          {/* Current Price */}
                          <div 
                            className="text-sm font-bold"
                            style={{ color: product.oferta ? '#D64541' : '#F16529' }}
                          >
                            {formatPrice(product.precio || 0)}
                          </div>
                        </div>
                        
                        {/* Stock indicator */}
                        {product.stock < 5 && (
                          <div className="text-xs mt-1" style={{ color: '#D64541' }}>
                            ¡Últimas {product.stock} unidades!
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        {slides.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentSlide 
                    ? 'bg-orange-500' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                style={{ 
                  backgroundColor: index === currentSlide ? '#F16529' : undefined 
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}