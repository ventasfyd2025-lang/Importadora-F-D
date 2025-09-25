'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { MinusIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CartPageClient() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();
  const { currentUser, userProfile, isRegistered } = useUserAuth();


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };


  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <ShoppingBagIcon className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
            Tu carrito está vacío
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            ¡Agrega algunos productos para comenzar tu compra!
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white font-medium text-sm sm:text-base rounded-md hover:bg-blue-700 transition-colors"
          >
            Explorar productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
        Carrito de compras
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Product Image */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                  {item.imagen ? (
                    <Image
                      src={item.imagen}
                      alt={item.nombre}
                      fill
                      className="object-cover rounded-md"
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-lg sm:text-2xl">📦</span>
                    </div>
                  )}
                </div>

                {/* Product Info - Takes full width on mobile */}
                <div className="flex-1 min-w-0 sm:order-none order-1">
                  <Link
                    href={`/producto/${item.productId}`}
                    className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors block"
                  >
                    {item.nombre}
                  </Link>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    {formatPrice(item.precio)} c/u
                  </p>
                </div>

                {/* Mobile controls wrapper */}
                <div className="flex sm:flex-col sm:space-y-2 items-center justify-between w-full sm:w-auto sm:order-none order-2">
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.cantidad - 1)}
                      className="p-1 sm:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <MinusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <span className="px-2 py-1 sm:px-3 sm:py-1 min-w-[40px] sm:min-w-[50px] text-center font-medium text-sm sm:text-base">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.cantidad + 1)}
                      className="p-1 sm:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-lg font-semibold text-gray-900 min-w-[100px] text-right">
                    {formatPrice(item.precio * item.cantidad)}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resumen del pedido
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(getTotalPrice())}</span>
              </div>
              {/* <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium">{formatPrice(10000)}</span>
              </div> */}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors text-center block"
            >
              Finalizar compra
            </Link>

            <button
              onClick={clearCart}
              className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Vaciar carrito
            </button>

            <Link
              href="/"
              className="block w-full mt-3 text-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}