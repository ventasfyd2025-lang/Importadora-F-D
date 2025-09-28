'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
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
}

interface ChatWidgetProps {
  orderId?: string;
  className?: string;
}

export default function ChatWidget({ orderId, className = '' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { formatTime } = useClientSideFormat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser, isRegistered } = useUserAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Simplificar la consulta para evitar índices complejos
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
    });

    return unsubscribe;
  }, [currentUser, orderId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const markMessagesAsRead = useCallback(async () => {
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
  }, [currentUser, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markMessagesAsRead();
    }
  }, [isOpen, unreadCount, markMessagesAsRead]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || loading) return;

    setLoading(true);
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

  if (!currentUser) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 relative"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-orange-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-5 w-5" />
              <div>
                <h3 className="font-medium">Soporte al Cliente</h3>
                <p className="text-xs opacity-90">
                  {orderId ? `Pedido #${orderId.slice(-8).toUpperCase()}` : 'Chat General'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>¡Hola! ¿En qué podemos ayudarte?</p>
                <p className="text-xs mt-1">Escríbenos tu consulta</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                      message.isAdmin
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {message.isAdmin && (
                      <div className="flex items-center space-x-1 mb-1">
                        <ShieldCheckIcon className="h-3 w-3 text-orange-600" />
                        <span className="text-xs font-medium text-orange-600">Soporte</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.isAdmin ? 'text-gray-500' : 'text-orange-100'
                    }`}>
                      {formatTime(message.timestamp, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={2}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <PaperAirplaneIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Nuestro equipo te responderá lo antes posible
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
