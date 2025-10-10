'use client';

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';

interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  badgeText?: string;
  badgeColor?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const BannerCarousel = memo(({
  banners = [],
  autoPlay = true,
  autoPlayInterval = 3000
}: BannerCarouselProps) => {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragCurrent, setDragCurrent] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovered || isFocused || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isHovered, isFocused, banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Manejo de swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }
    if (isRightSwipe) {
      setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Manejo de drag (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.pageX);
    setDragCurrent(e.pageX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setDragCurrent(e.pageX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const distance = dragStart - dragCurrent;

    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      } else {
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
      }
    }

    setIsDragging(false);
    setDragStart(0);
    setDragCurrent(0);
  };

  if (banners.length === 0) {
    return (
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-orange-400 to-pink-500"
        role="region"
        aria-label={t('common.banner')}
      >
        <div className="relative w-full aspect-[3/1] min-h-[220px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h2 className="text-2xl md:text-4xl font-bold">{t('banner.title')}</h2>
              <p className="mt-2 text-lg">{t('banner.description')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseUp();
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      role="region"
      aria-label={t('common.banner')}
    >
      {/* Banner Slides */}
      <div className="relative w-full aspect-[3/1] min-h-[220px]">
        {banners.map((banner, index) => {
          const backgroundImage = banner.imageUrl
            ? `url(${banner.imageUrl})`
            : 'linear-gradient(135deg, #F16529 0%, #F97316 100%)';

          const isActive = index === currentIndex;

          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105 pointer-events-none'
              }`}
              role="group"
              aria-label={`Banner ${index + 1}`}
              aria-live={isActive ? 'polite' : 'off'}
              aria-atomic="true"
            >
              <div
                className="relative w-full h-full bg-cover bg-center"
                style={{ backgroundImage }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-black/10" />

                <div className="absolute inset-0 flex items-center">
                  <div className="px-4 sm:px-8 lg:px-12 w-full max-w-2xl">
                    {banner.badgeText && (
                      <span
                        className="inline-block px-3 py-1 text-xs font-semibold text-white rounded-full shadow-lg mb-4"
                        style={banner.badgeColor ? { backgroundColor: banner.badgeColor } : { backgroundColor: 'rgba(217, 93, 34, 0.85)' }}
                      >
                        {banner.badgeText}
                      </span>
                    )}

                    {banner.title && (
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-md">
                        {banner.title}
                      </h2>
                    )}

                    {banner.subtitle && (
                      <p className="mt-2 text-sm sm:text-base lg:text-lg text-white/90 max-w-xl">
                        {banner.subtitle}
                      </p>
                    )}

                    {(banner.ctaText || banner.ctaLink) && (
                      <div className="mt-6">
                        {banner.ctaLink ? (
                          <Link
                            href={banner.ctaLink}
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-orange-500 text-white font-semibold shadow-lg hover:bg-orange-600 transition-colors"
                            aria-label={banner.ctaText || banner.title || `Banner ${index + 1}`}
                            tabIndex={isActive ? 0 : -1}
                          >
                            {banner.ctaText || 'Ver más'}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/20 text-white font-semibold shadow-lg">
                            {banner.ctaText || 'Más información'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>


      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`${t('banner.goToSlide')} ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </div>
  );
});

BannerCarousel.displayName = 'BannerCarousel';

export default BannerCarousel;
