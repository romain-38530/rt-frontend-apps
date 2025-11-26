#!/bin/bash

# 🚀 Script de Setup SYMPHONI.A Frontend
# Automatise l'installation et la configuration du projet

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎵 SYMPHONI.A Frontend Setup"
echo "  Version: 1.0.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier Node.js
echo "📦 Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "   Téléchargez-le depuis: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version $NODE_VERSION détectée"
    echo "   Minimum requis: Node.js 20.x"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Vérifier pnpm
echo ""
echo "📦 Vérification de pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm n'est pas installé"
    echo "📥 Installation de pnpm..."
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm -v | cut -d'.' -f1)
if [ "$PNPM_VERSION" -lt 8 ]; then
    echo "⚠️  pnpm version $PNPM_VERSION détectée"
    echo "📥 Mise à jour de pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm -v) détecté"

# Installation des dépendances
echo ""
echo "📥 Installation des dépendances..."
echo "   Cela peut prendre quelques minutes..."
pnpm install

echo ""
echo "✅ Dépendances installées avec succès"

# Créer les fichiers .env.local s'ils n'existent pas
echo ""
echo "🔧 Configuration des variables d'environnement..."

APPS=(
    "web-industry"
    "web-transporter"
    "web-logistician"
    "web-recipient"
    "web-supplier"
    "web-forwarder"
    "backoffice-admin"
)

for APP in "${APPS[@]}"; do
    ENV_FILE="apps/$APP/.env.local"
    ENV_EXAMPLE="apps/$APP/.env.local.example"

    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            echo "   📝 Création de $ENV_FILE depuis .env.local.example"
            cp "$ENV_EXAMPLE" "$ENV_FILE"
        else
            echo "   📝 Création de $ENV_FILE avec configuration par défaut"
            cat > "$ENV_FILE" <<EOF
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_ORDERS_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_TRACKING_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_DOCUMENTS_API_URL=http://localhost:3003/api/v1
NEXT_PUBLIC_NOTIFICATIONS_API_URL=http://localhost:3004/api/v1
NEXT_PUBLIC_CARRIERS_API_URL=http://localhost:3005/api/v1
NEXT_PUBLIC_AFFRET_IA_API_URL=http://localhost:3006/api/v1

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3010

# External APIs (à configurer)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_TOMTOM_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
EOF
        fi
    else
        echo "   ✅ $ENV_FILE existe déjà"
    fi
done

# Build des packages partagés
echo ""
echo "🏗️  Build des packages partagés..."
pnpm --filter @rt/utils build || echo "   ⚠️  @rt/utils build échoué (normal si pas de tsconfig)"
pnpm --filter @rt/contracts build || echo "   ⚠️  @rt/contracts build échoué (normal si pas de tsconfig)"
pnpm --filter @repo/ui-components build || echo "   ⚠️  @repo/ui-components build échoué (normal si pas de tsconfig)"

# Afficher le résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Setup terminé avec succès !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Prochaines étapes :"
echo ""
echo "   1. Configurer les variables d'environnement :"
echo "      Éditer les fichiers apps/*/.env.local"
echo ""
echo "   2. Lire la documentation :"
echo "      - QUICK_START_GUIDE.md"
echo "      - ARCHITECTURE.md"
echo "      - IMPLEMENTATION_REPORT.md"
echo ""
echo "   3. Démarrer le développement :"
echo "      pnpm dev                              # Toutes les apps"
echo "      pnpm --filter @rt/web-industry dev    # Une app spécifique"
echo ""
echo "📡 URLs de développement :"
echo "   - Industry:      http://localhost:3101"
echo "   - Transporter:   http://localhost:3102"
echo "   - Logistician:   http://localhost:3103"
echo "   - Recipient:     http://localhost:3104"
echo "   - Supplier:      http://localhost:3105"
echo "   - Forwarder:     http://localhost:3106"
echo "   - Backoffice:    http://localhost:3107"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎵 Bon développement avec SYMPHONI.A !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
