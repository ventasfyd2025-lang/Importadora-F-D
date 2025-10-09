'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useUserAuth } from '@/hooks/useUserAuth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, getDocs, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: any; // Puede ser Timestamp de Firebase o string
  paymentMethod: string;
  items: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
}

interface Stats {
  pendingOrders: number;
  todayOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

// Componente de Login
function VendedorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Panel de Vendedor
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Inicia sesión para acceder al panel
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Dirección de email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-lg font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default function VendedorPage() {
  const { currentUser, isAdmin, isVendedor, userProfile } = useUserAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    pendingOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  // Calculate stats function - defined before useEffect
  const calculateStats = (ordersData: Order[]) => {
    const today = new Date().toISOString().split('T')[0];

    const pendingOrders = ordersData.filter(order =>
      order.status === 'pending' || order.status === 'pending_verification'
    ).length;

    const todayOrders = ordersData.filter(order => {
      try {
        // Manejar tanto Timestamp de Firebase como strings
        const orderDate = order.createdAt?.toDate ?
          order.createdAt.toDate().toISOString().split('T')[0] :
          (typeof order.createdAt === 'string' ? order.createdAt.split('T')[0] : '');
        return orderDate === today;
      } catch {
        return false;
      }
    }).length;

    const totalRevenue = ordersData
      .filter(order => order.status === 'confirmed' || order.status === 'shipped')
      .reduce((sum, order) => sum + order.total, 0);

    const uniqueCustomers = new Set(ordersData.map(order => order.customerEmail)).size;

    setStats({
      pendingOrders,
      todayOrders,
      totalRevenue,
      totalCustomers: uniqueCustomers
    });
  };

  // Load orders - moved before conditional returns
  useEffect(() => {
    if (!currentUser) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      setOrders(ordersData);
      calculateStats(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Si no está autenticado, mostrar login
  if (!currentUser) {
    return <VendedorLogin />;
  }

  // Si está autenticado pero no tiene rol de admin o vendedor
  if (userProfile && !isAdmin && !isVendedor) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
            <p className="text-gray-600">
              No tienes permisos para acceder al panel de vendedor.
            </p>
            <p className="text-sm text-gray-500">
              Tu rol actual es: <span className="font-medium">{userProfile.role}</span>
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const resendEmail = async (orderId: string, email: string) => {
    // Funcionalidad de reenvío de email temporalmente deshabilitada
    alert('Funcionalidad de reenvío temporalmente deshabilitada');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'delivered': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending_verification': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      case 'pending_verification': return 'Verificando Pago';
      default: return status;
    }
  };

  if (!currentUser) {
    return <div>Cargando...</div>;
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Cargando panel de vendedor...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Vendedor</h1>
            <p className="text-gray-600">Gestiona pedidos y atiende a los clientes</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-lg font-bold text-gray-600">Pedidos Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ShoppingBagIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-lg font-bold text-gray-600">Pedidos Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-lg font-bold text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString('es-CL')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-lg font-bold text-gray-600">Clientes Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Gestión de Pedidos
                </button>
              </nav>
            </div>

            {/* Orders Management */}
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">Pedidos Recientes</h2>
                <p className="text-sm text-gray-500">Gestiona el estado de los pedidos</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 20).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-gray-900">#{order.id.slice(-8)}</div>
                          <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-gray-900">
                            ${order.total.toLocaleString('es-CL')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(() => {
                            try {
                              const date = order.createdAt?.toDate ?
                                order.createdAt.toDate() :
                                new Date(order.createdAt);
                              return date.toLocaleDateString('es-CL');
                            } catch {
                              return 'Fecha inválida';
                            }
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg font-bold space-x-2">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                            <option value="pending_verification">Verificando</option>
                          </select>

                          <button
                            onClick={() => resendEmail(order.id, order.customerEmail)}
                            className="text-lg font-bold text-blue-600 hover:text-blue-900"
                            title="Reenviar email"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => router.push(`/chat/${order.id}`)}
                            className="text-lg font-bold text-green-600 hover:text-green-900"
                            title="Ver chat"
                          >
                            💬
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}