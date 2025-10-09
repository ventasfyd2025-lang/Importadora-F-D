'use client';

import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  rut?: string;
  role: 'admin' | 'vendedor' | 'cliente';
  address?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
  };
  createdAt: Date;
  blocked?: boolean;
  blockedAt?: Date;
  unblockedAt?: Date;
}

export interface GuestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  rut?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
  };
  isGuest: true;
}

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Cargar perfil del usuario registrado
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            // Verificar si el usuario está bloqueado
            if (userData.blocked) {
              // Cerrar sesión automáticamente si el usuario está bloqueado
              await signOut(auth);
              setError('Tu cuenta ha sido bloqueada. Contacta al administrador.');
              setUser(null);
              setUserProfile(null);
              setLoading(false);
              return;
            }
            setUserProfile(userData);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
        // Limpiar datos de invitado si hay usuario registrado
        setGuestUser(null);
        localStorage.removeItem('guestUser');
      } else {
        // Cargar datos de invitado si existe
        const savedGuestUser = localStorage.getItem('guestUser');
        if (savedGuestUser) {
          setGuestUser(JSON.parse(savedGuestUser));
        }
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Monitorear cambios en el documento del usuario en tiempo real
  useEffect(() => {
    if (!user) return;

    let previousBlocked = false;

    const unsubscribeUserDoc = onSnapshot(doc(db, 'users', user.uid), async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data() as UserProfile;

        // Si el usuario fue bloqueado mientras estaba usando la aplicación
        if (userData.blocked && !previousBlocked) {
          // Cerrar sesión automáticamente
          await signOut(auth);
          setError('Tu cuenta ha sido bloqueada. Contacta al administrador.');
          return;
        }

        previousBlocked = userData.blocked || false;

        // Actualizar el perfil del usuario
        setUserProfile(userData);
      }
    });

    return () => unsubscribeUserDoc();
  }, [user]);

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    rut?: string,
    role: 'admin' | 'vendedor' | 'cliente' = 'cliente',
    address?: {
      street: string;
      city: string;
      region: string;
      postalCode: string;
    }
  ) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Crear perfil de usuario en Firestore
      const profile: UserProfile = {
        uid: userCredential.user.uid,
        email,
        firstName,
        lastName,
        phone,
        rut,
        role,
        address,
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), profile);
      setUserProfile(profile);

      return userCredential.user;
    } catch (error: unknown) {
      setError(getErrorMessage((error as {code?: string}).code || 'unknown'));
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Verificar si el usuario está bloqueado
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (userData.blocked) {
          // Cerrar sesión inmediatamente si está bloqueado
          await signOut(auth);
          setError('Tu cuenta ha sido bloqueada. Contacta al administrador.');
          throw new Error('blocked-user');
        }
      }

      return userCredential.user;
    } catch (error: unknown) {
      if ((error as Error).message === 'blocked-user') {
        throw error;
      }
      setError(getErrorMessage((error as {code?: string}).code || 'unknown'));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setGuestUser(null);
      localStorage.removeItem('guestUser');

      // Limpiar carrito al cerrar sesión
      localStorage.removeItem('cart');

    } catch (error: unknown) {
      setError('Error al cerrar sesión');
      throw error;
    }
  };

  const continueAsGuest = (guestData: Omit<GuestUser, 'id' | 'isGuest'>) => {
    const guest: GuestUser = {
      ...guestData,
      id: `guest_${Date.now()}`,
      isGuest: true
    };
    
    setGuestUser(guest);
    localStorage.setItem('guestUser', JSON.stringify(guest));
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    
    try {
      const updatedProfile = { ...userProfile, ...updates };
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setUserProfile(updatedProfile);
    } catch (error) {
      setError('Error al actualizar perfil');
      throw error;
    }
  };

  const updateGuestUser = (updates: Partial<GuestUser>) => {
    if (!guestUser) return;
    
    const updatedGuest = { ...guestUser, ...updates };
    setGuestUser(updatedGuest);
    localStorage.setItem('guestUser', JSON.stringify(updatedGuest));
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/network-request-failed':
        return 'Error de conexión';
      default:
        return 'Error de autenticación';
    }
  };

  // Determinar el usuario actual (registrado o invitado)
  const currentUser = userProfile || guestUser;
  const isRegistered = !!userProfile;
  const isGuest = !!guestUser;

  // Funciones para verificar roles
  const isAdmin = userProfile?.role === 'admin';
  const isVendedor = userProfile?.role === 'vendedor';
  const isCliente = userProfile?.role === 'cliente';
  const hasRole = (role: 'admin' | 'vendedor' | 'cliente') => userProfile?.role === role;

  return {
    user,
    userProfile,
    guestUser,
    currentUser,
    isRegistered,
    isGuest,
    isAdmin,
    isVendedor,
    isCliente,
    hasRole,
    loading,
    error,
    register,
    login,
    logout,
    continueAsGuest,
    updateUserProfile,
    updateGuestUser
  };
}