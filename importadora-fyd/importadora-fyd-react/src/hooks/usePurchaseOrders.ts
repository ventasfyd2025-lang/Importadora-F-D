'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PurchaseOrder, B2BCustomer, PurchaseOrderItem, B2BQuote } from '@/types';

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [b2bCustomers, setB2bCustomers] = useState<B2BCustomer[]>([]);
  const [quotes, setQuotes] = useState<B2BQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load B2B customers
  const loadB2BCustomers = useCallback(async () => {
    try {
      const customersQuery = query(
        collection(db, 'b2b_customers'),
        orderBy('companyName')
      );
      const snapshot = await getDocs(customersQuery);
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as B2BCustomer[];

      setB2bCustomers(customers);
    } catch (error) {
      console.error('Error loading B2B customers:', error);
      setError('Error cargando clientes B2B');
    }
  }, []);

  // Load purchase orders
  const loadPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const ordersQuery = query(
        collection(db, 'purchase_orders'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(ordersQuery);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PurchaseOrder[];

      setPurchaseOrders(orders);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      setError('Error cargando órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load quotes
  const loadQuotes = useCallback(async () => {
    try {
      const quotesQuery = query(
        collection(db, 'b2b_quotes'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(quotesQuery);
      const quotesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as B2BQuote[];

      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading quotes:', error);
      setError('Error cargando cotizaciones');
    }
  }, []);

  // Generate PO number
  const generatePONumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const poQuery = query(
      collection(db, 'purchase_orders'),
      where('poNumber', '>=', `PO-${year}-0000`),
      where('poNumber', '<', `PO-${year + 1}-0000`),
      orderBy('poNumber', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(poQuery);
    let nextNumber = 1;

    if (!snapshot.empty) {
      const lastPO = snapshot.docs[0].data();
      const lastNumber = parseInt(lastPO.poNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `PO-${year}-${nextNumber.toString().padStart(4, '0')}`;
  };

  // Generate Quote number
  const generateQuoteNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const quoteQuery = query(
      collection(db, 'b2b_quotes'),
      where('quoteNumber', '>=', `QT-${year}-0000`),
      where('quoteNumber', '<', `QT-${year + 1}-0000`),
      orderBy('quoteNumber', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(quoteQuery);
    let nextNumber = 1;

    if (!snapshot.empty) {
      const lastQuote = snapshot.docs[0].data();
      const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `QT-${year}-${nextNumber.toString().padStart(4, '0')}`;
  };

  // Create B2B customer
  const createB2BCustomer = async (customerData: Omit<B2BCustomer, 'id' | 'registrationDate' | 'totalOrders' | 'totalValue'>) => {
    try {
      setLoading(true);

      const newCustomer = {
        ...customerData,
        registrationDate: new Date().toISOString(),
        totalOrders: 0,
        totalValue: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'b2b_customers'), newCustomer);
      await loadB2BCustomers(); // Refresh list

      return docRef.id;
    } catch (error) {
      console.error('Error creating B2B customer:', error);
      throw new Error('Error al crear cliente B2B');
    } finally {
      setLoading(false);
    }
  };

  // Create purchase order
  const createPurchaseOrder = async (
    customerId: string,
    items: PurchaseOrderItem[],
    orderData: Partial<PurchaseOrder>,
    userId: string
  ) => {
    try {
      setLoading(true);

      const customer = b2bCustomers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Cliente no encontrado');
      }

      const poNumber = await generatePONumber();

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = orderData.discount || 0;
      const discountAmount = typeof discount === 'number' ?
        (discount > 100 ? discount : subtotal * (discount / 100)) : 0;
      const taxableAmount = subtotal - discountAmount;
      const taxes = taxableAmount * 0.19; // 19% IVA Chile
      const shipping = orderData.shipping || 0;
      const total = taxableAmount + taxes + shipping;

      const newPO: Omit<PurchaseOrder, 'id'> = {
        poNumber,
        customerId,
        customerInfo: customer,
        items,
        subtotal,
        discount: discountAmount,
        taxes,
        shipping,
        total,
        status: 'draft',
        paymentTerms: orderData.paymentTerms || `Net ${customer.creditTerms}`,
        paymentStatus: 'pending',
        requestedDeliveryDate: orderData.requestedDeliveryDate,
        shippingAddress: orderData.shippingAddress ||
          `${customer.address.street}, ${customer.address.city}, ${customer.address.region} ${customer.address.postalCode}`,
        notes: orderData.notes || '',
        internalNotes: orderData.internalNotes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId
      };

      const docRef = await addDoc(collection(db, 'purchase_orders'), {
        ...newPO,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await loadPurchaseOrders(); // Refresh list

      return docRef.id;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw new Error('Error al crear orden de compra');
    } finally {
      setLoading(false);
    }
  };

  // Create quote
  const createQuote = async (
    customerId: string,
    items: PurchaseOrderItem[],
    quoteData: Partial<B2BQuote>,
    userId: string
  ) => {
    try {
      setLoading(true);

      const customer = b2bCustomers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Cliente no encontrado');
      }

      const quoteNumber = await generateQuoteNumber();

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = quoteData.discount || 0;
      const discountAmount = typeof discount === 'number' ?
        (discount > 100 ? discount : subtotal * (discount / 100)) : 0;
      const taxableAmount = subtotal - discountAmount;
      const taxes = taxableAmount * 0.19; // 19% IVA Chile
      const shipping = quoteData.shipping || 0;
      const total = taxableAmount + taxes + shipping;

      // Default valid for 30 days
      const validUntil = quoteData.validUntil ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const newQuote: Omit<B2BQuote, 'id'> = {
        quoteNumber,
        customerId,
        customerInfo: customer,
        items,
        subtotal,
        discount: discountAmount,
        taxes,
        shipping,
        total,
        validUntil,
        status: 'draft',
        notes: quoteData.notes || '',
        terms: quoteData.terms || 'Esta cotización es válida por 30 días.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId
      };

      const docRef = await addDoc(collection(db, 'b2b_quotes'), {
        ...newQuote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await loadQuotes(); // Refresh list

      return docRef.id;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw new Error('Error al crear cotización');
    } finally {
      setLoading(false);
    }
  };

  // Update purchase order status
  const updatePOStatus = async (poId: string, status: PurchaseOrder['status'], userId?: string) => {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (status === 'confirmed' && userId) {
        updateData.approvedBy = userId;
        updateData.approvalDate = serverTimestamp();
      }

      if (status === 'delivered') {
        updateData.actualDeliveryDate = serverTimestamp();
      }

      await updateDoc(doc(db, 'purchase_orders', poId), updateData);
      await loadPurchaseOrders(); // Refresh list

      return true;
    } catch (error) {
      console.error('Error updating PO status:', error);
      throw new Error('Error al actualizar estado de la orden');
    }
  };

  // Convert quote to purchase order
  const convertQuoteToPO = async (quoteId: string, userId: string) => {
    try {
      setLoading(true);

      await runTransaction(db, async (transaction) => {
        // Get quote
        const quoteRef = doc(db, 'b2b_quotes', quoteId);
        const quoteDoc = await transaction.get(quoteRef);

        if (!quoteDoc.exists()) {
          throw new Error('Cotización no encontrada');
        }

        const quote = { id: quoteDoc.id, ...quoteDoc.data() } as B2BQuote;

        // Generate PO number
        const poNumber = await generatePONumber();

        // Create PO from quote
        const newPO: Omit<PurchaseOrder, 'id'> = {
          poNumber,
          customerId: quote.customerId,
          customerInfo: quote.customerInfo,
          items: quote.items,
          subtotal: quote.subtotal,
          discount: quote.discount,
          taxes: quote.taxes,
          shipping: quote.shipping,
          total: quote.total,
          status: 'pending',
          paymentTerms: `Net ${quote.customerInfo.creditTerms}`,
          paymentStatus: 'pending',
          shippingAddress: `${quote.customerInfo.address.street}, ${quote.customerInfo.address.city}, ${quote.customerInfo.address.region} ${quote.customerInfo.address.postalCode}`,
          notes: quote.notes || '',
          internalNotes: `Convertido desde cotización ${quote.quoteNumber}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userId
        };

        // Add PO
        const poRef = doc(collection(db, 'purchase_orders'));
        transaction.set(poRef, {
          ...newPO,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update quote status
        transaction.update(quoteRef, {
          status: 'accepted',
          convertedToPO: poRef.id,
          updatedAt: serverTimestamp()
        });

        return poRef.id;
      });

      await loadPurchaseOrders();
      await loadQuotes();

      return true;
    } catch (error) {
      console.error('Error converting quote to PO:', error);
      throw new Error('Error al convertir cotización a orden de compra');
    } finally {
      setLoading(false);
    }
  };

  // Delete purchase order
  const deletePurchaseOrder = async (poId: string) => {
    try {
      await deleteDoc(doc(db, 'purchase_orders', poId));
      await loadPurchaseOrders();
      return true;
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw new Error('Error al eliminar orden de compra');
    }
  };

  // Delete quote
  const deleteQuote = async (quoteId: string) => {
    try {
      await deleteDoc(doc(db, 'b2b_quotes', quoteId));
      await loadQuotes();
      return true;
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw new Error('Error al eliminar cotización');
    }
  };

  // Load data on mount (only when authenticated)
  useEffect(() => {
    if (user) {
      loadB2BCustomers();
      loadPurchaseOrders();
      loadQuotes();
    }
  }, [user, loadB2BCustomers, loadPurchaseOrders, loadQuotes]);

  return {
    purchaseOrders,
    b2bCustomers,
    quotes,
    loading,
    error,
    createB2BCustomer,
    createPurchaseOrder,
    createQuote,
    updatePOStatus,
    convertQuoteToPO,
    deletePurchaseOrder,
    deleteQuote,
    refreshData: () => {
      loadB2BCustomers();
      loadPurchaseOrders();
      loadQuotes();
    }
  };
}