'use client';

import { useState, useEffect, useRef } from 'react';
import { useClientSideFormat } from '@/hooks/useClientSideFormat';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  UserIcon,
  CheckIcon,
  ShieldCheckIcon,
  XMarkIcon,
  MinusIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  CreditCardIcon,
  CubeIcon
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

interface AdminChatPopupProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminChatPopup({ order, isOpen, onClose }: AdminChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { formatDate, formatTime } = useClientSideFormat();

  useEffect(() => {
    if (!isOpen || !order) return;

    // Simplificar consulta para evitar error de índice
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('orderId', '==', order.id)
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
  }, [isOpen, order]);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !order || loading) return;

    setLoading(true);
    
    try {
      const messageData = {
        orderId: order.id,
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

  const getOrderTimeline = () => {
    const timeline = [
      {
        status: 'pending',
        title: 'Pedido Recibido',
        description: 'El pedido ha sido recibido y está en espera de confirmación',
        icon: ClockIcon,
        completed: true,
        date: order.createdAt
      },
      {
        status: 'confirmed',
        title: 'Pago Confirmado',
        description: 'El pago ha sido verificado y el pedido confirmado',
        icon: CreditCardIcon,
        completed: ['confirmed', 'preparing', 'shipped', 'delivered'].includes(order.status),
        date: order.status !== 'pending' ? order.updatedAt : null
      },
      {
        status: 'preparing',
        title: 'Preparando Pedido',
        description: 'Verificando stock y preparando productos para envío',
        icon: CubeIcon,
        completed: ['preparing', 'shipped', 'delivered'].includes(order.status),
        date: order.status === 'preparing' || ['shipped', 'delivered'].includes(order.status) ? order.updatedAt : null
      },
      {
        status: 'shipped',
        title: 'Enviado',
        description: 'El pedido ha sido enviado y está en camino',
        icon: TruckIcon,
        completed: ['shipped', 'delivered'].includes(order.status),
        date: order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null
      },
      {
        status: 'delivered',
        title: 'Entregado',
        description: 'El pedido ha sido entregado exitosamente',
        icon: CheckCircleIcon,
        completed: order.status === 'delivered',
        date: order.status === 'delivered' ? order.updatedAt : null
      }
    ];

    return timeline.filter(item => order.status !== 'cancelled');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative bg-white rounded-lg shadow-2xl ${isMinimized ? 'w-80 h-16' : 'w-full max-w-6xl h-full max-h-[90vh]'} flex flex-col transition-all duration-300 mx-4`}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-semibold">Chat con {order.customerName}</h3>
              <p className="text-sm opacity-90">Pedido #{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-1 overflow-hidden bg-white">
            {/* Order Info Sidebar */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto" style={{ backgroundColor: '#f9fafb' }}>
              <h4 className="font-semibold text-gray-900 mb-4">Información del Pedido</h4>
              
              {/* Customer Info */}
              <div className="mb-4 p-3 bg-white rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Cliente</h5>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Nombre:</span> {order.customerName}</p>
                  <p><span className="font-medium">Email:</span> {order.customerEmail}</p>
                  <p><span className="font-medium">Teléfono:</span> {order.customerPhone}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4 p-3 bg-white rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Productos</h5>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {item.imagen && (
                        <img
                          loading="lazy"
                          src={item.imagen}
                          alt={item.nombre}
                          className="h-8 w-8 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">{item.nombre}</p>
                        <p className="text-xs text-gray-600">
                          {item.cantidad} × {formatPrice(item.precio)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-3 bg-white rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Estado Actual</h5>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'shipped' ? 'bg-orange-100 text-orange-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status === 'pending' ? 'Pendiente' :
                   order.status === 'confirmed' ? 'Confirmado' :
                   order.status === 'preparing' ? 'Preparando' :
                   order.status === 'shipped' ? 'Enviado' :
                   order.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                </span>
              </div>

              {/* Timeline */}
              <div className="p-3 bg-white rounded-lg">
                <h5 className="font-medium text-gray-800 mb-3">Línea de Tiempo</h5>
                <div className="space-y-3">
                  {getOrderTimeline().map((step, index) => {
                    const IconComponent = step.icon;
                    return (
                      <div key={step.status} className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              step.completed ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {step.title}
                            </p>
                            {step.completed && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                          {step.date && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(step.date, {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" style={{ backgroundColor: '#f9fafb' }}>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Chat con cliente</h4>
                    <p className="text-sm text-gray-600">Comunícate directamente con {order.customerName}</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isSystemMessage = message.isAdmin && message.userName === 'Sistema FyD';
                    return (
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
                          {isSystemMessage && (
                            <div className="text-xs text-blue-600 mb-1 px-3 font-medium">Sistema FyD - Actualización Automática</div>
                          )}
                          
                          <div
                            className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                              isSystemMessage
                                ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                : message.isAdmin
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
                        
                        {message.isAdmin && !isSystemMessage && (
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShieldCheckIcon className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {isSystemMessage && (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircleIcon className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Responder a ${order.customerName}...`}
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
                  <span className="font-medium text-red-600">Modo Admin:</span> El cliente verá tus respuestas instantáneamente
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}