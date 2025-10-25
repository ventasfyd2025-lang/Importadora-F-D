'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useClientSideFormat } from '@/hooks/useClientSideFormat';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import optimizeImageFile from '@/utils/imageProcessing';
import { db, storage } from '@/lib/firebase';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  CheckIcon,
  PhotoIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  orderId: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  timestamp: Date;
  read: boolean;
  userEmail?: string;
  userName?: string;
  imageUrl?: string;
  imageFileName?: string;
}

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
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
    icon: ClockIcon,
    description: 'Tu pedido ha sido recibido y está siendo procesado'
  },
  confirmed: { 
    label: 'Confirmado', 
    color: 'text-blue-600 bg-blue-50 border-blue-200', 
    icon: CheckCircleIcon,
    description: 'Tu pedido ha sido confirmado y será preparado pronto'
  },
  preparing: { 
    label: 'Preparando', 
    color: 'text-purple-600 bg-purple-50 border-purple-200', 
    icon: CheckCircleIcon,
    description: 'Estamos preparando tu pedido para el envío'
  },
  shipped: { 
    label: 'Enviado', 
    color: 'text-orange-600 bg-orange-50 border-orange-200', 
    icon: TruckIcon,
    description: 'Tu pedido está en camino'
  },
  delivered: { 
    label: 'Entregado', 
    color: 'text-green-600 bg-green-50 border-green-200', 
    icon: CheckCircleIcon,
    description: '¡Tu pedido ha sido entregado exitosamente!'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: XCircleIcon,
    description: 'Este pedido ha sido cancelado'
  },
  pending_verification: {
    label: 'Pendiente de verificación',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: ClockIcon,
    description: 'Hemos recibido tu comprobante de pago y estamos verificando la transferencia'
  }
};

