'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFooterConfig } from '@/hooks/useFooterConfig';
import { useConfig } from '@/hooks/useConfig';

export default function Footer() {
  const { footerConfig, loading } = useFooterConfig();
  const { logoConfig } = useConfig();

  if (loading) {
    return (
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded w-1/3 mb-4"></div>
            <div className="h-3 bg-white/20 rounded w-2/3"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Company Info with Logo */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-4 mb-6 group">
              {/* Logo */}
              <div className="relative">
                {logoConfig?.image ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 group-hover:ring-orange-400 transition-all duration-300">
                    <Image
                      src={logoConfig.image}
                      alt={logoConfig.text || 'Logo'}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-4xl shadow-2xl ring-4 ring-white/20 group-hover:ring-orange-400 transition-all duration-300">
                    {logoConfig?.emoji || '🏪'}
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="flex flex-col">
                <h3 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                  {footerConfig.companyName}
                </h3>
                <span className="text-sm text-orange-300 font-medium tracking-wide mt-1">
                  Tu tienda de confianza
                </span>
              </div>
            </Link>

            <p className="text-white/80 text-base lg:text-lg leading-relaxed mb-6">
              {footerConfig.description}
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm font-medium">Pagos Seguros</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                <span className="text-blue-400">🚚</span>
                <span className="text-sm font-medium">Envío Rápido</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {footerConfig.showContactInfo && (
            <div className="space-y-4">
              <h4 className="text-xl lg:text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-orange-400">💬</span>
                Contacto
              </h4>
              <div className="space-y-3">
                <a
                  href={`tel:${footerConfig.contact.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-400/50 transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    📞
                  </div>
                  <span className="text-white/90 group-hover:text-white transition-colors">
                    {footerConfig.contact.phone}
                  </span>
                </a>

                <a
                  href={`mailto:${footerConfig.contact.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-400/50 transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    📧
                  </div>
                  <span className="text-white/90 group-hover:text-white transition-colors text-sm lg:text-base break-all">
                    {footerConfig.contact.email}
                  </span>
                </a>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    📍
                  </div>
                  <span className="text-white/90 text-sm lg:text-base">
                    {footerConfig.contact.address}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Social Media */}
          {footerConfig.showSocialMedia && (
            <div className="space-y-4">
              <h4 className="text-xl lg:text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-orange-400">🌐</span>
                Síguenos
              </h4>
              <div className="flex flex-col gap-3">
                {footerConfig.socialMedia.facebook !== '#' && (
                  <a
                    href={footerConfig.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
                    aria-label="Facebook"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                      📘
                    </div>
                    <span className="font-semibold">Facebook</span>
                  </a>
                )}
                {footerConfig.socialMedia.instagram !== '#' && (
                  <a
                    href={footerConfig.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
                    aria-label="Instagram"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                      📷
                    </div>
                    <span className="font-semibold">Instagram</span>
                  </a>
                )}
                {footerConfig.socialMedia.whatsapp !== '#' && (
                  <a
                    href={footerConfig.socialMedia.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
                    aria-label="WhatsApp"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                      💬
                    </div>
                    <span className="font-semibold">WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-white/70">
              <span className="text-orange-400">©</span>
              <span className="text-sm lg:text-base">
                {new Date().getFullYear()} {footerConfig.companyName}. Todos los derechos reservados.
              </span>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/legal/terminos"
                className="text-sm lg:text-base text-white/70 hover:text-orange-400 transition-colors font-medium"
              >
                Términos y Condiciones
              </Link>
              <Link
                href="/legal/privacidad"
                className="text-sm lg:text-base text-white/70 hover:text-orange-400 transition-colors font-medium"
              >
                Política de Privacidad
              </Link>
              <Link
                href="/admin"
                className="text-sm lg:text-base text-white/50 hover:text-orange-400/70 transition-colors font-medium"
              >
                Panel Admin
              </Link>
            </div>
          </div>

          {/* Made with love */}
          <div className="text-center mt-6 pt-6 border-t border-white/5">
            <p className="text-xs lg:text-sm text-white/50 flex items-center justify-center gap-2">
              <span>Hecho con</span>
              <span className="text-red-500 animate-pulse">❤️</span>
              <span>para nuestros clientes</span>
            </p>
            <p className="text-xs text-white/30 mt-2">
              Última actualización: {new Date().toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}