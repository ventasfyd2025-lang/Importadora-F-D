'use client';

import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [paddingTop, setPaddingTop] = useState(0); 

  useEffect(() => {
    const headerElement = document.getElementById('main-header');
    
    if (!headerElement) return;

    const updatePadding = () => {
      setPaddingTop(headerElement.offsetHeight);
    };

    const resizeObserver = new ResizeObserver(updatePadding);
    resizeObserver.observe(headerElement);

    updatePadding();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="min-h-screen" style={{ paddingTop: `${paddingTop}px` }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}