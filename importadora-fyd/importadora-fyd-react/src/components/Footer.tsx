'use client';

import React from 'react';
import Link from 'next/link';
import { useConfig } from '@/hooks/useConfig';

export default function Footer() {
  const { logoConfig } = useConfig();
  
  return (
    <footer className="text-white" style={{ backgroundColor: '#F16529' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{logoConfig.text}</h3>
            <p className="text-gray-300 mb-4">
              Tu tienda online de confianza con los mejores productos importados.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <div className="space-y-2 text-gray-300">
              <p className="flex items-center">
                <span className="mr-2">📞</span>
                +1 234 567 890
              </p>
              <p className="flex items-center">
                <span className="mr-2">📧</span>
                info@importadorafyd.com
              </p>
              <p className="flex items-center">
                <span className="mr-2">📍</span>
                Calle Principal 123, Ciudad
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <span className="text-2xl">📘</span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <span className="text-2xl">📷</span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <span className="text-2xl">💬</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          <p className="text-gray-400 text-sm">
            &copy; 2024 {logoConfig.text}. Todos los derechos reservados.
          </p>
          <Link 
            href="/admin" 
            className="text-xs mt-2 sm:mt-0 transition-colors hover:opacity-80"
            style={{ color: '#0074D9' }}
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}