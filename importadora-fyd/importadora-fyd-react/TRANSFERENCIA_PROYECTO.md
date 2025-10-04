# 🔄 Guía de Transferencia del Proyecto al Cliente

## 📋 Índice
1. [Preparación antes de transferir](#preparación)
2. [Transferencia de Firebase](#firebase)
3. [Transferencia de Vercel](#vercel)
4. [Transferencia del código (GitHub)](#github)
5. [Transferencia de MercadoPago](#mercadopago)
6. [Documentación para el cliente](#documentación)
7. [Checklist final](#checklist)

---

## 🎯 Preparación antes de transferir

### **Opción A: Transferir TODO (Recomendado)**

El cliente se hace dueño de:
- ✅ Proyecto de Firebase
- ✅ Proyecto de Vercel
- ✅ Repositorio de GitHub
- ✅ Cuenta de MercadoPago (ya debe tenerla)

### **Opción B: Mantener acceso compartido**

Tú y el cliente tienen acceso:
- ✅ Tú sigues como Owner/Admin
- ✅ Cliente agregado como Admin/Editor
- ✅ Útil si darás soporte continuo

### **Lo que NO se puede transferir:**
- ❌ Tu cuenta personal de Google/GitHub
- ✅ Pero SÍ se puede transferir la propiedad de los proyectos

---

## 🔥 1. Transferencia de Firebase

### **Paso 1: Agregar al cliente como Owner**

#### **1.1 Pedir email del cliente**
```
Necesitas que el cliente te dé:
- Su email de Google (Gmail o Google Workspace)
- Ejemplo: cliente@importadorafyd.cl
```

#### **1.2 Agregar al cliente en Firebase Console**

1. Ve a: https://console.firebase.google.com
2. Selecciona proyecto: **importadora-fyd**
3. Click en **⚙️ Settings** → **Users and permissions**
4. Click en **"Add member"** o **"Agregar miembro"**
5. Ingresa el email del cliente
6. Selecciona rol: **Owner** (Propietario)
7. Click en **"Add member"**

#### **1.3 El cliente recibirá un email**
```
Subject: You've been invited to join importadora-fyd

El cliente debe:
1. Abrir el email
2. Click en "Accept invitation"
3. Login con su cuenta de Google
4. Ya tendrá acceso como Owner
```

#### **1.4 Transferir facturación (si tiene Blaze Plan)**

Si el proyecto tiene plan de pago:

1. Firebase Console → **⚙️ Settings** → **Usage and billing**
2. Click en **"Change billing account"**
3. El cliente debe crear su propia billing account
4. Transferir a la billing account del cliente

#### **1.5 (Opcional) Removerte a ti mismo**

**⚠️ IMPORTANTE: Solo hazlo después de que el cliente confirme que tiene acceso**

1. Firebase Console → **⚙️ Settings** → **Users and permissions**
2. Encuentra tu email
3. Click en **"..."** → **"Remove member"**

---

## 🚀 2. Transferencia de Vercel

### **Paso 2: Transferir proyecto a cuenta del cliente**

#### **2.1 Cliente debe crear cuenta en Vercel**

```
El cliente debe:
1. Ir a: https://vercel.com/signup
2. Registrarse con su email o GitHub
3. Confirmar email
4. Anotar su username de Vercel
```

#### **2.2 Transferir el proyecto**

**Opción A: Transfer directo (Si cliente tiene cuenta Vercel)**

1. Ve a: https://vercel.com/dashboard
2. Selecciona proyecto: **importadora-fyd-react**
3. Click en **"Settings"**
4. Scroll hasta abajo: **"Transfer Project"**
5. Ingresa el username o email del cliente
6. Click en **"Transfer"**
7. Confirmar

**Opción B: Agregar como Team Member (Si darás soporte)**

1. Vercel Dashboard → Tu team o cuenta
2. Click en **"Settings"** → **"Members"**
3. Click en **"Invite Member"**
4. Ingresa email del cliente
5. Selecciona rol: **Owner** o **Admin**

#### **2.3 Cliente acepta transferencia**

```
El cliente recibirá un email:
"You have been invited to join a project on Vercel"

Debe:
1. Click en el link del email
2. Login en Vercel
3. Aceptar la invitación
```

#### **2.4 Verificar variables de entorno**

**⚠️ IMPORTANTE: Las variables de entorno NO se transfieren automáticamente**

El cliente deberá:
1. Configurar las variables de entorno en su cuenta de Vercel
2. Usa el documento `VERCEL_SETUP.md` que creé
3. O transfiere las variables manualmente

**Para ayudarle, puedes exportar las variables:**

```bash
cd /Users/juliosilvabobadilla/importadora-fyd/importadora-fyd-react

# Exportar variables (sin valores sensibles)
cat > .env.template <<EOF
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side)
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_CLIENT_ID=
MERCADOPAGO_CLIENT_SECRET=

# URLs
NEXT_PUBLIC_BASE_URL=
BASE_URL=
EOF

echo "✅ Template creado en .env.template"
```

---

## 💻 3. Transferencia del Código (GitHub)

### **Paso 3: Transferir repositorio**

#### **3.1 Cliente debe tener cuenta GitHub**

```
El cliente debe:
1. Crear cuenta en: https://github.com/signup
2. Anotar su username de GitHub
```

#### **3.2 Transferir el repositorio**

**Opción A: Transfer directo (Recomendado)**

1. Ve a: https://github.com/tu-usuario/importadora-fyd-react
2. Click en **"Settings"** (del repo)
3. Scroll abajo hasta **"Danger Zone"**
4. Click en **"Transfer repository"**
5. Ingresa el username del cliente
6. Confirma con el nombre del repo
7. El cliente recibirá un email para aceptar

**Opción B: Hacer fork al cliente (Alternativa)**

1. Cliente hace fork del repositorio
2. Tú das acceso colaborador
3. Cliente hace deploy desde su fork

**Opción C: Agregar como colaborador (Si darás soporte)**

1. GitHub repo → **"Settings"** → **"Collaborators"**
2. Click en **"Add people"**
3. Ingresa username o email del cliente
4. Selecciona: **Admin** o **Maintain**

#### **3.3 Actualizar Vercel para usar el nuevo repo**

Después de transferir el repo, el cliente debe:

1. Vercel Dashboard → Proyecto
2. **"Settings"** → **"Git"**
3. Re-conectar con el repositorio transferido

---

## 💳 4. Configuración de MercadoPago

### **Paso 4: Cliente debe usar sus propias credenciales**

**⚠️ MUY IMPORTANTE: El cliente DEBE usar su propia cuenta de MercadoPago**

#### **4.1 Cliente obtiene sus credenciales**

El cliente debe:
1. Crear/tener cuenta en: https://www.mercadopago.cl
2. Ir a: https://www.mercadopago.cl/developers/panel/app
3. Crear una aplicación
4. Copiar:
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

#### **4.2 Actualizar en Vercel**

1. Vercel → Settings → Environment Variables
2. Editar:
   - `MERCADOPAGO_ACCESS_TOKEN` → Nueva credencial del cliente
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` → Nueva credencial del cliente
3. Redeploy

#### **4.3 Configurar Webhook de MercadoPago**

El cliente debe:
1. MercadoPago Developer Panel → Su aplicación
2. Webhooks → Agregar endpoint:
   ```
   https://importadora-fyd-react.vercel.app/api/mercadopago/webhook
   ```
3. Seleccionar eventos:
   - ✅ payment
   - ✅ merchant_order

---

## 📚 5. Documentación para el Cliente

### **Paso 5: Crear paquete de documentación**

Crea un folder con toda la documentación:

```bash
cd /Users/juliosilvabobadilla/importadora-fyd

# Crear carpeta de entrega
mkdir -p cliente-entrega

# Copiar documentación
cp importadora-fyd-react/SECURITY.md cliente-entrega/
cp importadora-fyd-react/SECURITY_AUDIT.md cliente-entrega/
cp importadora-fyd-react/VERCEL_SETUP.md cliente-entrega/
cp importadora-fyd-react/README.md cliente-entrega/ 2>/dev/null || echo "# Importadora F&D" > cliente-entrega/README.md
```

#### **Crear documento de credenciales para el cliente:**

```bash
cat > cliente-entrega/CREDENCIALES_Y_ACCESOS.md <<'EOF'
# 🔐 Credenciales y Accesos - Importadora F&D

## ✅ Accesos que debes tener

### 1. Firebase
- **URL:** https://console.firebase.google.com
- **Proyecto:** importadora-fyd
- **Email:** [TU_EMAIL]
- **Rol:** Owner

### 2. Vercel
- **URL:** https://vercel.com/dashboard
- **Proyecto:** importadora-fyd-react
- **Email:** [TU_EMAIL]
- **Rol:** Owner

### 3. GitHub
- **URL:** https://github.com
- **Repositorio:** importadora-fyd-react
- **Username:** [TU_USERNAME]
- **Rol:** Owner

### 4. MercadoPago
- **URL:** https://www.mercadopago.cl/developers
- **Cuenta:** [TU_CUENTA]
- **Access Token:** [CONFIGURAR EN VERCEL]

## 📋 Primer Usuario Administrador

Para crear el primer usuario admin:

1. Ir a: https://importadora-fyd-react.vercel.app
2. Registrarse normalmente
3. Ir a Firebase Console → Firestore Database
4. Buscar tu usuario en la colección "users"
5. Editar el documento y agregar:
   ```
   isAdmin: true
   role: "admin"
   ```
6. Guardar
7. Refrescar la página
8. Ya puedes acceder a /admin

## 🔧 Variables de Entorno en Vercel

Estas variables DEBEN estar configuradas:

### Firebase (Public)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Admin (Private)
```
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### MercadoPago
```
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
```

## 🚀 Comandos Útiles

### Deploy a producción
```bash
git add .
git commit -m "Actualización"
git push origin main
```

### Ver logs en Vercel
1. Dashboard → Tu proyecto
2. Click en el último deployment
3. Ver "Function Logs" o "Build Logs"

### Backup de Firestore
1. Firebase Console → Firestore Database
2. Importación/Exportación
3. Exportar a Google Cloud Storage

## 📞 Contacto de Soporte

**Desarrollador:** [TU_NOMBRE]
**Email:** [TU_EMAIL]
**Teléfono:** [TU_TELEFONO]

## 📚 Documentos Importantes

- `SECURITY.md` - Guía de seguridad
- `VERCEL_SETUP.md` - Configuración de Vercel
- `README.md` - Documentación del proyecto
EOF
```

#### **Crear video o guía visual (Opcional pero recomendado)**

Graba un video corto mostrando:
- ✅ Cómo acceder a Firebase
- ✅ Cómo acceder a Vercel
- ✅ Cómo hacer deploy
- ✅ Cómo agregar productos
- ✅ Cómo gestionar pedidos

---

## 📦 6. Crear Usuario Admin para el Cliente

### **Paso 6: Configurar primer admin**

**Opción A: Crear usuario admin manualmente**

1. Firebase Console → Authentication
2. Click en "Add user"
3. Ingresar email y contraseña del cliente
4. Copiar el UID del usuario
5. Firebase Console → Firestore Database
6. Crear documento en colección "users":
   ```
   Documento ID: [UID del usuario]

   {
     uid: "[UID]",
     email: "cliente@importadorafyd.cl",
     firstName: "Admin",
     lastName: "Principal",
     role: "admin",
     isAdmin: true,
     createdAt: [timestamp actual]
   }
   ```

**Opción B: Cliente se registra y tú lo haces admin**

1. Cliente se registra normalmente en el sitio
2. Tú vas a Firestore → users → [su UID]
3. Editas y agregas:
   ```
   isAdmin: true
   role: "admin"
   ```

---

## ✅ 7. Checklist Final de Transferencia

### **Antes de entregar:**

```
□ Cliente tiene cuenta en Firebase
□ Cliente tiene cuenta en Vercel
□ Cliente tiene cuenta en GitHub
□ Cliente tiene cuenta en MercadoPago

□ Cliente agregado como Owner en Firebase
□ Cliente puede acceder a Firebase Console
□ Cliente puede ver/editar Firestore Database

□ Proyecto transferido/acceso dado en Vercel
□ Variables de entorno configuradas en Vercel del cliente
□ Cliente puede hacer deploy

□ Repositorio transferido/acceso dado en GitHub
□ Cliente puede hacer commits

□ Cliente configuró sus credenciales de MercadoPago
□ Webhook de MercadoPago apunta al sitio del cliente

□ Primer usuario admin creado para el cliente
□ Cliente puede acceder a /admin

□ Documentación entregada:
  □ SECURITY.md
  □ VERCEL_SETUP.md
  □ CREDENCIALES_Y_ACCESOS.md
  □ README.md

□ Video tutorial grabado (opcional)
□ Sesión de capacitación realizada

□ Backups creados:
  □ Backup de Firestore
  □ Backup de código (Git tag)
  □ Backup de variables de entorno

□ Cliente confirmó que todo funciona
□ (Opcional) Te removiste de los proyectos
```

---

## 🔒 8. Seguridad Post-Transferencia

### **Acciones de seguridad después de transferir:**

#### **Si te removiste completamente:**

1. **Revocar accesos a servicios:**
   - Eliminar tokens de MercadoPago si usaste los tuyos temporalmente
   - Revocar API keys si las usaste

2. **Limpiar tu máquina local:**
   ```bash
   # Hacer backup final
   cd /Users/juliosilvabobadilla/importadora-fyd
   tar -czf importadora-fyd-backup-$(date +%Y%m%d).tar.gz importadora-fyd-react/

   # Limpiar credenciales locales
   rm -f importadora-fyd-react/.env.local

   # (Opcional) Eliminar el proyecto local si ya no lo necesitas
   # rm -rf importadora-fyd-react/
   ```

#### **Si mantendrás acceso para soporte:**

1. **Crear cuenta de servicio separada:**
   - No usar tu cuenta personal
   - Crear una cuenta específica para soporte

2. **Documentar tu nivel de acceso:**
   - Qué puedes/no puedes hacer
   - Horarios de soporte
   - Procedimiento de escalación

---

## 🎓 9. Capacitación al Cliente

### **Temas a cubrir en sesión de capacitación:**

#### **Nivel Básico (Cliente no técnico):**
```
✅ Cómo agregar productos
✅ Cómo gestionar pedidos
✅ Cómo ver reportes
✅ Cómo cambiar banners
✅ Cómo gestionar usuarios
✅ Qué hacer si el sitio está caído
```

#### **Nivel Técnico (Si cliente tiene equipo IT):**
```
✅ Cómo hacer deploy
✅ Cómo ver logs
✅ Cómo configurar variables de entorno
✅ Cómo hacer backups
✅ Cómo restaurar desde backup
✅ Estructura del código
✅ Dónde encontrar documentación
```

---

## 📊 10. Plantilla de Email de Transferencia

```
Asunto: Transferencia de Proyecto - Importadora F&D

Hola [Nombre del Cliente],

Te confirmo que la transferencia del proyecto está lista. A continuación los detalles:

🔥 FIREBASE
- Proyecto: importadora-fyd
- URL: https://console.firebase.google.com
- Rol: Owner
- Ya deberías tener acceso con tu email: [email del cliente]

🚀 VERCEL (Hosting)
- Proyecto: importadora-fyd-react
- URL: https://vercel.com/dashboard
- Sitio web: https://importadora-fyd-react.vercel.app
- [Transferido / Acceso como Owner]

💻 GITHUB (Código)
- Repositorio: importadora-fyd-react
- [Transferido / Acceso como Admin]

📋 CREDENCIALES DE ADMIN
Usuario: [email del admin]
Contraseña: [enviada por separado / debes cambiarla]
URL Admin: https://importadora-fyd-react.vercel.app/admin

📚 DOCUMENTACIÓN
Adjunto carpeta con:
- Guía de seguridad
- Manual de configuración
- Credenciales y accesos
- [Otros documentos]

⚠️ TAREAS PENDIENTES PARA TI:
1. Configurar tus credenciales de MercadoPago en Vercel
2. Cambiar la contraseña del usuario admin
3. Revisar y confirmar que todo funciona
4. [Otras tareas específicas]

📞 SOPORTE
[Tu disponibilidad y términos de soporte]

Saludos,
[Tu nombre]
```

---

## 🆘 11. Troubleshooting Común

### **Problema: Cliente no recibe email de invitación**

**Solución:**
- Verificar carpeta de spam
- Usar el email correcto (Gmail o Google Workspace)
- Reenviar invitación

### **Problema: Variables de entorno no funcionan**

**Solución:**
- Verificar que están en Production, Preview, Development
- Hacer redeploy después de agregar variables
- Verificar que no tienen espacios al inicio/final

### **Problema: MercadoPago no procesa pagos**

**Solución:**
- Verificar que usó credenciales de PRODUCCIÓN (no test)
- Verificar webhook configurado correctamente
- Revisar logs de MercadoPago

---

## 📝 Notas Finales

- ✅ Haz la transferencia paso a paso, no todo a la vez
- ✅ Confirma cada paso con el cliente antes de continuar
- ✅ Haz backups antes de transferir
- ✅ Documenta TODO
- ✅ Mantén una copia del código por al menos 6 meses
- ✅ Considera un período de soporte post-entrega

**¿Preguntas? Revisa los documentos de seguridad o contacta soporte.**

---

**Última actualización:** 2025-10-03
