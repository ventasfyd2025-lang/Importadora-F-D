'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import HeaderClient from './HeaderClient';

const HeaderFallback = () => (
  <header className="bg-white shadow-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-2xl">🏪</div>
          <span className="text-xl font-bold text-gray-900">FC Factory</span>
        </Link>
        <div className="flex items-center">
          <Link href="/carrito" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
            <ShoppingCartIcon className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  </header>
);

export default function HeaderWrapper() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderClient />
    </Suspense>
  );
}