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
    <footer className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-700 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Company Info with Logo */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 group">
              {/* Logo */}
              <div className="relative">
                {logoConfig?.image ? (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl overflow-hidden shadow-lg ring-2 ring-white/30 group-hover:ring-white transition-all duration-300">
                    <Image
                      src={logoConfig.image}
                      alt={logoConfig.text || 'Logo'}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg ring-2 ring-white/30 group-hover:ring-white transition-all duration-300">
                    {logoConfig?.emoji || '🏪'}
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {footerConfig.companyName}
                </h3>
                <span className="text-xs text-white/80 font-medium">
                  Tu tienda de confianza
                </span>
              </div>
            </Link>

            <p className="text-white/90 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
              {footerConfig.description}
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <span>✓</span> Pagos Seguros
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <span>🚚</span> Envío Rápido
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {footerConfig.showContactInfo && (
            <div>
              <h4 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 lg:mb-4 text-white">Contacto</h4>
              <div className="space-y-1.5 sm:space-y-2">
                <a
                  href={`tel:${footerConfig.contact.phone}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all group text-sm"
                >
                  <span className="text-lg">📞</span>
                  <span className="text-white/90 group-hover:text-white">
                    {footerConfig.contact.phone}
                  </span>
                </a>

                <a
                  href={`mailto:${footerConfig.contact.email}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all group text-sm"
                >
                  <span className="text-lg">📧</span>
                  <span className="text-white/90 group-hover:text-white break-all">
                    {footerConfig.contact.email}
                  </span>
                </a>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-white/10 text-sm">
                  <span className="text-lg flex-shrink-0">📍</span>
                  <span className="text-white/90">
                    {footerConfig.contact.address}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Social Media */}
          {footerConfig.showSocialMedia && (
            <div>
              <h4 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 lg:mb-4 text-white">Síguenos</h4>
              <div className="flex flex-wrap gap-2">
                {footerConfig.socialMedia.facebook !== '#' && (
                  <a
                    href={footerConfig.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium"
                    aria-label="Facebook"
                  >
                    <span className="text-lg">📘</span>
                    Facebook
                  </a>
                )}
                {footerConfig.socialMedia.instagram !== '#' && (
                  <a
                    href={footerConfig.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium"
                    aria-label="Instagram"
                  >
                    <span className="text-lg">📷</span>
                    Instagram
                  </a>
                )}
                {footerConfig.socialMedia.whatsapp !== '#' && (
                  <a
                    href={footerConfig.socialMedia.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium"
                    aria-label="WhatsApp"
                  >
                    <span className="text-lg">💬</span>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-4 sm:mt-6 lg:mt-8 pt-4 sm:pt-5 lg:pt-6 border-t border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
            <p className="text-white/90">
              © {new Date().getFullYear()} {footerConfig.companyName}. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4">
              <Link href="/legal/terminos" className="text-white/80 hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="/legal/privacidad" className="text-white/80 hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="/admin" className="text-white/60 hover:text-white/80 transition-colors text-xs">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}