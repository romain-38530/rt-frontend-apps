# Backend Account Management Service - README

**Service Name**: `account-management-eb`
**Version**: 1.0.0
**Date**: 2025-11-24
**Status**: 🚀 Ready to Implement

---

## 👋 Bienvenue Développeur Backend !

Ce document est ton point d'entrée pour implémenter le service de gestion des types de comptes RT Technologie.

**Le frontend est déjà 100% terminé** et attend ton service backend pour fonctionner ! 🎉

---

## 📋 Ce Que Tu Dois Faire

Tu vas créer un **service backend Node.js** qui gère les types de comptes utilisateurs après qu'ils aient signé leur contrat et souscrit à leur abonnement.

### Fonctionnalités Principales

1. **Sélection de type de compte** - L'utilisateur choisit parmi 4 types créables
2. **Information de compte** - Récupérer les détails d'un compte
3. **Évolution de compte** - Permettre aux Suppliers/Recipients d'évoluer vers Industry

---

## 🎯 Les 4 Types de Comptes Créables

| Type | Nom FR | Portail | Peut Générer Commandes |
|------|--------|---------|------------------------|
| `industry` | Industriel | `https://main.dbg6okncuyyiw.amplifyapp.com` | ✅ Oui |
| `transporter` | Transporteur | `https://main.d1tb834u144p4r.amplifyapp.com` | ✅ Oui |
| `logistician` | Logisticien | `https://main.d3hz3xvddrl94o.amplifyapp.com` | ✅ Oui |
| `forwarder` | Transitaire | `https://main.dzvo8973zaqb.amplifyapp.com` | ✅ Oui |

### 2 Types Non-Créables (créés automatiquement)

| Type | Nom FR | Peut Évoluer Vers |
|------|--------|-------------------|
| `supplier` | Fournisseur | `industry` ✅ |
| `recipient` | Destinataire | `industry` ✅ |

**Important** : Supplier et Recipient sont créés automatiquement par les Industriels lors de la création de commandes, mais ils peuvent évoluer vers Industry s'ils veulent générer leurs propres commandes.

---

## 🚀 Quick Start

### Étape 1 : Lire la Documentation (15 min)

**Commence par ici** 👇

📄 **[BACKEND_QUICK_START.md](./BACKEND_QUICK_START.md)** - Guide de démarrage rapide (5 étapes)

Ce document contient :
- Setup Express.js en 5 minutes
- Code copy-paste des 5 endpoints essentiels
- Configuration MongoDB
- Déploiement AWS

### Étape 2 : Documentation Complète (1h)

Ensuite, lis le guide détaillé :

📘 **[BACKEND_ACCOUNT_TYPES.md](./BACKEND_ACCOUNT_TYPES.md)** - Guide complet (50+ pages)

Ce document contient :
- Architecture détaillée
- Schemas MongoDB complets avec indexes
- 6 API endpoints avec exemples de requêtes/réponses
- Logique métier complète
- Tests PowerShell automatisés
- Monitoring et sécurité

### Étape 3 : Comprendre les Flows (30 min)

📊 **[ACCOUNT_TYPES_FLOW.md](./ACCOUNT_TYPES_FLOW.md)** - Diagrammes et flows

Ce document contient :
- Flow utilisateur complet (de la signature à la sélection)
- Flow d'évolution de compte
- Diagrammes de séquence
- Matrices de décision

---

## 🔧 Stack Technique

### Recommandé

```
Node.js 20.x
├── Express.js 4.x      (API REST)
├── mongodb 6.x         (Driver MongoDB)
├── cors 2.x           (CORS middleware)
├── express-validator   (Validation inputs)
└── dotenv             (Variables d'env)
```

### Infrastructure AWS

```
Elastic Beanstalk (Node.js 20)
    ↓
CloudFront Distribution (HTTPS obligatoire)
    ↓
MongoDB Atlas (utilise le même cluster que subscriptions)
```

---

## 📦 Les 6 Endpoints à Implémenter

### 1. Health Check ⭐ PRIORITÉ HAUTE

```
GET /health

Response:
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

### 2. Get Available Account Types ⭐ PRIORITÉ HAUTE

```
GET /api/account-types/available?userId=xxx

