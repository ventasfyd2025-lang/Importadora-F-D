'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { StarIcon } from '@heroicons/react/24/solid';
import { useCart } from '@/context/CartContext';

type CardSizeVariant = 'square' | 'wide' | 'tall';

interface HitesProductCardProps {
  product: Product;
  className?: string;
  sizeVariant?: CardSizeVariant;
}

const sizeStyles: Record<CardSizeVariant, {
  aspectClass: string;
  imagePadding: string;
  contentPadding: string;
  titleClass: string;
  priceClass: string;
}> = {
  square: {
    aspectClass: 'aspect-[4/5]',
    imagePadding: 'p-3',
    contentPadding: 'p-3',
    titleClass: 'text-sm',
    priceClass: 'text-blue-600 text-lg'
  },
  wide: {
    aspectClass: 'aspect-[5/4]',
    imagePadding: 'p-4',
    contentPadding: 'p-4',
    titleClass: 'text-base',
    priceClass: 'text-blue-600 text-xl'
  },
  tall: {
    aspectClass: 'aspect-[4/5]',
    imagePadding: 'p-4',
    contentPadding: 'p-4',
    titleClass: 'text-base',
    priceClass: 'text-blue-600 text-xl'
  }
};

export default function HitesProductCard({ product, className = '', sizeVariant = 'square' }: HitesProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      product.id,
      product.nombre || product.name || 'Producto',
      product.precio || product.price || 0,
      product.imagen || product.image || undefined
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discountPercentage = product.precioOriginal && product.precio 
    ? Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100)
    : 0;

  const { aspectClass, imagePadding, contentPadding, titleClass, priceClass } = sizeStyles[sizeVariant];

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full hover:-translate-y-1 ${className}`}>
      {/* Image Container */}
      <div className={`relative w-full ${aspectClass}`}>
        <div className={`absolute inset-0 flex items-center justify-center ${imagePadding} bg-white rounded-t-lg`}>
          <img 
            src={product.imagen || `https://picsum.photos/seed/${product.id}/300/300`}
            alt={product.nombre || product.name}
            className="max-w-full max-h-full object-contain mix-blend-multiply"
          />
        </div>
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-hites-magenta text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercentage}%
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-3 flex flex-col flex-grow justify-between">
        <div className="flex-grow space-y-2">
          {/* Product Name */}
          <h3 className="text-hites-text-black text-sm font-normal line-clamp-2 leading-tight">
            {product.nombre || product.name || 'Producto sin nombre'}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(product.rating!) ? 'text-hites-yellow' : 'text-gray-300'}`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
            </div>
          )}

          {/* Prices */}
          <div className="space-y-2">
            {product.precioOriginal && product.precioOriginal > (product.precio || 0) && (
              <p className="text-gray-400 text-sm line-through">
                {formatPrice(product.precioOriginal)}
              </p>
            )}
            <p className="text-gray-900 text-xl font-bold">
              {formatPrice(product.precio || product.price || 0)}
            </p>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mt-4">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${ 
              product.stock === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-800 text-white hover:scale-105 shadow-lg hover:shadow-xl transform'
            }`}
          >
            {product.stock === 0 ? (
              'Sin Stock'
            ) : (
              <>
                <span>🛒</span>
                <span>Agregar al Carrito</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
