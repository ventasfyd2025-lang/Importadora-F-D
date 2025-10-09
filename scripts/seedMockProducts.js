#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

async function loadFirebase() {
  const firebaseApp = await import('firebase/app');
  const firebaseFirestore = await import('firebase/firestore');
  return { firebaseApp, firebaseFirestore };
}

function loadMockProducts() {
  const filePath = path.resolve(__dirname, '../src/data/mockProducts.ts');
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const transpiled = ts.transpileModule(fileContents, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
  }).outputText;

  const script = new vm.Script(transpiled, { filename: 'mockProducts.js' });
  const sandbox = {
    module: { exports: {} },
    exports: {},
    require: (name) => {
      throw new Error(`No se puede requerir el módulo '${name}' dentro de mockProducts.ts`);
    },
    console,
  };
  script.runInNewContext(sandbox);

  const data = sandbox.module.exports.mockProducts || sandbox.exports.mockProducts;
  if (!Array.isArray(data)) {
    throw new Error('mockProducts no es un arreglo después de evaluar el archivo.');
  }
  return data;
}

function buildProductPayload(product) {
  const now = new Date().toISOString();
  const envioGratis = Object.prototype.hasOwnProperty.call(product, 'envioGratis')
    ? product.envioGratis
    : product.precio >= 50000;

  return {
    ...product,
    activo: Object.prototype.hasOwnProperty.call(product, 'activo') ? product.activo : true,
    envioGratis,
    fechaCreacion: product.fechaCreacion || now,
    updatedAt: now,
  };
}

async function authenticate(auth, email, password) {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  try {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Autenticado como ${credentials.user.email}`);
    return credentials.user;
  } catch (error) {
    console.error('Error autenticando con Firebase Auth:', error);
    throw error;
  }
}

async function main() {
  try {
    const products = loadMockProducts();
    if (products.length === 0) {
      console.log('No se encontraron productos en mockProducts. Nada que sincronizar.');
      return;
    }

    const { firebaseApp, firebaseFirestore } = await loadFirebase();
    const { initializeApp } = firebaseApp;
    const { getFirestore, doc, setDoc } = firebaseFirestore;
    const { getAuth } = await import('firebase/auth');

    const firebaseConfig = {
      apiKey: 'AIzaSyB-azg5UZl5y-4jyRFpbpBlGcyo1hibLpM',
      authDomain: 'importadora-fyd.firebaseapp.com',
      projectId: 'importadora-fyd',
      storageBucket: 'importadora-fyd.firebasestorage.app',
      messagingSenderId: '790742066847',
      appId: '1:790742066847:web:f7ae71cb04c9345185e4aa',
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const seedEmail = process.env.SEED_EMAIL || 'admin@importadorafyd.com';
    const seedPassword = process.env.SEED_PASSWORD || 'admin123';
    await authenticate(auth, seedEmail, seedPassword);

    const db = getFirestore(app);

    let processed = 0;
    let failures = 0;

    for (const product of products) {
      const productId = String(product.id || product.nombre || `product_${processed}`);
      const payload = buildProductPayload({ ...product, id: productId });

      try {
        await setDoc(doc(db, 'products', productId), payload, { merge: true });
        processed += 1;
      } catch (error) {
        failures += 1;
        console.error(`Error sincronizando producto ${productId}:`, error);
      }
    }

    console.log(`Sincronización completada. Productos procesados: ${processed}. Errores: ${failures}.`);
  } catch (error) {
    console.error('Error global durante la sincronización:', error);
    process.exitCode = 1;
  }
}

main();
