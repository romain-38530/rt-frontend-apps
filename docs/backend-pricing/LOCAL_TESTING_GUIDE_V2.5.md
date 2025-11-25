# Guide de Test Local - Version 2.5.0

**Objectif**: Tester localement les nouvelles fonctionnalités Pricing Grids et Industrial Transport Config avant déploiement sur AWS Elastic Beanstalk.

**Date**: 2025-11-25
**Version cible**: v2.5.0

---

## 📋 Prérequis

### 1. Environnement Node.js

```bash
node --version  # v18.x ou supérieur requis
npm --version   # v9.x ou supérieur
```

### 2. MongoDB Local ou Atlas

**Option A: MongoDB Local (recommandé pour tests)**
```bash
# Installer MongoDB Community Edition
# Windows: https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Démarrer MongoDB
mongod --dbpath C:\data\db  # Windows
mongod --dbpath /usr/local/var/mongodb  # Mac/Linux

# Vérifier que MongoDB écoute sur port 27017
```

**Option B: MongoDB Atlas (production-like)**
- Utiliser la connexion string existante
- S'assurer que l'IP locale est whitelistée

### 3. Variables d'environnement

Créer `.env` à la racine du backend:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/rt-backend-test
# OU pour Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rt-backend

# JWT (existant)
JWT_SECRET=your-secret-key-for-local-testing
JWT_ISSUER=rt-technologie

# Stripe (optionnel pour ces tests)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Port
PORT=8080
```

---

## 🚀 Installation et Setup

### Étape 1: Copier les Nouveaux Fichiers

```bash
# Depuis le dossier du backend (subscriptions-contracts)

# Modèles
cp ../rt-frontend-apps/docs/backend-pricing/models/PricingGrids.js ./src/models/
cp ../rt-frontend-apps/docs/backend-pricing/models/IndustrialTransportConfig.js ./src/models/

# Routes
cp ../rt-frontend-apps/docs/backend-pricing/routes/pricing-grids.js ./src/routes/
cp ../rt-frontend-apps/docs/backend-pricing/routes/industrial-transport-config.js ./src/routes/
```

### Étape 2: Installer les Dépendances

```bash
# Pas de nouvelles dépendances pour v2.5.0 !
# Tout utilise les packages existants (mongoose, express, etc.)

# Si besoin, réinstaller toutes les dépendances
npm install
```

### Étape 3: Enregistrer les Routes

Modifier `src/index.js` ou `src/app.js`:

```javascript
// Après les routes existantes
const pricingGridsRoutes = require('./routes/pricing-grids');
const industrialTransportConfigRoutes = require('./routes/industrial-transport-config');

// Monter les routes
app.use('/api/pricing-grids', pricingGridsRoutes);
app.use('/api/industrial', industrialTransportConfigRoutes);

console.log('✅ Pricing Grids routes mounted on /api/pricing-grids');
console.log('✅ Industrial Transport Config routes mounted on /api/industrial');
```

### Étape 4: Démarrer le Serveur

```bash
# Mode développement
npm run dev

# OU mode production
npm start
```

**Sortie attendue**:
```
✅ MongoDB connected: rt-backend-test
✅ Pricing Grids routes mounted on /api/pricing-grids
✅ Industrial Transport Config routes mounted on /api/industrial
🚀 Server running on http://localhost:8080
```

---

## 🧪 Tests des Endpoints

### Test 1: Lister les Types de Transport

```bash
curl http://localhost:8080/api/pricing-grids/types/transport
```

**Résultat attendu**:
```json
{
  "success": true,
  "types": ["FTL", "LTL", "ADR", "FRIGO", "HAYON", "MESSAGERIE", "EXPRESS", "PALETTE", "VRAC", "BENNE"],
  "count": 10,
  "details": {
    "FTL": "Full Truck Load (complet)",
    "LTL": "Less Than Truck Load (groupage)",
    ...
  }
}
```

**✅ PASS** si count = 10 et tous les types sont présents.

---

### Test 2: Lister les Zones Géographiques

```bash
curl http://localhost:8080/api/pricing-grids/zones/list
```

**Résultat attendu**:
```json
{
  "success": true,
  "zones": {
    "IDF": "Île-de-France",
    "AURA": "Auvergne-Rhône-Alpes",
    ...
  },
  "count": 23,
  "categories": {
    "france": 13,
    "europe": 10
  }
}
```

**✅ PASS** si count = 23 (13 régions FR + 10 pays EU).

---

### Test 3: Lister les Options Tarifaires

```bash
curl http://localhost:8080/api/pricing-grids/options/list
```

**Résultat attendu**:
```json
{
  "success": true,
  "options": {
    "ADR": {
      "name": "ADR",
      "description": "Transport de matières dangereuses",
      "type": "percentage",
      "defaultValue": 25
    },
    "HAYON": {
      "name": "HAYON",
      "description": "Hayon élévateur",
      "type": "fixed",
      "defaultValue": 50
    },
    ...
  },
  "count": 9
}
```

**✅ PASS** si count = 9 et toutes les options sont présentes.

---

### Test 4: Créer une Grille Tarifaire (Authentifié)

**NOTE**: Ce test nécessite un token JWT valide.

#### Générer un token de test:

```bash
# Si vous avez le script generate-admin-token.js
node scripts/generate-admin-token.js carrier-1 carrier@test.com carrier

