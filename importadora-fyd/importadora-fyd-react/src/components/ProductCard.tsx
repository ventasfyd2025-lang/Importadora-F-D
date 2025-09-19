'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { currentUser, loading } = useUserAuth();
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
      product.nombre || product.name || 'Producto',
      product.precio || product.price || 0,
      product.imagen || (product.images && product.images[0]) || ''
    );

    // Show notification
    const notification = document.createElement('div');
    notification.textContent = currentUser ? 'Producto agregado al carrito' : 'Producto agregado al carrito (como invitado)';
    notification.className = 'fixed top-4 right-4 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-all duration-300';
    notification.style.backgroundColor = '#28A745';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Get price and original price
  const currentPrice = product.precio || product.price || 0;
  const originalPrice = product.precioOriginal || product.originalPrice || (product.oferta ? Math.round(currentPrice * 1.3) : null);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group border-2 flex flex-col h-full" 
         style={{ borderColor: '#E0E0E0' }}>
      <Link href={`/producto/${product.id}`}>
        <div className="relative h-72">
          {(product.imagen || (product.images && product.images[0])) ? (
            <Image
              src={product.imagen || (product.images && product.images[0]) || ''}
              alt={product.nombre || product.name || 'Producto'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F4F4F4' }}>
              <span className="text-gray-400 text-5xl">📦</span>
            </div>
          )}

          {/* Etiqueta de oferta en esquina */}
          {product.oferta && (
            <div className="absolute top-3 left-3">
              <span 
                className="text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
                style={{ backgroundColor: '#D64541' }}
              >
                OFERTA
              </span>
            </div>
          )}
          
          {product.nuevo && (
            <div className="absolute top-3 right-3">
              <span className="text-white text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#28A745' }}>
                NUEVO
              </span>
            </div>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: '#D64541' }}>
                Sin Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-grow">
        <Link href={`/producto/${product.id}`}>
          <h3 className="text-xl font-semibold mb-4 line-clamp-2 hover:opacity-80 transition-opacity text-left"
              style={{ color: '#333333' }}>
{product.nombre || product.name || 'Producto sin nombre'}
          </h3>
        </Link>

        <div className="flex-grow">
          {(product.descripcion || product.description) && (
            <p className="text-gray-600 text-lg mb-5 line-clamp-2 text-left">
              {product.descripcion || product.description}
            </p>
          )}

          <div className="mb-5 text-left">
            {/* Precio tachado si hay oferta */}
            {originalPrice && (
              <div className="text-xl line-through font-medium mb-2" style={{ color: '#D64541' }}>
                {formatPrice(originalPrice)}
              </div>
            )}
            
            {/* Precio final */}
            <div className="text-3xl font-bold mb-2" style={{ color: '#28A745' }}>
              {formatPrice(currentPrice)}
            </div>
            
            <div className="text-base text-gray-600">
              IVA incluido
            </div>
            
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-base mt-3" style={{ color: '#D64541' }}>
                ¡Últimas {product.stock} unidades!
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto">
          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className="w-full py-4 px-5 rounded-lg font-bold text-lg text-white transition-all duration-200 flex items-center justify-center gap-3 hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#F16529' }}
            >
              🛒 Agregar al Carrito
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 px-5 rounded-lg font-bold text-lg bg-gray-300 text-gray-500 cursor-not-allowed"
            >
              Sin Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}