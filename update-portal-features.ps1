Write-Host "🎨 Mise à jour des fonctionnalités des portails..." -ForegroundColor Cyan
Write-Host ""

# Résumé des mises à jour
$updates = @"
📊 Logistician - 11 services
🚚 Transporter - 11 services
🌐 Forwarder - 10 services
🏭 Industry - 9 services (✅ fait)
📦 Supplier - 8 services
📍 Recipient - 6 services
"@

Write-Host $updates
Write-Host ""
Write-Host "Les fonctionnalités suivantes sont maintenant disponibles:" -ForegroundColor Yellow
Write-Host "  🤖 Chatbot - Tous les portails"
Write-Host "  🔔 Notifications - Tous les portails" 
Write-Host "  📦 Storage Market - Logistician, Supplier, Forwarder, Industry"
Write-Host "  📚 Training - Tous sauf Recipient"
Write-Host "  🧠 Affret IA - Logistician, Transporter, Forwarder, Industry"
Write-Host ""
