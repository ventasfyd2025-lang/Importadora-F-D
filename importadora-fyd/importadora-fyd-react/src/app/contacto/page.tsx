'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Contáctanos
            </h1>
            <p className="text-lg text-gray-600">
              Estamos aquí para ayudarte. No dudes en comunicarte con nosotros.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* WhatsApp */}
            <a
              href="https://wa.me/56920265061"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    WhatsApp
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Chatea con nosotros directamente
                  </p>
                  <p className="text-green-600 font-medium">
                    +56 9 2026 5061
                  </p>
                </div>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:contacto@importadora-fyd.cl"
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Mail className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Email
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Envíanos un correo electrónico
                  </p>
                  <p className="text-orange-600 font-medium">
                    contacto@importadora-fyd.cl
                  </p>
                </div>
              </div>
            </a>

            {/* Teléfono */}
            <a
              href="tel:+56920265061"
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Teléfono
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Llámanos durante horario comercial
                  </p>
                  <p className="text-blue-600 font-medium">
                    +56 9 2026 5061
                  </p>
                </div>
              </div>
            </a>

            {/* Ubicación */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ubicación
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Estamos en Chile
                  </p>
                  <p className="text-purple-600 font-medium">
                    Región Metropolitana
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Horario de Atención
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>Lunes a Viernes: 9:00 AM - 6:00 PM</p>
              <p>Sábado: 10:00 AM - 2:00 PM</p>
              <p>Domingo: Cerrado</p>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center py-3 px-8 border border-transparent rounded-lg text-base font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
