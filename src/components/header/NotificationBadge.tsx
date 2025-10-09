'use client';

import { memo } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

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
      className="relative inline-flex items-center p-2 text-gray-700 hover:text-orange-600 transition-all duration-200 hover:scale-110"
      aria-label="Notificaciones de pedidos"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
      {hasUnreadMessages && (
        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg border-2 border-white"></span>
      )}
    </Link>
  );
});

export default NotificationBadge;
