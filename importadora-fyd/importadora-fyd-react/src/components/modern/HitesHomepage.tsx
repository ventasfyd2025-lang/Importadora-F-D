'use client';

import React from 'react';
import HitesHeader from './HitesHeader';
import HeroBanner from './HeroBanner';
import MasonryProductGrid from '@/components/MasonryProductGrid'; // Import MasonryProductGrid
import { mockProducts } from '@/data/mockProducts';
import Link from 'next/link';

export default function HitesHomepage() {
  // Organize products by category for the sections
  const productsByCategory = mockProducts.reduce((acc, product) => {
    const category = product.categoria;
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof mockProducts>);

  const bestSellers = [...mockProducts]
    .sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount))
    .slice(0, 8);

  return (
    <div className="bg-white">
      <HitesHeader />

      {/* Add a top margin to the body content to account for the fixed header */}
      <main className="pt-32"> {/* Adjust this value based on the actual height of your fixed header */}
        
        <HeroBanner 
          title="Cyber Day"
          subtitle="¡Miles de productos con descuentos increíbles!"
          ctaText="Ver Ofertas"
          ctaLink="/?filter=ofertas"
        />

        <div className="max-w-7xl mx-auto">
          {/* Electrodomésticos Section */}
          {productsByCategory.electrodomesticos && productsByCategory.electrodomesticos.length > 0 && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 px-4 sm:px-6 lg:px-8">Electrodomésticos</h2>
              <MasonryProductGrid 
                products={productsByCategory.electrodomesticos.slice(0, 8)} // Show more products in masonry
              />
            </>
          )}

          {/* Tecnología Section */}
          {productsByCategory.tecnologia && productsByCategory.tecnologia.length > 0 && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 px-4 sm:px-6 lg:px-8 mt-12">Tecnología</h2>
              <MasonryProductGrid 
                products={productsByCategory.tecnologia.slice(0, 8)}
              />
            </>
          )}

          {/* Los Más Vendidos Section */}
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 px-4 sm:px-6 lg:px-8 mt-12">Los más vendidos</h2>
            <MasonryProductGrid 
              products={bestSellers.slice(0, 8)}
            />
          </>

          {/* Calzado Section */}
          {productsByCategory.calzado && productsByCategory.calzado.length > 0 && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 px-4 sm:px-6 lg:px-8 mt-12">Calzado</h2>
              <MasonryProductGrid 
                products={productsByCategory.calzado.slice(0, 8)}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-gray-100 text-gray-600 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-gray-800">Importadora F&D</h3>
                <p className="text-sm">
                  Tu tienda online de confianza con los mejores productos importados.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-gray-800">Productos</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/?filter=ofertas" className="hover:text-hites-blue transition-colors">Ofertas</Link></li>
                  <li><Link href="/?filter=nuevos" className="hover:text-hites-blue transition-colors">Nuevos</Link></li>
                  <li><Link href="/?filter=popular" className="hover:text-hites-blue transition-colors">Más Vendidos</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-gray-800">Ayuda</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="#" className="hover:text-hites-blue transition-colors">Centro de Ayuda</Link></li>
                  <li><Link href="#" className="hover:text-hites-blue transition-colors">Envíos</Link></li>
                  <li><Link href="#" className="hover:text-hites-blue transition-colors">Devoluciones</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-gray-800">Contacto</h3>
                <ul className="space-y-2 text-sm">
                  <li>📞 +1 234 567 890</li>
                  <li>📧 info@importadorafyd.com</li>
                  <li>📍 Calle Principal 123, Ciudad</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm">
              <p>&copy; 2024 Importadora F&D. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}