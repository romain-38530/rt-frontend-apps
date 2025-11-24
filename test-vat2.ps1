# Test avec un vrai numéro TVA français valide (exemple: Apple France)
$body = '{"vatNumber":"FR60408843661"}'
$response = Invoke-RestMethod -Uri 'https://d2i50a1vlg138w.cloudfront.net/api/vat/validate' -Method POST -Body $body -ContentType 'application/json'
Write-Host "Test avec FR60408843661 (Apple France):"
$response | ConvertTo-Json -Depth 10
