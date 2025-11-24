# Backend Quick Start - Account Types System

**Service** : `account-management-eb`
**Version** : 1.0.0
**Documentation complète** : [BACKEND_ACCOUNT_TYPES.md](./BACKEND_ACCOUNT_TYPES.md)

---

## 🚀 Quick Setup (5 étapes)

### 1. Créer le Service Express.js

```javascript
// index.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));

// MongoDB connection
let db;
MongoClient.connect(process.env.MONGODB_URI)
  .then(client => {
    db = client.db('rt-accounts');
    console.log('✅ MongoDB connected');
  });

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'account-management',
    version: '1.0.0',
    mongodb: { connected: !!db, status: 'active' }
  });
});

app.listen(8080, () => console.log('Server running on port 8080'));
```

### 2. Configuration des Portails

```javascript
// config/portals.js
const PORTAL_URLS = {
  industry: 'https://main.dbg6okncuyyiw.amplifyapp.com',
  transporter: 'https://main.d1tb834u144p4r.amplifyapp.com',
  logistician: 'https://main.d3hz3xvddrl94o.amplifyapp.com',
  forwarder: 'https://main.dzvo8973zaqb.amplifyapp.com',
  supplier: 'https://main.d3b6p09ihn5w7r.amplifyapp.com',
  recipient: 'https://main.d3b6p09ihn5w7r.amplifyapp.com'
};

const PERMISSIONS_MAP = {
  industry: ['create_orders', 'manage_palettes', 'view_analytics', 'manage_contracts'],
  transporter: ['accept_missions', 'manage_fleet', 'update_delivery_status', 'driver_management'],
  logistician: ['scan_qr', 'update_palette_status', 'warehouse_management', 'offline_sync'],
  forwarder: ['manage_multimodal', 'coordinate_carriers', 'track_shipments', 'generate_reports'],
  supplier: ['view_orders', 'schedule_pickups', 'manage_catalog', 'chat_support'],
  recipient: ['track_shipments', 'confirm_deliveries', 'manage_schedule', 'chat_support']
};

module.exports = { PORTAL_URLS, PERMISSIONS_MAP };
```

### 3. Les 5 Endpoints Essentiels

```javascript
// 1. GET /api/account-types/available
app.get('/api/account-types/available', async (req, res) => {
  const { userId } = req.query;

  // Retourner les types créables + le type actuel de l'utilisateur
  const creatableTypes = ['industry', 'transporter', 'logistician', 'forwarder'];
  let currentType = null;

  if (userId) {
    const user = await db.collection('users').findOne({ userId });
    currentType = user?.accountType;
  }

  res.json({
    types: getAccountTypesInfo(), // Voir docs complètes
    currentType,
    canCreate: creatableTypes,
    canUpgradeTo: currentType === 'supplier' || currentType === 'recipient' ? ['industry'] : []
  });
});

// 2. POST /api/account/select-type
app.post('/api/account/select-type', async (req, res) => {
  const { userId, accountType } = req.body;

  // Validation
  if (!['industry', 'transporter', 'logistician', 'forwarder'].includes(accountType)) {
    return res.status(400).json({ success: false, message: 'Type non créable directement' });
  }

  // Vérifier que l'utilisateur n'a pas déjà un type
  const user = await db.collection('users').findOne({ userId });
  if (user.accountType !== null) {
    return res.status(400).json({ success: false, message: 'Type déjà défini' });
  }

  // Mise à jour
  const permissions = PERMISSIONS_MAP[accountType];
  await db.collection('users').updateOne(
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

  const portalUrl = PORTAL_URLS[accountType];
  res.json({
    success: true,
    user: { ...user, accountType, accountStatus: 'active', permissions },
    portalUrl,
    redirectUrl: `${portalUrl}?userId=${userId}`
  });
});

// 3. POST /api/account/check-eligibility
app.post('/api/account/check-eligibility', async (req, res) => {
  const { userId, desiredType } = req.body;

  const user = await db.collection('users').findOne({ userId });
  const fromType = user.accountType;

  // Règle : Supplier/Recipient → Industry uniquement
  if ((fromType === 'supplier' || fromType === 'recipient') && desiredType === 'industry') {
    return res.json({
      eligible: true,
      reasons: ['Évolution autorisée', 'Abonnement actif'],
      requiredSteps: []
    });
  }

  res.json({
    eligible: false,
    reasons: ['Évolution non autorisée'],
    requiredSteps: ['Contacter le support']
  });
});

// 4. POST /api/account/upgrade
app.post('/api/account/upgrade', async (req, res) => {
  const { userId, fromType, toType, reason } = req.body;

  const user = await db.collection('users').findOne({ userId });

  // Vérifications
  if (user.accountType !== fromType) {
    return res.status(400).json({ success: false, message: 'Type actuel incorrect' });
  }

  if (!((fromType === 'supplier' || fromType === 'recipient') && toType === 'industry')) {
    return res.status(400).json({ success: false, message: 'Évolution non autorisée' });
  }

  // Mise à jour avec historique
  const newPermissions = PERMISSIONS_MAP[toType];
  await db.collection('users').updateOne(
    { userId },
    {
      $set: {
        accountType: toType,
        permissions: newPermissions,
        updatedAt: new Date()
      },
      $push: {
        accountHistory: {
          previousType: fromType,
          newType: toType,
          upgradedAt: new Date(),
          reason
        }
      }
    }
  );

  const newPortalUrl = PORTAL_URLS[toType];
  res.json({
    success: true,
    newAccountType: toType,
    newPermissions,
    newPortalUrl,
    message: 'Évolution réussie'
  });
});

// 5. GET /api/account/info
app.get('/api/account/info', async (req, res) => {
  const { userId } = req.query;

  const user = await db.collection('users').findOne({ userId });
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  const accountTypeInfo = getAccountTypeInfo(user.accountType); // Voir docs
  const canUpgrade = user.accountType === 'supplier' || user.accountType === 'recipient';

  res.json({
    user,
    accountTypeInfo,
    canUpgrade,
    availableUpgrades: canUpgrade ? ['industry'] : []
  });
});
```

