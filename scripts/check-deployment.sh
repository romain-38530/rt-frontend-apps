#!/bin/bash

# =============================================================================
# Script de Vérification du Déploiement AWS Amplify
# =============================================================================
# Vérifie l'état de santé et la configuration des apps déployées
# Usage: ./scripts/check-deployment.sh [app-name]
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGION="eu-central-1"

print_info() { echo -e "${BLUE}ℹ ${1}${NC}"; }
print_success() { echo -e "${GREEN}✓ ${1}${NC}"; }
print_error() { echo -e "${RED}✗ ${1}${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ ${1}${NC}"; }

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# =============================================================================
# Vérifier l'état d'une App
# =============================================================================

check_app_status() {
    local APP_NAME=$1

    print_header "Vérification: ${APP_NAME}"

    # Trouver l'App ID
    APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='${APP_NAME}'].appId" --output text 2>/dev/null || echo "")

    if [ -z "$APP_ID" ]; then
        print_error "App '${APP_NAME}' non trouvée"
        return 1
    fi

    print_success "App trouvée (ID: ${APP_ID})"

    # Récupérer les détails de l'app
    APP_DETAILS=$(aws amplify get-app --app-id $APP_ID --region $REGION 2>/dev/null)

    # URL par défaut
    DEFAULT_DOMAIN=$(echo "$APP_DETAILS" | grep -o '"defaultDomain": "[^"]*"' | cut -d'"' -f4)
    print_info "URL Amplify: https://main.${DEFAULT_DOMAIN}"

    # Statut de la branche main
    print_info "Vérification de la branche main..."
    BRANCH_STATUS=$(aws amplify get-branch \
        --app-id $APP_ID \
        --branch-name main \
        --region $REGION \
        --query 'branch.{activeJobId:activeJobId,status:status}' \
        --output json 2>/dev/null || echo "{}")

    # Dernier build
    print_info "Vérification du dernier build..."
    LAST_JOB=$(aws amplify list-jobs \
        --app-id $APP_ID \
        --branch-name main \
        --region $REGION \
        --max-results 1 \
        --query 'jobSummaries[0].{status:status,commitId:commitId,startTime:startTime}' \
        --output json 2>/dev/null || echo "{}")

    if [ "$LAST_JOB" != "{}" ]; then
        JOB_STATUS=$(echo "$LAST_JOB" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
        case $JOB_STATUS in
            "SUCCEED")
                print_success "Dernier build: RÉUSSI"
                ;;
            "FAILED")
                print_error "Dernier build: ÉCHOUÉ"
                ;;
            "RUNNING")
                print_info "Dernier build: EN COURS"
                ;;
            *)
                print_warning "Dernier build: ${JOB_STATUS}"
                ;;
        esac
    else
        print_warning "Aucun build trouvé"
    fi

    # Variables d'environnement
    print_info "Vérification des variables d'environnement..."
    ENV_VARS=$(aws amplify get-app --app-id $APP_ID --region $REGION --query 'app.environmentVariables' --output json 2>/dev/null || echo "{}")

    if [ "$ENV_VARS" != "{}" ] && [ "$ENV_VARS" != "null" ]; then
        print_success "Variables d'environnement configurées"
        echo "$ENV_VARS" | grep -o '"[^"]*": "[^"]*"' | while read -r line; do
            KEY=$(echo "$line" | cut -d'"' -f2)
            if [[ ! "$KEY" =~ SECRET|TOKEN|KEY ]]; then
                echo "  - $line"
            else
                echo "  - \"$KEY\": \"***\""
            fi
        done
    else
        print_warning "Aucune variable d'environnement configurée"
    fi

    # Domaines personnalisés
    print_info "Vérification des domaines personnalisés..."
    DOMAINS=$(aws amplify list-domain-associations \
        --app-id $APP_ID \
        --region $REGION \
        --query 'domainAssociations[*].domainName' \
        --output text 2>/dev/null || echo "")

    if [ -n "$DOMAINS" ]; then
        print_success "Domaines configurés:"
        for domain in $DOMAINS; do
            echo "  - https://${domain}"

            # Vérifier le statut du certificat SSL
            CERT_STATUS=$(aws amplify get-domain-association \
                --app-id $APP_ID \
                --domain-name $domain \
                --region $REGION \
                --query 'domainAssociation.certificateVerificationDNSRecord' \
                --output text 2>/dev/null || echo "")

            if [ -n "$CERT_STATUS" ] && [ "$CERT_STATUS" != "None" ]; then
                print_warning "  DNS non configuré pour $domain"
            else
                print_success "  DNS configuré"
            fi
        done
    else
        print_warning "Aucun domaine personnalisé configuré"
    fi

    # Test de connectivité
    print_info "Test de connectivité..."
    APP_URL="https://main.${DEFAULT_DOMAIN}"

    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" --max-time 10 2>/dev/null || echo "000")

    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "App accessible (HTTP ${HTTP_STATUS})"
    elif [ "$HTTP_STATUS" = "000" ]; then
        print_warning "Impossible de joindre l'app (timeout)"
    else
        print_error "App non accessible (HTTP ${HTTP_STATUS})"
    fi

    echo ""
}

