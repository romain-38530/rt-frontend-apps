# Script de Test pour SYMPHONI.A Frontend Apps
# Teste tous les builds et vérifie les déploiements Amplify

param(
    [switch]$BuildOnly,
    [switch]$AmplifyOnly,
    [switch]$ApiTest,
    [switch]$All
)

$ErrorActionPreference = "Continue"
$apps = @(
    @{Name="marketing-site"; Type="next"; Pages=30; AppId="df8cnylp3pqka"},
    @{Name="backoffice-admin"; Type="next"; Pages=14; AppId="dntbizetlc7bm"},
    @{Name="web-industry"; Type="next"; Pages=13; AppId="dbg6okncuyyiw"},
    @{Name="web-transporter"; Type="next"; Pages=14; AppId="d1tb834u144p4r"},
    @{Name="web-recipient"; Type="next"; Pages=13; AppId="d3b6p09ihn5w7r"},
    @{Name="web-supplier"; Type="next"; Pages=13; AppId="dzvo8973zaqb"},
    @{Name="web-forwarder"; Type="next"; Pages=13; AppId="d3hz3xvddrl94o"},
    @{Name="web-logistician"; Type="next"; Pages=13; AppId="d31p7m90ewg4xm"}
)

Write-Host "`n┌────────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│         SYMPHONI.A FRONTEND APPS TEST SUITE            │" -ForegroundColor Cyan
Write-Host "└────────────────────────────────────────────────────────────┘`n" -ForegroundColor Cyan

# ============================================================================
# 1. TEST DES BUILDS
# ============================================================================

if ($BuildOnly -or $All -or (-not $AmplifyOnly -and -not $ApiTest)) {
    Write-Host "📦 TEST DES BUILDS" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────`n" -ForegroundColor Gray

    $buildResults = @()

    foreach ($app in $apps) {
        Write-Host "Testing $($app.Name)..." -NoNewline

        $buildOutput = & pnpm --filter "@rt/$($app.Name)" build 2>&1
        $success = $LASTEXITCODE -eq 0

        if ($success) {
            # Extraire le nombre de pages générées
            $pagesMatch = $buildOutput | Select-String "Generating static pages \((\d+)/(\d+)\)"
            if ($pagesMatch) {
                $generated = $pagesMatch.Matches[0].Groups[2].Value
                $expected = $app.Pages

                if ($generated -eq $expected) {
                    Write-Host " ✅ OK ($generated/$expected pages)" -ForegroundColor Green
                    $buildResults += @{App=$app.Name; Status="✅ SUCCESS"; Pages="$generated/$expected"}
                } else {
                    Write-Host " ⚠️  WARNING ($generated/$expected pages)" -ForegroundColor Yellow
                    $buildResults += @{App=$app.Name; Status="⚠️  WARNING"; Pages="$generated/$expected"}
                }
            } else {
                Write-Host " ✅ OK" -ForegroundColor Green
                $buildResults += @{App=$app.Name; Status="✅ SUCCESS"; Pages="N/A"}
            }
        } else {
            Write-Host " ❌ FAILED" -ForegroundColor Red
            $buildResults += @{App=$app.Name; Status="❌ FAILED"; Pages="0/$($app.Pages)"}
        }
    }

    Write-Host "`n📊 RÉSUMÉ DES BUILDS:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
    $buildResults | ForEach-Object {
        Write-Host "$($_.App.PadRight(20)) $($_.Status.PadRight(15)) $($_.Pages)" -NoNewline
        if ($_.Status -like "*SUCCESS*") { Write-Host "" -ForegroundColor Green }
        elseif ($_.Status -like "*WARNING*") { Write-Host "" -ForegroundColor Yellow }
        else { Write-Host "" -ForegroundColor Red }
    }

    $successCount = ($buildResults | Where-Object { $_.Status -like "*SUCCESS*" }).Count
    $totalCount = $buildResults.Count
    Write-Host "`n✅ $successCount/$totalCount builds réussis`n" -ForegroundColor Green
}

# ============================================================================
# 2. VÉRIFICATION DES DÉPLOIEMENTS AMPLIFY
# ============================================================================

