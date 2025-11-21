#!/bin/bash

# =============================================================================
# Script de Configuration Initiale pour le Déploiement AWS Amplify
# =============================================================================
# Ce script vous guide dans la configuration initiale
# Usage: ./scripts/setup.sh
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ ${1}${NC}"; }
print_success() { echo -e "${GREEN}✓ ${1}${NC}"; }
print_error() { echo -e "${RED}✗ ${1}${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ ${1}${NC}"; }
print_prompt() { echo -e "${CYAN}❯ ${1}${NC}"; }

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# =============================================================================
# Vérifications Initiales
# =============================================================================

print_header "Configuration Initiale - AWS Amplify Deployment"

echo "Bienvenue dans l'assistant de configuration pour le déploiement AWS Amplify!"
echo "Cet assistant va vérifier et configurer tous les prérequis nécessaires."
echo ""

# =============================================================================
# 1. Vérifier AWS CLI
# =============================================================================

print_header "Étape 1/5: Vérification AWS CLI"

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI n'est pas installé"
    echo ""
    echo "Installez AWS CLI depuis: https://aws.amazon.com/cli/"
    echo ""
    echo "Linux/Mac:"
    echo "  curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    echo "  unzip awscliv2.zip"
    echo "  sudo ./aws/install"
    echo ""
    echo "Windows:"
    echo "  Télécharger: https://awscli.amazonaws.com/AWSCLIV2.msi"
    echo ""
    exit 1
else
    AWS_VERSION=$(aws --version)
    print_success "AWS CLI installé: $AWS_VERSION"
fi

# Vérifier la configuration AWS
if ! aws sts get-caller-identity --region eu-central-1 &> /dev/null; then
    print_warning "AWS CLI n'est pas configuré"
    echo ""
    print_prompt "Voulez-vous configurer AWS CLI maintenant? (y/n)"
    read -r response

    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Entrez vos credentials AWS:"
        aws configure

        # Vérifier à nouveau
        if aws sts get-caller-identity --region eu-central-1 &> /dev/null; then
            print_success "AWS CLI configuré avec succès!"
        else
            print_error "La configuration AWS a échoué"
            exit 1
        fi
    else
        print_error "AWS CLI doit être configuré avant de continuer"
        echo "Exécutez: aws configure"
        exit 1
    fi
else
    AWS_ACCOUNT=$(aws sts get-caller-identity --region eu-central-1 --query 'Account' --output text)
    AWS_USER=$(aws sts get-caller-identity --region eu-central-1 --query 'Arn' --output text)
    print_success "AWS CLI configuré"
    print_info "Compte AWS: $AWS_ACCOUNT"
    print_info "Utilisateur: $AWS_USER"
fi

# =============================================================================
# 2. Vérifier Git
# =============================================================================

print_header "Étape 2/5: Vérification Git"

if ! command -v git &> /dev/null; then
    print_error "Git n'est pas installé"
    echo "Installez Git depuis: https://git-scm.com/"
    exit 1
else
    GIT_VERSION=$(git --version)
    print_success "Git installé: $GIT_VERSION"
fi

# Vérifier le repository
if [ ! -d ".git" ]; then
    print_error "Ce n'est pas un repository git"
    exit 1
fi

GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$GIT_REMOTE" ]; then
    print_success "Repository: $GIT_REMOTE"
else
    print_warning "Aucun remote configuré"
fi

# =============================================================================
# 3. Configurer GitHub Token
# =============================================================================

print_header "Étape 3/5: Configuration GitHub Token"

if [ -n "$GITHUB_TOKEN" ]; then
    print_success "GITHUB_TOKEN déjà défini"
    TOKEN_PREFIX=$(echo "$GITHUB_TOKEN" | cut -c1-7)
    print_info "Token: ${TOKEN_PREFIX}..."
