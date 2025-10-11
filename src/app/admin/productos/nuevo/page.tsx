'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import optimizeImageFile from '@/utils/imageProcessing';

type ProductFormState = {
  id: string;
  sku: string;
  nombre: string;
  precio: number;
  precioOriginal: number | undefined;
  descripcion: string;
  stock: number;
  minStock: number;
  categoria: string;
  categorias: string[];
  subcategoria: string;
  nuevo: boolean;
  oferta: boolean;
  nuevoDuracionHoras: number;
  ofertaDuracionHoras: number;
  imagen: string;
  imagenes: string[];
};

type Category = {
  id: string;
  name: string;
  active: boolean;
  subcategorias?: Array<{
    id: string;
    nombre: string;
    activa: boolean;
  }>;
};

export default function NuevoProductoPage() {
  const router = useRouter();

  // Product form state
  const [productForm, setProductForm] = useState<ProductFormState>({
    id: '',
    sku: '',
    nombre: '',
    precio: 0,
    precioOriginal: undefined,
    descripcion: '',
    stock: 0,
    minStock: 5,
    categoria: '',
    categorias: [],
    subcategoria: '',
    nuevo: false,
    oferta: false,
    nuevoDuracionHoras: 24,
    ofertaDuracionHoras: 24,
    imagen: '',
    imagenes: []
  });

  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'electronicos', name: 'Electrónicos', active: true },
    { id: 'hogar', name: 'Hogar', active: true },
    { id: 'ropa', name: 'Ropa', active: true },
    { id: 'deportes', name: 'Deportes', active: true }
  ]);

  // Load categories from Firebase
  const loadCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'categorias'));
      if (!categoriesSnapshot.empty) {
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          active: doc.data().active ?? true,
          ...doc.data()
        })) as Category[];
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingProduct(true);

    try {
      const trimmedSku = (productForm.sku || '').trim();

      if (!trimmedSku) {
        alert('Por favor ingresa un SKU para el producto.');
        setUploadingProduct(false);
        return;
      }

      let imageUrl = productForm.imagen;
      let imagenesUrls = productForm.imagenes || [];

      // Upload all new images if selected
      if (productImages.length > 0) {
        console.log(`📸 Subiendo ${productImages.length} nuevas imágenes...`);
        const uploadPromises = productImages.map(async (file, index) => {
          const optimizedImage = await optimizeImageFile(file);
          const imageRef = ref(storage, `products/${Date.now()}_${index}_${optimizedImage.name}`);
          const snapshot = await uploadBytes(imageRef, optimizedImage);
          return await getDownloadURL(snapshot.ref);
        });

        const newImagenesUrls = await Promise.all(uploadPromises);
        console.log(`✅ ${newImagenesUrls.length} nuevas imágenes subidas`);

        // Combinar imágenes existentes + nuevas (no reemplazar)
        imagenesUrls = [...imagenesUrls, ...newImagenesUrls];

        // Solo actualizar imagen principal si no existe una
        if (!imageUrl) {
          imageUrl = newImagenesUrls[0];
        }

        console.log(`📦 Total de imágenes: ${imagenesUrls.length}`);
      }

      const priceAsNumber = parseInt(String(productForm.precio).replace(/\D/g, ''), 10) || 0;

      console.log('📦 Datos de imágenes a guardar:', {
        imagen: imageUrl,
        imagenes: imagenesUrls,
        totalImagenes: imagenesUrls.length
      });

      const productData: any = {
        nombre: productForm.nombre,
        precio: priceAsNumber,
        descripcion: productForm.descripcion,
        stock: Number(productForm.stock),
        minStock: Number(productForm.minStock),
        categoria: productForm.categoria,
        categorias: productForm.categorias,
        subcategoria: productForm.subcategoria,
        nuevo: productForm.nuevo,
        oferta: productForm.oferta,
        imagen: imageUrl,
        imagenes: imagenesUrls,
        sku: trimmedSku,
        activo: true,
        fechaCreacion: new Date().toISOString(),
      };

      // Agregar timestamps y duración para etiquetas
      if (productForm.nuevo) {
        productData.nuevoDesde = new Date().toISOString();
        productData.nuevoDuracionHoras = productForm.nuevoDuracionHoras;
      }
      if (productForm.oferta) {
        productData.ofertaDesde = new Date().toISOString();
        productData.ofertaDuracionHoras = productForm.ofertaDuracionHoras;
      }

      // Solo agregar precioOriginal si tiene valor (evitar undefined)
      if (productForm.precioOriginal && productForm.precioOriginal > 0) {
        productData.precioOriginal = productForm.precioOriginal;
      }

      // Create new product
      try {
        const docRef = await addDoc(collection(db, 'products'), productData);
        console.log('✅ Producto creado con ID:', docRef.id);
        console.log('📸 Imágenes guardadas en Firestore:', productData.imagenes);
        alert('Producto creado exitosamente');

        // Redirect back to admin page to continue adding products
        router.push('/admin');
      } catch (error) {
        console.error("Error creating product in Firestore: ", error);
        alert(`Error al crear el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    } catch (error) {
      alert('Error al guardar el producto');
    } finally {
      setUploadingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[95%] 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agregar Nuevo Producto</h1>
                <p className="text-sm text-gray-600">Completa la información del producto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[95%] 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleProductSubmit} className="space-y-6">

          {/* Basic Info Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 lg:p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                <span className="text-white">📝</span>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Información Básica</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span>📦</span> Nombre *
                </label>
                <input
                  type="text"
                  value={productForm.nombre}
                  onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 bg-white"
                  style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#F16529'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  placeholder="Ej: Laptop Gaming RGB"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span>🏷️</span> SKU *
                </label>
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                  required
                  placeholder="SKU-001"
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 uppercase bg-white"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#F16529'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span>💰</span> Precio ($) *
                </label>
                <input
                  type="number"
                  value={productForm.precio}
                  onChange={(e) => setProductForm({ ...productForm, precio: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 bg-white"
                  style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#F16529'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span>💸</span> Precio Anterior (Opcional - para mostrar descuento)
                </label>
                <input
                  type="number"
                  value={productForm.precioOriginal || ''}
                  onChange={(e) => setProductForm({ ...productForm, precioOriginal: e.target.value ? parseFloat(e.target.value) : undefined })}
                  min="0"
                  step="1"
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 bg-white"
                  style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#F16529'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  placeholder="Dejar vacío si no hay descuento"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Si agregas un precio anterior, se mostrará tachado y el % de descuento
                </p>
              </div>
            </div>
          </div>

          {/* Stock Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 lg:p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                <span className="text-white">📊</span>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Control de Inventario</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span>📦</span> Stock Actual *
                </label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 bg-white"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#10b981'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span>⚠️</span> Stock Mínimo *
                </label>
                <input
                  type="number"
                  value={productForm.minStock}
                  onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                  required
                  min="0"
                  step="1"
                  placeholder="5"
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 bg-white"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#10b981'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
                <p className="text-xs text-green-600 mt-2">📊 Para alertas de stock bajo</p>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 lg:p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                <span className="text-white">📂</span>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Categorización</h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                  <span>📂</span> Categorías y Subcategorías * (selecciona todas las que apliquen)
                </label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-white max-h-96 overflow-y-auto space-y-4">
                  {categories.map((category) => {
                    const subcategorias = (category as any).subcategorias || [];
                    const isCategoryChecked = productForm.categorias.includes(category.id);

                    return (
                      <div key={category.id} className="border-b border-gray-200 pb-4 last:border-0">
                        {/* Categoría principal */}
                        <label className="flex items-center gap-2 hover:bg-purple-50 p-2 rounded cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={isCategoryChecked}
                            onChange={(e) => {
                              let newCategorias = [...productForm.categorias];

                              if (e.target.checked) {
                                // Agregar categoría
                                newCategorias.push(category.id);
                              } else {
                                // Quitar categoría y todas sus subcategorías
                                newCategorias = newCategorias.filter(c => {
                                  if (c === category.id) return false;
                                  if (c.startsWith(`${category.id}-`)) return false;
                                  return true;
                                });
                              }

                              setProductForm({
                                ...productForm,
                                categorias: newCategorias,
                                categoria: newCategorias[0]?.split('-')[0] || ''
                              });
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                          />
                          <span className="text-sm">📂 {category.name}</span>
                        </label>

                        {/* Subcategorías */}
                        {subcategorias.length > 0 && (
                          <div className="ml-8 mt-2 space-y-1">
                            {subcategorias.map((sub: any) => {
                              const subId = `${category.id}-${sub.id}`;
                              return (
                                <label key={sub.id} className="flex items-center gap-2 hover:bg-purple-50 p-2 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={productForm.categorias.includes(subId)}
                                    onChange={(e) => {
                                      let newCategorias = [...productForm.categorias];

                                      if (e.target.checked) {
                                        // Agregar subcategoría y asegurar que categoría padre esté incluida
                                        if (!newCategorias.includes(category.id)) {
                                          newCategorias.push(category.id);
                                        }
                                        newCategorias.push(subId);
                                      } else {
                                        // Quitar subcategoría
                                        newCategorias = newCategorias.filter(c => c !== subId);
                                      }

                                      setProductForm({
                                        ...productForm,
                                        categorias: newCategorias,
                                        categoria: newCategorias[0]?.split('-')[0] || ''
                                      });
                                    }}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  <span className="text-sm">📁 {sub.nombre}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {productForm.categorias.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">Debes seleccionar al menos una categoría o subcategoría</p>
                )}
                {productForm.categorias.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {productForm.categorias.length} seleccionada(s)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 lg:p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                <span className="text-white">📝</span>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Descripción</h4>
            </div>
            <textarea
              value={productForm.descripcion}
              onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 resize-none bg-white"
              onFocus={(e) => e.currentTarget.style.borderColor = '#F16529'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              placeholder="Describe las características principales del producto..."
            />
          </div>

          {/* Images Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 lg:p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                <span className="text-white">🖼️</span>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Imágenes del Producto</h4>
            </div>

            {/* Image Specifications */}
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
              <p className="text-orange-800 font-medium mb-2">📐 Especificaciones:</p>
              <ul className="text-orange-700 space-y-1">
                <li>• <strong>Tamaño:</strong> 800x800px (1:1)</li>
                <li>• <strong>Formato:</strong> JPG o PNG</li>
                <li>• <strong>Fondo:</strong> Blanco preferible</li>
                <li>• <strong>Máximo:</strong> 5MB por imagen</li>
              </ul>
            </div>

            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-orange-200 rounded-lg p-6 text-center bg-orange-50/50 hover:bg-orange-50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setProductImages(prev => [...prev, ...files]);

                  // Create previews
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setProductImagePreviews(prev => [...prev, e.target?.result as string]);
                    };
                    reader.readAsDataURL(file);
                  });
                }}
                className="hidden"
                id="product-images"
              />
              <label htmlFor="product-images" className="cursor-pointer block">
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-sm font-medium" style={{ color: '#F16529' }}>Agregar imágenes</p>
                  <p className="text-sm" style={{ color: '#D13C1A' }}>Múltiples archivos</p>
                </div>
              </label>
            </div>

            {/* Image Previews */}
            {productImagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-3">✨ Nuevas imágenes a agregar:</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {productImagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        loading="lazy"
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-indigo-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProductImages(prev => prev.filter((_, i) => i !== index));
                          setProductImagePreviews(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        ✕
                      </button>
                      <div className="absolute -top-2 -left-2">
                        <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">Nuevo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 lg:p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                <span className="text-white">🏷️</span>
              </div>
              <h4 className="text-lg font-bold text-gray-800">Etiquetas con Duración</h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Etiqueta Nuevo */}
              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50/50">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={productForm.nuevo}
                    onChange={(e) => setProductForm({ ...productForm, nuevo: e.target.checked })}
                    className="rounded w-5 h-5 text-green-600"
                  />
                  <span className="text-sm font-bold text-green-700">✨ Nuevo</span>
                </label>
                {productForm.nuevo && (
                  <div>
                    <label className="block text-xs font-semibold text-green-700 mb-2">
                      ⏱️ Duración (horas)
                    </label>
                    <input
                      type="number"
                      value={productForm.nuevoDuracionHoras}
                      onChange={(e) => setProductForm({ ...productForm, nuevoDuracionHoras: Number(e.target.value) })}
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 text-sm border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500 bg-white"
                      placeholder="24"
                    />
                    <p className="text-xs text-green-600 mt-1">
                      La etiqueta se quitará automáticamente después de {productForm.nuevoDuracionHoras}h
                    </p>
                  </div>
                )}
              </div>

              {/* Etiqueta Oferta */}
              <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50/50">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={productForm.oferta}
                    onChange={(e) => setProductForm({ ...productForm, oferta: e.target.checked })}
                    className="rounded w-5 h-5 text-red-600"
                  />
                  <span className="text-sm font-bold text-red-700">🔥 Oferta</span>
                </label>
                {productForm.oferta && (
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-2">
                      ⏱️ Duración (horas)
                    </label>
                    <input
                      type="number"
                      value={productForm.ofertaDuracionHoras}
                      onChange={(e) => setProductForm({ ...productForm, ofertaDuracionHoras: Number(e.target.value) })}
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 text-sm border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500 bg-white"
                      placeholder="24"
                    />
                    <p className="text-xs text-red-600 mt-1">
                      La etiqueta se quitará automáticamente después de {productForm.ofertaDuracionHoras}h
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-200 sticky bottom-0 z-10">
            <div className="flex gap-4">
              <Link
                href="/admin"
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={uploadingProduct}
                className="flex-[2] text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: '#F16529'
                }}
                onMouseEnter={(e) => !uploadingProduct && (e.currentTarget.style.backgroundColor = '#D13C1A')}
                onMouseLeave={(e) => !uploadingProduct && (e.currentTarget.style.backgroundColor = '#F16529')}
              >
                {uploadingProduct ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crear Producto
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
