'use client';

import { useEffect, useState, memo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  HeartIcon,
} from '@heroicons/react/24/outline';
import { useProducts } from '@/hooks/useProducts';
import { useConfig } from '@/hooks/useConfig';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/context/I18nContext';
import { useHomepageConfig } from '@/hooks/useHomepageConfig';
import BannerCarousel from '@/components/home/BannerCarousel';
import ProductCarousel from '@/components/home/ProductCarousel';
import { ProductCardSkeleton, BannerSkeleton } from '@/components/home/SkeletonLoader';
import { defaultHeroBanners, defaultMiddleBanners } from '@/components/home/bannerData';
import MasonryProductGrid from '@/components/MasonryProductGrid';
import DynamicProductGrid from '@/components/DynamicProductGrid';
import HorizontalProductGrid from '@/components/HorizontalProductGrid';
import UnifiedHeader from '@/components/UnifiedHeader';

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



function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative bg-gradient-to-br from-[#D95D22] via-[#E67E22] to-[#C24C1A] text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold text-[#D95D22] shadow-lg">
                F&D
              </span>
              <div>
                <span className="text-2xl font-bold text-white">Importadora F&D</span>
                <p className="text-sm text-white/80 font-medium">Tu tienda de confianza</p>
              </div>
            </div>
            <p className="text-base text-white/90 leading-relaxed max-w-md">
              Más de 10 años importando los mejores productos internacionales. Calidad garantizada, precios competitivos y envío rápido a todo Chile.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <span className="text-sm text-white/90">Av. Providencia 1234, Santiago Centro</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📞</span>
                <span className="text-sm text-white/90">+56 2 2234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📧</span>
                <span className="text-sm text-white/90">contacto@importadorafyd.cl</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">🕒</span>
                <span className="text-sm text-white/90">Lun-Vie: 9:00-18:00, Sáb: 10:00-16:00</span>
              </div>
            </div>
            
            {/* Social Media */}
            <div className="flex space-x-4">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110" aria-label="Facebook">
                📘
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110" aria-label="Instagram">
                📷
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110" aria-label="WhatsApp">
                💬
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110" aria-label="TikTok">
                🎵
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/20 pb-2">Navegación</h3>
            <ul className="space-y-3 text-sm text-white/90">
              <li><Link href="/productos" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">🛍️</span> Todos los Productos</Link></li>
              <li><Link href="/ofertas" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">🔥</span> Ofertas Especiales</Link></li>
              <li><Link href="/nuevos" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">✨</span> Nuevos Productos</Link></li>
              <li><Link href="/categorias" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">📦</span> Categorías</Link></li>
              <li><Link href="/marcas" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">🌟</span> Marcas</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/20 pb-2">Atención al Cliente</h3>
            <ul className="space-y-3 text-sm text-white/90">
              <li><Link href="/ayuda/envios" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">🚚</span> Envíos y Entregas</Link></li>
              <li><Link href="/ayuda/cambios" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">🔄</span> Cambios y Devoluciones</Link></li>
              <li><Link href="/ayuda/pagos" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">💳</span> Métodos de Pago</Link></li>
              <li><Link href="/ayuda/garantia" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">🛡️</span> Garantía</Link></li>
              <li><Link href="/contacto" className="flex items-center gap-2 hover:text-white hover:translate-x-1 transition-all duration-200 focus:outline-none focus:underline group"><span className="group-hover:scale-110 transition-transform">📞</span> Contáctanos</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/20 pb-2">Newsletter</h3>
            <p className="text-sm text-white/90 leading-relaxed">
              Recibe las mejores ofertas y novedades directamente en tu email. ¡No te pierdas nuestras promociones exclusivas!
            </p>
            <form className="space-y-4">
              <div>
                <label htmlFor="newsletter-email" className="sr-only">Correo electrónico</label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/40 focus:bg-white/20"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#D95D22] hover:bg-white/95 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl transform focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                📬 Suscribirse
              </button>
            </form>
            
            {/* Trust Badges */}
            <div className="space-y-3">
              <p className="text-xs text-white/70 font-medium">Métodos de pago seguros</p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-2xl" title="Visa">💳</span>
                <span className="text-2xl" title="Mastercard">💳</span>
                <span className="text-2xl" title="WebPay">💻</span>
                <span className="text-2xl" title="MercadoPago">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/20 pt-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/80">
              <p className="font-semibold">© {new Date().getFullYear()} Importadora F&D SpA. Todos los derechos reservados.</p>
              <p className="mt-1">RUT: 76.123.456-7 | Resolución SII N° 123/2024</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <Link href="/legal/terminos" className="text-white/80 hover:text-white transition-colors focus:outline-none focus:underline">
                Términos y Condiciones
              </Link>
              <Link href="/legal/privacidad" className="text-white/80 hover:text-white transition-colors focus:outline-none focus:underline">
                Política de Privacidad
              </Link>
              <Link href="/legal/cookies" className="text-white/80 hover:text-white transition-colors focus:outline-none focus:underline">
                Política de Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>
    </footer>
  );
}

