'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

type ProductWithExtras = Product & {
  marca?: string;
  precioOriginal?: number;
  rating?: number;
  reviewCount?: number;
};

interface HorizontalProductGridProps {
  products: ProductWithExtras[];
  title?: string;
}

const HorizontalProductCard = ({ product }: { product: ProductWithExtras }) => {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      product.id,
      product.nombre || 'Producto',
      product.precio || 0,
      product.imagen || undefined,
      1,
      product.sku,
    );

    // Show notification
    const notification = document.createElement('div');
    notification.textContent = 'Producto agregado al carrito';
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 transition-all duration-300';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const discountPercentage = product.precioOriginal && product.precio 
    ? Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-orange-400 relative">
      <div className="flex h-32 sm:h-36">
        {/* Badges */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
            -{discountPercentage}%
          </div>
        )}
        {product.nuevo && (
          <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
            NUEVO
          </div>
        )}

        {/* Image Section - 35% width */}
        <div className="relative w-[35%] bg-white p-3 flex items-center justify-center">
          {product.imagen ? (
            <div className="relative w-full h-full">
              <Image
                src={product.imagen}
                alt={product.nombre || 'Producto'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 35vw, 20vw"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="text-gray-300 text-4xl">📦</div>
          )}
        </div>

        {/* Content Section - 65% width */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          {/* Title */}
          <h3 className="text-sm font-medium text-gray-700 line-clamp-2 leading-tight mb-2">
            {product.nombre || 'Producto sin nombre'}
          </h3>

          {/* Price and Button */}
          <div className="space-y-2">
            {/* Original Price */}
            {product.precioOriginal && product.precioOriginal > (product.precio || 0) && (
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(product.precioOriginal)}
              </div>
            )}

            {/* Current Price with discount badge */}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.precio ?? 0)}
              </span>
              {discountPercentage > 0 && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Stock warning */}
            {product.stock && product.stock <= 5 && product.stock > 0 && (
              <p className="text-xs text-orange-600 font-medium">
                Quedan {product.stock} disponibles
              </p>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={(product.stock ?? 1) === 0}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-1.5 ${
                (product.stock ?? 1) === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group'
              }`}
            >
              {(product.stock ?? 1) === 0 ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Agotado</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Agregar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HorizontalProductGrid({ products, title }: HorizontalProductGridProps) {
  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-[#F16529] to-[#E67E22] bg-clip-text text-transparent">
          {title}
        </h2>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 p-2 sm:p-4">
        {products.map((product) => (
          <HorizontalProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
