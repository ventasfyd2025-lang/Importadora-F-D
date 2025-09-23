'use client';

import React from 'react';
import Link from 'next/link';
import ModernNavbar from './ModernNavbar';
import MainBannerCarousel from '@/components/MainBannerCarousel';
import HitesStyleSection from './HitesStyleSection';
import SecondaryBanner from './SecondaryBanner';
import { mockProducts } from '@/data/mockProducts';
import { useConfig } from '@/hooks/useConfig';
import ProductosDestacados from './ProductosDestacados';

export default function ModernHomepage() {
  const { mainBannerConfig } = useConfig();
  
  // Organizar productos por secciones estilo Hites
  const productsByCategory = mockProducts.reduce((acc, product) => {
    const category = product.categoria;
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof mockProducts>);

  // Config del banner secundario (simulado)
  const secondaryBannerConfig = {
    active: true,
    title: "Ofertas de Temporada",
    subtitle: "Hasta 50% de descuento en productos seleccionados",
    ctaText: "Ver Ofertas",
    ctaLink: "/?filter=ofertas",
    backgroundColor: "#f97316" // orange-500
  };

  // Obtener los más vendidos
  const bestSellers = [...mockProducts]
    .sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Navbar */}
      <ModernNavbar />

      {/* Hero Banner Principal */}
      <div className="pt-16">
        {mainBannerConfig?.active && mainBannerConfig?.slides?.length ? (
          <MainBannerCarousel
            products={[]}
            config={mainBannerConfig}
          />
        ) : (
          <div className="relative w-full h-[180px] sm:h-[280px] md:h-[350px] lg:h-[450px] xl:h-[500px] bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 flex items-center justify-center">
            <div className="text-white text-center px-3 sm:px-6 lg:px-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-1 sm:mb-2 md:mb-4 drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                Importadora F&D
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-medium drop-shadow-xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
                Los mejores productos importados
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Container for all sections - Estilo Hites.cl */}
      <div className="max-w-7xl mx-auto bg-white">
        <ProductosDestacados />

        {/* Tecnología - Estilo Hites */}
        {productsByCategory.tecnologia && productsByCategory.tecnologia.length > 0 && (
          <HitesStyleSection 
            title="Tecnología"
            products={productsByCategory.tecnologia.slice(0, 4)}
            sectionLink="/?category=tecnologia"
          />
        )}

        {/* Calzado - Estilo Hites */}
        {productsByCategory.calzado && productsByCategory.calzado.length > 0 && (
          <HitesStyleSection 
            title="Calzado"
            products={productsByCategory.calzado.slice(0, 4)}
            sectionLink="/?category=calzado"
          />
        )}

        {/* Los Más Vendidos - Estilo Hites */}
        <HitesStyleSection 
          title="Los Más Vendidos"
          products={bestSellers.slice(0, 4)}
          sectionLink="/?filter=popular"
        />

        {/* Ofertas Especiales - Estilo Hites */}
        <HitesStyleSection 
          title="Ofertas Especiales"
          products={mockProducts.filter(p => p.oferta).slice(0, 4)}
          sectionLink="/?filter=ofertas"
        />
      </div>

      {/* Footer Info */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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