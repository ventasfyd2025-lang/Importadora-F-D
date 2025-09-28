'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useConfig } from '@/hooks/useConfig';
import { useCart } from '@/context/CartContext';
import { useHomepageConfig } from '@/hooks/useHomepageConfig';
import { useProductSections } from '@/hooks/useProductSections';
import { useLayoutPatterns } from '@/hooks/useLayoutPatterns';
import { useOfferPopup } from '@/hooks/useOfferPopup';
import OfferPopup from '@/components/OfferPopup';
import BannerCarousel from '@/components/home/BannerCarousel';
import ProductCarousel from '@/components/home/ProductCarousel';
import { ProductCardSkeleton, BannerSkeleton } from '@/components/home/SkeletonLoader';
import { defaultMiddleBanners } from '@/components/home/bannerData';
import MasonryProductGrid from '@/components/MasonryProductGrid';
import HorizontalProductGrid from '@/components/HorizontalProductGrid';

type ProductSectionConfig = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: 'featured' | 'bestsellers' | 'new' | 'category' | 'custom';
  selectedProducts?: string[];
  categoryId?: string;
  [key: string]: unknown;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
};

const palette = {
  background: '#FAFAFA',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#D95D22', // Burnt Orange / Main
  primaryHover: '#C24C1A', // Dark Orange / Buttons
  secondary: '#FF0000', // Red / Offer Label
  accent: '#D95D22', // Burnt Orange / Primary
  success: '#10B981', // Modern Green / Prices
  neutralText: '#1F2937', // Modern Dark Gray / Text
  mutedText: '#6B7280', // Modern Gray / Secondary Text
  divider: '#E5E7EB',
  headerBg: 'linear-gradient(135deg, #D95D22 0%, #E67E22 100%)', // Gradient Header
  discountTag: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', // Gradient Red
};

