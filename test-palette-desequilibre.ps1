$baseUrl = "https://dh9acecfz0wg0.cloudfront.net/api/v1"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  TEST PALETTE - SCENARIO DESEQUILIBRE" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Scenario: L'expediteur donne 10 palettes" -ForegroundColor Gray
Write-Host "            Le transporteur en prend seulement 8" -ForegroundColor Gray
Write-Host "            => Dette de 2 palettes" -ForegroundColor Gray
Write-Host ""

# Creer une nouvelle commande
Write-Host "ETAPE 1: Creation commande" -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$orderRef = "CMD-DESEQ-$timestamp"

$orderData = @{
    reference = $orderRef
    status = "carrier_accepted"
    industrialId = "ind_test"
    carrierId = "carrier_express"
    carrierName = "Express Transport"
    pickupAddress = @{
        street = "100 Zone Industrielle"
        city = "Marseille"
        postalCode = "13001"
        country = "France"
    }
    deliveryAddress = @{
        street = "200 Port Commercial"
        city = "Bordeaux"
        postalCode = "33000"
        country = "France"
    }
    dates = @{
        pickupDate = (Get-Date).ToString("yyyy-MM-ddT08:00:00")
        deliveryDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddT16:00:00")
    }
    goods = @{
        description = "Produits chimiques sur palettes"
        weight = 8000
        quantity = 10
        palettes = 10
    }
    createdBy = "test-desequilibre"
} | ConvertTo-Json -Depth 5

try {
    $createResult = Invoke-RestMethod -Uri "$baseUrl/orders" -Method POST -Body $orderData -ContentType "application/json" -TimeoutSec 15
    $orderId = $createResult.orderId
    Write-Host "   OK - Commande: $orderRef" -ForegroundColor Green
    Write-Host "   OrderId: $orderId" -ForegroundColor Gray
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Pickup avec desequilibre
Write-Host "ETAPE 2: PICKUP DESEQUILIBRE" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host "   Expediteur donne: 10 palettes" -ForegroundColor Cyan
Write-Host "   Transporteur prend: 8 palettes" -ForegroundColor Cyan
Write-Host "   => Ecart: -2 palettes" -ForegroundColor Yellow

$pickupData = @{
    quantity = 10
    palletType = "EURO_EPAL"
    givenBySender = 10
    takenByCarrier = 8
    senderId = "supplier_chimie"
    senderName = "Chimie Industries"
    senderType = "expediteur"
    carrierId = "carrier_express"
    carrierName = "Express Transport"
    confirmedBy = "Pierre Martin (Chauffeur)"
    notes = "2 palettes endommagees refusees par transporteur"
} | ConvertTo-Json

try {
    $pickup = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/pickup" -Method POST -Body $pickupData -ContentType "application/json" -TimeoutSec 15
    Write-Host "   OK - Pickup confirme" -ForegroundColor Green
    Write-Host "   Balance intermediaire: $($pickup.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Livraison avec desequilibre supplementaire
Write-Host "ETAPE 3: LIVRAISON PARTIELLE" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host "   Transporteur donne: 8 palettes" -ForegroundColor Cyan
Write-Host "   Destinataire recoit: 7 palettes" -ForegroundColor Cyan
Write-Host "   => 1 palette perdue en transit" -ForegroundColor Yellow

$deliveryData = @{
    quantity = 8
    palletType = "EURO_EPAL"
    givenByCarrier = 8
    receivedByRecipient = 7
    carrierId = "carrier_express"
    carrierName = "Express Transport"
    recipientId = "recipient_port"
    recipientName = "Port Commercial Bordeaux"
    recipientType = "destinataire"
    confirmedBy = "Sophie Durand (Reception)"
    notes = "1 palette cassee pendant transport"
} | ConvertTo-Json

try {
    $delivery = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/delivery" -Method POST -Body $deliveryData -ContentType "application/json" -TimeoutSec 15
    Write-Host "   OK - Livraison confirmee" -ForegroundColor Green
    Write-Host "   Balance finale: $($delivery.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Bilan final
Write-Host "ETAPE 4: BILAN FINAL" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow

try {
    $status = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/status" -Method GET -TimeoutSec 10

    Write-Host ""
    Write-Host "   +------------------------------------------+" -ForegroundColor White
    Write-Host "   |         RESUME ECHANGE PALETTES          |" -ForegroundColor White
    Write-Host "   +------------------------------------------+" -ForegroundColor White
    Write-Host ""
    Write-Host "   PICKUP (Marseille):" -ForegroundColor White
    Write-Host "      Expediteur a donne.....: $($status.tracking.pickup.givenBySender) palettes" -ForegroundColor Gray
    Write-Host "      Transporteur a pris....: $($status.tracking.pickup.takenByCarrier) palettes" -ForegroundColor Gray
    Write-Host "      Ecart pickup...........: $($status.tracking.pickup.takenByCarrier - $status.tracking.pickup.givenBySender)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   LIVRAISON (Bordeaux):" -ForegroundColor White
    Write-Host "      Transporteur a donne...: $($status.tracking.delivery.givenByCarrier) palettes" -ForegroundColor Gray
    Write-Host "      Destinataire a recu....: $($status.tracking.delivery.receivedByRecipient) palettes" -ForegroundColor Gray
    Write-Host "      Ecart livraison........: $($status.tracking.delivery.receivedByRecipient - $status.tracking.delivery.givenByCarrier)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   +------------------------------------------+" -ForegroundColor White

    $balance = $status.tracking.balance
    $settled = $status.tracking.settled

    if ($balance -eq 0) {
        Write-Host "   |  BALANCE: 0 - COMPTE SOLDE!             |" -ForegroundColor Green
    } elseif ($balance -gt 0) {
        Write-Host "   |  BALANCE: +$balance                            |" -ForegroundColor Blue
        Write-Host "   |  Le transporteur doit $balance palette(s)      |" -ForegroundColor Blue
    } else {
        Write-Host "   |  BALANCE: $balance                            |" -ForegroundColor Red
        Write-Host "   |  Le destinataire doit $([Math]::Abs($balance)) palette(s)    |" -ForegroundColor Red
    }

    Write-Host "   |  Status: $(if ($settled) { 'SOLDE' } else { 'EN LITIGE' })                        |" -ForegroundColor $(if ($settled) { "Green" } else { "Yellow" })
    Write-Host "   +------------------------------------------+" -ForegroundColor White

} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  FIN DU TEST" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
