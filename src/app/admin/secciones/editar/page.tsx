'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  stock: number;
  categoria: string;
  subcategoria?: string;
}

interface ProductSection {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: string;
  selectedProducts: string[];
  categoryId?: string;
}

function EditSectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('id');

  const [section, setSection] = useState<ProductSection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load section data
  useEffect(() => {
    const loadSection = async () => {
      if (!sectionId) {
        setLoading(false);
        return;
      }

      try {
        const sectionsDoc = await getDoc(doc(db, 'config', 'productSections'));
        if (sectionsDoc.exists()) {
          const sectionsData = sectionsDoc.data();
          const foundSection = sectionsData.sections.find((s: ProductSection) => s.id === sectionId);
          if (foundSection) {
            setSection(foundSection);
          }
        }
      } catch (error) {
        console.error('Error loading section:', error);
      }
    };

    const loadProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSection();
    loadProducts();
  }, [sectionId]);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categoria === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const handleSave = async () => {
    if (!section) return;

    setSaving(true);
    setSaveMessage('saving');

    try {
      const sectionsDoc = await getDoc(doc(db, 'config', 'productSections'));
      if (sectionsDoc.exists()) {
        const sectionsData = sectionsDoc.data();
        const updatedSections = sectionsData.sections.map((s: ProductSection) =>
          s.id === section.id ? section : s
        );

        await setDoc(doc(db, 'config', 'productSections'), {
          sections: updatedSections,
          updatedAt: new Date().toISOString()
        });

        setSaveMessage('success');
        setTimeout(() => setSaveMessage('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      setSaveMessage('error');
      setTimeout(() => setSaveMessage('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (productId: string) => {
    if (!section) return;

    const isSelected = section.selectedProducts.includes(productId);
    const newSelectedProducts = isSelected
      ? section.selectedProducts.filter(id => id !== productId)
      : [...section.selectedProducts, productId];

    setSection({
      ...section,
      selectedProducts: newSelectedProducts
    });
  };

  const categories = Array.from(new Set(products.map(p => p.categoria)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sección...</p>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Sección no encontrada</p>
          <Link
            href="/admin"
            className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Volver al Admin
          </Link>
        </div>
      </div>
    );
  }

  const selectedProducts = products.filter(p => section.selectedProducts.includes(p.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                ←
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Sección</h1>
                <p className="text-sm text-gray-500">{section.name}</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-semibold"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {saveMessage !== 'idle' && (
        <div className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg ${
          saveMessage === 'saving' ? 'bg-blue-500' :
          saveMessage === 'success' ? 'bg-green-500' :
          'bg-red-500'
        } text-white font-medium animate-slide-in`}>
          {saveMessage === 'saving' && '⏳ Guardando...'}
          {saveMessage === 'success' && '✅ Guardado exitosamente'}
          {saveMessage === 'error' && '❌ Error al guardar'}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Section Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Section Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Información de la Sección</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Sección *
                  </label>
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => setSection({ ...section, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={section.description}
                    onChange={(e) => setSection({ ...section, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Sección
                  </label>
                  <select
                    value={section.type}
                    onChange={(e) => setSection({ ...section, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="custom">🎯 Productos Personalizados</option>
                    <option value="featured">⭐ Productos Destacados</option>
                    <option value="new">🆕 Productos Nuevos</option>
                    <option value="bestsellers">🔥 Más Vendidos</option>
                    <option value="category">📁 Por Categoría</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={section.enabled}
                    onChange={(e) => setSection({ ...section, enabled: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                    Sección activa
                  </label>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl shadow-sm p-6 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700">👁️ Vista Previa</h3>
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                  En Vivo
                </span>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="border-b-2 border-orange-500 pb-3 mb-3">
                  <h4 className="text-lg font-bold text-gray-900">{section.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{section.selectedProducts.length} productos</span>
                  <span className="text-orange-500 font-semibold">Ver todos →</span>
                </div>
              </div>
            </div>

            {/* Selected Products Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Productos Seleccionados ({section.selectedProducts.length})
              </h3>
              {selectedProducts.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 border border-orange-100"
                    >
                      {product.imagen && (
                        <img
                          src={product.imagen}
                          alt={product.nombre}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.nombre}</p>
                        <p className="text-xs text-gray-500">
                          ${product.precio.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleProduct(product.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No hay productos seleccionados
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Product Selector */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Seleccionar Productos</h2>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[800px] overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isSelected = section.selectedProducts.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          {product.imagen && (
                            <img
                              src={product.imagen}
                              alt={product.nombre}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                            {product.nombre}
                          </h4>
                          <p className="text-sm text-orange-600 font-bold">
                            ${product.precio.toLocaleString('es-CL')}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>Stock: {product.stock}</span>
                            <span>•</span>
                            <span className="truncate">{product.categoria}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditSectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <EditSectionContent />
    </Suspense>
  );
}
