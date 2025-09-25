'use client';

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
  autoPlayInterval = 5000
}: BannerCarouselProps) => {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  if (banners.length === 0) {
    return (
      <div
        className="relative w-full h-60 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl overflow-hidden"
        role="region"
        aria-label={t('common.banner')}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl md:text-4xl font-bold">{t('banner.title')}</h2>
            <p className="mt-2 text-lg">{t('banner.description')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={t('common.banner')}
    >
      {/* Banner Slides */}
      <div className="relative h-60 sm:h-64 md:h-80 lg:h-96">
        {banners.map((banner, index) => (
          <div 
            key={banner.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentIndex 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
            role="group"
            aria-hidden={index !== currentIndex}
            aria-label={`Banner ${index + 1}`}
          >
            {/* Clickable Banner Image */}
            {banner.ctaLink ? (
              <Link 
                href={banner.ctaLink}
                className="block w-full h-full cursor-pointer"
                aria-label={banner.title || `Banner ${index + 1}`}
              >
                <div 
                  className={`w-full h-full bg-cover bg-center transition-transform duration-[10s] ease-linear hover:scale-105 ${
                    index === currentIndex ? 'scale-110' : 'scale-100'
                  }`}
                  style={{ 
                    backgroundImage: `url(${banner.imageUrl})` 
                  }}
                />
              </Link>
            ) : (
              <div 
                className={`w-full h-full bg-cover bg-center transition-transform duration-[10s] ease-linear ${
                  index === currentIndex ? 'scale-110' : 'scale-100'
                }`}
                style={{ 
                  backgroundImage: `url(${banner.imageUrl})` 
                }}
              />
            )}
            
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-3 rounded-full transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={t('banner.previous')}
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-3 rounded-full transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={t('banner.next')}
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
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