'use client';

import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: unknown) {
      let message = 'Error de autenticación';
      const firebaseError = error as { code?: string; message?: string };

      switch (firebaseError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'Email o contraseña incorrectos';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          message = 'Demasiados intentos. Intenta más tarde';
          break;
        default:
          message = firebaseError.message || 'Error desconocido';
      }
      
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: unknown) {
      const firebaseError = error as { message?: string };
      return { success: false, error: firebaseError.message || 'Error al cerrar sesión' };
    }
  };

  return {
    user,
    loading,
    login,
    logout
  };
}