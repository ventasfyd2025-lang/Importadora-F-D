'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeartIcon, StarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';

interface ModernProductCardProps {
  product: Product;
  className?: string;
}

export default function ModernProductCard({ product, className = '' }: ModernProductCardProps) {
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

  return (
    <Link href={`/productos/${product.id}`}>
      <div 
        className={`group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer border border-gray-100 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {/* Product Image Placeholder */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {(product.nombre || product.name || 'P').charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium">
                {product.marca || 'Marca'}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.nuevo && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                NUEVO
              </span>
            )}
            {product.oferta && discountPercentage > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{discountPercentage}%
              </span>
            )}
            {product.stock < 5 && product.stock > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                ¡ÚLTIMOS!
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
              isWishlisted 
                ? 'bg-red-500 text-white' 
                : 'bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-600 hover:text-red-500'
            } ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          >
            {isWishlisted ? (
              <HeartSolidIcon className="h-4 w-4" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
          </button>

          {/* Quick View Button */}
          <button
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 p-3 rounded-full transition-all duration-300 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <EyeIcon className="h-5 w-5 text-gray-600" />
          </button>

          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-black bg-opacity-20 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Brand */}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {product.marca || 'Marca'}
          </p>

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight text-sm">
            {product.nombre || product.name || 'Producto sin nombre'}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.rating!) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({product.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.precio || product.price || 0)}
              </span>
              {product.precioOriginal && product.precioOriginal > (product.precio || product.price || 0) && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.precioOriginal)}
                </span>
              )}
            </div>
            {product.stock === 0 && (
              <p className="text-xs text-red-500 font-medium">Sin stock</p>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
              product.stock === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 active:scale-95'
            }`}
          >
            {product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
          </button>
        </div>

        {/* Stock Bar */}
        {product.stock > 0 && product.stock < 10 && (
          <div className="px-4 pb-4">
            <div className="bg-gray-200 rounded-full h-1 mb-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-1 rounded-full transition-all duration-500"
                style={{ width: `${(product.stock / 10) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center">
              Solo quedan {product.stock} unidades
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}