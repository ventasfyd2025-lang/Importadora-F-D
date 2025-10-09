'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type PopupSize = '1x1' | '2x1' | '2x2' | '3x1' | '3x3' | '6x4' | '6x6';

const POPUP_LEGACY_SIZE_MAP: Record<string, PopupSize> = {
  small: '1x1',
  medium: '2x2',
  large: '6x6',
};

const isPopupSize = (value: unknown): value is PopupSize =>
  typeof value === 'string' && ['1x1', '2x1', '2x2', '3x1', '3x3', '6x4', '6x6'].includes(value);

interface OfferPopupConfig {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  size: PopupSize;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  mediaUrl: string;
  isVideo: boolean;
  popupType: 'category' | 'information';
}

export function useOfferPopup() {
  const [popupConfig, setPopupConfig] = useState<OfferPopupConfig>({
    title: '¡Oferta Especial!',
    description: 'Descuentos increíbles por tiempo limitado',
    buttonText: 'Ver Ofertas',
    buttonLink: '/popup-ofertas',
    active: true,
    size: '2x2',
    position: 'bottom-right',
    mediaUrl: '',
    isVideo: false,
    popupType: 'category'
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPopupConfig = useCallback(async () => {
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
          size: (() => {
            if (isPopupSize(popupData.size)) {
              return popupData.size;
            }
            if (typeof popupData.size === 'string' && POPUP_LEGACY_SIZE_MAP[popupData.size]) {
              return POPUP_LEGACY_SIZE_MAP[popupData.size];
            }
            return '2x2';
          })(),
          position: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(popupData.position)
            ? popupData.position
            : 'bottom-right',
          mediaUrl: typeof popupData.mediaUrl === 'string' ? popupData.mediaUrl : (popupData.imageUrl || ''),
          isVideo: popupData.isVideo || false,
          popupType: ['category', 'information'].includes(popupData.popupType)
            ? popupData.popupType
            : (popupData.popupType === 'promotional' ? 'category' : 'information')
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al cargar configuración del popup');
      // Keep default config as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPopupConfig();
  }, [loadPopupConfig]);

  return {
    popupConfig,
    loading,
    error,
    refetch: loadPopupConfig
  };
}
