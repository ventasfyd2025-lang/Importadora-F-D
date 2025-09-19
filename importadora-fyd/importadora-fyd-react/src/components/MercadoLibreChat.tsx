'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  UserIcon,
  CheckIcon,
  ShieldCheckIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { useUserAuth } from '@/hooks/useUserAuth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ChatMessage {
  id: string;
  orderId?: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  timestamp: Date;
  read: boolean;
  userEmail?: string;
  userName?: string;
}

interface MercadoLibreChatProps {
  orderId?: string;
  className?: string;
}

export default function MercadoLibreChat({ orderId, className = '' }: MercadoLibreChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser, isRegistered } = useUserAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Consulta simplificada sin índices complejos
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('userId', '==', currentUser.uid || currentUser.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const chatMessages: ChatMessage[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const message = {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage;
        
        // Filtrar por orderId en el cliente si es necesario
        if (orderId && message.orderId !== orderId) {
          return;
        }
        
        chatMessages.push(message);
        
        if (!message.read && message.isAdmin) {
          unread++;
        }
      });

      setMessages(chatMessages);
      setUnreadCount(unread);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return unsubscribe;
  }, [currentUser, orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && unreadCount > 0) {
      markMessagesAsRead();
    }
  }, [isOpen, isMinimized, unreadCount]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    if (!currentUser) return;

    const unreadMessages = messages.filter(msg => !msg.read && msg.isAdmin);
    
    for (const message of unreadMessages) {
      try {
        await updateDoc(doc(db, 'chat_messages', message.id), {
          read: true
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || loading) return;

    setLoading(true);
    setTyping(true);
    
    try {
      const messageData = {
        userId: currentUser.uid || currentUser.id,
        userEmail: currentUser.email,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        message: newMessage.trim(),
        isAdmin: false,
        timestamp: serverTimestamp(),
        read: false,
        ...(orderId && { orderId })
      };

      await addDoc(collection(db, 'chat_messages'), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!currentUser) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 relative group"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ¿Necesitas ayuda?
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`bg-white rounded-lg shadow-2xl w-80 ${isMinimized ? 'h-14' : 'h-[500px]'} flex flex-col border border-gray-200 transition-all duration-300`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Soporte FyD</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-xs opacity-90">En línea</p>
                </div>
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
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Order Info */}
              {orderId && (
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-blue-700">
                      Pedido #{orderId.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">¡Hola! 👋</h4>
                    <p className="text-sm text-gray-600 mb-1">Somos el equipo de soporte de FyD</p>
                    <p className="text-xs text-gray-500 mb-4">¿En qué podemos ayudarte hoy?</p>
                    
                    {/* Quick Options */}
                    <div className="space-y-2 max-w-xs mx-auto">
                      <button
                        onClick={() => setNewMessage('Hola, necesito ayuda con mi pedido')}
                        className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        💼 Ayuda con mi pedido
                      </button>
                      <button
                        onClick={() => setNewMessage('¿Cuándo llegará mi producto?')}
                        className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        🚚 Estado de envío
                      </button>
                      <button
                        onClick={() => setNewMessage('Quiero hacer un cambio o devolución')}
                        className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        🔄 Cambios y devoluciones
                      </button>
                      <button
                        onClick={() => window.location.href = '/'}
                        className="w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm text-blue-700 font-medium"
                      >
                        🏠 Volver a la tienda
                      </button>
                    </div>
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
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        </div>
                        
                        <div className={`flex items-center mt-1 px-3 ${message.isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString('es-CL', {
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
                
                {typing && (
                  <div className="flex justify-start items-end space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShieldCheckIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
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
                      placeholder="Escribe tu mensaje..."
                      className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24"
                      rows={1}
                      disabled={loading}
                      style={{
                        minHeight: '44px',
                        height: 'auto'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Generalmente respondemos en unos minutos
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}