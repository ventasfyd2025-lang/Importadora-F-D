'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';

interface LargeProductCardProps {
  product: Product;
  variant?: 'large' | 'medium' | 'small';
}

export default function LargeProductCard({ product, variant = 'large' }: LargeProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
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

  // Tamaños según variante
  const sizeClasses = {
    large: 'aspect-[4/5]', // Más rectangular como Falabella
    medium: 'aspect-[3/4]',
    small: 'aspect-square'
  };

  const cardClasses = {
    large: 'h-full',
    medium: 'h-full', 
    small: 'h-full'
  };

  return (
    <Link href={`/productos/${product.id}`}>
      <div 
        className={`group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 ${cardClasses[variant]}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className={`relative ${sizeClasses[variant]} bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden`}>
          {/* Product Image Placeholder - Estilo Falabella */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 relative">
            <div className="text-center p-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">
                  {(product.nombre || product.name || 'P').charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-700 font-semibold">
                {product.marca || 'Marca'}
              </p>
            </div>
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.nuevo && (
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                NUEVO
              </span>
            )}
            {product.oferta && discountPercentage > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                -{discountPercentage}%
              </span>
            )}
            {product.stock < 5 && product.stock > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                ¡ÚLTIMOS!
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2.5 rounded-full transition-all duration-300 shadow-lg ${
              isWishlisted 
                ? 'bg-red-500 text-white' 
                : 'bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-red-500'
            } ${isHovered ? 'opacity-100 scale-100' : 'opacity-80 scale-95'}`}
          >
            {isWishlisted ? (
              <HeartSolidIcon className="h-5 w-5" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Brand */}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {product.marca || 'Marca'}
          </p>

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {product.nombre || product.name || 'Producto sin nombre'}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating!) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                ({product.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(product.precio || product.price || 0)}
              </span>
              {product.precioOriginal && product.precioOriginal > (product.precio || product.price || 0) && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.precioOriginal)}
                </span>
              )}
            </div>
            {product.stock === 0 && (
              <p className="text-sm text-red-500 font-medium">Sin stock</p>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
              product.stock === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
            }`}
          >
            {product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
          </button>
        </div>

        {/* Stock indicator - Solo para productos con poco stock */}
        {product.stock > 0 && product.stock < 10 && (
          <div className="px-4 pb-4">
            <div className="bg-gray-200 rounded-full h-1.5 mb-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(product.stock / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center font-medium">
              Solo quedan {product.stock} unidades
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}