if ($AmplifyOnly -or $All) {
    Write-Host "🌐 VÉRIFICATION AMPLIFY" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────`n" -ForegroundColor Gray

    $amplifyResults = @()

    foreach ($app in $apps) {
        if ($app.AppId) {
            Write-Host "Checking $($app.Name)..." -NoNewline

            try {
                # Récupérer le dernier job
                $jobsJson = aws amplify list-jobs `
                    --app-id $app.AppId `
                    --branch-name main `
                    --region eu-central-1 `
                    --max-results 1 2>&1

                if ($LASTEXITCODE -eq 0) {
                    $jobs = $jobsJson | ConvertFrom-Json
                    if ($jobs.jobSummaries -and $jobs.jobSummaries.Count -gt 0) {
                        $latestJob = $jobs.jobSummaries[0].summary
                        $status = $latestJob.status
                        $jobId = $latestJob.jobId

                        $statusIcon = switch ($status) {
                            "SUCCEED" { "✅"; break }
                            "RUNNING" { "🔄"; break }
                            "PENDING" { "⏳"; break }
                            "FAILED"  { "❌"; break }
                            default   { "❓"; break }
                        }

                        Write-Host " $statusIcon Job #$jobId - $status" -NoNewline
                        if ($status -eq "SUCCEED") { Write-Host "" -ForegroundColor Green }
                        elseif ($status -eq "RUNNING" -or $status -eq "PENDING") { Write-Host "" -ForegroundColor Yellow }
                        else { Write-Host "" -ForegroundColor Red }

                        $amplifyResults += @{App=$app.Name; JobId=$jobId; Status=$status; Icon=$statusIcon}
                    } else {
                        Write-Host " ⚠️  No jobs found" -ForegroundColor Yellow
                        $amplifyResults += @{App=$app.Name; JobId="N/A"; Status="NO_JOBS"; Icon="⚠️"}
                    }
                } else {
                    Write-Host " ❌ AWS CLI Error" -ForegroundColor Red
                    $amplifyResults += @{App=$app.Name; JobId="N/A"; Status="ERROR"; Icon="❌"}
                }
            } catch {
                Write-Host " ❌ Exception: $_" -ForegroundColor Red
                $amplifyResults += @{App=$app.Name; JobId="N/A"; Status="EXCEPTION"; Icon="❌"}
            }
        }
    }

    Write-Host "`n📊 RÉSUMÉ AMPLIFY:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
    $amplifyResults | ForEach-Object {
        $line = "$($_.App.PadRight(20)) Job #$($_.JobId.ToString().PadRight(5)) $($_.Icon) $($_.Status)"
        if ($_.Status -eq "SUCCEED") { Write-Host $line -ForegroundColor Green }
        elseif ($_.Status -eq "RUNNING" -or $_.Status -eq "PENDING") { Write-Host $line -ForegroundColor Yellow }
        else { Write-Host $line -ForegroundColor Red }
    }

    $successCount = ($amplifyResults | Where-Object { $_.Status -eq "SUCCEED" }).Count
    $totalCount = $amplifyResults.Count
    Write-Host "`n✅ $successCount/$totalCount déploiements réussis`n" -ForegroundColor Green
}

# ============================================================================
# 3. TESTS API
# ============================================================================

if ($ApiTest -or $All) {
    Write-Host "🔌 TESTS API" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────`n" -ForegroundColor Gray

    $apiEndpoints = @(
        @{Name="Health Check (CloudFront)"; Url="https://ddaywxps9n701.cloudfront.net/health"; Method="GET"},
        @{Name="Health Check (EB)"; Url="http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com/health"; Method="GET"},
        @{Name="VAT Validation"; Url="https://ddaywxps9n701.cloudfront.net/api/vat/validate"; Method="POST"; Body='{"vatNumber":"FR12345678901"}'}
    )

    $apiResults = @()

    foreach ($endpoint in $apiEndpoints) {
        Write-Host "Testing $($endpoint.Name)..." -NoNewline

        try {
            if ($endpoint.Method -eq "GET") {
                $response = Invoke-WebRequest -Uri $endpoint.Url -Method GET -SkipCertificateCheck -TimeoutSec 10 -ErrorAction Stop
            } else {
                $response = Invoke-WebRequest -Uri $endpoint.Url -Method POST -Body $endpoint.Body -ContentType "application/json" -SkipCertificateCheck -TimeoutSec 10 -ErrorAction Stop
            }

            $statusCode = $response.StatusCode

            if ($statusCode -ge 200 -and $statusCode -lt 300) {
                Write-Host " ✅ $statusCode" -ForegroundColor Green
                $apiResults += @{Endpoint=$endpoint.Name; Status=$statusCode; Result="✅ SUCCESS"}
            } else {
                Write-Host " ⚠️  $statusCode" -ForegroundColor Yellow
                $apiResults += @{Endpoint=$endpoint.Name; Status=$statusCode; Result="⚠️  WARNING"}
            }
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode) {
                Write-Host " ⚠️  $statusCode" -ForegroundColor Yellow
                $apiResults += @{Endpoint=$endpoint.Name; Status=$statusCode; Result="⚠️  HTTP $statusCode"}
            } else {
                Write-Host " ❌ FAILED" -ForegroundColor Red
                $apiResults += @{Endpoint=$endpoint.Name; Status="N/A"; Result="❌ FAILED"}
            }
        }
    }

    Write-Host "`n📊 RÉSUMÉ API:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
    $apiResults | ForEach-Object {
        $line = "$($_.Endpoint.PadRight(30)) $($_.Result)"
        if ($_.Result -like "*SUCCESS*") { Write-Host $line -ForegroundColor Green }
        elseif ($_.Result -like "*WARNING*") { Write-Host $line -ForegroundColor Yellow }
        else { Write-Host $line -ForegroundColor Red }
    }

    $successCount = ($apiResults | Where-Object { $_.Result -like "*SUCCESS*" }).Count
    $totalCount = $apiResults.Count
    Write-Host "`n✅ $successCount/$totalCount endpoints opérationnels`n" -ForegroundColor Green
}

# ============================================================================
# RÉSUMÉ FINAL
# ============================================================================

Write-Host "┌────────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│                   TESTS TERMINÉS                           │" -ForegroundColor Cyan
Write-Host "└────────────────────────────────────────────────────────────┘`n" -ForegroundColor Cyan

# Usage examples
Write-Host "💡 EXEMPLES D'UTILISATION:`n" -ForegroundColor Yellow
Write-Host "  .\test-all-apps.ps1 -BuildOnly     # Tester uniquement les builds" -ForegroundColor Gray
Write-Host "  .\test-all-apps.ps1 -AmplifyOnly   # Vérifier uniquement Amplify" -ForegroundColor Gray
Write-Host "  .\test-all-apps.ps1 -ApiTest       # Tester uniquement les APIs" -ForegroundColor Gray
Write-Host "  .\test-all-apps.ps1 -All           # Tout tester" -ForegroundColor Gray
Write-Host ""
