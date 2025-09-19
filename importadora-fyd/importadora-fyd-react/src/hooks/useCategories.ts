'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  'electronicos': '💻',
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
            setLoading(false);
          },
          (error) => {
            console.error('Error loading categories:', error);
            // Fallback to default categories on error
            setCategories(defaultCategories);
            setError('Error al cargar categorías');
            setLoading(false);
          }
        );

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up categories listener:', error);
        setCategories(defaultCategories);
        setError('Error al cargar categorías');
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
    } catch (error) {
      console.error('Error refetching categories:', error);
      setError('Error al recargar categorías');
    }
  };

  return {
    categories,
    loading,
    error,
    refetch
  };
}