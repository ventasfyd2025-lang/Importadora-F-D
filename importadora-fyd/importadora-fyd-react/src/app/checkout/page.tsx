'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest');

  useEffect(() => {
    // Si es invitado, redirigir al carrito directamente
    if (isGuest === 'true') {
      router.replace('/carrito');
    } else {
      router.replace('/carrito');
    }
  }, [isGuest, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
    </div>}>
      <CheckoutContent />
    </Suspense>
  );
}