'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, limit, orderBy } from 'firebase/firestore';
import { mockProducts } from '@/data/mockProducts';
import {
  normalizeCategoryValue,
  productMatchesCategory,
  productMatchesSubcategory,
  getProductCategoryCandidates,
  collectCategoryStrings,
} from '@/utils/category';

// Simple in-memory cache
const productCache = new Map<string, { data: Product[], timestamp: number }>();
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    const cacheKey = 'products';

    // Check if we have valid cached data
    const cached = productCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProducts(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Always use Firebase for real products data
      try {
        const productsCollection = collection(db, 'products');
        // Optimize: Limit query to 100 products, ordered by creation date
        const productsQuery = query(
          productsCollection,
          orderBy('fechaCreacion', 'desc'),
          limit(100)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsList = productsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            sku: (data as { sku?: string }).sku || data?.sku || ''
          } as Product;
        });

        // Cache the data
        productCache.set(cacheKey, { data: productsList, timestamp: Date.now() });
        setProducts(productsList);
      } catch (firebaseError) {
        console.warn('Firebase failed, using mock fallback:', firebaseError);
        // Fallback to mock products if Firebase fails
        const productsList = mockProducts.map(product => ({
          id: product.id,
          nombre: product.nombre,
          precio: product.precio,
          descripcion: product.descripcion,
          imagen: product.imagen,
          stock: product.stock,
          categoria: product.categoria,
          nuevo: product.nuevo,
          oferta: product.oferta,
          sku: product.sku || product.id,
          activo: true,
          envioGratis: product.precio > 50000,
          fechaCreacion: '2024-01-15'
        } as Product));

        productCache.set(cacheKey, { data: productsList, timestamp: Date.now() });
        setProducts(productsList);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filterProducts = (searchQuery?: string, category?: string, priceRange?: string, sortBy?: string, subcategory?: string) => {
    let filtered = [...products];

    // Filter out products without stock
    filtered = filtered.filter(product => (product.stock || 0) > 0);

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const normalizedQuery = normalizeCategoryValue(query);
      filtered = filtered.filter(product =>
        (() => {
          const categoryCandidates = getProductCategoryCandidates(product);
          const subcategoryCandidates = collectCategoryStrings(product.subcategoria);
          return (
            (product.nombre || '').toLowerCase().includes(query) ||
            (product.descripcion || '').toLowerCase().includes(query) ||
            categoryCandidates.some(candidate => candidate.toLowerCase().includes(query)) ||
            categoryCandidates.some(candidate => normalizeCategoryValue(candidate).includes(normalizedQuery)) ||
            subcategoryCandidates.some(candidate => candidate.toLowerCase().includes(query)) ||
            (product.sku || '').toLowerCase().includes(query)
          );
        })()
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(product => productMatchesCategory(product, category));
    }

    // Filter by subcategory
    if (subcategory) {
      filtered = filtered.filter(product => productMatchesSubcategory(product, subcategory));
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
    const inStockProducts = products.filter(product => (product.stock || 0) > 0);

    switch (filter) {
      case 'ofertas':
        return inStockProducts.filter(product => product.oferta);
      case 'nuevos':
        return inStockProducts.filter(product => product.nuevo);
      case 'popular':
        return inStockProducts;
      default:
        return inStockProducts;
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(product => product.id !== id));
      
      // Invalidate cache
      productCache.delete('products');
    } catch (error) {
      setError('Error al eliminar el producto');
    }
  };

  const removeProducts = async (ids: string[]) => {
    try {
      const deletePromises = ids.map(id => deleteDoc(doc(db, 'products', id)));
      await Promise.all(deletePromises);
      setProducts(prev => prev.filter(product => !ids.includes(product.id)));
      
      // Invalidate cache
      productCache.delete('products');
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

      // Invalidate cache
      productCache.delete('products');
    } catch (error) {
      setError('Error al actualizar el producto');
    }
  };

  const invalidateCache = () => {
    productCache.delete('products');
    loadProducts();
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
    refetch: loadProducts,
    invalidateCache
  };
}
