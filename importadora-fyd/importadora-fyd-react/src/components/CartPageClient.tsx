'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export default function CartPageClient() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();


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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-12 border border-orange-100 text-center">
            <ShoppingBag className="h-24 w-24 text-orange-400 mx-auto mb-6" strokeWidth={2} />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              ¡Agrega algunos productos para comenzar tu compra!
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-8 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
              style={{ background: 'linear-gradient(to right, #F16529, #E94E1B)' }}
            >
              🛍️ Explorar productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-orange-100 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F16529' }}>
              <span className="text-white text-lg">🛒</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Carrito de compras
              </h1>
              <p className="text-gray-600 text-sm">{items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all">
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
                  {item.sku && (
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  )}
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
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <span className="px-2 py-1 sm:px-3 sm:py-1 min-w-[40px] sm:min-w-[50px] text-center font-medium text-sm sm:text-base">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.cantidad + 1)}
                      className="p-1 sm:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
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
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-orange-100 sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">💰</span>
              <h2 className="text-xl font-bold text-gray-800">
                Resumen del pedido
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-800">{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="border-t border-orange-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-orange-600">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full mt-6 py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg text-center block"
              style={{ background: 'linear-gradient(to right, #F16529, #E94E1B)' }}
            >
              💳 Finalizar compra
            </Link>

            <button
              onClick={clearCart}
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
            >
              🗑️ Vaciar carrito
            </button>

            <Link
              href="/"
              className="block w-full mt-3 text-center text-orange-600 hover:text-orange-700 font-medium transition-colors py-2"
            >
              ← Seguir comprando
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
