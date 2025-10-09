'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface AdminModalDetectorProps {
  onOpenProductModal: () => void;
}

export default function AdminModalDetector({ onOpenProductModal }: AdminModalDetectorProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (modalParam === 'add-product') {
      onOpenProductModal();
    }
  }, [searchParams, onOpenProductModal]);

  return null;
}
