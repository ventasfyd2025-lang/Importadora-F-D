'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, Banknote } from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useCart } from '@/context/CartContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface OrderItem {
  productId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface OrderInfo {
  orderId: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentId?: string;
  status?: string;
  items?: OrderItem[];
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unreadOrderNotifications = useOrderNotifications();
  const { clearCart } = useCart();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentMethod = searchParams.get('paymentMethod') || 'transferencia';
  const customerName = searchParams.get('customerName') || '';
  const customerEmail = searchParams.get('customerEmail') || '';
  const total = searchParams.get('total') || '0';
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!orderId) return;

      // Solo intentar leer desde Firebase si el usuario está autenticado
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          // Obtener detalles completos de la orden desde Firebase
          const orderDoc = await getDoc(doc(db, 'orders', orderId));

          if (orderDoc.exists()) {
            const orderData = orderDoc.data();
            console.log('📦 Datos de la orden:', orderData);
            console.log('🛍️ Items de la orden:', orderData.items);

            // Calcular total desde items si el total guardado es 0
            const savedTotal = orderData.total || 0;
            const calculatedTotal = orderData.items?.reduce((sum: number, item: any) =>
              sum + (item.precio * item.cantidad), 0) || 0;
            const finalTotal = savedTotal > 0 ? savedTotal : (calculatedTotal > 0 ? calculatedTotal : parseInt(total));

            console.log('💰 Total guardado:', savedTotal);
            console.log('💰 Total calculado desde items:', calculatedTotal);
            console.log('💰 Total final:', finalTotal);

            setOrderInfo({
              orderId,
              paymentMethod: orderData.paymentMethod || paymentMethod,
              customerName: orderData.customerName || customerName,
              customerEmail: orderData.customerEmail || customerEmail,
              total: finalTotal,
              paymentId: paymentId || undefined,
              status: status || orderData.status,
              items: orderData.items || []
            });
            return;
          }
        } catch (error) {
          console.error('❌ Error cargando detalles de orden:', error);
        }
      } else {
        console.log('ℹ️ Usuario invitado - intentando recuperar datos de localStorage');

        // Intentar recuperar datos de localStorage para usuarios invitados
        if (typeof window !== 'undefined') {
          const savedOrder = localStorage.getItem(`order_${orderId}`);
          if (savedOrder) {
            try {
              const orderData = JSON.parse(savedOrder);
              console.log('✅ Datos de orden recuperados de localStorage:', orderData);

              setOrderInfo({
                orderId: orderData.orderId,
                paymentMethod: orderData.paymentMethod,
                customerName: orderData.customerName,
                customerEmail: orderData.customerEmail,
                total: orderData.total,
                paymentId: paymentId || undefined,
                status: orderData.status,
                items: orderData.items || []
              });

              // Limpiar localStorage después de recuperar los datos
              localStorage.removeItem(`order_${orderId}`);
              return;
            } catch (parseError) {
              console.error('❌ Error parseando datos de localStorage:', parseError);
            }
          }
        }
      }

      // Usar datos de URL como último recurso
      console.log('⚠️ Usando datos de URL como fallback');
      setOrderInfo({
        orderId,
        paymentMethod,
        customerName,
        customerEmail,
        total: parseInt(total),
        paymentId: paymentId || undefined,
        status: status || undefined,
        items: []
      });
    };

    loadOrderDetails();

    // Limpiar carrito después de un pedido exitoso
    if (typeof window !== 'undefined') {
      console.log('🛒 Limpiando carrito en página de éxito...');
      localStorage.removeItem('cart');
      clearCart(); // Limpiar también el contexto del carrito
    }
  }, [orderId, paymentMethod, customerName, customerEmail, total, paymentId, status, clearCart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              {orderInfo?.paymentMethod === 'transferencia' ? (
                <Clock className="w-8 h-8 text-orange-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {orderInfo?.paymentMethod === 'transferencia' ?
                '¡Pedido Recibido!' :
                '¡Pago Exitoso!'}
            </h1>
            <p className="text-lg text-gray-600">
              {orderInfo?.paymentMethod === 'transferencia' ?
                'Hemos recibido tu pedido y te contactaremos pronto' :
                'Tu pedido ha sido procesado correctamente'}
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                Detalles del Pedido
              </h2>
            </div>

            <div className="px-6 py-6 space-y-4">
              {orderInfo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Número de Orden</span>
                        <p className="text-lg font-semibold text-gray-900">
                          #{orderInfo.orderId.slice(-8).toUpperCase()}
                        </p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500">Cliente</span>
                        <p className="text-base text-gray-900">{orderInfo.customerName}</p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500">Email</span>
                        <p className="text-base text-gray-900">{orderInfo.customerEmail}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Método de Pago</span>
                        <div className="flex items-center mt-1">
                          {orderInfo.paymentMethod === 'transferencia' ? (
                            <>
                              <Banknote className="w-5 h-5 text-blue-600 mr-2" />
                              <span className="text-base text-gray-900">Transferencia Bancaria</span>
                            </>
                          ) : (
                            <>
                              <span className="text-base text-gray-900">💳 MercadoPago</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500">Total</span>
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(orderInfo.total)}
                        </p>
                      </div>

                      {orderInfo.paymentId && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">ID de Pago</span>
                          <p className="text-base text-gray-900">{orderInfo.paymentId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Products List */}
                  {orderInfo.items && orderInfo.items.length > 0 ? (
                    <div className="mt-6 border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos comprados</h3>
                      <div className="space-y-3">
                        {orderInfo.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            {item.imagen && (
                              <div className="flex-shrink-0 w-16 h-16 bg-white rounded-md overflow-hidden border border-gray-200">
                                <img
                                  src={item.imagen}
                                  alt={item.nombre}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.nombre}
                              </p>
                              <p className="text-sm text-gray-500">
                                Cantidad: {item.cantidad} × {formatPrice(item.precio)}
                              </p>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatPrice(item.precio * item.cantidad)}
                            </div>
                          </div>
                        ))}

                        {/* Total */}
                        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                          <span className="text-lg font-bold text-gray-900">Total</span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatPrice(orderInfo.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 border-t pt-6">
                      <p className="text-sm text-gray-500 italic">
                        Los detalles de productos se pueden ver en la sección "Mis Pedidos"
                      </p>
                    </div>
                  )}

                  {/* Payment specific info */}
                  {orderInfo.paymentMethod === 'transferencia' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-blue-800 mb-2">
                            Próximos pasos
                          </h3>
                          <ul className="text-sm text-blue-700 space-y-2">
                            <li>• Recibirás un email de confirmación con tu número de orden</li>
                            <li>• Envíanos la confirmación con los datos de envío o día de retiro</li>
                            <li>• Verificaremos tu pago y procesaremos tu pedido</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-green-800 mb-2">
                            Pago confirmado
                          </h3>
                          <p className="text-sm text-green-700">
                            Tu pago ha sido procesado exitosamente. Comenzaremos a preparar tu pedido de inmediato.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/mis-pedidos"
                className="flex items-center justify-center py-3 px-6 border border-transparent rounded-lg text-base font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg relative"
              >
                📦 Ver Mis Pedidos
                {unreadOrderNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {unreadOrderNotifications > 9 ? '9+' : unreadOrderNotifications}
                  </span>
                )}
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center py-3 px-6 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg"
              >
                🛍️ Continuar Comprando
              </Link>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                ¿Necesitas ayuda? {' '}
                <Link href="/contacto" className="text-orange-600 hover:text-orange-700 font-medium">
                  Contáctanos
                </Link>
              </p>
            </div>
          </div>

          {/* Additional info */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-sm text-gray-600">
                📧 Recibirás un email de confirmación en breve
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}