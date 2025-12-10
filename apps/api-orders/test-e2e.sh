#!/bin/bash
# Test end-to-end du processus de dispatch SYMPHONI.A
# Tests contre l'API production

API_URL="${1:-http://rt-orders-api-prod-v2.eba-4tprbbqu.eu-central-1.elasticbeanstalk.com}"

echo "=== Test E2E SYMPHONI.A Orders API ==="
echo "URL: $API_URL"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

# 1. Test Health Check
info "Test 1: Health Check"
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  pass "API Health OK"
else
  fail "API Health Check failed"
  echo "$HEALTH"
fi

# 2. Test API Root
info "Test 2: API Root (endpoints list)"
ROOT=$(curl -s "$API_URL/")
if echo "$ROOT" | grep -q '"carrierPortal"'; then
  pass "API Root contains carrierPortal endpoints"
else
  fail "carrierPortal endpoints missing"
fi

# 3. Créer une commande test
info "Test 3: Création de commande"
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST-E2E-'$(date +%s)'",
    "pickupAddress": {
      "street": "123 Rue de Test",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    },
    "deliveryAddress": {
      "street": "456 Avenue Test",
      "city": "Lyon",
      "postalCode": "69001",
      "country": "France"
    },
    "dates": {
      "pickupDate": "'$(date -d "+2 days" +%Y-%m-%d 2>/dev/null || date -v+2d +%Y-%m-%d)'",
      "deliveryDate": "'$(date -d "+3 days" +%Y-%m-%d 2>/dev/null || date -v+3d +%Y-%m-%d)'"
    },
    "goods": {
      "description": "Marchandises test E2E",
      "weight": 500,
      "quantity": 10
    },
    "industrialId": "ind_test_e2e",
    "createdBy": "test_script"
  }')

ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
if [ -n "$ORDER_ID" ]; then
  pass "Commande créée: $ORDER_ID"
else
  fail "Création de commande échouée"
  echo "$ORDER_RESPONSE"
fi

# 4. Test liste des lanes
info "Test 4: Liste des lanes"
LANES=$(curl -s "$API_URL/api/v1/lanes")
LANES_COUNT=$(echo "$LANES" | grep -o '"count":[0-9]*' | cut -d':' -f2)
if [ -n "$LANES_COUNT" ]; then
  pass "Lanes récupérées: $LANES_COUNT"
else
  fail "Récupération lanes échouée"
fi

# 5. Test statistiques dispatch
info "Test 5: Statistiques dispatch"
STATS=$(curl -s "$API_URL/api/v1/dispatch/stats")
if echo "$STATS" | grep -q '"success":true'; then
  pass "Statistiques dispatch OK"
  echo "  Total chains: $(echo "$STATS" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)"
else
  fail "Statistiques dispatch échouées"
fi

# 6. Test dashboard dispatch
info "Test 6: Dashboard dispatch"
DASHBOARD=$(curl -s "$API_URL/api/v1/dispatch/dashboard")
if echo "$DASHBOARD" | grep -q '"success":true'; then
  pass "Dashboard dispatch OK"
else
  fail "Dashboard dispatch échoué"
fi

# 7. Test scoring stats
info "Test 7: Scoring stats"
SCORING=$(curl -s "$API_URL/api/v1/scoring/stats?industrialId=ind_test_e2e")
if echo "$SCORING" | grep -q '"success":true'; then
  pass "Scoring stats OK"
else
  fail "Scoring stats échoué"
fi

# 8. Test carrier portal - pending (should return empty for test carrier)
info "Test 8: Carrier Portal - demandes en attente"
PENDING=$(curl -s "$API_URL/api/v1/carrier-portal/pending?carrierId=carrier_test")
if echo "$PENDING" | grep -q '"success":true'; then
  pass "Carrier Portal pending OK"
else
  fail "Carrier Portal pending échoué"
fi

# 9. Test archive stats
info "Test 9: Archive stats"
ARCHIVE=$(curl -s "$API_URL/api/v1/archive/stats?industrialId=ind_test_e2e")
if echo "$ARCHIVE" | grep -q '"success":true'; then
  pass "Archive stats OK"
else
  fail "Archive stats échoué"
fi

# 10. Test dispatch auto (si commande créée)
if [ -n "$ORDER_ID" ]; then
  info "Test 10: Dispatch auto"
  DISPATCH=$(curl -s -X POST "$API_URL/api/v1/dispatch/auto/$ORDER_ID")
  if echo "$DISPATCH" | grep -q '"success":true'; then
    pass "Dispatch auto lancé"
    CHAIN_ID=$(echo "$DISPATCH" | grep -o '"chainId":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$CHAIN_ID" ]; then
      echo "  Chain ID: $CHAIN_ID"
    fi
  else
    info "Dispatch auto: pas de lane (normal si aucune lane Paris→Lyon)"
    echo "  Message: $(echo "$DISPATCH" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
  fi
fi

# 11. Cleanup - supprimer la commande test
if [ -n "$ORDER_ID" ]; then
  info "Cleanup: Suppression commande test"
  DELETE=$(curl -s -X DELETE "$API_URL/api/v1/orders/$ORDER_ID")
  if echo "$DELETE" | grep -q '"success":true'; then
    pass "Commande test supprimée"
  else
    info "Commande non supprimée (normal si statut != draft)"
  fi
fi

echo ""
echo "=== Tests terminés ==="