const getTimelineSteps = (status: string) => {
  const steps = [
    { key: 'pending', label: 'Pedido recibido' },
    { key: 'pending_verification', label: 'Verificando pago' },
    { key: 'confirmed', label: 'Confirmado' },
    { key: 'preparing', label: 'Preparando' },
    { key: 'shipped', label: 'Enviado' },
    { key: 'delivered', label: 'Entregado' }
  ];

  const statusOrder = ['pending', 'pending_verification', 'confirmed', 'preparing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);
  
  return steps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    current: index === currentIndex
  }));
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { currentUser, isRegistered, loading: authLoading } = useUserAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { formatTime } = useClientSideFormat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setOrderLoading(true);
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        setOrder({
          id: orderDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Order);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setOrderLoading(false);
    }
  }, [orderId]);

  const loadMessages = useCallback(() => {
    if (!currentUser || !orderId) return undefined;

    // Load ALL messages for this order (admin messages will be visible to the customer)
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('orderId', '==', orderId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages: ChatMessage[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        chatMessages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage);
      });

      // Ordenar por timestamp en el cliente
      chatMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      console.log('💬 [Chat] Loaded messages for order', orderId, ':', chatMessages.length, 'messages', {
        admin: chatMessages.filter(m => m.isAdmin).length,
        client: chatMessages.filter(m => !m.isAdmin).length
      });

      setMessages(chatMessages);

      // Mark admin messages as read
      const unreadAdminMessages = chatMessages.filter(msg => !msg.read && msg.isAdmin);
      if (unreadAdminMessages.length > 0) {
        console.log('📧 [Chat] Marking', unreadAdminMessages.length, 'admin messages as read');
        unreadAdminMessages.forEach(msg => {
          updateDoc(doc(db, 'chat_messages', msg.id), { read: true });
        });
      }
    }, (error) => {
      console.error('❌ [Chat] Error loading messages:', error);
    });

    return unsubscribe;
  }, [currentUser, orderId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }

    if (!currentUser) return;

    loadOrder();
    const unsubscribe = loadMessages();

    return () => {
      unsubscribe?.();
    };
  }, [authLoading, currentUser, loadMessages, loadOrder, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !currentUser || sendingMessage || !orderId) return;

    setSendingMessage(true);
    setUploadingImage(true);

    try {
      let imageUrl = '';
      let imageFileName = '';

      // Upload image if selected
      if (selectedImage) {
        const optimizedImage = await optimizeImageFile(selectedImage);
        const timestamp = new Date().getTime();
        const fileName = `chat-images/${orderId}/${timestamp}-${optimizedImage.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, optimizedImage);
        imageUrl = await getDownloadURL(storageRef);
        imageFileName = selectedImage.name; // Keep original name for display
      }

      const messageData = {
        orderId,
        userId: currentUser.email, // Use email for consistent filtering
        userEmail: currentUser.email,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        message: newMessage.trim() || (imageUrl ? 'Imagen compartida' : ''),
        isAdmin: false,
        timestamp: serverTimestamp(),
        read: false,
        ...(imageUrl && { imageUrl, imageFileName })
      };

      await addDoc(collection(db, 'chat_messages'), messageData);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (authLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido no encontrado</h1>
          <Link href="/mis-pedidos" className="text-blue-500 hover:text-blue-600">
            Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(order.status);

  // Protección defensiva para estados no definidos
  const currentStatusConfig = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/mis-pedidos"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Chat - Pedido #{orderId.slice(-8).toUpperCase()}
                </h1>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${currentStatusConfig.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {currentStatusConfig.label}
                </div>
              </div>
            </div>
            
            <Link
              href="/"
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline & Order Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Pedido</h3>
              
              <div className="space-y-4">
                {timelineSteps.map((step, index) => (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-blue-500 text-white' 
                        : step.current
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-500'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.completed ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm font-medium ${
                        step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-4 p-3 rounded-lg border ${currentStatusConfig.color}`}>
                <p className="text-sm">{currentStatusConfig.description}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h3>
              
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {item.imagen && (
                      <Image
                        src={item.imagen}
                        alt={item.nombre}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
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
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">Soporte FyD</h3>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <p className="text-sm opacity-90">En línea</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">¡Hola! 👋</h4>
                    <p className="text-sm text-gray-600 mb-1">Estamos aquí para ayudarte con tu pedido</p>
                    <p className="text-xs text-gray-500">Escríbenos cualquier pregunta o inquietud</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'} items-end space-x-2`}
                    >
                      {message.isAdmin && (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <ShieldCheckIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-xs lg:max-w-md ${message.isAdmin ? 'order-2' : 'order-1'}`}>
                        {message.isAdmin && (
                          <div className="text-xs text-gray-500 mb-1 px-3">Soporte FyD</div>
                        )}
                        
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                            message.isAdmin
                              ? 'bg-white text-gray-900 border border-gray-200'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {message.imageUrl ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <Image
                                  src={message.imageUrl}
                                  alt={message.imageFileName || 'Imagen compartida'}
                                  width={250}
                                  height={200}
                                  className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(message.imageUrl, '_blank')}
                                />
                              </div>
                              {message.message && message.message !== 'Imagen compartida' && (
                                <p className="whitespace-pre-wrap">{message.message}</p>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{message.message}</p>
                          )}
                        </div>
                        
                        <div className={`flex items-center mt-1 px-3 ${message.isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {!message.isAdmin && (
                            <div className="ml-2">
                              {message.read ? (
                                <div className="flex space-x-1">
                                  <CheckIcon className="h-3 w-3 text-blue-500" />
                                  <CheckIcon className="h-3 w-3 text-blue-500 -ml-1" />
                                </div>
                              ) : (
                                <CheckIcon className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!message.isAdmin && (
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4 relative inline-block">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-48 max-h-32 rounded-lg object-cover border-2 border-blue-200"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedImage?.name}</p>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe tu mensaje sobre el pedido..."
                        className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24"
                        rows={2}
                        disabled={sendingMessage || uploadingImage}
                      />

                      {/* Image Upload Button */}
                      <div className="absolute bottom-3 right-3">
                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={sendingMessage || uploadingImage}
                        />
                        <label
                          htmlFor="imageUpload"
                          className={`cursor-pointer p-1 rounded-lg transition-colors ${
                            sendingMessage || uploadingImage
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          <PhotoIcon className="h-5 w-5" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !selectedImage) || sendingMessage || uploadingImage}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
                  >
                    {sendingMessage || uploadingImage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Responderemos lo antes posible durante horario laboral • Puedes enviar imágenes (máx. 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
