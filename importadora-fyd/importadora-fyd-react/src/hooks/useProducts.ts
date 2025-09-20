'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      setProducts(productsList);
    } catch (err) {
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filterProducts = (searchQuery?: string, category?: string, priceRange?: string, sortBy?: string, subcategory?: string) => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        (product.nombre || '').toLowerCase().includes(query) ||
        (product.descripcion || '').toLowerCase().includes(query) ||
        (product.categoria || '').toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(product =>
        (product.categoria || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by subcategory
    if (subcategory) {
      filtered = filtered.filter(product =>
        (product.subcategoria || '').toLowerCase() === subcategory.toLowerCase()
      );
    }

    // Filter by price range
    if (priceRange && priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(p => p === '+' ? Infinity : parseInt(p));
      filtered = filtered.filter(product => {
        const price = product.precio || 0;
        if (max === Infinity) {
          return price >= min;
        }
        return price >= min && price <= max;
      });
    }

    // Sort products
    if (sortBy) {
      switch (sortBy) {
        case 'price-low':
          filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
          break;
        case 'price-high':
          filtered.sort((a, b) => (b.precio || 0) - (a.precio || 0));
          break;
        case 'name':
          filtered.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
          break;
        case 'newest':
          filtered.sort((a, b) => {
            const dateA = new Date(a.fechaCreacion || 0);
            const dateB = new Date(b.fechaCreacion || 0);
            return dateB.getTime() - dateA.getTime();
          });
          break;
        default:
          break;
      }
    }

    return filtered;
  };

  const getProductsByFilter = (filter: string) => {
    switch (filter) {
      case 'ofertas':
        return products.filter(product => product.oferta);
      case 'nuevos':
        return products.filter(product => product.nuevo);
      case 'popular':
        return products;
      default:
        return products;
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (error) {
      setError('Error al eliminar el producto');
    }
  };

  const removeProducts = async (ids: string[]) => {
    try {
      const deletePromises = ids.map(id => deleteDoc(doc(db, 'products', id)));
      await Promise.all(deletePromises);
      setProducts(prev => prev.filter(product => !ids.includes(product.id)));
    } catch (error) {
      setError('Error al eliminar los productos');
    }
  };

  const updateProduct = async (id: string, updatedData: Partial<Product>) => {
    try {
      const productDoc = doc(db, 'products', id);
      await updateDoc(productDoc, updatedData);
      setProducts(prev => prev.map(product =>
        product.id === id ? { ...product, ...updatedData } : product
      ));
    } catch (error) {
      setError('Error al actualizar el producto');
    }
  };

  return {
    products,
    loading,
    error,
    filterProducts,
    getProductsByFilter,
    removeProduct,
    removeProducts,
    updateProduct,
    refetch: loadProducts
  };
}