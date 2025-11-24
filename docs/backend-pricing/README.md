# Système de Pricing Dynamique - Backend

**Service**: subscriptions-contracts v2.4.0
**Date**: 2025-11-24
**Collection MongoDB**: `pricing`

---

## 📋 Vue d'ensemble

Ce système permet de gérer les prix de manière dynamique pour tous les types de comptes RT Technologie, avec support pour:

- ✅ Prix de base par type de compte
- ✅ Variantes de prix (invité vs premium)
- ✅ Promotions avec codes promo
- ✅ Historique des changements de prix
- ✅ Calcul automatique du prix final selon les conditions
- ✅ Interface admin pour gestion en temps réel

---

## 🗂️ Structure des Fichiers

```
backend-pricing/
├── models/
│   └── Pricing.js              # Modèle Mongoose pour la collection pricing
├── services/
│   └── pricingService.js       # Logique métier pour pricing
├── routes/
│   └── pricing.js              # 7 endpoints API REST
├── scripts/
│   └── seed-pricing.js         # Script d'initialisation des données
└── README.md                   # Ce fichier
```

---

## 🚀 Installation Rapide (5 étapes)

### Étape 1: Copier les fichiers dans le backend

Copier les fichiers dans votre service `subscriptions-contracts`:

```bash
# Dans le backend subscriptions-contracts
cp -r backend-pricing/models ./src/models/
cp -r backend-pricing/services ./src/services/
cp -r backend-pricing/routes ./src/routes/
cp backend-pricing/scripts/seed-pricing.js ./scripts/
```

### Étape 2: Enregistrer les routes dans app.js

Ajouter dans `src/app.js` ou `src/server.js`:

```javascript
// Importer les routes pricing
const pricingRoutes = require('./routes/pricing');

// Enregistrer les routes (après les autres routes)
app.use('/api/pricing', pricingRoutes);
```

### Étape 3: Configurer MongoDB URI

Dans votre fichier `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rt-technologie?retryWrites=true&w=majority
```

### Étape 4: Exécuter le script de seed

```bash
node scripts/seed-pricing.js
```

Vous devriez voir:

```
🌱 Démarrage du seed de la collection pricing...
📡 Connexion à MongoDB Atlas...
✅ Connecté à MongoDB Atlas

✅ EXPEDITEUR               - 499€/monthly
   Industriel (Expéditeur)
   Promotions: 1
      - LAUNCH2025: -50%

✅ TRANSPORTEUR              - 49€/monthly
   Transporteur
   Variantes: 2
      - TRANSPORTEUR_INVITE: 0€
      - TRANSPORTEUR_PREMIUM: 499€

...
✅ Seed de pricing terminé avec succès!
```

### Étape 5: Tester l'API

```bash
# Tester la récupération de tous les prix
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing

# Tester le calcul de prix pour un transporteur invité
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "conditions": { "invitedBy": "EXPEDITEUR" }
  }'
```

---

## 🌐 Endpoints API (7 principaux)

### 1. GET /api/pricing
**Description**: Récupérer tous les prix actifs
**Accès**: Public

```bash
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing
```

**Réponse**:
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "accountType": "TRANSPORTEUR",
      "displayName": "Transporteur",
      "basePrice": 49,
      "currency": "EUR",
      "variants": [...],
      "promotions": [...]
    }
  ]
}
```

---

### 2. GET /api/pricing/:accountType
**Description**: Récupérer le pricing pour un type de compte
**Accès**: Public

```bash
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing/TRANSPORTEUR
```

**Réponse**:
```json
{
  "success": true,
  "data": {
    "accountType": "TRANSPORTEUR",
    "displayName": "Transporteur",
    "basePrice": 49,
    "variants": [
      {
        "name": "TRANSPORTEUR_INVITE",
        "price": 0,
        "conditions": { "invitedBy": "EXPEDITEUR" }
      }
    ]
  }
}
```

---

### 3. POST /api/pricing/calculate
**Description**: Calculer le prix final avec conditions et code promo
**Accès**: Public

```bash
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "conditions": { "invitedBy": "EXPEDITEUR" },
    "promoCode": "LAUNCH2025"
  }'
```

**Réponse**:
```json
{
  "success": true,
  "data": {
    "accountType": "TRANSPORTEUR",
    "displayName": "Transporteur",
    "originalPrice": 49,
    "finalPrice": 0,
    "currency": "EUR",
    "billingPeriod": "monthly",
    "appliedVariant": {
      "name": "TRANSPORTEUR_INVITE",
      "price": 0
    },
    "appliedPromo": null
  }
}
```

---

### 4. POST /api/pricing (Admin)
**Description**: Créer ou mettre à jour un pricing
**Accès**: Admin (requiert token)

```bash
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "displayName": "Transporteur",
    "basePrice": 49,
    "currency": "EUR",
    "billingPeriod": "monthly",
    "variants": [...]
  }'
