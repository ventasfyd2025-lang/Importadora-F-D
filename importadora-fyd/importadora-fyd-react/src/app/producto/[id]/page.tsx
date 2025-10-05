'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import Layout from '@/components/Layout';
import OfferPopup from '@/components/OfferPopup';
import { useOfferPopup } from '@/hooks/useOfferPopup';
import { ChevronLeftIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { currentUser, loading: authLoading } = useUserAuth();
  const { popupConfig } = useOfferPopup();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      if (!params.id) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // First try Firebase
        try {
          const productDoc = await getDoc(doc(db, 'products', params.id as string));
          
          if (productDoc.exists()) {
            const productData = {
              id: productDoc.id,
              ...productDoc.data()
            } as Product;

            console.log('📦 Producto cargado:', productData.nombre);
            console.log('📸 Imágenes del producto:', {
              imagen: productData.imagen,
              imagenes: productData.imagenes,
              totalImagenes: productData.imagenes?.length || 0
            });

            setProduct(productData);
            return;
          }
        } catch (firebaseErr) {
          // Firebase error, trying mock data
        }
        
        // If Firebase fails or product not found, try mock data
        const { mockProducts } = await import('@/utils/mockProducts');
        const mockProduct = mockProducts.find(p => p.id === params.id);
        
        if (mockProduct) {
          setProduct(mockProduct);
        } else {
          setError('Producto no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Verificar si el usuario está logueado
    if (!currentUser && !authLoading) {
      // Mostrar modal de confirmación para login
      const shouldLogin = window.confirm(
        '¿Deseas iniciar sesión para agregar productos al carrito?\n\n' +
        'Si inicias sesión podrás:\n' +
        '• Guardar tus productos\n' +
        '• Realizar compras más rápido\n' +
        '• Ver el historial de pedidos\n\n' +
        'Presiona OK para ir al login o Cancelar para continuar como invitado.'
      );
      
      if (shouldLogin) {
        router.push('/login');
        return;
      }
      // Si decide continuar como invitado, procede a agregar al carrito
    }

    addItem(product.id, product.nombre, product.precio, product.imagen, quantity, product.sku);

    // Show notification
    const notification = document.createElement('div');
    notification.textContent = currentUser 
      ? `${quantity} ${product.nombre} agregado al carrito`
      : `${quantity} ${product.nombre} agregado al carrito (como invitado)`;
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 transition-all duration-300';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando producto...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Producto no encontrado'}
            </h1>
            <Link 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Inicio</Link>
          <span>/</span>
          <Link href={`/?category=${product.categoria}`} className="hover:text-gray-700 capitalize">
            {product.categoria}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.nombre}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {(() => {
                const images = product.imagenes && product.imagenes.length > 0
                  ? product.imagenes
                  : product.imagen
                    ? [product.imagen]
                    : [];

                return images.length > 0 ? (
                  <Image
                    src={images[selectedImageIndex] || images[0]}
                    alt={product.nombre}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-8xl">📦</span>
                  </div>
                );
              })()}

              {/* Badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {product.nuevo && (
                  <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                    Nuevo
                  </span>
                )}
                {product.oferta && (
                  <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                    Oferta
                  </span>
                )}
              </div>

              {/* Navigation Arrows */}
              {(() => {
                const images = product.imagenes && product.imagenes.length > 0
                  ? product.imagenes
                  : product.imagen
                    ? [product.imagen]
                    : [];

                return images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1
                      )}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Thumbnail Gallery */}
            {(() => {
              const images = product.imagenes && product.imagenes.length > 0
                ? product.imagenes
                : product.imagen
                  ? [product.imagen]
                  : [];

              return images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-md overflow-hidden border-3 transition-all ${
                        selectedImageIndex === index
                          ? 'border-green-500 border-4'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.nombre} - imagen ${index + 1}`}
                        fill
                        className="object-contain p-1"
                        sizes="96px"
                      />
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.nombre}
              </h1>
              <p className="text-lg text-gray-600 capitalize">
                Categoría: {product.categoria}
              </p>
              {product.sku && (
                <p className="text-sm text-gray-500 mt-1">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {product.oferta && product.precioOriginal && product.precioOriginal > product.precio ? (
                <>
                  <div className="text-2xl text-gray-500 line-through">
                    {formatPrice(product.precioOriginal)}
                  </div>
                  <div className="text-4xl font-bold text-red-600">
                    {formatPrice(product.precio)}
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100)}% OFF
                  </div>
                </>
              ) : (
                <div className="text-4xl font-bold text-blue-600">
                  {formatPrice(product.precio)}
                </div>
              )}
            </div>

            {product.descripcion && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.descripcion}
                </p>
              </div>
            )}

            {/* Stock Info */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">Stock disponible:</span>
              <span className={`font-semibold ${
                product.stock > 10 ? 'text-green-600' : 
                product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {product.stock > 0 ? `${product.stock} unidades` : 'Sin stock'}
              </span>
            </div>

            {product.stock > 0 && (
              <>
                {/* Quantity Selector */}
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Cantidad:</span>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <div className="space-y-4">
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Agregar al carrito ({formatPrice(product.precio * quantity)})
                  </button>
                  
                  <Link
                    href="/carrito"
                    className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-md transition-colors duration-200"
                  >
                    Ver carrito
                  </Link>
                </div>
              </>
            )}

            {product.stock === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 font-medium">
                  Este producto no está disponible en este momento
                </p>
              </div>
            )}

            {/* Back Button */}
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>

      {/* Offer Popup */}
      <OfferPopup
        title={popupConfig.title}
        description={popupConfig.description}
        buttonText={popupConfig.buttonText}
        buttonLink={popupConfig.buttonLink}
        isActive={popupConfig.active}
        size={popupConfig.size}
        position={popupConfig.position}
        mediaUrl={popupConfig.mediaUrl}
        isVideo={popupConfig.isVideo}
        popupType={popupConfig.popupType}
        onClose={() => {}}
      />
    </Layout>
  );
}
