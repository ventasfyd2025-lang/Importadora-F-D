'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ClockIcon } from '@heroicons/react/24/outline';

interface PaymentInfo {
  paymentId: string;
  status: string;
  externalReference: string | null;
}

function PaymentPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    if (paymentId && status) {
      setPaymentInfo({
        paymentId,
        status,
        externalReference
      });
    }
  }, [paymentId, status, externalReference]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="text-center">
            <ClockIcon className="mx-auto h-16 w-16 text-yellow-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Pago Pendiente
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tu pago está siendo procesado
            </p>
          </div>

          {paymentInfo && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Detalles del Pago
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-yellow-700">ID de Pago:</span>
                  <span className="ml-2 text-yellow-600">{paymentInfo.paymentId}</span>
                </div>
                <div>
                  <span className="font-medium text-yellow-700">Estado:</span>
                  <span className="ml-2 text-yellow-600 capitalize">{paymentInfo.status}</span>
                </div>
                {paymentInfo.externalReference && (
                  <div>
                    <span className="font-medium text-yellow-700">Número de Orden:</span>
                    <span className="ml-2 text-yellow-600">{paymentInfo.externalReference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                ¿Qué significa esto?
              </h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>Tu pago está siendo verificado. Esto puede suceder cuando:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Elegiste pagar en efectivo o transferencia bancaria</li>
                  <li>• Tu banco está procesando la transacción</li>
                  <li>• Hay verificaciones adicionales de seguridad</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">
                Próximos pasos:
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Te notificaremos cuando se procese el pago</li>
                <li>• Puedes revisar el estado en &quot;Mis Pedidos&quot;</li>
                <li>• El producto se reservará por 24 horas</li>
              </ul>
            </div>

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
            ¿Tienes dudas sobre tu pago? {' '}
            <Link href="/contacto" className="text-orange-500 hover:text-orange-600 font-medium">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PaymentPendingContent />
    </Suspense>
  );
}
