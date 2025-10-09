# 🎯 CONFIGURACIÓN MANUAL - PASO A PASO

## ✅ OPCIÓN 1: Usar Script Automático (Recomendado)

Si tienes el archivo JSON de Firebase Admin, este script lo hace TODO automáticamente:

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# El script buscará el archivo automáticamente en Downloads, Desktop, Documents
./scripts/setup-vercel-env.sh
```

El script:
1. ✅ Busca el archivo de credenciales
2. ✅ Extrae las variables automáticamente
3. ✅ Las sube a Vercel (production, preview, development)
4. ✅ Te dice qué hacer después

---

## ✅ OPCIÓN 2: Configuración Manual (Si no tienes el archivo)

### **PASO 1: Descargar Credenciales de Firebase**

1. Abre tu navegador y ve a:
   ```
   https://console.firebase.google.com
   ```

2. Verás una lista de proyectos. Click en: **importadora-fyd**

3. En la página principal del proyecto, busca el ícono de **engranaje ⚙️** en la esquina superior izquierda, al lado de "Project Overview"

4. Click en: **"Configuración del proyecto"** o **"Project Settings"**

5. En el menú superior (tabs), click en: **"Cuentas de servicio"** o **"Service Accounts"**

6. Verás una sección que dice: **"SDK de Firebase Admin"** o **"Firebase Admin SDK"**

7. Hay un botón rojo que dice: **"Generar nueva clave privada"** o **"Generate new private key"**
   - Click en ese botón

8. Aparecerá un popup de confirmación:
   ```
   ⚠️ Esta clave otorga acceso de administrador a tu proyecto de Firebase
   ```
   - Click en: **"Generar clave"** o **"Generate key"**

9. **SE DESCARGARÁ UN ARCHIVO `.json`** a tu carpeta de Descargas
   - Nombre similar a: `importadora-fyd-firebase-adminsdk-xxxxx-abc123.json`

10. **¡NO BORRES ESTE ARCHIVO!** Guárdalo en un lugar seguro

---

### **PASO 2: Usar el Script de Extracción**

Una vez que tengas el archivo descargado:

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# Reemplaza la ruta con donde guardaste el archivo
./scripts/extract-firebase-credentials.sh ~/Downloads/importadora-fyd-firebase-adminsdk-xxxxx.json
```

Esto te mostrará:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 CREDENCIALES DE FIREBASE ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 FIREBASE_CLIENT_EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
firebase-adminsdk-xxxxx@importadora-fyd.iam.gserviceaccount.com


🔑 FIREBASE_PRIVATE_KEY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAAS...
-----END PRIVATE KEY-----
```

**¡Copia estos valores!** Los necesitarás en el siguiente paso.

---

### **PASO 3: Agregar Variables en Vercel Dashboard**

1. Abre tu navegador y ve a:
   ```
   https://vercel.com/dashboard
   ```

2. En la lista de proyectos, busca y click en: **importadora-fyd-react**

3. En el menú superior, click en: **"Settings"**

4. En el menú lateral izquierdo, busca y click en: **"Environment Variables"**

5. Verás una lista de variables que ya tienes. Click en el botón: **"Add New"** o **"Add Variable"**

---

### **PASO 3.1: Agregar FIREBASE_CLIENT_EMAIL**

En el formulario que aparece:

**Name (Nombre):**
```
FIREBASE_CLIENT_EMAIL
```

**Value (Valor):**
```
[Pega el valor que copiaste del script]
Ejemplo: firebase-adminsdk-xxxxx@importadora-fyd.iam.gserviceaccount.com
```

**Environment (Ambiente):**
- ✅ Marca el checkbox de: **Production**
- ✅ Marca el checkbox de: **Preview**
- ✅ Marca el checkbox de: **Development**

Click en: **"Save"**

---

### **PASO 3.2: Agregar FIREBASE_PRIVATE_KEY**

Click nuevamente en: **"Add New"**

**Name (Nombre):**
```
FIREBASE_PRIVATE_KEY
```

**Value (Valor):**
```
[Pega TODO el private key que copiaste del script]

