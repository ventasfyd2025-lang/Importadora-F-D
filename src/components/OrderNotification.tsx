'use client';

import { useState, useEffect } from 'react';
import { useUserAuth } from '@/hooks/useUserAuth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BellIcon, ShoppingBagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  orderId: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  timestamp: Date;
  read: boolean;
}

export default function OrderNotification() {
  const { currentUser, isRegistered } = useUserAuth();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Use userEmail for consistent filtering across all user types
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('userEmail', '==', currentUser.email),
      where('isAdmin', '==', true),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const unreadMessages = snapshot.docs.length;
      setUnreadCount(unreadMessages);
      setHasUnreadMessages(unreadMessages > 0);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return unsubscribe;
  }, [currentUser]);

  if (!currentUser || !hasUnreadMessages || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-2xl border border-blue-300 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BellIcon className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-sm">¡Tienes actualizaciones!</h4>
              <p className="text-sm opacity-90">
                {unreadCount} mensaje{unreadCount > 1 ? 's' : ''} nuevo{unreadCount > 1 ? 's' : ''} sobre tus pedidos
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <Link
            href="/mis-pedidos"
            className="flex-1 bg-white text-blue-600 text-center py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <ShoppingBagIcon className="h-4 w-4 inline mr-1" />
            Ver pedidos
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
}