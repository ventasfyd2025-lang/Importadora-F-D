'use client';

import React from 'react';
import Link from 'next/link';
import { useFooterConfig } from '@/hooks/useFooterConfig';

export default function Footer() {
  const { footerConfig, loading } = useFooterConfig();

  if (loading) {
    return (
      <footer className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded w-1/3 mb-4"></div>
            <div className="h-3 bg-white/20 rounded w-2/3"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold mb-3">{footerConfig.companyName}</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              {footerConfig.description}
            </p>
          </div>

          {/* Contact Info */}
          {footerConfig.showContactInfo && (
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-3 text-sm">
                <p className="flex items-center text-white/90">
                  <span className="mr-3">📞</span>
                  {footerConfig.contact.phone}
                </p>
                <p className="flex items-center text-white/90">
                  <span className="mr-3">📧</span>
                  {footerConfig.contact.email}
                </p>
                <p className="flex items-center text-white/90">
                  <span className="mr-3">📍</span>
                  {footerConfig.contact.address}
                </p>
              </div>
            </div>
          )}

          {/* Social Media */}
          {footerConfig.showSocialMedia && (
            <div>
              <h4 className="text-lg font-semibold mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                {footerConfig.socialMedia.facebook !== '#' && (
                  <a
                    href={footerConfig.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="Facebook"
                  >
                    <span className="text-xl">📘</span>
                  </a>
                )}
                {footerConfig.socialMedia.instagram !== '#' && (
                  <a
                    href={footerConfig.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="Instagram"
                  >
                    <span className="text-xl">📷</span>
                  </a>
                )}
                {footerConfig.socialMedia.whatsapp !== '#' && (
                  <a
                    href={footerConfig.socialMedia.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <span className="text-xl">💬</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm mb-3">
            <p className="text-white/80">
              &copy; {new Date().getFullYear()} {footerConfig.companyName}. Todos los derechos reservados.
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <Link
                href="/legal/terminos"
                className="text-white/70 hover:text-white transition-colors"
              >
                Términos
              </Link>
              <Link
                href="/legal/privacidad"
                className="text-white/70 hover:text-white transition-colors"
              >
                Privacidad
              </Link>
              <Link
                href="/admin"
                className="text-white/50 hover:text-white/70 transition-colors text-xs"
              >
                Admin
              </Link>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs">
              Layout actualizado: {new Date().toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}