'use client';

import { usePathname } from 'next/navigation';
import { useUserAuth } from '@/hooks/useUserAuth';
import MercadoLibreChat from './MercadoLibreChat';

export default function ChatProvider() {
  const pathname = usePathname();
  const { currentUser } = useUserAuth();

  // No mostrar chat en páginas de admin o auth
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/registro';

  if (isAdminPage || isAuthPage) {
    return null;
  }

  // Siempre mostrar chat - para usuarios logueados será chat interno en pedidos,
  // para todos será WhatsApp en chat general
  return <MercadoLibreChat />;
}