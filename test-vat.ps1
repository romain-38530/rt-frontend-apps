$body = '{"vatNumber":"FR21350675567"}'
$response = Invoke-RestMethod -Uri 'https://ddaywxps9n701.cloudfront.net/api/vat/validate' -Method POST -Body $body -ContentType 'application/json'
$response | ConvertTo-Json -Depth 10
