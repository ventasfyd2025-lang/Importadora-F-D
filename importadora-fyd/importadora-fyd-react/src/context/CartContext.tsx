'use client';

import React, { createContext, useContext } from 'react';
import { useCartState } from '@/hooks/useCart';
import { CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, nombre: string, precio: number, imagen?: string, cantidad?: number, sku?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, cantidad: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  reserveCartStock: (orderId: string) => Promise<boolean>;
  releaseCartStock: () => Promise<boolean>;
  confirmCartSale: () => Promise<boolean>;
  reservedOrderId: string | null;
  stockLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cartState = useCartState();

  return (
    <CartContext.Provider value={cartState}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
