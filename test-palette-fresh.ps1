$baseUrl = "https://dh9acecfz0wg0.cloudfront.net/api/v1"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  TEST PALETTE FRESH - Nouvelle commande" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Creer une nouvelle commande
Write-Host "ETAPE 1: Creation d'une nouvelle commande" -ForegroundColor Yellow
Write-Host "-----------------------------------------" -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$orderRef = "CMD-PALETTE-$timestamp"

$orderData = @{
    reference = $orderRef
    status = "carrier_accepted"
    industrialId = "ind_acme"
    carrierId = "carrier_nordtrans"
    carrierName = "NordTrans SARL"
    pickupAddress = @{
        street = "123 Rue Industrielle"
        city = "Lyon"
        postalCode = "69001"
        country = "France"
    }
    deliveryAddress = @{
        street = "456 Avenue Commerce"
        city = "Paris"
        postalCode = "75001"
        country = "France"
    }
    dates = @{
        pickupDate = (Get-Date).ToString("yyyy-MM-ddT10:00:00")
        deliveryDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddT14:00:00")
    }
    goods = @{
        description = "Marchandises sur 10 palettes EURO"
        weight = 5000
        quantity = 10
        palettes = 10
    }
    createdBy = "test-palette-script"
} | ConvertTo-Json -Depth 5

try {
    $createResult = Invoke-RestMethod -Uri "$baseUrl/orders" -Method POST -Body $orderData -ContentType "application/json" -TimeoutSec 15
    $orderId = $createResult.orderId
    Write-Host "   OK - Commande creee: $orderRef" -ForegroundColor Green
    Write-Host "   OrderId: $orderId" -ForegroundColor Gray
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Etape 2: Verifier status initial
Write-Host "ETAPE 2: Status initial des palettes" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

try {
    $status = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/status" -Method GET -TimeoutSec 10
    Write-Host "   Tracking enabled: $($status.tracking.enabled)" -ForegroundColor Gray
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Etape 3: Confirmer le pickup
Write-Host "ETAPE 3: PICKUP - Confirmation de l'echange" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

$pickupData = @{
    quantity = 10
    palletType = "EURO_EPAL"
    givenBySender = 10
    takenByCarrier = 10
    senderId = "supplier_acme"
    senderName = "ACME Supplies"
    senderType = "expediteur"
    carrierId = "carrier_nordtrans"
    carrierName = "NordTrans SARL"
    confirmedBy = "Jean Dupont (Chauffeur)"
    notes = "Palettes en bon etat"
} | ConvertTo-Json

try {
    $pickup = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/pickup" -Method POST -Body $pickupData -ContentType "application/json" -TimeoutSec 15
    Write-Host "   OK - Pickup confirme!" -ForegroundColor Green
    Write-Host "   Balance: $($pickup.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "   Details: $body" -ForegroundColor Red
    } catch {}
}

Write-Host ""

# Etape 4: Verifier status apres pickup
Write-Host "ETAPE 4: Status apres pickup" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

try {
    $status = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/status" -Method GET -TimeoutSec 10
    Write-Host "   Tracking enabled: $($status.tracking.enabled)" -ForegroundColor Green
    Write-Host "   Pickup confirme: Oui" -ForegroundColor Green
    Write-Host "   Balance: $($status.tracking.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Etape 5: Confirmer la livraison
Write-Host "ETAPE 5: LIVRAISON - Confirmation de l'echange" -ForegroundColor Yellow
Write-Host "----------------------------------------------" -ForegroundColor Yellow

$deliveryData = @{
    quantity = 10
    palletType = "EURO_EPAL"
    givenByCarrier = 10
    receivedByRecipient = 10
    carrierId = "carrier_nordtrans"
    carrierName = "NordTrans SARL"
    recipientId = "recipient_beta"
    recipientName = "BETA Distribution"
    recipientType = "destinataire"
    confirmedBy = "Marie Martin (Reception)"
    notes = "Toutes palettes recues en parfait etat"
} | ConvertTo-Json

try {
    $delivery = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/delivery" -Method POST -Body $deliveryData -ContentType "application/json" -TimeoutSec 15
    Write-Host "   OK - Livraison confirmee!" -ForegroundColor Green
    Write-Host "   Balance finale: $($delivery.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "   Details: $body" -ForegroundColor Red
    } catch {}
}

Write-Host ""

# Etape 6: Bilan final
Write-Host "ETAPE 6: BILAN FINAL" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow

try {
    $status = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/status" -Method GET -TimeoutSec 10

    Write-Host ""
    Write-Host "   Commande: $orderRef" -ForegroundColor White
    Write-Host "   Type palette: $($status.tracking.palletType)" -ForegroundColor Gray
    Write-Host "   Quantite: $($status.tracking.expectedQuantity)" -ForegroundColor Gray
    Write-Host ""

    if ($status.tracking.pickup) {
        Write-Host "   PICKUP:" -ForegroundColor White
        Write-Host "      Donne par expediteur: $($status.tracking.pickup.givenBySender)" -ForegroundColor Gray
        Write-Host "      Pris par transporteur: $($status.tracking.pickup.takenByCarrier)" -ForegroundColor Gray
    }

    if ($status.tracking.delivery) {
        Write-Host "   LIVRAISON:" -ForegroundColor White
        Write-Host "      Donne par transporteur: $($status.tracking.delivery.givenByCarrier)" -ForegroundColor Gray
        Write-Host "      Recu par destinataire: $($status.tracking.delivery.receivedByRecipient)" -ForegroundColor Gray
    }

    Write-Host ""
    $balance = $status.tracking.balance
    if ($balance -eq 0) {
        Write-Host "   BALANCE: 0 - COMPTE SOLDE!" -ForegroundColor Green
        Write-Host "   Echange equilibre, aucune dette." -ForegroundColor Green
    } elseif ($balance -gt 0) {
        Write-Host "   BALANCE: +$balance - Transporteur doit $balance palette(s)" -ForegroundColor Yellow
    } else {
        Write-Host "   BALANCE: $balance - Destinataire doit $([Math]::Abs($balance)) palette(s)" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "   Settled: $($status.tracking.settled)" -ForegroundColor Gray

} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  FIN DU TEST" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
