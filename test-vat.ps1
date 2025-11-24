$body = '{"vatNumber":"FR21350675567"}'
$response = Invoke-RestMethod -Uri 'https://d2i50a1vlg138w.cloudfront.net/api/vat/validate' -Method POST -Body $body -ContentType 'application/json'
$response | ConvertTo-Json -Depth 10
