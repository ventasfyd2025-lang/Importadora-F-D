'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAuth } from './useUserAuth';

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
}

export function useOrderNotifications() {
  const [unreadOrderMessages, setUnreadOrderMessages] = useState(0);
  const { currentUser } = useUserAuth();

  useEffect(() => {
    if (!currentUser) {
      setUnreadOrderMessages(0);
      return;
    }

    // Query for unread messages from admin for the current user's orders
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('userEmail', '==', currentUser.email),
      where('isAdmin', '==', true),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const unreadCount = snapshot.size;
      console.log(`📧 Found ${unreadCount} unread messages for ${currentUser.email}`);
      setUnreadOrderMessages(unreadCount);
    }, (error) => {
      console.error('❌ Error en notificaciones de pedidos:', error);
      console.log('User email:', currentUser.email);
      console.log('Error code:', error.code);
      setUnreadOrderMessages(0);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return unreadOrderMessages;
}