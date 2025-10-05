'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  updateDoc,
  runTransaction,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { Product } from '@/types';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  severity: 'low' | 'critical' | 'out';
  createdAt: string;
  acknowledged: boolean;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'reservation' | 'release';
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  userId?: string;
  reason?: string;
  createdAt: string;
}

export function useStockManager() {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Listen to stock alerts in real-time (only when authenticated)
  useEffect(() => {
    if (!user) return;

    const alertsQuery = query(
      collection(db, 'stock_alerts'),
      where('acknowledged', '==', false)
    );

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockAlert[];

      setStockAlerts(alerts);
    }, (error) => {
      console.log('Stock alerts listener error (expected if not authenticated):', error.code);
    });

    return () => unsubscribe();
  }, [user]);

  // Reserve stock for a cart (during checkout)
  const reserveStock = useCallback(async (items: { productId: string; quantity: number; productName: string }[], orderId: string) => {
    try {
      setLoading(true);

      await runTransaction(db, async (transaction) => {
        const reservations = [];

        // PASO 1: Hacer TODAS las lecturas primero
        const productsData = [];
        for (const item of items) {
          const productRef = doc(db, 'products', item.productId);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists()) {
            throw new Error(`Producto ${item.productName} no encontrado`);
          }

          const currentStock = productDoc.data().stock || 0;

          if (currentStock < item.quantity) {
            throw new Error(`Stock insuficiente para ${item.productName}. Disponible: ${currentStock}, Solicitado: ${item.quantity}`);
          }

          const minStock = productDoc.data().minStock || 5;

          productsData.push({
            ref: productRef,
            item,
            currentStock,
            minStock
          });
        }

        // PASO 2: Hacer TODAS las escrituras después
        for (const { ref: productRef, item, currentStock, minStock } of productsData) {
          const newStock = currentStock - item.quantity;

          // Update product stock
          transaction.update(productRef, { stock: newStock });

          // Log transaction
          const transactionRef = doc(collection(db, 'stock_transactions'));
          transaction.set(transactionRef, {
            productId: item.productId,
            productName: item.productName,
            type: 'reservation',
            quantity: -item.quantity,
            previousStock: currentStock,
            newStock: newStock,
            orderId: orderId,
            createdAt: serverTimestamp()
          });

          reservations.push({
            productId: item.productId,
            quantity: item.quantity,
            reservedStock: newStock
          });

          // Check if we need to create a stock alert
          if (newStock <= minStock) {
            const alertRef = doc(collection(db, 'stock_alerts'));
            transaction.set(alertRef, {
              productId: item.productId,
              productName: item.productName,
              currentStock: newStock,
              minStock: minStock,
              severity: newStock === 0 ? 'out' : newStock <= minStock / 2 ? 'critical' : 'low',
              acknowledged: false,
              createdAt: serverTimestamp()
            });
          }
        }

        return reservations;
      });

      return true;
    } catch (error) {
      console.error('Error reserving stock:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Release reserved stock (if order cancelled)
  const releaseStock = useCallback(async (items: { productId: string; quantity: number; productName: string }[], orderId: string) => {
    try {
      setLoading(true);

      await runTransaction(db, async (transaction) => {
        for (const item of items) {
          const productRef = doc(db, 'products', item.productId);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists()) {
            continue; // Skip if product doesn't exist
          }

          const currentStock = productDoc.data().stock || 0;
          const newStock = currentStock + item.quantity;

          // Update product stock
          transaction.update(productRef, { stock: newStock });

          // Log transaction
          const transactionRef = doc(collection(db, 'stock_transactions'));
          transaction.set(transactionRef, {
            productId: item.productId,
            productName: item.productName,
            type: 'release',
            quantity: item.quantity,
            previousStock: currentStock,
            newStock: newStock,
            orderId: orderId,
            createdAt: serverTimestamp()
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Error releasing stock:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Confirm sale (convert reservation to sale)
  const confirmSale = useCallback(async (orderId: string) => {
    try {
      setLoading(true);

      // Update transaction types from 'reservation' to 'sale'
      const transactionsQuery = query(
        collection(db, 'stock_transactions'),
        where('orderId', '==', orderId),
        where('type', '==', 'reservation')
      );

      const snapshot = await getDocs(transactionsQuery);

      const batch: Promise<void>[] = [];
      snapshot.forEach((doc) => {
        batch.push(updateDoc(doc.ref, { type: 'sale' }));
      });

      await Promise.all(batch);

      return true;
    } catch (error) {
      console.error('Error confirming sale:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual stock adjustment
  const adjustStock = useCallback(async (productId: string, productName: string, newStock: number, reason: string) => {
    try {
      setLoading(true);

      await runTransaction(db, async (transaction) => {
        // PASO 1: Hacer todas las lecturas primero
        const productRef = doc(db, 'products', productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error('Producto no encontrado');
        }

        const currentStock = productDoc.data().stock || 0;
        const minStock = productDoc.data().minStock || 5;
        const difference = newStock - currentStock;

        // PASO 2: Hacer todas las escrituras después
        // Update product stock
        transaction.update(productRef, { stock: newStock });

        // Log transaction
        const transactionRef = doc(collection(db, 'stock_transactions'));
        transaction.set(transactionRef, {
          productId,
          productName,
          type: 'adjustment',
          quantity: difference,
          previousStock: currentStock,
          newStock: newStock,
          reason,
          createdAt: serverTimestamp()
        });

        // Check for stock alerts
        if (newStock <= minStock) {
          const alertRef = doc(collection(db, 'stock_alerts'));
          transaction.set(alertRef, {
            productId,
            productName,
            currentStock: newStock,
            minStock,
            severity: newStock === 0 ? 'out' : newStock <= minStock / 2 ? 'critical' : 'low',
            acknowledged: false,
            createdAt: serverTimestamp()
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Restock products
  const restockProduct = useCallback(async (productId: string, productName: string, quantity: number, reason?: string) => {
    try {
      setLoading(true);

      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error('Producto no encontrado');
        }

        const currentStock = productDoc.data().stock || 0;
        const newStock = currentStock + quantity;

        // Update product stock
        transaction.update(productRef, { stock: newStock });

        // Log transaction
        const transactionRef = doc(collection(db, 'stock_transactions'));
        transaction.set(transactionRef, {
          productId,
          productName,
          type: 'restock',
          quantity,
          previousStock: currentStock,
          newStock: newStock,
          reason: reason || 'Reposición de inventario',
          createdAt: serverTimestamp()
        });
      });

      return true;
    } catch (error) {
      console.error('Error restocking product:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Acknowledge stock alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const alertRef = doc(db, 'stock_alerts', alertId);
      await updateDoc(alertRef, { acknowledged: true });

      setStockAlerts(prev => prev.filter(alert => alert.id !== alertId));

      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }, []);

  // Get stock transactions for a product
  const getProductTransactions = useCallback(async (productId: string, limit = 50) => {
    try {
      const transactionsQuery = query(
        collection(db, 'stock_transactions'),
        where('productId', '==', productId)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockTransaction[];

      // Sort by date descending
      transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return transactions.slice(0, limit);
    } catch (error) {
      console.error('Error getting product transactions:', error);
      return [];
    }
  }, []);

  return {
    stockAlerts,
    transactions,
    loading,
    reserveStock,
    releaseStock,
    confirmSale,
    adjustStock,
    restockProduct,
    acknowledgeAlert,
    getProductTransactions
  };
}