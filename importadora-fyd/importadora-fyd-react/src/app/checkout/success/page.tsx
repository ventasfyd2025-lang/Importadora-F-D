'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface OrderInfo {
  orderId: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentId?: string;
  status?: string;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentMethod = searchParams.get('paymentMethod') || 'transferencia';
  const customerName = searchParams.get('customerName') || '';
  const customerEmail = searchParams.get('customerEmail') || '';
  const total = searchParams.get('total') || '0';
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    // Obtener información del pedido
    if (orderId) {
      setOrderInfo({
        orderId,
        paymentMethod,
        customerName,
        customerEmail,
        total: parseInt(total),
        paymentId: paymentId || undefined,
        status: status || undefined
      });
    }

    // Limpiar carrito de localStorage después de un pedido exitoso
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
    }
  }, [orderId, paymentMethod, customerName, customerEmail, total, paymentId, status]);

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
                <ClockIcon className="w-8 h-8 text-orange-600" />
              ) : (
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
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
                              <BanknotesIcon className="w-5 h-5 text-blue-600 mr-2" />
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

                  {/* Payment specific info */}
                  {orderInfo.paymentMethod === 'transferencia' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start">
                        <ClockIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-blue-800 mb-2">
                            Próximos pasos
                          </h3>
                          <ul className="text-sm text-blue-700 space-y-2">
                            <li>• Te contactaremos por WhatsApp con los datos bancarios</li>
                            <li>• Una vez realizada la transferencia, confirma el pago</li>
                            <li>• Procesaremos tu pedido y te informaremos sobre el envío</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
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
                className="flex items-center justify-center py-3 px-6 border border-transparent rounded-lg text-base font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
              >
                📦 Ver Mis Pedidos
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