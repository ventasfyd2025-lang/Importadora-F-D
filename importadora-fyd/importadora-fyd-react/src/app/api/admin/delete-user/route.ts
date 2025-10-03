import { NextRequest, NextResponse } from 'next/server';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// NOTA: Esta ruta solo elimina de Firestore
// Para eliminar de Auth también, necesitarías Firebase Admin SDK con Service Account
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Eliminar documento de usuario de Firestore
    await deleteDoc(doc(db, 'users', userId));
    console.log('✅ Usuario eliminado de Firestore:', userId);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado de Firestore exitosamente. Para eliminar también de Auth, usa Firebase Console.'
    });

  } catch (error: any) {
    console.error('❌ Error eliminando usuario:', error);
    return NextResponse.json(
      { error: error.message || 'Error eliminando usuario' },
      { status: 500 }
    );
  }
}
