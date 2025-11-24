# Backend Implementation Guide - Account Types System

**Date**: 2025-11-24
**Service Name**: `account-management-eb`
**Version**: 1.0.0

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [MongoDB Schemas](#mongodb-schemas)
4. [API Endpoints](#api-endpoints)
5. [Logique Métier](#logique-métier)
6. [Déploiement](#déploiement)
7. [Tests](#tests)

---

## 🎯 Vue d'ensemble

### Objectif

Gérer le système de types de comptes pour la plateforme RT Technologie. Après qu'un client ait signé son contrat et souscrit à son abonnement, il doit sélectionner son type de compte qui déterminera :
- Son portail dédié
- Ses permissions
- Ses fonctionnalités disponibles

### Types de Comptes

#### Types Créables Directement (4)
1. **Industry** (Industriel) - Génère des commandes
2. **Transporter** (Transporteur) - Accepte des missions
3. **Logistician** (Logisticien) - Gère les entrepôts (PWA)
4. **Forwarder** (Transitaire) - Coordonne multi-modal

#### Types Non-Créables Directement (2)
5. **Supplier** (Fournisseur) - Suit uniquement les commandes
6. **Recipient** (Destinataire) - Suit uniquement les commandes

**Important** : Les types Supplier et Recipient sont créés automatiquement par les Industriels lors de la création de commandes. Cependant, ils peuvent **évoluer** vers un compte Industry s'ils souhaitent également générer des commandes.

---

## 🏗️ Architecture

### Services RT Technologie Existants

```
Frontend (Next.js)
    ↓
AWS Amplify
    ↓
┌────────────────┬────────────────┬─────────────────┐
↓                ↓                ↓                 ↓
authz-eb         subscriptions    [NEW] account-   Autres
v2.2.0           v1.0.0           management-eb    services
(VAT+Pricing)    (Abonnements)    v1.0.0
    ↓                ↓                ↓
VIES APIs        MongoDB Atlas    MongoDB Atlas
```

### Infrastructure Recommandée

- **Service**: AWS Elastic Beanstalk (Node.js 20)
- **Base de données**: MongoDB Atlas (même cluster que subscriptions)
- **CDN**: AWS CloudFront (HTTPS)
- **Région**: eu-central-1 (Frankfurt)

### URL Cible

```
https://[distribution-id].cloudfront.net
```

Variable d'environnement frontend :
```bash
NEXT_PUBLIC_ACCOUNT_API_URL=https://[votre-cloudfront-id].cloudfront.net
```

---

## 💾 MongoDB Schemas

### Collection : `users`

Cette collection gère les comptes utilisateurs complets.

```javascript
{
  _id: ObjectId,
  userId: String,              // ID unique (UUID recommandé)
  email: String,               // Email unique
  firstName: String,
  lastName: String,
  phone: String,

  // Données entreprise
  company: {
    vatNumber: String,         // Numéro TVA validé
    name: String,              // Nom entreprise
    address: String,           // Adresse complète
    countryCode: String        // Code pays (FR, BE, etc.)
  },

  // Type de compte et statut
  accountType: String,         // 'industry' | 'transporter' | 'logistician' | 'forwarder' | 'supplier' | 'recipient' | null
  accountStatus: String,       // 'pending_selection' | 'active' | 'suspended' | 'expired'

  // Abonnement (référence à la collection subscriptions)
  subscription: {
    id: String,
    planId: String,
    planName: String,
    status: String,            // 'active' | 'cancelled' | 'expired'
    startDate: Date,
    endDate: Date,
    price: Number,
    currency: String
  },

  // Contrat (référence à la collection contracts)
  contract: {
    id: String,
    signedAt: Date,
    signatureId: String,
    documentUrl: String
  },

  // Permissions (array calculé selon accountType)
  permissions: [String],       // ['create_orders', 'manage_palettes', etc.]

  // Historique d'évolution de compte
  accountHistory: [
    {
      previousType: String,
      newType: String,
      upgradedAt: Date,
      reason: String
    }
  ],

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

**Index recommandés** :
```javascript
db.users.createIndex({ userId: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ accountType: 1 });
db.users.createIndex({ accountStatus: 1 });
db.users.createIndex({ "company.vatNumber": 1 });
```

### Collection : `account_types`

Cette collection contient la configuration de chaque type de compte (optionnelle - peut être hardcodée dans le backend).

```javascript
{
  _id: ObjectId,
  type: String,                // 'industry' | 'transporter' | etc.
  displayName: String,         // 'Industriel'
  description: String,
  features: [String],
  portalUrl: String,           // URL du portail AWS Amplify
  amplifyAppId: String,
  canGenerateOrders: Boolean,
  isDirectlyCreatable: Boolean,
  permissions: [String],
  icon: String,

  createdAt: Date,
  updatedAt: Date
}
```

**Configuration des Portals** :
```javascript
const PORTAL_URLS = {
  industry: 'https://main.dbg6okncuyyiw.amplifyapp.com',
  transporter: 'https://main.d1tb834u144p4r.amplifyapp.com',
  logistician: 'https://main.d3hz3xvddrl94o.amplifyapp.com',
  forwarder: 'https://main.dzvo8973zaqb.amplifyapp.com',
  supplier: 'https://main.d3b6p09ihn5w7r.amplifyapp.com',
  recipient: 'https://main.d3b6p09ihn5w7r.amplifyapp.com'
};
```

---

## 🔌 API Endpoints

### 1. GET `/health`

Health check pour le service.

**Response** :
```json
{
  "status": "healthy",
  "service": "account-management",
  "version": "1.0.0",
  "mongodb": {
    "connected": true,
    "status": "active"
  }
}
```

---

### 2. GET `/api/account-types/available`

Récupère la liste des types de comptes disponibles.

**Query Parameters** :
- `userId` (optional) : Si fourni, retourne aussi le type actuel de l'utilisateur

**Response** :
```json
{
  "types": [
    {
      "type": "industry",
      "displayName": "Industriel",
      "description": "Créez et gérez vos commandes de transport en toute autonomie",
      "features": [
        "Créer des commandes de transport",
        "Gérer les palettes et stocks",
        "Analytics et rapports avancés",
        "Gestion de contrats transporteurs",
        "Suivi en temps réel"
      ],
      "portalUrl": "https://main.dbg6okncuyyiw.amplifyapp.com",
      "amplifyAppId": "dbg6okncuyyiw",
      "canGenerateOrders": true,
      "isDirectlyCreatable": true,
      "permissions": ["create_orders", "manage_palettes", "view_analytics", "manage_contracts"],
      "icon": "🏭"
    },
    // ... autres types
  ],
  "currentType": "supplier",  // Type actuel de l'utilisateur (si userId fourni)
  "canCreate": ["industry", "transporter", "logistician", "forwarder"],
  "canUpgradeTo": ["industry"]  // Types accessibles par upgrade
}
```

**Logique** :
- Retourner tous les types avec `isDirectlyCreatable: true` dans `canCreate`
- Si `userId` fourni, récupérer le type actuel depuis MongoDB
- Calculer `canUpgradeTo` selon les règles métier (voir section Logique Métier)

---

### 3. POST `/api/account/select-type`

Sélectionne le type de compte initial pour un utilisateur.

**Request Body** :
```json
{
  "userId": "user-uuid-123",
  "accountType": "industry"
}
```

**Validations** :
1. ✅ userId existe dans la base de données
2. ✅ accountType est un type valide et directement créable
3. ✅ L'utilisateur n'a pas déjà un accountType (accountType === null)
4. ✅ L'utilisateur a un contrat signé et un abonnement actif

**Response Success** :
```json
{
  "success": true,
  "user": {
    "userId": "user-uuid-123",
    "email": "user@example.com",
    "accountType": "industry",
    "accountStatus": "active",
    "permissions": ["create_orders", "manage_palettes", "view_analytics", "manage_contracts"]
  },
  "portalUrl": "https://main.dbg6okncuyyiw.amplifyapp.com",
  "redirectUrl": "https://main.dbg6okncuyyiw.amplifyapp.com?userId=user-uuid-123",
  "message": "Type de compte sélectionné avec succès"
}
```

**Response Error** :
```json
{
  "success": false,
  "message": "L'utilisateur a déjà un type de compte défini"
}
```

**Logique Backend** :
```javascript
// Pseudo-code
async function selectAccountType(userId, accountType) {
  // 1. Vérifier que le type est créable directement
  if (!['industry', 'transporter', 'logistician', 'forwarder'].includes(accountType)) {
    throw new Error('Ce type de compte ne peut pas être créé directement');
  }

  // 2. Récupérer l'utilisateur
  const user = await db.users.findOne({ userId });
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  // 3. Vérifier qu'il n'a pas déjà un type
  if (user.accountType !== null) {
    throw new Error('L\'utilisateur a déjà un type de compte défini');
  }

  // 4. Vérifier contrat + abonnement
  if (!user.contract || !user.subscription || user.subscription.status !== 'active') {
    throw new Error('Contrat ou abonnement manquant');
  }

  // 5. Calculer les permissions selon le type
  const permissions = getPermissionsForType(accountType);

  // 6. Mettre à jour l'utilisateur
  await db.users.updateOne(
    { userId },
    {
      $set: {
        accountType,
        accountStatus: 'active',
        permissions,
        updatedAt: new Date()
      }
    }
  );

  // 7. Construire la réponse
  const portalUrl = PORTAL_URLS[accountType];
  return {
    success: true,
    user: { ...user, accountType, accountStatus: 'active', permissions },
    portalUrl,
    redirectUrl: `${portalUrl}?userId=${userId}`
  };
}
```

---

### 4. POST `/api/account/check-eligibility`

Vérifie si un utilisateur peut évoluer vers un type de compte.

**Request Body** :
```json
{
  "userId": "user-uuid-123",
  "desiredType": "industry"
}
```

**Response Success** :
```json
{
  "eligible": true,
  "reasons": [
    "Votre compte Fournisseur peut évoluer vers Industriel",
    "Vous avez un abonnement actif"
  ],
  "requiredSteps": []
}
```

**Response Not Eligible** :
```json
{
  "eligible": false,
  "reasons": [
    "Votre compte Transporteur ne peut pas évoluer vers Industriel"
  ],
  "requiredSteps": [
    "Contacter le support pour obtenir un nouveau compte"
  ]
}
```

**Logique Backend** :
```javascript
async function checkEligibility(userId, desiredType) {
  const user = await db.users.findOne({ userId });
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  const fromType = user.accountType;
  const reasons = [];
  const requiredSteps = [];

  // Règle métier : Supplier/Recipient peuvent évoluer vers Industry
  if ((fromType === 'supplier' || fromType === 'recipient') && desiredType === 'industry') {
    // Vérifier l'abonnement
    if (!user.subscription || user.subscription.status !== 'active') {
      return {
        eligible: false,
        reasons: ['Vous devez avoir un abonnement actif'],
        requiredSteps: ['Souscrire ou renouveler votre abonnement']
      };
    }

    return {
      eligible: true,
      reasons: [
        `Votre compte ${fromType === 'supplier' ? 'Fournisseur' : 'Destinataire'} peut évoluer vers Industriel`,
        'Vous avez un abonnement actif'
      ],
      requiredSteps: []
    };
  }

  // Autres cas : pas d'évolution possible
  return {
    eligible: false,
    reasons: [`Votre compte ${fromType} ne peut pas évoluer vers ${desiredType}`],
    requiredSteps: ['Contacter le support pour obtenir un nouveau compte']
  };
}
```

---

### 5. POST `/api/account/upgrade`

Effectue l'évolution du compte d'un utilisateur.

**Request Body** :
```json
{
  "userId": "user-uuid-123",
  "fromType": "supplier",
  "toType": "industry",
  "reason": "J'ai besoin de générer mes propres commandes car mon activité a augmenté"
}
```

**Validations** :
1. ✅ userId existe
2. ✅ fromType correspond au type actuel de l'utilisateur
3. ✅ L'évolution fromType → toType est autorisée
4. ✅ L'utilisateur a un abonnement actif
5. ✅ reason est fourni (minimum 10 caractères)

**Response Success** :
```json
{
  "success": true,
  "newAccountType": "industry",
  "newPermissions": ["create_orders", "manage_palettes", "view_analytics", "manage_contracts"],
  "newPortalUrl": "https://main.dbg6okncuyyiw.amplifyapp.com",
  "message": "Votre compte a été évolué avec succès vers Industriel"
}
```

**Response Error** :
```json
{
  "success": false,
  "message": "Cette évolution n'est pas autorisée"
}
```

**Logique Backend** :
```javascript
async function upgradeAccount(userId, fromType, toType, reason) {
  // 1. Vérifier l'utilisateur
  const user = await db.users.findOne({ userId });
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  // 2. Vérifier que fromType correspond
  if (user.accountType !== fromType) {
    throw new Error('Le type de compte actuel ne correspond pas');
  }

  // 3. Vérifier l'éligibilité
  const eligibility = await checkEligibility(userId, toType);
  if (!eligibility.eligible) {
    throw new Error('Cette évolution n\'est pas autorisée');
  }

  // 4. Calculer les nouvelles permissions
  const newPermissions = getPermissionsForType(toType);

  // 5. Créer l'entrée d'historique
  const historyEntry = {
    previousType: fromType,
    newType: toType,
    upgradedAt: new Date(),
    reason
  };

  // 6. Mettre à jour l'utilisateur
  await db.users.updateOne(
    { userId },
    {
      $set: {
        accountType: toType,
        permissions: newPermissions,
        updatedAt: new Date()
      },
      $push: {
        accountHistory: historyEntry
      }
    }
  );

  // 7. Retourner la réponse
  const newPortalUrl = PORTAL_URLS[toType];
  return {
    success: true,
    newAccountType: toType,
    newPermissions,
    newPortalUrl,
    message: `Votre compte a été évolué avec succès vers ${getDisplayName(toType)}`
  };
}
```

---

### 6. GET `/api/account/info`

Récupère les informations complètes d'un compte utilisateur.

**Query Parameters** :
- `userId` (required)

**Response** :
```json
{
  "user": {
    "userId": "user-uuid-123",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+33612345678",
    "company": {
      "vatNumber": "FR12345678901",
      "name": "Ma Société SARL",
      "address": "123 Rue de Paris, 75001 Paris",
      "countryCode": "FR"
    },
    "accountType": "industry",
    "accountStatus": "active",
    "subscription": {
      "id": "sub-123",
      "planId": "plan-industry",
      "planName": "Industry Pro",
      "status": "active",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2026-01-01T00:00:00.000Z",
      "price": 99,
      "currency": "EUR"
    },
    "contract": {
      "id": "contract-123",
      "signedAt": "2025-01-01T00:00:00.000Z",
      "signatureId": "sig-123",
      "documentUrl": "https://s3.amazonaws.com/contracts/contract-123.pdf"
    },
    "permissions": ["create_orders", "manage_palettes", "view_analytics", "manage_contracts"],
    "accountHistory": [
      {
        "previousType": "supplier",
        "newType": "industry",
        "upgradedAt": "2025-06-15T00:00:00.000Z",
        "reason": "Besoin de générer mes propres commandes"
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-06-15T00:00:00.000Z",
    "lastLoginAt": "2025-11-24T10:30:00.000Z"
  },
  "accountTypeInfo": {
    "type": "industry",
    "displayName": "Industriel",
    "description": "Créez et gérez vos commandes de transport en toute autonomie",
    "features": ["..."],
    "portalUrl": "https://main.dbg6okncuyyiw.amplifyapp.com",
    "canGenerateOrders": true,
    "isDirectlyCreatable": true
  },
  "canUpgrade": false,
  "availableUpgrades": []
}
```

---

## 🧠 Logique Métier

### Permissions par Type de Compte

```javascript
const PERMISSIONS_MAP = {
  industry: [
    'create_orders',
    'manage_palettes',
    'view_analytics',
    'manage_contracts',
    'track_shipments',
    'manage_suppliers',
    'manage_recipients'
  ],

  transporter: [
    'accept_missions',
    'manage_fleet',
    'update_delivery_status',
    'driver_management',
    'track_shipments',
    'view_earnings'
  ],

  logistician: [
    'scan_qr',
    'update_palette_status',
    'warehouse_management',
    'offline_sync',
    'track_inventory'
  ],

  forwarder: [
    'manage_multimodal',
    'coordinate_carriers',
    'track_shipments',
    'generate_reports',
    'optimize_routes',
    'manage_contracts'
  ],

  supplier: [
    'view_orders',
    'schedule_pickups',
    'manage_catalog',
    'chat_support',
    'update_product_info'
  ],

  recipient: [
    'track_shipments',
    'confirm_deliveries',
    'manage_schedule',
    'chat_support',
    'view_history'
  ]
};

function getPermissionsForType(accountType) {
  return PERMISSIONS_MAP[accountType] || [];
}
```

### Règles d'Évolution

```javascript
function canUpgradeAccountType(fromType, toType) {
  // Règle métier : Supplier et Recipient peuvent évoluer vers Industry
  if ((fromType === 'supplier' || fromType === 'recipient') && toType === 'industry') {
    return true;
  }

  // Toutes les autres évolutions ne sont pas autorisées
  return false;
}

function getAvailableUpgrades(currentType) {
  if (currentType === 'supplier' || currentType === 'recipient') {
    return ['industry'];
  }
  return [];
}
```

### Statuts de Compte

```javascript
const ACCOUNT_STATUS = {
  PENDING_SELECTION: 'pending_selection',  // Utilisateur n'a pas encore sélectionné son type
  ACTIVE: 'active',                        // Compte actif
  SUSPENDED: 'suspended',                  // Compte suspendu (impayés, violation TOS)
  EXPIRED: 'expired'                       // Abonnement expiré
};
```

**Logique de statut** :
- Nouveau utilisateur après contrat/abonnement : `pending_selection`
- Après sélection de type : `active`
- Si abonnement expiré : `expired`
- Si suspension manuelle : `suspended`

---

## 🚀 Déploiement

### Structure du Projet Backend

```
account-management-eb/
├── index.js                    # Point d'entrée Express
├── package.json
├── .ebextensions/
│   └── https-redirect.config   # Config CloudFront
├── routes/
│   ├── health.js
│   ├── accountTypes.js
│   └── account.js
├── models/
│   ├── User.js
│   └── AccountType.js
├── services/
│   ├── accountService.js
│   └── permissionService.js
├── middleware/
│   ├── errorHandler.js
│   └── validation.js
└── config/
    ├── database.js
    └── constants.js
```

### Variables d'Environnement

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rt-accounts?retryWrites=true&w=majority

# Service Config
PORT=8080
NODE_ENV=production
SERVICE_VERSION=1.0.0

# CORS (pour autoriser le frontend)
ALLOWED_ORIGINS=https://main.df8cnylp3pqka.amplifyapp.com,https://main.dbg6okncuyyiw.amplifyapp.com

# Portal URLs (optionnel si hardcodé)
INDUSTRY_PORTAL_URL=https://main.dbg6okncuyyiw.amplifyapp.com
TRANSPORTER_PORTAL_URL=https://main.d1tb834u144p4r.amplifyapp.com
LOGISTICIAN_PORTAL_URL=https://main.d3hz3xvddrl94o.amplifyapp.com
FORWARDER_PORTAL_URL=https://main.dzvo8973zaqb.amplifyapp.com
SUPPLIER_PORTAL_URL=https://main.d3b6p09ihn5w7r.amplifyapp.com
RECIPIENT_PORTAL_URL=https://main.d3b6p09ihn5w7r.amplifyapp.com
```

### Déploiement sur Elastic Beanstalk

#### 1. Créer l'environnement

```bash
# Via AWS Console ou CLI
aws elasticbeanstalk create-application \
  --application-name rt-account-management \
  --region eu-central-1

aws elasticbeanstalk create-environment \
  --application-name rt-account-management \
  --environment-name account-management-prod \
  --solution-stack-name "64bit Amazon Linux 2023 v6.1.0 running Node.js 20" \
  --region eu-central-1
```

#### 2. Configurer CloudFront

1. Créer une distribution CloudFront
2. Origine : URL de l'environnement Elastic Beanstalk
3. Comportement : Rediriger HTTP → HTTPS
4. Noter l'ID de distribution (exemple : E1234567890ABC)

#### 3. Configurer les variables d'environnement

Dans Elastic Beanstalk Console :
- Configuration → Software → Environment properties
- Ajouter toutes les variables ci-dessus

#### 4. Déployer le code

```bash
# Créer le ZIP
zip -r account-management-v1.0.0.zip . -x "*.git*" -x "node_modules/*"

# Upload via CLI
aws elasticbeanstalk create-application-version \
  --application-name rt-account-management \
  --version-label v1.0.0 \
  --source-bundle S3Bucket=my-bucket,S3Key=account-management-v1.0.0.zip \
  --region eu-central-1

aws elasticbeanstalk update-environment \
  --environment-name account-management-prod \
  --version-label v1.0.0 \
  --region eu-central-1
```

#### 5. Vérifier le déploiement

```bash
# Health check
curl https://[cloudfront-id].cloudfront.net/health

# Expected response:
{
  "status": "healthy",
  "service": "account-management",
  "version": "1.0.0",
  "mongodb": {
    "connected": true,
    "status": "active"
  }
}
```

---

## 🧪 Tests

### Script de Test PowerShell

Créer `test-account-management.ps1` :

```powershell
$API_URL = "https://[votre-cloudfront-id].cloudfront.net"

Write-Host "=== Test Account Management Service ===" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$API_URL/health" -Method GET
Write-Host "Status: $($health.status)" -ForegroundColor Green
Write-Host "MongoDB: $($health.mongodb.connected)" -ForegroundColor Green

# 2. Get Available Account Types
Write-Host "`n2. Testing Get Available Account Types..." -ForegroundColor Yellow
$types = Invoke-RestMethod -Uri "$API_URL/api/account-types/available" -Method GET
Write-Host "Available Types: $($types.canCreate.Count)" -ForegroundColor Green
foreach ($type in $types.types) {
    Write-Host "  - $($type.displayName) ($($type.type))" -ForegroundColor Cyan
}

# 3. Select Account Type (TEST)
Write-Host "`n3. Testing Select Account Type..." -ForegroundColor Yellow
$selectBody = @{
    userId = "test-user-123"
    accountType = "industry"
} | ConvertTo-Json

try {
    $selectResult = Invoke-RestMethod -Uri "$API_URL/api/account/select-type" `
        -Method POST `
        -ContentType "application/json" `
        -Body $selectBody
    Write-Host "Success: $($selectResult.success)" -ForegroundColor Green
    Write-Host "Portal URL: $($selectResult.portalUrl)" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Check Eligibility (TEST)
Write-Host "`n4. Testing Check Eligibility..." -ForegroundColor Yellow
$eligibilityBody = @{
    userId = "test-user-456"
    desiredType = "industry"
} | ConvertTo-Json

try {
    $eligibility = Invoke-RestMethod -Uri "$API_URL/api/account/check-eligibility" `
        -Method POST `
        -ContentType "application/json" `
        -Body $eligibilityBody
    Write-Host "Eligible: $($eligibility.eligible)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Get Account Info (TEST)
Write-Host "`n5. Testing Get Account Info..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "$API_URL/api/account/info?userId=test-user-123" -Method GET
    Write-Host "Account Type: $($info.user.accountType)" -ForegroundColor Green
    Write-Host "Status: $($info.user.accountStatus)" -ForegroundColor Green
    Write-Host "Permissions: $($info.user.permissions.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Tests Completed ===" -ForegroundColor Cyan
```

Exécuter :
```bash
powershell -ExecutionPolicy Bypass -File test-account-management.ps1
```

### Tests Unitaires (Jest)

```javascript
// tests/accountService.test.js
const { selectAccountType, upgradeAccount, checkEligibility } = require('../services/accountService');

describe('Account Service', () => {
  test('should select industry account type', async () => {
    const result = await selectAccountType('user-123', 'industry');
    expect(result.success).toBe(true);
    expect(result.user.accountType).toBe('industry');
  });

  test('should not allow supplier to directly select', async () => {
    await expect(selectAccountType('user-123', 'supplier'))
      .rejects.toThrow('Ce type de compte ne peut pas être créé directement');
  });

  test('should allow supplier to upgrade to industry', async () => {
    const eligibility = await checkEligibility('supplier-user', 'industry');
    expect(eligibility.eligible).toBe(true);
  });

  test('should not allow transporter to upgrade to industry', async () => {
    const eligibility = await checkEligibility('transporter-user', 'industry');
    expect(eligibility.eligible).toBe(false);
  });
});
```

---

## 📊 Monitoring et Logs

### CloudWatch Logs

Les logs seront disponibles dans :
```
/aws/elasticbeanstalk/account-management-prod/var/log/nodejs/nodejs.log
```

### Métriques à surveiller

1. **Taux de sélection de types** :
   - Combien d'utilisateurs sélectionnent chaque type ?
   - Quel est le taux de conversion après signature de contrat ?

2. **Taux d'évolution** :
   - Combien de Suppliers/Recipients évoluent vers Industry ?
   - Délai moyen avant évolution

3. **Erreurs** :
   - Erreurs de validation
   - Erreurs MongoDB
   - Tentatives de sélection non autorisées

---

## 🔐 Sécurité

### Validation des Entrées

```javascript
// Exemple avec express-validator
const { body, query, validationResult } = require('express-validator');

app.post('/api/account/select-type', [
  body('userId').isString().trim().notEmpty(),
  body('accountType').isIn(['industry', 'transporter', 'logistician', 'forwarder']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Process request
});
```

### CORS Configuration

```javascript
const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📝 Checklist de Déploiement

- [ ] MongoDB Atlas configuré et accessible
- [ ] Variables d'environnement définies dans EB
- [ ] Elastic Beanstalk environnement créé (Node.js 20)
- [ ] CloudFront distribution créée avec HTTPS
- [ ] Code déployé et testé
- [ ] Health check retourne "healthy"
- [ ] MongoDB connexion active
- [ ] Tous les endpoints testés avec PowerShell script
- [ ] CORS configuré pour autoriser les frontends
- [ ] Logs CloudWatch accessibles
- [ ] URL CloudFront partagée avec l'équipe frontend

---

## 📞 Support

Pour toute question sur cette implémentation :
- Documentation complète : [PLAN_ACCOUNT_TYPES.md](./PLAN_ACCOUNT_TYPES.md)
- Flow diagrams : [ACCOUNT_TYPES_FLOW.md](./ACCOUNT_TYPES_FLOW.md)
- Frontend déjà implémenté dans : `apps/marketing-site/src/`

---

**Version** : 1.0.0
**Date** : 2025-11-24
**Auteur** : RT Technologie - Claude Code
**Statut** : ✅ Ready for Implementation
