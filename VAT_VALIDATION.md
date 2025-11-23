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

❌ **Service NON déployé**
❌ **Promesse marketing non tenue**
❌ **Onboarding automatisé non fonctionnel**

## 🔴 Priorité

**HAUTE** - Fonctionnalité promise dans le marketing

---

**Status:** 📋 Spécifications complètes
**Effort:** ~3-5 jours de développement
**Prochaine étape:** Créer le repository backend et implémenter