```

---

### 5. PUT /api/pricing/:accountType (Admin)
**Description**: Mettre à jour le prix de base (avec historique)
**Accès**: Admin

```bash
curl -X PUT https://dgze8l03lwl5h.cloudfront.net/api/pricing/TRANSPORTEUR \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "newPrice": 59,
    "reason": "Ajustement inflation 2025"
  }'
```

---

### 6. POST /api/pricing/:accountType/promotion (Admin)
**Description**: Ajouter une promotion
**Accès**: Admin

```bash
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing/TRANSPORTEUR/promotion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "code": "SUMMER50",
    "discountType": "percentage",
    "discountValue": 50,
    "validFrom": "2025-06-01T00:00:00Z",
    "validUntil": "2025-08-31T23:59:59Z",
    "maxUses": 100
  }'
```

---

### 7. GET /api/pricing/:accountType/history (Admin)
**Description**: Récupérer l'historique des prix
**Accès**: Admin

```bash
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing/TRANSPORTEUR/history?limit=20 \
  -H "Authorization: Bearer <admin-token>"
```

**Réponse**:
```json
{
  "success": true,
  "data": {
    "accountType": "TRANSPORTEUR",
    "currentPrice": 49,
    "history": [
      {
        "previousPrice": 39,
        "newPrice": 49,
        "changedAt": "2025-11-01T10:30:00Z",
        "changedBy": "admin",
        "reason": "Ajustement inflation"
      }
    ]
  }
}
```

---

## 📊 Structure de Données MongoDB

### Collection: `pricing`

```javascript
{
  _id: ObjectId("..."),
  accountType: "TRANSPORTEUR",              // Type de compte (unique)
  displayName: "Transporteur",              // Nom d'affichage
  basePrice: 49,                            // Prix de base en euros
  currency: "EUR",                          // Devise
  billingPeriod: "monthly",                 // Période de facturation

  // Variantes de prix (invité vs premium)
  variants: [
    {
      name: "TRANSPORTEUR_INVITE",
      price: 0,
      conditions: { invitedBy: "EXPEDITEUR" },
      features: ["..."],
      isActive: true
    },
    {
      name: "TRANSPORTEUR_PREMIUM",
      price: 499,
      conditions: { hasFeatures: ["create_orders"] },
      features: ["..."],
      isActive: true
    }
  ],

  // Promotions actives
  promotions: [
    {
      code: "LAUNCH2025",
      discountType: "percentage",           // "percentage" ou "fixed"
      discountValue: 50,                    // 50% ou 50€
      validFrom: ISODate("2025-11-24"),
      validUntil: ISODate("2025-12-31"),
      maxUses: 100,
      usedCount: 0,
      isActive: true
    }
  ],

  // Historique des changements de prix
  priceHistory: [
    {
      previousPrice: 39,
      newPrice: 49,
      changedAt: ISODate("2025-11-01"),
      changedBy: "admin",
      reason: "Ajustement inflation"
    }
  ],

  isActive: true,
  metadata: {
    description: "...",
    features: ["..."],
    portalUrl: "https://..."
  },

  createdAt: ISODate("2025-11-24"),
  updatedAt: ISODate("2025-11-24")
}
```

---

## 💡 Exemples d'Utilisation

### Cas d'usage 1: Calculer le prix pour un transporteur invité

```javascript
// Frontend appelle l'API
const response = await fetch(`${API_URL}/api/pricing/calculate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountType: 'TRANSPORTEUR',
    conditions: { invitedBy: 'EXPEDITEUR' }
  })
});

const result = await response.json();
// result.data.finalPrice = 0 (gratuit car invité)
// result.data.appliedVariant.name = "TRANSPORTEUR_INVITE"
```

### Cas d'usage 2: Calculer le prix pour un transporteur premium

```javascript
const response = await fetch(`${API_URL}/api/pricing/calculate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountType: 'TRANSPORTEUR',
    conditions: { hasFeatures: ['create_orders'] }
  })
});

