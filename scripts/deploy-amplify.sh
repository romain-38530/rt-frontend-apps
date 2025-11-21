#!/bin/bash

# =============================================================================
# Script de Déploiement Automatisé AWS Amplify
# =============================================================================
# Ce script automatise le déploiement des applications frontend sur AWS Amplify
# Usage: ./scripts/deploy-amplify.sh [app-name]
# =============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="eu-west-3"
GITHUB_REPO="julienSpitaleri/rt-frontend-apps"
BRANCH="main"

# =============================================================================
# Fonctions Utilitaires
# =============================================================================

print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# =============================================================================
# Vérification des Prérequis
# =============================================================================

check_prerequisites() {
    print_header "Vérification des Prérequis"

    # Vérifier AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI n'est pas installé"
        print_info "Installez-le depuis: https://aws.amazon.com/cli/"
        exit 1
    fi
    print_success "AWS CLI installé"

    # Vérifier la configuration AWS
    if ! aws sts get-caller-identity --region $REGION &> /dev/null; then
        print_error "AWS CLI n'est pas configuré correctement"
        print_info "Exécutez: aws configure"
        exit 1
    fi
    print_success "AWS CLI configuré"

    # Vérifier Git
    if ! command -v git &> /dev/null; then
        print_error "Git n'est pas installé"
        exit 1
    fi
    print_success "Git installé"

    # Vérifier jq (pour parser JSON)
    if ! command -v jq &> /dev/null; then
        print_warning "jq n'est pas installé (optionnel mais recommandé)"
        print_info "Installez-le: https://stedolan.github.io/jq/"
    else
        print_success "jq installé"
    fi

    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
        print_error "Exécutez ce script depuis la racine du projet rt-frontend-apps"
        exit 1
    fi
    print_success "Répertoire correct"
}

# =============================================================================
# Configuration des Applications
# =============================================================================

declare -A APP_CONFIGS

APP_CONFIGS["backoffice-admin"]="backoffice.rt-technologie.com|apps/backoffice-admin"
APP_CONFIGS["marketing-site"]="www.rt-technologie.com|apps/marketing-site"
APP_CONFIGS["web-industry"]="industry.rt-technologie.com|apps/web-industry"
APP_CONFIGS["web-transporter"]="transporter.rt-technologie.com|apps/web-transporter"
APP_CONFIGS["web-recipient"]="recipient.rt-technologie.com|apps/web-recipient"
APP_CONFIGS["web-supplier"]="supplier.rt-technologie.com|apps/web-supplier"
APP_CONFIGS["web-forwarder"]="forwarder.rt-technologie.com|apps/web-forwarder"
APP_CONFIGS["web-logistician"]="logistician.rt-technologie.com|apps/web-logistician"

# =============================================================================
# Fonction: Créer une Application Amplify
# =============================================================================

create_amplify_app() {
    local APP_NAME=$1
    local APP_ROOT=$2
    local DOMAIN=$3

    print_header "Création de l'App Amplify: ${APP_NAME}"

    # Vérifier si l'app existe déjà
    print_info "Vérification de l'existence de l'app..."
    EXISTING_APP=$(aws amplify list-apps --region $REGION --query "apps[?name=='${APP_NAME}'].appId" --output text 2>/dev/null || echo "")

    if [ -n "$EXISTING_APP" ]; then
        print_warning "L'app ${APP_NAME} existe déjà (ID: ${EXISTING_APP})"
        APP_ID=$EXISTING_APP
    else
        print_info "Création de la nouvelle app..."

        # Créer l'app
        APP_ID=$(aws amplify create-app \
            --name "${APP_NAME}" \
            --repository "https://github.com/${GITHUB_REPO}" \
            --platform WEB \
            --region $REGION \
            --query 'app.appId' \
            --output text)

        if [ -z "$APP_ID" ]; then
            print_error "Échec de la création de l'app ${APP_NAME}"
            return 1
        fi

        print_success "App créée avec succès (ID: ${APP_ID})"
    fi

    # Configurer la branche
    print_info "Configuration de la branche ${BRANCH}..."

    # Vérifier si la branche existe
    EXISTING_BRANCH=$(aws amplify list-branches \
        --app-id $APP_ID \
        --region $REGION \
        --query "branches[?branchName=='${BRANCH}'].branchName" \
        --output text 2>/dev/null || echo "")

    if [ -n "$EXISTING_BRANCH" ]; then
        print_warning "La branche ${BRANCH} existe déjà"
    else
        aws amplify create-branch \
            --app-id $APP_ID \
            --branch-name $BRANCH \
            --region $REGION \
            --enable-auto-build \
            > /dev/null

        print_success "Branche ${BRANCH} configurée"
    fi

    # Configurer les variables d'environnement
    print_info "Configuration des variables d'environnement..."
    configure_env_vars $APP_ID $APP_NAME

    # Configurer le build
    print_info "Configuration du build..."

    # Lire le fichier amplify.yml
    BUILD_SPEC=$(cat "${APP_ROOT}/amplify.yml" 2>/dev/null || cat "amplify.yml" 2>/dev/null || echo "")

    if [ -n "$BUILD_SPEC" ]; then
        aws amplify update-app \
            --app-id $APP_ID \
            --region $REGION \
            --build-spec "$BUILD_SPEC" \
            > /dev/null
        print_success "Configuration de build appliquée"
    fi

    # Démarrer le build
    print_info "Démarrage du build..."
    JOB_ID=$(aws amplify start-job \
        --app-id $APP_ID \
        --branch-name $BRANCH \
        --job-type RELEASE \
        --region $REGION \
        --query 'jobSummary.jobId' \
        --output text)

    print_success "Build démarré (Job ID: ${JOB_ID})"

    # Afficher l'URL de l'app
    APP_URL="https://${BRANCH}.${APP_ID}.amplifyapp.com"
    print_success "URL de l'app: ${APP_URL}"

    # Sauvegarder l'ID de l'app pour configuration ultérieure
    echo "${APP_NAME}|${APP_ID}|${APP_URL}|${DOMAIN}" >> .amplify-apps.txt

    print_success "Déploiement de ${APP_NAME} lancé avec succès!"
}

