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
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const unreadCount = snapshot.size;
      setUnreadOrderMessages(unreadCount);
    }, (error) => {
      // If user doesn't have orders or permissions, just set to 0
      console.log('Order notifications listener error (expected for new users):', error.code);
      setUnreadOrderMessages(0);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return unreadOrderMessages;
}