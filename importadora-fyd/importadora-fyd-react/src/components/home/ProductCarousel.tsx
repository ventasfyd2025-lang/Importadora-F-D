'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Product } from '@/types';
import { useI18n } from '@/context/I18nContext';
import { useCart } from '@/context/CartContext';

interface ProductCarouselProps {
  products: Product[];
  title: string;
  viewAllLink?: string;
  showViewAll?: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
};

const ProductCard = memo(({ product }: { product: Product }) => {
  const { t } = useI18n();
  const { addItem } = useCart();

  const discountPercentage = product.oferta && product.precioOriginal
    ? Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 h-full focus-within:ring-2 focus-within:ring-[#D95D22] focus-within:ring-offset-2 hover:-translate-y-1">
      <div className="relative w-full sm:w-2/5 flex-shrink-0">
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-[4/3] w-full overflow-hidden">
          {product.imagen ? (
            <Image
              src={product.imagen}
              alt={product.nombre || 'Producto'}
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
              <span className="text-orange-400 text-sm font-medium">Sin imagen</span>
            </div>
          )}
        </div>

        {discountPercentage > 0 && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            -{discountPercentage}%
          </span>
        )}

        {product.nuevo && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-[#D95D22] to-[#E67E22] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            {t('productCard.new')}
          </span>
        )}
      </div>

      <div className="flex-1 p-3 sm:p-4 flex flex-col min-h-0">
        <div className="flex-grow">
          <div className="text-xs text-orange-500 uppercase tracking-wide font-semibold mb-1">{product.categoria}</div>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-2 sm:mb-3">{product.nombre}</h3>
        </div>

        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {discountPercentage > 0 && product.precioOriginal && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.precioOriginal)}
                </span>
              )}
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                {formatPrice(product.precio)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((rating) => (
                <StarIcon
                  key={rating}
                  className={`h-3 w-3 ${rating < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                  aria-hidden="true"
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">
                ({product.reviews || 0})
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(
                product.id,
                product.nombre || 'Producto',
                product.precio || 0,
                product.imagen || undefined,
                1,
                product.sku,
              );
              // Mostrar notificación
              const notification = document.createElement('div');
              notification.textContent = 'Producto agregado al carrito';
              notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 transition-all duration-300';
              document.body.appendChild(notification);
              setTimeout(() => notification.remove(), 3000);
            }}
            className="w-full text-center text-xs sm:text-sm bg-blue-700 hover:bg-blue-800 text-white py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-1 sm:gap-2"
          >
            <span>🛒</span>
            <span className="hidden xs:inline sm:hidden md:inline">Agregar al Carrito</span>
            <span className="xs:hidden sm:inline md:hidden">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

const ProductCarousel = memo(({ 
  products, 
  title, 
  viewAllLink = '#',
  showViewAll = true
}: ProductCarouselProps) => {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Update items to show based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsToShow(2);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(3);
      } else {
        setItemsToShow(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      Math.min(prevIndex + 1, products.length - itemsToShow)
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.scrollLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (carouselRef.current?.scrollLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (isHovered || products.length <= itemsToShow) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = products.length - itemsToShow;
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isHovered, products.length, itemsToShow]);

  // Reset index when itemsToShow changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [itemsToShow]);

  return (
    <section className="space-y-3 sm:space-y-4 lg:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {showViewAll && (
          <Link 
            href={viewAllLink} 
            className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1 focus:outline-none focus:underline"
          >
            {t('homepage.viewAll')}
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>
      
      <div className="relative">
        {currentIndex > 0 && (
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label={t('carousel.previous')}
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
        )}
        
        <div 
          ref={carouselRef}
          className="carousel-container overflow-x-hidden"
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onMouseMove={handleDragMove}
          onMouseLeave={() => {
            handleDragEnd();
            setIsHovered(false);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label={`${t('common.carousel')}: ${title}`}
        >
          <div 
            className="flex gap-2 sm:gap-3 lg:gap-4 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-shrink-0"
                style={{ width: `${100 / itemsToShow}%` }}
              >
                <Link
                  href={`/producto/${product.id}`}
                  className="block h-full focus:outline-none focus:ring-2 focus:ring-[#D95D22] focus:ring-offset-2"
                >
                  <ProductCard product={product} />
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        {currentIndex < products.length - itemsToShow && (
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label={t('carousel.next')}
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>
      
      {/* Indicators */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: Math.ceil(products.length / itemsToShow) }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index * itemsToShow)}
            className={`h-2 w-2 rounded-full transition-all ${
              Math.floor(currentIndex / itemsToShow) === index 
                ? 'bg-orange-500 w-6' 
                : 'bg-gray-300'
            }`}
            aria-label={`${t('carousel.goToPage')} ${index + 1} ${t('common.of')} ${Math.ceil(products.length / itemsToShow)} ${t('common.in')} ${title}`}
            aria-current={Math.floor(currentIndex / itemsToShow) === index ? 'true' : 'false'}
          />
        ))}
      </div>
    </section>
  );
});

ProductCarousel.displayName = 'ProductCarousel';

export default ProductCarousel;
