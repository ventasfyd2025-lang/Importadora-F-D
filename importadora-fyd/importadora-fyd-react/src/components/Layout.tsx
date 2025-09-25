'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="min-h-screen pt-44 sm:pt-36 lg:pt-32">
        {children}
      </main>
      <Footer />
    </div>
  );
}