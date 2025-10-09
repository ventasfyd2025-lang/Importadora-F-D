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
import { db } from '@/lib/firebase';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  UserIcon,
  CheckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

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
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: string;
  trackingNumber?: string;
  notes?: string;
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
    icon: ClockIcon,
    description: 'Pedido recibido y siendo procesado'
  },
  confirmed: { 
    label: 'Confirmado', 
    color: 'text-blue-600 bg-blue-50 border-blue-200', 
    icon: CheckCircleIcon,
    description: 'Pedido confirmado y será preparado'
  },
  preparing: { 
    label: 'Preparando', 
    color: 'text-purple-600 bg-purple-50 border-purple-200', 
    icon: CheckCircleIcon,
    description: 'Preparando pedido para envío'
  },
  shipped: { 
    label: 'Enviado', 
    color: 'text-orange-600 bg-orange-50 border-orange-200', 
    icon: TruckIcon,
    description: 'Pedido en camino'
  },
  delivered: { 
    label: 'Entregado', 
    color: 'text-green-600 bg-green-50 border-green-200', 
    icon: CheckCircleIcon,
    description: 'Pedido entregado exitosamente'
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'text-red-600 bg-red-50 border-red-200', 
    icon: XCircleIcon,
    description: 'Pedido cancelado'
  }
};

export default function AdminChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { user, isAdmin, loading: authLoading } = useUserAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);
  const { formatTime } = useClientSideFormat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Protección de ruta: redirigir si no es administrador
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      console.warn('⚠️ Acceso denegado a /admin/chat: usuario no es administrador');
      router.push('/');
    }
  }, [authLoading, user, isAdmin, router]);

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
    if (!orderId) return undefined;

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

      setMessages(chatMessages);
      
      // Mark client messages as read
      const unreadClientMessages = chatMessages.filter(msg => !msg.read && !msg.isAdmin);
      unreadClientMessages.forEach(msg => {
        updateDoc(doc(db, 'chat_messages', msg.id), { read: true });
      });
    }, (error) => {
      console.error('Error loading messages:', error);
    });

    return unsubscribe;
  }, [orderId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/admin');
      return;
    }

    loadOrder();
    const unsubscribe = loadMessages();

    return () => {
      unsubscribe?.();
    };
  }, [authLoading, user, router, loadOrder, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !order || loading || !orderId) return;

    setLoading(true);
    
    try {
      const messageData = {
        orderId,
        userId: order.userId,
        userEmail: order.customerEmail,
        userName: order.customerName,
        message: newMessage.trim(),
        isAdmin: true,
        timestamp: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'chat_messages'), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
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
          <button 
            onClick={() => router.push('/admin')} 
            className="text-blue-500 hover:text-blue-600"
          >
            Volver al panel admin
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status].icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/admin')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Chat Admin - Pedido #{orderId.slice(-8).toUpperCase()}
                </h1>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig[order.status].color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[order.status].label}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Admin: {user?.email}</span>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                Modo Administrador
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h3>
              
              <div className="space-y-2">
                <div>
                  <span className="text-base font-semibold text-gray-700">Nombre:</span>
                  <p className="text-sm text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <span className="text-base font-semibold text-gray-700">Email:</span>
                  <p className="text-sm text-gray-900">{order.customerEmail}</p>
                </div>
                <div>
                  <span className="text-base font-semibold text-gray-700">Teléfono:</span>
                  <p className="text-sm text-gray-900">{order.customerPhone}</p>
                </div>
                <div>
                  <span className="text-base font-semibold text-gray-700">Dirección:</span>
                  <p className="text-sm text-gray-900">{order.shippingAddress}</p>
                </div>
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
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <ShieldCheckIcon className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">Chat con {order.customerName}</h3>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <p className="text-sm opacity-90">Administrador conectado</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Chat con cliente</h4>
                    <p className="text-sm text-gray-600 mb-1">Aquí puedes comunicarte directamente con el cliente</p>
                    <p className="text-xs text-gray-500">Responde cualquier pregunta sobre el pedido</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                    >
                      {!message.isAdmin && (
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-xs lg:max-w-md ${message.isAdmin ? 'order-1' : 'order-2'}`}>
                        {!message.isAdmin && (
                          <div className="text-xs text-gray-500 mb-1 px-3">{order.customerName}</div>
                        )}
                        
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                            message.isAdmin
                              ? 'bg-red-500 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        </div>
                        
                        <div className={`flex items-center mt-1 px-3 ${message.isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {message.isAdmin && (
                            <div className="ml-2">
                              {message.read ? (
                                <div className="flex space-x-1">
                                  <CheckIcon className="h-3 w-3 text-red-500" />
                                  <CheckIcon className="h-3 w-3 text-red-500 -ml-1" />
                                </div>
                              ) : (
                                <CheckIcon className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {message.isAdmin && (
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <ShieldCheckIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Responder al cliente sobre el pedido..."
                      className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent max-h-24"
                      rows={2}
                      disabled={loading}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  <span className="font-medium text-red-600">Modo Admin:</span> El cliente verá tus respuestas en tiempo real
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
