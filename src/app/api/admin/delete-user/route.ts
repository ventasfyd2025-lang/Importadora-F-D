import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

/**
 * API para eliminar usuarios - Solo accesible para administradores
 * Requiere token de autenticación en el header Authorization: Bearer <token>
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const authCheck = await requireAdmin(request);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Prevenir que un admin se elimine a sí mismo
    if (userId === authCheck.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 403 }
      );
    }

    // Eliminar de Firestore
    await adminDb.collection('users').doc(userId).delete();
    console.log('✅ Usuario eliminado de Firestore:', userId);

    // Intentar eliminar de Authentication (puede fallar si no existe)
    try {
      await adminAuth.deleteUser(userId);
      console.log('✅ Usuario eliminado de Authentication:', userId);
    } catch (authError: any) {
      console.warn('⚠️ No se pudo eliminar de Auth (puede que no exista):', authError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error eliminando usuario:', error);
    return NextResponse.json(
      { error: error.message || 'Error eliminando usuario' },
      { status: 500 }
    );
  }
}
