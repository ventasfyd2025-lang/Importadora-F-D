'use client'

import { lazy, Suspense } from 'react'
import { Spinner } from './ui/Spinner'

// Lazy load heavy admin components
export const AdminDashboard = lazy(() => import('@/app/admin/page'))
export const MercadoPagoWallet = lazy(() => import('./MercadoPagoWallet'))

// Loading fallbacks
export const AdminLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
    </div>
  </div>
)

export const PaymentLoadingFallback = () => (
  <div className="h-16 flex items-center justify-center">
    <Spinner />
  </div>
)

// Wrapper components with Suspense
export const LazyAdminDashboard = () => (
  <Suspense fallback={<AdminLoadingFallback />}>
    <AdminDashboard />
  </Suspense>
)

export const LazyMercadoPagoWallet = (props: any) => (
  <Suspense fallback={<PaymentLoadingFallback />}>
    <MercadoPagoWallet {...props} />
  </Suspense>
)