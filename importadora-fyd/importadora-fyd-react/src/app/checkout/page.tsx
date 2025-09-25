'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function CheckoutContent() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice } = useCart();
  const { currentUser, userProfile, isRegistered } = useUserAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    address: ''
  });

  // Auto-populate user data when logged in
  useEffect(() => {
    if (isRegistered && userProfile) {
      setCheckoutData({
        name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        email: userProfile.email || currentUser?.email || '',
        phone: userProfile.phone || '',
        rut: userProfile.rut || '',
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
        rut: '',
        address: ''
      });
    }
  }, [isRegistered, userProfile, currentUser]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/carrito');
    }
  }, [items, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);

    const formData = new FormData(e.currentTarget);
    const finalData = {
      name: (formData.get('name') as string) || checkoutData.name,
      email: (formData.get('email') as string) || checkoutData.email,
      phone: (formData.get('phone') as string) || checkoutData.phone,
      rut: (formData.get('rut') as string) || checkoutData.rut,
      address: (formData.get('address') as string) || checkoutData.address
    };

    try {
      // Crear orden en Firebase primero
      const orderData = {
        customerName: finalData.name,
        customerEmail: finalData.email,
        customerPhone: finalData.phone,
        shippingAddress: finalData.address,
        userId: currentUser?.uid || finalData.email,
        paymentMethod: 'transferencia',
        items: items.map(item => ({
          productId: item.productId,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          imagen: item.imagen
        })),
        total: getTotalPrice(),
        status: 'pending' as const,
        createdAt: new Date()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Método transferencia bancaria
      const paymentMessage = '\n\n💰 Método de pago: Transferencia Bancaria\n📱 Te enviaremos los datos bancarios por WhatsApp para completar el pago.';

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

      // Redirigir a página de éxito completa
      const successUrl = new URLSearchParams({
        orderId: orderRef.id,
        paymentMethod: 'transferencia',
        customerName: finalData.name,
        customerEmail: finalData.email,
        total: getTotalPrice().toString()
      });

      clearCart();
      router.push(`/checkout/success?${successUrl.toString()}`);

    } catch (error) {
      console.error('Error procesando pedido:', error);
      alert('Error al procesar el pedido. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/carrito"
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver al carrito
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Finalizar compra
        </h1>
        <p className="text-lg text-gray-600">
          Completa los datos para procesar tu pedido
        </p>
      </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">
                    Datos de entrega
                  </h2>
                </div>

                <form onSubmit={handleCheckout} className="p-6 space-y-6">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={checkoutData.name}
                        onChange={(e) => setCheckoutData({...checkoutData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={isRegistered ? "Datos cargados automáticamente" : "Ingresa tu nombre completo"}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={checkoutData.email}
                        onChange={(e) => setCheckoutData({...checkoutData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={isRegistered ? "Email cargado automáticamente" : "tu@email.com"}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={checkoutData.phone}
                        onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={isRegistered ? "Teléfono desde perfil" : "+56 9 XXXX XXXX"}
                      />
                    </div>

                    <div>
                      <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
                        RUT {!isRegistered && '*'}
                      </label>
                      <input
                        type="text"
                        id="rut"
                        name="rut"
                        required={!isRegistered}
                        value={checkoutData.rut}
                        onChange={(e) => setCheckoutData({...checkoutData, rut: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={isRegistered ? "RUT desde perfil" : "12.345.678-9"}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección de envío *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      required
                      rows={3}
                      value={checkoutData.address}
                      onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={isRegistered ? "Dirección desde perfil" : "Calle, número, comuna, región"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Método de pago
                    </label>
                    <div className="p-4 border border-blue-300 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🏦</span>
                        <div>
                          <div className="font-medium text-gray-900">Transferencia Bancaria</div>
                          <div className="text-sm text-gray-600">Te contactaremos por WhatsApp con los datos bancarios para completar el pago</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href="/carrito"
                        className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
                      >
                        Volver al carrito
                      </Link>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-1 py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Procesando...' : 'Confirmar pedido'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-8">
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">
                    Resumen del pedido
                  </h2>
                </div>

                <div className="p-6">
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="w-full h-full object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-gray-400 text-lg">📦</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.nombre}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Cantidad: {item.cantidad}
                          </p>
                        </div>

                        <div className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.precio * item.cantidad)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span>{formatPrice(getTotalPrice())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </Layout>
  );
}