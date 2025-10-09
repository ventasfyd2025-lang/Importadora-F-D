'use client';

import React from 'react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';

interface DynamicProductGridProps {
  products: Product[];
}

export default function DynamicProductGrid({ products }: DynamicProductGridProps) {
  if (products.length === 0) return null;

  // Create a pattern for card sizes like Falabella
  // Pattern: 2 squares, 1 rectangle, 3 squares, 2 rectangles, repeat
  const getCardClass = (index: number) => {
    const pattern = index % 8;
    
    switch (pattern) {
      case 0:
      case 1:
        // First 2 cards: normal square
        return {
          gridClass: 'col-span-1 row-span-1',
          heightClass: 'h-72 sm:h-80 lg:h-88'
        };
      case 2:
        // 3rd card: wide rectangle
        return {
          gridClass: 'col-span-2 row-span-1',
          heightClass: 'h-72 sm:h-80 lg:h-88'
        };
      case 3:
      case 4:
      case 5:
        // 4th, 5th, 6th cards: normal squares
        return {
          gridClass: 'col-span-1 row-span-1',
          heightClass: 'h-72 sm:h-80 lg:h-88'
        };
      case 6:
        // 7th card: tall rectangle
        return {
          gridClass: 'col-span-1 row-span-2',
          heightClass: 'h-[36rem] sm:h-[40rem] lg:h-[44rem]'
        };
      case 7:
        // 8th card: wide rectangle
        return {
          gridClass: 'col-span-2 row-span-1',
          heightClass: 'h-72 sm:h-80 lg:h-88'
        };
      default:
        return {
          gridClass: 'col-span-1 row-span-1',
          heightClass: 'h-72 sm:h-80 lg:h-88'
        };
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 auto-rows-auto p-2 sm:p-3 lg:p-4">
      {products.map((product, index) => {
        const { gridClass, heightClass } = getCardClass(index);
        
        return (
          <div key={product.id} className={gridClass}>
            <div className={`${heightClass} w-full`}>
              <ProductCard 
                product={product} 
                customHeight={heightClass}
                isSpecial={gridClass.includes('col-span-2') || gridClass.includes('row-span-2')}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}