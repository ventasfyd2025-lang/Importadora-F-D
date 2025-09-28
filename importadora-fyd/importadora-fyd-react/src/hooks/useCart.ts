'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/types';

export function useCartState() {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial load
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        // Error loading cart from localStorage
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((
    productId: string,
    nombre: string,
    precio: number,
    imagen?: string,
    cantidad: number = 1,
    sku?: string,
  ) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === productId);

      if (existingItem) {
        return prevItems.map(item =>
          item.productId === productId
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: `${Date.now()}-${productId}-${cantidad}`,
          productId,
          nombre,
          precio,
          cantidad,
          imagen,
          sku,
        };
        return [...prevItems, newItem];
      }
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, cantidad }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
}
