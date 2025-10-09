'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoProductoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al admin con parámetro para abrir modal
    router.push('/admin?modal=add-product');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );
}
