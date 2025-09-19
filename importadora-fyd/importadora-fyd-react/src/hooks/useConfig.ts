'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LogoConfig {
  emoji: string;
  text: string;
  image: string;
}

interface BannerConfig {
  title: string;
  text: string;
  active: boolean;
  images: string[];
}

interface MainBannerConfig {
  active: boolean;
  slides: {
    productId: string;
    imageUrl: string;
  }[];
}

export function useConfig() {
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    emoji: '🏪',
    text: 'Importadora F&D',
    image: ''
  });
  
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({
    title: '¡Ofertas Especiales!',
    text: 'Hasta 50% de descuento en productos seleccionados',
    active: false,
    images: []
  });

  const [mainBannerConfig, setMainBannerConfig] = useState<MainBannerConfig>({
    active: false,
    slides: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        setError(null);

        // Load logo configuration
        try {
          const logoDoc = await getDoc(doc(db, 'config', 'logo'));
          if (logoDoc.exists()) {
            setLogoConfig(logoDoc.data() as LogoConfig);
          }
        } catch (logoErr) {
          // Logo config error, using defaults
        }

        // Load banner configuration
        try {
          const bannerDoc = await getDoc(doc(db, 'config', 'banner'));
          if (bannerDoc.exists()) {
            const bannerData = bannerDoc.data() as BannerConfig;
            setBannerConfig(bannerData);
          } else {
            // If no banner configuration exists, keep inactive
            setBannerConfig({
              title: '¡Ofertas Especiales!',
              text: 'Hasta 50% de descuento en productos seleccionados',
              active: false,
              images: []
            });
          }
        } catch (bannerErr) {
          // Banner config error, keep inactive
          setBannerConfig({
            title: '¡Ofertas Especiales!',
            text: 'Hasta 50% de descuento en productos seleccionados',
            active: false,
            images: []
          });
        }

        // Load main banner configuration
        try {
          const mainBannerDoc = await getDoc(doc(db, 'config', 'main-banner'));
          if (mainBannerDoc.exists()) {
            const mainBannerData = mainBannerDoc.data() as MainBannerConfig;
            setMainBannerConfig(mainBannerData);
          } else {
            // If no configuration exists, keep banner inactive
            setMainBannerConfig({
              active: false,
              slides: []
            });
          }
        } catch (mainBannerErr) {
          // Main banner config error, keep inactive
          setMainBannerConfig({
            active: false,
            slides: []
          });
        }
        
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError('Error al cargar configuración, usando valores predeterminados');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  return {
    logoConfig,
    bannerConfig,
    mainBannerConfig,
    loading,
    error,
    refetch: () => setLoading(true)
  };
}