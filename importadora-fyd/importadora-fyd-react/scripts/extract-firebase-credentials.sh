#!/bin/bash

# Script para extraer credenciales de Firebase Admin
# Uso: ./scripts/extract-firebase-credentials.sh path/to/firebase-admin-sdk.json

if [ -z "$1" ]; then
  echo "❌ Error: Debes proporcionar la ruta al archivo JSON de Firebase Admin"
  echo ""
  echo "Uso:"
  echo "  ./scripts/extract-firebase-credentials.sh ~/Downloads/importadora-fyd-firebase-adminsdk-xxxxx.json"
  echo ""
  exit 1
fi

FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "❌ Error: El archivo no existe: $FILE"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 CREDENCIALES DE FIREBASE ADMIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extraer client_email
CLIENT_EMAIL=$(grep -o '"client_email"[^,]*' "$FILE" | sed 's/"client_email": *"\(.*\)"/\1/')

# Extraer private_key (más complejo porque tiene saltos de línea)
PRIVATE_KEY=$(grep -o '"private_key"[^}]*' "$FILE" | sed 's/"private_key": *"\(.*\)"/\1/' | head -1)

echo "📧 FIREBASE_CLIENT_EMAIL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$CLIENT_EMAIL"
echo ""
echo ""

echo "🔑 FIREBASE_PRIVATE_KEY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$PRIVATE_KEY"
echo ""
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPIAR ESTOS VALORES EN VERCEL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ve a: https://vercel.com/dashboard"
echo "2. Selecciona: importadora-fyd-react"
echo "3. Settings → Environment Variables"
echo "4. Add New:"
echo ""
echo "   Name:  FIREBASE_CLIENT_EMAIL"
echo "   Value: (copia el valor de arriba)"
echo ""
echo "   Name:  FIREBASE_PRIVATE_KEY"
echo "   Value: (copia el valor de arriba)"
echo ""
echo "5. Selecciona: Production, Preview, Development"
echo "6. Save"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
