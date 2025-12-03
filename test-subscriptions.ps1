Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Subscriptions Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://d39uizi9hzozo8.cloudfront.net"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get
    Write-Host "  Status: $($health.status)" -ForegroundColor Green
    Write-Host "  MongoDB: $($health.mongodb.status)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Service Info
Write-Host "Test 2: Service Info" -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "$apiUrl/" -Method Get
    Write-Host "  Version: $($info.version)" -ForegroundColor Green
    Write-Host "  Endpoints: $($info.endpoints.Count) disponibles" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Liste des plans
Write-Host "Test 3: Liste des plans d'abonnement" -ForegroundColor Yellow
try {
    $plans = Invoke-RestMethod -Uri "$apiUrl/api/plans" -Method Get
    Write-Host "  Plans disponibles: $($plans.Count)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Créer un plan (test)
Write-Host "Test 4: Créer un plan de test" -ForegroundColor Yellow
try {
    $body = @{
        name = "Plan Test"
        description = "Plan de test automatique"
        price = 29.99
        currency = "EUR"
        billingCycle = "monthly"
        features = @("Feature 1", "Feature 2", "Feature 3")
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$apiUrl/api/plans" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  Plan créé avec succès!" -ForegroundColor Green
    Write-Host "  ID: $($result._id)" -ForegroundColor Gray
    Write-Host "  Nom: $($result.name)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Tests terminés!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
