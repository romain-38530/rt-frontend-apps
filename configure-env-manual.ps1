# Configuration manuelle des variables d'environnement pour chaque app

$apps = @(
  @{id='dbg6okncuyyiw'; name='web-industry'}
  @{id='d31p7m90ewg4xm'; name='web-logistician'}
  @{id='d1tb834u144p4r'; name='web-transporter'}
  @{id='d3b6p09ihn5w7r'; name='web-recipient'}
  @{id='dzvo8973zaqb'; name='web-supplier'}
  @{id='d3hz3xvddrl94o'; name='web-forwarder'}
)

$apiUrl = 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com'
$authUrl = 'http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com'

Write-Host ""
Write-Host "Configuration des variables d'environnement..." -ForegroundColor Cyan
Write-Host ""

foreach ($app in $apps) {
  Write-Host "Configuration de $($app.name)..." -ForegroundColor Yellow

  # Format JSON correct pour AWS CLI
  $envJson = "{`"NEXT_PUBLIC_API_URL`":`"$apiUrl`",`"NEXT_PUBLIC_AUTH_API_URL`":`"$authUrl`"}"

  aws amplify update-branch `
    --app-id $($app.id) `
    --branch-name main `
    --environment-variables $envJson `
    --no-cli-pager

  Write-Host "  OK pour $($app.name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuration terminee!" -ForegroundColor Green
Write-Host ""
