'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  badge: string;
  gradient: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  useEffect(() => {
    if (!isAutoplay || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoplay, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
        <div className="text-white text-center px-4">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4">
            Importadora F&D
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl">
            Los mejores productos importados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`min-w-full h-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center relative`}
          >
            <div className="text-white text-center px-4 sm:px-6 lg:px-8 max-w-4xl">
              {/* Badge */}
              <div className="inline-block mb-4 sm:mb-6">
                <span className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  {slide.badge}
                </span>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 drop-shadow-2xl">
                {slide.title}
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm sm:text-lg lg:text-xl mb-6 sm:mb-8 lg:mb-10 opacity-90 drop-shadow-lg max-w-2xl mx-auto">
                {slide.subtitle}
              </p>
              
              {/* CTA Button */}
              <Link
                href={slide.ctaLink}
                className="inline-block bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                {slide.ctaText}
              </Link>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-white bg-opacity-5 rounded-full blur-2xl"></div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-opacity-30 transition-all duration-300 z-10"
            aria-label="Slide anterior"
          >
            <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-opacity-30 transition-all duration-300 z-10"
            aria-label="Slide siguiente"
          >
            <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Autoplay indicator */}
      {isAutoplay && slides.length > 1 && (
        <div className="absolute top-4 right-4 text-white text-xs opacity-60">
          Auto
        </div>
      )}
    </div>
  );
}