import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Inicializar Firebase Admin (necesitarás el service account key)
// Para desarrollo local, descarga el service account key desde Firebase Console
// const serviceAccount = require('./path-to-service-account-key.json');

// initializeApp({
//   credential: cert(serviceAccount)
// });

const db = getFirestore();
const auth = getAuth();

export async function createVendedorUser(email: string, password: string, firstName: string, lastName: string) {
  try {
    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: `${firstName} ${lastName}`
    });

    // Crear perfil en Firestore con rol de vendedor
    const userProfile = {
      uid: userRecord.uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: 'vendedor',
      createdAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    console.log(`Usuario vendedor creado exitosamente: ${email}`);
    return userRecord;
  } catch (error) {
    console.error('Error creando usuario vendedor:', error);
    throw error;
  }
}

export async function updateUserRole(email: string, newRole: 'admin' | 'vendedor' | 'cliente') {
  try {
    // Buscar usuario por email
    const userRecord = await auth.getUserByEmail(email);

    // Actualizar rol en Firestore
    await db.collection('users').doc(userRecord.uid).update({
      role: newRole
    });

    console.log(`Rol actualizado para ${email}: ${newRole}`);
    return userRecord;
  } catch (error) {
    console.error('Error actualizando rol de usuario:', error);
    throw error;
  }
}

export async function getUserRole(email: string) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData?.role || 'No role assigned';
    } else {
      return 'User profile not found';
    }
  } catch (error) {
    console.error('Error obteniendo rol de usuario:', error);
    throw error;
  }
}

// Función para migrar usuarios existentes (agregar rol por defecto)
export async function migrateExistingUsers() {
  try {
    const usersSnapshot = await db.collection('users').get();

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();

      // Si el usuario no tiene rol, asignar 'cliente' por defecto
      if (!userData.role) {
        await doc.ref.update({
          role: 'cliente'
        });
        console.log(`Rol 'cliente' asignado a: ${userData.email}`);
      }
    }

    console.log('Migración de usuarios completada');
  } catch (error) {
    console.error('Error en migración:', error);
    throw error;
  }
}

// Ejemplo de uso:
// createVendedorUser('vendedor@ejemplo.com', 'password123', 'Juan', 'Vendedor');
// updateUserRole('admin@ejemplo.com', 'admin');
// getUserRole('usuario@ejemplo.com');