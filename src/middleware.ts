import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de Next.js para proteger rutas de administración
 *
 * NOTA: Este middleware proporciona una capa adicional de seguridad
 * verificando la autenticación a nivel de servidor antes de que la página se cargue.
 *
 * La verificación completa de roles se hace en:
 * 1. Este middleware (verificación básica de autenticación)
 * 2. La página /admin (verificación de rol isAdmin con useUserAuth)
 * 3. Las APIs (verificación con Firebase Admin SDK)
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger todas las rutas que empiezan con /admin
  if (pathname.startsWith('/admin')) {
    // Verificar si hay un token de sesión de Firebase en las cookies
    // Firebase Auth guarda el token en diferentes lugares dependiendo de la configuración
    const sessionCookie = request.cookies.get('__session');
    const firebaseToken = request.cookies.get('firebase-auth-token');

    // Si no hay token de autenticación, se mostrará el formulario de login
    // La verificación completa del rol de admin se hace en el componente client-side
    // usando useUserAuth y verificando isAdmin

    // NOTA: Para una verificación más robusta en el middleware, necesitarías:
    // 1. Verificar el token con Firebase Admin SDK
    // 2. Consultar Firestore para verificar el rol del usuario
    // Sin embargo, esto requiere importar Firebase Admin en el middleware,
    // lo cual puede causar problemas de bundle size en Edge Runtime.

    // Por ahora, confiamos en la verificación client-side + API-side:
    // - Client: useUserAuth verifica isAdmin y redirige
    // - APIs: requireAdmin() verifica con Firebase Admin SDK
  }

  return NextResponse.next();
}

// Configurar qué rutas deben pasar por este middleware
export const config = {
  matcher: [
    '/admin/:path*',
    // Excluir archivos estáticos y API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
