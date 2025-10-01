'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface NotificationBadgeProps {
  hasUnreadMessages: boolean;
  currentUser: any;
}

const NotificationBadge = memo(function NotificationBadge({
  hasUnreadMessages,
  currentUser
}: NotificationBadgeProps) {
  if (!currentUser) return null;

  return (
    <Link
      href="/mis-pedidos"
      className="relative inline-flex items-center p-2 text-gray-700 hover:text-orange-600 transition-colors"
      aria-label="Notificaciones de pedidos"
    >
      <ChatBubbleLeftIcon className="h-6 w-6" />
      {hasUnreadMessages && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
      )}
    </Link>
  );
});

export default NotificationBadge;
