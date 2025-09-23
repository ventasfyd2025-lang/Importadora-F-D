'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  HeartIcon, 
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';

export default function ModernNavbar() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getTotalItems } = useCart();
  const { currentUser } = useUserAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F&D</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-gray-900">
                Importadora F&D
              </span>
            </Link>
          </div>

          {/* Search Bar - Centrado */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className={`relative transition-all duration-200 ${
                isSearchFocused ? 'ring-2 ring-orange-500' : ''
              }`}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Buscar productos..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border-0 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Icons - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {/* User Account */}
            <Link 
              href={currentUser ? "/perfil" : "/login"}
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-orange-500 transition-colors group"
            >
              <UserIcon className="h-6 w-6" />
              <span className="text-xs">
                {currentUser ? 'Mi Cuenta' : 'Ingresar'}
              </span>
            </Link>

            {/* Favorites */}
            <Link 
              href="/favoritos"
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-orange-500 transition-colors group"
            >
              <HeartIcon className="h-6 w-6" />
              <span className="text-xs">Favoritos</span>
            </Link>

            {/* Cart */}
            <Link 
              href="/carrito"
              className="flex flex-col items-center space-y-1 text-gray-600 hover:text-orange-500 transition-colors group relative"
            >
              <div className="relative">
                <ShoppingBagIcon className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {getTotalItems()}
                  </span>
                )}
              </div>
              <span className="text-xs">Carrito</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 pb-4">
            {/* Mobile Search */}
            <div className="px-4 py-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border-0 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Mobile Navigation Links */}
            <div className="px-4 py-2 space-y-3">
              <Link 
                href={currentUser ? "/perfil" : "/login"}
                className="flex items-center space-x-3 text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserIcon className="h-5 w-5" />
                <span>{currentUser ? 'Mi Cuenta' : 'Ingresar'}</span>
              </Link>

              <Link 
                href="/favoritos"
                className="flex items-center space-x-3 text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <HeartIcon className="h-5 w-5" />
                <span>Favoritos</span>
              </Link>

              <Link 
                href="/carrito"
                className="flex items-center space-x-3 text-gray-700 hover:text-orange-500 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="relative">
                  <ShoppingBagIcon className="h-5 w-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {getTotalItems()}
                    </span>
                  )}
                </div>
                <span>Carrito ({getTotalItems()})</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}