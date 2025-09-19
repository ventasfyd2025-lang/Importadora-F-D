'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserAuth } from '@/hooks/useUserAuth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ShoppingBagIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  ClockIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
  };
  trackingNumber?: string;
  notes?: string;
  chatEnabled?: boolean;
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'text-yellow-600 bg-yellow-50', 
    icon: ClockIcon 
  },
  confirmed: { 
    label: 'Confirmado', 
    color: 'text-blue-600 bg-blue-50', 
    icon: CheckCircleIcon 
  },
  preparing: { 
    label: 'Preparando', 
    color: 'text-purple-600 bg-purple-50', 
    icon: ShoppingBagIcon 
  },
  shipped: { 
    label: 'Enviado', 
    color: 'text-orange-600 bg-orange-50', 
    icon: TruckIcon 
  },
  delivered: { 
    label: 'Entregado', 
    color: 'text-green-600 bg-green-50', 
    icon: CheckCircleIcon 
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'text-red-600 bg-red-50', 
    icon: XCircleIcon 
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

export default function OrdersPage() {
  const { currentUser, userProfile, isRegistered, loading } = useUserAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isRegistered) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      loadOrders();
    }
  }, [currentUser, loading, isRegistered, router]);

  const loadOrders = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingOrders(true);
      // Buscar pedidos por userId (uid o email)
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid || currentUser.email)
      );
      
      const snapshot = await getDocs(ordersQuery);
      const ordersData: Order[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
        } as Order);
      });
      
      // Ordenar en el cliente
      ordersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isRegistered) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <ShoppingBagIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
                <p className="text-gray-600">Historial y seguimiento de tus compras</p>
              </div>
            </div>
            
            {/* Botón volver al home */}
            <Link 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <HomeIcon className="h-5 w-5 mr-2" />
              Volver al Home
            </Link>
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No tienes pedidos aún</h3>
            <p className="text-gray-600 mb-6">¡Explora nuestra tienda y realiza tu primera compra!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Ir a la Tienda
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon;
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pedido #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {order.createdAt.toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status].color}`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {statusConfig[order.status].label}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items.length} producto{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    {/* Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Productos</h4>
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              {item.imagen && (
                                <img 
                                  src={item.imagen} 
                                  alt={item.nombre}
                                  className="h-12 w-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.nombre}</p>
                                <p className="text-sm text-gray-600">
                                  Cantidad: {item.cantidad} × {formatPrice(item.precio)}
                                </p>
                              </div>
                              <p className="font-medium text-gray-900">
                                {formatPrice(item.precio * item.cantidad)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Información de Envío</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Nombre:</span> {order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                          <p><span className="font-medium">Email:</span> {order.shippingAddress.email}</p>
                          <p><span className="font-medium">Teléfono:</span> {order.shippingAddress.phone}</p>
                          <p><span className="font-medium">Dirección:</span> {order.shippingAddress.street}</p>
                          <p><span className="font-medium">Ciudad:</span> {order.shippingAddress.city}, {order.shippingAddress.region}</p>
                          <p><span className="font-medium">Código Postal:</span> {order.shippingAddress.postalCode}</p>
                          {order.trackingNumber && (
                            <p><span className="font-medium">Seguimiento:</span> {order.trackingNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-3">
                          <Link
                            href={`/chat/${order.id}`}
                            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                            Abrir Chat
                          </Link>
                          
                          {order.status === 'shipped' && order.trackingNumber && (
                            <button
                              onClick={() => window.open(`https://www.correos.cl/SitePages/seguimiento/seguimiento.aspx?envio=${order.trackingNumber}`, '_blank')}
                              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <TruckIcon className="h-4 w-4 mr-2" />
                              Rastrear Envío
                            </button>
                          )}
                        </div>

                        <div className="text-sm text-gray-500">
                          Última actualización: {order.updatedAt.toLocaleDateString('es-CL')}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}