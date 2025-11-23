$buildspec = Get-Content -Path "buildspec-logistician.yml" -Raw
$buildspec_supplier = $buildspec -replace "apps/web-logistician", "apps/web-supplier"

# Save to temp file
$tempFile = "temp-buildspec.yml"
$buildspec_supplier | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

# Update using file://
$output = aws amplify update-app --app-id dzvo8973zaqb --build-spec "file://$tempFile" --no-cli-pager 2>&1
Write-Host $output

# Clean up
Remove-Item $tempFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ web-supplier updated"
    aws amplify start-job --app-id dzvo8973zaqb --branch-name main --job-type RELEASE --no-cli-pager > $null 2>&1
    Write-Host "   Build started"
} else {
    Write-Host "❌ web-supplier failed"
}
