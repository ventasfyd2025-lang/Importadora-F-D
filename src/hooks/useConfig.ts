'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface MainBannerSlide {
  linkType?: string;
  productId?: string;
  categoryId?: string;
  customUrl?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

interface MainBannerConfig {
  active: boolean;
  slides: MainBannerSlide[];
}

const DEFAULT_LOGO: LogoConfig = {
  emoji: '🏪',
  text: 'Importadora F&D',
  image: '',
};

const DEFAULT_BANNER: BannerConfig = {
  title: '¡Ofertas Especiales!',
  text: 'Hasta 50% de descuento en productos seleccionados',
  active: false,
  images: [],
};

const DEFAULT_MAIN_BANNER: MainBannerConfig = {
  active: false,
  slides: [],
};

export function useConfig() {
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(DEFAULT_LOGO);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [mainBannerConfig, setMainBannerConfig] = useState<MainBannerConfig>(DEFAULT_MAIN_BANNER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Logo configuration
      try {
        const logoDoc = await getDoc(doc(db, 'config', 'logo'));
        if (logoDoc.exists()) {
          setLogoConfig(logoDoc.data() as LogoConfig);
        } else {
          setLogoConfig(DEFAULT_LOGO);
        }
      } catch (logoErr) {
        // console.warn('No se pudo cargar el logo, usando valores por defecto:', logoErr);
        setLogoConfig(DEFAULT_LOGO);
      }

      // Banner configuration
      try {
        const bannerDoc = await getDoc(doc(db, 'config', 'banner'));
        if (bannerDoc.exists()) {
          setBannerConfig(bannerDoc.data() as BannerConfig);
        } else {
          setBannerConfig(DEFAULT_BANNER);
        }
      } catch (bannerErr) {
        // console.warn('No se pudo cargar el banner, usando valores por defecto:', bannerErr);
        setBannerConfig(DEFAULT_BANNER);
      }

      // Main banner configuration
      try {
        const mainBannerDoc = await getDoc(doc(db, 'config', 'main-banner'));
        if (mainBannerDoc.exists()) {
          setMainBannerConfig(mainBannerDoc.data() as MainBannerConfig);
        } else {
          setMainBannerConfig(DEFAULT_MAIN_BANNER);
        }
      } catch (mainBannerErr) {
        console.error('Error cargando main-banner, usando valores por defecto:', mainBannerErr);
        setMainBannerConfig(DEFAULT_MAIN_BANNER);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error general cargando configuración:', message);
      setError('Error al cargar configuración, usando valores predeterminados');
      setLogoConfig(DEFAULT_LOGO);
      setBannerConfig(DEFAULT_BANNER);
      setMainBannerConfig(DEFAULT_MAIN_BANNER);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    logoConfig,
    bannerConfig,
    mainBannerConfig,
    loading,
    error,
    refetch: loadConfig,
  };
}

export default useConfig;
