# Système de Gestion des Prix - Plan d'Implémentation

**Date**: 2025-11-24
**Version**: 1.0.0
**Estimation**: 2-3 jours de développement

---

## 🎯 Objectif

Créer un système de gestion dynamique des prix pour les types de compte RT Technologie, permettant de :
- ✅ Modifier les prix sans redéploiement
- ✅ Gérer les promotions et réductions
- ✅ Afficher les prix conditionnels (invité vs premium)
- ✅ Historique des changements de prix
- ✅ Interface admin pour la gestion

---

## 📊 Architecture du Système

### Vue d'Ensemble

```
Backoffice Admin (Next.js)
    ↓
API Pricing (subscriptions-contracts v2.4.0)
    ↓
MongoDB Collection: pricing
    ↓
Frontend Marketing Site (récupère les prix dynamiquement)
    ↓
Affichage utilisateur avec prix à jour
```

---

## 💾 MongoDB Schema

### Collection : `pricing`

```javascript
{
  _id: ObjectId,
  accountType: String,           // "TRANSPORTEUR", "EXPEDITEUR", etc.
  displayName: String,           // "Transporteur"

  // Prix de base
  basePrice: Number,             // 49
  currency: String,              // "EUR"
  billingPeriod: String,         // "monthly" | "yearly"

  // Variantes de prix
  variants: [
    {
      name: String,              // "TRANSPORTEUR_INVITE"
      displayName: String,       // "Transporteur (invité)"
      price: Number,             // 0
      conditions: {
        invitedBy: String,       // "EXPEDITEUR"
        minOrders: Number,       // null
        minRevenue: Number        // null
      }
    },
    {
      name: String,              // "TRANSPORTEUR_PREMIUM"
      displayName: String,       // "Transporteur Premium"
      price: Number,             // 499
      conditions: {
        hasFeatures: [String]    // ["create_orders", "manage_contracts"]
      }
    }
  ],

  // Configuration
  isActive: Boolean,             // true
  isCreatable: Boolean,          // true
  canUpgradeTo: [String],        // ["COMMISSIONNAIRE"]

  // Promotions
  promotions: [
    {
      code: String,              // "LAUNCH2025"
      discount: Number,          // 20 (pourcentage)
      discountType: String,      // "percentage" | "fixed"
      validFrom: Date,
      validUntil: Date,
      maxUses: Number,
      currentUses: Number
    }
  ],

  // Évolution des prix
  upgradePrice: {
    fromTypes: [String],         // ["TRANSPORTEUR"]
    toType: String,              // "COMMISSIONNAIRE"
    price: Number,               // 299
    setupFee: Number             // 0
  },

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  updatedBy: String,             // userId de l'admin

  // Historique
  priceHistory: [
    {
      previousPrice: Number,
      newPrice: Number,
      changedAt: Date,
      changedBy: String,
      reason: String
    }
  ]
}
```

**Indexes** :
```javascript
db.pricing.createIndex({ accountType: 1 }, { unique: true });
db.pricing.createIndex({ isActive: 1 });
db.pricing.createIndex({ "variants.name": 1 });
```

---

## 🔌 API Endpoints

### 1. GET `/api/pricing`

Liste tous les prix actifs.

**Query Parameters** :
- `includeInactive` (optional) : Inclure les types inactifs (admin)

**Response** :
```json
{
  "success": true,
  "data": [
    {
      "accountType": "TRANSPORTEUR",
      "displayName": "Transporteur",
      "basePrice": 49,
      "currency": "EUR",
      "billingPeriod": "monthly",
      "variants": [
        {
          "name": "TRANSPORTEUR_INVITE",
          "displayName": "Transporteur (invité)",
          "price": 0,
          "conditions": { "invitedBy": "EXPEDITEUR" }
        },
        {
          "name": "TRANSPORTEUR_PREMIUM",
          "displayName": "Transporteur Premium",
          "price": 499,
          "conditions": { "hasFeatures": ["create_orders"] }
        }
      ],
      "isCreatable": true
    },
    // ... autres types
  ]
}
```

---

### 2. GET `/api/pricing/:accountType`

Récupère le pricing d'un type de compte spécifique.

**Response** :
```json
{
  "success": true,
  "data": {
    "accountType": "TRANSPORTEUR",
    "displayName": "Transporteur",
    "basePrice": 49,
    "currency": "EUR",
    "variants": [ ... ],
    "promotions": [ ... ]
  }
}
```

