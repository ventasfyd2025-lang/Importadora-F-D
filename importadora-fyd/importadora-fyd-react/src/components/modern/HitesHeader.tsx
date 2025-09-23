'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';

export default function HitesHeader() {
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
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* 1. Top bar */}
      <div className="bg-hites-blue text-white text-center text-sm py-2">
        <p>¡Compra fácil y rápido! 🚚</p>
      </div>

      {/* 2. Main Header */}
      <div className="bg-hites-blue shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-hites-blue font-bold text-lg">F&D</span>
                </div>
                <span className="hidden sm:block text-2xl font-bold text-white">
                  Importadora F&D
                </span>
              </Link>
            </div>

            {/* Search Bar - Centered */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <form onSubmit={handleSearch} className="w-full relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  className="w-full pl-5 pr-14 py-3 bg-white border-0 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-hites-orange"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-hites-orange text-white rounded-full hover:bg-opacity-90 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Icons - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Location */}
              <button className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors">
                <MapPinIcon className="h-6 w-6" />
                <div className="text-left text-xs">
                  <p className="font-light">Revisa el</p>
                  <p className="font-bold">Despacho</p>
                </div>
              </button>

              {/* User Account */}
              <Link 
                href={currentUser ? "/perfil" : "/login"}
                className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
              >
                <UserIcon className="h-6 w-6" />
                <div className="text-left text-xs">
                  <p className="font-light">Hola, {currentUser ? currentUser.firstName : 'Inicia Sesión'}</p>
                  <p className="font-bold">Mi Cuenta</p>
                </div>
              </Link>

              {/* Cart */}
              <Link 
                href="/carrito"
                className="relative flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
              >
                <ShoppingBagIcon className="h-8 w-8" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-3 bg-hites-fuchsia text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
               <Link href="/carrito" className="relative text-white">
                <ShoppingBagIcon className="h-7 w-7" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-hites-fuchsia text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-white"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-7 w-7" />
                ) : (
                  <Bars3Icon className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-blue-800 pb-4">
              {/* Mobile Search */}
              <div className="px-4 py-4">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="¿Qué estás buscando?"
                    className="w-full pl-4 pr-12 py-3 bg-white border-0 rounded-full text-sm placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-hites-orange text-white rounded-full"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </form>
              </div>

              {/* Mobile Navigation Links */}
              <div className="px-4 py-2 space-y-4">
                <Link 
                  href={currentUser ? "/perfil" : "/login"}
                  className="flex items-center space-x-3 text-white hover:text-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserIcon className="h-6 w-6" />
                  <span>{currentUser ? 'Mi Cuenta' : 'Iniciar Sesión'}</span>
                </Link>
                <Link 
                  href="#"
                  className="flex items-center space-x-3 text-white hover:text-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MapPinIcon className="h-6 w-6" />
                  <span>Despacho</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}