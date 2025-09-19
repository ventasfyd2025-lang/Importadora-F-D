'use client';

import { CartProvider } from '@/context/CartContext';

export default function CartProviderClient({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}