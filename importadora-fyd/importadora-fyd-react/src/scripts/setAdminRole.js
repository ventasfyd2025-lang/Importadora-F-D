// Script para establecer rol de admin a un usuario específico
// Ejecutar con: node src/scripts/setAdminRole.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

// Tu configuración de Firebase (copia desde src/lib/firebase.ts)
const firebaseConfig = {
  // Añadir tu configuración aquí
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdminRole(email) {
  try {
    // Buscar usuario por email en la colección users
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('Usuario no encontrado');
      return;
    }

    const userDoc = querySnapshot.docs[0];
    await updateDoc(userDoc.ref, {
      role: 'admin'
    });

    console.log(`Rol de admin asignado a: ${email}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Cambiar por tu email de admin
const adminEmail = 'tu-email@ejemplo.com';
setAdminRole(adminEmail);