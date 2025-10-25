'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useBankConfig } from '@/hooks/useBankConfig';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { addDoc, collection } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import dynamic from 'next/dynamic';

const MercadoPagoWallet = dynamic(() => import('@/components/MercadoPagoWallet'), {
  ssr: false,
  loading: () => (
    <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="text-gray-600">Cargando MercadoPago...</span>
      </div>
    </div>
  )
});

function CheckoutContent() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice, reserveCartStock, releaseCartStock, stockLoading } = useCart();
  const { currentUser, userProfile, isRegistered } = useUserAuth();
  const { bankConfig, loading: bankLoading } = useBankConfig();
  const { createPreference, redirectToCheckout, loading: mpLoading } = useMercadoPago();
  const { notifyNewOrder } = useEmailNotifications();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'mercadopago'>('transferencia');
  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<'envio' | 'retiro'>('envio');
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    address: ''
  });

  const isGuest = !isRegistered;

  // Verificar si el perfil está completo
  const isProfileComplete = isRegistered && userProfile &&
    userProfile.firstName &&
    userProfile.lastName &&
    userProfile.phone &&
    userProfile.address;

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
    if (!mounted) return;
    if (orderSuccess) return;
    if (isProcessing && paymentMethod === 'mercadopago') return;
    if (mpPreferenceId) return;

    if (items.length === 0) {
      router.push('/carrito');
    }
  }, [mounted, items.length, router, orderSuccess, isProcessing, paymentMethod, mpPreferenceId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Handler para MercadoPago
  const handleMercadoPagoCheckout = async () => {
    // Validar datos del formulario
    if (!checkoutData.name || !checkoutData.email || !checkoutData.phone || !checkoutData.address) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setIsProcessing(true);

    try {
      // Crear orden primero en Firebase
      const orderData = {
        customerName: checkoutData.name,
        customerEmail: checkoutData.email,
        customerPhone: checkoutData.phone,
        customerRut: checkoutData.rut,
        shippingAddress: checkoutData.address,
        deliveryType: deliveryType,
        userId: (currentUser as any)?.uid || checkoutData.email,
        paymentMethod: 'mercadopago',
        items: items.map(item => ({
          productId: item.productId,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          imagen: item.imagen
        })),
        total: getTotalPrice(),
        status: 'pending_payment' as const,
        createdAt: new Date()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // NOTA: El email de confirmación se enviará DESPUÉS de que MercadoPago confirme el pago
      // mediante el webhook en /api/mercadopago/webhook/route.ts
      console.log('✅ Orden creada. Email se enviará después de confirmar el pago.');

      // Crear preferencia de MercadoPago
      const mpItems = items.map(item => ({
        id: item.productId,
        title: item.nombre,
        description: `${item.nombre} - Importadora F&D`,
        quantity: item.cantidad,
        price: item.precio,
        image: item.imagen,
      }));

      const preference = await createPreference({
        items: mpItems,
        userInfo: {
          firstName: checkoutData.name.split(' ')[0] || '',
          lastName: checkoutData.name.split(' ').slice(1).join(' ') || '',
          email: checkoutData.email,
          phone: checkoutData.phone,
          address: {
            street: checkoutData.address,
            postalCode: ''
          }
        },
        orderId: orderRef.id
      });

      if (preference?.preferenceId) {
        // Guardar datos de la orden en localStorage para usuarios invitados
        if (typeof window !== 'undefined') {
          localStorage.setItem(`order_${orderRef.id}`, JSON.stringify({
            orderId: orderRef.id,
            paymentMethod: 'mercadopago',
            customerName: checkoutData.name,
            customerEmail: checkoutData.email,
            total: getTotalPrice(),
            items: items.map(item => ({
              productId: item.productId,
              nombre: item.nombre,
              precio: item.precio,
              cantidad: item.cantidad,
              imagen: item.imagen
            })),
            status: 'pending_payment'
          }));
        }

        setMpPreferenceId(preference.preferenceId);

        // Redirigir inmediatamente al checkout de MercadoPago (fallback para asegurar flujo)
        if (preference.initPoint) {
          redirectToCheckout(preference.initPoint);
        } else if (preference.sandboxInitPoint) {
          redirectToCheckout(preference.sandboxInitPoint);
        }
      } else {
        throw new Error('No se pudo crear la preferencia de pago');
      }

    } catch (error) {
      console.error('Error creando preferencia MP:', error);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
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
      rut: (formData.get('rut') as string) || checkoutData.rut,
      address: (formData.get('address') as string) || checkoutData.address
    };

    // Validar que todos los campos requeridos estén completos
    if (!finalData.name || !finalData.email || !finalData.phone || !finalData.address) {
      alert('Por favor completa todos los campos requeridos (Nombre, Email, Teléfono y Dirección).');
      setIsProcessing(false);
      return;
    }

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
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError) {
          console.error('❌ Error iniciando sesión anónima antes de la transferencia:', authError);
          alert('No pudimos preparar la subida del comprobante. Intenta nuevamente.');
          setIsProcessing(false);
          return;
        }
      }

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
        alert(`Error: ${(stockError as any)?.message || 'Error desconocido'}`);
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
        customerRut: finalData.rut,
        shippingAddress: finalData.address,
        deliveryType: deliveryType,
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

      // Enviar notificación por email
      console.log('📧 Enviando notificación por email...');
      console.log('📧 Email data to send:', {
        orderId: orderRef.id,
        customerName: finalData.name,
        customerEmail: finalData.email,
        customerPhone: finalData.phone
      });
      notifyNewOrder({
        orderId: orderRef.id,
        customerName: finalData.name,
        customerEmail: finalData.email,
        customerPhone: finalData.phone,
        total: getTotalPrice(),
        paymentMethod: 'transferencia',
        items: items.map(item => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio
        })),
        shippingAddress: {
          street: finalData.address
        }
      }).catch(err => console.error('Error enviando email:', err));

      // Mensaje actualizado para transferencia
      const paymentMessage = '\n\n💰 Método de pago: Transferencia Bancaria\n✅ Comprobante recibido exitosamente.\n🔍 Verificaremos tu pago y te confirmaremos por email.\n📧 Recibirás un email con tu número de orden.\n📦 Envíanos los datos de envío o día de retiro para coordinar la entrega.';

      // Crear mensaje de chat solo si el usuario está autenticado
      if (isRegistered && (currentUser as any)?.uid) {
        console.log('💬 Creando mensaje de chat...');
        try {
          await addDoc(collection(db, 'chat_messages'), {
            orderId: orderRef.id,
            userId: (currentUser as any).uid,
            userEmail: finalData.email,
            userName: 'Sistema FyD',
            message: `¡Hola ${finalData.name}! 👋\n\nTu pedido #${orderRef.id.slice(-8).toUpperCase()} ha sido recibido exitosamente.${paymentMessage}\n\n📋 Puedes hacer seguimiento del estado en "Mis Pedidos".\n💬 Si tienes alguna pregunta, no dudes en escribirnos aquí.\n\n¡Gracias por elegir FyD!`,
            isAdmin: true,
            timestamp: new Date(),
            read: false
          });
          console.log('✅ Mensaje de chat creado');
        } catch (chatError) {
          console.error('⚠️ Error creando mensaje de chat (no crítico):', chatError);
          // Continuar con el proceso aunque falle el chat
        }
      } else {
        console.log('ℹ️ Usuario invitado - mensaje de chat omitido');
      }

      // Guardar datos de la orden en localStorage para usuarios invitados
      if (typeof window !== 'undefined') {
        localStorage.setItem(`order_${orderRef.id}`, JSON.stringify({
          orderId: orderRef.id,
          paymentMethod: 'transferencia',
          customerName: finalData.name,
          customerEmail: finalData.email,
          total: getTotalPrice(),
          items: items.map(item => ({
            productId: item.productId,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            imagen: item.imagen
          })),
          status: 'pending_verification'
        }));
      }

      // Redirigir a página de éxito completa
      const successUrl = new URLSearchParams({
        orderId: orderRef.id,
        paymentMethod: 'transferencia',
        customerName: finalData.name,
        customerEmail: finalData.email,
        total: getTotalPrice().toString()
      });

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
      console.error('❌ Detalles del error:', (error as any)?.message, (error as any)?.stack);

      // Si hubo un error después de reservar stock, intentar liberarlo
      try {
        console.log('🔄 Intentando liberar stock reservado...');
        await releaseCartStock();
        console.log('✅ Stock liberado exitosamente');
      } catch (releaseError) {
        console.error('❌ Error liberando stock:', releaseError);
      }

      alert(`Error al procesar el pedido: ${(error as any)?.message || 'Error desconocido'}. El stock ha sido liberado. Inténtalo de nuevo.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading spinner until mounted to prevent hydration mismatch
  // Show processing screen while order is being processed
  if (!mounted || (items.length === 0 && !orderSuccess)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show success screen if order was completed
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-12 border border-green-200 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Pedido Exitoso!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Tu pedido <span className="font-bold text-green-600">#{successOrderId.slice(-8).toUpperCase()}</span> ha sido recibido correctamente.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Hemos recibido tu comprobante de transferencia y te contactaremos pronto para confirmar el pago.
            </p>
            <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 font-medium">
                Redirigiendo a la página de confirmación en 3 segundos...
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                <div className="bg-green-600 h-2 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/carrito"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 font-medium transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver al carrito
          </Link>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F16529' }}>
                <span className="text-white text-lg">💳</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Finalizar compra
                </h1>
                <p className="text-gray-600 text-sm">
                  Completa los datos para procesar tu pedido
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-orange-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  📝 Datos de entrega
                </h2>
              </div>

                <form onSubmit={handleCheckout} className="p-6 space-y-6">
                  {isGuest && (
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-lg p-4 mb-4 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-lg">👤</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-orange-900 mb-1">
                            Comprando como invitado
                          </h3>
                          <p className="text-sm text-orange-700 leading-relaxed">
                            Completa los datos para procesar tu pedido. Si deseas crear una cuenta, puedes hacerlo después de la compra.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isRegistered && !isProfileComplete && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                      <div className="flex">
                        <div className="text-yellow-500 mr-2">⚠️</div>
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Completa tus datos</p>
                          <p className="text-xs text-yellow-600">
                            Por favor completa todos los campos requeridos para procesar tu pedido.
                            Puedes guardar estos datos en tu perfil para futuras compras.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isRegistered && isProfileComplete && (
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

                  {/* Tipo de entrega */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de entrega *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('envio')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          deliveryType === 'envio'
                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                            : 'border-gray-300 bg-white hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">🚚</span>
                          {deliveryType === 'envio' && (
                            <span className="text-orange-600 font-bold">✓</span>
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 text-left">Envío a domicilio</div>
                        <div className="text-sm text-gray-600 text-left mt-1">Recibe tu pedido en casa</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('retiro')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          deliveryType === 'retiro'
                            ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                            : 'border-gray-300 bg-white hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">🏪</span>
                          {deliveryType === 'retiro' && (
                            <span className="text-green-600 font-bold">✓</span>
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 text-left">Retiro en tienda</div>
                        <div className="text-sm text-gray-600 text-left mt-1">Retira gratis en nuestra tienda</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      {deliveryType === 'envio' ? 'Dirección de envío *' : 'Notas adicionales (opcional)'}
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      required={deliveryType === 'envio'}
                      rows={3}
                      value={checkoutData.address}
                      onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={deliveryType === 'envio'
                        ? (isRegistered ? "Dirección desde perfil" : "Calle, número, comuna, región")
                        : "Ej: Prefiero retirar en la mañana, horario laboral, etc."
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Método de pago
                    </label>

                    {/* Selector de método de pago */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* MercadoPago */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mercadopago')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          paymentMethod === 'mercadopago'
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-300 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">💳</span>
                          {paymentMethod === 'mercadopago' && (
                            <span className="text-blue-600 font-bold">✓</span>
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 text-left">MercadoPago</div>
                        <div className="text-sm text-gray-600 text-left mt-1">Pago online con tarjeta</div>
                      </button>

                      {/* Transferencia */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('transferencia')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          paymentMethod === 'transferencia'
                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                            : 'border-gray-300 bg-white hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">🏦</span>
                          {paymentMethod === 'transferencia' && (
                            <span className="text-orange-600 font-bold">✓</span>
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 text-left">Transferencia</div>
                        <div className="text-sm text-gray-600 text-left mt-1">Transferencia bancaria</div>
                      </button>
                    </div>

                    {/* Sección de MercadoPago */}
                    {paymentMethod === 'mercadopago' && (
                      <div className="p-4 border border-blue-300 bg-blue-50 rounded-lg">
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-3">💳</span>
                          <div>
                            <div className="font-medium text-gray-900">Pago con MercadoPago</div>
                            <div className="text-sm text-gray-600">Paga con tarjeta de crédito, débito o efectivo</div>
                          </div>
                        </div>

                        {!mpPreferenceId ? (
                          <button
                            type="button"
                            onClick={handleMercadoPagoCheckout}
                            disabled={isProcessing || mpLoading}
                            className="w-full py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing || mpLoading ? 'Procesando...' : 'Continuar con MercadoPago'}
                          </button>
                        ) : (
                          <div className="mt-4">
                            <MercadoPagoWallet
                              preferenceId={mpPreferenceId}
                              onSuccess={() => {
                                clearCart();
                                setOrderSuccess(true);
                              }}
                              onError={(error) => {
                                console.error('Error en pago MP:', error);
                                alert('Error en el pago. Por favor intenta nuevamente.');
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sección de Transferencia */}
                    {paymentMethod === 'transferencia' && (
                      <div className="p-4 border border-orange-300 bg-orange-50 rounded-lg">
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
                    )}
                  </div>

                  {/* Botones de acción solo para transferencia */}
                  {paymentMethod === 'transferencia' && (
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
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-orange-100 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  📦 Resumen del pedido
                </h2>
              </div>

              <div className="p-6">
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
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
                <div className="border-t border-orange-100 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-semibold text-gray-800">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-orange-600">{formatPrice(getTotalPrice())}</span>
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