export default function RetailHomepage() {
  const searchParams = useSearchParams();
  const { mainBannerConfig } = useConfig();

  const {
    products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
    invalidateCache,
  } = useProducts();
  const { addItem } = useCart();
  const { homepageConfig } = useHomepageConfig();
  const { sections: productSections } = useProductSections();
  const { patterns: layoutPatternsConfig } = useLayoutPatterns();
  const { popupConfig } = useOfferPopup();
  const [notification, setNotification] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  // Get filter parameters
  const category = searchParams.get('category') || '';
  const filter = searchParams.get('filter') || '';
  const searchQuery = searchParams.get('search') || '';

  // Check if any filters are active
  const hasActiveFilters = !!(category || filter || searchQuery);

  // Filter products based on URL parameters
  const filteredProducts = products.filter(product => {
    // Category filter
    if (category) {
      const productCategory = product.categoria?.toLowerCase() || '';
      const categoryFilter = category.toLowerCase();
      return productCategory === categoryFilter;
    }
    
    // Special filters
    if (filter === 'ofertas') {
      return product.oferta === true;
    }
    if (filter === 'nuevos') {
      return product.nuevo === true;
    }
    if (filter === 'destacados') {
      return homepageConfig.featuredProducts.includes(product.id);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.nombre?.toLowerCase().includes(query) ||
        product.descripcion?.toLowerCase().includes(query) ||
        product.categoria?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Auto-refresh when there are active filters but no results
  useEffect(() => {
    if (!productsLoading && hasActiveFilters && filteredProducts.length === 0 && products.length > 0) {
      const timeoutId = setTimeout(() => invalidateCache(), 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [productsLoading, hasActiveFilters, filteredProducts.length, products.length, invalidateCache]);

  // Get filter title for display
  const getFilterTitle = () => {
    if (filter === 'destacados') return '⭐ Productos Destacados';
    if (filter === 'ofertas') return '🔥 Ofertas Especiales';
    if (filter === 'nuevos') return '✨ Productos Nuevos';
    if (category) return `📦 Categoría: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    if (searchQuery) return `🔍 Resultados para: "${searchQuery}"`;
    return 'Productos';
  };

  const buildMiddleBanner = (index: number) => {
    const fallback = defaultMiddleBanners[index] ?? defaultMiddleBanners[0];
    const configuredBanner = Array.isArray(homepageConfig.middleBanners)
      ? (homepageConfig.middleBanners[index] as any)
      : undefined;

    if (!configuredBanner) {
      return fallback;
    }

    const pickString = (value: unknown, fallbackValue: string): string => (
      typeof value === 'string' && value.trim().length > 0 ? value : fallbackValue
    );

    const pickOptionalString = (value?: unknown): string | undefined => (
      typeof value === 'string' && value.trim().length > 0 ? value : undefined
    );

    const resolveFromCandidates = (candidates: unknown[], fallbackValue: string) => {
      const match = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
      return (match as string | undefined) ?? fallbackValue;
    };

    const resolvedImage = resolveFromCandidates(
      [
        configuredBanner.imageUrl,
        configuredBanner.imageURL,
        configuredBanner.image,
        configuredBanner.backgroundImage,
      ],
      fallback.imageUrl,
    );

    const resolvedLink = resolveFromCandidates(
      [
        configuredBanner.ctaLink,
        configuredBanner.link,
        configuredBanner.url,
        configuredBanner.href,
      ],
      fallback.ctaLink,
    );

    return {
      id: pickString(configuredBanner.id, fallback.id),
      title: pickString(configuredBanner.title, fallback.title),
      subtitle: pickString(
        pickOptionalString(configuredBanner.subtitle)
          ?? pickOptionalString(configuredBanner.text),
        fallback.subtitle,
      ),
      imageUrl: resolvedImage,
      ctaText: pickString(
        pickOptionalString(configuredBanner.ctaText)
          ?? pickOptionalString(configuredBanner.buttonText)
          ?? pickOptionalString(configuredBanner.linkText),
        fallback.ctaText,
      ),
      ctaLink: resolvedLink,
      badgeText: pickString(
        pickOptionalString(configuredBanner.badgeText)
          ?? pickOptionalString(configuredBanner.tagText),
        fallback.badgeText,
      ),
      badgeColor: pickOptionalString(configuredBanner.badgeColor)
        ?? pickOptionalString(configuredBanner.tagColor)
        ?? fallback.badgeColor,
    };
  };

  const middleBannerData = [
    buildMiddleBanner(0),
    buildMiddleBanner(1),
    buildMiddleBanner(2),
  ];

  // Transform main banner config to banner slides
  const bannerSlides = mainBannerConfig?.slides?.map((slide, index) => {
    let ctaLink = '#';

    // Handle different link types
    if (slide.linkType === 'product' && slide.productId) {
      ctaLink = `/producto/${slide.productId}`;
    } else if (slide.linkType === 'category' && slide.categoryId) {
      ctaLink = `/?category=${slide.categoryId}`;
    } else if (slide.productId) {
      // Fallback for old data format - assume product link
      ctaLink = `/producto/${slide.productId}`;
    } else if (slide.categoryId) {
      // Fallback for old data format - assume category link
      ctaLink = `/?category=${slide.categoryId}`;
    }

    const baseId = slide.linkType === 'category'
      ? `category-${slide.categoryId || index}`
      : `product-${slide.productId || index}`;

    return {
      id: `${baseId}-${index}`,
      title: `Oferta Especial ${index + 1}`,
      subtitle: slide.linkType === 'category' ? 'Múltiples productos en promoción' : 'Producto en promoción',
      imageUrl: slide.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=500&fit=crop',
      ctaText: slide.linkType === 'category' ? 'Ver categoría' : 'Ver producto',
      ctaLink: ctaLink,
      badgeText: index === 0 ? 'OFERTA' : index === 1 ? 'NUEVO' : 'POPULAR',
      badgeColor: index === 0 ? '#EF4444' : index === 1 ? '#3B82F6' : '#10B981'
    };
  }) || [];

  // Show loading state
  if (productsLoading) {
    return (
      <>
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-6 pb-12 sm:pb-16 lg:pb-20">
          {/* Hero Banner Carousel */}
          <BannerSkeleton count={1} />

          {/* Featured Products Carousel */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <ProductCardSkeleton count={4} />
            </div>
          </div>

          {/* Middle Banner */}
          <BannerSkeleton count={1} />

          {/* Best Sellers Carousel */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <ProductCardSkeleton count={4} />
            </div>
          </div>
        </main>
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Importadora F&D",
              "url": "https://importadorafyd.cl",
              "description": "Tienda online de productos importados con ofertas especiales"
            })
          }}
        />
      </>
    );
  }

  // Show error state
  if (productsError) {
    return (
      <>
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-6 pb-12 sm:pb-16 lg:pb-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error al cargar productos</h2>
            <p className="text-red-600">{productsError}</p>
            <button
              onClick={() => {
                setRetryCount(prev => prev + 1);
                refetchProducts();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={retryCount >= 3}
            >
              {retryCount >= 3 ? 'Intentos agotados' : 'Reintentar'}
            </button>
          </div>
        </main>
      </>
    );
  }

  // Helper function to get diverse products by categories
  const getDiverseProducts = (productList: typeof products, count: number = 8) => {
    const categories = [...new Set(productList.map(p => p.categoria))];
    const diverseProducts: typeof products = [];
    
    // Get at least one product from each category
    for (const category of categories.slice(0, count)) {
      const categoryProducts = productList.filter(p => p.categoria === category);
      if (categoryProducts.length > 0) {
        diverseProducts.push(categoryProducts[0]);
      }
    }
    
    // Fill remaining slots with deterministic selection (avoid Math.random for SSR consistency)
    const remaining = productList.filter(p => !diverseProducts.includes(p));
    let seed = 1; // Use a consistent seed
    while (diverseProducts.length < count && remaining.length > 0) {
      // Simple LCG (Linear Congruential Generator) for deterministic pseudo-random selection
      seed = (seed * 9301 + 49297) % 233280;
      const index = Math.floor((seed / 233280) * remaining.length);
      diverseProducts.push(remaining.splice(index, 1)[0]);
    }
    
    return diverseProducts.slice(0, count);
  };

  // Get products for a specific section based on its configuration
  const getProductsForSection = (section: ProductSectionConfig) => {
    const count = 8; // Default number of products per section

    switch (section.type) {
      case 'custom':
        // For custom sections, use selected products
        if (section.selectedProducts && section.selectedProducts.length > 0) {
          return products.filter(p => section.selectedProducts!.includes(p.id)).slice(0, count);
        }
        return [];

      case 'featured': {
        const selectedIds = Array.isArray(section.selectedProducts)
          ? section.selectedProducts
          : [];

        const combinedIds = [...new Set([
          ...selectedIds,
          ...(homepageConfig.featuredProducts ?? []),
        ])];

        if (combinedIds.length > 0) {
          return products.filter((p) => combinedIds.includes(p.id)).slice(0, count);
        }

        return getDiverseProducts(products, count);
      }

      case 'bestsellers':
        if (Array.isArray(section.selectedProducts) && section.selectedProducts.length > 0) {
          return products.filter(p => section.selectedProducts?.includes(p.id)).slice(0, count);
        }
        return getDiverseProducts(products.filter(p => p.oferta), count);

      case 'new':
        if (Array.isArray(section.selectedProducts) && section.selectedProducts.length > 0) {
          return products.filter(p => section.selectedProducts?.includes(p.id)).slice(0, count);
        }
        return getDiverseProducts(products.filter(p => p.nuevo), count);

      case 'category':
        if (Array.isArray(section.selectedProducts) && section.selectedProducts.length > 0) {
          return products.filter(p => section.selectedProducts?.includes(p.id)).slice(0, count);
        }
        // Filter by category
        if (section.categoryId) {
          return getDiverseProducts(
            products.filter(p =>
              p.categoria.toLowerCase().includes(section.categoryId!.toLowerCase())
            ), count
          );
        }
        return getDiverseProducts(products, count);

      default:
        if (Array.isArray(section.selectedProducts) && section.selectedProducts.length > 0) {
          return products.filter(p => section.selectedProducts?.includes(p.id)).slice(0, count);
        }
        return getDiverseProducts(products, count);
    }
  };

  const enabledSections = (productSections as ProductSectionConfig[]).filter((section) => section.enabled);
  const sectionsWithProducts = enabledSections
    .map((section) => {
      const sectionProducts = getProductsForSection(section);
      return { section, sectionProducts };
    })
    .filter(({ sectionProducts }) => sectionProducts.length > 0);

  // Filter products by category for different sections
  // const featuredProducts = homepageConfig.featuredProducts.length > 0
  //   ? products.filter(p => homepageConfig.featuredProducts.includes(p.id)).slice(0, 8)
  //   : getDiverseProducts(products, 8);
  // const bestSellers = getDiverseProducts(products.filter(p => p.oferta), 8);
  // const newArrivals = getDiverseProducts(products.filter(p => p.nuevo), 8);
  // const electronics = getDiverseProducts(
  //   products.filter(p =>
  //     p.categoria.toLowerCase().includes('tecnología') ||
  //     p.categoria.toLowerCase().includes('electro')
  //   ), 8
  // );
  const fashion = getDiverseProducts(
    products.filter(p => 
      p.categoria.toLowerCase().includes('moda') || 
      p.categoria.toLowerCase().includes('ropa') ||
      p.categoria.toLowerCase().includes('calzado')
    ), 8
  );
  const home = getDiverseProducts(
    products.filter(p => 
      p.categoria.toLowerCase().includes('hogar') || 
      p.categoria.toLowerCase().includes('casa') ||
      p.categoria.toLowerCase().includes('cocina')
    ), 8
  );

  // Generate structured data for products
  const productStructuredData = products.slice(0, 4).map(product => ({
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.nombre,
    "image": product.imagen,
    "description": product.descripcion,
    "offers": {
      "@type": "Offer",
      "price": product.precio,
      "priceCurrency": "CLP",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  }));

  // If filters are active, show filtered products view
  if (hasActiveFilters) {
    return (
      <>
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-6 pb-12 sm:pb-16 lg:pb-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getFilterTitle()}
            </h1>
            <p className="text-gray-600">
              {filteredProducts.length} productos encontrados
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta con otros términos de búsqueda o explora nuestras categorías
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                Ver todos los productos
              </Link>
            </div>
          ) : (
            <>
              <MasonryProductGrid products={filteredProducts} layoutConfig={layoutPatternsConfig} />
              <div className="text-center text-gray-600 mt-6">
                Mostrando {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'}
              </div>
            </>
          )}
        </main>

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 transition-all duration-300">
            {notification}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-2 sm:px-4 lg:px-6 pb-12 sm:pb-16 lg:pb-20 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Hero Banner Carousel */}
        <section className="mt-4 sm:mt-6">
          {(() => {            return bannerSlides?.length > 0 ? (
              <BannerCarousel banners={bannerSlides} autoPlay={true} autoPlayInterval={3000} />
            ) : (
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">No hay banners configurados</p>
              </div>
            );
          })()}
        </section>

        {/* Category Promotions Pinterest Grid */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-[#D95D22] to-[#E67E22] bg-clip-text text-transparent">
            🔥 Promociones por Categoría
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {homepageConfig.promotionalSections.map((section) => {
              // Generate link based on section configuration
              const getLink = () => {
                switch (section.linkType) {
                  case 'category':
                    return `/?category=${section.linkValue}`;
                  case 'product':
                    return `/producto/${section.linkValue}`;
                  case 'filter':
                    return `/?filter=${section.linkValue}`;
                  case 'url':
                    return section.linkValue;
                  default:
                    return '#';
                }
              };

              // Get CSS classes based on position
              const getPositionClasses = () => {
                switch (section.position) {
                  case 'large':
                    return 'col-span-2 row-span-2';
                  case 'tall':
                    return 'row-span-2';
                  case 'wide':
                    return 'col-span-2';
                  default:
                    return '';
                }
              };

              // Get height classes based on position
              const getHeightClasses = () => {
                switch (section.position) {
                  case 'large':
                    return 'min-h-[200px] sm:min-h-[250px] lg:min-h-[350px]';
                  case 'tall':
                    return 'min-h-[180px] sm:min-h-[220px] lg:min-h-[300px]';
                  case 'wide':
                    return 'h-32 sm:h-36 lg:h-44';
                  default:
                    return 'h-36 sm:h-44 lg:h-52';
                }
              };

              return (
                <Link key={section.id} href={getLink()} className={`${getPositionClasses()} group`}>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                    <div className={`relative flex-1 ${getHeightClasses()}`}>
                      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-full w-full overflow-hidden">
                        {section.imageUrl ? (
                          <Image
                            src={section.imageUrl}
                            alt={section.title}
                            fill
                            loading="lazy"
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-400">
                            📸
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-2 rounded-full shadow-lg">
                        {section.badgeText}
                      </span>
                      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 text-white">
                        <h3 className={`font-bold ${section.position === 'large' ? 'text-lg sm:text-2xl lg:text-3xl mb-1 sm:mb-2' : section.position === 'tall' ? 'text-base sm:text-xl lg:text-2xl mb-1 sm:mb-2' : 'text-sm sm:text-base lg:text-lg'}`}>
                          {section.title}
                        </h3>
                        <p className={`opacity-90 ${section.position === 'large' ? 'text-sm sm:text-base lg:text-lg' : 'text-xs sm:text-sm'}`}>
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Dynamic Product Sections - Configured from Admin */}
        {sectionsWithProducts.map(({ section, sectionProducts }, index) => {
            const getViewAllLink = (section: ProductSectionConfig) => {
              switch (section.type) {
                case 'featured': return '/?filter=destacados';
                case 'bestsellers': return '/?filter=ofertas';
                case 'new': return '/?filter=nuevos';
                case 'category': return section.categoryId ? `/?category=${section.categoryId}` : '/';
                default: return '/';
              }
            };

            const getSectionEmoji = (section: ProductSectionConfig) => {
              switch (section.type) {
                case 'featured': return '⭐';
                case 'bestsellers': return '🔥';
                case 'new': return '✨';
                case 'category': return '📦';
                default: return '🏪';
              }
            };

            return (
              <section key={section.id} className="space-y-6">
                {/* Add banner between sections */}
                {index === 0 && middleBannerData[0] && (
                  <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-300 mx-2 sm:mx-4">
                    <BannerCarousel banners={[middleBannerData[0]]} autoPlay={false} />
                  </div>
                )}

                {index === 0 && (
                  /* Horizontal Products Section for first section if it's offers */
                  section.type === 'bestsellers' && (
                    <HorizontalProductGrid
                      products={sectionProducts.slice(0, 4)}
                      title="💥 Ofertas Imperdibles"
                    />
                  )
                )}

                <ProductCarousel
                  products={sectionProducts}
                  title={`${getSectionEmoji(section)} ${section.name}`}
                  viewAllLink={getViewAllLink(section)}
                />

                {/* Add banner between sections */}
                {index === 1 && middleBannerData[1] && (
                  <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-300 mx-2 sm:mx-4">
                    <BannerCarousel banners={[middleBannerData[1]]} autoPlay={false} />
                  </div>
                )}
              </section>
            );
          })}

        {sectionsWithProducts.length < 2 && (
          <section className="flex flex-col gap-4 sm:gap-6 mx-2 sm:mx-4">
            {middleBannerData.slice(sectionsWithProducts.length, 2).map((banner, index) => (
              <div
                key={`fallback-middle-banner-${banner.id}-${index}`}
                className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-300"
              >
                <BannerCarousel banners={[banner]} autoPlay={false} />
              </div>
            ))}
          </section>
        )}

        {/* Main Masonry Product Grid */}
        {products.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <h2 className="text-3xl font-bold text-gray-900 text-center sm:text-left">
                🧱 Todos los Productos
              </h2>
              {layoutPatternsConfig.updatedAt && (
                <span className="text-sm text-gray-500">
                  Layout actualizado: {new Date(layoutPatternsConfig.updatedAt).toLocaleString('es-CL')}
                </span>
              )}
            </div>
            <MasonryProductGrid
              products={products}
              layoutConfig={layoutPatternsConfig}
            />
          </section>
        )}

        {/* Fashion Carousel */}
        {fashion.length > 0 && (
          <section>
            <ProductCarousel 
              products={fashion} 
              title="👕 Moda y Calzado" 
              viewAllLink="/?category=moda" 
            />
          </section>
        )}

        {/* Third Middle Banner */}
        <section className="rounded-2xl overflow-hidden shadow-xl">
          <BannerCarousel banners={[middleBannerData[2]]} autoPlay={false} />
        </section>


        {/* Home & Living Simple Grid */}
        {home.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              🏠 Hogar y Cocina
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getDiverseProducts(home, 4).map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.imagen ? (
                      <Image
                        src={product.imagen}
                        alt={product.nombre}
                        fill
                        loading="lazy"
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">🏠</div>
                    )}
                    {product.oferta && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        OFERTA
                      </span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex-grow">
                      <div className="text-xs text-green-600 uppercase tracking-wide font-semibold mb-2">
                        {product.categoria}
                      </div>
                      <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-3">
                        {product.nombre}
                      </h3>
                    </div>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(product.precio)}
                      </div>
                    </div>
                    
                    {/* Button */}
                    <button
                      onClick={() => {
                        if (product && product.id && product.nombre && product.precio > 0) {
                          addItem(
                            product.id,
                            product.nombre || 'Producto',
                            product.precio || 0,
                            product.imagen || undefined,
                            1,
                            product.sku,
                          );
                          setNotification('Producto agregado al carrito');
                          setTimeout(() => setNotification(''), 3000);
                        }
                      }}
                      disabled={product.stock <= 0}
                      aria-label={product.stock > 0 ? `Agregar ${product.nombre} al carrito` : 'Producto sin stock'}
                      className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105">
                      <span aria-hidden="true">🛒</span>
                      <span>{product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 transition-all duration-300">
          {notification}
        </div>
      )}

      {/* Offer Popup */}
      <OfferPopup
        title={popupConfig.title}
        description={popupConfig.description}
        buttonText={popupConfig.buttonText}
        buttonLink={popupConfig.buttonLink}
        isActive={popupConfig.active}
        size={popupConfig.size}
        position={popupConfig.position}
        mediaUrl={popupConfig.mediaUrl}
        isVideo={popupConfig.isVideo}
        popupType={popupConfig.popupType}
        onClose={() => {}}
      />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "name": "Importadora F&D",
                "url": "https://importadorafyd.cl",
                "description": "Tienda online de productos importados con ofertas especiales"
              },
              ...productStructuredData
            ]
          })
        }}
      />

    </>
  );
}
