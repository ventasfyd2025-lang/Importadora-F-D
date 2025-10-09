# Configuración Firebase Admin - Paso a Paso

## 📋 Pasos para Configurar Firebase Admin en Vercel

### 1. Obtener Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **importadora-fyd-react-3**
3. Click en el ícono ⚙️ (Settings) → **Project Settings**
4. Pestaña **Service Accounts**
5. Click en **Generate New Private Key**
6. Se descargará un archivo JSON (ejemplo: `importadora-fyd-react-3-firebase-adminsdk-xxxxx.json`)

### 2. Extraer los Valores del JSON

Abre el archivo JSON descargado y localiza estos campos:

```json
{
  "type": "service_account",
  "project_id": "importadora-fyd-react-3",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@importadora-fyd-react-3.iam.gserviceaccount.com",
  ...
}
```

Los valores que necesitas son:
- `client_email`
- `private_key`

### 3. Configurar en Vercel

#### Opción A: Desde la Web
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto: **importadora-fyd-react**
3. Settings → Environment Variables
4. Agrega estas variables:

**Variable 1:**
- Name: `FIREBASE_CLIENT_EMAIL`
- Value: Copia el valor de `client_email` del JSON
- Environment: Production, Preview, Development

**Variable 2:**
- Name: `FIREBASE_PRIVATE_KEY`
- Value: Copia el valor de `private_key` del JSON (incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
- Environment: Production, Preview, Development

#### Opción B: Desde CLI
```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# Agregar FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_CLIENT_EMAIL

# Cuando pregunte el valor, pega: firebase-adminsdk-xxxxx@importadora-fyd-react-3.iam.gserviceaccount.com
# Selecciona: Production, Preview, Development

# Agregar FIREBASE_PRIVATE_KEY
vercel env add FIREBASE_PRIVATE_KEY

# Cuando pregunte el valor, pega toda la clave privada (con los ----BEGIN y ----END)
# Selecciona: Production, Preview, Development
```

### 4. Verificar Configuración

Después de agregar las variables:

```bash
# Ver las variables configuradas
vercel env ls

# Deberías ver:
# FIREBASE_CLIENT_EMAIL (Production, Preview, Development)
# FIREBASE_PRIVATE_KEY (Production, Preview, Development)
```

### 5. Redeploy

```bash
vercel --prod
```

### 6. Probar

1. Ve al admin de tu sitio
2. Intenta eliminar un usuario
3. Debería funcionar correctamente con autenticación

## ⚠️ Notas Importantes

- **NO COMPARTAS** el archivo JSON descargado
- **NO HAGAS COMMIT** del archivo JSON al repositorio
- Las credenciales son sensibles, solo las personas autorizadas deben tenerlas
- Puedes eliminar el archivo JSON local después de configurarlo en Vercel

## 🔍 Solución de Problemas

### Error: "Invalid or expired token"
- Verifica que `FIREBASE_PRIVATE_KEY` esté completa
- Asegúrate de incluir `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`

### Error: "User not found"
- Verifica que `FIREBASE_CLIENT_EMAIL` sea correcta
- Verifica que el proyecto de Firebase sea el correcto

### Error: "Missing credentials"
- Verifica que las variables estén en el environment correcto (Production)
- Redeploy después de agregar las variables
