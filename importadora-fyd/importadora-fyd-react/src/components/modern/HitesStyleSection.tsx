'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import HitesProductCard from './HitesProductCard'; // Import the new card component

interface HitesStyleSectionProps {
  title: string;
  products: Product[];
  sectionLink?: string;
}

export default function HitesStyleSection({ title, products, sectionLink = "/productos" }: HitesStyleSectionProps) {
  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <Link href={sectionLink}>
            <span className="text-sm font-semibold text-hites-blue hover:text-hites-purple transition-colors">
              Ver todo &rarr;
            </span>
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <HitesProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}