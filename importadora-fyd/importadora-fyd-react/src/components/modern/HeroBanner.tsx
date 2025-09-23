'use client';

import React from 'react';
import Link from 'next/link';

interface HeroBannerProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export default function HeroBanner({ title, subtitle, ctaText, ctaLink }: HeroBannerProps) {
  return (
    <div className="w-full bg-gradient-to-r from-hites-fuchsia to-hites-purple text-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          {title}
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8">
          {subtitle}
        </p>
        <Link href={ctaLink}>
          <span className="inline-block bg-hites-orange text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-opacity-90 transition-transform transform hover:scale-105">
            {ctaText}
          </span>
        </Link>
      </div>
    </div>
  );
}