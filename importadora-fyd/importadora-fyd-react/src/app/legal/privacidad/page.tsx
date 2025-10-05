import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Política de Privacidad
            </h1>

            <div className="prose prose-orange max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  1. Información que Recopilamos
                </h2>
                <p>
                  En Importadora F&D recopilamos información personal necesaria para procesar tus pedidos,
                  incluyendo nombre, email, teléfono, RUT y dirección de entrega.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  2. Uso de la Información
                </h2>
                <p>
                  Utilizamos tu información personal para:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Procesar y gestionar tus pedidos</li>
                  <li>Comunicarnos contigo sobre el estado de tus compras</li>
                  <li>Mejorar nuestros servicios y productos</li>
                  <li>Enviar información relevante sobre ofertas (solo si lo autorizas)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  3. Protección de Datos
                </h2>
                <p>
                  Implementamos medidas de seguridad para proteger tu información personal contra
                  accesos no autorizados, alteración, divulgación o destrucción.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  4. Compartir Información
                </h2>
                <p>
                  No vendemos ni compartimos tu información personal con terceros, excepto cuando
                  sea necesario para procesar pagos o realizar envíos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  5. Cookies
                </h2>
                <p>
                  Utilizamos cookies para mejorar tu experiencia de navegación y mantener tu
                  carrito de compras activo.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  6. Tus Derechos
                </h2>
                <p>
                  Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier
                  momento contactándonos a través de nuestros canales de atención.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  7. Contacto
                </h2>
                <p>
                  Para cualquier consulta sobre privacidad, contáctanos en:{' '}
                  <a href="mailto:contacto@importadora-fyd.cl" className="text-orange-600 hover:text-orange-700">
                    contacto@importadora-fyd.cl
                  </a>
                </p>
              </section>

              <p className="text-sm text-gray-500 mt-8">
                Última actualización: {new Date().toLocaleDateString('es-CL')}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t">
              <Link
                href="/"
                className="inline-flex items-center justify-center py-2 px-6 border border-transparent rounded-lg text-base font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
