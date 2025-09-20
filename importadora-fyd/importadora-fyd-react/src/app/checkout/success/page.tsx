'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface PaymentInfo {
  paymentId: string;
  status: string;
  externalReference: string | null;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    // Obtener información del pago si está disponible
    if (paymentId && status) {
      setPaymentInfo({
        paymentId,
        status,
        externalReference
      });
    }

    // Limpiar carrito de localStorage después de un pago exitoso
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
    }
  }, [paymentId, status, externalReference]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              ¡Pago Exitoso!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tu pedido ha sido procesado correctamente
            </p>
          </div>

          {paymentInfo && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                Detalles del Pago
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-green-700">ID de Pago:</span>
                  <span className="ml-2 text-green-600">{paymentInfo.paymentId}</span>
                </div>
                <div>
                  <span className="font-medium text-green-700">Estado:</span>
                  <span className="ml-2 text-green-600 capitalize">{paymentInfo.status}</span>
                </div>
                {paymentInfo.externalReference && (
                  <div>
                    <span className="font-medium text-green-700">Número de Orden:</span>
                    <span className="ml-2 text-green-600">{paymentInfo.externalReference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Recibirás un email de confirmación con los detalles de tu pedido.
              También puedes revisar el estado de tu pedido en tu cuenta.
            </p>

            <div className="space-y-3">
              <Link
                href="/mis-pedidos"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Ver Mis Pedidos
              </Link>
              
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ¿Tienes algún problema? {' '}
            <Link href="/contacto" className="text-orange-500 hover:text-orange-600 font-medium">
              Contáctanos
            </Link>
          </p>
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