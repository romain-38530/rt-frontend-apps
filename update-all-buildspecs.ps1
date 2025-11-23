$apps = @{
    "d1tb834u144p4r" = "web-transporter"
    "d3b6p09ihn5w7r" = "web-recipient"
    "dzvo8973zaqb" = "web-supplier"
    "d3hz3xvddrl94o" = "web-forwarder"
    "dbg6okncuyyiw" = "web-industry"
}

$buildspec_template = Get-Content -Path "buildspec-logistician.yml" -Raw
$tempFile = "temp-buildspec.yml"

foreach ($app_id in $apps.Keys) {
    $app_name = $apps[$app_id]
    Write-Host "Updating $app_name ($app_id)..."

    # Replace the appRoot in buildspec
    $buildspec = $buildspec_template -replace "apps/web-logistician", "apps/$app_name"

    # Save to temp file (UTF8 without BOM)
    $fullPath = Join-Path (Get-Location) $tempFile
    [System.IO.File]::WriteAllText($fullPath, $buildspec, [System.Text.UTF8Encoding]::new($false))

    # Update the app using file://
    $output = aws amplify update-app --app-id $app_id --build-spec "file://$tempFile" --no-cli-pager 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $app_name updated"
        # Start build
        aws amplify start-job --app-id $app_id --branch-name main --job-type RELEASE --no-cli-pager > $null 2>&1
        Write-Host "   Build started"
    } else {
        Write-Host "❌ $app_name failed"
    }
}

# Clean up
Remove-Item $tempFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✨ All buildSpecs updated and builds started!"
