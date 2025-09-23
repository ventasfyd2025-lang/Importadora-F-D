'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface SecondaryBannerProps {
  config?: {
    active: boolean;
    imageUrl?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
  };
}

export default function SecondaryBanner({ config }: SecondaryBannerProps) {
  // Si no hay config o no está activo, mostrar banner por defecto
  if (!config?.active) {
    return (
      <section className="w-full h-[200px] sm:h-[250px] lg:h-[300px] bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center my-8">
        <div className="text-white text-center px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Ofertas Especiales
          </h2>
          <p className="text-lg sm:text-xl opacity-90 mb-4">
            Descuentos hasta 50% en productos seleccionados
          </p>
          <Link
            href="/?filter=ofertas"
            className="inline-block bg-white text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Ver Ofertas
          </Link>
        </div>
      </section>
    );
  }

  // Banner configurado desde admin
  return (
    <section className="w-full h-[200px] sm:h-[250px] lg:h-[300px] relative overflow-hidden my-8">
      {config.imageUrl ? (
        <div className="relative w-full h-full">
          <Image
            src={config.imageUrl}
            alt={config.title || 'Banner secundario'}
            fill
            className="object-cover"
            priority={false}
          />
          {/* Overlay para mejorar legibilidad del texto */}
          <div className="absolute inset-0 bg-black bg-opacity-20" />
        </div>
      ) : (
        <div 
          className="w-full h-full"
          style={{ 
            backgroundColor: config.backgroundColor || '#f97316' // orange-500 por defecto
          }}
        />
      )}

      {/* Content overlay */}
      {(config.title || config.subtitle || config.ctaText) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center px-4 max-w-4xl">
            {config.title && (
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                {config.title}
              </h2>
            )}
            {config.subtitle && (
              <p className="text-lg sm:text-xl opacity-90 mb-4 drop-shadow-lg">
                {config.subtitle}
              </p>
            )}
            {config.ctaText && config.ctaLink && (
              <Link
                href={config.ctaLink}
                className="inline-block bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                {config.ctaText}
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}