# Script pour mettre à jour NEXT_PUBLIC_API_URL dans toutes les apps Amplify
# Usage: .\update-amplify-api-url.ps1 -ApiUrl "https://rt-auth-api-prod.eu-central-1.elasticbeanstalk.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mise à jour URL API dans Amplify" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$region = "eu-central-1"

$apps = @(
    @{name="web-industry"; id="dbg6okncuyyiw"},
    @{name="web-transporter"; id="d1tb834u144p4r"},
    @{name="web-recipient"; id="d3b6p09ihn5w7r"},
    @{name="web-supplier"; id="dzvo8973zaqb"},
    @{name="web-forwarder"; id="d3hz3xvddrl94o"},
    @{name="web-logistician"; id="d31p7m90ewg4xm"}
)

Write-Host "URL de l'API: $ApiUrl" -ForegroundColor Yellow
Write-Host "Région: $region" -ForegroundColor Yellow
Write-Host ""

foreach ($app in $apps) {
    Write-Host "Mise à jour de $($app.name) ($($app.id))..." -ForegroundColor Cyan

    try {
        # Récupérer les variables d'environnement actuelles
        $currentEnv = aws amplify get-app --app-id $app.id --region $region --query 'app.environmentVariables' --output json | ConvertFrom-Json

        # Ajouter/Mettre à jour NEXT_PUBLIC_API_URL
        if ($null -eq $currentEnv) {
            $currentEnv = @{}
        }
        $currentEnv.NEXT_PUBLIC_API_URL = $ApiUrl

        # Convertir en JSON pour AWS CLI
        $envJson = $currentEnv | ConvertTo-Json -Compress

        # Mettre à jour l'app
        aws amplify update-app `
            --app-id $app.id `
            --region $region `
            --environment-variables $envJson | Out-Null

        Write-Host "✓ Variables mises à jour" -ForegroundColor Green

        # Déclencher un nouveau déploiement
        Write-Host "  Déclenchement du déploiement..." -ForegroundColor Yellow

        $jobResult = aws amplify start-job `
            --app-id $app.id `
            --branch-name main `
            --job-type RELEASE `
            --region $region `
            --output json | ConvertFrom-Json

        $jobId = $jobResult.jobSummary.jobId
        Write-Host "  ✓ Déploiement démarré (Job ID: $jobId)" -ForegroundColor Green

    } catch {
        Write-Host "✗ Erreur: $_" -ForegroundColor Red
    }

    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Mise à jour terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Les 6 applications vont se redéployer avec la nouvelle URL de l'API." -ForegroundColor Yellow
Write-Host "Vérifiez les builds dans la console AWS Amplify:" -ForegroundColor Yellow
Write-Host "https://eu-central-1.console.aws.amazon.com/amplify/home?region=eu-central-1" -ForegroundColor Cyan
Write-Host ""
