'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import MasonryProductGrid from '@/components/MasonryProductGrid';
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
            <div className="relative w-full h-[180px] sm:h-[280px] md:h-[350px] lg:h-[450px] xl:h-[500px] bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 flex items-center justify-center">
              <div className="text-white text-center px-3 sm:px-6 lg:px-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-1 sm:mb-2 md:mb-4 drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  Importadora F&D
                </h1>
                <p className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-medium drop-shadow-xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
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

      {/* PRIORIDAD 1.5: Layouts Pinterest de categorías promocionales - solo en página principal */}
      {shouldShowBanner && (
        <section className="py-8 sm:py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                🔥 Promociones por Categoría
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                
                {/* Promoción grande - Electrónicos */}
                <Link href="/?category=tecnologia" className="col-span-2 row-span-2 group">
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full cursor-pointer">
                    <div className="relative flex-1 min-h-[350px]">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-100 h-full w-full overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&h=600&fit=crop&crop=center"
                          alt="Electrónicos y Tecnología"
                          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <span className="absolute top-6 left-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold px-4 py-3 rounded-full shadow-lg">
                        HASTA 50% OFF
                      </span>
                      <div className="absolute bottom-6 left-6 text-white">
                        <h3 className="text-3xl font-bold mb-2">Electrónicos</h3>
                        <p className="text-lg opacity-90">Smartphones, laptops y más</p>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Promoción alta - Moda */}
                <Link href="/?category=moda" className="row-span-2 group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                    <div className="relative flex-1 min-h-[300px]">
                      <div className="bg-gradient-to-br from-pink-50 to-red-100 h-full w-full overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=700&fit=crop&crop=center"
                          alt="Moda y Ropa"
                          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <span className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-red-600 text-white text-sm font-bold px-3 py-2 rounded-full shadow-lg">
                        NUEVA COLECCIÓN
                      </span>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-2xl font-bold mb-2">Moda</h3>
                        <p className="text-sm opacity-90">Ropa y accesorios</p>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Promociones normales */}
                <Link href="/?category=electrohogar" className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                    <div className="relative h-32">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 h-full w-full overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center"
                          alt="Electrohogar"
                          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 left-2 text-white">
                        <h3 className="text-lg font-bold">Electrohogar</h3>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/?category=calzado" className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                    <div className="relative h-32">
                      <div className="bg-gradient-to-br from-amber-50 to-orange-100 h-full w-full overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop&crop=center"
                          alt="Calzado"
                          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 left-2 text-white">
                        <h3 className="text-lg font-bold">Calzado</h3>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/?category=fitness" className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                    <div className="relative h-32">
                      <div className="bg-gradient-to-br from-red-50 to-rose-100 h-full w-full overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center"
                          alt="Fitness"
                          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 left-2 text-white">
                        <h3 className="text-lg font-bold">Fitness</h3>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/?filter=ofertas" className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                    <div className="relative h-32">
                      <div className="bg-gradient-to-br from-red-500 to-red-600 h-full w-full overflow-hidden flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">🔥</div>
                          <h3 className="text-lg font-bold">OFERTAS</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/?filter=nuevos" className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                    <div className="relative h-32">
                      <div className="bg-gradient-to-br from-green-500 to-green-600 h-full w-full overflow-hidden flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">✨</div>
                          <h3 className="text-lg font-bold">NUEVOS</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

              </div>
            </div>
          </div>
        </section>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
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
                  
                  return (
                    <>
                      {sortedCategories.map(categoryName => {
                        // Find the category to get its icon
                        const categoryInfo = categories.find(cat => cat.id === categoryName || cat.name.toLowerCase() === categoryName.toLowerCase());
                        const categoryIcon = categoryInfo?.icon || '📦';
                        const displayName = categoryInfo?.name || categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
                        
                        return (
                          <MasonryProductGrid key={categoryName} products={groupedByCategory[categoryName]} />
                        );
                      })}
                    </>
                  );
                })()
              ) : (
                /* Masonry grid for filtered results */
                <>
                  <MasonryProductGrid products={displayProducts} />
                  
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