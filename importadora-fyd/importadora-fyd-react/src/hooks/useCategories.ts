'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mockProducts } from '@/data/mockProducts';

export interface Category {
  id: string;
  name: string;
  active: boolean;
  icon?: string;
  subcategorias?: Array<{
    id: string;
    nombre: string;
    activa: boolean;
  }>;
}

const defaultCategories: Category[] = [
  { id: 'all', name: 'Todos los productos', active: true, icon: '🏪' },
];

// Icon mapping for common categories
const categoryIcons: Record<string, string> = {
  'calzado': '👟',
  'tecnología': '💻',
  'electro hogar': '🏠',
  'moda': '👕',
  'hogar': '🏠',
  'ropa': '👕',
  'deportes': '🏃‍♂️',
  'cocina': '🍳',
  'muebles': '🪑',
  'belleza': '💄',
  'libros': '📚',
  'juguetes': '🧸',
  'musica': '🎵',
  'automovil': '🚗',
  'jardin': '🌱'
};

// Generate categories from mock products
const generateCategoriesFromProducts = (): Category[] => {
  const uniqueCategories = [...new Set(mockProducts.map(p => p.categoria))];
  const productCategories: Category[] = uniqueCategories
    .filter(cat => cat)
    .map((category, index) => ({
      id: category.toLowerCase().replace(/\s+/g, '-'),
      name: category,
      active: true,
      icon: categoryIcons[category.toLowerCase()] || '📦'
    }));
  
  return [
    defaultCategories[0], // "Todos los productos"
    ...productCategories
  ];
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Set up real-time listener for categories
        const unsubscribe = onSnapshot(
          collection(db, 'categorias'),
          (snapshot) => {
            // If we have categories in Firebase, use them
            if (!snapshot.empty) {
              const firebaseCategories: Category[] = [];
              
              snapshot.forEach((doc) => {
                const data = doc.data();
                firebaseCategories.push({
                  id: doc.id,
                  name: data.name || data.nombre || doc.id,
                  active: data.active !== undefined ? data.active : true,
                  icon: categoryIcons[doc.id] || '📦',
                  subcategorias: data.subcategorias || []
                });
              });

              // Filter only active categories and sort them
              const activeCategories = firebaseCategories
                .filter(cat => cat.active)
                .sort((a, b) => a.name.localeCompare(b.name));

              // Always include "Todos los productos" at the beginning
              const allCategories = [
                defaultCategories[0], // "Todos los productos"
                ...activeCategories
              ];

              setCategories(allCategories);
            } else {
              // If no categories in Firebase, generate from mock products
              const generatedCategories = generateCategoriesFromProducts();
              setCategories(generatedCategories);
            }
            
            setLoading(false);
          },
          (error) => {
            console.error('Error loading categories:', error);
            // Fallback to generated categories from products on error
            const generatedCategories = generateCategoriesFromProducts();
            setCategories(generatedCategories);
            setError('Error al cargar categorías, usando categorías generadas');
            setLoading(false);
          }
        );

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up categories listener:', error);
        // Fallback to generated categories from products
        const generatedCategories = generateCategoriesFromProducts();
        setCategories(generatedCategories);
        setError('Error al cargar categorías, usando categorías generadas');
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    const unsubscribe = loadCategories();
    
    // Cleanup function
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const refetch = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'categorias'));
      
      // If we have categories in Firebase, use them
      if (!snapshot.empty) {
        const firebaseCategories: Category[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          firebaseCategories.push({
            id: doc.id,
            name: data.name || data.nombre || doc.id,
            active: data.active !== undefined ? data.active : true,
            icon: categoryIcons[doc.id] || '📦',
            subcategorias: data.subcategorias || []
          });
        });

        const activeCategories = firebaseCategories
          .filter(cat => cat.active)
          .sort((a, b) => a.name.localeCompare(b.name));

        const allCategories = [
          defaultCategories[0],
          ...activeCategories
        ];

        setCategories(allCategories);
      } else {
        // If no categories in Firebase, generate from mock products
        const generatedCategories = generateCategoriesFromProducts();
        setCategories(generatedCategories);
      }
    } catch (error) {
      console.error('Error refetching categories:', error);
      // Fallback to generated categories from products
      const generatedCategories = generateCategoriesFromProducts();
      setCategories(generatedCategories);
      setError('Error al recargar categorías, usando categorías generadas');
    }
  };

  return {
    categories,
    loading,
    error,
    refetch
  };
}