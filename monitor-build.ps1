# Script pour monitorer le build Amplify

$appId = "df8cnylp3pqka"
$branch = "main"
$region = "eu-central-1"

Write-Host ""
Write-Host "========================================"
Write-Host "Monitoring Amplify Build"
Write-Host "========================================"
Write-Host ""

$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++

    Write-Host "[$attempt/$maxAttempts] Verification du statut..."

    $status = aws amplify list-jobs --app-id $appId --branch-name $branch --region $region --max-items 1 --query "jobSummaries[0].status" --output text

    Write-Host "   Statut: $status"

    if ($status -eq "SUCCEED") {
        Write-Host ""
        Write-Host "BUILD REUSSI!" -ForegroundColor Green
        Write-Host "   URL: https://main.$appId.amplifyapp.com" -ForegroundColor Green
        break
    }
    elseif ($status -eq "FAILED") {
        Write-Host ""
        Write-Host "BUILD ECHOUE" -ForegroundColor Red
        break
    }
    elseif ($status -eq "RUNNING" -or $status -eq "PENDING") {
        Write-Host "   En cours... Nouvelle verification dans 15 secondes"
        Start-Sleep -Seconds 15
    }
    else {
        Write-Host "   Statut inconnu: $status"
        break
    }
}

if ($attempt -ge $maxAttempts) {
    Write-Host ""
    Write-Host "Timeout atteint apres $maxAttempts tentatives" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================"
