'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface CartButtonProps {
  totalItems: number;
}

const CartButton = memo(function CartButton({ totalItems }: CartButtonProps) {
  return (
    <Link
      href="/carrito"
      className="relative inline-flex items-center p-2 text-gray-700 hover:text-orange-600 transition-colors"
      aria-label="Carrito de compras"
    >
      <ShoppingCartIcon className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
});

export default CartButton;
