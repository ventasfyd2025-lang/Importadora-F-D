'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface BannerCarouselProps {
  title: string;
  text: string;
  images: string[];
  autoPlay?: boolean;
  interval?: number;
}

export default function BannerCarousel({ 
  title, 
  text, 
  images = [], 
  autoPlay = true, 
  interval = 5000 
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Ensure images is always an array
  const safeImages = Array.isArray(images) ? images : [];

  useEffect(() => {
    if (autoPlay && safeImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === safeImages.length - 1 ? 0 : prevIndex + 1
        );
      }, interval);

      return () => clearInterval(timer);
    }
  }, [autoPlay, safeImages.length, interval]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? safeImages.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === safeImages.length - 1 ? 0 : currentIndex + 1);
  };

  if (safeImages.length === 0) {
    // Fallback to gradient banner if no images
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
    <section className="relative h-[500px] overflow-hidden">
      {/* Background Images */}
      {safeImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
          />
          {/* Overlay */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(232, 92, 38, 0.7)' }} />
        </div>
      ))}
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
            {title}
          </h1>
          <p className="text-2xl md:text-3xl text-orange-100 drop-shadow-lg">
            {text}
          </p>
        </div>
      </div>

      {/* Navigation Arrows */}
      {safeImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {safeImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {safeImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}