'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function TestHeaderPage() {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const measureHeader = () => {
      const header = document.querySelector('header');
      if (header) {
        const height = header.offsetHeight;
        const width = window.innerWidth;
        setHeaderHeight(height);
        setWindowWidth(width);
        console.log(`Header height: ${height}px at window width: ${width}px`);
      }
    };

    // Measure on load
    measureHeader();

    // Measure on resize
    window.addEventListener('resize', measureHeader);

    return () => window.removeEventListener('resize', measureHeader);
  }, []);

  return (
    <Layout>
      <div className="p-8 space-y-4">
        <h1 className="text-3xl font-bold text-red-600">TEST HEADER HEIGHT</h1>
        <div className="bg-yellow-200 p-4 rounded">
          <p><strong>Header height:</strong> {headerHeight}px</p>
          <p><strong>Window width:</strong> {windowWidth}px</p>
          <p><strong>Current Layout padding:</strong> pt-44 sm:pt-36 lg:pt-32</p>
          <p><strong>pt-44 =</strong> 176px</p>
          <p><strong>pt-36 =</strong> 144px</p>
          <p><strong>pt-32 =</strong> 128px</p>
        </div>
        <div className="bg-red-200 p-4 rounded">
          <p>Si ves este texto completamente, el spacing está funcionando.</p>
          <p>Si el header lo tapa, necesitamos más padding.</p>
        </div>
      </div>
    </Layout>
  );
}