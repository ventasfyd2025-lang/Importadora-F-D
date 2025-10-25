'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Order } from '@/types';
import { useUserAuth } from '@/hooks/useUserAuth';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import optimizeImageFile from '@/utils/imageProcessing';

interface ChatMessage {
  id: string;
  orderId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  isAdmin: boolean;
  timestamp: Date;
  read: boolean;
  imageUrl?: string;
  imageFileName?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useUserAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Protección de ruta: redirigir si no es administrador
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      console.warn('⚠️ Acceso denegado a /admin/pedido: usuario no es administrador');
      router.push('/');
    }
  }, [authLoading, user, isAdmin, router]);

  // Load order details with real-time listener
  useEffect(() => {
    if (!orderId) return;

    console.log('📦 [Order Detail] Setting up order listener for:', orderId);

    const unsubscribeOrder = onSnapshot(
      doc(db, 'orders', orderId),
      (orderDoc) => {
        try {
          if (orderDoc.exists()) {
            const orderData = {
              id: orderDoc.id,
              ...orderDoc.data(),
              createdAt: orderDoc.data().createdAt?.toDate() || new Date()
            } as Order;
            console.log('📦 [Order Detail] Order updated:', { status: orderData.status });
            setOrder(orderData);
          }
        } catch (error) {
          console.error('Error processing order snapshot:', error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error loading order:', error);
        setLoading(false);
      }
    );

    return () => unsubscribeOrder();
  }, [orderId]);

  // Load chat messages
  useEffect(() => {
    if (!orderId) return;

    console.log('📨 [Order Detail] Setting up message listener for order:', orderId);

    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('orderId', '==', orderId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const message = {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage;

        messages.push(message);
      });

      console.log('📨 [Order Detail] Messages updated:', messages.length, 'messages', {
        docChanges: snapshot.docChanges().length,
        changes: snapshot.docChanges().map(c => ({ type: c.type, id: c.doc.id }))
      });

      setChatMessages(messages);
    }, (error) => {
      console.error('❌ [Order Detail] Error loading messages:', error);
    });

    return () => {
      console.log('🔌 [Order Detail] Unsubscribing from message listener');
      unsubscribe();
    };
  }, [orderId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            console.log('📍 [Order Detail Chat] Scrolled to bottom');
          }
        });
      }
    };

    scrollToBottom();
  }, [chatMessages]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !user || !order) return;

    setSendingMessage(true);
    setUploadingImage(true);

    try {
      let imageUrl = '';
      let imageFileName = '';

      // Upload image if selected
      if (selectedImage) {
        const optimizedImage = await optimizeImageFile(selectedImage);
        const timestamp = new Date().getTime();
        const fileName = `chat-images/${orderId}/${timestamp}-admin-${optimizedImage.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, optimizedImage);
        imageUrl = await getDownloadURL(storageRef);
        imageFileName = selectedImage.name; // Keep original name for display
      }

      await addDoc(collection(db, 'chat_messages'), {
        orderId: orderId,
        userId: order.customerEmail, // Use customer email as userId for proper filtering
        userEmail: order.customerEmail, // Send to customer's email
        userName: 'Admin FyD',
        message: newMessage.trim() || (imageUrl ? 'Imagen enviada por el administrador' : ''),
        isAdmin: true,
        timestamp: serverTimestamp(),
        read: false, // Admin messages should start as unread for client
        ...(imageUrl && { imageUrl, imageFileName })
      });

      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
      setUploadingImage(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona solo archivos de imagen');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const updateOrderStatus = async (newStatus: Order['status']) => {
    if (!order) return;

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      setOrder({ ...order, status: newStatus });

      // Send automatic message about status change
      const statusMessages: Record<string, string> = {
        'pending': 'Pedido en estado pendiente',
        'pending_verification': 'Verificando comprobante de pago',
        'pending_payment': 'Pendiente de pago',
        'confirmed': 'Pago confirmado, preparando pedido',
        'preparing': 'Pedido en preparación',
        'processing': 'Pedido en procesamiento',
        'shipped': 'Pedido enviado',
        'delivered': 'Pedido entregado',
        'completed': 'Pedido completado',
        'cancelled': 'Pedido cancelado'
      };

      await addDoc(collection(db, 'chat_messages'), {
        orderId: orderId,
        userId: order.customerEmail, // Use customer email as userId for proper filtering
        userEmail: order.customerEmail, // Send to customer's email
        userName: 'Sistema FyD',
        message: `Estado del pedido actualizado: ${statusMessages[newStatus]}`,
        isAdmin: true,
        timestamp: serverTimestamp(),
        read: false
      });

    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_verification': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'pending_verification': return 'Verificando Pago';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido no encontrado</h1>
          <button
            onClick={() => window.close()}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header igual al cliente */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.close()}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin - Pedido #{order.id.slice(-8).toUpperCase()}
                </h1>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
              </div>
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

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar izquierdo - Información del Pedido */}
          <div className="lg:col-span-1 space-y-6">
            {/* Estado del Pedido - Admin Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Control de Estado</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Actualizar Estado
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(e.target.value as Order['status'])}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="pending_verification">Verificando Pago</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">Preparando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-base font-semibold text-gray-500">Nombre</p>
                  <p className="text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-500">Email</p>
                  <p className="text-gray-900">{order.customerEmail}</p>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-500">Teléfono</p>
                  <p className="text-gray-900">{order.customerPhone}</p>
                </div>

                <div className="sm:col-span-1">
                  <dt className="text-base font-semibold text-gray-500">RUT</dt>
                  <p className="text-gray-900">{order.customerRut || 'No proporcionado'}</p>
                </div>
                {order.shippingAddress && (
                  <div>
                    <p className="text-base font-semibold text-gray-500">Dirección</p>
                    <p className="text-gray-900 text-sm">{order.shippingAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen del Pedido */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h3>
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
                      <p className="text-base font-semibold text-gray-900">{item.nombre}</p>
                      <p className="text-xs text-gray-600">
                        {item.cantidad} × {formatPrice(item.precio)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 mt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Información de Pago */}
              <div className="mt-4 pt-3 border-t">
                <div className="space-y-2">
                  <div>
                    <p className="text-base font-semibold text-gray-500">Método de Pago</p>
                    <p className="text-gray-900">{order.paymentMethod || 'No especificado'}</p>
                  </div>
                  {order.paymentProof && (
                    <div>
                      <p className="text-green-600 text-sm">✅ Comprobante recibido</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Principal - Igual al cliente */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
              {/* Chat Header con gradiente */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">Admin FyD</h3>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <p className="text-sm opacity-90">Conectado</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456L3 21l2.544-5.906A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Panel de Administración</h4>
                    <p className="text-sm text-gray-600 mb-1">Comunicación con el cliente</p>
                    <p className="text-xs text-gray-500">Los mensajes aparecerán aquí</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                    >
                      {!message.isAdmin && (
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}

                      <div className={`max-w-xs lg:max-w-md ${message.isAdmin ? 'order-1' : 'order-2'}`}>
                        {!message.isAdmin && (
                          <div className="text-xs text-gray-500 mb-1 px-3">{message.userName}</div>
                        )}

                        <div
                          className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                            message.isAdmin
                              ? 'bg-orange-500 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          {message.imageUrl ? (
                            <div className="space-y-2">
                              <div className="relative max-w-xs">
                                <Image
                                  src={message.imageUrl}
                                  alt={message.imageFileName || 'Imagen enviada'}
                                  width={200}
                                  height={150}
                                  className="rounded-lg object-cover w-full h-auto"
                                  style={{ maxHeight: '200px' }}
                                />
                              </div>
                              {message.message && (
                                <p className="whitespace-pre-wrap">{message.message}</p>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{message.message}</p>
                          )}
                        </div>

                        <div className={`flex items-center mt-1 px-3 ${message.isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {message.isAdmin && (
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4 relative">
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs max-h-32 rounded-lg object-cover"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedImage?.name}
                    </p>
                  </div>
                )}

                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Responder al cliente..."
                      className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent max-h-24"
                      rows={2}
                      disabled={sendingMessage}
                    />
                  </div>

                  {/* Image Upload Button */}
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-xl transition-all duration-200 hover:scale-105">
                    <PhotoIcon className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>

                  <button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !selectedImage) || sendingMessage}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Comunicación directa con el cliente • {uploadingImage ? 'Subiendo imagen...' : 'Puedes enviar texto e imágenes'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Proof estilo cliente */}
        {order.paymentProof && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h4 className="font-medium text-gray-900">Comprobante de Pago</h4>
            </div>
            <div className="p-6">
              <div className="text-center">
              <img
                src={order.paymentProof}
                alt="Comprobante de pago"
                className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                style={{ maxHeight: '500px' }}
              />
              <p className="mt-2 text-gray-600">
                <a
                  href={order.paymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  Ver en tamaño completo
                </a>
              </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}