### 4. Variables d'Environnement

Configurer dans AWS Elastic Beanstalk :

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rt-accounts
PORT=8080
NODE_ENV=production
ALLOWED_ORIGINS=https://main.df8cnylp3pqka.amplifyapp.com
```

### 5. Déployer

```bash
# 1. Créer le ZIP
zip -r account-management-v1.0.0.zip . -x "*.git*" -x "node_modules/*"

# 2. Créer l'application EB
aws elasticbeanstalk create-application \
  --application-name rt-account-management \
  --region eu-central-1

# 3. Créer l'environnement
aws elasticbeanstalk create-environment \
  --application-name rt-account-management \
  --environment-name account-management-prod \
  --solution-stack-name "64bit Amazon Linux 2023 v6.1.0 running Node.js 20" \
  --region eu-central-1

# 4. Upload et déployer
# Via EB Console ou CLI (voir docs complètes)

# 5. Créer CloudFront distribution
# Via AWS Console → CloudFront → Create Distribution
# Origin: URL de l'environnement EB
# Rediriger HTTP → HTTPS

# 6. Tester
curl https://[cloudfront-id].cloudfront.net/health
```

---

## 📋 MongoDB Schema Minimum

```javascript
// Collection: users
{
  userId: String,              // Unique
  email: String,
  accountType: String | null,  // null avant sélection
  accountStatus: String,       // 'pending_selection' | 'active'
  permissions: [String],
  subscription: {
    status: String,            // 'active' | 'expired'
    // ...
  },
  accountHistory: [
    {
      previousType: String,
      newType: String,
      upgradedAt: Date,
      reason: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Index** :
```javascript
db.users.createIndex({ userId: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
```

---

## ✅ Règles Métier Essentielles

### Types Créables Directement
- ✅ `industry` (Industriel)
- ✅ `transporter` (Transporteur)
- ✅ `logistician` (Logisticien)
- ✅ `forwarder` (Transitaire)

### Types Non-Créables (créés automatiquement)
- ❌ `supplier` (Fournisseur)
- ❌ `recipient` (Destinataire)

### Évolutions Autorisées
- `supplier` → `industry` ✅
- `recipient` → `industry` ✅
- Toutes les autres ❌

---

## 🧪 Test Rapide

```powershell
$API = "https://[cloudfront-id].cloudfront.net"

# Health
Invoke-RestMethod "$API/health"

# Get types
Invoke-RestMethod "$API/api/account-types/available"

# Select type (test)
$body = @{ userId = "test"; accountType = "industry" } | ConvertTo-Json
Invoke-RestMethod "$API/api/account/select-type" -Method POST -Body $body -ContentType "application/json"
```

---

## 📞 Ressources

- **Documentation complète** : [BACKEND_ACCOUNT_TYPES.md](./BACKEND_ACCOUNT_TYPES.md)
- **Flows & Diagrammes** : [ACCOUNT_TYPES_FLOW.md](./ACCOUNT_TYPES_FLOW.md)
- **Plan détaillé** : [PLAN_ACCOUNT_TYPES.md](./PLAN_ACCOUNT_TYPES.md)
- **Frontend implémenté** : `apps/marketing-site/src/`

---

**⏱️ Temps estimé** : 2-4 jours de développement
**✅ Frontend** : Déjà implémenté et prêt !
