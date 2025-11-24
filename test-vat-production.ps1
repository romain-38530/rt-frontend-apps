Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test VAT Validation - Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://d2i50a1vlg138w.cloudfront.net/api/vat/validate"

# Test 1: Belgique (Anheuser-Busch InBev)
Write-Host "Test 1: BE0417497106 (Belgique - Anheuser-Busch)" -ForegroundColor Yellow
$body = @{ vatNumber = "BE0417497106" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"
Write-Host "  Valid: $($response.valid)" -ForegroundColor $(if ($response.valid) {"Green"} else {"Red"})
Write-Host "  Company: $($response.companyName)" -ForegroundColor Gray
Write-Host "  Source: $($response.source)" -ForegroundColor Gray
Write-Host ""

# Test 2: Allemagne
Write-Host "Test 2: DE811569869 (Allemagne)" -ForegroundColor Yellow
$body = @{ vatNumber = "DE811569869" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"
Write-Host "  Valid: $($response.valid)" -ForegroundColor $(if ($response.valid) {"Green"} else {"Red"})
Write-Host "  Company: $($response.companyName)" -ForegroundColor Gray
Write-Host "  Source: $($response.source)" -ForegroundColor Gray
Write-Host ""

# Test 3: Numéro invalide
Write-Host "Test 3: FR00000000000 (Invalide)" -ForegroundColor Yellow
$body = @{ vatNumber = "FR00000000000" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"
Write-Host "  Valid: $($response.valid)" -ForegroundColor $(if ($response.valid) {"Green"} else {"Red"})
Write-Host "  Source: $($response.source)" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Tests terminés!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
