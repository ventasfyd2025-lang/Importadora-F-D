'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/types';
import { defaultHeroBanners } from '@/components/home/bannerData';

type SlideLinkType = 'product' | 'category';

interface SlideConfig {
  linkType?: SlideLinkType;
  productId?: string;
  categoryId?: string;
  imageUrl: string;
}

interface ProcessedSlide {
  id: string;
  imageUrl: string;
  featuredProduct: {
    id: string;
    nombre: string;
    precio: number;
    categoria: string;
    stock: number;
    imagen: string;
  };
  linkType: SlideLinkType;
  productId?: string;
  categoryId?: string;
  targetUrl: string;
}

interface MainBannerCarouselProps {
  products: Product[];
  config: {
    active: boolean;
    slides: SlideConfig[];
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
  const resolveLinkType = (slide: SlideConfig): SlideLinkType => {
    if (slide.linkType === 'category') return 'category';
    if (slide.linkType === 'product') return 'product';
    if (slide.categoryId && !slide.productId) return 'category';
    return 'product';
  };

  const createBannerSlides = (): ProcessedSlide[] => {
    if (config?.active && config?.slides?.length) {
      return (config.slides
        .map((slide, i) => {
          const fallbackBanner = defaultHeroBanners[i % defaultHeroBanners.length];
          const sanitizedImageUrl = (slide?.imageUrl || '').trim();
          const imageUrl = sanitizedImageUrl || fallbackBanner.imageUrl;

          if (!imageUrl) {
            return null;
          }

          const linkType = resolveLinkType(slide);
          const product = linkType === 'product' && slide.productId
            ? products.find(p => p.id === slide.productId)
            : undefined;

          const generatedId = linkType === 'category'
            ? `category-${slide.categoryId || i}`
            : `product-${slide.productId || i}`;
          const uniqueSlideId = `${generatedId}-${i}`;
          const baseTitle = linkType === 'category'
            ? `Categoría: ${slide.categoryId || fallbackBanner?.title || 'en promoción'}`
            : product?.nombre || fallbackBanner?.title || 'Producto destacado';

          const targetUrl = linkType === 'category'
            ? (slide.categoryId ? `/?category=${slide.categoryId}` : '#')
            : (slide.productId ? `/producto/${slide.productId}` : '#');

          return {
            imageUrl,
            featuredProduct: {
              id: slide.productId || uniqueSlideId,
              nombre: baseTitle,
              precio: linkType === 'product' ? product?.precio || 0 : 0,
              categoria: linkType === 'category'
                ? slide.categoryId || fallbackBanner?.title || 'categoria'
                : product?.categoria || fallbackBanner?.title || 'destacados',
              stock: linkType === 'product' ? (product?.stock ?? 1) : 1,
              imagen: imageUrl
            },
            linkType,
            productId: slide.productId,
            categoryId: slide.categoryId,
            targetUrl,
            // ensure unique id per slide even if same category/product repeats
            id: uniqueSlideId
          };
        })
        .filter(slide => slide !== null)) as ProcessedSlide[];
    }
    return [];
  };

  const slides = createBannerSlides();

  // Optimized preload with proper timing
  useEffect(() => {
    if (slides.length > 0) {
      // Only preload first image immediately
      if (slides[0]?.imageUrl) {
        const img = new window.Image();
        img.onload = () => handleImageLoad(0);
        img.loading = 'eager';
        img.src = slides[0].imageUrl;
      }

      // Preload other images with delay to avoid unused preload warnings
      const timer = setTimeout(() => {
        slides.slice(1).forEach((slide, index) => {
          if (slide.imageUrl) {
            const img = new window.Image();
            img.onload = () => handleImageLoad(index + 1);
            img.loading = 'lazy';
            img.src = slide.imageUrl;
          }
        });
      }, 2000); // Wait 2 seconds before preloading other images

      return () => clearTimeout(timer);
    }
  }, [slides]);

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

  const handleSlideClick = (slide: ProcessedSlide) => {
    if (!slide?.targetUrl || slide.targetUrl === '#') return;
    router.push(slide.targetUrl);
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
              onClick={() => handleSlideClick(slide)}
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
