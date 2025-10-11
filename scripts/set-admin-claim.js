// Script para asignar el claim isAdmin al usuario administrador
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Faltan variables de entorno:');
    console.error('   FIREBASE_ADMIN_PROJECT_ID:', projectId ? '✅' : '❌');
    console.error('   FIREBASE_ADMIN_CLIENT_EMAIL:', clientEmail ? '✅' : '❌');
    console.error('   FIREBASE_ADMIN_PRIVATE_KEY:', privateKey ? '✅' : '❌');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function setAdminClaim() {
  try {
    console.log('🔍 Buscando usuario administrador...');

    // Buscar el usuario con email ventas.fyd2025@gmail.com
    const email = 'ventas.fyd2025@gmail.com';
    const userRecord = await auth.getUserByEmail(email);

    console.log(`✅ Usuario encontrado: ${userRecord.email}`);
    console.log(`   UID: ${userRecord.uid}`);

    // Verificar claims actuales
    const currentClaims = userRecord.customClaims || {};
    console.log('   Claims actuales:', currentClaims);

    // Asignar el claim isAdmin
    await auth.setCustomUserClaims(userRecord.uid, {
      ...currentClaims,
      isAdmin: true,
      admin: true
    });

    console.log('✅ Claim "isAdmin" asignado correctamente');

    // Verificar que se asignó correctamente
    const updatedUser = await auth.getUser(userRecord.uid);
    console.log('   Claims actualizados:', updatedUser.customClaims);

    // Actualizar también el documento en Firestore para que sea consistente
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      await userDocRef.update({
        isAdmin: true,
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Documento de usuario actualizado en Firestore');
    }

    console.log('\n🎉 ¡Listo! El usuario debe cerrar sesión y volver a iniciar para que el claim tome efecto.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setAdminClaim();
