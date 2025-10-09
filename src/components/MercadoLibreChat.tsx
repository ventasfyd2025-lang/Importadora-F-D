'use client';

import { useState, useEffect, useRef } from 'react';
import { logError, logWarn } from '@/utils/logger';
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
import { useFooterConfig } from '@/hooks/useFooterConfig';
import { useClientSideFormat } from '@/hooks/useClientSideFormat';
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
  const { currentUser } = useUserAuth();
  const { footerConfig } = useFooterConfig();
  const { formatTime } = useClientSideFormat();

  const whatsappUrl = footerConfig?.socialMedia?.whatsapp?.trim();
  // Chat general siempre redirije a WhatsApp, chat de pedidos usa chat interno
  const shouldRedirectToWhatsApp = !orderId;

  const openWhatsApp = (prefilledMessage?: string) => {
    if (!whatsappUrl || whatsappUrl === '#') {
      logWarn('WhatsApp URL is not configured');
      return;
    }

    try {
      const baseUrl = whatsappUrl.startsWith('http') ? whatsappUrl : `https://${whatsappUrl}`;
      const url = new URL(baseUrl);

      if (prefilledMessage) {
        url.searchParams.set('text', prefilledMessage);
      }

      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch (error) {
      logError('Invalid WhatsApp URL configuration', error);
    }
  };

  const getWhatsAppUrl = () => {
    console.log('WhatsApp URL from config:', whatsappUrl); // Debug

    // Si hay número configurado en admin, construir la URL
    if (whatsappUrl && whatsappUrl !== '#' && whatsappUrl.trim() !== '') {
      // Si ya es una URL completa, usarla tal como está
      if (whatsappUrl.startsWith('http')) {
        console.log('Using full URL:', whatsappUrl);
        return whatsappUrl;
      }

      // Si es solo un número, construir la URL correctamente
      let cleanNumber = whatsappUrl.replace(/[^\d]/g, ''); // Solo números

      // Si no tiene código de país, agregar 56 (Chile)
      if (cleanNumber.length === 9 && !cleanNumber.startsWith('56')) {
        cleanNumber = '56' + cleanNumber;
      }

      const message = encodeURIComponent(
        `¡Hola Importadora FyD! 👋\n\n` +
        `Me gustaría obtener información sobre sus productos.\n\n` +
        `🕒 *Horario de atención:*\n` +
        `Lunes a Viernes: 9:00 - 18:00\n` +
        `Sábados: 10:00 - 14:00\n\n` +
        `¡Espero su pronta respuesta!`
      );
      const finalUrl = `https://wa.me/${cleanNumber}?text=${message}`;
      console.log('Clean number:', cleanNumber);
      console.log('Constructed URL:', finalUrl);
      return finalUrl;
    }
    // Fallback con número por defecto (número de contacto de Importadora F&D)
    console.log('Using fallback URL');
    const fallbackMessage = encodeURIComponent(
      `¡Hola Importadora FyD! 👋\n\n` +
      `Me gustaría obtener información sobre sus productos.\n\n` +
      `🕒 *Horario de atención:*\n` +
      `Lunes a Viernes: 9:00 - 18:00\n` +
      `Sábados: 10:00 - 14:00\n\n` +
      `¡Espero su pronta respuesta!`
    );
    return `https://wa.me/56935302796?text=${fallbackMessage}`;
  };

  const handleChatButtonClick = () => {
    if (shouldRedirectToWhatsApp) {
      // Chat general va directo a WhatsApp como enlace simple
      window.open(getWhatsAppUrl(), '_blank');
      return;
    }

    // Chat de pedidos específicos usa chat interno
    setIsOpen(true);
  };

  useEffect(() => {
    if (!currentUser || shouldRedirectToWhatsApp) return;

    // Consulta simplificada sin índices complejos
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('userId', '==', (currentUser as any).uid || (currentUser as any).id),
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
      logError('Error listening to messages', error);
    });

    return unsubscribe;
  }, [currentUser, orderId, shouldRedirectToWhatsApp]);

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
        logError('Error marking message as read', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || loading) return;

    setLoading(true);
    setTyping(true);
    
    try {
      const messageData = {
        userId: (currentUser as any).uid || (currentUser as any).id,
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
      logError('Error sending message', error);
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

  // Solo requerir usuario logueado para chat interno de pedidos
  if (!shouldRedirectToWhatsApp && !currentUser) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Button */}
      {!isOpen && (
        <>
          {shouldRedirectToWhatsApp ? (
            // Enlace directo a WhatsApp - más simple
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 relative group flex items-center justify-center"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ¡Chatea con nosotros en WhatsApp!
              </div>
            </a>
          ) : (
            // Botón de chat interno para pedidos
            <button
              onClick={handleChatButtonClick}
              className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 relative group"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Chat del pedido
              </div>
            </button>
          )}
        </>
      )}

      {/* Chat Window */}
      {isOpen && !shouldRedirectToWhatsApp && (
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
                      {whatsappUrl && whatsappUrl !== '#' && (
                        <button
                          onClick={() => openWhatsApp('Hola, me gustaría hablar con soporte')}
                          className="w-full text-left p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm text-green-700 font-medium"
                        >
                          💬 Hablar por WhatsApp
                        </button>
                      )}
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
                            {formatTime(message.timestamp)}
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
                <div className="flex items-end space-x-2">
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
                  {whatsappUrl && whatsappUrl !== '#' && (
                    <button
                      onClick={() => openWhatsApp(newMessage.trim() || 'Hola, necesito ayuda con mi pedido')}
                      className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
                      type="button"
                      aria-label="Enviar mensaje por WhatsApp"
                    >
                      <span className="text-sm font-medium">WA</span>
                    </button>
                  )}
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
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
                {whatsappUrl && whatsappUrl !== '#' && (
                  <button
                    onClick={() => openWhatsApp(newMessage.trim() || 'Hola, necesito ayuda con mi pedido')}
                    className="mt-3 w-full text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                    type="button"
                  >
                    ¿Prefieres WhatsApp? Escríbenos aquí.
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
