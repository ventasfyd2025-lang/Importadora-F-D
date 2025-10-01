 'use client';

import { useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();

      // Request additional scopes for better user info
      provider.addScope('email');
      provider.addScope('profile');

      // Configure popup parameters
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: 'user@example.com'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);

      console.log('✅ Google sign-in successful:', user.email);

      // Check if user profile exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      // Create or update user profile
      const userData = {
        uid: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        phone: user.phoneNumber || '',
        photoURL: user.photoURL || '',
        provider: 'google',
        role: 'cliente', // Default role
        isActive: true,
        lastLogin: new Date(),
        // Only set these if user doesn't exist
        ...(userDoc.exists() ? {} : {
          createdAt: new Date(),
          rut: '',
          address: {
            street: '',
            city: '',
            region: '',
            postalCode: ''
          }
        })
      };

      await setDoc(userRef, userData, { merge: true });

      console.log('✅ User profile created/updated');

      return {
        user,
        credential,
        isNewUser: !userDoc.exists()
      };

    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);

      let errorMessage = 'Error al iniciar sesión con Google';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Popup cerrado por el usuario';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Solicitud de popup cancelada';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup bloqueado por el navegador. Por favor, permite popups para este sitio.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de red. Por favor, verifica tu conexión a internet.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Por favor, espera un momento antes de intentar de nuevo.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Ya existe una cuenta con este email usando un método de acceso diferente.';
          break;
        default:
          errorMessage = error.message || 'Error desconocido al iniciar sesión con Google';
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Link Google account to existing user
  const linkGoogleAccount = async (currentUser: User) => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('✅ Google account linked successfully:', user.email);

      // Update user profile with Google info
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        photoURL: user.photoURL || '',
        provider: 'email+google',
        linkedAccounts: ['email', 'google'],
        lastUpdate: new Date()
      }, { merge: true });

      return { user };

    } catch (error: any) {
      console.error('❌ Google account linking error:', error);

      let errorMessage = 'Error al vincular cuenta de Google';

      switch (error.code) {
        case 'auth/credential-already-in-use':
          errorMessage = 'Esta cuenta de Google ya está vinculada a otro usuario.';
          break;
        case 'auth/provider-already-linked':
          errorMessage = 'Ya tienes una cuenta de Google vinculada.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Popup cerrado por el usuario';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup bloqueado por el navegador. Por favor, permite popups para este sitio.';
          break;
        default:
          errorMessage = error.message || 'Error desconocido al vincular cuenta de Google';
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google (silent, using existing session)
  const signInWithGoogleSilent = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'none' // Don't show account selection
      });

      const result = await signInWithPopup(auth, provider);
      return { user: result.user };

    } catch (error: any) {
      // Silent sign-in failed, this is usually expected
      console.log('Silent Google sign-in failed (expected):', error.code);

      if (error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request') {
        // These are expected for silent sign-in
        return null;
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    linkGoogleAccount,
    signInWithGoogleSilent,
    loading,
    error,
    clearError: () => setError(null)
  };
}