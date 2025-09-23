'use client';

import React from 'react';
import { Heart, Loader, AlertCircle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';

// Extiendo el tipo Product para incluir campos que podrían no estar en la definición base
type ProductWithOptionalPrice = Product & { precioOriginal?: number };

// --- Formateador de moneda para CLP ---
const formateadorDeMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(valor);
};

// --- Componente de Tarjeta de Producto ---
const TarjetaProducto: React.FC<{ producto: ProductWithOptionalPrice }> = ({ producto }) => {
  const tieneDescuento = producto.precioOriginal && producto.precioOriginal > producto.precio;
  const porcentajeDescuento = tieneDescuento
    ? Math.round(((producto.precioOriginal! - producto.precio) / producto.precioOriginal!) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden relative group transition-transform duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 border border-gray-100">
      {/* Etiqueta de Descuento */}
      {tieneDescuento && (
        <div className="absolute top-3 left-3 bg-[#E91E63] text-white text-xs font-bold px-2 py-1 rounded-md z-10">
          -{porcentajeDescuento}%
        </div>
      )}

      {/* Botón de Favoritos */}
      <button className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full z-10 transition-colors hover:bg-white">
        <Heart className="w-5 h-5 text-gray-600" />
      </button>

      {/* Imagen del Producto */}
      <div className="w-full h-48 flex items-center justify-center p-4 bg-white">
        <img
          src={producto.imagen || 'https://via.placeholder.com/150?text=Imagen+no+disponible'}
          alt={producto.nombre}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Imagen+no+disponible';
          }}
        />
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-4 text-center">
        <h3 className="text-sm font-medium text-gray-800 mb-2 truncate" title={producto.nombre}>
          {producto.nombre}
        </h3>
        <div className="flex items-center justify-center space-x-2 flex-wrap">
          {tieneDescuento && (
            <span className="text-gray-500 text-sm line-through">
              {formateadorDeMoneda(producto.precioOriginal!)}
            </span>
          )}
          <span className="text-lg font-bold text-gray-900">
            {formateadorDeMoneda(producto.precio)}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Componente de la Sección Principal ---
const ProductosDestacados: React.FC = () => {
  const { products, loading, error } = useProducts();

  const productosElectro = products
    .filter(p => p.categoria === 'electrohogar')
    .slice(0, 4);

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        {/* Encabezado de la Sección */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Electrodomésticos</h2>
          <a
            href="/productos?categoria=electrohogar"
            className="text-sm font-semibold text-[#0077c0] hover:text-blue-700 transition-colors"
          >
            Ver todo &gt;
          </a>
        </div>

        {/* Estado de Carga */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 text-gray-500 animate-spin" />
            <span className="ml-4 text-gray-600">Cargando productos...</span>
          </div>
        )}

        {/* Estado de Error */}
        {error && (
          <div className="flex justify-center items-center h-64 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <span className="ml-4 text-red-700">Error al cargar los productos.</span>
          </div>
        )}

        {/* Cuadrícula de Productos */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {productosElectro.length > 0 ? (
              productosElectro.map((producto) => (
                <TarjetaProducto key={producto.id} producto={producto as ProductWithOptionalPrice} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">No se encontraron productos en esta categoría.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductosDestacados;
