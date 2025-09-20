'use client';

import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
  };
  createdAt: Date;
}

export interface GuestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
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
            setUserProfile(userDoc.data() as UserProfile);
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

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string,
    phone?: string,
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
      return userCredential.user;
    } catch (error: unknown) {
      setError(getErrorMessage((error as {code?: string}).code || 'unknown'));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setGuestUser(null);
      localStorage.removeItem('guestUser');
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

  return {
    user,
    userProfile,
    guestUser,
    currentUser,
    isRegistered,
    isGuest,
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