'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProductSection {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: string;
  selectedProducts: string[];
  categoryId?: string;
}

const defaultSections: ProductSection[] = [
  {
    id: 'destacados',
    name: 'Productos Destacados',
    description: 'Primera sección en la página principal',
    enabled: true,
    type: 'featured',
    selectedProducts: []
  },
  {
    id: 'vendidos',
    name: 'Los Más Vendidos',
    description: 'Productos con mejor desempeño',
    enabled: true,
    type: 'bestsellers',
    selectedProducts: []
  },
  {
    id: 'novedades',
    name: 'Novedades',
    description: 'Productos recién llegados',
    enabled: true,
    type: 'new',
    selectedProducts: []
  },
  {
    id: 'electronica',
    name: 'Electrónica',
    description: 'Categoría de electrónicos',
    enabled: true,
    type: 'category',
    categoryId: 'electronicos',
    selectedProducts: []
  }
];

export function useProductSections() {
  const [sections, setSections] = useState<ProductSection[]>(defaultSections);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSections = async () => {
    try {
      setLoading(true);
      const sectionsDoc = await getDoc(doc(db, 'config', 'productSections'));

      if (sectionsDoc.exists()) {
        const sectionsData = sectionsDoc.data();
        if (sectionsData.sections) {
          setSections(sectionsData.sections);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error loading product sections:', err);
      setError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const refetch = () => {
    loadSections();
  };

  return {
    sections,
    loading,
    error,
    refetch
  };
}