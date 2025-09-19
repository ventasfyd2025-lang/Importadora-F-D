'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OfferPopupConfig {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  selectedProducts: string[];
}

export function useOfferPopup() {
  const [popupConfig, setPopupConfig] = useState<OfferPopupConfig>({
    title: '¡Oferta Especial!',
    description: 'Descuentos increíbles por tiempo limitado',
    buttonText: 'Ver Ofertas',
    buttonLink: '/popup-ofertas',
    active: true,
    selectedProducts: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPopupConfig() {
      try {
        setLoading(true);
        setError(null);

        const popupDoc = await getDoc(doc(db, 'config', 'offer-popup'));
        if (popupDoc.exists()) {
          const popupData = popupDoc.data();
          setPopupConfig({
            title: popupData.title || '¡Oferta Especial!',
            description: popupData.description || 'Descuentos increíbles por tiempo limitado',
            buttonText: popupData.buttonText || 'Ver Ofertas',
            buttonLink: popupData.buttonLink || '/popup-ofertas',
            active: popupData.active !== undefined ? popupData.active : true,
            selectedProducts: popupData.selectedProducts || []
          });
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError('Error al cargar configuración del popup');
        // Keep default config as fallback
      } finally {
        setLoading(false);
      }
    }

    loadPopupConfig();
  }, []);

  return {
    popupConfig,
    loading,
    error,
    refetch: () => setLoading(true)
  };
}