# =============================================================================
# Fonction: Configurer les Variables d'Environnement
# =============================================================================

configure_env_vars() {
    local APP_ID=$1
    local APP_NAME=$2

    # Charger les variables depuis le fichier de configuration
    if [ ! -f "scripts/amplify-env-vars.json" ]; then
        print_warning "Fichier amplify-env-vars.json non trouvé"
        print_info "Utilisation des valeurs par défaut"
        return
    fi

    # Variables communes à toutes les apps
    declare -A ENV_VARS=(
        ["NEXT_PUBLIC_API_URL"]="https://api.rt-technologie.com/api/v1"
        ["NEXT_PUBLIC_SUPPORT_URL"]="https://www.rt-technologie.com/support"
    )

    # Variables spécifiques pour backoffice-admin
    if [ "$APP_NAME" == "backoffice-admin" ]; then
        ENV_VARS["NEXT_PUBLIC_AUTHZ_URL"]="https://api.rt-technologie.com/api/v1/auth"
        ENV_VARS["NEXT_PUBLIC_PALETTE_API_URL"]="https://api.rt-technologie.com/api/v1/palettes"
        ENV_VARS["NEXT_PUBLIC_STORAGE_MARKET_API_URL"]="https://api.rt-technologie.com/api/v1/storage"
        ENV_VARS["NEXT_PUBLIC_PLANNING_API"]="https://api.rt-technologie.com/api/v1/planning"
        ENV_VARS["NEXT_PUBLIC_ECMR_API"]="https://api.rt-technologie.com/api/v1/ecmr"
        ENV_VARS["NEXT_PUBLIC_CHATBOT_API_URL"]="https://api.rt-technologie.com/api/v1/chatbot"
    fi

    # Demander le GITHUB_TOKEN si nécessaire
    if [ -z "$GITHUB_TOKEN" ]; then
        print_warning "GITHUB_TOKEN non défini"
        print_info "Définissez-le avec: export GITHUB_TOKEN=your_token"
    else
        ENV_VARS["GITHUB_TOKEN"]="$GITHUB_TOKEN"
    fi

    # Appliquer les variables
    for key in "${!ENV_VARS[@]}"; do
        aws amplify update-app \
            --app-id $APP_ID \
            --region $REGION \
            --environment-variables "${key}=${ENV_VARS[$key]}" \
            > /dev/null 2>&1 || true
    done

    print_success "Variables d'environnement configurées"
}

# =============================================================================
# Fonction: Configurer un Domaine Personnalisé
# =============================================================================

configure_custom_domain() {
    local APP_ID=$1
    local DOMAIN=$2

    print_header "Configuration du Domaine: ${DOMAIN}"

    # Vérifier si le domaine est déjà configuré
    EXISTING_DOMAIN=$(aws amplify list-domain-associations \
        --app-id $APP_ID \
        --region $REGION \
        --query "domainAssociations[?domainName=='${DOMAIN}'].domainName" \
        --output text 2>/dev/null || echo "")

    if [ -n "$EXISTING_DOMAIN" ]; then
        print_warning "Le domaine ${DOMAIN} est déjà configuré"
        return
    fi

    print_info "Configuration du domaine ${DOMAIN}..."

    aws amplify create-domain-association \
        --app-id $APP_ID \
        --domain-name $DOMAIN \
        --region $REGION \
        --sub-domain-settings "prefix=,branchName=${BRANCH}" \
        > /dev/null

    print_success "Domaine ${DOMAIN} configuré"
    print_info "N'oubliez pas de configurer les enregistrements DNS!"
}

# =============================================================================
# Fonction: Afficher le Statut d'un Build
# =============================================================================

