# Script d'insertion des utilisateurs de démo dans MongoDB

Write-Host ""
Write-Host "🚀 Insertion des utilisateurs de démo dans MongoDB..." -ForegroundColor Cyan
Write-Host ""

# URI MongoDB (stagingrt cluster)
$mongoUri = "mongodb+srv://stagingrt:7Cqk9t2CipmVPrwp@stagingrt.4cxw6.mongodb.net/auth-service"

# Vérifier si mongoimport est disponible
$mongoImportPath = Get-Command mongoimport -ErrorAction SilentlyContinue

if (-not $mongoImportPath) {
    Write-Host "❌ mongoimport n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Installer MongoDB Tools: https://www.mongodb.com/try/download/database-tools" -ForegroundColor Yellow
    Write-Host "2. Utiliser le script Node.js: node create-demo-users.js --mongodb" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Vérifier si le fichier demo-users.json existe
if (-not (Test-Path "demo-users.json")) {
    Write-Host "❌ Fichier demo-users.json introuvable" -ForegroundColor Red
    Write-Host "Exécutez d'abord: node create-demo-users.js" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "📁 Fichier demo-users.json trouvé" -ForegroundColor Green
Write-Host "🔗 Connexion à MongoDB Atlas (stagingrt)..." -ForegroundColor Yellow
Write-Host ""

# Importer les utilisateurs
try {
    mongoimport --uri $mongoUri --collection users --file demo-users.json --jsonArray --mode upsert

    Write-Host ""
    Write-Host "✅ Utilisateurs insérés avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 Comptes créés:" -ForegroundColor Cyan
    Write-Host "  - industry@demo.symphoni-a.com" -ForegroundColor White
    Write-Host "  - supplier@demo.symphoni-a.com" -ForegroundColor White
    Write-Host "  - transporter@demo.symphoni-a.com" -ForegroundColor White
    Write-Host "  - forwarder@demo.symphoni-a.com" -ForegroundColor White
    Write-Host "  - logistician@demo.symphoni-a.com" -ForegroundColor White
    Write-Host "  - recipient@demo.symphoni-a.com" -ForegroundColor White
    Write-Host "  - admin@demo.symphoni-a.com" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Voir DEMO_CREDENTIALS.md pour les mots de passe" -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'insertion:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}
