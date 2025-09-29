'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useUserAuth } from '@/hooks/useUserAuth';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/hooks/useUserAuth';

export default function UsuariosAdminPage() {
  const { isAdmin, userProfile, currentUser } = useUserAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  // Verificar acceso de admin
  if (!currentUser) {
    router.push('/auth');
    return null;
  }

  if (userProfile && !isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
            <p className="text-gray-600">
              Solo los administradores pueden gestionar usuarios.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Volver al Panel Admin
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'vendedor' | 'cliente') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });

      // Actualizar estado local
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, role: newRole } : user
      ));

      setEditingUser(null);
      alert('Rol actualizado exitosamente');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar rol');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(user => user.uid !== userId));
      alert('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'vendedor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cliente': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Cargando usuarios...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra roles y permisos de usuarios</p>
          </div>

          {/* Administradores y Vendedores */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <h3 className="text-lg font-medium text-red-900">👑 Administradores y Vendedores</h3>
              <p className="text-sm text-red-700">Personal autorizado con permisos especiales</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.filter(user => user.role === 'admin' || user.role === 'vendedor').map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.uid ? (
                          <select
                            defaultValue={user.role}
                            onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role || 'cliente')}`}>
                            {user.role || 'cliente'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? (() => {
                          try {
                            const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
                            return date.toLocaleDateString('es-CL');
                          } catch (error) {
                            return 'Fecha inválida';
                          }
                        })() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingUser === user.uid ? (
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUser(user.uid)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Editar Rol
                            </button>
                            {user.uid !== userProfile?.uid && (
                              <button
                                onClick={() => deleteUser(user.uid)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clientes */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <h3 className="text-lg font-medium text-green-900">👥 Clientes</h3>
              <p className="text-sm text-green-700">Usuarios registrados de la tienda</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.filter(user => !user.role || user.role === 'cliente').map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.uid ? (
                          <select
                            defaultValue={user.role || 'cliente'}
                            onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role || 'cliente')}`}>
                            {user.role || 'cliente'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? (() => {
                          try {
                            const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
                            return date.toLocaleDateString('es-CL');
                          } catch (error) {
                            return 'Fecha inválida';
                          }
                        })() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingUser === user.uid ? (
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUser(user.uid)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Editar Rol
                            </button>
                            {user.uid !== userProfile?.uid && (
                              <button
                                onClick={() => deleteUser(user.uid)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Cómo crear usuarios vendedor</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>Opción 1 - Firebase Console:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Ve a Firebase Console &gt; Authentication &gt; Users</li>
                <li>Haz clic en "Add user"</li>
                <li>Ingresa email y contraseña</li>
                <li>Aquí en esta página, cambia el rol a "Vendedor"</li>
              </ol>

              <p className="mt-4"><strong>Opción 2 - Desde el sitio:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>El vendedor se registra normalmente en /auth</li>
                <li>Por defecto tendrá rol "Cliente"</li>
                <li>Aquí cambias su rol a "Vendedor"</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}