'use client';

import { useState } from 'react';

interface CreatePreferenceParams {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    quantity: number;
    price: number;
    image?: string;
    category?: string;
  }>;
  userInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      postalCode?: string;
    };
  };
  orderId?: string;
}

interface PreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export function useMercadoPago() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPreference = async (params: CreatePreferenceParams): Promise<PreferenceResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor MercadoPago:', errorData);
        throw new Error(errorData.error || 'Error creando preferencia de pago');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en useMercadoPago:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const redirectToCheckout = (initPoint: string) => {    if (typeof window !== 'undefined') {      window.location.href = initPoint;
    } else {
      console.error('❌ Window no disponible para redirección');
    }
  };

  return {
    createPreference,
    redirectToCheckout,
    loading,
    error,
  };
}