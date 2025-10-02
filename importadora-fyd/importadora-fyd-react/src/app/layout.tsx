import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartProviderClient from "@/components/CartProviderClient";
import ChatProvider from "@/components/ChatProvider";
import { I18nProvider } from "@/context/I18nContext";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationDisplay from "@/components/NotificationDisplay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Importadora F&D - Tu tienda online de confianza",
  description: "Encuentra los mejores productos importados con ofertas especiales. Electrónicos, hogar, ropa y deportes con envío a domicilio.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Preconnect para mejorar rendimiento */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://sdk.mercadopago.com" />
        <link rel="dns-prefetch" href="https://firebaseapp.com" />
        <script src="https://sdk.mercadopago.com/js/v2" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <NotificationProvider>
            <CartProviderClient>
              {children}
              <ChatProvider />
              <NotificationDisplay />
            </CartProviderClient>
          </NotificationProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
