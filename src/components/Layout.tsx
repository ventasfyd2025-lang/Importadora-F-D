'use client';

import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationDisplay from './NotificationDisplay';

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
    <NotificationProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full" style={{ paddingTop: `${paddingTop}px` }}>
          {children}
        </main>
        <Footer />
        <NotificationDisplay />
      </div>
    </NotificationProvider>
  );
}