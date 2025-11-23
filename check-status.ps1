$apps = @{
  'd1tb834u144p4r' = 'web-transporter'
  'd3b6p09ihn5w7r' = 'web-recipient'
  'dzvo8973zaqb' = 'web-supplier'
  'd3hz3xvddrl94o' = 'web-forwarder'
  'dbg6okncuyyiw' = 'web-industry'
  'd31p7m90ewg4xm' = 'web-logistician'
}

Write-Host ''
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host '        STATUT FINAL DES DEPLOYMENTS SYMPHONI.A' -ForegroundColor Cyan
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host ''

$success = 0
$failed = 0
$running = 0

foreach ($app_id in $apps.Keys) {
  $app_name = $apps[$app_id]
  $result = aws amplify list-jobs --app-id $app_id --branch-name main --max-results 1 --query 'jobSummaries[0].[jobId,status]' --output text
  $job_id, $status = $result -split '\s+'

  $app_url = "https://main.$app_id.amplifyapp.com"

  if ($status -eq 'SUCCEED') {
    Write-Host "OK $app_name (Job #$job_id)" -ForegroundColor Green
    Write-Host "   URL: $app_url" -ForegroundColor Cyan
    Write-Host ""
    $success++
  } elseif ($status -eq 'RUNNING' -or $status -eq 'PENDING') {
    Write-Host "EN COURS $app_name (Job #$job_id)" -ForegroundColor Yellow
    $running++
  } else {
    Write-Host "ERREUR $app_name (Job #$job_id): $status" -ForegroundColor Red
    $failed++
  }
}

Write-Host ''
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host "RESULTAT: $success reussis | $failed echoues | $running en cours" -ForegroundColor Cyan

if ($success -eq 6) {
  Write-Host ''
  Write-Host 'PARFAIT! TOUS LES 6 PORTAILS SONT DEPLOYES!' -ForegroundColor Green
}
Write-Host '========================================================' -ForegroundColor Cyan
