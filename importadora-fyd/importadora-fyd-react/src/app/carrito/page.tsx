import { Suspense } from 'react';
import Layout from '@/components/Layout';
import CartPageClient from '@/components/CartPageClient';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <CartPageClient />
      </Suspense>
    </Layout>
  );
}