'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useProducts } from '@/hooks/useProducts';
import { useNotification } from '@/context/NotificationContext';
import { useUserAuth } from '@/hooks/useUserAuth';
import type { Discount, Product } from '@/types';
import { TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function DiscountManagement() {
  const [descuentos, setDescuentos] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { products } = useProducts();
  const { addNotification } = useNotification();
  const { isAdmin, loading: authLoading } = useUserAuth();

  // No renderizar si no es admin
  if (!authLoading && !isAdmin) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  const [formData, setFormData] = useState<{
    codigo: string;
    descripcion: string;
    descuento: number;
    tipo: 'porcentaje' | 'fijo';
    productosAplicables: string[];
    fechaInicio: string;
    fechaFin: string;
    activo: boolean;
  }>({
    codigo: '',
    descripcion: '',
    descuento: 0,
    tipo: 'porcentaje',
    productosAplicables: [],
    fechaInicio: '',
    fechaFin: '',
    activo: true,
  });

  // Cargar descuentos solo si es admin
  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadDiscounts();
    }
  }, [authLoading, isAdmin]);

  const loadDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'discounts'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        ...doc.data() as Discount,
        id: doc.id,
      }));
      setDescuentos(data);
    } catch (error) {
      console.error('Error loading discounts:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los descuentos',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'El código es requerido',
        duration: 3000,
      });
      return;
    }

    if (formData.descuento <= 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'El descuento debe ser mayor a 0',
        duration: 3000,
      });
      return;
    }

    if (!formData.fechaInicio || !formData.fechaFin) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Las fechas de inicio y fin son requeridas',
        duration: 3000,
      });
      return;
    }

    const fechaInicio = new Date(formData.fechaInicio);
    const fechaFin = new Date(formData.fechaFin);

    if (fechaInicio >= fechaFin) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'La fecha de fin debe ser posterior a la de inicio',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      const dataToSave = {
        codigo: formData.codigo.trim().toUpperCase(),
        descripcion: formData.descripcion,
        descuento: formData.descuento,
        tipo: formData.tipo,
        productosAplicables: formData.productosAplicables,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        activo: formData.activo,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        // Actualizar
        await updateDoc(doc(db, 'discounts', editingId), dataToSave);
        addNotification({
          type: 'success',
          title: 'Éxito',
          message: 'Descuento actualizado',
          duration: 3000,
        });
      } else {
        // Crear nuevo
        await addDoc(collection(db, 'discounts'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        addNotification({
          type: 'success',
          title: 'Éxito',
          message: 'Descuento creado',
          duration: 3000,
        });
      }

      setFormData({
        codigo: '',
        descripcion: '',
        descuento: 0,
        tipo: 'porcentaje',
        productosAplicables: [],
        fechaInicio: '',
        fechaFin: '',
        activo: true,
      });
      setEditingId(null);
      setShowForm(false);
      loadDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el descuento',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (descuento: Discount) => {
    setFormData({
      codigo: descuento.codigo,
      descripcion: descuento.descripcion || '',
      descuento: descuento.descuento,
      tipo: descuento.tipo,
      productosAplicables: descuento.productosAplicables,
      fechaInicio: descuento.fechaInicio.split('T')[0], // Solo fecha
      fechaFin: descuento.fechaFin.split('T')[0], // Solo fecha
      activo: descuento.activo,
    });
    setEditingId(descuento.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este descuento?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'discounts', id));
      addNotification({
        type: 'success',
        title: 'Éxito',
        message: 'Descuento eliminado',
        duration: 3000,
      });
      loadDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el descuento',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      codigo: '',
      descripcion: '',
      descuento: 0,
      tipo: 'porcentaje',
      productosAplicables: [],
      fechaInicio: '',
      fechaFin: '',
      activo: true,
    });
  };

  const toggleProducto = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productosAplicables: prev.productosAplicables.includes(productId)
        ? prev.productosAplicables.filter(id => id !== productId)
        : [...prev.productosAplicables, productId],
    }));
  };

  const isDiscountValid = (descuento: Discount) => {
    const ahora = new Date();
    const fechaInicio = new Date(descuento.fechaInicio);
    const fechaFin = new Date(descuento.fechaFin);
    return descuento.activo && ahora >= fechaInicio && ahora <= fechaFin;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Descuentos</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Descuento
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar Descuento' : 'Crear Nuevo Descuento'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Código */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código</label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, codigo: e.target.value }))
                  }
                  placeholder="Ej: REGALO20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, descripcion: e.target.value }))
                  }
                  placeholder="Ej: Descuento por regalo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Tipo y Monto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      tipo: e.target.value as 'porcentaje' | 'fijo',
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Monto Fijo ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descuento {formData.tipo === 'porcentaje' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  value={formData.descuento}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      descuento: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="20"
                  min="0"
                  step={formData.tipo === 'porcentaje' ? '0.1' : '100'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={formData.fechaFin}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, fechaFin: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, activo: e.target.checked }))
                }
                className="w-4 h-4"
                disabled={loading}
              />
              <label htmlFor="activo" className="text-sm font-medium">
                Descuento Activo
              </label>
            </div>

            {/* Productos */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Productos Aplicables ({formData.productosAplicables.length})
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                {products.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay productos disponibles</p>
                ) : (
                  products.map(product => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.productosAplicables.includes(product.id)}
                        onChange={() => toggleProducto(product.id)}
                        className="w-4 h-4"
                        disabled={loading}
                      />
                      <span className="text-sm flex-1">
                        {product.nombre}
                        <span className="text-gray-500 ml-2">
                          (${product.precio.toLocaleString('es-CL')})
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Descuentos */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Cargando descuentos...</p>
            </div>
          ) : descuentos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No hay descuentos creados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Descuento
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Vigencia
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {descuentos.map(descuento => {
                    const valido = isDiscountValid(descuento);
                    const displayValue = descuento.tipo === 'porcentaje'
                      ? `${descuento.descuento}%`
                      : `$${descuento.descuento}`;

                    return (
                      <tr key={descuento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold">
                          {descuento.codigo}
                        </td>
                        <td className="px-6 py-4 text-green-600 font-medium">
                          -{displayValue}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>
                            Inicio:{' '}
                            {new Date(descuento.fechaInicio).toLocaleDateString('es-CL')}
                          </div>
                          <div>
                            Fin:{' '}
                            {new Date(descuento.fechaFin).toLocaleDateString('es-CL')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {descuento.productosAplicables.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {descuento.productosAplicables.slice(0, 2).map(productId => {
                                const product = products.find(p => p.id === productId);
                                return product ? (
                                  <span
                                    key={productId}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                  >
                                    {product.nombre}
                                  </span>
                                ) : null;
                              })}
                              {descuento.productosAplicables.length > 2 && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  +{descuento.productosAplicables.length - 2} más
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              valido
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {valido ? 'Vigente' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => handleEdit(descuento)}
                            className="text-blue-600 hover:text-blue-800 inline-flex"
                            disabled={loading}
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(descuento.id)}
                            className="text-red-600 hover:text-red-800 inline-flex"
                            disabled={loading}
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
