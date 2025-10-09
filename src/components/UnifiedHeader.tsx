'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { useConfig } from '@/hooks/useConfig';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useI18n } from '@/context/I18nContext';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import CartButton from '@/components/header/CartButton';
import UserMenu from '@/components/header/UserMenu';
import NotificationBadge from '@/components/header/NotificationBadge';
import { buildCategorySlug } from '@/utils/category';
import {
  Menu,
  Search,
  ShoppingCart,
  User,
  X
} from 'lucide-react';

export default function UnifiedHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDesktopCategoriesOpen, setIsDesktopCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [categoriesLoadTimeout, setCategoriesLoadTimeout] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const desktopCategoriesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { getTotalItems } = useCart();
  const { categories } = useCategories();

  // Debug categories loading
  useEffect(() => {  }, [categories]);
  const { logoConfig } = useConfig();
  const { currentUser, isRegistered, isGuest, logout } = useUserAuth();
  const { t } = useI18n();
  const unreadOrderNotifications = useOrderNotifications();

  // Usar el hook compartido en vez de listener duplicado
  const hasUnreadMessages = unreadOrderNotifications > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopCategoriesRef.current && !desktopCategoriesRef.current.contains(event.target as Node)) {
        setIsDesktopCategoriesOpen(false);
        setExpandedCategories(new Set());
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsDesktopCategoriesOpen(false);
        setIsUserMenuOpen(false);
        setExpandedCategories(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      } else {
        setIsDesktopCategoriesOpen(false);
        setExpandedCategories(new Set());
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set timeout for categories loading
  useEffect(() => {
    if (isMobileMenuOpen && categories.length === 0) {
      const timeout = setTimeout(() => {
        setCategoriesLoadTimeout(true);
      }, 3000);

      return () => clearTimeout(timeout);
    } else {
      setCategoriesLoadTimeout(false);
    }
  }, [isMobileMenuOpen, categories.length]);

const handleExpandableCategoryClick = (categoryId: string, href: string) => {
  if (expandedCategories.has(categoryId)) {
    handleCategoryNavigate();
    router.push(href);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  } else {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.add(categoryId);
      return next;
    });
  }
};

