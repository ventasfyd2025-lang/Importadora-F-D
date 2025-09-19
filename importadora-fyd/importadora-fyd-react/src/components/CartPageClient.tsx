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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('transferencia');

  // Auto-populate user data when logged in
  useEffect(() => {
    if (isRegistered && userProfile) {
      setCheckoutData({
        name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        email: userProfile.email || currentUser?.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address ? 
          `${userProfile.address.street || ''}, ${userProfile.address.city || ''}, ${userProfile.address.region || ''} ${userProfile.address.postalCode || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') 
          : ''
      });
    } else if (currentUser) {
      // Guest user with minimal data
      setCheckoutData({
        name: '',
        email: currentUser.email || '',
        phone: '',
        address: ''
      });
    }
  }, [isRegistered, userProfile, currentUser]);

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

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);

    const formData = new FormData(e.currentTarget);
    const finalData = {
      name: (formData.get('name') as string) || checkoutData.name,
      email: (formData.get('email') as string) || checkoutData.email,
      phone: (formData.get('phone') as string) || checkoutData.phone,
      address: (formData.get('address') as string) || checkoutData.address
    };

    const orderData = {
      customerName: finalData.name,
      customerEmail: finalData.email,
      customerPhone: finalData.phone,
      shippingAddress: finalData.address,
      userId: currentUser?.uid || finalData.email, // For linking with chat
      paymentMethod: paymentMethod,
      items: items.map(item => ({
        productId: item.productId,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        imagen: item.imagen
      })),
      total: getTotalPrice() + 10000, // Adding shipping cost
      status: 'pending' as const,
      createdAt: new Date()
    };

    try {
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Crear mensaje de bienvenida automático
      const paymentMessage = paymentMethod === 'transferencia' 
        ? '\n\n💰 Método de pago: Transferencia Bancaria\n📱 Te enviaremos los datos bancarios por WhatsApp para completar el pago.'
        : '\n\n💰 Método de pago: MercadoPago\n💳 Te contactaremos para procesar el pago con tarjeta.';
      
      await addDoc(collection(db, 'chat_messages'), {
        orderId: orderRef.id,
        userId: currentUser?.uid || finalData.email,
        userEmail: finalData.email,
        userName: 'Sistema FyD',
        message: `¡Hola ${finalData.name}! 👋\n\nTu pedido #${orderRef.id.slice(-8).toUpperCase()} ha sido recibido exitosamente.${paymentMessage}\n\n✅ Revisaremos tu pedido y te confirmaremos todos los detalles pronto.\n💬 Si tienes alguna pregunta, no dudes en escribirnos aquí.\n📦 Te mantendremos informado sobre el estado de tu pedido.\n\n¡Gracias por elegir FyD!`,
        isAdmin: true,
        timestamp: new Date(),
        read: false
      });
      
      clearCart();
      setOrderCompleted(true);
      setIsCheckoutOpen(false);
    } catch (error) {
      alert('Error al procesar el pedido. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Pedido realizado con éxito!
          </h1>
          <p className="text-gray-600 mb-8">
            Hemos recibido tu pedido y te contactaremos pronto para confirmar los detalles.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <ShoppingBagIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-600 mb-8">
            ¡Agrega algunos productos para comenzar tu compra!
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Explorar productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Carrito de compras
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4">
                {/* Product Image */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  {item.imagen ? (
                    <Image
                      src={item.imagen}
                      alt={item.nombre}
                      fill
                      className="object-cover rounded-md"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">📦</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/producto/${item.productId}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {item.nombre}
                  </Link>
                  <p className="text-gray-600 mt-1">
                    {formatPrice(item.precio)} c/u
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.cantidad - 1)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 min-w-[50px] text-center font-medium">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.cantidad + 1)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
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
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium">{formatPrice(10000)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(getTotalPrice() + 10000)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors"
            >
              Finalizar compra
            </button>

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

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCheckoutOpen(false)}
          />
          <div 
            className="relative bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Finalizar compra
                </h3>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                {isRegistered && userProfile && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <div className="text-green-400 mr-2">✅</div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Datos cargados automáticamente</p>
                        <p className="text-xs text-green-600">Tus datos de perfil se han cargado automáticamente. Puedes modificarlos si es necesario.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={checkoutData.name}
                    onChange={(e) => setCheckoutData({...checkoutData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isRegistered ? "Datos cargados automáticamente" : "Ingresa tu nombre completo"}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={checkoutData.email}
                    onChange={(e) => setCheckoutData({...checkoutData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isRegistered ? "Email cargado automáticamente" : "tu@email.com"}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={checkoutData.phone}
                    onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isRegistered ? "Teléfono desde perfil" : "+56 9 XXXX XXXX"}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de envío *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    rows={3}
                    value={checkoutData.address}
                    onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={isRegistered ? "Dirección desde perfil" : "Calle, número, comuna, región"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Método de pago *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transferencia"
                        checked={paymentMethod === 'transferencia'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🏦</span>
                        <div>
                          <div className="font-medium text-gray-900">Transferencia Bancaria</div>
                          <div className="text-sm text-gray-500">Te enviaremos los datos bancarios por WhatsApp</div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mercadopago"
                        checked={paymentMethod === 'mercadopago'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">💳</span>
                        <div>
                          <div className="font-medium text-gray-900">MercadoPago</div>
                          <div className="text-sm text-gray-500">Paga con tarjeta de crédito/débito</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span>Total a pagar:</span>
                    <span>{formatPrice(getTotalPrice() + 10000)}</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Procesando...' : 'Confirmar pedido'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}