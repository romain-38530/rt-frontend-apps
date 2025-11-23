$buildspec = Get-Content -Path "buildspec-logistician.yml" -Raw
$tempFile = "temp-buildspec.yml"

# Save to temp file (UTF8 without BOM)
$fullPath = Join-Path (Get-Location) $tempFile
[System.IO.File]::WriteAllText($fullPath, $buildspec, [System.Text.UTF8Encoding]::new($false))

# Update the app using file://
aws amplify update-app --app-id d31p7m90ewg4xm --build-spec "file://$tempFile" --no-cli-pager > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ web-logistician updated"
    aws amplify start-job --app-id d31p7m90ewg4xm --branch-name main --job-type RELEASE --no-cli-pager > $null 2>&1
    Write-Host "   Build started"
} else {
    Write-Host "❌ web-logistician failed"
}

# Clean up
Remove-Item $tempFile -ErrorAction SilentlyContinue
