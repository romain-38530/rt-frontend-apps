$buildspec = Get-Content -Path "buildspec-logistician.yml" -Raw
aws amplify update-app --app-id d31p7m90ewg4xm --build-spec $buildspec --no-cli-pager
Write-Host "Build spec updated successfully!"
aws amplify start-job --app-id d31p7m90ewg4xm --branch-name main --job-type RELEASE --no-cli-pager > $null 2>&1
Write-Host "Build started"
