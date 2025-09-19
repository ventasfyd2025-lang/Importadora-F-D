import Layout from '@/components/Layout';
import HomeClient from '@/components/HomeClient';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Layout>
      <HomeClient />
    </Layout>
  );
}