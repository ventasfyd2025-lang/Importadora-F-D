'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/types';
import { useStockManager } from './useStockManager';
import { useNotification } from '@/context/NotificationContext';
import { useUserAuth } from './useUserAuth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useCartState() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [reservedOrderId, setReservedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { reserveStock, releaseStock, confirmSale, loading: stockLoading } = useStockManager();
  const { addNotification } = useNotification();
  const { currentUser } = useUserAuth();

  // Load cart from Firebase or localStorage
  useEffect(() => {
    const loadCart = async () => {
      try {
        // Verificar si es un usuario real (no invitado) con uid
        const userId = currentUser && 'uid' in currentUser ? currentUser.uid : null;

        if (userId) {
          // Usuario autenticado - cargar desde Firebase
          const cartRef = doc(db, 'carts', userId);
          const cartDoc = await getDoc(cartRef);

          if (cartDoc.exists()) {
            setItems(cartDoc.data().items || []);
          } else {
            setItems([]);
          }
        } else {
          // Usuario no autenticado o invitado - cargar desde localStorage
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              setItems(JSON.parse(savedCart));
            } catch (error) {
              setItems([]);
            }
          } else {
            setItems([]);
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [currentUser]);

  // Save cart to Firebase or localStorage whenever items change
  useEffect(() => {
    if (isLoading) return; // No guardar durante la carga inicial

    const saveCart = async () => {
      try {
        const userId = currentUser && 'uid' in currentUser ? currentUser.uid : null;

        if (userId) {
          // Usuario autenticado - guardar en Firebase
          const cartRef = doc(db, 'carts', userId);
          await setDoc(cartRef, {
            items,
            updatedAt: new Date()
          });
        } else {
          // Usuario no autenticado - guardar en localStorage
          localStorage.setItem('cart', JSON.stringify(items));
        }
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };

    saveCart();
  }, [items, currentUser, isLoading]);

  const addItem = useCallback((
    productId: string,
    nombre: string,
    precio: number,
    imagen?: string,
    cantidad: number = 1,
    sku?: string,
  ) => {
    let isExisting = false;

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === productId);
      isExisting = !!existingItem;

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

    // Mostrar notificación después de actualizar el estado
    setTimeout(() => {
      if (isExisting) {
        addNotification({
          type: 'success',
          title: 'Producto actualizado',
          message: `Se agregaron ${cantidad} unidad(es) más de ${nombre}`,
          duration: 3000
        });
      } else {
        addNotification({
          type: 'success',
          title: '¡Producto agregado!',
          message: `${nombre} se agregó al carrito`,
          duration: 3000
        });
      }
    }, 0);
  }, [addNotification]);

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

  const clearCart = useCallback(async () => {
    setItems([]);

    const userId = currentUser && 'uid' in currentUser ? currentUser.uid : null;

    // Eliminar carrito de Firebase si el usuario está autenticado
    if (userId) {
      try {
        const cartRef = doc(db, 'carts', userId);
        await deleteDoc(cartRef);
      } catch (error) {
        console.error('Error clearing cart from Firebase:', error);
      }
    }

    // Limpiar localStorage también
    localStorage.removeItem('cart');
  }, [currentUser]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }, [items]);

  // Reserve stock during checkout
  const reserveCartStock = useCallback(async (orderId: string) => {
    if (items.length === 0) return false;

    try {
      const stockItems = items.map(item => ({
        productId: item.productId,
        quantity: item.cantidad,
        productName: item.nombre
      }));

      await reserveStock(stockItems, orderId);
      setReservedOrderId(orderId);
      return true;
    } catch (error) {
      console.error('Error reserving cart stock:', error);
      throw error;
    }
  }, [items, reserveStock]);

  // Release reserved stock (if checkout fails)
  const releaseCartStock = useCallback(async () => {
    if (!reservedOrderId || items.length === 0) return false;

    try {
      const stockItems = items.map(item => ({
        productId: item.productId,
        quantity: item.cantidad,
        productName: item.nombre
      }));

      await releaseStock(stockItems, reservedOrderId);
      setReservedOrderId(null);
      return true;
    } catch (error) {
      console.error('Error releasing cart stock:', error);
      throw error;
    }
  }, [items, reservedOrderId, releaseStock]);

  // Confirm sale (convert reservation to confirmed sale)
  const confirmCartSale = useCallback(async () => {
    if (!reservedOrderId) return false;

    try {
      await confirmSale(reservedOrderId);
      setReservedOrderId(null);
      clearCart(); // Clear cart after successful sale
      return true;
    } catch (error) {
      console.error('Error confirming cart sale:', error);
      throw error;
    }
  }, [reservedOrderId, confirmSale, clearCart]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    reserveCartStock,
    releaseCartStock,
    confirmCartSale,
    reservedOrderId,
    stockLoading
  };
}
