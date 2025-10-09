const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB-azg5UZl5y-4jyRFpbpBlGcyo1hibLpM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "importadora-fyd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "importadora-fyd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "importadora-fyd.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "790742066847",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:790742066847:web:f7ae71cb04c9345185e4aa"
};

async function testStorage() {
  try {
    console.log('🔥 Testing Firebase Storage...');
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    const auth = getAuth(app);

    console.log('🔑 Trying anonymous auth...');
    try {
      await signInAnonymously(auth);
      console.log('✅ Anonymous auth successful');
    } catch (authError) {
      console.log('❌ Anonymous auth failed:', authError.message);
    }

    // Create a simple test file
    const testData = Buffer.from('Hello, Firebase Storage!', 'utf-8');
    const testFileName = `test/test-${Date.now()}.txt`;
    const storageRef = ref(storage, testFileName);

    console.log('📤 Attempting upload...');
    const snapshot = await uploadBytes(storageRef, testData);
    console.log('✅ Upload successful:', snapshot.metadata.name);

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return true;
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    console.error('Error code:', error.code);
    return false;
  }
}

testStorage().then(success => {
  console.log(`\n🎯 Storage test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
});