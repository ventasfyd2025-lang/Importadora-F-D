#!/bin/bash

# Script para configurar variables de entorno en Vercel usando CLI
# Requiere: npm install -g vercel

echo "🚀 Configuración de Variables de Entorno en Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar si vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI no está instalado"
    echo ""
    echo "Instalando Vercel CLI..."
    npm install -g vercel
    echo ""
fi

# Verificar si el usuario está logueado
echo "🔐 Verificando sesión de Vercel..."
vercel whoami &> /dev/null

if [ $? -ne 0 ]; then
    echo "❌ No estás logueado en Vercel"
    echo ""
    echo "Por favor, ejecuta primero:"
    echo "  vercel login"
    echo ""
    exit 1
fi

echo "✅ Sesión activa en Vercel"
echo ""

# Buscar archivo de credenciales
echo "🔍 Buscando archivo de credenciales de Firebase..."
echo ""

FIREBASE_FILE=""

# Buscar en Downloads
if [ -d ~/Downloads ]; then
    FIREBASE_FILE=$(find ~/Downloads -name "*firebase*adminsdk*.json" -o -name "*importadora-fyd*.json" 2>/dev/null | head -1)
fi

# Buscar en Desktop si no se encontró
if [ -z "$FIREBASE_FILE" ] && [ -d ~/Desktop ]; then
    FIREBASE_FILE=$(find ~/Desktop -name "*firebase*adminsdk*.json" -o -name "*importadora-fyd*.json" 2>/dev/null | head -1)
fi

# Buscar en Documents si no se encontró
if [ -z "$FIREBASE_FILE" ] && [ -d ~/Documents ]; then
    FIREBASE_FILE=$(find ~/Documents -name "*firebase*adminsdk*.json" -o -name "*importadora-fyd*.json" 2>/dev/null | head -1)
fi

if [ -z "$FIREBASE_FILE" ]; then
    echo "❌ No se encontró el archivo de credenciales automáticamente"
    echo ""
    echo "Por favor, proporciona la ruta al archivo:"
    read -p "Ruta: " FIREBASE_FILE

    if [ ! -f "$FIREBASE_FILE" ]; then
        echo "❌ El archivo no existe: $FIREBASE_FILE"
        exit 1
    fi
fi

echo "✅ Archivo encontrado: $FIREBASE_FILE"
echo ""

# Extraer credenciales usando node (más confiable que grep)
echo "📄 Extrayendo credenciales..."

CLIENT_EMAIL=$(node -pe "JSON.parse(require('fs').readFileSync('$FIREBASE_FILE', 'utf8')).client_email")
PRIVATE_KEY=$(node -pe "JSON.parse(require('fs').readFileSync('$FIREBASE_FILE', 'utf8')).private_key")

if [ -z "$CLIENT_EMAIL" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error al extraer las credenciales del archivo JSON"
    exit 1
fi

echo "✅ Credenciales extraídas correctamente"
echo ""
echo "📧 Client Email: $CLIENT_EMAIL"
echo "🔑 Private Key: [REDACTED - primeros 50 chars]"
echo "   ${PRIVATE_KEY:0:50}..."
echo ""

# Confirmar
read -p "¿Deseas agregar estas variables a Vercel? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

echo ""
echo "🌐 Agregando variables a Vercel..."
echo ""

# Agregar FIREBASE_CLIENT_EMAIL
echo "Agregando FIREBASE_CLIENT_EMAIL..."
echo "$CLIENT_EMAIL" | vercel env add FIREBASE_CLIENT_EMAIL production
echo "$CLIENT_EMAIL" | vercel env add FIREBASE_CLIENT_EMAIL preview
echo "$CLIENT_EMAIL" | vercel env add FIREBASE_CLIENT_EMAIL development

echo ""
echo "Agregando FIREBASE_PRIVATE_KEY..."
echo "$PRIVATE_KEY" | vercel env add FIREBASE_PRIVATE_KEY production
echo "$PRIVATE_KEY" | vercel env add FIREBASE_PRIVATE_KEY preview
echo "$PRIVATE_KEY" | vercel env add FIREBASE_PRIVATE_KEY development

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VARIABLES AGREGADAS EXITOSAMENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 Ahora necesitas hacer redeploy:"
echo ""
echo "   vercel --prod"
echo ""
echo "O hacer push a tu repositorio de Git"
echo ""