# =============================================================================
# Vérifier Toutes les Apps
# =============================================================================

check_all_apps() {
    print_header "Vérification de Toutes les Applications"

    # Liste des apps attendues
    EXPECTED_APPS=(
        "backoffice-admin"
        "marketing-site"
        "web-industry"
        "web-transporter"
        "web-recipient"
        "web-supplier"
        "web-forwarder"
        "web-logistician"
    )

    for app in "${EXPECTED_APPS[@]}"; do
        check_app_status "$app" || true
        echo ""
    done

    # Résumé
    print_header "Résumé"

    ALL_APPS=$(aws amplify list-apps --region $REGION --query 'apps[*].name' --output text 2>/dev/null || echo "")
    APP_COUNT=$(echo "$ALL_APPS" | wc -w)

    print_info "Total d'apps déployées: ${APP_COUNT}"

    if [ $APP_COUNT -eq ${#EXPECTED_APPS[@]} ]; then
        print_success "Toutes les apps sont déployées!"
    else
        print_warning "Il manque $((${#EXPECTED_APPS[@]} - APP_COUNT)) app(s)"
    fi
}

# =============================================================================
# Vérifier les Logs
# =============================================================================

check_logs() {
    local APP_NAME=$1

    print_header "Logs récents: ${APP_NAME}"

    APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='${APP_NAME}'].appId" --output text 2>/dev/null || echo "")

    if [ -z "$APP_ID" ]; then
        print_error "App '${APP_NAME}' non trouvée"
        return 1
    fi

    # Récupérer le dernier job
    LAST_JOB_ID=$(aws amplify list-jobs \
        --app-id $APP_ID \
        --branch-name main \
        --region $REGION \
        --max-results 1 \
        --query 'jobSummaries[0].jobId' \
        --output text 2>/dev/null || echo "")

    if [ -z "$LAST_JOB_ID" ] || [ "$LAST_JOB_ID" = "None" ]; then
        print_warning "Aucun job trouvé"
        return 0
    fi

    print_info "Récupération des logs du job ${LAST_JOB_ID}..."

    # Note: Les logs détaillés ne sont pas directement accessibles via CLI
    # Il faut aller dans la console AWS Amplify
    print_info "Pour voir les logs détaillés:"
    print_info "→ https://console.aws.amazon.com/amplify/home?region=${REGION}#/${APP_ID}/YnJhbmNoZXMvbWFpbg==/jobs/${LAST_JOB_ID}"
}

# =============================================================================
# Test de Santé Complet
# =============================================================================

health_check() {
    print_header "Health Check Complet"

    # Vérifier AWS CLI
    if ! aws sts get-caller-identity --region $REGION &> /dev/null; then
        print_error "AWS CLI non configuré"
        return 1
    fi
    print_success "AWS CLI: OK"

    # Vérifier curl
    if ! command -v curl &> /dev/null; then
        print_warning "curl non installé (tests de connectivité désactivés)"
    else
        print_success "curl: OK"
    fi

    # Vérifier l'API Backend
    print_info "Test de l'API Backend..."
    API_URL="https://api.rt-technologie.com/api/v1/health"

    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" --max-time 10 2>/dev/null || echo "000")

    if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "404" ]; then
        print_success "API Backend accessible"
    else
        print_error "API Backend non accessible (HTTP ${API_STATUS})"
    fi

    # Vérifier les apps
    check_all_apps
}

# =============================================================================
# Menu Principal
# =============================================================================

show_usage() {
    echo ""
    echo "Usage: $0 [command] [app-name]"
    echo ""
    echo "Commands:"
    echo "  all              Vérifier toutes les applications"
    echo "  [app-name]       Vérifier une application spécifique"
    echo "  logs [app-name]  Afficher les logs d'une application"
    echo "  health           Health check complet"
    echo "  help             Afficher cette aide"
    echo ""
}

main() {
    case "${1:-help}" in
        all)
            check_all_apps
            ;;
        logs)
            if [ -z "$2" ]; then
                print_error "Spécifiez le nom de l'app"
                show_usage
                exit 1
            fi
            check_logs "$2"
            ;;
        health)
            health_check
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            check_app_status "$1"
            ;;
    esac
}

main "$@"
