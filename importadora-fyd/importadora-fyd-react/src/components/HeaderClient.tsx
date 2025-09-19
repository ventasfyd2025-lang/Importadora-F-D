'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { useConfig } from '@/hooks/useConfig';
import { useUserAuth } from '@/hooks/useUserAuth';
import { Bars3Icon, MagnifyingGlassIcon, ShoppingCartIcon, UserIcon } from '@heroicons/react/24/outline';

export default function HeaderClient() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);
  const { getTotalItems } = useCart();
  const { categories, loading: categoriesLoading } = useCategories();
  const { logoConfig } = useConfig();
  const { currentUser, isRegistered, isGuest, logout } = useUserAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
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

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to home with search query
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 shadow-lg" style={{ backgroundColor: '#F16529' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                {logoConfig.image ? (
                  <img 
                    src={logoConfig.image} 
                    alt={logoConfig.text}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="text-3xl">{logoConfig.emoji}</div>
                )}
                <span className="text-2xl font-bold text-white">{logoConfig.text}</span>
              </Link>
            </div>

            {/* Center - Categories + Search */}
            <div className="flex items-center space-x-4 flex-1 max-w-4xl mx-8">
              {/* Categories Menu */}
              <div className="relative" ref={categoriesDropdownRef}>
                <button
                  onClick={() => {
                    setIsCategoriesOpen(!isCategoriesOpen);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white hover:text-gray-100 hover:bg-orange-700 rounded-md transition-colors whitespace-nowrap"
                >
                  <Bars3Icon className="h-5 w-5" />
                  <span>Categorías</span>
                </button>
                
                {/* Categories Dropdown */}
                {isCategoriesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-2xl rounded-lg z-50 max-h-96 overflow-y-auto border border-gray-200">
                    {categories.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F16529' }}></div>
                        <span className="ml-3 text-gray-600">Cargando categorías...</span>
                      </div>
                    ) : (
                      <>
                        {categories.map((category) => (
                          <div key={category.id}>
                            {/* Main Category - Clickable to expand if has subcategories */}
                            <div>
                              {category.subcategorias && category.subcategorias.length > 0 ? (
                                <button
                                  onClick={() => toggleCategoryExpansion(category.id)}
                                  className="w-full flex items-center space-x-4 px-6 py-4 text-gray-800 hover:bg-orange-50 border-b border-gray-100 transition-colors duration-200 text-left"
                                >
                                  <span className="text-2xl">{category.icon || '📦'}</span>
                                  <span className="font-medium text-lg">{category.name}</span>
                                </button>
                              ) : (
                                <Link
                                  href={category.id === 'all' ? '/' : `/?category=${category.id}`}
                                  onClick={() => setIsCategoriesOpen(false)}
                                  className="flex items-center space-x-4 px-6 py-4 text-gray-800 hover:bg-orange-50 border-b border-gray-100 transition-colors duration-200"
                                >
                                  <span className="text-2xl">{category.icon || '📦'}</span>
                                  <span className="font-medium text-lg">{category.name}</span>
                                </Link>
                              )}
                            </div>
                            
                            {/* Subcategories */}
                            {category.subcategorias && category.subcategorias.length > 0 && expandedCategories.has(category.id) && (
                              <div className="bg-gray-50 border-b border-gray-100">
                                {category.subcategorias
                                  .filter(sub => sub.activa)
                                  .map((subcategoria) => (
                                  <Link
                                    key={subcategoria.id}
                                    href={`/?category=${category.id}&subcategory=${subcategoria.nombre}`}
                                    onClick={() => setIsCategoriesOpen(false)}
                                    className="flex items-center space-x-4 px-12 py-3 text-gray-700 hover:bg-orange-50 transition-colors duration-200"
                                  >
                                    <span className="text-sm">•</span>
                                    <span className="font-medium">{subcategoria.nombre}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Additional sections */}
                        <div className="mt-4 px-6 py-3">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Secciones especiales</h3>
                          
                          <Link
                            href="/?filter=ofertas"
                            onClick={() => setIsCategoriesOpen(false)}
                            className="flex items-center space-x-4 py-3 text-gray-800 hover:text-orange-600"
                          >
                            <span className="text-xl">🔥</span>
                            <span className="font-medium">Ofertas</span>
                          </Link>
                          
                          <Link
                            href="/?filter=nuevos"
                            onClick={() => setIsCategoriesOpen(false)}
                            className="flex items-center space-x-4 py-3 text-gray-800 hover:text-orange-600"
                          >
                            <span className="text-xl">✨</span>
                            <span className="font-medium">Nuevos</span>
                          </Link>
                          
                          <Link
                            href="/?filter=popular"
                            onClick={() => setIsCategoriesOpen(false)}
                            className="flex items-center space-x-4 py-3 text-gray-800 hover:text-orange-600"
                          >
                            <span className="text-xl">⭐</span>
                            <span className="font-medium">Más vendidos</span>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex flex-1">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 text-base border-2 border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-r-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ backgroundColor: '#F16529' }}
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Right side - User Menu + Cart */}
            <div className="flex items-center space-x-2">
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-3 text-gray-300 hover:text-white hover:bg-orange-700 rounded-md transition-colors"
                >
                  <UserIcon className="h-6 w-6" />
                  {currentUser && (
                    <span className="hidden sm:block text-sm">
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
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                              >
                                Mis Pedidos
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
                          <Link
                            href="/checkout?guest=true"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block w-full text-center px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Continuar como invitado
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link
                href="/carrito"
                className="relative p-3 text-gray-300 hover:text-white hover:bg-orange-700 rounded-md transition-colors"
              >
                <ShoppingCartIcon className="h-8 w-8" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center font-bold"
                        style={{ backgroundColor: '#D64541' }}>
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

    </>
  );
}