---

### 3. POST `/api/pricing/calculate`

Calcule le prix final en fonction des conditions.

**Request Body** :
```json
{
  "accountType": "TRANSPORTEUR",
  "conditions": {
    "invitedBy": "EXPEDITEUR"
  },
  "promoCode": "LAUNCH2025"
}
```

**Response** :
```json
{
  "success": true,
  "data": {
    "accountType": "TRANSPORTEUR",
    "variant": "TRANSPORTEUR_INVITE",
    "basePrice": 49,
    "discount": 49,
    "promoDiscount": 0,
    "finalPrice": 0,
    "currency": "EUR",
    "billingPeriod": "monthly",
    "appliedConditions": {
      "invitedBy": "EXPEDITEUR"
    }
  }
}
```

---

### 4. POST `/api/pricing` (Admin)

Créer ou mettre à jour un pricing.

**Headers** :
```
Authorization: Bearer <admin-token>
```

**Request Body** :
```json
{
  "accountType": "TRANSPORTEUR",
  "displayName": "Transporteur",
  "basePrice": 49,
  "currency": "EUR",
  "billingPeriod": "monthly",
  "variants": [ ... ],
  "isActive": true,
  "isCreatable": true
}
```

**Response** :
```json
{
  "success": true,
  "data": { ... },
  "message": "Pricing mis à jour avec succès"
}
```

---

### 5. PUT `/api/pricing/:accountType` (Admin)

Mettre à jour un pricing existant.

**Headers** :
```
Authorization: Bearer <admin-token>
```

**Request Body** :
```json
{
  "basePrice": 59,
  "reason": "Ajustement pour inflation"
}
```

**Response** :
```json
{
  "success": true,
  "data": { ... },
  "message": "Prix mis à jour de 49€ à 59€"
}
```

---

### 6. POST `/api/pricing/:accountType/promotion` (Admin)

Ajouter une promotion.

**Request Body** :
```json
{
  "code": "LAUNCH2025",
  "discount": 20,
  "discountType": "percentage",
  "validFrom": "2025-01-01",
  "validUntil": "2025-12-31",
  "maxUses": 1000
}
```

---

### 7. GET `/api/pricing/:accountType/history` (Admin)

Historique des changements de prix.

**Response** :
```json
{
  "success": true,
  "data": [
    {
      "previousPrice": 49,
      "newPrice": 59,
      "changedAt": "2025-11-24T10:00:00Z",
      "changedBy": "admin-123",
      "reason": "Ajustement pour inflation"
    }
  ]
}
```

---

## 🎨 Interface Backoffice Admin

### Page : `/admin/pricing`

**Sections** :

#### 1. Liste des Types de Compte

```
┌─────────────────────────────────────────────────────────────┐
│ Gestion des Prix des Comptes                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┬──────────────┬──────────┬──────┬─────────┐ │
│ │ Type        │ Nom          │ Prix     │ Actif│ Actions │ │
│ ├─────────────┼──────────────┼──────────┼──────┼─────────┤ │
│ │ TRANSPORTEUR│ Transporteur │ 49€/mois │  ✓   │ Éditer  │ │
│ │ EXPEDITEUR  │ Expéditeur   │ 29€/mois │  ✓   │ Éditer  │ │
│ │ PLATEFORME_ │ Plateforme   │ 199€/mois│  ✓   │ Éditer  │ │
│ │ LOGISTIQUE  │ Logistique   │          │      │         │ │
│ └─────────────┴──────────────┴──────────┴──────┴─────────┘ │
│                                                             │
│ [+ Ajouter un nouveau type de compte]                      │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Formulaire d'Édition

```
┌─────────────────────────────────────────────────────────────┐
│ Éditer Prix - Transporteur                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Type de compte*        [TRANSPORTEUR           ▼]          │
│ Nom d'affichage*       [Transporteur                    ]  │
│                                                             │
│ Prix de base (EUR)*    [49                              ]  │
│ Période de facturation [Mensuel                ▼]          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Variantes de Prix                          [+ Ajouter] ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Transporteur (invité)                                   ││
│ │ Prix: 0€ | Condition: Invité par EXPEDITEUR   [Éditer] ││
│ │                                                         ││
│ │ Transporteur Premium                                    ││
│ │ Prix: 499€ | Condition: Fonctions industriel [Éditer] ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Promotions Actives                         [+ Ajouter] ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Code: LAUNCH2025 | -20% | Expire: 31/12/2025 [Éditer] ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Créable directement    [✓] Oui  [ ] Non                   │
│ Actif                  [✓] Oui  [ ] Non                   │
│                                                             │
│ Raison du changement   [________________________________]  │
│                                                             │
│ [Annuler]                               [Enregistrer]      │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Historique des Prix

