'use client';

import { useEffect, useRef, useState } from 'react';

interface MercadoPagoWalletProps {
  preferenceId: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onReady?: () => void;
  className?: string;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function MercadoPagoWallet({ 
  preferenceId, 
  onSuccess, 
  onError, 
  onReady,
  className = ''
}: MercadoPagoWalletProps) {
  const walletContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletInstance, setWalletInstance] = useState<any>(null);

  useEffect(() => {
    if (!preferenceId) {
      setError('ID de preferencia requerido');
      setIsLoading(false);
      return;
    }

    const initializeMercadoPago = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar si MercadoPago SDK está disponible
        if (!window.MercadoPago) {
          console.error('❌ MercadoPago SDK no está disponible');
          throw new Error('MercadoPago SDK no está disponible. Verifica que el script esté cargado.');
        }

        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'APP_USR-b6ef221a-a985-4153-83fd-ac35f8d1b4ad';
        if (!publicKey) {
          console.error('❌ Public key no configurada');
          throw new Error('Public key de MercadoPago no configurada');
        }

        console.log('🔑 Usando public key:', publicKey);

        // Inicializar MercadoPago
        const mp = new window.MercadoPago(publicKey);
        
        // Crear el Wallet Brick
        const bricksBuilder = mp.bricks();
        
        // Limpiar container anterior si existe
        if (walletContainerRef.current) {
          walletContainerRef.current.innerHTML = '';
        }

        const wallet = await bricksBuilder.create("wallet", "wallet-container", {
          initialization: {
            preferenceId: preferenceId,
          },
          customization: {
            texts: {
              valueProp: 'smart_option',
            },
          },
          callbacks: {
            onReady: () => {
              console.log('🎯 Wallet Brick está listo');
              setIsLoading(false);
              onReady?.();
            },
            onSubmit: (data: any) => {
              console.log('💰 Pago enviado:', data);
              onSuccess?.(data);
              return new Promise((resolve) => {
                // Permitir que MercadoPago maneje la redirección
                resolve(undefined);
              });
            },
            onError: (error: any) => {
              console.error('❌ Error en Wallet Brick:', error);
              setError('Error al procesar el pago');
              onError?.(error);
            },
          },
        });

        setWalletInstance(wallet);

      } catch (error) {
        console.error('❌ Error inicializando MercadoPago Wallet:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
        setIsLoading(false);
      }
    };

    // Esperar un poco para asegurar que el DOM esté listo
    const timer = setTimeout(initializeMercadoPago, 100);

    return () => {
      clearTimeout(timer);
      // Limpiar el wallet al desmontar
      if (walletInstance) {
        try {
          walletInstance.unmount();
        } catch (e) {
          console.log('Error unmounting wallet:', e);
        }
      }
    };
  }, [preferenceId, onSuccess, onError, onReady]);

  if (error) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 font-bold">!</span>
          </div>
          <div>
            <h3 className="font-medium text-red-900">Error al cargar el pago</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mercadopago-wallet ${className}`}>
      {isLoading && (
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600">Cargando opciones de pago...</span>
          </div>
        </div>
      )}
      
      <div 
        ref={walletContainerRef}
        id="wallet-container"
        className={`${isLoading ? 'hidden' : 'block'}`}
      />
    </div>
  );
}