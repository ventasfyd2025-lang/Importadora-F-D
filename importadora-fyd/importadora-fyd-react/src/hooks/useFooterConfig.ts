'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FooterConfig {
  companyName: string;
  description: string;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    whatsapp: string;
  };
  showSocialMedia: boolean;
  showContactInfo: boolean;
}

const defaultFooterConfig: FooterConfig = {
  companyName: 'Importadora F&D',
  description: 'Tu tienda online de confianza con los mejores productos importados.',
  contact: {
    phone: '+56 9 XXXX XXXX',
    email: 'contacto@importadorafyd.cl',
    address: 'Santiago, Chile'
  },
  socialMedia: {
    facebook: '#',
    instagram: '#',
    whatsapp: '#'
  },
  showSocialMedia: true,
  showContactInfo: true
};

export function useFooterConfig() {
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(defaultFooterConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const footerDocRef = doc(db, 'siteConfig', 'footer');

    const unsubscribe = onSnapshot(footerDocRef, (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data() as FooterConfig;
          setFooterConfig({ ...defaultFooterConfig, ...data });
        } else {
          setFooterConfig(defaultFooterConfig);
        }
      } catch (err) {
        console.error('Error loading footer config:', err);
        setError('Error al cargar configuración del pie de página');
        setFooterConfig(defaultFooterConfig);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateFooterConfig = async (newConfig: Partial<FooterConfig>) => {
    try {
      const updatedConfig = { ...footerConfig, ...newConfig };
      const footerDocRef = doc(db, 'siteConfig', 'footer');
      await setDoc(footerDocRef, updatedConfig, { merge: true });
      setFooterConfig(updatedConfig);
    } catch (err) {
      console.error('Error updating footer config:', err);
      setError('Error al actualizar configuración del pie de página');
      throw err;
    }
  };

  return {
    footerConfig,
    loading,
    error,
    updateFooterConfig
  };
}