# Variables de Entorno para Vercel

## Instrucciones

El cliente debe configurar estas variables en Vercel antes de hacer deploy.

### Opción 1: Desde la interfaz web de Vercel

1. En la pantalla de "New Project", hacer clic en **"Environment Variables"**
2. Agregar cada variable una por una:
   - Seleccionar "Production", "Preview", y "Development" para cada una
   - Copiar el nombre y valor exacto

### Opción 2: Después del deploy

1. Ir a: https://vercel.com/import-fyds-projects/importadora-f-d/settings/environment-variables
2. Agregar todas las variables
3. Re-deploy el proyecto

---

## Variables Requeridas

### Firebase Client (PÚBLICAS)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB-azg5UZl5y-4jyRFpbpBlGcyo1hibLpM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=importadora-fyd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=importadora-fyd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=importadora-fyd.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=790742066847
NEXT_PUBLIC_FIREBASE_APP_ID=1:790742066847:web:f7ae71cb04c9345185e4aa
```

### Firebase Admin (PRIVADAS) - IMPORTANTE

**El cliente debe obtener estas credenciales de Firebase Console:**

1. Ir a: https://console.firebase.google.com/project/importadora-fyd/settings/serviceaccounts/adminsdk
2. Click en "Generate new private key"
3. Descargar el archivo JSON
4. Extraer estos valores del JSON:

```bash
FIREBASE_ADMIN_PROJECT_ID=importadora-fyd
FIREBASE_ADMIN_CLIENT_EMAIL=[del archivo JSON: client_email]
FIREBASE_ADMIN_PRIVATE_KEY=[del archivo JSON: private_key]
```

**IMPORTANTE:** El `FIREBASE_ADMIN_PRIVATE_KEY` debe incluirse CON las comillas y saltos de línea. Ejemplo:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n
```

### MercadoPago

```bash
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-c0245993-ab9c-4977-a3ab-7aabaa927f83
MERCADOPAGO_ACCESS_TOKEN=APP_USR-5287307946030683-100211-90e6fc1fa421b655b4edc4def8696659-2704213885
```

### URLs

```bash
NEXT_PUBLIC_BASE_URL=https://www.importadora-fyd.cl
BASE_URL=https://www.importadora-fyd.cl
```

---

## Resumen

**Total de variables:** 13

- 6 variables de Firebase Client (NEXT_PUBLIC_FIREBASE_*)
- 3 variables de Firebase Admin (FIREBASE_ADMIN_*)
- 2 variables de MercadoPago
- 2 variables de URLs

---

## Verificación

Una vez configuradas todas las variables, el deploy debería completarse sin errores. Si hay problemas:

1. Verificar que todas las 13 variables están configuradas
2. Verificar que no hay espacios extra al inicio o final de los valores
3. Verificar que el FIREBASE_ADMIN_PRIVATE_KEY incluye los saltos de línea (\n)
