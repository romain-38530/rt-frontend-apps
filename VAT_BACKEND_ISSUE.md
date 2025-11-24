# 🐛 Problème Backend - API Validation TVA

## Résumé

L'API de validation TVA retourne **toujours `valid: false`** pour tous les numéros TVA testés, même pour des numéros valides.

## Tests Effectués

### Test 1 : FR21350675567
```bash
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/vat/validate \
  -H "Content-Type: application/json" \
  -d '{"vatNumber":"FR21350675567"}'
```

**Résultat:**
```json
{
  "success": true,
  "valid": false,
  "countryCode": "FR",
  "vatNumber": "21350675567",
  "requestDate": "2025-11-24T15:01:19.374Z",
  "companyName": "---",
  "companyAddress": "---"
}
```

### Test 2 : FR60408843661 (Apple France - devrait être valide)
```bash
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/vat/validate \
  -H "Content-Type: application/json" \
  -d '{"vatNumber":"FR60408843661"}'
```

**Résultat:**
```json
{
  "success": true,
  "valid": false,
  "countryCode": "FR",
  "vatNumber": "60408843661",
  "requestDate": "2025-11-24T15:02:26.725Z",
  "companyName": "---",
  "companyAddress": "---"
}
```

## Analyse

### Comportement actuel
- `success: true` - L'API répond sans erreur technique
- `valid: false` - Tous les numéros sont marqués comme invalides
- `companyName: "---"` - Pas de données récupérées
- `companyAddress: "---"` - Pas de données récupérées

### Comportement attendu
Pour un numéro TVA valide comme FR60408843661 :
- `success: true` - L'API répond sans erreur
- `valid: true` - Le numéro est valide dans VIES
- `companyName: "APPLE FRANCE"` - Nom de l'entreprise
- `companyAddress: "7 PLACE D ITV..."` - Adresse complète

## Causes possibles

1. **Service VIES indisponible** - L'API européenne VIES peut être temporairement down
2. **Configuration SOAP incorrecte** - Les requêtes SOAP vers VIES ne sont pas correctement formatées
3. **Timeout trop court** - Les appels VIES peuvent prendre du temps
4. **Erreur silencieuse** - Les erreurs VIES sont catchées mais retournent des valeurs par défaut
5. **Clés/credentials manquantes** - Si VIES requiert une authentification

## Code à vérifier

Dans `rt-backend-services/authz-eb` :

1. **Fichier de validation TVA** (probablement dans `routes/vat.js` ou `controllers/vat.js`)
   - Vérifier la construction de la requête SOAP vers VIES
   - Vérifier la gestion des erreurs
   - Vérifier les timeouts

2. **Logs serveur**
   - Consulter les logs Elastic Beanstalk pour voir les erreurs VIES
   - Chercher des erreurs de connexion ou de timeout

3. **URL VIES**
   - Confirmer que l'URL est correcte : `https://ec.europa.eu/taxation_customs/vies/services/checkVatService`
   - Vérifier que le serveur peut accéder à cette URL (pas de firewall bloquant)

## Impact utilisateur

### Avant correction frontend
- ✅ Utilisateur entre un numéro TVA
- ❌ API retourne `valid: false` avec données vides
- ❌ Frontend acceptait quand même (`success: true`)
- ❌ Utilisateur passait à l'étape 2 avec formulaire vide

### Après correction frontend (commit 5d21163)
- ✅ Utilisateur entre un numéro TVA
- ❌ API retourne `valid: false`
- ✅ Frontend rejette la validation
- ✅ Utilisateur voit "Numéro de TVA invalide"
- ✅ Utilisateur reste sur l'étape 1

## Action requise

L'équipe backend doit :
1. Vérifier les logs de l'API authz lors d'une requête `/api/vat/validate`
2. Vérifier que les appels VIES fonctionnent correctement
3. Tester avec des numéros TVA connus comme valides (ex: FR60408843661)
4. S'assurer que les données `companyName` et `companyAddress` sont correctement extraites de la réponse VIES

## URL du service

- **CloudFront HTTPS:** https://d2i50a1vlg138w.cloudfront.net
- **Elastic Beanstalk HTTP:** http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com
- **Endpoint:** POST /api/vat/validate

## Documentation VIES

API officielle : https://ec.europa.eu/taxation_customs/vies/technicalInformation.html

Exemple de requête SOAP :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <checkVat xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
      <countryCode>FR</countryCode>
      <vatNumber>60408843661</vatNumber>
    </checkVat>
  </soapenv:Body>
</soapenv:Envelope>
```

---

**Date:** 2025-11-24
**Severity:** HIGH - Bloqueur pour l'onboarding des clients
**Priority:** P1 - À résoudre immédiatement
