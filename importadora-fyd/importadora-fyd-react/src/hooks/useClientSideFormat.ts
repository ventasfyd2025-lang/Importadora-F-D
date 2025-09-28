'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para formatear fechas de forma segura en el cliente
 * Evita errores de hidratación esperando a que el componente se monte en el cliente
 */
export function useClientSideFormat() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    if (!isClient) {
      // Durante SSR, devolver un formato básico consistente
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // En el cliente, usar la configuración de locale apropiada
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', options);
  };

  const formatTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    if (!isClient) {
      // Durante SSR, devolver un formato básico consistente
      const d = new Date(date);
      return d.toISOString().split('T')[1].slice(0, 5); // HH:MM
    }

    // En el cliente, usar la configuración de locale apropiada
    const d = new Date(date);
    return d.toLocaleTimeString('es-CL', options || {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    if (!isClient) {
      // Durante SSR, devolver un formato básico consistente
      const d = new Date(date);
      return d.toISOString().slice(0, 16).replace('T', ' '); // YYYY-MM-DD HH:MM
    }

    // En el cliente, usar la configuración de locale apropiada
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    isClient,
    formatDate,
    formatTime,
    formatDateTime
  };
}