Debe incluir:
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAAS...
(muchas líneas)
-----END PRIVATE KEY-----
```

**⚠️ IMPORTANTE:**
- Copia TODO, desde `-----BEGIN` hasta `-----END`
- Incluye los saltos de línea (`\n`)
- Vercel los manejará automáticamente

**Environment (Ambiente):**
- ✅ Marca: **Production**
- ✅ Marca: **Preview**
- ✅ Marca: **Development**

Click en: **"Save"**

---

### **PASO 4: Verificar que se Agregaron**

Deberías ver en la lista:

```
Environment Variables

FIREBASE_CLIENT_EMAIL                      firebase-adminsdk-xxxx@... [Production, Preview, Development]
FIREBASE_PRIVATE_KEY                       ******** (hidden)          [Production, Preview, Development]
NEXT_PUBLIC_FIREBASE_API_KEY               AIzaSyB...                 [Production, Preview, Development]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN           importadora-fyd...         [Production, Preview, Development]
... (otras variables)
```

---

### **PASO 5: Redeploy**

Las variables solo se aplican en nuevos deploys.

**Opción A - Desde Vercel Dashboard:**

1. En el menú superior, click en: **"Deployments"**

2. Verás una lista de deploys. En el más reciente (el primero de la lista), busca el ícono de **3 puntos (...)** a la derecha

3. Click en los 3 puntos → **"Redeploy"**

4. En el popup, click en: **"Redeploy"** nuevamente

5. Espera 2-3 minutos mientras hace el build

**Opción B - Desde Git:**

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

git add .
git commit -m "chore: Configurar Firebase Admin en Vercel"
git push origin main
```

Vercel detectará el push y hará deploy automáticamente.

**Opción C - Desde Vercel CLI:**

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# Si no tienes Vercel CLI:
npm install -g vercel

# Login (primera vez)
vercel login

# Deploy a producción
vercel --prod
```

---

### **PASO 6: Verificar que Funciona**

1. Espera a que termine el deploy (verás "Ready ✓" en Vercel)

2. Ve a tu sitio: `https://importadora-fyd-react.vercel.app/admin`

3. Login como administrador

4. Intenta alguna acción de admin (como ver lista de usuarios)

5. **Si funciona sin errores = ✅ Configuración exitosa**

6. Si ves errores en la consola del navegador:
   - Abre DevTools (F12)
   - Ve a la pestaña "Console"
   - Busca errores relacionados con "firebase" o "admin"

---

## 🆘 TROUBLESHOOTING

### Problema: "Service account object must contain a string 'private_key' property"

**Causa:** La variable `FIREBASE_PRIVATE_KEY` no se configuró correctamente.

**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Encuentra `FIREBASE_PRIVATE_KEY`
3. Click en los 3 puntos → "Edit"
4. Vuelve a pegar el valor completo (incluyendo BEGIN y END)
5. Save
6. Redeploy

---

### Problema: "Invalid email"

**Causa:** La variable `FIREBASE_CLIENT_EMAIL` tiene espacios o está mal copiada.

**Solución:**
1. Verifica que NO tenga espacios al inicio o final
2. Debe terminar en `@importadora-fyd.iam.gserviceaccount.com`
3. NO debe tener comillas

---

### Problema: Las variables no aparecen en el build

**Causa:** No hiciste redeploy después de agregar las variables.

**Solución:**
1. Vercel Dashboard → Deployments
2. Click "..." en el último deploy → Redeploy
3. Espera a que termine

---

## 📞 ¿NECESITAS AYUDA?

Si algo no funciona, ejecuta:

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# Ver las variables que tienes configuradas localmente
cat .env.local

# Ver si el archivo de credenciales está en Downloads
ls -la ~/Downloads/*firebase*.json
```

Y comparte el output conmigo.

---

## ✅ CHECKLIST FINAL

- [ ] Descargué el archivo JSON de Firebase Console
- [ ] Ejecuté el script de extracción o copié los valores manualmente
- [ ] Agregué `FIREBASE_CLIENT_EMAIL` en Vercel
- [ ] Agregué `FIREBASE_PRIVATE_KEY` en Vercel
- [ ] Seleccioné Production, Preview y Development para ambas variables
- [ ] Hice redeploy
- [ ] El build terminó exitosamente
- [ ] Probé el admin panel y funciona
- [ ] No hay errores en la consola del navegador

---

**✅ Si completaste todos los pasos, la configuración está lista!**
