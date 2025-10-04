# 🔐 Plan de Pruebas de Seguridad - Importadora F&D

## Objetivo
Verificar que todas las protecciones de seguridad implementadas funcionan correctamente y que usuarios no autorizados no pueden acceder a recursos restringidos.

---

## 📋 Pre-requisitos

1. **Cuentas de Prueba Necesarias:**
   - ✅ Usuario Admin: Con `role: 'admin'` o `isAdmin: true`
   - ✅ Usuario Cliente: Con `role: 'cliente'`
   - ✅ Usuario No Autenticado: Sin login

2. **Herramientas:**
   - Navegador (Chrome/Firefox con DevTools)
   - Postman o cURL para probar APIs
   - Firebase Console para verificar reglas

---

## 🧪 Test Suite 1: Protección de Páginas Admin

### Test 1.1: Acceso a /admin sin autenticación
```
Pasos:
1. Abrir navegador en modo incógnito
2. Navegar a: http://localhost:3000/admin

Resultado Esperado:
✅ Muestra formulario de login
✅ NO muestra contenido del panel admin
✅ Console muestra: "⚠️ Acceso denegado: usuario no es administrador"

Estado: [ ] PASS [ ] FAIL
Notas: _______________________
```

### Test 1.2: Acceso a /admin con usuario cliente
```
Pasos:
1. Login con cuenta de usuario cliente (role: 'cliente')
2. Navegar a: http://localhost:3000/admin

Resultado Esperado:
✅ Redirige automáticamente a "/"
✅ NO muestra contenido del panel admin
✅ Console muestra: "⚠️ Acceso denegado: usuario no es administrador"

Estado: [ ] PASS [ ] FAIL
Notas: _______________________
```

### Test 1.3: Acceso a /admin con usuario admin
```
Pasos:
1. Login con cuenta de admin (isAdmin: true)
2. Navegar a: http://localhost:3000/admin

Resultado Esperado:
✅ Carga el panel de administración completo
✅ Muestra tabs: Dashboard, Productos, Pedidos, etc.
✅ NO hay errores en consola

Estado: [ ] PASS [ ] FAIL
Notas: _______________________
```

### Test 1.4: Acceso a /admin/usuarios sin admin
```
Pasos:
1. Login con usuario cliente
2. Navegar directamente a: http://localhost:3000/admin/usuarios

Resultado Esperado:
✅ Redirige a "/"
✅ Console: "⚠️ Acceso denegado a /admin/usuarios"

Estado: [ ] PASS [ ] FAIL
Notas: _______________________
```

### Test 1.5: Acceso a /admin/pedido/[id] sin admin
```
Pasos:
1. Login con usuario cliente
2. Navegar a: http://localhost:3000/admin/pedido/abc123

Resultado Esperado:
✅ Redirige a "/"
✅ Console: "⚠️ Acceso denegado a /admin/pedido"

Estado: [ ] PASS [ ] FAIL
Notas: _______________________
```

### Test 1.6: Acceso a /admin/chat/[orderId] sin admin
```
Pasos:
1. Login con usuario cliente
2. Navegar a: http://localhost:3000/admin/chat/abc123

Resultado Esperado:
✅ Redirige a "/"
✅ Console: "⚠️ Acceso denegado a /admin/chat"

Estado: [ ] PASS [ ] FAIL
Notas: _______________________
```

---

## 🧪 Test Suite 2: Protección de APIs

### Test 2.1: API delete-user sin token
```bash
curl -X POST http://localhost:3000/api/admin/delete-user \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123"}'

Resultado Esperado:
{
  "error": "No authorization token provided"
}
Status Code: 401

Estado: [ ] PASS [ ] FAIL
```

### Test 2.2: API delete-user con token de cliente
```bash
# 1. Obtener token de cliente desde DevTools:
#    - Login como cliente
#    - Console: await firebase.auth().currentUser.getIdToken()
#    - Copiar token

curl -X POST http://localhost:3000/api/admin/delete-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN_DE_CLIENTE]" \
  -d '{"userId": "test123"}'

Resultado Esperado:
{
  "error": "Unauthorized. Admin access required."
}
Status Code: 401

Estado: [ ] PASS [ ] FAIL
```

