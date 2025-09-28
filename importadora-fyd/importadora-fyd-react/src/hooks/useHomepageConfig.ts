'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { defaultMiddleBanners } from '@/components/home/bannerData';

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

interface MiddleBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  badgeText: string;
  badgeColor?: string;
}

const normalizeMiddleBanners = (raw: unknown): MiddleBanner[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultMiddleBanners.map((banner) => ({ ...banner }));
  }

  return raw.map((entry, index) => {
    const fallback = defaultMiddleBanners[index] ?? defaultMiddleBanners[0];
    const banner = (entry && typeof entry === 'object') ? entry as Record<string, unknown> : {};

    const getString = (value: unknown, fallbackValue: string): string => (
      typeof value === 'string' && value.trim() ? value : fallbackValue
    );

    const resolveImage = (): string => {
      const candidates = [
        banner.imageUrl,
        banner.imageURL,
        banner.image,
        banner.backgroundImage,
      ];

      const match = candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);
      return match ?? fallback.imageUrl;
    };

    const resolveLink = (): string => {
      const candidates = [
        banner.ctaLink,
        banner.link,
        banner.url,
        banner.href,
      ];

      const match = candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);
      return match ?? fallback.ctaLink;
    };

    const resolveBadgeColor = (): string | undefined => {
      const candidates = [
        banner.badgeColor,
        banner.tagColor,
        banner.badgeBackground,
      ];

      const match = candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);
      return match ?? fallback.badgeColor;
    };

    return {
      id: getString(banner.id, fallback.id || `middle-${index}`),
      title: getString(banner.title, fallback.title),
      subtitle: getString(banner.subtitle ?? banner.text, fallback.subtitle),
      imageUrl: resolveImage(),
      ctaText: getString(banner.ctaText ?? banner.buttonText ?? banner.linkText, fallback.ctaText),
      ctaLink: resolveLink(),
      badgeText: getString(banner.badgeText ?? banner.tagText, fallback.badgeText),
      badgeColor: resolveBadgeColor(),
    };
  });
};

interface HomepageConfig {
  featuredProducts: string[];
  offerProducts: string[];
  promotionalSections: PromotionalSection[];
  middleBanners: MiddleBanner[];
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
  ],
  middleBanners: defaultMiddleBanners.map((banner) => ({ ...banner })),
};

export function useHomepageConfig() {
  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>(defaultHomepageConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomepageConfig = async () => {
      try {
        const homepageDoc = await getDoc(doc(db, 'config', 'homepage-content'));
        const homepageFallbackDoc = homepageDoc.exists() ? null : await getDoc(doc(db, 'config', 'homepageContent'));
        const dataSource = homepageDoc.exists()
          ? homepageDoc
          : homepageFallbackDoc && homepageFallbackDoc.exists()
            ? homepageFallbackDoc
            : null;

        if (dataSource?.exists()) {
          const homepageData = dataSource.data();
          const rawMiddleBanners = (() => {
            const value = homepageData.middleBanners;
            if (Array.isArray(value)) return value;
            if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>);
            return undefined;
          })();

          const rawPromotionalSections = (() => {
            const value = homepageData.promotionalSections;
            if (Array.isArray(value)) return value;
            if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>);
            return undefined;
          })();

          setHomepageConfig({
            featuredProducts: homepageData.featuredProducts || [],
            offerProducts: homepageData.offerProducts || [],
            promotionalSections: Array.isArray(rawPromotionalSections)
              ? rawPromotionalSections.map((section: PromotionalSection) => ({ ...section }))
              : defaultHomepageConfig.promotionalSections,
            middleBanners: normalizeMiddleBanners(rawMiddleBanners ?? homepageData.middleBanners),
          });
        } else {
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
