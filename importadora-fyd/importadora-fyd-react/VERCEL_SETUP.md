# 🚀 Configuración de Variables de Entorno en Vercel

## ⚠️ IMPORTANTE: Configuración Requerida

Para que las **APIs de administración** funcionen correctamente en producción, necesitas configurar las credenciales de **Firebase Admin SDK** en Vercel.

**Sin estas variables, las siguientes funciones NO funcionarán:**
- ❌ Eliminar usuarios desde el panel admin
- ❌ Cualquier API que use `requireAdmin()`
- ❌ Build de producción (fallará)

---

## 📋 Variables que DEBES Configurar

### **Variables Faltantes (CRÍTICAS):**
```bash
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

### **Variables que YA tienes configuradas:**
```bash
✅ NEXT_PUBLIC_FIREBASE_API_KEY
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
✅ NEXT_PUBLIC_FIREBASE_APP_ID
✅ MERCADOPAGO_ACCESS_TOKEN
✅ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
```

---

## 🔑 Paso 1: Obtener las Credenciales de Firebase Admin

### **Opción A: Si tienes el archivo JSON de credenciales**

Si ya descargaste las credenciales antes, busca un archivo llamado:
- `importadora-fyd-firebase-adminsdk-xxxxx.json`
- `serviceAccountKey.json`
- O similar en tu computadora

Ábrelo y copia:
- `client_email` → Será tu `FIREBASE_CLIENT_EMAIL`
- `private_key` → Será tu `FIREBASE_PRIVATE_KEY`

### **Opción B: Generar nuevas credenciales**

1. **Ve a Firebase Console:**
   ```
   https://console.firebase.google.com
   ```

2. **Selecciona tu proyecto:** `importadora-fyd`

3. **Ve a Project Settings (⚙️ arriba izquierda)**

4. **Click en la pestaña "Service Accounts"**

5. **Scroll abajo hasta "Firebase Admin SDK"**

6. **Click en "Generate New Private Key"**
   - ⚠️ Aparecerá un warning: "This key grants admin access to your Firebase project"
   - Click "Generate Key"

7. **Se descargará un archivo JSON** similar a:
   ```json
   {
     "type": "service_account",
     "project_id": "importadora-fyd",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@importadora-fyd.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     ...
   }
   ```

8. **Guarda este archivo en un lugar SEGURO** (NO lo subas a Git)

---

## 🌐 Paso 2: Configurar en Vercel

### **2.1 Acceder al Dashboard de Vercel**

1. Ve a: https://vercel.com/dashboard
2. Login con tu cuenta
3. Selecciona el proyecto: **importadora-fyd-react**

### **2.2 Ir a Environment Variables**

1. Click en **"Settings"** (en el menú superior)
2. En el menú lateral izquierdo, click en **"Environment Variables"**

### **2.3 Agregar FIREBASE_CLIENT_EMAIL**

1. Click en **"Add New"** o **"Add Variable"**
2. En el campo **Name**, escribe:
   ```
   FIREBASE_CLIENT_EMAIL
   ```
3. En el campo **Value**, pega el valor de `client_email` del JSON:
   ```
   firebase-adminsdk-xxxxx@importadora-fyd.iam.gserviceaccount.com
   ```
4. En **Environments**, selecciona:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

### **2.4 Agregar FIREBASE_PRIVATE_KEY**

1. Click nuevamente en **"Add New"**
2. En el campo **Name**, escribe:
   ```
   FIREBASE_PRIVATE_KEY
   ```
3. En el campo **Value**, pega el valor de `private_key` del JSON:

   **⚠️ IMPORTANTE:** Copia TODO el valor incluyendo:
   ```
   -----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
   ... (muchas líneas) ...
   -----END PRIVATE KEY-----
   ```

   **NOTA:** Vercel manejará automáticamente los saltos de línea (`\n`), así que puedes pegar el valor tal como está.

4. En **Environments**, selecciona:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

---

## ✅ Paso 3: Verificar la Configuración

Después de agregar las variables, deberías ver algo como:

```
Environment Variables (8)

FIREBASE_CLIENT_EMAIL                      firebase-adminsdk-xxxx@... [All]
FIREBASE_PRIVATE_KEY                       ********                   [All]
NEXT_PUBLIC_FIREBASE_API_KEY               AIzaSyB-azg5UZl5y...      [All]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN           importadora-fyd.fire...    [All]
NEXT_PUBLIC_FIREBASE_PROJECT_ID            importadora-fyd            [All]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET        importadora-fyd.fire...    [All]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID   790742066847               [All]
NEXT_PUBLIC_FIREBASE_APP_ID                1:790742066847:web:...     [All]
```

---

## 🔄 Paso 4: Redeploy la Aplicación

Las variables de entorno solo se aplican en nuevos deploys.

### **Opción A: Redeploy desde Dashboard**

1. En Vercel Dashboard, ve a tu proyecto
2. Click en la pestaña **"Deployments"**
3. Encuentra el último deployment
4. Click en el menú **"..."** (tres puntos)
5. Click en **"Redeploy"**
6. Confirma: **"Redeploy to Production"**

### **Opción B: Redeploy desde CLI**

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# Si no tienes Vercel CLI instalado:
npm i -g vercel

# Login (si no lo has hecho)
vercel login

# Redeploy a producción
vercel --prod
```