### Test 2.3: API delete-user con token de admin
```bash
# 1. Obtener token de admin desde DevTools
# 2. Crear usuario de prueba primero

curl -X POST http://localhost:3000/api/admin/delete-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN_DE_ADMIN]" \
  -d '{"userId": "usuario_prueba_id"}'

Resultado Esperado:
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
Status Code: 200

Estado: [ ] PASS [ ] FAIL
```

### Test 2.4: API delete-user - Admin intenta auto-eliminarse
```bash
curl -X POST http://localhost:3000/api/admin/delete-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN_DE_ADMIN]" \
  -d '{"userId": "[ID_DEL_MISMO_ADMIN]"}'

Resultado Esperado:
{
  "error": "Cannot delete your own admin account"
}
Status Code: 403

Estado: [ ] PASS [ ] FAIL
```

---

## 🧪 Test Suite 3: Firestore Security Rules

### Test 3.1: Lectura de productos (público)
```
Pasos (en Firebase Console):
1. Firestore → Rules → Playground
2. Simular lectura:
   - Operación: get
   - Ubicación: /databases/importadora-fyd/documents/products/test123
   - Autenticado: NO

Resultado Esperado:
✅ Permitir lectura (allow read: true)

Estado: [ ] PASS [ ] FAIL
```

### Test 3.2: Escritura de productos sin admin
```
Pasos (en Firebase Console):
1. Firestore → Rules → Playground
2. Simular escritura:
   - Operación: create
   - Ubicación: /databases/importadora-fyd/documents/products/nuevo
   - Autenticado: SÍ (usuario cliente)
   - Data: { nombre: "Test" }

Resultado Esperado:
❌ Denegar escritura (isAdmin() == false)

Estado: [ ] PASS [ ] FAIL
```

### Test 3.3: Escritura de productos con admin
```
Pasos (en Firebase Console):
1. Crear usuario de prueba admin en Firestore:
   - Colección: users
   - Doc ID: test_admin_uid
   - Data: { isAdmin: true }

2. Rules Playground:
   - Operación: create
   - Ubicación: /databases/importadora-fyd/documents/products/nuevo
   - Autenticado: SÍ (test_admin_uid)

Resultado Esperado:
✅ Permitir escritura (isAdmin() == true)

Estado: [ ] PASS [ ] FAIL
```

### Test 3.4: Lectura de pedido de otro usuario
```
Pasos:
1. Crear pedido de prueba:
   - userId: "user_A"

2. Intentar leer con otro usuario:
   - Auth: user_B
   - Operación: get
   - Ubicación: /orders/pedido_de_user_A

Resultado Esperado:
❌ Denegar lectura (resource.data.userId != request.auth.uid)

Estado: [ ] PASS [ ] FAIL
```

### Test 3.5: Lectura de carrito de otro usuario
```
Pasos:
1. Intentar leer carrito:
   - Auth: user_A
   - Operación: get
   - Ubicación: /carts/user_B

Resultado Esperado:
❌ Denegar lectura (request.auth.uid != userId)

Estado: [ ] PASS [ ] FAIL
```

### Test 3.6: Escritura en config sin admin
```
Pasos:
1. Intentar modificar configuración:
   - Auth: cliente
   - Operación: update
   - Ubicación: /config/site_config

Resultado Esperado:
❌ Denegar escritura (allow write: if isAdmin())

Estado: [ ] PASS [ ] FAIL
```

---

## 🧪 Test Suite 4: Pruebas de Integración

### Test 4.1: Flujo completo - Cliente intenta acceder a admin
```
Pasos:
1. Login como cliente
2. Ir a /admin (debe redirigir)
3. Intentar /admin/usuarios (debe redirigir)
4. Intentar API delete-user (debe fallar con 401)
5. Intentar modificar producto en Firestore (debe fallar)

Resultado Esperado:
✅ TODAS las operaciones bloqueadas

Estado: [ ] PASS [ ] FAIL
```

### Test 4.2: Flujo completo - Admin tiene acceso total
```
Pasos:
1. Login como admin
2. Acceder a /admin (debe funcionar)
3. Ver /admin/usuarios (debe funcionar)
4. Crear/editar producto (debe funcionar)
5. Eliminar usuario de prueba vía API (debe funcionar)

Resultado Esperado:
✅ TODAS las operaciones permitidas

Estado: [ ] PASS [ ] FAIL
```

