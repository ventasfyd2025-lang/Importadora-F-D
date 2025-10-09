'use client';

import { useOfferPopup } from '@/hooks/useOfferPopup';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Layout from '@/components/Layout';

export default function PopupOfertasPage() {
  const { popupConfig, loading: popupLoading } = useOfferPopup();
  const { products, loading: productsLoading } = useProducts();

  const loading = popupLoading || productsLoading;

  // Filtrar productos con stock
  const productsInStock = products.filter(p => (p.stock || 0) > 0);

  // Get only the products selected in admin popup offers
  const selectedProducts = (popupConfig as any).selectedProducts || [];
  const displayProducts = selectedProducts.length > 0
    ? productsInStock.filter(product => selectedProducts.includes(product.id))
    : [];

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#F16529' }}></div>
            <span className="ml-3 text-gray-600">Cargando ofertas especiales...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#F16529' }}>
            🔥 {popupConfig.title}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {popupConfig.description}
          </p>
        </div>

        {/* Products organized by categories */}
        {displayProducts.length > 0 ? (
          <>
            {(() => {
              const groupedByCategory = displayProducts.reduce((acc, product) => {
                const category = product.categoria || 'Sin categoría';
                if (!acc[category]) acc[category] = [];
                acc[category].push(product);
                return acc;
              }, {} as Record<string, typeof displayProducts>);
              
              const sortedCategories = Object.keys(groupedByCategory).sort();
              
              return sortedCategories.map(category => (
                <div key={category} className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#F16529' }}>
                    📦 {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedByCategory[category].map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ));
            })()}
            
            <div className="text-center mt-8 text-gray-600">
              {displayProducts.length} {displayProducts.length === 1 ? 'producto especial' : 'productos especiales'} seleccionados
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay ofertas especiales configuradas
            </h3>
            <p className="text-gray-600">
              El administrador aún no ha seleccionado productos para mostrar en esta sección especial.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}