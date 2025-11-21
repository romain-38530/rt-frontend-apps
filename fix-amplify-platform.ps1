# Script pour forcer les applications AWS Amplify en mode static hosting
# Région: eu-central-1

$apps = @(
    @{name="web-industry"; id="dbg6okncuyyiw"},
    @{name="web-transporter"; id="d1tb834u144p4r"},
    @{name="web-recipient"; id="d3b6p09ihn5w7r"},
    @{name="web-supplier"; id="dzvo8973zaqb"},
    @{name="web-forwarder"; id="d3hz3xvddrl94o"},
    @{name="web-logistician"; id="d31p7m90ewg4xm"}
)

foreach ($app in $apps) {
    Write-Host "Mise à jour de $($app.name) ($($app.id))..." -ForegroundColor Cyan

    # Tenter de mettre à jour l'application pour forcer le mode static
    aws amplify update-app `
        --app-id $app.id `
        --region eu-central-1 `
        --custom-rules '[{"source":"/<*>","target":"/index.html","status":"200"}]' `
        --platform WEB

    Write-Host "✓ $($app.name) mis à jour" -ForegroundColor Green
}

Write-Host "`nToutes les applications ont été mises à jour. Relancez les déploiements." -ForegroundColor Yellow
