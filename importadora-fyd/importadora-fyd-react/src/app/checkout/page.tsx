'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useBankConfig } from '@/hooks/useBankConfig';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

function CheckoutContent() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice, reserveCartStock, releaseCartStock, stockLoading } = useCart();
  const { currentUser, userProfile, isRegistered } = useUserAuth();
  const { bankConfig, loading: bankLoading } = useBankConfig();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    address: ''
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (mounted && items.length === 0) {
      router.push('/carrito');
    }
  }, [mounted, items, router]);

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

    // Obtener archivo del comprobante
    const comprobanteFile = formData.get('comprobante') as File;
    if (!comprobanteFile || comprobanteFile.size === 0) {
      alert('Por favor sube el comprobante de transferencia.');
      setIsProcessing(false);
      return;
    }

    // Validar tamaño del archivo (5MB máx)
    if (comprobanteFile.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 5MB.');
      setIsProcessing(false);
      return;
    }

    try {
      console.log('🔄 Iniciando proceso de transferencia...');
      console.log('📁 Archivo del comprobante:', comprobanteFile.name, comprobanteFile.size, 'bytes');

      // Crear ID temporal para la orden
      const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // PASO 1: Reservar stock antes de continuar
      console.log('📦 Reservando stock para los productos...');
      try {
        await reserveCartStock(tempOrderId);
        console.log('✅ Stock reservado exitosamente');
      } catch (stockError) {
        console.error('❌ Error reservando stock:', stockError);
        alert(`Error: ${stockError.message}`);
        setIsProcessing(false);
        return;
      }

      // PASO 2: Subir comprobante a Firebase Storage
      const timestamp = Date.now();
      const fileName = `comprobantes/${timestamp}_${comprobanteFile.name}`;
      const storageRef = ref(storage, fileName);

      console.log('☁️ Subiendo comprobante a Storage...');
      await uploadBytes(storageRef, comprobanteFile);
      const comprobanteUrl = await getDownloadURL(storageRef);
      console.log('✅ Comprobante subido exitosamente:', comprobanteUrl);

      // PASO 3: Crear orden en Firebase CON el comprobante
      const orderData = {
        customerName: finalData.name,
        customerEmail: finalData.email,
        customerPhone: finalData.phone,
        shippingAddress: finalData.address,
        userId: (currentUser as any)?.uid || finalData.email,
        paymentMethod: 'transferencia',
        paymentProof: comprobanteUrl, // URL del comprobante
        items: items.map(item => ({
          productId: item.productId,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          imagen: item.imagen
        })),
        total: getTotalPrice(),
        status: 'pending_verification' as const, // Estado: esperando verificación de pago
        stockReservedId: tempOrderId, // ID usado para reservar stock
        createdAt: new Date()
      };

      console.log('📝 Creando orden en Firestore...');
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('✅ Orden creada exitosamente:', orderRef.id);

      // Mensaje actualizado para transferencia
      const paymentMessage = '\n\n💰 Método de pago: Transferencia Bancaria\n✅ Comprobante recibido exitosamente.\n🔍 Verificaremos tu pago y confirmaremos tu pedido pronto.';

      console.log('💬 Creando mensaje de chat...');
      await addDoc(collection(db, 'chat_messages'), {
        orderId: orderRef.id,
        userId: (currentUser as any)?.uid || finalData.email,
        userEmail: finalData.email,
        userName: 'Sistema FyD',
        message: `¡Hola ${finalData.name}! 👋\n\nTu pedido #${orderRef.id.slice(-8).toUpperCase()} ha sido recibido exitosamente.${paymentMessage}\n\n📋 Puedes hacer seguimiento del estado en "Mis Pedidos".\n💬 Si tienes alguna pregunta, no dudes en escribirnos aquí.\n\n¡Gracias por elegir FyD!`,
        isAdmin: true,
        timestamp: new Date(),
        read: false
      });
      console.log('✅ Mensaje de chat creado');

      // Redirigir a página de éxito completa
      const successUrl = new URLSearchParams({
        orderId: orderRef.id,
        paymentMethod: 'transferencia',
        customerName: finalData.name,
        customerEmail: finalData.email,
        total: getTotalPrice().toString()
      });

      console.log('🛒 Limpiando carrito...');
      clearCart();

      // Mostrar estado de éxito en el mismo componente
      setSuccessOrderId(orderRef.id);
      setOrderSuccess(true);

      const successPath = `/checkout/success?${successUrl.toString()}`;
      console.log('🎉 Redirigiendo a página de éxito:', successPath);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        window.location.href = successPath;
      }, 3000);

    } catch (error) {
      console.error('❌ Error procesando pedido:', error);
      console.error('❌ Detalles del error:', error.message, error.stack);

      // Si hubo un error después de reservar stock, intentar liberarlo
      try {
        console.log('🔄 Intentando liberar stock reservado...');
        await releaseCartStock();
        console.log('✅ Stock liberado exitosamente');
      } catch (releaseError) {
        console.error('❌ Error liberando stock:', releaseError);
      }

      alert(`Error al procesar el pedido: ${error.message}. El stock ha sido liberado. Inténtalo de nuevo.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading spinner until mounted to prevent hydration mismatch
  if (!mounted || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show success screen if order was completed
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-4">¡Pedido Exitoso!</h1>
          <p className="text-lg text-gray-600 mb-4">
            Tu pedido #{successOrderId.slice(-8).toUpperCase()} ha sido recibido correctamente.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Hemos recibido tu comprobante de transferencia y te contactaremos pronto para confirmar el pago.
          </p>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              Redirigiendo a la página de confirmación en 3 segundos...
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
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
                      <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">🏦</span>
                        <div>
                          <div className="font-medium text-gray-900">Transferencia Bancaria</div>
                          <div className="text-sm text-gray-600">Transfiere el monto total y sube el comprobante</div>
                        </div>
                      </div>

                      {/* Datos bancarios */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">📋 Datos para transferencia:</h4>
                        {bankLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                            <span className="ml-2 text-gray-600">Cargando datos bancarios...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Banco:</span>
                              <span className="ml-2">{bankConfig.bankName}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Tipo de cuenta:</span>
                              <span className="ml-2">{bankConfig.accountType}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Número de cuenta:</span>
                              <span className="ml-2">{bankConfig.accountNumber}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">RUT:</span>
                              <span className="ml-2">{bankConfig.rut}</span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">Titular:</span>
                              <span className="ml-2">{bankConfig.holderName}</span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">Email para confirmación:</span>
                              <span className="ml-2">{bankConfig.email}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Upload comprobante */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">📎 Sube tu comprobante de transferencia:</h4>
                        <input
                          type="file"
                          id="comprobante"
                          name="comprobante"
                          accept="image/*,.pdf"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                          Formatos aceptados: JPG, PNG, PDF (máx. 5MB)
                        </p>
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
                        disabled={isProcessing || stockLoading}
                        className="flex-1 py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Procesando...' : stockLoading ? 'Verificando stock...' : 'Confirmar pedido'}
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