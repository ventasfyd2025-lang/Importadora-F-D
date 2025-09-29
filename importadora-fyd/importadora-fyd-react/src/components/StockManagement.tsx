'use client';

import { useState, useEffect } from 'react';
import { useStockManager, StockTransaction } from '@/hooks/useStockManager';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';
import {
  PlusIcon,
  MinusIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface StockManagementProps {
  productId?: string;
  className?: string;
}

export default function StockManagement({ productId, className }: StockManagementProps) {
  const { products, loading: productsLoading } = useProducts();
  const { adjustStock, restockProduct, getProductTransactions, loading } = useStockManager();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    newStock: '',
    reason: ''
  });
  const [restockData, setRestockData] = useState({
    quantity: '',
    reason: ''
  });

  // Auto-select product if productId provided
  useEffect(() => {
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        loadTransactions(productId);
      }
    }
  }, [productId, products]);

  const loadTransactions = async (pId: string) => {
    const productTransactions = await getProductTransactions(pId);
    setTransactions(productTransactions);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    loadTransactions(product.id);
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !adjustmentData.newStock || !adjustmentData.reason) return;

    try {
      await adjustStock(
        selectedProduct.id,
        selectedProduct.nombre,
        parseInt(adjustmentData.newStock),
        adjustmentData.reason
      );

      // Refresh product data and transactions
      loadTransactions(selectedProduct.id);
      setShowAdjustModal(false);
      setAdjustmentData({ newStock: '', reason: '' });

      // Update selected product stock
      setSelectedProduct(prev => prev ? {
        ...prev,
        stock: parseInt(adjustmentData.newStock)
      } : null);

    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error al ajustar el stock: ' + (error as Error).message);
    }
  };

  const handleRestock = async () => {
    if (!selectedProduct || !restockData.quantity) return;

    try {
      await restockProduct(
        selectedProduct.id,
        selectedProduct.nombre,
        parseInt(restockData.quantity),
        restockData.reason || 'Reposición de inventario'
      );

      // Refresh product data and transactions
      loadTransactions(selectedProduct.id);
      setShowRestockModal(false);
      setRestockData({ quantity: '', reason: '' });

      // Update selected product stock
      setSelectedProduct(prev => prev ? {
        ...prev,
        stock: prev.stock + parseInt(restockData.quantity)
      } : null);

    } catch (error) {
      console.error('Error restocking product:', error);
      alert('Error al reabastecer: ' + (error as Error).message);
    }
  };

  const getTransactionIcon = (type: StockTransaction['type']) => {
    switch (type) {
      case 'sale':
      case 'reservation':
        return <MinusIcon className="h-4 w-4 text-red-600" />;
      case 'restock':
      case 'release':
        return <PlusIcon className="h-4 w-4 text-green-600" />;
      case 'adjustment':
        return <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionTypeText = (type: StockTransaction['type']) => {
    switch (type) {
      case 'sale':
        return 'Venta';
      case 'reservation':
        return 'Reserva';
      case 'restock':
        return 'Reposición';
      case 'adjustment':
        return 'Ajuste';
      case 'release':
        return 'Liberación';
      default:
        return type;
    }
  };

  const getStockStatus = (stock: number) => {
    const minStock = 5; // This should come from product data
    if (stock === 0) return { color: 'text-red-600', text: 'Sin Stock', icon: ExclamationTriangleIcon };
    if (stock <= minStock / 2) return { color: 'text-orange-600', text: 'Stock Crítico', icon: ExclamationTriangleIcon };
    if (stock <= minStock) return { color: 'text-yellow-600', text: 'Stock Bajo', icon: ExclamationTriangleIcon };
    return { color: 'text-green-600', text: 'Stock Normal', icon: null };
  };

  if (productsLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Gestión de Stock
        </h2>

        {/* Product Selector */}
        {!productId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Producto
            </label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value);
                if (product) handleProductSelect(product);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un producto...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nombre} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Product Info */}
        {selectedProduct && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedProduct.nombre}
              </h3>
              <div className="flex items-center space-x-2">
                {(() => {
                  const status = getStockStatus(selectedProduct.stock);
                  return (
                    <>
                      {status.icon && <status.icon className={`h-5 w-5 ${status.color}`} />}
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedProduct.stock}
                </div>
                <div className="text-sm text-gray-600">Stock Actual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  5
                </div>
                <div className="text-sm text-gray-600">Stock Mínimo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedProduct.precio?.toLocaleString('es-CL', {
                    style: 'currency',
                    currency: 'CLP'
                  })}
                </div>
                <div className="text-sm text-gray-600">Precio</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowRestockModal(true)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Reabastecer
              </button>
              <button
                onClick={() => {
                  setAdjustmentData({ newStock: selectedProduct.stock.toString(), reason: '' });
                  setShowAdjustModal(true);
                }}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Ajustar Stock
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions History */}
      {selectedProduct && (
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Historial de Movimientos
          </h3>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getTransactionTypeText(transaction.type)}
                        {transaction.orderId && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Orden: {transaction.orderId.slice(-6)})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('es-CL')}
                      </div>
                      {transaction.reason && (
                        <div className="text-xs text-gray-600 mt-1">
                          {transaction.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.previousStock} → {transaction.newStock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay movimientos registrados para este producto
            </div>
          )}
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reabastecer Producto
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad a agregar
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockData.quantity}
                  onChange={(e) => setRestockData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={restockData.reason}
                  onChange={(e) => setRestockData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Compra a proveedor"
                />
              </div>

              {selectedProduct && restockData.quantity && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-sm text-blue-800">
                    Stock actual: <span className="font-medium">{selectedProduct.stock}</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    Nuevo stock: <span className="font-medium">
                      {selectedProduct.stock + parseInt(restockData.quantity || '0')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleRestock}
                disabled={loading || !restockData.quantity}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Reabastecer'}
              </button>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockData({ quantity: '', reason: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ajustar Stock
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuevo stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentData.newStock}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, newStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del ajuste
                </label>
                <input
                  type="text"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Corrección de inventario"
                  required
                />
              </div>

              {selectedProduct && adjustmentData.newStock && (
                <div className="bg-yellow-50 p-3 rounded-md">
                  <div className="text-sm text-yellow-800">
                    Stock actual: <span className="font-medium">{selectedProduct.stock}</span>
                  </div>
                  <div className="text-sm text-yellow-800">
                    Nuevo stock: <span className="font-medium">{adjustmentData.newStock}</span>
                  </div>
                  <div className="text-sm text-yellow-800">
                    Diferencia: <span className={`font-medium ${
                      parseInt(adjustmentData.newStock) - selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseInt(adjustmentData.newStock) - selectedProduct.stock > 0 ? '+' : ''}
                      {parseInt(adjustmentData.newStock) - selectedProduct.stock}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleStockAdjustment}
                disabled={loading || !adjustmentData.newStock || !adjustmentData.reason}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Ajustar Stock'}
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustmentData({ newStock: '', reason: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}