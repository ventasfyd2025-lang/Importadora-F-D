// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB-azg5UZl5y-4jyRFpbpBlGcyo1hibLpM",
  authDomain: "importadora-fyd.firebaseapp.com",
  projectId: "importadora-fyd",
  storageBucket: "importadora-fyd.firebasestorage.app",
  messagingSenderId: "790742066847",
  appId: "1:790742066847:web:f7ae71cb04c9345185e4aa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;