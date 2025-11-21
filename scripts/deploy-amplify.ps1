# =============================================================================
# Script de Déploiement Automatisé AWS Amplify (PowerShell)
# =============================================================================
# Ce script automatise le déploiement des applications frontend sur AWS Amplify
# Usage: .\scripts\deploy-amplify.ps1 [app-name]
# =============================================================================

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$AppName = ""
)

$ErrorActionPreference = "Stop"

# Configuration
$REGION = "eu-central-1"
$GITHUB_REPO = "romain-38530/rt-frontend-apps"
$BRANCH = "main"

# Couleurs pour la console
function Print-Info { Write-Host "ℹ $args" -ForegroundColor Blue }
function Print-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Print-Error { Write-Host "✗ $args" -ForegroundColor Red }
function Print-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }

function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host ""
}

# =============================================================================
# Configuration des Applications
# =============================================================================

$APP_CONFIGS = @{
    "backoffice-admin" = @{
        domain = "backoffice.rt-technologie.com"
        appRoot = "apps/backoffice-admin"
    }
    "marketing-site" = @{
        domain = "www.rt-technologie.com"
        appRoot = "apps/marketing-site"
    }
    "web-industry" = @{
        domain = "industry.rt-technologie.com"
        appRoot = "apps/web-industry"
    }
    "web-transporter" = @{
        domain = "transporter.rt-technologie.com"
        appRoot = "apps/web-transporter"
    }
    "web-recipient" = @{
        domain = "recipient.rt-technologie.com"
        appRoot = "apps/web-recipient"
    }
    "web-supplier" = @{
        domain = "supplier.rt-technologie.com"
        appRoot = "apps/web-supplier"
    }
    "web-forwarder" = @{
        domain = "forwarder.rt-technologie.com"
        appRoot = "apps/web-forwarder"
    }
    "web-logistician" = @{
        domain = "logistician.rt-technologie.com"
        appRoot = "apps/web-logistician"
    }
}

# =============================================================================
# Vérification des Prérequis
# =============================================================================

function Check-Prerequisites {
    Print-Header "Vérification des Prérequis"

    # Vérifier AWS CLI
    try {
        $awsVersion = aws --version
        Print-Success "AWS CLI installé: $awsVersion"
    }
    catch {
        Print-Error "AWS CLI n'est pas installé"
        Print-Info "Installez-le depuis: https://aws.amazon.com/cli/"
        exit 1
    }

    # Vérifier la configuration AWS
    try {
        aws sts get-caller-identity --region $REGION --output json | Out-Null
        Print-Success "AWS CLI configuré"
    }
    catch {
        Print-Error "AWS CLI n'est pas configuré correctement"
        Print-Info "Exécutez: aws configure"
        exit 1
    }

    # Vérifier Git
    try {
        $gitVersion = git --version
        Print-Success "Git installé: $gitVersion"
    }
    catch {
        Print-Error "Git n'est pas installé"
        exit 1
    }

    # Vérifier le répertoire
    if (-not (Test-Path "package.json") -or -not (Test-Path "apps")) {
        Print-Error "Exécutez ce script depuis la racine du projet rt-frontend-apps"
        exit 1
    }
    Print-Success "Répertoire correct"
}

# =============================================================================
# Configurer les Variables d'Environnement
# =============================================================================

