# Test direct sur le backend HTTP
$body = '{"vatNumber":"FR60408843661"}'
$response = Invoke-RestMethod -Uri 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com/api/vat/validate' -Method POST -Body $body -ContentType 'application/json'
Write-Host "Test backend HTTP direct:"
$response | ConvertTo-Json -Depth 10
