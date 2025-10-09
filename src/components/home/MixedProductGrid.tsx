'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { StarIcon } from '@heroicons/react/24/solid';
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface MixedProductGridProps {
  products: Product[];
  title?: string;
  viewAllLink?: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
};

// Small Product Card
const SmallProductCard = ({ product }: { product: Product }) => {
  const discountPercentage = product.oferta ? Math.floor(Math.random() * 30) + 10 : 0;
  const originalPrice = discountPercentage > 0 ? product.precio / (1 - discountPercentage / 100) : 0;

  return (
    <article className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-32" />
        {product.oferta && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercentage}%
          </span>
        )}
        {product.nuevo && (
          <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
            Nuevo
          </span>
        )}
        <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <HeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
        </button>
      </div>
      
      <div className="p-2 flex flex-col flex-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide">{product.categoria}</div>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mt-1">{product.nombre}</h3>
        
        <div className="mt-2 flex flex-col flex-1">
          <div className="flex items-baseline gap-1">
            {discountPercentage > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(product.precio)}
            </span>
          </div>
          
          <div className="flex items-center mt-1">
            <StarIcon className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-gray-600 ml-1">4.5</span>
          </div>
          
          <button className="mt-2 w-full text-xs bg-orange-500 text-white py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
};

// Large Product Card
const LargeProductCard = ({ product }: { product: Product }) => {
  const discountPercentage = product.oferta ? Math.floor(Math.random() * 30) + 10 : 0;
  const originalPrice = discountPercentage > 0 ? product.precio / (1 - discountPercentage / 100) : 0;

  return (
    <article className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow md:col-span-2 md:row-span-2">
      <div className="relative">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64" />
        {product.oferta && (
          <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded">
            -{discountPercentage}%
          </span>
        )}
        {product.nuevo && (
          <span className="absolute top-4 right-4 bg-blue-500 text-white text-sm font-bold px-3 py-1.5 rounded">
            Nuevo
          </span>
        )}
        <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <HeartIcon className="h-6 w-6 text-gray-400 hover:text-red-500" />
        </button>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide">{product.categoria}</div>
        <h3 className="text-lg font-medium text-gray-900 line-clamp-2 mt-2">{product.nombre}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.descripcion}</p>
        
        <div className="mt-4 flex flex-col flex-1">
          <div className="flex items-baseline gap-2">
            {discountPercentage > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(product.precio)}
            </span>
          </div>
          
          <div className="flex items-center mt-2">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">4.5 (128)</span>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button className="flex-1 text-sm bg-orange-500 text-white py-2 rounded font-medium flex items-center justify-center gap-2">
              <ShoppingBagIcon className="h-4 w-4" />
              Agregar al carrito
            </button>
            <button className="text-sm border border-gray-300 text-gray-700 py-2 px-4 rounded font-medium">
              Ver más
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

// Vertical Product Card
const VerticalProductCard = ({ product }: { product: Product }) => {
  const discountPercentage = product.oferta ? Math.floor(Math.random() * 30) + 10 : 0;
  const originalPrice = discountPercentage > 0 ? product.precio / (1 - discountPercentage / 100) : 0;

  return (
    <article className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48" />
        {product.oferta && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded">
            -{discountPercentage}%
          </span>
        )}
        {product.nuevo && (
          <span className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded">
            Nuevo
          </span>
        )}
        <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <HeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
        </button>
      </div>
      
      <div className="p-3 flex flex-col flex-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide">{product.categoria}</div>
        <h3 className="text-base font-medium text-gray-900 line-clamp-2 mt-1">{product.nombre}</h3>
        
        <div className="mt-3 flex flex-col flex-1">
          <div className="flex items-baseline gap-1.5">
            {discountPercentage > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-base font-bold text-gray-900">
              {formatPrice(product.precio)}
            </span>
          </div>
          
          <div className="flex items-center mt-2">
            <StarIcon className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-xs text-gray-600 ml-1">4.5 (42)</span>
          </div>
          
          <button className="mt-3 w-full text-sm bg-orange-500 text-white py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  );
};

// Horizontal Product Card
const HorizontalProductCard = ({ product }: { product: Product }) => {
  const discountPercentage = product.oferta ? Math.floor(Math.random() * 30) + 10 : 0;
  const originalPrice = discountPercentage > 0 ? product.precio / (1 - discountPercentage / 100) : 0;

  return (
    <article className="group relative flex bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow md:col-span-2">
      <div className="relative w-1/3">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />
        {product.oferta && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercentage}%
          </span>
        )}
      </div>
      
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{product.categoria}</div>
            <h3 className="text-base font-medium text-gray-900 line-clamp-2 mt-1">{product.nombre}</h3>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
            <HeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.descripcion}</p>
        
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            {discountPercentage > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.precio)}
            </span>
          </div>
          
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">4.5 (89)</span>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <button className="text-sm bg-orange-500 text-white px-4 py-2 rounded font-medium flex items-center gap-2">
            <ShoppingBagIcon className="h-4 w-4" />
            Agregar
          </button>
          <button className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded font-medium">
            Ver más
          </button>
        </div>
      </div>
    </article>
  );
};

const MixedProductGrid: React.FC<MixedProductGridProps> = ({ products, title, viewAllLink }) => {
  // Create a pattern for different card sizes
  const getCardType = (index: number) => {
    if (index % 12 === 0) return 'large';
    if (index % 6 === 0) return 'horizontal';
    if (index % 4 === 0) return 'vertical';
    return 'small';
  };

  return (
    <section className="space-y-6">
      {title && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {viewAllLink && (
            <Link 
              href={viewAllLink} 
              className="text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              Ver todos →
            </Link>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product, index) => {
          const cardType = getCardType(index);
          
          switch (cardType) {
            case 'large':
              return <LargeProductCard key={product.id} product={product} />;
            case 'horizontal':
              return <HorizontalProductCard key={product.id} product={product} />;
            case 'vertical':
              return <VerticalProductCard key={product.id} product={product} />;
            default:
              return <SmallProductCard key={product.id} product={product} />;
          }
        })}
      </div>
    </section>
  );
};

export default MixedProductGrid;