### Test 4.3: Session hijacking - Token expirado
```
Pasos:
1. Login como admin
2. Obtener token: await auth.currentUser.getIdToken()
3. Esperar 1 hora (o modificar fecha del sistema)
4. Intentar usar API con token expirado

Resultado Esperado:
❌ 401 Unauthorized - "Invalid or expired token"

Estado: [ ] PASS [ ] FAIL
Notas: Difícil de probar en local, verificar en logs de prod
```

---

## 🧪 Test Suite 5: Edge Cases

### Test 5.1: Usuario degradado de admin a cliente
```
Pasos:
1. Login como admin
2. Abrir /admin (funciona)
3. En otra ventana, cambiar Firestore: isAdmin = false
4. Refrescar página /admin

Resultado Esperado:
✅ Redirige a "/" (protección de useUserAuth detecta cambio)

Estado: [ ] PASS [ ] FAIL
```

### Test 5.2: Usuario bloqueado intenta acceder
```
Pasos:
1. Login como usuario normal
2. Admin bloquea al usuario (blocked: true)
3. Usuario intenta navegar

Resultado Esperado:
✅ Se desloguea automáticamente
✅ Mensaje: "Tu cuenta ha sido bloqueada"

Estado: [ ] PASS [ ] FAIL
```

### Test 5.3: Manipulación de localStorage
```
Pasos:
1. Login como cliente
2. En DevTools Console:
   localStorage.setItem('isAdmin', 'true')
3. Intentar acceder a /admin

Resultado Esperado:
✅ Redirige a "/" (verificación server-side, no confía en localStorage)

Estado: [ ] PASS [ ] FAIL
```

### Test 5.4: XSS en nombre de producto
```
Pasos:
1. Como admin, crear producto con nombre:
   <script>alert('XSS')</script>
2. Ver producto en frontend

Resultado Esperado:
✅ Script NO se ejecuta
✅ Se muestra como texto plano (React escapa HTML)

Estado: [ ] PASS [ ] FAIL
```

---

## 📊 Resumen de Resultados

| Suite | Total | Pasados | Fallidos | % Éxito |
|-------|-------|---------|----------|---------|
| Protección Páginas | 6 | ___ | ___ | ___% |
| Protección APIs | 4 | ___ | ___ | ___% |
| Firestore Rules | 6 | ___ | ___ | ___% |
| Integración | 3 | ___ | ___ | ___% |
| Edge Cases | 4 | ___ | ___ | ___% |
| **TOTAL** | **23** | ___ | ___ | ___% |

---

## 🚨 Problemas Encontrados

### Problema #1
**Descripción:** _______________________
**Severidad:** [ ] Crítica [ ] Alta [ ] Media [ ] Baja
**Solución:** _______________________

### Problema #2
**Descripción:** _______________________
**Severidad:** [ ] Crítica [ ] Alta [ ] Media [ ] Baja
**Solución:** _______________________

---

## ✅ Checklist Final

Antes de dar por cerrada la auditoría:

- [ ] Todos los tests de Suite 1 pasan
- [ ] Todos los tests de Suite 2 pasan
- [ ] Todos los tests de Suite 3 pasan
- [ ] Variables de Firebase Admin en Vercel configuradas
- [ ] Build de producción exitoso
- [ ] No hay errores en consola de navegador
- [ ] No hay warnings de seguridad en Firebase Console
- [ ] Documentación actualizada (SECURITY.md)
- [ ] Commit de cambios con mensaje descriptivo

---

## 📝 Notas Adicionales

**Fecha de pruebas:** _______________
**Testeador:** _______________
**Versión probada:** _______________
**Ambiente:** [ ] Local [ ] Staging [ ] Production

**Observaciones:**
_______________________
_______________________
_______________________

---

## 🔧 Comandos Útiles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ver logs de Firebase en tiempo real
firebase deploy --only firestore:rules
firebase firestore:rules:get

# Verificar usuarios en Firestore
# (Ejecutar en Firebase Console > Firestore > Query)

# Obtener token de usuario actual (DevTools Console)
await firebase.auth().currentUser.getIdToken()

# Verificar rol de usuario
const user = await firebase.firestore().collection('users').doc('USER_ID').get()
console.log(user.data())
```

---

**🔐 Documento confidencial - No compartir públicamente**