Response:
{
  "types": [...],           // Tous les types avec config
  "currentType": "supplier", // Type actuel de l'utilisateur
  "canCreate": ["industry", "transporter", "logistician", "forwarder"],
  "canUpgradeTo": ["industry"]
}
```

### 3. Select Account Type ⭐ PRIORITÉ HAUTE

```
POST /api/account/select-type
Body: {
  "userId": "user-uuid-123",
  "accountType": "industry"
}

Response:
{
  "success": true,
  "user": {...},
  "portalUrl": "https://main.dbg6okncuyyiw.amplifyapp.com",
  "redirectUrl": "https://main.dbg6okncuyyiw.amplifyapp.com?userId=user-uuid-123"
}
```

### 4. Check Eligibility ⭐⭐ PRIORITÉ MOYENNE

```
POST /api/account/check-eligibility
Body: {
  "userId": "user-uuid-123",
  "desiredType": "industry"
}

Response:
{
  "eligible": true,
  "reasons": ["Évolution autorisée", "Abonnement actif"],
  "requiredSteps": []
}
```

### 5. Upgrade Account ⭐⭐ PRIORITÉ MOYENNE

```
POST /api/account/upgrade
Body: {
  "userId": "user-uuid-123",
  "fromType": "supplier",
  "toType": "industry",
  "reason": "J'ai besoin de générer mes propres commandes"
}

Response:
{
  "success": true,
  "newAccountType": "industry",
  "newPermissions": [...],
  "newPortalUrl": "https://main.dbg6okncuyyiw.amplifyapp.com"
}
```

### 6. Get Account Info ⭐ PRIORITÉ MOYENNE

```
GET /api/account/info?userId=xxx