const handleMobileCategoryLinkClick = (
  event: React.MouseEvent<HTMLAnchorElement>,
  categoryId: string,
  href: string,
) => {
  if (!expandedCategories.has(categoryId)) {
    event.preventDefault();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.add(categoryId);
      return next;
    });
    // Bring subcategory list into view so users notice it expanded
    requestAnimationFrame(() => {
      const panel = document.getElementById(`mobile-subcategories-${categoryId}`);
      panel?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  } else {
    // If already expanded, allow default navigation of the Link component
    // The Link component's default behavior will handle navigation
    handleCategoryNavigate(); // Close mobile menu after navigation
  }
};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleCategoryNavigate = () => {
    setIsMobileMenuOpen(false);
    setIsDesktopCategoriesOpen(false);
    setExpandedCategories(new Set());
  };

  const renderLogoBadge = () => {
    // Tamaños fijos para evitar layout shift - siempre el mismo tamaño independiente del contenido
    const containerClass = "flex items-center justify-center rounded-full shadow-sm";
    // Tamaños fijos: móvil 40px, tablet 48px, desktop 56px
    const sizeClass = "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14";

    // SIEMPRE mostrar placeholder del tamaño fijo mientras no tengamos la imagen cargada
    // Solo mostrar imagen si ya existe en logoConfig (viene de Firebase)
    if (logoConfig && logoConfig.image && logoConfig.image.trim() !== '') {
      return (
        <div className={`${containerClass} ${sizeClass} overflow-hidden`}>
          <Image
            src={logoConfig.image}
            alt={logoConfig.text || 'Logo'}
            width={56}
            height={56}
            className="w-full h-full object-cover"
            style={{ minWidth: '100%', minHeight: '100%' }}
          />
        </div>
      );
    }

    // Placeholder transparente mientras carga Firebase - MISMO TAMAÑO
    return (
      <div
        className={`${containerClass} ${sizeClass}`}
        style={{ backgroundColor: '#F16529' }}
      >
        <span className="font-semibold text-white text-xs sm:text-sm lg:text-base">
          F&D
        </span>
      </div>
    );
  };

  return (
    <>
      <header id="main-header" className="fixed inset-x-0 top-0 z-[100] backdrop-blur-lg shadow-2xl border-b border-orange-100">
        <div className="relative bg-white/80">
          {/* Top Banner */}
          <div className="text-[11px] uppercase tracking-[0.32em] text-white bg-gradient-to-r from-[#F16529] to-[#E67E22]">
            <div className="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
              <span className="font-medium">{t('header.welcome')}</span>

              {/* Mobile User + Cart Icons in Top Banner */}
              <div className="flex items-center gap-2 sm:hidden">
                {/* User - Mobile */}
                <Link
                  href="/perfil"
                  className="relative p-1.5 text-white hover:text-orange-100 hover:bg-white/20 rounded-md transition-colors"
                >
                  <User className="h-5 w-5" />
                  {hasUnreadMessages && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </Link>

                {/* Cart - Mobile */}
                <Link
                  href="/carrito"
                  className="relative p-1.5 text-white hover:text-orange-100 hover:bg-white/20 rounded-md transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold"
                          style={{ backgroundColor: '#D64541' }}>
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
              </div>

              {/* Desktop Info */}
              <div className="hidden gap-6 text-[11px] font-semibold sm:flex">
                <span className="flex items-center gap-2 text-white/95 hover:text-white transition-colors">
                  <span aria-hidden className="text-sm">🚚</span>
                  {t('header.shipping')}
                </span>
                <span className="flex items-center gap-2 text-white/95 hover:text-white transition-colors">
                  <span aria-hidden className="text-sm">🏬</span>
                  {t('header.pickup')}
                </span>
              </div>
            </div>
          </div>

          {/* Main Header */}
          <div className="text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-xl">
            <div className="mx-auto flex flex-col gap-2 sm:gap-4 px-4 py-2 sm:py-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">

            {/* Logo + Desktop Categories + Mobile Hamburger */}
            <div className="flex items-center gap-3">
              {/* Desktop Categories Button - Left of logo and smaller */}
              <div className="hidden lg:block relative" ref={desktopCategoriesRef}>
                <button
                  onClick={() => {
                    setIsDesktopCategoriesOpen(!isDesktopCategoriesOpen);
                    if (!isDesktopCategoriesOpen) {
                      setExpandedCategories(new Set());
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-semibold text-sm hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-lg backdrop-blur-sm border border-orange-400/50"
                  style={{ backgroundColor: '#F16529' }}
                  aria-haspopup="true"
                  aria-expanded={isDesktopCategoriesOpen}
                >
                  <Menu className="h-3.5 w-3.5" />
                  <span>Categorías</span>
                </button>

                {isDesktopCategoriesOpen && (
                  <div className="absolute left-0 top-full mt-3 w-[420px] rounded-2xl border border-orange-100 bg-white/95 shadow-[0_15px_45px_rgba(217,93,34,0.25)] backdrop-blur-sm z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                      <span className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                        <span className="text-base">🏷️</span>
                        Todas las categorías
                      </span>
                      <span className="text-xs font-medium text-orange-500/70">{categories.length} disponibles</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto px-4 py-4 space-y-3">
                      {categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F16529' }}></div>
                          <span className="mt-3 text-sm text-gray-600">
                            {categoriesLoadTimeout ? 'Error al cargar categorías' : 'Cargando categorías...'}
                          </span>
                          {categoriesLoadTimeout && (
                            <button
                              onClick={() => window.location.reload()}
                              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                              Reintentar
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {categories.map((category) => {
                            const slugSource = category.id === 'all'
                              ? 'all'
                              : buildCategorySlug(category.id || (category as any).name || (category as any).nombre || '');
                            const categorySlug = slugSource || buildCategorySlug((category as any).name || '') || category.id;
                            const categoryHref = categorySlug === 'all' ? '/?category=all' : `/?category=${categorySlug}`;

                            return (
                            <div key={category.id}>
                              {category.subcategorias && category.subcategorias.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleExpandableCategoryClick(category.id, categoryHref)}
                                  className={`w-full text-left px-4 py-1 text-gray-700 rounded-lg transition-all duration-300 font-medium text-sm border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 flex items-center justify-between ${expandedCategories.has(category.id) ? 'bg-orange-50/70 text-orange-700' : ''}`}
                                  aria-expanded={expandedCategories.has(category.id)}
                                  aria-controls={`desktop-subcategories-${category.id}`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <span className="text-lg">{category.icon || '📦'}</span>
                                    <span>{category.name}</span>
                                  </div>
                                  <span className="text-orange-500 font-semibold">
                                    {expandedCategories.has(category.id) ? '→' : '+'}
                                  </span>
                                </button>
                              ) : (
                                <Link
                                  href={categoryHref}
                                  onClick={() => handleCategoryNavigate()}
                                  className="group block w-full text-left px-4 py-1 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-lg transition-all duration-300 font-medium text-sm border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-lg">{category.icon || '📦'}</span>
                                      <span>{category.name}</span>
                                    </div>
                                    <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                  </div>
                                </Link>
                              )}

                              {category.subcategorias && category.subcategorias.length > 0 && expandedCategories.has(category.id) && (
                                <div id={`desktop-subcategories-${category.id}`} className="ml-5 mt-2 space-y-1">
                                  {category.subcategorias
                                    .filter(sub => sub.activa)
                                    .map((subcategoria) => (
                                    <Link
                                      key={subcategoria.id}
                                      href={`/?category=${categorySlug}&subcategory=${encodeURIComponent(subcategoria.nombre)}`}

                                      className="group block w-full text-left px-4 py-0.5 text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-md transition-all duration-300 font-normal text-xs border border-gray-50 shadow-sm hover:shadow-md hover:border-orange-200"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <span>•</span>
                                          <span>{subcategoria.nombre}</span>
                                        </div>
                                        <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                          })}

                          <div className="pt-4 border-t border-gray-200 space-y-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Secciones especiales</div>

                            <Link
                              href="/?filter=ofertas"
                              onClick={() => handleCategoryNavigate()}
                              className="group block w-full text-left px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-lg transition-all duration-300 font-medium border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">🔥</span>
                                  <span>Ofertas</span>
                                </div>
                                <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                              </div>
                            </Link>

                            <Link
                              href="/?filter=nuevos"
                              onClick={() => handleCategoryNavigate()}
                              className="group block w-full text-left px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-lg transition-all duration-300 font-medium border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">✨</span>
                                  <span>Nuevos</span>
                                </div>
                                <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                              </div>
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-3" aria-label={logoConfig?.text || 'Importadora F&D'}>
                {renderLogoBadge()}
                <div className="flex flex-col">
                  <span className="text-lg font-semibold">{logoConfig?.text || 'Importadora F&D'}</span>
                  <span className="text-[11px] uppercase tracking-[0.28em] text-white/80">
                    Tu tienda de confianza
                  </span>
                </div>
              </Link>

              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => {                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setIsDesktopCategoriesOpen(false);
                  if (isMobileMenuOpen) {
                    setExpandedCategories(new Set());
                  }
                }}
                className="lg:hidden p-3 ml-3 rounded-xl hover:bg-white/20 transition-all duration-300 border-2 border-white/60 bg-white/30 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm z-50"
                aria-label="Menú de categorías"
              >
                {isMobileMenuOpen ? (
                  <X className="h-7 w-7 text-white font-bold" />
                ) : (
                  <Menu className="h-7 w-7 text-white font-bold" />
                )}
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex flex-1 items-center max-w-3xl mx-8 gap-4">
              <form onSubmit={handleSearch} className="flex w-full">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border-2 border-white/50 rounded-l-lg bg-white/10 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-r-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  style={{ backgroundColor: '#F16529' }}
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Right Side - User + Cart (Desktop only) */}
            <div className="hidden sm:flex items-center gap-2">

              {/* User Menu - Desktop */}
              <div className="hidden lg:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative flex items-center space-x-2 p-3 text-white hover:text-orange-100 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <div className="relative">
                    <User className="h-6 w-6" />
                    {hasUnreadMessages && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                      </span>
                    )}
                  </div>
                  {currentUser && (
                    <span className="text-sm">
                      {currentUser.firstName}
                      {isGuest && <span className="text-xs ml-1">(Invitado)</span>}
                    </span>
                  )}
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-2xl rounded-lg z-50 border border-gray-200">
                    {currentUser ? (
                      <div>
                        {/* User Info */}
                        <div className="p-4 border-b border-gray-200">
                          <p className="font-medium text-gray-900">
                            {currentUser.firstName} {currentUser.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{currentUser.email}</p>
                          {isGuest && (
                            <p className="text-xs text-orange-600 mt-1">Usuario Invitado</p>
                          )}
                        </div>

                        {/* Menu Options */}
                        <div className="py-2">
                          {isRegistered && (
                            <>
                              <Link
                                href="/perfil"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                              >
                                Mi Perfil
                              </Link>
                              <Link
                                href="/mis-pedidos"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 relative"
                              >
                                Mis Pedidos
                                {unreadOrderNotifications > 0 && (
                                  <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                                    {unreadOrderNotifications > 9 ? '9+' : unreadOrderNotifications}
                                  </span>
                                )}
                              </Link>
                            </>
                          )}

                          {isGuest && (
                            <Link
                              href="/registro"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="block px-4 py-2 text-orange-600 hover:bg-orange-50"
                            >
                              Crear Cuenta
                            </Link>
                          )}

                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                          >
                            {isGuest ? 'Cambiar Usuario' : 'Cerrar Sesión'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="space-y-2">
                          <Link
                            href="/login"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block w-full text-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                          >
                            Iniciar Sesión
                          </Link>
                          <Link
                            href="/registro"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block w-full text-center px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50 transition-colors"
                          >
                            Registrarse
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart - Desktop/Tablet only */}
              <Link
                href="/carrito"
                className="relative p-2 text-white hover:text-orange-100 hover:bg-white/20 rounded-md transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                        style={{ backgroundColor: '#D64541' }}>
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="lg:hidden px-4 pb-2">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="px-3 py-2 text-white rounded-r-lg hover:opacity-90"
                style={{ backgroundColor: '#F16529' }}
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Mobile Menu - Categorías reales */}
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute left-0 right-0 top-full bg-white border-b shadow-2xl z-[9999]">
              <div className="mx-auto max-w-full px-6 py-6 max-h-[calc(100vh-180px)] overflow-y-auto">
              <div className="space-y-3">
                <div className="text-lg font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
                  <span className="text-orange-500">🏷️</span>
                  Categorías ({categories.length} encontradas)
                </div>

                {categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F16529' }}></div>
                    <span className="ml-3 text-gray-600">
                      {categoriesLoadTimeout ? 'Error al cargar categorías' : 'Cargando categorías...'}
                    </span>
                    {categoriesLoadTimeout && (
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Reintentar
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {categories.map((category) => {
                      const slugSource = category.id === 'all'
                        ? 'all'
                        : buildCategorySlug(category.id || (category as any).name || (category as any).nombre || '');
                      const categorySlug = slugSource || buildCategorySlug((category as any).name || '') || category.id;
                      const categoryHref = categorySlug === 'all' ? '/?category=all' : `/?category=${categorySlug}`;

                      return (
                      <div key={category.id}>
                        {/* Main Category */}
                        {category.subcategorias && category.subcategorias.length > 0 ? (
                          <a
                            href={categoryHref}
                            onTouchStart={(event) => {
                              setTouchStartX(event.changedTouches[0].clientX);
                              setTouchStartY(event.changedTouches[0].clientY);
                            }}
                            onTouchEnd={(event) => {
                              const touchEndX = event.changedTouches[0].clientX;
                              const touchEndY = event.changedTouches[0].clientY;
                              const deltaX = Math.abs(touchEndX - touchStartX);
                              const deltaY = Math.abs(touchEndY - touchStartY);
                              const threshold = 10; // Pixels

                              if (deltaX > threshold || deltaY > threshold) {
                                // It's a scroll, do nothing
                                return;
                              }

                              // It's a tap
                              if (!expandedCategories.has(category.id)) {
                                event.preventDefault(); // Prevent navigation, just expand
                                setExpandedCategories((prev) => {
                                  const next = new Set(prev);
                                  next.add(category.id);
                                  return next;
                                });
                                requestAnimationFrame(() => {
                                  const panel = document.getElementById(`mobile-subcategories-${category.id}`);
                                  panel?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                                });
                              } else {
                                // If already expanded, navigate to the category page
                                window.location.href = categoryHref;
                                handleCategoryNavigate(); // Close mobile menu after navigation
                              }
                            }}
                            className={`group block w-full text-left px-4 py-1.5 text-gray-700 rounded-lg transition-all duration-300 font-medium text-sm border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 flex items-center justify-between hover:scale-105 ${expandedCategories.has(category.id) ? 'bg-orange-50/70 text-orange-700' : ''}`}
                            aria-expanded={expandedCategories.has(category.id)}
                            aria-controls={`mobile-subcategories-${category.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{category.icon || '📦'}</span>
                              <span>{category.name}</span>
                            </div>
                            <span className="text-orange-500 font-semibold">
                              {expandedCategories.has(category.id) ? '→' : '+'}
                            </span>
                          </a>
                        ) : (
                          <Link
                            href={categoryHref}
                            onClick={handleCategoryNavigate}
                            className="group block w-full text-left px-4 py-1.5 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-lg transition-all duration-300 font-medium text-sm border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 hover:scale-105"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{category.icon || '📦'}</span>
                                <span>{category.name}</span>
                              </div>
                              <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </div>
                          </Link>
                        )}

                        {/* Subcategories */}
                        {category.subcategorias && category.subcategorias.length > 0 && expandedCategories.has(category.id) && (
                          <div id={`mobile-subcategories-${category.id}`} className="ml-6 mt-1 space-y-1" style={{ touchAction: 'auto', pointerEvents: 'auto' }}>
                            {category.subcategorias
                              .filter(sub => sub.activa)
                              .map((subcategoria) => {
                                const destination = `/?category=${categorySlug}&subcategory=${encodeURIComponent(subcategoria.nombre)}`;
                                return (
                                  <a
                                    key={subcategoria.id}
                                    href={destination}
                                    onTouchStart={(event) => {
                                      setTouchStartX(event.changedTouches[0].clientX);
                                      setTouchStartY(event.changedTouches[0].clientY);
                                    }}
                                    onTouchEnd={(event) => {
                                      const touchEndX = event.changedTouches[0].clientX;
                                      const touchEndY = event.changedTouches[0].clientY;
                                      const deltaX = Math.abs(touchEndX - touchStartX);
                                      const deltaY = Math.abs(touchEndY - touchStartY);
                                      const threshold = 10; // Pixels

                                      if (deltaX > threshold || deltaY > threshold) {
                                        // It's a scroll, do nothing
                                        return;
                                      }

                                      // It's a tap
                                      window.location.href = destination;
                                      handleCategoryNavigate(); // Close menu after navigation
                                    }}
                                    className="group block w-full text-left px-4 py-1.5 text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-md transition-all duration-300 font-normal text-sm border border-gray-50 shadow-sm hover:shadow-md hover:border-orange-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span>•</span>
                                        <span>{subcategoria.nombre}</span>
                                      </div>
                                      <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </div>
                                    </a>
                                  );
                                })}                          </div>
                        )}
                      </div>
                    );
                    })}

                    {/* Secciones especiales */}
                    <div className="pt-4 border-t border-gray-200 space-y-2">
                      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">Secciones especiales</div>

                      <Link
                        href="/?filter=ofertas"
                        onClick={handleCategoryNavigate}
                        className="group block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-lg transition-all duration-300 font-medium border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 hover:scale-105"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">🔥</span>
                            <span>Ofertas</span>
                          </div>
                          <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </div>
                      </Link>

                      <Link
                        href="/?filter=nuevos"
                        onClick={handleCategoryNavigate}
                        className="group block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600 rounded-lg transition-all duration-300 font-medium border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 hover:scale-105"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">✨</span>
                            <span>Nuevos</span>
                          </div>
                          <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </div>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
        </div>
      </header>
    </>
  );
}
