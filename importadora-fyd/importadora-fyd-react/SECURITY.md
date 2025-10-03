# Guía de Seguridad - Importadora F&D

## 🔐 Configuración de Variables de Entorno

### Variables Requeridas para Seguridad

Para que las rutas de administración funcionen correctamente, necesitas configurar las siguientes variables de entorno en **Vercel**:

#### Firebase Admin SDK (Server-side)

1. **FIREBASE_CLIENT_EMAIL**
   - Obtener de: Firebase Console → Project Settings → Service Accounts
   - Ejemplo: `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com`

2. **FIREBASE_PRIVATE_KEY**
   - Obtener de: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   - **IMPORTANTE**: Copiar la clave privada completa, incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
   - Reemplazar los `\n` reales por la cadena `\\n` si es necesario

### Cómo Obtener las Credenciales de Admin

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (⚙️ arriba a la izquierda)
4. Pestaña **Service Accounts**
5. Click en **Generate New Private Key**
6. Se descargará un archivo JSON con las credenciales

### Configurar en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega las siguientes variables:

```
FIREBASE_CLIENT_EMAIL = [el valor de client_email del JSON]
FIREBASE_PRIVATE_KEY = [el valor de private_key del JSON]
```

**IMPORTANTE**: Para `FIREBASE_PRIVATE_KEY`, copia el valor completo incluyendo los saltos de línea. Vercel manejará automáticamente el formato.

### Verificar Configuración

Después de agregar las variables:
1. Redeploy tu aplicación en Vercel
2. La API `/api/admin/delete-user` ahora requerirá autenticación de admin
3. Verifica que solo administradores puedan eliminar usuarios

## 🛡️ Medidas de Seguridad Implementadas

### 1. Autenticación de Admin en APIs
- ✅ Middleware `requireAdmin` verifica tokens de Firebase
- ✅ Solo usuarios con `isAdmin: true` o `role: 'admin'` pueden acceder
- ✅ Tokens validados con Firebase Admin SDK

### 2. Protección de Rutas
- ✅ `/api/admin/delete-user` requiere token de admin
- ✅ Validación del usuario autenticado antes de ejecutar acciones
- ✅ Prevención de auto-eliminación de admin

### 3. Firestore Security Rules
- ✅ Función `isAdmin()` para validar permisos
- ✅ Usuarios solo pueden leer/editar sus propios datos
- ✅ Carritos privados por usuario
- ✅ Pedidos protegidos (solo dueño o admin)

### 4. Variables de Entorno
- ✅ `.env*` en `.gitignore`
- ✅ Credenciales sensibles nunca en el código
- ✅ Separación entre credenciales públicas y privadas

## ⚠️ Advertencias de Seguridad

### NO HACER:
- ❌ NO commits archivos `.env` al repositorio
- ❌ NO compartas las credenciales de Firebase Admin
- ❌ NO expongas `FIREBASE_PRIVATE_KEY` en el cliente
- ❌ NO uses las mismas credenciales en desarrollo y producción

### HACER:
- ✅ Usar variables de entorno en Vercel para producción
- ✅ Rotar credenciales periódicamente
- ✅ Revisar los logs de Firebase regularmente
- ✅ Mantener actualizado Firebase Admin SDK

## 🔍 Auditoría de Seguridad

### Puntos Verificados:
1. ✅ APIs de admin protegidas con autenticación
2. ✅ Firestore rules correctamente configuradas
3. ✅ Variables de entorno protegidas
4. ✅ Tokens validados en el servidor
5. ✅ Prevención de auto-eliminación de admin

### Puntos a Monitorear:
- Logs de errores de autenticación
- Intentos de acceso no autorizados
- Cambios en roles de usuarios
- Eliminaciones de usuarios

## 📝 Próximos Pasos de Seguridad Recomendados

1. **Rate Limiting**: Implementar límites de peticiones a APIs
2. **IP Whitelist**: Restringir acceso a panel admin por IP
3. **2FA**: Autenticación de dos factores para admins
4. **Audit Logs**: Registrar todas las acciones de admin
5. **Session Management**: Timeout de sesiones de admin
