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
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">{footerConfig.companyName}</h3>
            <p className="text-white/90 text-base lg:text-lg leading-relaxed">
              {footerConfig.description}
            </p>
          </div>

          {/* Contact Info */}
          {footerConfig.showContactInfo && (
            <div>
              <h4 className="text-xl lg:text-2xl font-semibold mb-5">Contacto</h4>
              <div className="space-y-4 text-base lg:text-lg">
                <p className="flex items-center text-white/90">
                  <span className="mr-4 text-xl">📞</span>
                  {footerConfig.contact.phone}
                </p>
                <p className="flex items-center text-white/90">
                  <span className="mr-4 text-xl">📧</span>
                  {footerConfig.contact.email}
                </p>
                <p className="flex items-center text-white/90">
                  <span className="mr-4 text-xl">📍</span>
                  {footerConfig.contact.address}
                </p>
              </div>
            </div>
          )}

          {/* Social Media */}
          {footerConfig.showSocialMedia && (
            <div>
              <h4 className="text-xl lg:text-2xl font-semibold mb-5">Síguenos</h4>
              <div className="flex space-x-5">
                {footerConfig.socialMedia.facebook !== '#' && (
                  <a
                    href={footerConfig.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="Facebook"
                  >
                    <span className="text-2xl">📘</span>
                  </a>
                )}
                {footerConfig.socialMedia.instagram !== '#' && (
                  <a
                    href={footerConfig.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="Instagram"
                  >
                    <span className="text-2xl">📷</span>
                  </a>
                )}
                {footerConfig.socialMedia.whatsapp !== '#' && (
                  <a
                    href={footerConfig.socialMedia.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <span className="text-2xl">💬</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-10 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-base mb-4">
            <p className="text-white/80 text-base lg:text-lg">
              &copy; {new Date().getFullYear()} {footerConfig.companyName}. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0 text-base lg:text-lg">
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
                className="text-white/50 hover:text-white/70 transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm lg:text-base">
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