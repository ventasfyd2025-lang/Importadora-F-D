# 🔥 QUÉ HACER CON EL ARCHIVO JSON

## 📥 PASO 1: Verificar que tienes el archivo correcto

Después de descargarlo de Firebase Console, verifica:

```bash
# Ver el archivo más reciente descargado
ls -lt ~/Downloads/*.json | head -1
```

Debe decir algo como:
```
importadora-fyd-firebase-adminsdk-xxxxx.json
```

**⚠️ NO debe ser:**
- ❌ `google-services.json` (ese es para apps Android)
- ❌ `tienda-xxxx.json` (ese es otro proyecto)

---

## ⚡ OPCIÓN A: Script Automático (MÁS FÁCIL)

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# El script buscará automáticamente el archivo más reciente
./scripts/setup-vercel-env.sh
```

**El script preguntará:**
```
¿Deseas agregar estas variables a Vercel? (y/n):
```

✅ Escribe `y` y presiona Enter

**Si el script no encuentra el archivo automáticamente, te pedirá la ruta:**
```
Por favor, proporciona la ruta al archivo:
Ruta: _
```

✅ Escribe: `~/Downloads/importadora-fyd-firebase-adminsdk-xxxxx.json`
   (Reemplaza con el nombre real del archivo)

**Luego el script:**
1. ✅ Extraerá las credenciales
2. ✅ Las subirá a Vercel automáticamente
3. ✅ Te dirá que hagas redeploy

---

## 📋 OPCIÓN B: Manual (Si el script no funciona)

### **Paso 1: Extraer las credenciales del JSON**

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# Reemplaza con el nombre real de tu archivo
./scripts/extract-firebase-credentials.sh ~/Downloads/importadora-fyd-firebase-adminsdk-xxxxx.json
```

**Verás algo como:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 CREDENCIALES DE FIREBASE ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 FIREBASE_CLIENT_EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
firebase-adminsdk-abc12@importadora-fyd.iam.gserviceaccount.com


🔑 FIREBASE_PRIVATE_KEY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAo...
-----END PRIVATE KEY-----
```

### **Paso 2: Copiar los valores**

1. ✅ Selecciona TODO el `FIREBASE_CLIENT_EMAIL` (desde `firebase-` hasta `.com`)
2. ✅ Cópialo (Cmd+C)
3. ✅ Guárdalo en un lugar temporal (Notas, editor de texto)

4. ✅ Selecciona TODO el `FIREBASE_PRIVATE_KEY` (desde `-----BEGIN` hasta `-----END`)
5. ✅ Cópialo (Cmd+C)
6. ✅ Guárdalo junto al email

### **Paso 3: Ir a Vercel Dashboard**

```bash
# Abrir Vercel en el navegador
open https://vercel.com/dashboard
```

1. ✅ Click en tu proyecto: **importadora-fyd-react**
2. ✅ Click en **Settings** (menú superior)
3. ✅ Click en **Environment Variables** (menú lateral)

### **Paso 4: Agregar FIREBASE_CLIENT_EMAIL**

1. ✅ Click en **"Add New"**
2. ✅ En "Name" escribe: `FIREBASE_CLIENT_EMAIL`
3. ✅ En "Value" pega el email que copiaste
4. ✅ Marca los 3 checkboxes:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development
5. ✅ Click en **"Save"**

### **Paso 5: Agregar FIREBASE_PRIVATE_KEY**

1. ✅ Click en **"Add New"** otra vez
2. ✅ En "Name" escribe: `FIREBASE_PRIVATE_KEY`
3. ✅ En "Value" pega TODO el private key (incluyendo BEGIN y END)
4. ✅ Marca los 3 checkboxes:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development
5. ✅ Click en **"Save"**

---

## 🔄 PASO FINAL: Redeploy

### **Opción 1 - Desde Vercel Dashboard:**

1. ✅ Click en **"Deployments"** (menú superior)
2. ✅ En el último deployment, click en **"..."** (3 puntos)
3. ✅ Click en **"Redeploy"**
4. ✅ Espera 2-3 minutos

### **Opción 2 - Desde Terminal:**

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# Si tienes Vercel CLI instalado:
vercel --prod

# Si no, instálalo primero:
npm install -g vercel
vercel login
vercel --prod
```

### **Opción 3 - Desde Git:**

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

git add .
git commit -m "chore: Configurar Firebase Admin variables"
git push origin main
```

---

## ✅ VERIFICAR QUE FUNCIONA

Después del redeploy:

```bash
# Abrir tu sitio en producción
open https://importadora-fyd-react.vercel.app/admin
```

1. ✅ Login como admin
2. ✅ Si carga el panel sin errores = **¡FUNCIONÓ!** 🎉
3. ❌ Si hay errores en consola = Revisa que las variables se agregaron bien

---

## 🔍 VERIFICAR VARIABLES EN VERCEL

Para asegurarte que se agregaron:

1. Ve a: https://vercel.com/dashboard
2. Tu proyecto → Settings → Environment Variables
3. Deberías ver:

```
FIREBASE_CLIENT_EMAIL                      firebase-adminsdk-xxx@... [Production, Preview, Development]
FIREBASE_PRIVATE_KEY                       ******** (oculto)         [Production, Preview, Development]
```

---

## 🚨 Si algo sale mal:

```bash
# Ver qué archivos JSON tienes
ls -la ~/Downloads/*.json

# Ver el contenido del archivo (para verificar que es el correcto)
head -20 ~/Downloads/importadora-fyd-firebase-adminsdk-xxxxx.json

# Debe contener:
# "project_id": "importadora-fyd"
# "private_key": "-----BEGIN PRIVATE KEY-----..."
# "client_email": "firebase-adminsdk-xxxxx@importadora-fyd.iam.gserviceaccount.com"
```

---

## ❓ ¿Cuál es el archivo correcto?

**✅ CORRECTO:**
```json
{
  "type": "service_account",
  "project_id": "importadora-fyd",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@importadora-fyd.iam.gserviceaccount.com",
  ...
}
```

**❌ INCORRECTO (google-services.json):**
```json
{
  "project_info": {
    "project_number": "519129842432",
    "project_id": "tienda-4a8e2",
    ...
  }
}
```

---

**🎯 RESUMEN: Usa el script automático `./scripts/setup-vercel-env.sh` y todo se hará solo!**