else
    print_warning "GITHUB_TOKEN n'est pas défini"
    echo ""
    echo "Le GITHUB_TOKEN est nécessaire pour installer les packages privés:"
    echo "  - @rt/contracts"
    echo "  - @rt/utils"
    echo ""
    echo "Pour créer un token:"
    echo "  1. Allez sur: https://github.com/settings/tokens"
    echo "  2. Cliquez sur 'Generate new token' → 'Generate new token (classic)'"
    echo "  3. Cochez le scope: read:packages"
    echo "  4. Générez et copiez le token"
    echo ""
    print_prompt "Entrez votre GitHub Personal Access Token (ou 'skip' pour passer):"
    read -r token

    if [ "$token" = "skip" ] || [ -z "$token" ]; then
        print_warning "GITHUB_TOKEN non défini - vous devrez le définir plus tard"
        echo ""
        echo "Pour le définir:"
        echo "  export GITHUB_TOKEN='ghp_your_token_here'"
        echo ""
    else
        export GITHUB_TOKEN="$token"
        print_success "GITHUB_TOKEN défini!"
        echo ""
        print_info "Pour le rendre permanent, ajoutez à ~/.bashrc:"
        echo "  echo 'export GITHUB_TOKEN=\"$token\"' >> ~/.bashrc"
        echo ""
    fi
fi

# =============================================================================
# 4. Vérifier les Outils Optionnels
# =============================================================================

print_header "Étape 4/5: Vérification Outils Optionnels"

# jq
if command -v jq &> /dev/null; then
    print_success "jq installé (utile pour parser JSON)"
else
    print_warning "jq non installé (optionnel)"
    echo "  Installez avec: sudo apt install jq (Ubuntu) ou brew install jq (Mac)"
fi

# curl
if command -v curl &> /dev/null; then
    print_success "curl installé (utile pour tester les APIs)"
else
    print_warning "curl non installé (optionnel)"
fi

# =============================================================================
# 5. Préparer les Scripts
# =============================================================================

print_header "Étape 5/5: Préparation des Scripts"

# Rendre les scripts exécutables
if [ -f "scripts/deploy-amplify.sh" ]; then
    chmod +x scripts/deploy-amplify.sh
    print_success "deploy-amplify.sh configuré"
else
    print_warning "deploy-amplify.sh non trouvé"
fi

if [ -f "scripts/check-deployment.sh" ]; then
    chmod +x scripts/check-deployment.sh
    print_success "check-deployment.sh configuré"
else
    print_warning "check-deployment.sh non trouvé"
fi

# =============================================================================
# Résumé Final
# =============================================================================

print_header "Configuration Terminée!"

echo "✨ Tous les prérequis sont installés et configurés!"
echo ""
echo "Prochaines étapes:"
echo ""
echo "1️⃣  Définir le GITHUB_TOKEN (si pas encore fait):"
echo "   export GITHUB_TOKEN='ghp_your_token_here'"
echo ""
echo "2️⃣  Déployer toutes les applications:"
echo "   ./scripts/deploy-amplify.sh all"
echo ""
echo "   Ou déployer une seule app:"
echo "   ./scripts/deploy-amplify.sh backoffice-admin"
echo ""
echo "3️⃣  Vérifier le déploiement:"
echo "   ./scripts/check-deployment.sh all"
echo ""
echo "4️⃣  Configurer les domaines personnalisés:"
echo "   - Allez dans AWS Amplify Console"
echo "   - Domain Management → Add domain"
echo "   - Configurez les DNS (CNAME)"
echo ""
echo "📚 Documentation complète: scripts/README.md"
echo ""

# Créer un fichier de résumé
cat > .deployment-info.txt << EOF
=== Configuration de Déploiement ===
Date: $(date)
AWS Account: $AWS_ACCOUNT
AWS User: $AWS_USER
Git Remote: $GIT_REMOTE
GitHub Token: ${GITHUB_TOKEN:+Configuré}

Commandes utiles:
- Déployer tout: ./scripts/deploy-amplify.sh all
- Déployer une app: ./scripts/deploy-amplify.sh [app-name]
- Vérifier: ./scripts/check-deployment.sh all
- Health check: ./scripts/check-deployment.sh health

Applications disponibles:
- backoffice-admin
- marketing-site
- web-industry
- web-transporter
- web-recipient
- web-supplier
- web-forwarder
- web-logistician
EOF

print_success "Fichier de configuration sauvegardé: .deployment-info.txt"
echo ""
echo "🚀 Vous êtes prêt à déployer!"
echo ""