Response:
{
  "user": {...},              // Toutes les infos utilisateur
  "accountTypeInfo": {...},   // Config du type de compte
  "canUpgrade": false,
  "availableUpgrades": []
}
```

---

## 💾 MongoDB Schema Essentiel

### Collection : `users`

```javascript
{
  _id: ObjectId,
  userId: String,              // UUID unique (index unique)
  email: String,               // Index unique
  firstName: String,
  lastName: String,
  phone: String,

  // Entreprise
  company: {
    vatNumber: String,
    name: String,
    address: String,
    countryCode: String
  },

  // Type et statut
  accountType: String | null,  // null avant sélection
  accountStatus: String,       // 'pending_selection' | 'active' | 'suspended' | 'expired'

  // Permissions (calculées selon accountType)
  permissions: [String],

  // Abonnement (référence à collection subscriptions)
  subscription: {
    id: String,
    status: String,            // 'active' | 'cancelled' | 'expired'
    // ...
  },

  // Historique d'évolution
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

**Indexes obligatoires** :
```javascript
db.users.createIndex({ userId: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ accountType: 1 });
```

---

## ⚙️ Variables d'Environnement

À configurer dans **AWS Elastic Beanstalk** → Configuration → Software → Environment properties :

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rt-accounts

# Service
PORT=8080
NODE_ENV=production
SERVICE_VERSION=1.0.0

# CORS (autoriser les frontends)
ALLOWED_ORIGINS=https://main.df8cnylp3pqka.amplifyapp.com,https://main.dbg6okncuyyiw.amplifyapp.com
```

---

## 🧪 Comment Tester

### Test Local (Avant Déploiement)

```bash
# 1. Installer les dépendances
npm install

# 2. Créer .env local
cp .env.example .env
# Éditer .env avec tes variables

# 3. Lancer en local
npm start

# 4. Tester health check
curl http://localhost:8080/health
```

### Test Production (Après Déploiement)

Un script PowerShell est fourni dans la documentation complète :

```powershell
# Éditer l'URL dans le script
$API_URL = "https://[ta-cloudfront-id].cloudfront.net"

# Lancer les tests
powershell -ExecutionPolicy Bypass -File test-account-management.ps1
```

Le script teste automatiquement tous les endpoints ! ✅

---

## 📊 Règles Métier Importantes

### Sélection de Type Initial

✅ **Autorisé** :
- `accountType === null` (pas encore sélectionné)
- Type demandé est créable directement (industry, transporter, logistician, forwarder)
- Utilisateur a un contrat signé
- Utilisateur a un abonnement actif

❌ **Refusé** :
- `accountType !== null` (déjà sélectionné)
- Type demandé n'est pas créable (supplier, recipient)
- Pas de contrat ou abonnement

### Évolution de Compte

✅ **Autorisé** :
- `supplier` → `industry`
- `recipient` → `industry`

❌ **Refusé** :
- Toutes les autres évolutions
- `industry` → autre type
- `transporter` → autre type
- etc.

### Permissions par Type

```javascript
const PERMISSIONS = {
  industry: ['create_orders', 'manage_palettes', 'view_analytics', 'manage_contracts'],
  transporter: ['accept_missions', 'manage_fleet', 'update_delivery_status', 'driver_management'],
  logistician: ['scan_qr', 'update_palette_status', 'warehouse_management', 'offline_sync'],
  forwarder: ['manage_multimodal', 'coordinate_carriers', 'track_shipments', 'generate_reports'],
  supplier: ['view_orders', 'schedule_pickups', 'manage_catalog', 'chat_support'],
  recipient: ['track_shipments', 'confirm_deliveries', 'manage_schedule', 'chat_support']
};
```

---

## 🎯 Checklist Développement

### Phase 1 : Setup (Jour 1)
- [ ] Créer projet Node.js + Express
- [ ] Installer dépendances (express, mongodb, cors, etc.)
- [ ] Configurer connexion MongoDB Atlas
- [ ] Implémenter endpoint `/health`
- [ ] Tester en local

### Phase 2 : Core Features (Jour 2-3)
- [ ] Implémenter `/api/account-types/available`
- [ ] Implémenter `/api/account/select-type`
- [ ] Implémenter `/api/account/info`
- [ ] Créer helpers pour permissions
- [ ] Tests unitaires

### Phase 3 : Évolution (Jour 3-4)
- [ ] Implémenter `/api/account/check-eligibility`
- [ ] Implémenter `/api/account/upgrade`
- [ ] Gérer `accountHistory`
- [ ] Tests d'intégration

### Phase 4 : Déploiement (Jour 4)
- [ ] Créer application Elastic Beanstalk
- [ ] Configurer variables d'environnement
- [ ] Déployer le code
- [ ] Créer CloudFront distribution (HTTPS)
- [ ] Configurer redirections HTTP → HTTPS

### Phase 5 : Tests & Production (Jour 5)
- [ ] Tester avec PowerShell script
- [ ] Intégration avec frontend
- [ ] Tests end-to-end
- [ ] Monitoring CloudWatch
- [ ] Documentation finale
- [ ] ✅ Mise en production !

---

## 📞 Contact & Support

### Frontend Déjà Prêt

Le frontend est 100% implémenté et attend ton backend :
- Types TypeScript : `apps/marketing-site/src/types/account.ts`
- Hooks React : `apps/marketing-site/src/hooks/useAccountTypes.ts`
- Pages : `apps/marketing-site/src/app/account/`
- Composants : `apps/marketing-site/src/components/`

### Documentation Disponible

| Document | Description | Pages |
|----------|-------------|-------|
| **BACKEND_QUICK_START.md** | Démarrage rapide en 5 étapes | ~5 |
| **BACKEND_ACCOUNT_TYPES.md** | Guide complet avec tout le code | ~50 |
| **ACCOUNT_TYPES_FLOW.md** | Diagrammes et flows utilisateur | ~15 |
| **ACCOUNT_TYPES_IMPLEMENTATION_STATUS.md** | Status et checklist complète | ~10 |

### Services RT Existants

Tu peux t'inspirer de ces services déjà en production :

1. **authz-eb v2.2.0** - Validation TVA + Pricing
   - URL : `https://d2i50a1vlg138w.cloudfront.net`
   - Code similaire : Express + API externes

2. **subscriptions-contracts v1.0.0** - Abonnements
   - URL : `https://dgze8l03lwl5h.cloudfront.net`
   - Code similaire : Express + MongoDB Atlas

**Documentation complète** : `docs/PRODUCTION_SERVICES.md`

---

## ⏱️ Timeline Estimé

| Phase | Durée | Description |
|-------|-------|-------------|
| **Setup** | 0.5 jour | Projet + MongoDB + Health check |
| **Core API** | 1.5 jours | 3 endpoints principaux + tests |
| **Évolution** | 1 jour | Upgrade + eligibility + tests |
| **Déploiement** | 0.5 jour | EB + CloudFront + config |
| **Tests & Prod** | 0.5 jour | Tests end-to-end + mise en prod |
| **Total** | **4 jours** | Estimation réaliste |

---

## 🎉 C'est Parti !

### Prochaines Étapes

1. ✅ **Lis BACKEND_QUICK_START.md** (15 min)
2. ✅ **Lis BACKEND_ACCOUNT_TYPES.md** (1h)
3. ✅ **Setup ton projet local** (30 min)
4. ✅ **Implémente les 3 premiers endpoints** (Jour 1-2)
5. ✅ **Déploie sur AWS** (Jour 3)
6. ✅ **Intégration avec frontend** (Jour 4)
7. 🚀 **Production !**

---

## 💡 Tips Importants

### Sécurité
- ✅ Toujours valider les inputs avec `express-validator`
- ✅ Configurer CORS strictement (uniquement URLs Amplify)
- ✅ Ne jamais exposer MongoDB URI dans les logs
- ✅ Logger toutes les actions importantes

### Performance
- ✅ Créer les indexes MongoDB (userId, email, accountType)
- ✅ Utiliser connexion MongoDB pooling
- ✅ Réponse < 500ms pour tous les endpoints

### Monitoring
- ✅ Logs structurés avec niveau (info, warn, error)
- ✅ Logger userId dans chaque action
- ✅ CloudWatch Alarms pour erreurs 5xx

### Qualité
- ✅ Tests unitaires avec Jest (couverture > 80%)
- ✅ Tests d'intégration pour chaque endpoint
- ✅ Gestion propre des erreurs (try/catch partout)

---

## 📚 Ressources Externes

### AWS Documentation
- [Elastic Beanstalk Node.js](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.html)
- [CloudFront HTTPS](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-https.html)
- [CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)

### MongoDB
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Indexes Best Practices](https://www.mongodb.com/docs/manual/indexes/)

### Express.js
- [Express Documentation](https://expressjs.com/)
- [Express Validator](https://express-validator.github.io/docs/)
- [CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)

---

## ❓ Questions Fréquentes

### Q: Où héberger le service ?
**R**: AWS Elastic Beanstalk avec Node.js 20, région eu-central-1 (Frankfurt)

### Q: Quelle base de données ?
**R**: MongoDB Atlas (utilise le même cluster que subscriptions-contracts)

### Q: Le service doit être en HTTPS ?
**R**: OUI, obligatoire ! Utilise CloudFront devant Elastic Beanstalk

### Q: Comment gérer les permissions ?
**R**: Calculées automatiquement selon `accountType` via `PERMISSIONS_MAP`

### Q: Supplier peut-il devenir Transporter ?
**R**: NON, uniquement Supplier/Recipient → Industry

### Q: Qui crée les comptes Supplier/Recipient ?
**R**: Les Industriels lors de la création de commandes (pas ce service)

### Q: Combien de temps pour implémenter ?
**R**: 2-4 jours pour un développeur expérimenté

---

## ✅ En Résumé

### Ce Que Tu Vas Créer

Un service backend Express.js qui :
- ✅ Gère la sélection du type de compte après souscription
- ✅ Permet aux Suppliers/Recipients d'évoluer vers Industry
- ✅ Retourne les informations de compte pour le dashboard
- ✅ Est déployé sur AWS avec HTTPS obligatoire
- ✅ S'intègre parfaitement avec le frontend déjà prêt

### Documentation à Ta Disposition

- ✅ Guide quick start (5 étapes)
- ✅ Guide complet (50+ pages)
- ✅ Diagrammes de flows
- ✅ Code examples copy-paste
- ✅ Scripts de test automatisés
- ✅ Checklist de déploiement

### Résultat Final

Un système complet de gestion des types de comptes qui :
- ✅ Redirige les utilisateurs vers leur portail dédié
- ✅ Permet l'évolution flexible des comptes
- ✅ S'intègre dans l'écosystème RT existant
- ✅ Est prêt pour la production

---

**🚀 Bonne chance et bon développement !**

**Date** : 2025-11-24
**Version** : 1.0.0
**Auteur** : RT Technologie - Claude Code
**Status** : ✅ Ready to Rock!
