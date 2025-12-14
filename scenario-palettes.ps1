$baseUrl = "https://dh9acecfz0wg0.cloudfront.net/api/v1"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  SCENARIO COMPLET - ECHANGE PALETTES EUROPE" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Utiliser la commande existante creee avec 10 palettes
$orderId = "ord_35aac0a9-e40c-489e-b111-a8d581f1bb18"
$orderRef = "CMD-251211-090644811"

Write-Host "Commande utilisee: $orderRef" -ForegroundColor Gray
Write-Host "ID: $orderId" -ForegroundColor Gray
Write-Host "Palettes: 10 EURO EPAL" -ForegroundColor Gray
Write-Host ""

# Etape 1: Assigner un transporteur
Write-Host "ETAPE 1: Assignation du transporteur" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

$updateData = @{
    status = "carrier_accepted"
    carrierId = "carrier_nordtrans"
    carrierName = "NordTrans SARL"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/orders/$orderId" -Method PUT -Body $updateData -ContentType "application/json" -TimeoutSec 15
    Write-Host "   OK - Transporteur assigne: NordTrans SARL" -ForegroundColor Green
} catch {
    Write-Host "   Info: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Etape 2: Verifier le status initial des palettes
Write-Host "ETAPE 2: Status initial des palettes" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

try {
    $status = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/status" -Method GET -TimeoutSec 15
    Write-Host "   Tracking active: $($status.tracking.enabled)" -ForegroundColor Gray
    if ($status.tracking.pickup) {
        Write-Host "   Pickup: Deja confirme" -ForegroundColor Yellow
    } else {
        Write-Host "   Pickup: En attente de confirmation" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Etape 3: Confirmation du pickup
Write-Host "ETAPE 3: PICKUP - Expediteur donne 10 palettes au transporteur" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "   Scenario: L'expediteur ACME donne 10 palettes EURO EPAL" -ForegroundColor Cyan
Write-Host "             Le transporteur NordTrans en prend 10" -ForegroundColor Cyan
Write-Host ""

$pickupData = @{
    quantity = 10
    palletType = "EURO_EPAL"
    givenBySender = 10
    takenByCarrier = 10
    senderId = "supplier_acme"
    senderName = "Expediteur ACME"
    senderType = "expediteur"
    carrierId = "carrier_nordtrans"
    carrierName = "NordTrans SARL"
    confirmedBy = "Jean Dupont (Chauffeur)"
    notes = "Palettes en bon etat, confirmees par les deux parties"
} | ConvertTo-Json

try {
    $pickup = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/pickup" -Method POST -Body $pickupData -ContentType "application/json" -TimeoutSec 15
    Write-Host "   OK - Pickup confirme!" -ForegroundColor Green
    Write-Host "   Cheque palette emis" -ForegroundColor Gray
    if ($pickup.balance -ne $null) {
        Write-Host "   Balance intermediaire: $($pickup.balance)" -ForegroundColor Cyan
    }
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "   HTTP $statusCode" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "   $body" -ForegroundColor Red
    } catch {}
}

Write-Host ""

# Etape 4: Verifier le status apres pickup
Write-Host "ETAPE 4: Status apres pickup" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

try {
    $status = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/status" -Method GET -TimeoutSec 15
    Write-Host "   Tracking active: $($status.tracking.enabled)" -ForegroundColor Gray
    if ($status.tracking.pickup) {
        Write-Host "   Pickup confirme:" -ForegroundColor Green
        Write-Host "      - Donnees par expediteur: $($status.tracking.pickup.givenBySender)" -ForegroundColor Gray
        Write-Host "      - Prises par transporteur: $($status.tracking.pickup.takenByCarrier)" -ForegroundColor Gray
        Write-Host "      - Type: $($status.tracking.pickup.palletType)" -ForegroundColor Gray
        Write-Host "      - Confirme par: $($status.tracking.pickup.confirmedBy)" -ForegroundColor Gray
    }
    if ($status.tracking.balance -ne $null) {
        Write-Host "   Balance actuelle: $($status.tracking.balance)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Etape 5: Simuler transit et arrivee livraison
Write-Host "ETAPE 5: Transit vers destination" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Yellow

try {
    $transitData = @{ status = "in_transit"; carrierNotes = "Depart Lyon vers Paris" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/orders/$orderId" -Method PUT -Body $transitData -ContentType "application/json" -TimeoutSec 15 | Out-Null
    Write-Host "   OK - En transit Lyon -> Paris..." -ForegroundColor Green

    Start-Sleep -Seconds 1

    $arriveData = @{ status = "arrived_delivery"; carrierNotes = "Arrive a Paris" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/orders/$orderId" -Method PUT -Body $arriveData -ContentType "application/json" -TimeoutSec 15 | Out-Null
    Write-Host "   OK - Arrive chez destinataire BETA (Paris)!" -ForegroundColor Green
} catch {
    Write-Host "   Info: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Etape 6: Confirmation de la livraison
Write-Host "ETAPE 6: LIVRAISON - Transporteur donne 10 palettes au destinataire" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "   Scenario: Le transporteur NordTrans donne 10 palettes" -ForegroundColor Cyan
Write-Host "             Le destinataire BETA en recoit 10" -ForegroundColor Cyan
Write-Host ""

$deliveryData = @{
    quantity = 10
    palletType = "EURO_EPAL"
    givenByCarrier = 10
    receivedByRecipient = 10
    carrierId = "carrier_nordtrans"
    carrierName = "NordTrans SARL"
    recipientId = "recipient_beta"
    recipientName = "Destinataire BETA"
    recipientType = "destinataire"
    confirmedBy = "Marie Martin (Responsable reception)"
    notes = "Toutes les palettes recues en bon etat"
} | ConvertTo-Json

try {
    $delivery = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/delivery" -Method POST -Body $deliveryData -ContentType "application/json" -TimeoutSec 15
    Write-Host "   OK - Livraison confirmee!" -ForegroundColor Green
    if ($delivery.balance -ne $null) {
        Write-Host "   Balance finale: $($delivery.balance)" -ForegroundColor Cyan
    }
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "   HTTP $statusCode" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "   $body" -ForegroundColor Red
    } catch {}
}

Write-Host ""

# Etape 7: Status final complet
Write-Host "ETAPE 7: BILAN FINAL" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow
Write-Host ""

try {
    $status = Invoke-RestMethod -Uri "$baseUrl/palettes/$orderId/status" -Method GET -TimeoutSec 15

    Write-Host "   +------------------------------------------+" -ForegroundColor White
    Write-Host "   |    RESUME ECHANGE PALETTES $orderRef    |" -ForegroundColor White
    Write-Host "   +------------------------------------------+" -ForegroundColor White
    Write-Host ""

    if ($status.tracking.pickup) {
        Write-Host "   CHARGEMENT (Lyon - ACME):" -ForegroundColor White
        Write-Host "   -------------------------" -ForegroundColor Gray
        Write-Host "      Expediteur a donne.....: $($status.tracking.pickup.givenBySender) palettes" -ForegroundColor Gray
        Write-Host "      Transporteur a pris....: $($status.tracking.pickup.takenByCarrier) palettes" -ForegroundColor Gray
        Write-Host "      Type...................: $($status.tracking.pickup.palletType)" -ForegroundColor Gray
        Write-Host "      Confirme par...........: $($status.tracking.pickup.confirmedBy)" -ForegroundColor Gray
    }

    if ($status.tracking.delivery) {
        Write-Host ""
        Write-Host "   LIVRAISON (Paris - BETA):" -ForegroundColor White
        Write-Host "   --------------------------" -ForegroundColor Gray
        Write-Host "      Transporteur a donne...: $($status.tracking.delivery.givenByCarrier) palettes" -ForegroundColor Gray
        Write-Host "      Destinataire a recu....: $($status.tracking.delivery.receivedByRecipient) palettes" -ForegroundColor Gray
        Write-Host "      Status.................: $($status.tracking.delivery.status)" -ForegroundColor Gray
        Write-Host "      Confirme par...........: $($status.tracking.delivery.confirmedBy)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "   +------------------------------------------+" -ForegroundColor White

    $balance = $status.tracking.balance
    if ($balance -eq 0) {
        Write-Host "   |  BALANCE: 0 - COMPTE SOLDE!             |" -ForegroundColor Green
        Write-Host "   |  Echange equilibre, aucune dette.       |" -ForegroundColor Green
    } elseif ($balance -gt 0) {
        Write-Host "   |  BALANCE: +$balance                            |" -ForegroundColor Blue
        Write-Host "   |  Le transporteur doit $balance palette(s)      |" -ForegroundColor Blue
    } else {
        Write-Host "   |  BALANCE: $balance                            |" -ForegroundColor Red
        Write-Host "   |  Le destinataire doit $([Math]::Abs($balance)) palette(s)    |" -ForegroundColor Red
    }

    Write-Host "   +------------------------------------------+" -ForegroundColor White

} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  FIN DU SCENARIO" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
