'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import ProductCard from '@/components/ProductCard';
import MainBannerCarousel from '@/components/MainBannerCarousel';
import OfferPopup from '@/components/OfferPopup';
import { useProducts } from '@/hooks/useProducts';
import { useConfig } from '@/hooks/useConfig';
import { useOfferPopup } from '@/hooks/useOfferPopup';
import { useCategories } from '@/hooks/useCategories';
import { useSearchParams } from 'next/navigation';

export default function HomeClient() {
  const searchParams = useSearchParams();
  
  // PRIORIDAD 1: Banner primero - config de banner con carga inmediata
  const { mainBannerConfig } = useConfig();
  
  // PRIORIDAD 2: Productos después - cargar en segundo plano
  const { loading, error, filterProducts, getProductsByFilter, products } = useProducts();
  
  // PRIORIDAD 3: Otros datos al final
  const { popupConfig } = useOfferPopup();
  const { categories } = useCategories();
  
  
  const searchQuery = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const priceRange = searchParams.get('price') || '';
  const sortBy = searchParams.get('sort') || '';
  const filter = searchParams.get('filter') || '';

  const getDisplayProducts = () => {
    if (filter) {
      const filtered = getProductsByFilter(filter);
      return filtered;
    }
    const filtered = filterProducts(searchQuery, category, priceRange, sortBy, subcategory);
    return filtered;
  };

  const displayProducts = getDisplayProducts();


  const getPageTitle = () => {
    if (searchQuery) return `Resultados para "${searchQuery}"`;
    if (category && category !== 'all') {
      // Find the category name from the loaded categories
      const foundCategory = categories.find(cat => cat.id === category);
      const categoryName = foundCategory?.name || category;
      
      if (subcategory) {
        return `${categoryName} - ${subcategory}`;
      }
      return `Categoría: ${categoryName}`;
    }
    if (filter === 'ofertas') return 'Ofertas Especiales';
    if (filter === 'nuevos') return 'Productos Nuevos';
    if (filter === 'popular') return 'Más Vendidos';
    return 'Nuestros Productos';
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar productos</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Banner SIEMPRE visible primero - estilo PC Factory
  const shouldShowBanner = !searchQuery && !filter;
  
  return (
    <>
      {/* PRIORIDAD 1: Banner aparece INMEDIATAMENTE - como PC Factory */}
      {shouldShowBanner && (
        <>
          {/* Banner placeholder inmediato - Totalmente responsive */}
          {!mainBannerConfig || !mainBannerConfig.active || !mainBannerConfig.slides?.length ? (
            <div className="relative w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 flex items-center justify-center">
              <div className="text-white text-center px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-4 drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  Importadora F&D
                </h1>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-medium drop-shadow-xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
                  Los mejores productos importados
                </p>
              </div>
            </div>
          ) : (
            <MainBannerCarousel
              products={[]} // No esperar productos, usar config únicamente
              config={mainBannerConfig}
            />
          )}
        </>
      )}

      {/* PRIORIDAD 2: Productos cargan después en segundo plano */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 lg:mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-0" style={{ color: '#333333' }}>
              {getPageTitle()}
            </h2>
            
            {/* Filter Controls - Responsive */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <select 
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#F16529' }}
                value={sortBy}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value) {
                    params.set('sort', e.target.value);
                  } else {
                    params.delete('sort');
                  }
                  window.history.pushState(null, '', `?${params.toString()}`);
                  window.location.reload();
                }}
              >
                <option value="">Ordenar por</option>
                <option value="name">Nombre</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
                <option value="newest">Más nuevos</option>
              </select>

              <select 
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#F16529' }}
                value={priceRange}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value) {
                    params.set('price', e.target.value);
                  } else {
                    params.delete('price');
                  }
                  window.history.pushState(null, '', `?${params.toString()}`);
                  window.location.reload();
                }}
              >
                <option value="">Todos los precios</option>
                <option value="0-50000">$0 - $50.000</option>
                <option value="50000-100000">$50.000 - $100.000</option>
                <option value="100000-200000">$100.000 - $200.000</option>
                <option value="200000-+">$200.000+</option>
              </select>
            </div>
          </div>

          {/* Products Grid organized by categories */}
          {loading ? (
            /* Skeleton elegante estilo PC Factory mientras cargan productos - Responsive */
            <div className="space-y-8 sm:space-y-12">
              <div className="animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
                  <div className="h-6 sm:h-8 bg-gray-300 rounded w-32 sm:w-48 mb-2 sm:mb-0"></div>
                  <div className="h-5 sm:h-6 bg-gray-300 rounded w-16 sm:w-20"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                      <div className="h-32 sm:h-40 lg:h-48 bg-gray-300 rounded mb-3 sm:mb-4"></div>
                      <div className="h-3 sm:h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 sm:h-6 bg-gray-300 rounded w-16 sm:w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : displayProducts.length > 0 ? (
            <>
              {/* Show products organized by category only on main page without filters */}
              {!searchQuery && !category && !priceRange && !sortBy && !filter ? (
                (() => {
                  const groupedByCategory = displayProducts.reduce((acc, product) => {
                    const category = product.categoria || product.category || 'Sin categoría';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(product);
                    return acc;
                  }, {} as Record<string, typeof displayProducts>);
                  
                  const sortedCategories = Object.keys(groupedByCategory).sort();
                  
                  return sortedCategories.map(categoryName => {
                    // Find the category to get its icon
                    const categoryInfo = categories.find(cat => cat.id === categoryName || cat.name.toLowerCase() === categoryName.toLowerCase());
                    const categoryIcon = categoryInfo?.icon || '📦';
                    const displayName = categoryInfo?.name || categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
                    
                    return (
                    <div key={categoryName} className="mb-16">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold" style={{ color: '#F16529' }}>
                          {categoryIcon} {displayName}
                        </h2>
                        <button
                          onClick={() => {
                            window.location.href = `/?category=${categoryName}`;
                          }}
                          className="font-medium flex items-center hover:opacity-80 transition-opacity"
                          style={{ color: '#0074D9' }}
                        >
                          Ver todos
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                        {groupedByCategory[categoryName].slice(0, 10).map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  );
                  });
                })()
              ) : (
                /* Standard grid for filtered results */
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    {displayProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  
                  <div className="text-center mt-8 text-gray-600">
                    Mostrando {displayProducts.length} productos
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600">
                Intenta ajustar los filtros o buscar otro término
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Offer Popup */}
      <OfferPopup
        title={popupConfig.title}
        description={popupConfig.description}
        buttonText={popupConfig.buttonText}
        buttonLink={popupConfig.buttonLink}
        isActive={popupConfig.active}
        selectedProducts={popupConfig.selectedProducts}
        onClose={() => {}}
      />
    </>
  );
}