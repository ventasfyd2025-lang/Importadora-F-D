'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/types';

interface MainBannerCarouselProps {
  products: Product[];
  config: {
    active: boolean;
    slides: {
      productId: string;
      imageUrl: string;
    }[];
  };
  autoPlay?: boolean;
  interval?: number;
}

export default function MainBannerCarousel({ 
  products = [], 
  config,
  autoPlay = true, 
  interval = 3000 
}: MainBannerCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Create banner slides - INMEDIATO como PC Factory
  const createBannerSlides = () => {
    // CARGA INMEDIATA: usar config sin esperar productos
    if (config?.active && config?.slides?.length) {
      const configSlides = [];
      
      for (let i = 0; i < config.slides.length; i++) {
        const slide = config.slides[i];
        
        if (slide.imageUrl) {
          // Producto inmediato sin esperar la lista completa
          const featuredProduct = {
            id: slide.productId || `banner-slide-${i}`,
            nombre: 'Producto destacado',
            precio: 0,
            categoria: 'destacados',
            stock: 1,
            imagen: slide.imageUrl
          };
          
          configSlides.push({
            featuredProduct: featuredProduct,
            imageUrl: slide.imageUrl
          });
        }
      }
      
      return configSlides;
    }

    return [];
  };

  const slides = createBannerSlides();

  // Aggressive preload with highest priority
  useEffect(() => {
    if (slides.length > 0) {
      // Preload first image with highest priority immediately
      if (slides[0]?.imageUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = slides[0].imageUrl;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
      
      // Preload remaining images
      slides.forEach((slide, index) => {
        if (slide.imageUrl) {
          const img = new window.Image();
          img.onload = () => handleImageLoad(index);
          img.loading = index === 0 ? 'eager' : 'lazy';
          img.src = slide.imageUrl;
        }
      });
    }
  }, [slides.length]);

  useEffect(() => {
    if (isPlaying && slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, interval);
      return () => clearInterval(timer);
    }
  }, [isPlaying, slides.length, interval]);

  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => new Set([...prev, index]));
  };

  const handleProductImageClick = (productId: string) => {
    router.push(`/producto/${productId}`);
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-gray-900">
      {/* Main Carousel - Responsive heights optimized for mobile */}
      <div className="relative h-[180px] sm:h-[280px] md:h-[350px] lg:h-[450px] xl:h-[500px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Optimized Product Image - Full Screen */}
            <div 
              className="absolute inset-0 cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => handleProductImageClick(slide.featuredProduct.id)}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.featuredProduct.nombre}
                fill
                className="object-cover"
                priority={index === 0} // Priority load for first image
                quality={75} // Reducido para carga más rápida
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                onLoad={() => handleImageLoad(index)}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'low'}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Controls - Responsive */}
      <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 sm:space-x-4">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-1.5 sm:p-2 rounded-full hover:bg-opacity-30 transition-all duration-300"
        >
          {isPlaying ? (
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Slide Indicators */}
        <div className="flex space-x-1 sm:space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile, visible on larger screens */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
            className="hidden sm:block absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-opacity-30 transition-all duration-300"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentSlide(currentSlide === slides.length - 1 ? 0 : currentSlide + 1)}
            className="hidden sm:block absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-opacity-30 transition-all duration-300"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}