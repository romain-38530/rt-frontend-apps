# 🔍 Service de Validation TVA/VIES - Spécifications Complètes

## 📋 Vue d'Ensemble

Service backend pour valider les numéros de TVA intracommunautaire (VIES) et enrichir les données entreprise via l'API INSEE.

---

## 🎯 Objectifs

1. **Validation automatique** des numéros TVA européens
2. **Enrichissement** des données entreprise (France)
3. **Cache intelligent** pour optimiser les performances
4. **API REST** simple pour les frontends

---

## 🏗️ Architecture Technique

### Stack Technologique
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** MongoDB Atlas (stagingrt)
- **Deployment:** AWS Elastic Beanstalk
- **APIs Externes:**
  - VIES (SOAP) - Commission Européenne
  - INSEE Sirene (REST) - France

### Endpoints Requis

```
POST   /api/vat/validate          - Valider un numéro TVA
GET    /api/vat/:number            - Récupérer info TVA cachée
POST   /api/vat/validate-siret     - Valider SIRET français
GET    /api/vat/company/:siret     - Récupérer données INSEE
GET    /api/health                 - Health check
```

---

## 📡 API VIES (Union Européenne)

### URL du Service
```
https://ec.europa.eu/taxation_customs/vies/services/checkVatService
```

### Format SOAP Request
```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <checkVat xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
      <countryCode>FR</countryCode>
      <vatNumber>12345678901</vatNumber>
    </checkVat>
  </soapenv:Body>
</soapenv:Envelope>
```

### Response Format
```xml
<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">
  <env:Body>
    <ns2:checkVatResponse xmlns:ns2="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
      <ns2:countryCode>FR</ns2:countryCode>
      <ns2:vatNumber>12345678901</ns2:vatNumber>
      <ns2:requestDate>2025-11-23+01:00</ns2:requestDate>
      <ns2:valid>true</ns2:valid>
      <ns2:name>SOCIETE EXEMPLE SAS</ns2:name>
      <ns2:address>123 RUE EXEMPLE, 75001 PARIS</ns2:address>
    </ns2:checkVatResponse>
  </env:Body>
</env:Envelope>
```

---

## 📡 API INSEE Sirene (France)

### URL du Service
```
https://api.insee.fr/entreprises/sirene/V3/siret/:siret
```

### Authentication
```
Authorization: Bearer <INSEE_API_TOKEN>
```

### Response Format
```json
{
  "header": {
    "statut": 200,
    "message": "OK"
  },
  "etablissement": {
    "siren": "123456789",
    "siret": "12345678901234",
    "dateCreationEtablissement": "2020-01-01",
    "uniteLegale": {
      "denominationUniteLegale": "SOCIETE EXEMPLE",
      "categorieJuridiqueUniteLegale": "5710",
      "activitePrincipaleUniteLegale": "62.01Z"
    },
    "adresseEtablissement": {
      "numeroVoieEtablissement": "123",
      "typeVoieEtablissement": "RUE",
      "libelleVoieEtablissement": "EXEMPLE",
      "codePostalEtablissement": "75001",
      "libelleCommuneEtablissement": "PARIS"
    }
  }
}
```

---

## 💾 MongoDB Schema

### Collection: vat_validations

```javascript
{
  _id: ObjectId,

  // Identification
  vatNumber: String,           // Numéro TVA complet (ex: FR12345678901)
  countryCode: String,         // Code pays (ex: FR)
  vatNumberClean: String,      // Numéro sans code pays

  // Validation VIES
  vies: {
    valid: Boolean,
    requestDate: Date,
    name: String,
    address: String,
    lastChecked: Date
  },

  // Données INSEE (France uniquement)
  insee: {
    siret: String,
    siren: String,
    denomination: String,
    formeJuridique: String,
    activitePrincipale: String,
    dateCreation: Date,
    adresse: {
      numero: String,
      typeVoie: String,
      libelleVoie: String,
      codePostal: String,
      ville: String
    },
    lastChecked: Date
  },

  // Métadonnées
  createdAt: Date,
  updatedAt: Date,
  validUntil: Date,            // Cache expiration (30 jours)
  validationCount: Number      // Nombre de validations
}
```

