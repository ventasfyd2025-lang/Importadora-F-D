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
  const { addItem } = useCart();

  const discountPercentage = product.oferta && product.precioOriginal
    ? Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-orange-400 overflow-hidden h-full flex flex-col">
      {/* Badges */}
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
          -{discountPercentage}%
        </div>
      )}
      {product.nuevo && (
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
          NUEVO
        </div>
      )}

      {/* Imagen cuadrada */}
      <div className="relative w-full aspect-square bg-white p-4">
        {product.imagen ? (
          <div className="relative w-full h-full">
            <Image
              src={product.imagen}
              alt={product.nombre || 'Producto'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 50vw, 25vw"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-gray-300 text-5xl">📦</span>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-2 flex flex-col flex-grow">
        <h3 className="text-xs text-gray-700 line-clamp-2 mb-1.5 min-h-[2rem] leading-tight">
          {product.nombre || 'Producto sin nombre'}
        </h3>

        <div className="mt-auto space-y-1.5">
          {product.precioOriginal && product.precioOriginal > product.precio && (
            <div className="text-[10px] text-gray-400 line-through">
              {formatPrice(product.precioOriginal)}
            </div>
          )}

          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.precio)}
            </span>
            {discountPercentage > 0 && (
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                {discountPercentage}% OFF
              </span>
            )}
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
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 px-3 rounded-xl transition-all duration-300 text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 group"
          >
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Agregar</span>
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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Update items to show based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsToShow(2);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(4);
      } else {
        setItemsToShow(5);
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
    setStartX(e.pageX);
    setScrollLeft(e.pageX);
    setHasDragged(false); // Resetear flag al inicio
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    const endX = scrollLeft;
    const distance = startX - endX;

    // Si el arrastre es mayor a 50px, cambiar de slide
    if (Math.abs(distance) > 50) {
      if (distance > 0 && currentIndex < products.length - itemsToShow) {
        // Arrastre a la izquierda - siguiente
        nextSlide();
      } else if (distance < 0 && currentIndex > 0) {
        // Arrastre a la derecha - anterior
        prevSlide();
      }
    }

    setIsDragging(false);

    // Resetear flag después de un delay
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setScrollLeft(e.pageX);

    // Marcar como dragged si hay movimiento significativo
    const distance = Math.abs(startX - e.pageX);
    if (distance > 10) {
      setHasDragged(true);
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

  // Manejo de swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setHasDragged(false); // Resetear flag al inicio
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);

    // Marcar como dragged si hay movimiento significativo
    const distance = Math.abs(touchStart - e.targetTouches[0].clientX);
    if (distance > 10) {
      setHasDragged(true);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < products.length - itemsToShow) {
      nextSlide();
    }
    if (isRightSwipe && currentIndex > 0) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);

    // Resetear flag después de un delay
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
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

  // Determinar si hay suficientes productos para hacer carrusel
  const hasEnoughProducts = products.length > itemsToShow;
  const maxIndex = Math.max(0, products.length - itemsToShow);

  return (
    <section className="space-y-3 sm:space-y-4 lg:space-y-5">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-orange-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F16529' }}>
              <span className="text-white text-lg">{title.split(' ')[0]}</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{title}</h2>
          </div>
          {showViewAll && (
            <Link
              href={viewAllLink}
              className="px-4 py-2 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg text-sm"
              style={{ backgroundColor: '#F16529' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
            >
              {t('homepage.viewAll')} →
            </Link>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          ref={carouselRef}
          className={`carousel-container overflow-x-hidden ${hasEnoughProducts ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onMouseDown={hasEnoughProducts ? handleDragStart : undefined}
          onMouseUp={hasEnoughProducts ? handleDragEnd : undefined}
          onMouseMove={hasEnoughProducts ? handleDragMove : undefined}
          onMouseLeave={hasEnoughProducts ? () => {
            setIsHovered(false);
            handleDragEnd();
          } : undefined}
          onMouseEnter={hasEnoughProducts ? () => setIsHovered(true) : undefined}
          onTouchStart={hasEnoughProducts ? handleTouchStart : undefined}
          onTouchMove={hasEnoughProducts ? handleTouchMove : undefined}
          onTouchEnd={hasEnoughProducts ? handleTouchEnd : undefined}
          onKeyDown={hasEnoughProducts ? handleKeyDown : undefined}
          tabIndex={hasEnoughProducts ? 0 : undefined}
          role="region"
          aria-label={`${t('common.carousel')}: ${title}`}
        >
          <div
            className={`flex gap-2 sm:gap-3 lg:gap-4 ${hasEnoughProducts ? 'transition-transform duration-500 ease-out' : ''}`}
            style={{
              transform: hasEnoughProducts ? `translateX(-${Math.min(currentIndex, maxIndex) * (100 / itemsToShow)}%)` : 'none'
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0"
                style={{
                  width: `${100 / itemsToShow}%`,
                  pointerEvents: isDragging ? 'none' : 'auto'
                }}
              >
                <Link
                  href={`/producto/${product.id}`}
                  className="block h-full focus:outline-none focus:ring-2 focus:ring-[#F16529] focus:ring-offset-2"
                  onClick={(e) => {
                    if (hasDragged) {
                      e.preventDefault();
                    }
                  }}
                  style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                >
                  <ProductCard product={product} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicators - solo si hay suficientes productos */}
      {hasEnoughProducts && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.ceil(products.length / itemsToShow) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(Math.min(index * itemsToShow, maxIndex))}
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
      )}
    </section>
  );
});

ProductCarousel.displayName = 'ProductCarousel';

export default ProductCarousel;
