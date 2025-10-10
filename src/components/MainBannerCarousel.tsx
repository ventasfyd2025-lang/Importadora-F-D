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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragCurrent, setDragCurrent] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
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

  // Manejo de swipe (móvil)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0].clientX;
    setTouchStart(touch);
    setTouchEnd(touch);
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
    if (!touchStart) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    } else if (Math.abs(distance) < 10) {
      // Si el movimiento fue mínimo, es un tap - navegar al slide actual
      const currentSlideData = slides[currentSlide];
      if (currentSlideData?.targetUrl && currentSlideData.targetUrl !== '#') {
        console.log('Tap detectado, navegando a:', currentSlideData.targetUrl);
        router.push(currentSlideData.targetUrl);
      }
    }

    // Resetear después de un delay
    setTimeout(() => {
      setTouchStart(0);
      setTouchEnd(0);
      setHasDragged(false);
    }, 100);
  };

  // Manejo de drag (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.pageX);
    setDragCurrent(e.pageX);
    setHasDragged(false); // Resetear flag al inicio
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setDragCurrent(e.pageX);

    // Marcar como dragged si hay movimiento significativo
    const distance = Math.abs(dragStart - e.pageX);
    if (distance > 10) {
      setHasDragged(true);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const distance = dragStart - dragCurrent;

    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      }
    } else if (Math.abs(distance) < 10) {
      // Si el movimiento fue mínimo, es un click - navegar al slide actual
      const currentSlideData = slides[currentSlide];
      if (currentSlideData?.targetUrl && currentSlideData.targetUrl !== '#') {
        console.log('Click detectado, navegando a:', currentSlideData.targetUrl);
        router.push(currentSlideData.targetUrl);
      }
    }

    setIsDragging(false);

    // Resetear después de un delay
    setTimeout(() => {
      setDragStart(0);
      setDragCurrent(0);
      setHasDragged(false);
    }, 100);
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full bg-gray-900">
      {/* Main Carousel - Responsive heights optimized for mobile */}
      <div
        className="relative h-[180px] sm:h-[280px] md:h-[350px] lg:h-[450px] xl:h-[500px] overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Optimized Product Image - Full Screen */}
            <div
              className="absolute inset-0 hover:scale-105 transition-transform duration-300"
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

      {/* Slide Indicators */}
      <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
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
    </section>
  );
}