# OU créer un token manuellement
```

**Token de test** (expire dans 7 jours):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYXJyaWVyLTEiLCJlbWFpbCI6ImNhcnJpZXJAdGVzdC5jb20iLCJyb2xlIjoiY2FycmllciIsImNhcnJpZXJJZCI6ImNhcnJpZXItMSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwNjA0ODAwfQ.SIGNATURE
```

#### Créer la grille:

```bash
curl -X POST http://localhost:8080/api/pricing-grids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "gridName": "Tarif FTL National 2025",
    "description": "Grille tarifaire pour transport complet national",
    "transportType": "FTL",
    "calculationType": "PER_KM",
    "tiers": [
      {
        "minValue": 0,
        "maxValue": 100,
        "basePrice": 200,
        "unitPrice": 1.5
      },
      {
        "minValue": 100,
        "maxValue": 300,
        "basePrice": 300,
        "unitPrice": 1.2
      },
      {
        "minValue": 300,
        "maxValue": null,
        "basePrice": 500,
        "unitPrice": 1.0
      }
    ],
    "zones": [
      {
        "zone": "IDF",
        "priceMultiplier": 1.0,
        "fixedSupplement": 0,
        "estimatedDeliveryDays": 1
      },
      {
        "zone": "AURA",
        "priceMultiplier": 1.2,
        "fixedSupplement": 50,
        "estimatedDeliveryDays": 2
      }
    ],
    "options": [
      {
        "optionCode": "HAYON",
        "type": "fixed",
        "value": 50,
        "enabled": true
      },
      {
        "optionCode": "EXPRESS",
        "type": "percentage",
        "value": 30,
        "enabled": true
      }
    ],
    "minOrder": 100,
    "validFrom": "2025-01-01",
    "validUntil": "2025-12-31"
  }'
```

**Résultat attendu**:
```json
{
  "success": true,
  "grid": {
    "_id": "...",
    "gridName": "Tarif FTL National 2025",
    "carrierId": "carrier-1",
    "transportType": "FTL",
    "calculationType": "PER_KM",
    "status": "DRAFT",
    "tiers": [...],
    "zones": [...],
    "options": [...],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Grille tarifaire créée avec succès (statut: DRAFT)"
}
```

**✅ PASS** si status = "DRAFT" et gridName correct.

---

### Test 5: Activer la Grille

```bash
curl -X POST http://localhost:8080/api/pricing-grids/<GRID_ID>/activate \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Résultat attendu**:
```json
{
  "success": true,
  "grid": {
    "_id": "...",
    "status": "ACTIVE",
    ...
  },
  "message": "Grille tarifaire activée avec succès"
}
```

**✅ PASS** si status change de "DRAFT" à "ACTIVE".

---

### Test 6: Calculer un Prix

```bash
curl -X POST http://localhost:8080/api/pricing-grids/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "gridId": "<GRID_ID_FROM_TEST_4>",
    "request": {
      "originZone": "IDF",
      "destinationZone": "AURA",
      "distance": 450,
      "weight": 5000,
      "options": ["HAYON", "EXPRESS"]
    }
  }'
