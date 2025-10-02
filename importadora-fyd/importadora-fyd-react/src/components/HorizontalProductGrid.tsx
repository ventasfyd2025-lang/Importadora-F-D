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
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group border border-gray-100 hover:-translate-y-2">
      <div className="flex h-32 sm:h-36 lg:h-40">
        {/* Image Section - 40% width */}
        <div className="relative w-2/5 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="absolute inset-0 p-2 flex items-center justify-center">
            {product.imagen ? (
              <Image
                src={product.imagen}
                alt={product.nombre || 'Producto'}
                fill
                className="object-contain transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            ) : (
              <div className="text-gray-400 text-6xl">📦</div>
            )}
          </div>
          
          {/* Badges */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold px-3 py-2 rounded-full shadow-lg">
              -{discountPercentage}%
            </div>
          )}
          
          {product.nuevo && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold px-3 py-2 rounded-full shadow-lg">
              NUEVO
            </div>
          )}
        </div>

        {/* Content Section - 60% width */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div className="space-y-1">
            {/* Category */}
            <div className="text-xs text-orange-500 uppercase tracking-wide font-semibold">
              {product.categoria}
            </div>
            
            {/* Title */}
            <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-tight">
              {product.nombre || 'Producto sin nombre'}
            </h3>
            
            {/* Description */}
            {product.descripcion && (
              <p className="text-gray-600 line-clamp-2 leading-relaxed">
                {product.descripcion}
              </p>
            )}
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <span
                      key={rating}
                      className={`text-lg ${rating < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  ({product.reviewCount || 0} reseñas)
                </span>
              </div>
            )}
          </div>

          {/* Price and Button */}
          <div className="space-y-2">
            <div className="space-y-1">
              {/* Original Price */}
              {product.precioOriginal && product.precioOriginal > (product.precio || 0) && (
                <div className="text-sm text-gray-400 line-through">
                  {formatPrice(product.precioOriginal)}
                </div>
              )}
              
              {/* Current Price */}
              <div className="text-sm sm:text-base font-bold text-gray-900">
                {formatPrice(product.precio ?? 0)}
              </div>
              
              {/* Stock warning */}
              {product.stock && product.stock <= 5 && product.stock > 0 && (
                <p className="text-sm text-red-600 font-medium">
                  ¡Solo quedan {product.stock} unidades!
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={(product.stock ?? 1) === 0}
              style={{ padding: '6px 10px', fontSize: '11px' }}
              className={`w-full rounded-md font-medium transition-all duration-300 flex items-center justify-center gap-1 ${
                (product.stock ?? 1) === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
              }`}
            >
              {(product.stock ?? 1) === 0 ? (
                'Sin Stock'
              ) : (
                <>
                  <span className="text-sm">🛒</span>
                  <span>Agregar al Carrito</span>
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
