Write-Host "Test VIES REST API (utilisée par le backend):"
try {
    $response = Invoke-RestMethod -Uri 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/FR/vat/60408843661' -Method GET
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR: $_"
    Write-Host "StatusCode:" $_.Exception.Response.StatusCode.value__
}
