'use client';

import React, { memo } from 'react';
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

const ProductCard = memo(function ProductCard({ product, customHeight, isSpecial = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { currentUser, loading } = useUserAuth();
  const { addNotification } = useNotification();
  const router = useRouter();

  // Verificar si las etiquetas están activas basadas en duración
  const isEtiquetaActiva = (timestamp: string | undefined, duracionHoras: number | undefined): boolean => {
    if (!timestamp || !duracionHoras) return false;

    const inicio = new Date(timestamp);
    const ahora = new Date();
    const horasTranscurridas = (ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60);

    return horasTranscurridas < duracionHoras;
  };

  const mostrarNuevo = product.nuevo && isEtiquetaActiva(
    product.nuevoDesde,
    product.nuevoDuracionHoras
  );

  const mostrarOferta = product.oferta && isEtiquetaActiva(
    product.ofertaDesde,
    product.ofertaDuracionHoras
  );

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
      <div className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 group border border-gray-200 flex flex-col ${customHeight || 'h-full'} hover:border-orange-400 cursor-pointer relative`}>

      {/* Badges flotantes */}
      {mostrarOferta && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
            OFERTA
          </span>
        </div>
      )}
      {mostrarNuevo && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
            NUEVO
          </span>
        </div>
      )}

      {/* Contenedor de imagen */}
      <div className="relative w-full aspect-square bg-white overflow-hidden p-4">
        {product.imagen ? (
          <div className="relative w-full h-full">
            <Image
              src={product.imagen || ''}
              alt={product.nombre || 'Producto'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-gray-300 text-5xl">📦</span>
          </div>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-red-600 text-white px-4 py-2 rounded font-semibold text-sm">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="p-2 flex flex-col flex-grow">
        {/* Título */}
        <h3 className="text-xs text-gray-700 line-clamp-2 mb-1.5 min-h-[2rem] leading-tight">
          {product.nombre || 'Producto sin nombre'}
        </h3>

        {/* Precio */}
        <div className="mt-auto">
          {originalPrice && (
            <div className="text-[10px] text-gray-400 line-through mb-1">
              {formatPrice(originalPrice)}
            </div>
          )}
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </span>
            {originalPrice && (
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Stock bajo */}
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-[10px] text-orange-600 font-medium mb-1.5">
              Quedan {product.stock} disponibles
            </p>
          )}

          {/* Botón de agregar */}
          {product.stock > 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(e);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 px-3 rounded-xl transition-all duration-300 text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 group"
            >
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Agregar</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-200 text-gray-500 font-semibold py-2.5 px-3 rounded-xl cursor-not-allowed text-sm flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Agotado</span>
            </button>
          )}
        </div>
      </div>
      </div>
    </Link>
  );
});

export default ProductCard;