const result = await response.json();
// result.data.finalPrice = 499 (premium avec fonctions industrielles)
// result.data.appliedVariant.name = "TRANSPORTEUR_PREMIUM"
```

### Cas d'usage 3: Appliquer une promotion

```javascript
const response = await fetch(`${API_URL}/api/pricing/calculate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountType: 'EXPEDITEUR',
    conditions: {},
    promoCode: 'LAUNCH2025'
  })
});

const result = await response.json();
// result.data.originalPrice = 499
// result.data.finalPrice = 249.5 (50% de réduction)
// result.data.appliedPromo.code = "LAUNCH2025"
```

---

## 🔧 Utilisation du Service dans le Code

### Dans un contrôleur (ex: subscription controller)

```javascript
const pricingService = require('../services/pricingService');

async function createSubscription(req, res) {
  const { userId, accountType, invitedBy } = req.body;

  // Construire les conditions
  const conditions = {};
  if (invitedBy) {
    conditions.invitedBy = invitedBy;
  }

  // Calculer le prix
  const priceResult = await pricingService.calculatePrice(
    accountType,
    conditions,
    req.body.promoCode
  );

  // Créer la souscription avec le prix calculé
  const subscription = await Subscription.create({
    userId,
    accountType,
    price: priceResult.finalPrice,
    currency: priceResult.currency,
    billingPeriod: priceResult.billingPeriod,
    appliedVariant: priceResult.appliedVariant?.name,
    appliedPromo: priceResult.appliedPromo?.code
  });

  res.json({ success: true, subscription });
}
```

---

## 🛠️ Scripts Utilitaires

### Ajouter une promotion via ligne de commande

```bash
node scripts/seed-pricing.js add-promo TRANSPORTEUR SUMMER50 percentage 50 2025-06-01 2025-08-31 100
```

### Mettre à jour un prix via ligne de commande

```bash
node scripts/seed-pricing.js update-price TRANSPORTEUR 59 "Ajustement inflation 2025"
```

---

## 🔐 Sécurité et Authentification Admin

⚠️ **IMPORTANT**: Les endpoints admin (POST, PUT, DELETE) nécessitent une authentification.

Dans `routes/pricing.js`, le middleware `requireAdmin` est actuellement un placeholder:

```javascript
const requireAdmin = (req, res, next) => {
  // TODO: Implémenter la vérification du token JWT admin
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification requis'
    });
  }

  // TODO: Vérifier le token et les permissions
  // const token = authHeader.replace('Bearer ', '');
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // if (!decoded.isAdmin) {
  //   return res.status(403).json({ message: 'Accès admin requis' });
  // }

  next();
};
```

**À faire en production**:
1. Implémenter la vérification JWT
2. Vérifier les permissions admin dans le token
3. Ajouter des logs d'audit pour les changements de prix

---

## 📈 Déploiement

### 1. Tester en local

```bash
# Démarrer le serveur en local
npm run dev

# Tester les endpoints
curl http://localhost:8080/api/pricing
```

### 2. Déployer sur AWS Elastic Beanstalk

```bash
# Committer les changements
git add .
git commit -m "feat: Add dynamic pricing system v2.4.0"

# Déployer via Amplify
amplify publish

# Ou déployer manuellement sur EB
eb deploy subscriptions-contracts-env
```

### 3. Vérifier le déploiement

```bash
# Tester l'API en production
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing

# Vérifier la collection MongoDB
# Se connecter à MongoDB Atlas et vérifier que la collection 'pricing' existe
```

---

## 🧪 Tests

### Test de calcul de prix

```javascript
const pricingService = require('./services/pricingService');

async function testPricing() {
  // Test 1: Transporteur invité
  const result1 = await pricingService.calculatePrice(
    'TRANSPORTEUR',
    { invitedBy: 'EXPEDITEUR' }
  );
  console.log('Transporteur invité:', result1.finalPrice); // 0€

  // Test 2: Transporteur premium
  const result2 = await pricingService.calculatePrice(
    'TRANSPORTEUR',
    { hasFeatures: ['create_orders'] }
  );
  console.log('Transporteur premium:', result2.finalPrice); // 499€

  // Test 3: Industriel avec promo
  const result3 = await pricingService.calculatePrice(
    'EXPEDITEUR',
    {},
    'LAUNCH2025'
  );
  console.log('Industriel avec LAUNCH2025:', result3.finalPrice); // 249.5€
}
```

---

## 📊 Statistiques

**Nombre de fichiers**: 4
**Lignes de code**: ~1500
**Endpoints API**: 13 (7 principaux + 6 utilitaires)
**Types de comptes**: 6
**Collections MongoDB**: 1 nouvelle (`pricing`)

---

## ✅ Checklist de Déploiement

- [ ] Copier les fichiers dans le backend
- [ ] Enregistrer les routes dans app.js
- [ ] Configurer MONGODB_URI dans .env
- [ ] Exécuter le script de seed
- [ ] Tester les endpoints en local
- [ ] Implémenter l'authentification admin (production)
- [ ] Déployer sur AWS EB
- [ ] Vérifier les endpoints en production
- [ ] Documenter les URLs pour le frontend
- [ ] Créer l'interface admin (Jour 3)

---

## 🆘 Support

En cas de problème:

1. Vérifier la connexion MongoDB
2. Vérifier que les routes sont bien enregistrées
3. Consulter les logs du serveur
4. Tester avec curl ou Postman

---

**Version**: 2.4.0
**Date**: 2025-11-24
**Auteur**: RT Technologie
**Service**: subscriptions-contracts