```
┌─────────────────────────────────────────────────────────────┐
│ Historique - Transporteur                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────┬────────┬─────────┬──────────────────────────┐│
│ │ Date      │ Ancien │ Nouveau │ Raison                   ││
│ ├───────────┼────────┼─────────┼──────────────────────────┤│
│ │ 24/11/2025│ 49€    │ 59€     │ Ajustement inflation     ││
│ │ 15/09/2025│ 39€    │ 49€     │ Ajout fonctionnalités    ││
│ └───────────┴────────┴─────────┴──────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implémentation Frontend

### Hook : `usePricing`

```typescript
// hooks/usePricing.ts
import { useState, useEffect, useCallback } from 'react';

export interface PricingVariant {
  name: string;
  displayName: string;
  price: number;
  conditions: Record<string, any>;
}

export interface Pricing {
  accountType: string;
  displayName: string;
  basePrice: number;
  currency: string;
  billingPeriod: string;
  variants: PricingVariant[];
  isCreatable: boolean;
}

export function usePricing() {
  const [pricing, setPricing] = useState<Record<string, Pricing>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL;

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/pricing`);
      if (!response.ok) throw new Error('Failed to fetch pricing');

      const result = await response.json();

      // Convert array to object keyed by accountType
      const pricingMap: Record<string, Pricing> = {};
      result.data.forEach((p: Pricing) => {
        pricingMap[p.accountType] = p;
      });

      setPricing(pricingMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = useCallback(async (
    accountType: string,
    conditions?: Record<string, any>,
    promoCode?: string
  ) => {
    try {
      const response = await fetch(`${apiUrl}/api/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType, conditions, promoCode })
      });

      if (!response.ok) throw new Error('Failed to calculate price');

      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Error calculating price:', err);
      return null;
    }
  }, [apiUrl]);

  return {
    pricing,
    loading,
    error,
    calculatePrice,
    refreshPricing: fetchPricing
  };
}
```

### Usage dans les Pages

```typescript
// app/account/select-type/page.tsx
import { usePricing } from '@/hooks/usePricing';

export default function SelectAccountTypePage() {
  const { pricing, loading, calculatePrice } = usePricing();
  const [calculatedPrices, setCalculatedPrices] = useState({});

  useEffect(() => {
    if (!loading && pricing) {
      // Calculer les prix selon les conditions de l'utilisateur
      calculatePricesForUser();
    }
  }, [loading, pricing]);

  const calculatePricesForUser = async () => {
    const conditions = { invitedBy: userInvitedBy }; // From user data

    const prices = {};
    for (const type in pricing) {
      const calculated = await calculatePrice(type, conditions);
      prices[type] = calculated;
    }

    setCalculatedPrices(prices);
  };

  return (
    <div>
      {Object.values(pricing).map((p) => (
        <AccountTypeCard
          key={p.accountType}
          accountType={p.accountType}
          displayName={p.displayName}
          price={calculatedPrices[p.accountType]?.finalPrice || p.basePrice}
          currency={p.currency}
          billingPeriod={p.billingPeriod}
        />
      ))}
    </div>
  );
}
```

---

## 🗂️ Structure des Fichiers Backend

```
subscriptions-contracts/
├── index.js (mise à jour)
├── routes/
│   ├── planRoutes.js
│   ├── subscriptionRoutes.js
│   ├── contractRoutes.js
│   ├── ecmrRoutes.js
│   └── pricingRoutes.js (NEW!)
├── models/
│   └── pricing.js (NEW!)
└── services/
    └── pricingService.js (NEW!)
```

### pricing.js (Model)

```javascript
// models/pricing.js
const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: String,
  displayName: String,
  price: Number,
  conditions: mongoose.Schema.Types.Mixed
});

