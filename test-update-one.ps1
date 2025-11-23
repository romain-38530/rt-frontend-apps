$buildspec = Get-Content -Path "buildspec-logistician.yml" -Raw
$buildspec_supplier = $buildspec -replace "apps/web-logistician", "apps/web-supplier"

Write-Host "BuildSpec content length: $($buildspec_supplier.Length)"
Write-Host "First 200 chars: $($buildspec_supplier.Substring(0, [Math]::Min(200, $buildspec_supplier.Length)))"

$output = aws amplify update-app --app-id dzvo8973zaqb --build-spec $buildspec_supplier --no-cli-pager 2>&1
Write-Host "AWS Output:"
Write-Host $output

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Success"
} else {
    Write-Host "❌ Failed with exit code: $LASTEXITCODE"
}
