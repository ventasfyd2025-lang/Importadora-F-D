'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

interface CartButtonProps {
  totalItems: number;
}

const CartButton = memo(function CartButton({ totalItems }: CartButtonProps) {
  return (
    <Link
      href="/carrito"
      className="relative inline-flex items-center p-2 text-gray-700 hover:text-orange-600 transition-all duration-200 hover:scale-110"
      aria-label="Carrito de compras"
    >
      <ShoppingCart className="h-6 w-6" strokeWidth={2.5} />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
});

export default CartButton;
