# Configuration des variables d'environnement pour AWS Amplify

$apps = @{
  'dbg6okncuyyiw' = @{
    name = 'web-industry'
    vars = @{
      'NEXT_PUBLIC_API_URL' = 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com'
      'NEXT_PUBLIC_AUTH_API_URL' = 'http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com'
    }
  }
  'd31p7m90ewg4xm' = @{
    name = 'web-logistician'
    vars = @{
      'NEXT_PUBLIC_API_URL' = 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com'
      'NEXT_PUBLIC_AUTH_API_URL' = 'http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com'
    }
  }
  'd1tb834u144p4r' = @{
    name = 'web-transporter'
    vars = @{
      'NEXT_PUBLIC_API_URL' = 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com'
      'NEXT_PUBLIC_AUTH_API_URL' = 'http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com'
    }
  }
  'd3b6p09ihn5w7r' = @{
    name = 'web-recipient'
    vars = @{
      'NEXT_PUBLIC_API_URL' = 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com'
      'NEXT_PUBLIC_AUTH_API_URL' = 'http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com'
    }
  }
  'dzvo8973zaqb' = @{
    name = 'web-supplier'
    vars = @{
      'NEXT_PUBLIC_API_URL' = 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com'
      'NEXT_PUBLIC_AUTH_API_URL' = 'http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com'
    }
  }
  'd3hz3xvddrl94o' = @{
    name = 'web-forwarder'
    vars = @{
      'NEXT_PUBLIC_API_URL' = 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com'
      'NEXT_PUBLIC_AUTH_API_URL' = 'http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com'
    }
  }
}

Write-Host ""
Write-Host "Configuration des variables d'environnement AWS Amplify..." -ForegroundColor Cyan
Write-Host ""

foreach ($app_id in $apps.Keys) {
  $app = $apps[$app_id]
  $app_name = $app.name

  Write-Host "Configuration de $app_name..." -ForegroundColor Yellow

  $envVars = @{}
  foreach ($key in $app.vars.Keys) {
    $envVars[$key] = $app.vars[$key]
  }

  $envVarsJson = $envVars | ConvertTo-Json -Compress

  try {
    aws amplify update-branch --app-id $app_id --branch-name main --environment-variables $envVarsJson --no-cli-pager
    Write-Host "  Variables configurees pour $app_name" -ForegroundColor Green
  }
  catch {
    Write-Host "  Erreur pour $app_name" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Declenchement des builds..." -ForegroundColor Cyan
Write-Host ""

foreach ($app_id in $apps.Keys) {
  $app_name = $apps[$app_id].name

  try {
    aws amplify start-job --app-id $app_id --branch-name main --job-type RELEASE --no-cli-pager
    Write-Host "  Build demarre pour $app_name" -ForegroundColor Green
  }
  catch {
    Write-Host "  Erreur de build pour $app_name" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Configuration terminee!" -ForegroundColor Green
Write-Host ""