function Configure-EnvVars {
    param(
        [string]$AppId,
        [string]$AppName
    )

    Print-Info "Configuration des variables d'environnement..."

    # Variables communes
    $envVars = @{
        "NEXT_PUBLIC_API_URL" = "https://api.rt-technologie.com/api/v1"
        "NEXT_PUBLIC_SUPPORT_URL" = "https://www.rt-technologie.com/support"
    }

    # Variables spécifiques pour backoffice-admin
    if ($AppName -eq "backoffice-admin") {
        $envVars["NEXT_PUBLIC_AUTHZ_URL"] = "https://api.rt-technologie.com/api/v1/auth"
        $envVars["NEXT_PUBLIC_PALETTE_API_URL"] = "https://api.rt-technologie.com/api/v1/palettes"
        $envVars["NEXT_PUBLIC_STORAGE_MARKET_API_URL"] = "https://api.rt-technologie.com/api/v1/storage"
        $envVars["NEXT_PUBLIC_PLANNING_API"] = "https://api.rt-technologie.com/api/v1/planning"
        $envVars["NEXT_PUBLIC_ECMR_API"] = "https://api.rt-technologie.com/api/v1/ecmr"
        $envVars["NEXT_PUBLIC_CHATBOT_API_URL"] = "https://api.rt-technologie.com/api/v1/chatbot"
        $envVars["NEXT_PUBLIC_ADMIN_EMAIL"] = "admin@rt-technologie.com"
    }

    # GITHUB_TOKEN
    $githubToken = $env:GITHUB_TOKEN
    if ([string]::IsNullOrEmpty($githubToken)) {
        Print-Warning "GITHUB_TOKEN non défini"
        Print-Info "Définissez-le avec: `$env:GITHUB_TOKEN='your_token'"
    }
    else {
        $envVars["GITHUB_TOKEN"] = $githubToken
    }

    # Construire la chaîne de variables pour AWS CLI
    $envVarsList = @()
    foreach ($key in $envVars.Keys) {
        $envVarsList += "$key=$($envVars[$key])"
    }
    $envVarsJson = $envVarsList -join ","

    try {
        aws amplify update-app `
            --app-id $AppId `
            --region $REGION `
            --environment-variables $envVarsJson `
            --output json | Out-Null
        Print-Success "Variables d'environnement configurées"
    }
    catch {
        Print-Warning "Erreur lors de la configuration des variables: $_"
    }
}

# =============================================================================
# Créer une Application Amplify
# =============================================================================

