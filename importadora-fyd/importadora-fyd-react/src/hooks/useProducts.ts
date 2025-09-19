'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { mockProducts } from '@/utils/mockProducts';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use current products state to maintain deletions
      // If products array is empty, reload from mock data
      if (products.length === 0) {
        setProducts(mockProducts);
      }
    } catch (err) {
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filterProducts = (searchQuery?: string, category?: string, priceRange?: string, sortBy?: string, subcategory?: string) => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        (product.nombre || product.name || '').toLowerCase().includes(query) ||
        (product.descripcion || product.description || '').toLowerCase().includes(query) ||
        (product.categoria || product.category || '').toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(product => 
        (product.categoria || product.category || '').toLowerCase() === category.toLowerCase()
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
        const price = product.precio || product.price || 0;
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
          filtered.sort((a, b) => (a.precio || a.price || 0) - (b.precio || b.price || 0));
          break;
        case 'price-high':
          filtered.sort((a, b) => (b.precio || b.price || 0) - (a.precio || a.price || 0));
          break;
        case 'name':
          filtered.sort((a, b) => (a.nombre || a.name || '').localeCompare(b.nombre || b.name || ''));
          break;
        case 'newest':
          filtered.sort((a, b) => {
            const dateA = new Date(a.fechaCreacion || a.createdAt || 0);
            const dateB = new Date(b.fechaCreacion || b.createdAt || 0);
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
        const ofertas = products.filter(product => product.oferta || product.onSale);
        return ofertas;
      case 'nuevos':
        const nuevos = products.filter(product => product.nuevo || product.isNew);
        return nuevos;
      case 'popular':
        // For now, return all products - could be enhanced with actual popularity data
        return products;
      default:
        return products;
    }
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const removeProducts = (ids: string[]) => {
    setProducts(prev => prev.filter(product => !ids.includes(product.id)));
  };

  const updateProduct = (id: string, updatedData: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, ...updatedData } : product
    ));
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