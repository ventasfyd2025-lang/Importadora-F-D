'use client';

import { Suspense, lazy, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import MasonryProductGrid from '@/components/MasonryProductGrid';
import MainBannerCarousel from '@/components/MainBannerCarousel';
import { useProducts } from '@/hooks/useProducts';
import { useConfig } from '@/hooks/useConfig';
import { useCategories } from '@/hooks/useCategories';
import { useLayoutPatterns } from '@/hooks/useLayoutPatterns';
import { useSearchParams } from 'next/navigation';
import { formatCategoryLabel, normalizeCategoryValue, getProductCategoryCandidates } from '@/utils/category';

export default function HomeClient() {
  const searchParams = useSearchParams();
  
  // PRIORIDAD 1: Banner primero - config de banner con carga inmediata
  const { mainBannerConfig } = useConfig();
  
  // PRIORIDAD 2: Productos después - cargar en segundo plano
  const { loading, error, filterProducts, getProductsByFilter, products } = useProducts();
  
  // PRIORIDAD 3: Otros datos al final
  const { categories } = useCategories();
  const { patterns: layoutPatternsConfig } = useLayoutPatterns();
  
  
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const priceRange = searchParams.get('price') || '';
  const sortBy = searchParams.get('sort') || '';
  const filter = searchParams.get('filter') || '';

  const findCategoryByValue = (rawValue: string) => {
    if (!rawValue) return undefined;
    const normalizedValue = normalizeCategoryValue(rawValue);
    const match = categories.find(cat => (
      normalizeCategoryValue(cat.id) === normalizedValue ||
      normalizeCategoryValue(cat.name || '') === normalizedValue
    ));

    if (match) return match;

    if (rawValue.includes('-')) {
      const firstPart = rawValue.split('-')[0];
      if (firstPart && firstPart !== rawValue) {
        return findCategoryByValue(firstPart);
      }
    }
    return undefined;
  };

  const resolvedCategory = useMemo(() => {
    if (!categoryParam) {
      return {
        filterValue: '',
        displayName: '',
        category: undefined as ReturnType<typeof findCategoryByValue> | undefined,
      };
    }

    if (categoryParam === 'all') {
      return {
        filterValue: 'all',
        displayName: 'Todos los productos',
        category: undefined,
      };
    }

    const match = findCategoryByValue(categoryParam);
    const filterValue = match?.id ?? categoryParam;
    const displayName = match?.name ?? formatCategoryLabel(categoryParam);
    return {
      filterValue,
      displayName,
      category: match,
    };
  }, [categoryParam, categories]);

  const findSubcategoryByValue = (rawValue: string) => {
    if (!rawValue) return undefined;
    const normalizedValue = normalizeCategoryValue(rawValue);

    const searchIn = resolvedCategory.category?.subcategorias ?? [];
    const fromCurrent = searchIn.find(sub => (
      normalizeCategoryValue(sub.id) === normalizedValue ||
      normalizeCategoryValue(sub.nombre || '') === normalizedValue
    ));
    if (fromCurrent) return { ...fromCurrent, parent: resolvedCategory.category };

    for (const cat of categories) {
      const found = (cat.subcategorias ?? []).find(sub => (
        normalizeCategoryValue(sub.id) === normalizedValue ||
        normalizeCategoryValue(sub.nombre || '') === normalizedValue
      ));
      if (found) {
        return { ...found, parent: cat };
      }
    }

    if (rawValue.includes('-')) {
      const parts = rawValue.split('-');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== rawValue) {
        return findSubcategoryByValue(lastPart);
      }
    }

    return undefined;
  };

  const resolvedSubcategory = useMemo(() => {
    if (!subcategoryParam) {
      return {
        filterValue: '',
        displayName: '',
      };
    }

    const match = findSubcategoryByValue(subcategoryParam);
    const filterValue = match?.id ?? subcategoryParam;
    const displayName = match?.nombre ?? formatCategoryLabel(subcategoryParam);
    return {
      filterValue,
      displayName,
    };
  }, [subcategoryParam, categories, resolvedCategory.category]);

  const effectiveCategory = resolvedCategory.filterValue;
  const effectiveSubcategory = resolvedSubcategory.filterValue;

  // Memoizar displayProducts para evitar recalcular en cada render
  const displayProducts = useMemo(() => {
    if (filter) {
      return getProductsByFilter(filter);
    }
    return filterProducts(searchQuery, effectiveCategory, priceRange, sortBy, effectiveSubcategory);
  }, [filter, getProductsByFilter, filterProducts, searchQuery, effectiveCategory, priceRange, sortBy, effectiveSubcategory]);

  const categoryGroups = useMemo(() => {
    const grouped = new Map<string, { displayName: string; icon?: string; products: typeof displayProducts }>();

    const attachProductToGroup = (key: string, product: (typeof displayProducts)[number], displayName?: string, icon?: string) => {
      const existing = grouped.get(key) ?? { displayName: displayName ?? 'Sin categoría', icon, products: [] };
      if (!grouped.has(key)) {
        grouped.set(key, existing);
      }
      existing.products.push(product);
    };

    displayProducts.forEach((product) => {
      const candidates = getProductCategoryCandidates(product);
      const primaryCandidate = candidates[0] ?? (product.categoria as string) ?? 'Sin categoría';

      const matchedCategory = findCategoryByValue(primaryCandidate);
      const key = matchedCategory?.id ?? primaryCandidate;
      const displayName = matchedCategory?.name ?? formatCategoryLabel(primaryCandidate);
      const icon = matchedCategory?.icon;
      attachProductToGroup(key, product, displayName, icon);
    });

    return Array.from(grouped.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [displayProducts, categories]);

  const getPageTitle = () => {
    if (searchQuery) return `Resultados para "${searchQuery}"`;
    if (effectiveCategory && effectiveCategory !== 'all') {
      const categoryName = resolvedCategory.displayName || formatCategoryLabel(effectiveCategory);
      if (effectiveSubcategory) {
        const subcategoryName = resolvedSubcategory.displayName || formatCategoryLabel(effectiveSubcategory);
        return `${categoryName} - ${subcategoryName}`;
      }
      return `Categoría: ${categoryName}`;
    }
    if (effectiveCategory === 'all') {
      return 'Todos los productos';
    }
    if (filter === 'ofertas') return 'Ofertas Especiales';
    if (filter === 'nuevos') return 'Productos Nuevos';
    if (filter === 'popular') return 'Más Vendidos';
    return 'Nuestros Productos';
  };

  const noCategoryFilter = !effectiveCategory || effectiveCategory === 'all';
  const noSubcategoryFilter = !effectiveSubcategory;
  const noActiveFilters = !searchQuery && !filter && noCategoryFilter && !priceRange && !sortBy && noSubcategoryFilter;
  const shouldShowBanner = noActiveFilters;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-12 border border-red-200 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar productos</h2>
            <p className="text-gray-600 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
              config={mainBannerConfig as any}
            />
          )}
        </>
      )}

      {/* PRIORIDAD 1.5: Layouts Pinterest de categorías promocionales - solo en página principal */}
      {shouldShowBanner && (
        <section className="py-8 sm:py-12 lg:py-16 bg-white">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  ✨ Colecciones Destacadas
                </h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                  Descubre selecciones rápidas con lo más deseado de cada categoría.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 grid-flow-dense">
                
                {/* Promoción grande - Electrónicos */}
                <Link href="/?category=tecnologia" className="col-span-2 md:col-span-2 md:row-span-2 group">
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
                <Link href="/?category=moda" className="col-span-2 sm:col-span-1 md:row-span-2 group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                    <div className="relative flex-1 min-h-[300px]">
                      <div className="bg-gradient-to-br from-pink-50 to-red-100 h-full w-full overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=700&fit=crop&crop=center"
                          alt="Moda y Ropa"
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
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
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - Modern Admin Style */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-orange-100 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F16529' }}>
                  <span className="text-white text-lg">🛍️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {getPageTitle()}
                  </h2>
                  <p className="text-gray-600 text-sm">Descubre nuestros productos</p>
                </div>
              </div>

              {/* Filter Controls - Modern Style */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <select
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white hover:border-orange-300 transition-all shadow-sm"
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
                  <option value="">📊 Ordenar por</option>
                  <option value="name">🔤 Nombre</option>
                  <option value="price-low">💰 Precio: menor a mayor</option>
                  <option value="price-high">💎 Precio: mayor a menor</option>
                  <option value="newest">✨ Más nuevos</option>
                </select>

                <select
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white hover:border-orange-300 transition-all shadow-sm"
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
                  <option value="">💵 Todos los precios</option>
                  <option value="0-50000">$0 - $50.000</option>
                  <option value="50000-100000">$50.000 - $100.000</option>
                  <option value="100000-200000">$100.000 - $200.000</option>
                  <option value="200000-+">$200.000+</option>
                </select>
              </div>
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
              {noActiveFilters ? (
                <>
                  {categoryGroups.map(group => (
                    <MasonryProductGrid
                      key={group.key}
                      products={group.products}
                      layoutConfig={layoutPatternsConfig}
                    />
                  ))}
                </>
              ) : (
                /* Masonry grid for filtered results */
                <>
                  <MasonryProductGrid products={displayProducts} layoutConfig={layoutPatternsConfig} />
                  
                  <div className="text-center mt-8 text-gray-600">
                    Mostrando {displayProducts.length} productos
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-12 border border-orange-100 text-center">
              <div className="text-orange-400 text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600 text-lg">
                Intenta ajustar los filtros o buscar otro término
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