function Create-AmplifyApp {
    param(
        [string]$AppName,
        [string]$AppRoot,
        [string]$Domain
    )

    Print-Header "Création de l'App Amplify: $AppName"

    # Vérifier si l'app existe déjà
    Print-Info "Vérification de l'existence de l'app..."
    try {
        $existingApp = aws amplify list-apps --region $REGION --output json | ConvertFrom-Json
        $app = $existingApp.apps | Where-Object { $_.name -eq $AppName }

        if ($app) {
            Print-Warning "L'app $AppName existe déjà (ID: $($app.appId))"
            $APP_ID = $app.appId
        }
        else {
            Print-Info "Création de la nouvelle app..."

            $createResult = aws amplify create-app `
                --name $AppName `
                --repository "https://github.com/$GITHUB_REPO" `
                --platform WEB `
                --region $REGION `
                --output json | ConvertFrom-Json

            $APP_ID = $createResult.app.appId
            Print-Success "App créée avec succès (ID: $APP_ID)"
        }
    }
    catch {
        Print-Error "Échec de la création de l'app: $_"
        return
    }

    # Configurer la branche
    Print-Info "Configuration de la branche $BRANCH..."
    try {
        $branches = aws amplify list-branches --app-id $APP_ID --region $REGION --output json | ConvertFrom-Json
        $existingBranch = $branches.branches | Where-Object { $_.branchName -eq $BRANCH }

        if (-not $existingBranch) {
            aws amplify create-branch `
                --app-id $APP_ID `
                --branch-name $BRANCH `
                --region $REGION `
                --enable-auto-build `
                --output json | Out-Null
            Print-Success "Branche $BRANCH configurée"
        }
        else {
            Print-Warning "La branche $BRANCH existe déjà"
        }
    }
    catch {
        Print-Warning "Erreur lors de la configuration de la branche: $_"
    }

    # Configurer les variables d'environnement
    Configure-EnvVars -AppId $APP_ID -AppName $AppName

    # Démarrer le build
    Print-Info "Démarrage du build..."
    try {
        $jobResult = aws amplify start-job `
            --app-id $APP_ID `
            --branch-name $BRANCH `
            --job-type RELEASE `
            --region $REGION `
            --output json | ConvertFrom-Json

        $JOB_ID = $jobResult.jobSummary.jobId
        Print-Success "Build démarré (Job ID: $JOB_ID)"
    }
    catch {
        Print-Error "Échec du démarrage du build: $_"
        return
    }

    # Afficher l'URL
    $APP_URL = "https://$BRANCH.$APP_ID.amplifyapp.com"
    Print-Success "URL de l'app: $APP_URL"

    # Sauvegarder pour référence
    "$AppName|$APP_ID|$APP_URL|$Domain" | Out-File -FilePath ".amplify-apps.txt" -Append -Encoding UTF8

    Print-Success "Déploiement de $AppName lancé avec succès!"
}

# =============================================================================
# Déployer Toutes les Apps
# =============================================================================

function Deploy-AllApps {
    Print-Header "Déploiement de Toutes les Applications"

    # Supprimer l'ancien fichier
    if (Test-Path ".amplify-apps.txt") {
        Remove-Item ".amplify-apps.txt"
    }

    foreach ($appName in $APP_CONFIGS.Keys) {
        $config = $APP_CONFIGS[$appName]
        $appRoot = $config.appRoot
        $domain = $config.domain

        # Vérifier si le répertoire existe
        if (-not (Test-Path $appRoot)) {
            Print-Warning "Répertoire $appRoot non trouvé, skip $appName"
            continue
        }

        Create-AmplifyApp -AppName $appName -AppRoot $appRoot -Domain $domain
        Write-Host ""
    }

    Print-Success "Tous les déploiements ont été lancés!"
}

# =============================================================================
# Déployer une App Spécifique
# =============================================================================

function Deploy-SingleApp {
    param([string]$AppName)

    if (-not $APP_CONFIGS.ContainsKey($AppName)) {
        Print-Error "Application inconnue: $AppName"
        Print-Info "Applications disponibles:"
        foreach ($name in $APP_CONFIGS.Keys) {
            Write-Host "  - $name"
        }
        exit 1
    }

    $config = $APP_CONFIGS[$AppName]
    $appRoot = $config.appRoot
    $domain = $config.domain

    if (-not (Test-Path $appRoot)) {
        Print-Error "Répertoire $appRoot non trouvé"
        exit 1
    }

    Create-AmplifyApp -AppName $AppName -AppRoot $appRoot -Domain $domain
}

# =============================================================================
# Afficher le Statut
# =============================================================================

function Show-Status {
    Print-Header "Statut des Applications Déployées"

    if (-not (Test-Path ".amplify-apps.txt")) {
        Print-Warning "Aucune app déployée trouvée"
        return
    }

    Write-Host ("{0,-20} {1,-15} {2,-50} {3}" -f "APP", "APP_ID", "URL", "DOMAIN")
    Write-Host ("─" * 120)

    Get-Content ".amplify-apps.txt" | ForEach-Object {
        $parts = $_ -split '\|'
        Write-Host ("{0,-20} {1,-15} {2,-50} {3}" -f $parts[0], $parts[1], $parts[2], $parts[3])
    }
}

# =============================================================================
# Afficher l'Aide
# =============================================================================

function Show-Usage {
    Write-Host ""
    Write-Host "Usage: .\scripts\deploy-amplify.ps1 [command] [app-name]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  all              Déployer toutes les applications"
    Write-Host "  [app-name]       Déployer une application spécifique"
    Write-Host "  status           Afficher le statut des apps déployées"
    Write-Host "  help             Afficher cette aide"
    Write-Host ""
    Write-Host "Applications disponibles:"
    foreach ($name in $APP_CONFIGS.Keys) {
        Write-Host "  - $name"
    }
    Write-Host ""
    Write-Host "Exemples:"
    Write-Host "  .\scripts\deploy-amplify.ps1 all"
    Write-Host "  .\scripts\deploy-amplify.ps1 backoffice-admin"
    Write-Host "  .\scripts\deploy-amplify.ps1 status"
    Write-Host ""
}

# =============================================================================
# Point d'Entrée Principal
# =============================================================================

function Main {
    Print-Header "AWS Amplify - Déploiement Automatisé"

    Check-Prerequisites

    switch ($Command.ToLower()) {
        "all" {
            Deploy-AllApps
        }
        "status" {
            Show-Status
        }
        "help" {
            Show-Usage
        }
        default {
            if ([string]::IsNullOrEmpty($Command) -or $Command -eq "help") {
                Show-Usage
            }
            else {
                Deploy-SingleApp -AppName $Command
            }
        }
    }

    Write-Host ""
    Print-Success "Script terminé avec succès!"
    Write-Host ""
}

# Exécuter le script
Main