export default function RetailHomepage() {
  const searchParams = useSearchParams();
  const { logoConfig, mainBannerConfig } = useConfig();
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { getTotalItems, addItem } = useCart();
  const { currentUser } = useUserAuth();
  const { homepageConfig, loading: homepageLoading } = useHomepageConfig();
  const [notification, setNotification] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Debug logs - removed for production
  
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
      return productCategory.includes(category.toLowerCase());
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

  // Get filter title for display
  const getFilterTitle = () => {
    if (filter === 'destacados') return '⭐ Productos Destacados';
    if (filter === 'ofertas') return '🔥 Ofertas Especiales';
    if (filter === 'nuevos') return '✨ Productos Nuevos';
    if (category) return `📦 Categoría: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    if (searchQuery) return `🔍 Resultados para: "${searchQuery}"`;
    return 'Productos';
  };

  const cartItemCount = getTotalItems();
  const userDisplayName = currentUser?.firstName || currentUser?.email || undefined;
  const headerLogo = {
    text: logoConfig.text,
    image: logoConfig.image,
    emoji: logoConfig.emoji,
  };

  // Transform main banner config to banner slides
  const bannerSlides = mainBannerConfig?.slides?.map((slide, index) => {
    let ctaLink = '#';
    
    if (slide.linkType === 'product' && slide.productId) {
      ctaLink = `/producto/${slide.productId}`;
    } else if (slide.linkType === 'category' && slide.categoryId) {
      ctaLink = `/?category=${slide.categoryId}`;
    }
    
    return {
      id: slide.productId || slide.categoryId || `slide-${index}`,
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
      <div
        className="min-h-screen"
        style={{ backgroundColor: palette.background, color: palette.neutralText, paddingTop: '16rem' }}
      >
        <UnifiedHeader />
        
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
        
        <Footer />
        
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
      </div>
    );
  }

  // Show error state
  if (productsError) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: palette.background, color: palette.neutralText, paddingTop: '16rem' }}
      >
        <UnifiedHeader />
        
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-6 pb-12 sm:pb-16 lg:pb-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error al cargar productos</h2>
            <p className="text-red-600">{productsError}</p>
            <button
              onClick={() => {
                setRetryCount(prev => prev + 1);
                // Force component re-render by updating state
                setTimeout(() => {
                  if (retryCount < 3) {
                    window.location.reload();
                  }
                }, 100);
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={retryCount >= 3}
            >
              {retryCount >= 3 ? 'Máximo de intentos alcanzado' : 'Reintentar'}
            </button>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Helper function to get diverse products by categories
  const getDiverseProducts = (productList: typeof products, count: number = 8) => {
    const categories = [...new Set(productList.map(p => p.categoria))];
    const diverseProducts = [];
    
    // Get at least one product from each category
    for (const category of categories.slice(0, count)) {
      const categoryProducts = productList.filter(p => p.categoria === category);
      if (categoryProducts.length > 0) {
        diverseProducts.push(categoryProducts[0]);
      }
    }
    
    // Fill remaining slots with random products
    const remaining = productList.filter(p => !diverseProducts.includes(p));
    while (diverseProducts.length < count && remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      diverseProducts.push(remaining.splice(randomIndex, 1)[0]);
    }
    
    return diverseProducts.slice(0, count);
  };

  // Filter products by category for different sections
  const featuredProducts = homepageConfig.featuredProducts.length > 0 
    ? products.filter(p => homepageConfig.featuredProducts.includes(p.id)).slice(0, 8)
    : getDiverseProducts(products, 8);
  const bestSellers = getDiverseProducts(products.filter(p => p.oferta), 8);
  const newArrivals = getDiverseProducts(products.filter(p => p.nuevo), 8);
  const electronics = getDiverseProducts(
    products.filter(p => 
      p.categoria.toLowerCase().includes('tecnología') ||
      p.categoria.toLowerCase().includes('electro')
    ), 8
  );
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
      <div
        className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
        style={{ color: palette.neutralText }}
      >
        <UnifiedHeader />
        
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-6 pb-12 sm:pb-16 lg:pb-20 pt-44 sm:pt-32 lg:pt-36">
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
              <a 
                href="/"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                Ver todos los productos
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.imagen ? (
                      <img
                        src={product.imagen}
                        alt={product.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                        📦
                      </div>
                    )}
                    {product.oferta && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        OFERTA
                      </span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="text-xs text-orange-500 uppercase tracking-wide font-semibold">
                      {product.categoria}
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-2">
                      {product.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.descripcion}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(product.precio)}
                      </div>
                      {product.stock > 0 ? (
                        <span className="text-sm text-green-600 font-medium" aria-label={`En stock, ${product.stock} unidades disponibles`}>
                          ✅ En stock
                        </span>
                      ) : (
                        <span className="text-sm text-red-600 font-medium" aria-label="Producto sin stock">
                          ❌ Sin stock
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        if (product && product.id && product.nombre && product.precio > 0) {
                          addItem(
                            product.id,
                            product.nombre || 'Producto',
                            product.precio || 0,
                            product.imagen || undefined
                          );
                          setNotification('Producto agregado al carrito');
                          setTimeout(() => setNotification(''), 3000);
                        }
                      }}
                      disabled={product.stock <= 0}
                      aria-label={product.stock > 0 ? `Agregar ${product.nombre} al carrito` : 'Producto sin stock'}
                      className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                    >
                      <span aria-hidden="true">🛒</span>
                      <span>{product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer />

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 transition-all duration-300">
            {notification}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
      style={{ color: palette.neutralText }}
    >
      <UnifiedHeader />
      
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-6 pb-12 sm:pb-16 lg:pb-20 pt-44 sm:pt-32 lg:pt-36">
        {/* Hero Banner Carousel */}
        {bannerSlides.length > 0 ? (
          <BannerCarousel banners={bannerSlides} autoPlay={true} autoPlayInterval={5000} />
        ) : (
          <BannerCarousel banners={defaultHeroBanners} autoPlay={true} autoPlayInterval={5000} />
        )}

        {/* Category Promotions Pinterest Grid */}
        <div className="space-y-6">
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
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-full w-full overflow-hidden">
                        <img
                          src={section.imageUrl}
                          alt={section.title}
                          loading="lazy"
                          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
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
        </div>

        {/* Featured Products Section - Only show if products are selected in admin */}
        {featuredProducts.length > 0 && homepageConfig.featuredProducts.length > 0 && (
          <ProductCarousel 
            products={featuredProducts} 
            title="⭐ Productos Destacados" 
            viewAllLink="/?filter=destacados" 
          />
        )}

        {/* Horizontal Products Section */}
        <HorizontalProductGrid 
          products={getDiverseProducts(products.filter(p => p.oferta), 4)} 
          title="💥 Ofertas Imperdibles" 
        />

        {/* Middle Banner */}
        <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-300 mx-2 sm:mx-4">
          <BannerCarousel banners={[defaultMiddleBanners[0]]} autoPlay={false} />
        </div>

        {/* Best Sellers Carousel */}
        <ProductCarousel 
          products={bestSellers} 
          title="🔥 Los Más Vendidos" 
          viewAllLink="/?filter=ofertas" 
        />

        {/* Second Middle Banner */}
        <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-300">
          <BannerCarousel banners={[defaultMiddleBanners[1]]} autoPlay={false} />
        </div>

        {/* New Arrivals Carousel */}
        <ProductCarousel 
          products={newArrivals} 
          title="✨ Últimas Novedades" 
          viewAllLink="/?filter=nuevos" 
        />

        {/* Electronics Simple Grid */}
        {electronics.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-[#D95D22] to-[#E67E22] bg-clip-text text-transparent">
              🔌 Electrónicos y Tecnología
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getDiverseProducts(electronics, 4).map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.imagen ? (
                      <img
                        src={product.imagen}
                        alt={product.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">📦</div>
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
                      <div className="text-xs text-orange-500 uppercase tracking-wide font-semibold mb-2">
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
                            product.imagen || undefined
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
          </div>
        )}

        {/* Fashion Carousel */}
        {fashion.length > 0 && (
          <ProductCarousel 
            products={fashion} 
            title="👕 Moda y Calzado" 
            viewAllLink="/?category=moda" 
          />
        )}

        {/* Third Middle Banner */}
        <div className="rounded-2xl overflow-hidden shadow-xl">
          <BannerCarousel banners={[defaultMiddleBanners[2] || defaultMiddleBanners[0]]} autoPlay={false} />
        </div>


        {/* Home & Living Simple Grid */}
        {home.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              🏠 Hogar y Cocina
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getDiverseProducts(home, 4).map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.imagen ? (
                      <img
                        src={product.imagen}
                        alt={product.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover"
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
                            product.imagen || undefined
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
          </div>
        )}
      </main>
      
      <Footer />

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50 transition-all duration-300">
          {notification}
        </div>
      )}

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

    </div>
  );
}