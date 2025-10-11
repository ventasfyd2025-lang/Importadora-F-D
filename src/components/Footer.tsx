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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-8 lg:py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {/* Company Info with Logo */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4 group">
              {/* Logo */}
              <div className="relative">
                {logoConfig?.image ? (
                  <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl overflow-hidden shadow-lg ring-2 ring-white/30 group-hover:ring-white transition-all duration-300">
                    <Image
                      src={logoConfig.image}
                      alt={logoConfig.text || 'Logo'}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-3xl shadow-lg ring-2 ring-white/30 group-hover:ring-white transition-all duration-300">
                    {logoConfig?.emoji || '🏪'}
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="flex flex-col">
                <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                  {footerConfig.companyName}
                </h3>
                <span className="text-[10px] sm:text-xs text-white/80 font-medium hidden sm:inline">
                  Tu tienda de confianza
                </span>
              </div>
            </Link>

            {/* Descripción - oculta en móvil */}
            <p className="hidden sm:block text-white/90 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
              {footerConfig.description}
            </p>

            {/* Trust Badges - ocultos en móvil */}
            <div className="hidden sm:flex flex-wrap gap-2">
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
              <h4 className="text-sm sm:text-lg font-bold mb-1.5 sm:mb-3 lg:mb-4 text-white">Contacto</h4>
              <div className="space-y-1 sm:space-y-2">
                <a
                  href={`tel:${footerConfig.contact.phone}`}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all group text-xs sm:text-sm"
                >
                  <span className="text-base sm:text-lg">📞</span>
                  <span className="text-white/90 group-hover:text-white">
                    {footerConfig.contact.phone}
                  </span>
                </a>

                <a
                  href={`mailto:${footerConfig.contact.email}`}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all group text-xs sm:text-sm"
                >
                  <span className="text-base sm:text-lg">📧</span>
                  <span className="text-white/90 group-hover:text-white break-all">
                    {footerConfig.contact.email}
                  </span>
                </a>

                <div className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-white/10 text-xs sm:text-sm">
                  <span className="text-base sm:text-lg flex-shrink-0">📍</span>
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
              <h4 className="text-sm sm:text-lg font-bold mb-1.5 sm:mb-3 lg:mb-4 text-white">Síguenos</h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {footerConfig.socialMedia.facebook && footerConfig.socialMedia.facebook !== '#' && (
                  <a
                    href={footerConfig.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-blue-600 transition-all text-xs sm:text-sm font-medium group"
                    aria-label="Facebook"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="hidden sm:inline">Facebook</span>
                  </a>
                )}
                {footerConfig.socialMedia.instagram && footerConfig.socialMedia.instagram !== '#' && (
                  <a
                    href={footerConfig.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-gradient-to-r hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 transition-all text-xs sm:text-sm font-medium group"
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="hidden sm:inline">Instagram</span>
                  </a>
                )}
                {footerConfig.socialMedia.tiktok && footerConfig.socialMedia.tiktok !== '#' && (
                  <a
                    href={footerConfig.socialMedia.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-black transition-all text-xs sm:text-sm font-medium group"
                    aria-label="TikTok"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="hidden sm:inline">TikTok</span>
                  </a>
                )}
                {footerConfig.socialMedia.whatsapp && footerConfig.socialMedia.whatsapp !== '#' && (
                  <a
                    href={footerConfig.socialMedia.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-green-600 transition-all text-xs sm:text-sm font-medium group"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-3 sm:mt-6 lg:mt-8 pt-3 sm:pt-5 lg:pt-6 border-t border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5 sm:gap-3 lg:gap-4 text-[10px] sm:text-sm">
            <p className="text-white/90 text-center sm:text-left">
              © {new Date().getFullYear()} {footerConfig.companyName}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4">
              <Link href="/legal/terminos" className="text-white/80 hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="/legal/privacidad" className="text-white/80 hover:text-white transition-colors">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}