import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Términos y Condiciones
            </h1>

            <div className="prose prose-orange max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  1. Aceptación de Términos
                </h2>
                <p>
                  Al utilizar nuestro sitio web y realizar compras en Importadora F&D, aceptas
                  estos términos y condiciones en su totalidad.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  2. Productos y Precios
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Los precios están expresados en pesos chilenos (CLP)</li>
                  <li>Los precios pueden cambiar sin previo aviso</li>
                  <li>Las imágenes son referenciales</li>
                  <li>Nos reservamos el derecho de limitar cantidades</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  3. Proceso de Compra
                </h2>
                <p>
                  Al realizar un pedido, recibirás una confirmación por email. La aceptación
                  final del pedido está sujeta a disponibilidad de stock y verificación de pago.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  4. Métodos de Pago
                </h2>
                <p>Aceptamos los siguientes métodos de pago:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transferencia bancaria</li>
                  <li>MercadoPago (tarjetas de crédito/débito)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  5. Envíos y Entregas
                </h2>
                <p>
                  Los tiempos de entrega son estimados y pueden variar según la ubicación.
                  Los costos de envío se calculan según la dirección de entrega.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  6. Devoluciones y Cambios
                </h2>
                <p>
                  Aceptamos devoluciones y cambios dentro de los 7 días posteriores a la recepción,
                  siempre que el producto esté en su empaque original y sin uso.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  7. Garantía
                </h2>
                <p>
                  Los productos cuentan con garantía según lo establecido por la ley del consumidor
                  chilena y las especificaciones del fabricante.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  8. Responsabilidad
                </h2>
                <p>
                  No nos hacemos responsables por daños indirectos o consecuentes derivados del
                  uso de nuestros productos o servicios.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  9. Modificaciones
                </h2>
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento.
                  Los cambios entrarán en vigencia inmediatamente después de su publicación.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  10. Contacto
                </h2>
                <p>
                  Para consultas sobre estos términos:{' '}
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
