'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface PaymentInfo {
  paymentId: string;
  status: string;
  externalReference: string | null;
}

function PaymentFailureContent() {
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
            <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Pago No Procesado
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Hubo un problema con tu pago
            </p>
          </div>

          {paymentInfo && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Detalles del Pago
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-red-700">ID de Pago:</span>
                  <span className="ml-2 text-red-600">{paymentInfo.paymentId}</span>
                </div>
                <div>
                  <span className="font-medium text-red-700">Estado:</span>
                  <span className="ml-2 text-red-600 capitalize">{paymentInfo.status}</span>
                </div>
                {paymentInfo.externalReference && (
                  <div>
                    <span className="font-medium text-red-700">Número de Orden:</span>
                    <span className="ml-2 text-red-600">{paymentInfo.externalReference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                ¿Qué puedes hacer?
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Verifica que tu tarjeta tenga fondos suficientes</li>
                <li>• Revisa los datos de tu tarjeta</li>
                <li>• Intenta con otro método de pago</li>
                <li>• Contacta a tu banco si el problema persiste</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href="/carrito"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Intentar Nuevamente
              </Link>
              
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Volver a la Tienda
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda? {' '}
            <Link href="/contacto" className="text-orange-500 hover:text-orange-600 font-medium">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}