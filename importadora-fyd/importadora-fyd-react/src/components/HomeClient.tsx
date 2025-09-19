'use client';

import ProductCard from '@/components/ProductCard';
import MainBannerCarousel from '@/components/MainBannerCarousel';
import OfferPopup from '@/components/OfferPopup';
import { useProducts } from '@/hooks/useProducts';
import { useConfig } from '@/hooks/useConfig';
import { useOfferPopup } from '@/hooks/useOfferPopup';
import { useCategories } from '@/hooks/useCategories';
import { useSearchParams } from 'next/navigation';

export default function HomeClient() {
  const { loading, error, filterProducts, getProductsByFilter, products } = useProducts();
  const { mainBannerConfig } = useConfig();
  const { popupConfig } = useOfferPopup();
  const { categories } = useCategories();
  const searchParams = useSearchParams();
  
  
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

  return (
    <>
      {/* Main Banner - Show on main page */}
      {mainBannerConfig.active && !searchQuery && !filter && (
        <MainBannerCarousel
          products={products}
          config={mainBannerConfig}
        />
      )}

      {/* Products Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
            <h2 className="text-3xl font-bold mb-6 sm:mb-0" style={{ color: '#333333' }}>
              {getPageTitle()}
            </h2>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4">
              <select 
                className="px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2"
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
                className="px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2"
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
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando productos...</span>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groupedByCategory[categoryName].slice(0, 8).map((product) => (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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