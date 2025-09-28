import type { Metadata } from "next";
import Layout from "@/components/Layout";
import RetailHomepage from '@/components/home/RetailHomepage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Importadora F&D - Ofertas en Electrónicos, Moda y Hogar",
  description: "Compra los mejores productos importados con ofertas especiales. Electrónicos, moda, hogar y deportes con envío a domicilio en todo Chile.",
  keywords: "importadora, productos importados, ofertas, electrónicos, moda, hogar, deportes, Chile, envío gratuito",
  authors: [{ name: "Importadora F&D" }],
  openGraph: {
    title: "Importadora F&D - Ofertas en Electrónicos, Moda y Hogar",
    description: "Compra los mejores productos importados con ofertas especiales. Electrónicos, moda, hogar y deportes con envío a domicilio en todo Chile.",
    url: "https://importadorafyd.cl",
    siteName: "Importadora F&D",
    images: [
      {
        url: "https://importadorafyd.cl/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Importadora F&D - Ofertas especiales"
      }
    ],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Importadora F&D - Ofertas en Electrónicos, Moda y Hogar",
    description: "Compra los mejores productos importados con ofertas especiales.",
    images: ["https://importadorafyd.cl/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <Layout>
      <RetailHomepage />
    </Layout>
  );
}
