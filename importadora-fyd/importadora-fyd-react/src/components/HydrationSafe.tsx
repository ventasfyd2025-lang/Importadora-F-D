'use client';

import { useEffect, useState, ReactNode } from 'react';

interface HydrationSafeProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Componente que previene errores de hidratación envolviendo
 * contenido que puede diferir entre servidor y cliente
 */
export default function HydrationSafe({
  children,
  fallback = <div style={{ height: '1px' }} />,
  className
}: HydrationSafeProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <div className={className}>{fallback}</div>;
  }

  return <div className={className}>{children}</div>;
}