const promotionSchema = new mongoose.Schema({
  code: String,
  discount: Number,
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  validFrom: Date,
  validUntil: Date,
  maxUses: Number,
  currentUses: { type: Number, default: 0 }
});

const priceHistorySchema = new mongoose.Schema({
  previousPrice: Number,
  newPrice: Number,
  changedAt: Date,
  changedBy: String,
  reason: String
});

const pricingSchema = new mongoose.Schema({
  accountType: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  basePrice: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  billingPeriod: { type: String, default: 'monthly' },
  variants: [variantSchema],
  isActive: { type: Boolean, default: true },
  isCreatable: { type: Boolean, default: true },
  canUpgradeTo: [String],
  promotions: [promotionSchema],
  upgradePrice: {
    fromTypes: [String],
    toType: String,
    price: Number,
    setupFee: { type: Number, default: 0 }
  },
  priceHistory: [priceHistorySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: String
});

module.exports = mongoose.model('Pricing', pricingSchema);
```

---

## 📋 Plan de Migration

### Étape 1 : Création des Données Initiales

Script de migration pour peupler la collection `pricing` :

```javascript
// scripts/seed-pricing.js
const initialPricing = [
  {
    accountType: 'TRANSPORTEUR',
    displayName: 'Transporteur',
    basePrice: 49,
    variants: [
      {
        name: 'TRANSPORTEUR_INVITE',
        displayName: 'Transporteur (invité)',
        price: 0,
        conditions: { invitedBy: 'EXPEDITEUR' }
      },
      {
        name: 'TRANSPORTEUR_PREMIUM',
        displayName: 'Transporteur Premium',
        price: 499,
        conditions: { hasFeatures: ['create_orders', 'manage_contracts'] }
      }
    ],
    isCreatable: true
  },
  {
    accountType: 'EXPEDITEUR',
    displayName: 'Expéditeur',
    basePrice: 29,
    variants: [],
    isCreatable: true
  },
  // ... autres types
];

async function seedPricing() {
  for (const pricing of initialPricing) {
    await Pricing.create(pricing);
  }
  console.log('✅ Pricing data seeded');
}
```

---

## 🎯 Timeline d'Implémentation

### Jour 1 (Backend)
- ✅ Créer le modèle Pricing (pricing.js)
- ✅ Créer le service pricingService.js
- ✅ Créer les routes pricingRoutes.js
- ✅ Implémenter les 7 endpoints
- ✅ Tests unitaires

### Jour 2 (Backend + Frontend)
- ✅ Migration des données (seed-pricing.js)
- ✅ Tests d'intégration backend
- ✅ Créer le hook usePricing (frontend)
- ✅ Mettre à jour les pages pour utiliser le pricing dynamique

### Jour 3 (Admin UI)
- ✅ Créer la page /admin/pricing
- ✅ Formulaire d'édition
- ✅ Gestion des variantes
- ✅ Gestion des promotions
- ✅ Historique des prix
- ✅ Tests end-to-end

---

## ✅ Checklist de Validation

### Backend
- [ ] Collection `pricing` créée dans MongoDB
- [ ] 7 endpoints opérationnels
- [ ] Tests unitaires passants
- [ ] Données initiales migrées
- [ ] Déployé sur EB + CloudFront

### Frontend
- [ ] Hook `usePricing` créé et testé
- [ ] Pages mises à jour (select-type, upgrade, dashboard)
- [ ] Affichage des prix dynamiques
- [ ] Calcul des prix conditionnels
- [ ] Tests E2E

### Admin
- [ ] Page /admin/pricing accessible
- [ ] Édition des prix fonctionnelle
- [ ] Gestion des variantes
- [ ] Gestion des promotions
- [ ] Historique visible

---

## 💰 Avantages du Système

✅ **Flexibilité** : Modifier les prix sans redéploiement
✅ **Transparence** : Historique complet des changements
✅ **Promotions** : Codes promo gérables facilement
✅ **Conditions** : Prix différents selon les conditions (invité, premium)
✅ **Scalabilité** : Facilement extensible pour nouveaux types
✅ **Professionnalisme** : Interface admin complète

---

**Date** : 2025-11-24
**Version** : 1.0.0
**Status** : 📋 Plan Prêt pour Implémentation
**Estimation** : 2-3 jours de développement