```

**Résultat attendu**:
```json
{
  "success": true,
  "gridId": "...",
  "gridName": "Tarif FTL National 2025",
  "transportType": "FTL",
  "calculationType": "PER_KM",
  "breakdown": {
    "basePrice": 950,
    "zoneModifier": 240,
    "optionsTotal": 407,
    "subtotal": 1190,
    "finalPrice": 1597,
    "currency": "EUR",
    "details": [
      {
        "label": "Prix de base (450 km)",
        "value": 950,
        "calculation": "500€ + (450 × 1.0€)"
      },
      {
        "label": "Zone Auvergne-Rhône-Alpes",
        "value": 240,
        "calculation": "950€ × 1.2 + 50€"
      },
      {
        "label": "Hayon élévateur",
        "value": 50,
        "calculation": "50€ fixe"
      },
      {
        "label": "Livraison express (<24h)",
        "value": 357,
        "calculation": "30%"
      }
    ]
  }
}
```

**✅ PASS** si le calcul est cohérent et finalPrice > 0.

**Vérification manuelle du calcul**:
- Base: 500€ + (450km × 1.0€) = 950€
- Zone AURA: 950€ × 1.2 + 50€ = 1190€
- Subtotal: 1190€
- Hayon: +50€ (fixe)
- Express: 1190€ × 30% = 357€
- **Total: 1190 + 50 + 357 = 1597€** ✅

---

### Test 7: Configuration Transport Industriel

#### Créer une configuration:

```bash
curl -X POST http://localhost:8080/api/industrial/industrial-123/transport-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "transportTypes": [
      {
        "transportType": "FTL",
        "isRequired": true,
        "priority": 10,
        "notes": "Essentiel pour nos livraisons"
      },
      {
        "transportType": "FRIGO",
        "isRequired": true,
        "priority": 8
      },
      {
        "transportType": "EXPRESS",
        "isRequired": false,
        "priority": 5
      }
    ],
    "mandatoryForCarriers": true,
    "autoRejectIncompatible": false,
    "notes": "Configuration pour l\'année 2025"
  }'
```

**Résultat attendu**:
```json
{
  "success": true,
  "config": {
    "industrialId": "industrial-123",
    "transportTypes": [...],
    "mandatoryForCarriers": true,
    "autoRejectIncompatible": false,
    ...
  },
  "message": "Configuration mise à jour avec succès",
  "changes": {
    "added": ["FTL", "FRIGO", "EXPRESS"],
    "removed": [],
    "modified": []
  }
}
```

**✅ PASS** si la configuration est créée avec 3 types.

---

### Test 8: Vérifier Compatibilité Transporteurs

```bash
curl http://localhost:8080/api/industrial/industrial-123/carriers/compatibility \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Résultat attendu**:
```json
{
  "success": true,
  "industrialId": "industrial-123",
  "configSummary": {
    "requiredTypes": ["FTL", "FRIGO"],
    "optionalTypes": ["EXPRESS"],
    "mandatoryForCarriers": true,
    "autoRejectIncompatible": false
  },
  "carriers": [
    {
      "carrierId": "carrier-1",
      "carrierName": "Transport Express SA",
      "isCompatible": true,
      "score": 100,
      "reason": "Compatible",
      "required": {
        "expected": ["FTL", "FRIGO"],
        "matching": ["FTL", "FRIGO"],
        "missing": []
      },
      "optional": {
        "expected": ["EXPRESS"],
        "matching": ["EXPRESS"]
      },
      "extra": ["ADR", "HAYON"],
      "recommendation": "Excellent match"
    },
    {
      "carrierId": "carrier-2",
      "carrierName": "Logistique Rapide",
      "isCompatible": false,
      "score": 50,
      "reason": "Types requis manquants: FRIGO",
      ...
    }
  ],
  "statistics": {
    "total": 4,
    "compatible": 2,
    "incompatible": 2,
    "compatibilityRate": 50,
    "averageScore": 68
  }
}
```

**✅ PASS** si les scores sont cohérents et compatibilityRate est calculé.

---

## ❌ Tests d'Erreurs Attendues

### Erreur 1: Créer Grille Sans Auth

```bash
curl -X POST http://localhost:8080/api/pricing-grids \
  -H "Content-Type: application/json" \
  -d '{"gridName":"Test"}'
```

**Attendu**: `401 Unauthorized` ou `403 Forbidden`

---

### Erreur 2: Calculer Prix avec Grille Inactive

