'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/home/SkeletonLoader';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useProductSections } from '@/hooks/useProductSections';
import { useHomepageConfig } from '@/hooks/useHomepageConfig';
import { productMatchesCategory, productMatchesSubcategory } from '@/utils/category';

const ITEMS_PER_PAGE = 50;

export default function AllProductsPage() {
  return (
    <Suspense fallback={<div>Cargando productos...</div>}>
      <AllProductsPageContent />
    </Suspense>
  );
}

function AllProductsPageContent() {
  const searchParams = useSearchParams();
  const { products, loading: productsLoading, error: productsError, refetch } = useProducts();
  const { categories } = useCategories();
  const { sections: productSections } = useProductSections();
  const { homepageConfig } = useHomepageConfig();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [page, setPage] = useState(1);
  const [manualProductIds, setManualProductIds] = useState<string[]>([]);
  const [specialFilter, setSpecialFilter] = useState<'ofertas' | 'nuevos' | 'destacados' | ''>('');
  const [activeSectionTitle, setActiveSectionTitle] = useState<string | null>(null);
  const [activeSectionDescription, setActiveSectionDescription] = useState<string | null>(null);

  const sectionParam = searchParams.get('section');
  const filterParam = searchParams.get('filter');
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    const section = sectionParam
      ? productSections.find((candidate) => candidate.id === sectionParam)
      : undefined;

    if (!section) {
      setManualProductIds([]);
      setActiveSectionTitle(null);
      setActiveSectionDescription(null);

      if (categoryParam) {
        setSelectedCategory(categoryParam);
      }

      if (filterParam === 'ofertas' || filterParam === 'nuevos' || filterParam === 'destacados') {
        setSpecialFilter(filterParam);
      } else {
        setSpecialFilter('');
      }

      return;
    }

    setActiveSectionTitle(section.name || null);
    setActiveSectionDescription(section.description || null);

    const selectedIds = Array.isArray(section.selectedProducts)
      ? section.selectedProducts.filter((id): id is string => typeof id === 'string')
      : [];

    if (selectedIds.length > 0) {
      setManualProductIds(selectedIds);
      setSpecialFilter('');
    } else {
      if (section.type === 'featured') {
        const homepageFeatured = Array.isArray(homepageConfig?.featuredProducts)
          ? homepageConfig.featuredProducts.filter((id): id is string => typeof id === 'string')
          : [];
        if (homepageFeatured.length > 0) {
          setManualProductIds(homepageFeatured);
          setSpecialFilter('');
        } else {
          setManualProductIds([]);
          setSpecialFilter('destacados');
        }
      } else if (section.type === 'bestsellers') {
        setManualProductIds([]);
        setSpecialFilter('ofertas');
      } else if (section.type === 'new') {
        setManualProductIds([]);
        setSpecialFilter('nuevos');
      } else {
        setManualProductIds([]);
        setSpecialFilter('');
      }
    }

    if (section.type === 'category' && section.categoryId) {
      setSelectedCategory(section.categoryId);
    } else if (!categoryParam) {
      setSelectedCategory('all');
    }

    setSelectedSubcategory('');
  }, [sectionParam, productSections, homepageConfig?.featuredProducts, filterParam, categoryParam]);

  const filteredProducts = useMemo(() => {
    let data = [...products];

    if (manualProductIds.length > 0) {
      const allowed = new Set(manualProductIds);
      data = data.filter((product) => allowed.has(product.id));
    }

    if (selectedCategory !== 'all') {
      data = data.filter((product) => productMatchesCategory(product, selectedCategory));
    }

    if (selectedSubcategory) {
      data = data.filter((product) => productMatchesSubcategory(product, selectedSubcategory));
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((product) =>
        product.nombre?.toLowerCase?.().includes(term) ||
        product.descripcion?.toLowerCase?.().includes(term) ||
        product.sku?.toLowerCase?.().includes(term)
      );
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isNaN(min) && minPrice.trim() !== '') {
      data = data.filter((product) => (product.precio || 0) >= min);
    }
    if (!Number.isNaN(max) && maxPrice.trim() !== '') {
      data = data.filter((product) => (product.precio || 0) <= max);
    }

    if (manualProductIds.length === 0) {
      if (specialFilter === 'ofertas') {
        data = data.filter((product) => product.oferta);
      } else if (specialFilter === 'nuevos') {
        data = data.filter((product) => product.nuevo);
      } else if (specialFilter === 'destacados') {
        const featuredIds = Array.isArray(homepageConfig?.featuredProducts)
          ? homepageConfig.featuredProducts.filter((id): id is string => typeof id === 'string')
          : [];
        if (featuredIds.length > 0) {
          const featuredSet = new Set(featuredIds);
          data = data.filter((product) => featuredSet.has(product.id));
        } else {
          data = data.filter((product) => product.oferta || product.nuevo);
        }
      }
    }

    return data;
  }, [
    products,
    selectedCategory,
    selectedSubcategory,
    searchTerm,
    minPrice,
    maxPrice,
    manualProductIds,
    specialFilter,
    homepageConfig?.featuredProducts,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedSubcategory, searchTerm, minPrice, maxPrice, manualProductIds, specialFilter, sectionParam]);

  useEffect(() => {
    setSelectedSubcategory('');
  }, [selectedCategory]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const priceSummary = useMemo(() => {
    if (filteredProducts.length === 0) {
      return null;
    }
    const prices = filteredProducts.map((product) => product.precio || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  }, [filteredProducts]);

  const categoryOptions = useMemo(() => {
    const mapped = categories
      .filter((cat) => cat.id !== 'all')
      .map((cat) => ({ value: cat.id, label: cat.name }));
    return [{ value: 'all', label: 'Todas las categorías' }, ...mapped];
  }, [categories]);

  const subcategoryOptions = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const category = categories.find((cat) => cat.id === selectedCategory);
    if (!category?.subcategorias) return [];
    return category.subcategorias
      .filter((sub) => sub.activa)
      .map((sub) => ({ value: sub.nombre, label: sub.nombre }));
  }, [categories, selectedCategory]);

  return (
    <Layout>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-8">
        <section className="flex flex-col gap-6">
          <header className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-orange-500">Catálogo completo</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Todos los productos disponibles
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                  Filtra por categoría, ofertas o novedades y navega nuestro inventario. Mostramos hasta 50 artículos por página para mantener la experiencia ligera.
                </p>
                {activeSectionTitle && (
                  <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                    <p className="font-semibold">
                      Estás revisando la sección “{activeSectionTitle}”.
                    </p>
                    {activeSectionDescription && (
                      <p className="mt-1 text-orange-600">
                        {activeSectionDescription}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => refetch()}
                className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                ↻ Refrescar lista
              </button>
            </div>
          </header>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-2">
                Buscar
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nombre, descripción o SKU"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-700 gap-2">
                Categoría
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {subcategoryOptions.length > 0 && (
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-2">
                  Subcategoría
                  <select
                    value={selectedSubcategory}
                    onChange={(event) => setSelectedSubcategory(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="">Todas</option>
                    {subcategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="flex flex-col text-sm font-medium text-gray-700 gap-2">
                Rango de precio (CLP)
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Mínimo"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Máximo"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </label>

            </form>
          </section>
        </section>

        {productsLoading && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ProductCardSkeleton count={8} />
            </div>
          </section>
        )}

        {productsError && (
          <section className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">Error al cargar productos</h2>
            <p className="text-sm mb-4">{productsError}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #F16529 0%, #E67E22 100%)' }}
            >
              Reintentar
            </button>
          </section>
        )}

        {!productsLoading && !productsError && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-600">
                {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'} encontrados · Página {page} de {totalPages}
              </div>
              {priceSummary && (
              <div className="text-xs text-gray-500">Rango de precios mostrado: {priceSummary.min.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })} – {priceSummary.max.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</div>
            )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-600">
                <div className="text-5xl mb-4">🔍</div>
                <p>No encontramos resultados con los filtros actuales. Ajusta la búsqueda para ver más productos.</p>
              </div>
            ) : (
              <div className="grid [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  ← Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </span>
                <button
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente →
                </button>
              </div>
            )}

            {filteredProducts.length > ITEMS_PER_PAGE && (
              <div className="text-center text-xs text-gray-400">
                Mostrando los primeros {ITEMS_PER_PAGE} resultados. Refina los filtros para ubicar productos específicos.
              </div>
            )}
          </section>
        )}
      </main>
    </Layout>
  );
}