watch_build() {
    local APP_ID=$1
    local JOB_ID=$2

    print_info "Surveillance du build..."

    while true; do
        STATUS=$(aws amplify get-job \
            --app-id $APP_ID \
            --branch-name $BRANCH \
            --job-id $JOB_ID \
            --region $REGION \
            --query 'job.summary.status' \
            --output text)

        case $STATUS in
            "SUCCEED")
                print_success "Build réussi!"
                break
                ;;
            "FAILED")
                print_error "Build échoué!"
                return 1
                ;;
            "CANCELLED")
                print_warning "Build annulé"
                return 1
                ;;
            *)
                echo -ne "\r${YELLOW}⏳ Build en cours... (Status: ${STATUS})${NC}"
                sleep 10
                ;;
        esac
    done
}

# =============================================================================
# Fonction: Déployer Toutes les Apps
# =============================================================================

deploy_all_apps() {
    print_header "Déploiement de Toutes les Applications"

    # Supprimer l'ancien fichier de tracking
    rm -f .amplify-apps.txt

    for APP_NAME in "${!APP_CONFIGS[@]}"; do
        IFS='|' read -r DOMAIN APP_ROOT <<< "${APP_CONFIGS[$APP_NAME]}"

        # Vérifier si le répertoire de l'app existe
        if [ ! -d "$APP_ROOT" ]; then
            print_warning "Répertoire $APP_ROOT non trouvé, skip ${APP_NAME}"
            continue
        fi

        create_amplify_app "$APP_NAME" "$APP_ROOT" "$DOMAIN"
        echo ""
    done

    print_success "Tous les déploiements ont été lancés!"
}

# =============================================================================
# Fonction: Déployer une App Spécifique
# =============================================================================

deploy_single_app() {
    local APP_NAME=$1

    if [ -z "${APP_CONFIGS[$APP_NAME]}" ]; then
        print_error "Application inconnue: ${APP_NAME}"
        print_info "Applications disponibles:"
        for name in "${!APP_CONFIGS[@]}"; do
            echo "  - $name"
        done
        exit 1
    fi

    IFS='|' read -r DOMAIN APP_ROOT <<< "${APP_CONFIGS[$APP_NAME]}"

    if [ ! -d "$APP_ROOT" ]; then
        print_error "Répertoire $APP_ROOT non trouvé"
        exit 1
    fi

    create_amplify_app "$APP_NAME" "$APP_ROOT" "$DOMAIN"
}

# =============================================================================
# Fonction: Configurer les Domaines pour les Apps Déployées
# =============================================================================

configure_all_domains() {
    print_header "Configuration des Domaines Personnalisés"

    if [ ! -f ".amplify-apps.txt" ]; then
        print_error "Aucune app déployée trouvée"
        print_info "Exécutez d'abord: ./scripts/deploy-amplify.sh all"
        exit 1
    fi

    while IFS='|' read -r APP_NAME APP_ID APP_URL DOMAIN; do
        configure_custom_domain "$APP_ID" "$DOMAIN"
    done < .amplify-apps.txt

    print_success "Configuration des domaines terminée"
}

# =============================================================================
# Fonction: Afficher le Statut de Toutes les Apps
# =============================================================================

show_status() {
    print_header "Statut des Applications Déployées"

    if [ ! -f ".amplify-apps.txt" ]; then
        print_warning "Aucune app déployée trouvée"
        return
    fi

    printf "%-20s %-15s %-50s %s\n" "APP" "APP_ID" "URL" "DOMAIN"
    echo "────────────────────────────────────────────────────────────────────────────────────────────────────────"

    while IFS='|' read -r APP_NAME APP_ID APP_URL DOMAIN; do
        printf "%-20s %-15s %-50s %s\n" "$APP_NAME" "$APP_ID" "$APP_URL" "$DOMAIN"
    done < .amplify-apps.txt
}

# =============================================================================
# Menu Principal
# =============================================================================

show_usage() {
    echo ""
    echo "Usage: $0 [command] [app-name]"
    echo ""
    echo "Commands:"
    echo "  all              Déployer toutes les applications"
    echo "  [app-name]       Déployer une application spécifique"
    echo "  domains          Configurer les domaines personnalisés"
    echo "  status           Afficher le statut des apps déployées"
    echo "  help             Afficher cette aide"
    echo ""
    echo "Applications disponibles:"
    for name in "${!APP_CONFIGS[@]}"; do
        echo "  - $name"
    done
    echo ""
}

# =============================================================================
# Point d'Entrée Principal
# =============================================================================

main() {
    print_header "AWS Amplify - Déploiement Automatisé"

    check_prerequisites

    case "${1:-help}" in
        all)
            deploy_all_apps
            ;;
        domains)
            configure_all_domains
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            deploy_single_app "$1"
            ;;
    esac

    echo ""
    print_success "Script terminé avec succès!"
    echo ""
}

# Exécuter le script
main "$@"