```bash
# Créer une grille en DRAFT, puis essayer de calculer sans l'activer
curl -X POST http://localhost:8080/api/pricing-grids/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "gridId": "<DRAFT_GRID_ID>",
    "request": {"distance": 100}
  }'
```

**Attendu**:
```json
{
  "success": false,
  "message": "Cette grille tarifaire n'est pas active ou est expirée"
}
```

---

### Erreur 3: Ajouter Type Transport Invalide

```bash
curl -X POST http://localhost:8080/api/industrial/industrial-123/transport-config/add-type \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "transportType": "INVALID_TYPE"
  }'
```

**Attendu**:
```json
{
  "success": false,
  "message": "Type de transport invalide: INVALID_TYPE. Types valides: FTL, LTL, ADR, ..."
}
```

---

## 🔍 Vérification MongoDB

### Vérifier les Collections Créées

```bash
# Se connecter à MongoDB
mongosh rt-backend-test

# Lister les collections
show collections

# Devrait afficher:
# - pricing_grids
# - industrial_transport_configs
# (+ collections existantes)

# Compter les documents
db.pricing_grids.countDocuments()
db.industrial_transport_configs.countDocuments()

# Voir un exemple de document
db.pricing_grids.findOne()
db.industrial_transport_configs.findOne()
```

---

## 📊 Checklist de Validation

Avant de déployer sur EB, vérifier que **TOUS** les tests passent:

- [ ] ✅ Test 1: Types de transport (10 types)
- [ ] ✅ Test 2: Zones géographiques (23 zones)
- [ ] ✅ Test 3: Options tarifaires (9 options)
- [ ] ✅ Test 4: Création grille (status=DRAFT)
- [ ] ✅ Test 5: Activation grille (status=ACTIVE)
- [ ] ✅ Test 6: Calcul de prix (breakdown correct)
- [ ] ✅ Test 7: Configuration industriel
- [ ] ✅ Test 8: Compatibilité transporteurs
- [ ] ✅ Erreur 1: Auth requise (401/403)
- [ ] ✅ Erreur 2: Grille inactive (400)
- [ ] ✅ Erreur 3: Type invalide (400)
- [ ] ✅ MongoDB: Collections créées
- [ ] ✅ MongoDB: Index créés automatiquement
- [ ] ✅ Aucune erreur dans les logs serveur

---

## 🐛 Problèmes Courants

### Problème 1: "Cannot find module './models/PricingGrids'"

**Solution**: Vérifier que les fichiers sont bien copiés dans `src/models/`

```bash
ls -la src/models/PricingGrids.js
ls -la src/models/IndustrialTransportConfig.js
```

---

### Problème 2: "requireAuth is not a function"

**Cause**: Le middleware d'auth standard n'existe pas.

**Solution temporaire**: Créer un middleware simple:

```javascript
// src/middleware/auth.js
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token requis'
    });
  }

  // Pour les tests, on simule un utilisateur
  req.user = {
    id: 'test-user-1',
    email: 'test@example.com',
    role: 'carrier',
    carrierId: 'carrier-1'
  };

  next();
};

module.exports = { requireAuth };
```

---

### Problème 3: MongoDB Connection Failed

**Solution**:
```bash
# Vérifier que MongoDB tourne
mongo --eval "db.runCommand({ ping: 1 })"

# Vérifier l'URI dans .env
echo $MONGODB_URI

# Redémarrer MongoDB
# Windows: net start MongoDB
# Mac/Linux: brew services restart mongodb-community
```

---

## 🎯 Prochaine Étape

Si **TOUS les tests passent** ✅, vous pouvez procéder au déploiement:

```bash
# Créer le bundle pour EB
npm run build  # si applicable
zip -r app.zip . -x "*.git*" "node_modules/*" "*.env"

# Déployer
eb deploy
```

Si des tests échouent ❌, **NE PAS DÉPLOYER** et corriger les erreurs d'abord.

---

## 📝 Rapport de Test

Remplir ce rapport après les tests:

```
Date: ___________
Testeur: ___________

Résultats:
- Tests passés: ___ / 11
- Tests échoués: ___ / 11
- Erreurs identifiées: ___________

Collections MongoDB:
- pricing_grids: ___ documents
- industrial_transport_configs: ___ documents

Prêt pour déploiement: ☐ OUI  ☐ NON
Commentaires: ___________
```