### **Opción C: Push a Git (trigger automático)**

```bash
git add .
git commit -m "chore: Configurar variables de entorno en Vercel"
git push origin main
```

Vercel detectará el push y hará deploy automáticamente.

---

## 🧪 Paso 5: Probar que Funciona

### **5.1 Esperar a que termine el deploy**

En Vercel Dashboard verás:
```
Building... → Ready ✓
```

### **5.2 Probar la API de admin**

1. Ve a tu sitio: https://importadora-fyd-react.vercel.app
2. Login como administrador
3. Abre DevTools (F12) → Console
4. Ejecuta:
   ```javascript
   const token = await firebase.auth().currentUser.getIdToken();

   const response = await fetch('/api/admin/delete-user', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({ userId: 'test_user_id' })
   });

   const data = await response.json();
   console.log(data);
   ```

**Resultado esperado:**
```json
{
  "error": "User not found"  // Si el usuario no existe
}
```
O
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

**NO debería dar:**
```json
{
  "error": "Service account object must contain..."  // ❌ Esto significa que falta la variable
}
```

---

## 🚨 Troubleshooting

### **Problema 1: "Service account object must contain a string 'private_key' property"**

**Causa:** La variable `FIREBASE_PRIVATE_KEY` no está configurada o está mal formateada.

**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que `FIREBASE_PRIVATE_KEY` existe
3. Borra la variable y créala de nuevo
4. Asegúrate de copiar TODO el private key incluyendo:
   ```
   -----BEGIN PRIVATE KEY-----
   ...
   -----END PRIVATE KEY-----
   ```
5. Redeploy

---

### **Problema 2: "Invalid email"**

**Causa:** El valor de `FIREBASE_CLIENT_EMAIL` es incorrecto.

**Solución:**
1. Verificar que el email termina en `@importadora-fyd.iam.gserviceaccount.com`
2. NO debe tener espacios ni comillas
3. Ejemplo correcto:
   ```
   firebase-adminsdk-abc12@importadora-fyd.iam.gserviceaccount.com
   ```

---

### **Problema 3: Las variables no se aplican**

**Causa:** Vercel cachea las variables.

**Solución:**
1. Hacer un **Hard Redeploy**:
   - Vercel Dashboard → Deployments
   - Click "..." en el último deployment
   - "Redeploy" (sin usar cache)
2. Esperar 2-3 minutos
3. Probar nuevamente

---

### **Problema 4: "Error: Cannot find module 'firebase-admin'"**

**Causa:** Dependencia no instalada.

**Solución:**
```bash
npm install firebase-admin
git add package.json package-lock.json
git commit -m "Add firebase-admin dependency"
git push
```

---

## 🔒 Seguridad: Best Practices

### ✅ **DO (Hacer):**
- ✅ Guardar el archivo JSON de credenciales en un lugar seguro
- ✅ Usar variables de entorno en Vercel (nunca hardcodear)
- ✅ Configurar las variables para todos los environments (Prod, Preview, Dev)
- ✅ Rotar las credenciales cada 3-6 meses

### ❌ **DON'T (No Hacer):**
- ❌ Subir el archivo JSON de credenciales a Git
- ❌ Compartir las credenciales por email/chat
- ❌ Usar las mismas credenciales en múltiples proyectos
- ❌ Exponer las variables en código client-side

---

## 📊 Checklist Final

Antes de dar por finalizada la configuración:

- [ ] ✅ Descargado archivo JSON de Firebase Admin
- [ ] ✅ Guardado en lugar seguro (NO en Git)
- [ ] ✅ `FIREBASE_CLIENT_EMAIL` agregado en Vercel
- [ ] ✅ `FIREBASE_PRIVATE_KEY` agregado en Vercel
- [ ] ✅ Variables configuradas para Production, Preview y Development
- [ ] ✅ Redeploy realizado
- [ ] ✅ API de admin probada y funciona
- [ ] ✅ No hay errores en los logs de Vercel
- [ ] ✅ Build exitoso en Vercel

---

## 🆘 Necesitas Ayuda?

Si algo no funciona:

1. **Vercel Logs:**
   - Dashboard → Tu proyecto → Deployments
   - Click en el último deployment
   - Pestaña "Build Logs" o "Function Logs"
   - Busca errores relacionados con Firebase

2. **Firebase Logs:**
   - Firebase Console → Functions (si usas)
   - O revisa los logs de Authentication

3. **Variables de Entorno:**
   - Vercel → Settings → Environment Variables
   - Verifica que TODAS estén presentes
   - Copia el nombre exacto (case-sensitive)

---

## 📚 Referencias

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**✅ Una vez completada esta configuración, todas las funciones de admin funcionarán correctamente en producción.**
