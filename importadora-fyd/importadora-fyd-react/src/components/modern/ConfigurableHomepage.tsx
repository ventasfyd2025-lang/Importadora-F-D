'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useHomepageConfig } from '@/hooks/useHomepageConfig';
import ModernNavbar from './ModernNavbar';

export default function ConfigurableHomepage() {
  const { config, loading } = useHomepageConfig();
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  const handleAddToCart = (product: any) => {
    addItem(product.id, product.title, product.price, product.image);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error al cargar la configuración</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Navbar */}
      <ModernNavbar />

      {/* Topbar */}
      <div className="pt-16 bg-orange-500 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
          <span>{config.topbar.message}</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:underline">{config.topbar.ctaLogin}</Link>
            <span className="hover:underline cursor-pointer">{config.topbar.ctaLocation}</span>
          </div>
        </div>
      </div>

      {/* Hero Slides */}
      <section className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
          {config.slides.length > 0 && (
            <div className="text-white text-center px-4">
              {config.slides[0].badge && (
                <span className="inline-block bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  {config.slides[0].badge}
                </span>
              )}
              <h1 className="text-3xl lg:text-5xl font-bold mb-4">{config.slides[0].title}</h1>
              <p className="text-lg lg:text-xl mb-6">{config.slides[0].subtitle}</p>
              <Link
                href={config.slides[0].ctaHref}
                className="inline-block bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                {config.slides[0].ctaText}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Promo Strip */}
      {config.promoStrip && (
        <section className="py-8 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
              <div className="flex-1 mb-4 md:mb-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{config.promoStrip.title}</h2>
                <div className="flex flex-wrap gap-3">
                  {config.promoStrip.pills.map((pill, index) => (
                    <div key={index} className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full">
                      <span className="font-semibold">{pill.label}</span>
                      <span className="ml-2 text-sm">{pill.priceLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-32 h-32 bg-orange-200 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-4xl">🛍️</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Product Sections */}
      <div className="max-w-7xl mx-auto">
        {config.sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="py-8 bg-gray-50">
            {/* Section Header */}
            <div className="flex justify-between items-center mb-6 px-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                {section.chip && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {section.chip}
                  </span>
                )}
              </div>
              <Link href="/productos" className="text-orange-600 font-semibold hover:text-orange-700">
                Ver todo
              </Link>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
              {section.products.map((product) => {
                const discountPercentage = product.oldPrice 
                  ? calculateDiscount(product.oldPrice, product.price)
                  : 0;

                return (
                  <div key={product.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-lg transition-shadow">
                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded mb-3 inline-block">
                        -{discountPercentage}%
                      </div>
                    )}

                    {/* Product Image Placeholder */}
                    <div className="w-full h-40 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg mb-3 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold">
                            {product.title.charAt(0)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{product.title}</p>
                      </div>
                    </div>

                    {/* Product Info */}
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">
                      {product.title}
                    </h3>

                    {/* Prices */}
                    <div className="mb-3">
                      {product.oldPrice && (
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice(product.oldPrice)}
                        </p>
                      )}
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm"
                    >
                      Agregar
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Promo Blocks */}
      {config.promoBlocks.length > 0 && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {config.promoBlocks.map((block, index) => (
                <Link key={index} href={block.href}>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{block.title}</h3>
                      <span className="text-2xl">🎯</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Mantente al día con nuestras ofertas
          </h2>
          <p className="text-orange-100 mb-8">
            Suscríbete a nuestro newsletter y recibe descuentos exclusivos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-4 py-3 rounded-full border-0 focus:outline-none"
            />
            <button className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Suscribirse
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F&D</span>
                </div>
                <span className="text-xl font-bold">Importadora F&D</span>
              </div>
              <p className="text-gray-400">
                Tu tienda online de confianza con los mejores productos importados.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Productos</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/?filter=ofertas" className="hover:text-white transition-colors">Ofertas</Link></li>
                <li><Link href="/?filter=nuevos" className="hover:text-white transition-colors">Nuevos</Link></li>
                <li><Link href="/?filter=popular" className="hover:text-white transition-colors">Más Vendidos</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Ayuda</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/ayuda" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
                <li><Link href="/envios" className="hover:text-white transition-colors">Envíos</Link></li>
                <li><Link href="/devoluciones" className="hover:text-white transition-colors">Devoluciones</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>📞 +1 234 567 890</li>
                <li>📧 info@importadorafyd.com</li>
                <li>📍 Calle Principal 123, Ciudad</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Importadora F&D. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}