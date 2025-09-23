'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PromotionalSection {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkType: 'category' | 'product' | 'filter' | 'url';
  linkValue: string;
  badgeText: string;
  position: 'large' | 'tall' | 'normal' | 'wide';
}

interface HomepageConfig {
  featuredProducts: string[];
  offerProducts: string[];
  promotionalSections: PromotionalSection[];
}

const defaultHomepageConfig: HomepageConfig = {
  featuredProducts: [],
  offerProducts: [],
  promotionalSections: [
    {
      id: 'electronics',
      title: 'Electrónicos',
      description: 'Smartphones, laptops y más',
      imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&h=600&fit=crop&crop=center',
      linkType: 'category',
      linkValue: 'tecnologia',
      badgeText: 'HASTA 50% OFF',
      position: 'large'
    },
    {
      id: 'fashion',
      title: 'Moda',
      description: 'Ropa y accesorios',
      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=700&fit=crop&crop=center',
      linkType: 'category',
      linkValue: 'moda',
      badgeText: 'NUEVA COLECCIÓN',
      position: 'tall'
    },
    {
      id: 'home',
      title: 'Electrohogar',
      description: 'Cocina y limpieza',
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=400&fit=crop&crop=center',
      linkType: 'category',
      linkValue: 'electrohogar',
      badgeText: 'ENVÍO GRATIS',
      position: 'normal'
    },
    {
      id: 'fitness',
      title: 'Fitness & Deportes',
      description: 'Equipamiento deportivo y wellness',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop&crop=center',
      linkType: 'category',
      linkValue: 'fitness',
      badgeText: 'FITNESS 2025',
      position: 'wide'
    },
    {
      id: 'shoes',
      title: 'Calzado',
      description: 'Zapatos y sneakers',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=400&fit=crop&crop=center',
      linkType: 'category',
      linkValue: 'calzado',
      badgeText: 'ÚLTIMAS TALLAS',
      position: 'normal'
    },
    {
      id: 'offers',
      title: 'Ofertas',
      description: 'Descuentos únicos',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=400&fit=crop&crop=center',
      linkType: 'filter',
      linkValue: 'ofertas',
      badgeText: '¡OFERTAS!',
      position: 'normal'
    }
  ]
};

export function useHomepageConfig() {
  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>(defaultHomepageConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomepageConfig = async () => {
      try {
        console.log('🔄 Loading homepage config from Firebase...');
        const homepageDoc = await getDoc(doc(db, 'config', 'homepage-content'));
        if (homepageDoc.exists()) {
          const homepageData = homepageDoc.data();
          console.log('✅ Homepage config loaded from Firebase:', homepageData);
          setHomepageConfig({
            featuredProducts: homepageData.featuredProducts || [],
            offerProducts: homepageData.offerProducts || [],
            promotionalSections: homepageData.promotionalSections || defaultHomepageConfig.promotionalSections
          });
        } else {
          console.log('ℹ️ No homepage config found in Firebase, using defaults');
          setHomepageConfig(defaultHomepageConfig);
        }
      } catch (error) {
        console.error('❌ Error loading homepage config:', error);
        // Keep defaults on error
        setHomepageConfig(defaultHomepageConfig);
      } finally {
        setLoading(false);
      }
    };

    loadHomepageConfig();
  }, []);

  return { homepageConfig, loading };
}