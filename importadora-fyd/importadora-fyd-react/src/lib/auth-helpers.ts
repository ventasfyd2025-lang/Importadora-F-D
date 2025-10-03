import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

/**
 * Verifica si el usuario autenticado es administrador
 * @param request - NextRequest object
 * @returns Object con isAdmin y userId, o error
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{
  isAdmin: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAdmin: false, error: 'No authorization token provided' };
    }

    const token = authHeader.split('Bearer ')[1];

    // Verificar el token con Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Obtener el documento del usuario de Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { isAdmin: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin === true || userData?.role === 'admin';

    return { isAdmin, userId };
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return { isAdmin: false, error: 'Invalid or expired token' };
  }
}

/**
 * Middleware para proteger rutas de admin
 * Retorna una respuesta de error si el usuario no es admin
 */
export async function requireAdmin(request: NextRequest) {
  const authResult = await verifyAdminAuth(request);

  if (!authResult.isAdmin) {
    return {
      authorized: false,
      response: Response.json(
        { error: authResult.error || 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    };
  }

  return {
    authorized: true,
    userId: authResult.userId
  };
}
