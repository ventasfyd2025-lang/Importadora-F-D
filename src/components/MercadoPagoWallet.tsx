'use client';

import { useEffect, useRef, useState } from 'react';
import { logError, logWarn } from '@/utils/logger';

interface WalletInstance {
  unmount: () => void;
}

interface WalletBrickConfig {
  initialization: {
    preferenceId: string;
  };
  customization?: {
    texts?: {
      valueProp?: string;
    };
  };
  callbacks: {
    onReady?: () => void;
    onSubmit?: (data: unknown) => Promise<void>;
    onError?: (error: unknown) => void;
  };
}

interface MercadoPagoSDK {
  bricks(): {
    create: (brickId: 'wallet', containerId: string, config: WalletBrickConfig) => Promise<WalletInstance>;
  };
}

interface MercadoPagoConstructor {
  new (publicKey: string): MercadoPagoSDK;
}

interface MercadoPagoWalletProps {
  preferenceId: string;
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
  onReady?: () => void;
  className?: string;
}

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstructor;
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
  const walletInstanceRef = useRef<WalletInstance | null>(null);

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
          logError('MercadoPago SDK no está disponible');
          throw new Error('MercadoPago SDK no está disponible. Verifica que el script esté cargado.');
        }

        const rawPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        const sanitizedPublicKey = rawPublicKey
          ? rawPublicKey.replace(/[^A-Za-z0-9_-]/g, '')
          : 'APP_USR-b6ef221a-a985-4153-83fd-ac35f8d1b4ad';

        if (!sanitizedPublicKey) {
          logError('Public key no configurada');
          throw new Error('Public key de MercadoPago no configurada');
        }

        if (rawPublicKey) {
          const rawLength = rawPublicKey.length;
          const sanitizedLength = sanitizedPublicKey.length;
          const preview = `${sanitizedPublicKey.slice(0, 6)}…${sanitizedPublicKey.slice(-6)}`;

          if (rawPublicKey !== sanitizedPublicKey) {
            logWarn('Public key de MercadoPago fue sanitizada antes de inicializar', {
              rawLength,
              sanitizedLength,
              preview
            });
          } else {
            console.debug('[MercadoPago] Public key sin modificación', {
              length: sanitizedLength,
              preview
            });
          }
        }

        const mp = new window.MercadoPago(sanitizedPublicKey);
        
        // Crear el Wallet Brick
        const bricksBuilder = mp.bricks();
        
        // Limpiar container anterior si existe
        if (walletContainerRef.current) {
          walletContainerRef.current.innerHTML = '';
        }

        const wallet = await bricksBuilder.create('wallet', 'wallet-container', {
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
              setIsLoading(false);
              onReady?.();
            },
            onSubmit: async (data: unknown) => {
              onSuccess?.(data);
            },
            onError: (walletError: unknown) => {
              logError('Error en Wallet Brick', walletError);
              setError('Error al procesar el pago');
              onError?.(walletError);
            },
          },
        });

        walletInstanceRef.current = wallet;

      } catch (err) {
        logError('Error inicializando MercadoPago Wallet', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setIsLoading(false);
      }
    };

    // Esperar un poco para asegurar que el DOM esté listo
    const timer = setTimeout(initializeMercadoPago, 100);

    return () => {
      clearTimeout(timer);
      // Limpiar el wallet al desmontar
      const instance = walletInstanceRef.current;
      walletInstanceRef.current = null;
      if (instance) {
        try {
          instance.unmount();
        } catch (e) {        }
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
