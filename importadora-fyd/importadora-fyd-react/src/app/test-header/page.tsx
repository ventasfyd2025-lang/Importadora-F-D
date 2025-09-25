'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function TestHeaderPage() {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const [computedPadding, setComputedPadding] = useState('');

  useEffect(() => {
    const measureHeader = () => {
      const header = document.querySelector('header');
      const main = document.querySelector('main');

      if (header && main) {
        const headerHeight = header.offsetHeight;
        const width = window.innerWidth;
        const mainStyles = window.getComputedStyle(main);
        const paddingTop = mainStyles.paddingTop;

        setHeaderHeight(headerHeight);
        setWindowWidth(width);
        setComputedPadding(paddingTop);

        console.log(`Header height: ${headerHeight}px at window width: ${width}px`);
        console.log(`Main padding-top: ${paddingTop}`);
        console.log(`Header bounds:`, header.getBoundingClientRect());
      }
    };

    // Measure on load
    setTimeout(measureHeader, 100); // Small delay to ensure DOM is ready
    measureHeader();

    // Measure on resize
    window.addEventListener('resize', measureHeader);

    return () => window.removeEventListener('resize', measureHeader);
  }, []);

  return (
    <>
      {/* Fixed debug info */}
      <div className="fixed top-0 right-0 z-[9999] bg-black text-white p-2 text-xs">
        <div>Header: {headerHeight}px</div>
        <div>Width: {windowWidth}px</div>
        <div>Padding: {computedPadding}</div>
      </div>

      <Layout>
        <div className="space-y-4">
          <div className="bg-red-500 text-white p-4 text-center text-xl font-bold">
            ¿VES ESTE TEXTO COMPLETAMENTE?
          </div>
          <div className="bg-yellow-200 p-4 rounded">
            <h1 className="text-2xl font-bold text-red-600 mb-4">DEBUG HEADER</h1>
            <p><strong>Header height:</strong> {headerHeight}px</p>
            <p><strong>Window width:</strong> {windowWidth}px</p>
            <p><strong>Computed main padding-top:</strong> {computedPadding}</p>
            <p><strong>Current Layout classes:</strong> pt-52 sm:pt-36 lg:pt-32</p>
            <div className="mt-4 text-sm">
              <p>pt-52 = 208px (móvil)</p>
              <p>pt-36 = 144px (tablet)</p>
              <p>pt-32 = 128px (desktop)</p>
            </div>
          </div>

          <div className="bg-red-200 p-8 rounded text-center">
            <h2 className="text-xl font-bold mb-4">PRUEBA DE VISIBILIDAD</h2>
            <p className="text-lg">Si el header TAPA este texto, el problema persiste.</p>
            <p className="text-lg">Si ves todo, ¡está arreglado!</p>
          </div>

          {/* Simular contenido del carrito */}
          <div className="bg-blue-100 p-4 rounded">
            <h3 className="font-bold text-lg mb-2">Simulación Carrito:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="h-32 bg-gray-200 rounded mb-2"></div>
                <h4 className="font-semibold">Producto de prueba</h4>
                <p className="text-gray-600">$15.000</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}