---

## 🚀 Déploiement

### Nom du Service
```
rt-vat-validation-api-prod
```

### URL Prévue
```
http://rt-vat-validation-api-prod.eba-XXXXXXXX.eu-central-1.elasticbeanstalk.com
```

### Configuration Amplify (à ajouter)
```
NEXT_PUBLIC_VAT_API_URL=http://rt-vat-validation-api-prod.eba-XXXXXXXX.eu-central-1.elasticbeanstalk.com
```

---

## 📝 État Actuel

✅ **Service développé et déployé** - Intégré dans authz API v2.0.0
✅ **Déployé sur AWS Elastic Beanstalk** - rt-authz-api-prod
✅ **Frontend configuré** - Connecté au service authz API
✅ **Tests validés** - Format et VIES API fonctionnels

## 🔧 Configuration Frontend (COMPLÉTÉE)

### Variables d'environnement ajoutées

**marketing-site/.env.production:**
```bash
NEXT_PUBLIC_VAT_API_URL=http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com
```

### Code mis à jour

✅ `apps/marketing-site/src/app/onboarding/page.tsx` - Utilise NEXT_PUBLIC_VAT_API_URL
✅ `apps/marketing-site/src/app/onboarding/page-improved.tsx` - Utilise NEXT_PUBLIC_VAT_API_URL

### Logique de fallback

Le code frontend supporte automatiquement:
1. **Service VAT dédié** (si NEXT_PUBLIC_VAT_API_URL est défini)
   - Endpoint: `/api/vat/validate`
   - Format de réponse: `{ valid: true, name: "...", address: "..." }`
2. **API générique** (fallback)
   - Endpoint: `/api/onboarding/verify-vat`
   - Format de réponse: `{ success: true, data: { companyName: "..." } }`

## 🚀 Déploiement Réalisé

### ✅ Service intégré dans authz API v2.0.0

Le service de validation TVA a été **intégré dans l'authz API existant** au lieu d'être déployé comme service séparé.

**URL du service:**
```
http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com
```

**Version:** 2.0.0
**Status:** ✅ Green (100% opérationnel)

### 📡 Endpoints disponibles

#### 1. Validation de format (rapide, sans appel externe)
```bash
POST /api/vat/validate-format
Body: { "vatNumber": "FR12345678901" }

# Réponse:
{
  "success": true,
  "valid": true,
  "countryCode": "FR",
  "vatNumber": "12345678901",
  "fullVatNumber": "FR12345678901"
}
```

#### 2. Validation complète VIES (appel API EU)
```bash
POST /api/vat/validate
Body: { "vatNumber": "FR12345678901" }

# Réponse:
{
  "success": true,
  "valid": true/false,
  "countryCode": "FR",
  "vatNumber": "12345678901",
  "requestDate": "2025-11-24T07:27:33.778Z",
  "companyName": "NOM ENTREPRISE",
  "companyAddress": "ADRESSE COMPLETE"
}
```

### 🌍 Pays supportés
27 pays de l'Union Européenne: AT, BE, BG, CY, CZ, DE, DK, EE, EL, ES, FI, FR, HR, HU, IE, IT, LT, LU, LV, MT, NL, PL, PT, RO, SE, SI, SK

### 🔧 Configuration AWS Amplify (à faire)

**Trouver l'App ID du marketing-site:**
```bash
aws amplify list-apps --region eu-central-1 | grep -i marketing
```

**Configurer la variable d'environnement:**
```bash
aws amplify update-app --app-id <APP_ID> \
  --environment-variables NEXT_PUBLIC_VAT_API_URL=http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com \
  --region eu-central-1
```

## ✅ Priorité

**COMPLÉTÉ** - Service déployé et fonctionnel

---

**Status:** 🎉 Service opérationnel (authz API v2.0.0)
**Effort restant:** ~5 minutes pour configurer AWS Amplify
**Prochaine étape:** Configurer NEXT_PUBLIC_VAT_API_URL dans AWS Amplify pour marketing-site
