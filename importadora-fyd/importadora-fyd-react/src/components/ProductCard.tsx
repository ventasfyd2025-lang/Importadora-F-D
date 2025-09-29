'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useNotification } from '@/context/NotificationContext';

interface ProductCardProps {
  product: Product;
  customHeight?: string;
  isSpecial?: boolean;
}

export default function ProductCard({ product, customHeight, isSpecial = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { currentUser, loading } = useUserAuth();
  const { addNotification } = useNotification();
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar si el usuario está logueado
    if (!currentUser && !loading) {
      // Mostrar modal de confirmación para login
      const shouldLogin = window.confirm(
        '¿Deseas iniciar sesión para agregar productos al carrito?\n\n' +
        'Si inicias sesión podrás:\n' +
        '• Guardar tus productos\n' +
        '• Realizar compras más rápido\n' +
        '• Ver el historial de pedidos\n\n' +
        'Presiona OK para ir al login o Cancelar para continuar como invitado.'
      );
      
      if (shouldLogin) {
        router.push('/login');
        return;
      }
      // Si decide continuar como invitado, procede a agregar al carrito
    }
    
    addItem(
      product.id,
      product.nombre || 'Producto',
      product.precio || 0,
      product.imagen || '',
      1,
      product.sku,
    );

    // Show notification using unified system
    addNotification({
      type: 'success',
      title: 'Producto agregado al carrito',
      message: currentUser ? undefined : 'Agregado como invitado',
      duration: 3000
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Get price and original price
  const currentPrice = product.precio || 0;
  const originalPrice = product.precioOriginal || (product.oferta ? Math.round(currentPrice * 1.3) : null);

  // Determine image height based on whether custom height is provided
  const imageHeight = customHeight 
    ? (isSpecial ? 'h-48 sm:h-56 lg:h-64' : 'h-36 sm:h-40 lg:h-48')
    : 'h-40 sm:h-44 md:h-48 lg:h-52 xl:h-56';

  return (
    <Link href={`/producto/${product.id}`} className="block h-full">
      <div className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col overflow-hidden ${customHeight || 'h-full'} hover:-translate-y-1 cursor-pointer`}>
      <div className={`relative ${imageHeight}`}>
        {product.imagen ? (
          <Image
            src={product.imagen || ''}
            alt={product.nombre || 'Producto'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F4F4F4' }}>
            <span className="text-gray-400 text-5xl">📦</span>
          </div>
        )}

        {/* Etiqueta de oferta en esquina - Responsive */}
        {product.oferta && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-sm">
              OFERTA
            </span>
          </div>
        )}
        
        {product.nuevo && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-sm">
              NUEVO
            </span>
          </div>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white px-3 py-1 rounded-lg font-medium text-sm" style={{ backgroundColor: '#D64541' }}>
              Sin Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow justify-between">
        <div className="flex-grow space-y-2">
          <h3 className="text-sm font-semibold line-clamp-2 text-left leading-tight" style={{ color: '#333333' }}>
            {product.nombre || 'Producto sin nombre'}
          </h3>
          {product.sku && (
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          )}

          <div className="space-y-2">
            {/* Precio tachado si hay oferta */}
            {originalPrice && (
              <div className="text-sm line-through text-gray-400">
                {formatPrice(originalPrice)}
              </div>
            )}
            
            {/* Precio final - Más prominente */}
            <div className="text-xl font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </div>
            
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-xs" style={{ color: '#D64541' }}>
                ¡Últimas {product.stock}!
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          {product.stock > 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(e);
              }}
              style={{ padding: '8px 12px', fontSize: '12px', backgroundColor: '#1d4ed8' }}
              className="w-full text-white font-medium rounded-md transition-all duration-300 flex items-center justify-center gap-1 shadow-sm hover:shadow-md hover:bg-blue-800"
            >
              <span>🛒</span>
              <span>Agregar al Carrito</span>
            </button>
          ) : (
            <button
              disabled
              style={{ padding: '8px 12px', fontSize: '12px' }}
              className="w-full rounded-md font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              Sin Stock
            </button>
          )}
        </div>
      </div>
      </div>
    </Link>
  );
}
