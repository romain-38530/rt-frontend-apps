# 📋 Plan de Déploiement - Système de Types de Comptes

**Date**: 2025-11-24
**Objectif**: Déployer la gestion des types de comptes après signature contrat + souscription abonnement

---

## 🎯 Objectifs

### Flux Utilisateur Cible
1. Client signe un contrat ✅ (déjà en place via subscriptions-contracts)
2. Client souscrit à un abonnement ✅ (déjà en place via subscriptions-contracts)
3. **Client accède à son espace dédié** 🆕
4. **Client choisit son type de compte** 🆕
5. Client est redirigé vers son portail spécifique 🆕

### Types de Comptes

#### Comptes Créables Directement
- ✅ **Industriel** - Peut générer des commandes
- ✅ **Transporteur** - Peut accepter et gérer des missions
- ✅ **Logisticien** - Gestion warehouse et palettes
- ✅ **Transitaire** - Coordination multi-modale

#### Comptes Non-Créables Directement
- ❌ **Fournisseur** - Peut seulement suivre (pas générer)
- ❌ **Destinataire** - Peut seulement suivre (pas générer)

#### Évolution de Compte
- ✅ **Fournisseur → Industriel** - Si le système plaît
- ✅ **Destinataire → Industriel** - Si le système plaît

---

## 📐 Architecture Complète

### 1. Base de Données (MongoDB)

#### Collection `users`
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String,

  // Données entreprise (depuis VAT validation)
  company: {
    vatNumber: String,
    name: String,
    address: String,
    countryCode: String
  },

  // Type de compte
  accountType: String, // 'industry' | 'transporter' | 'logistician' | 'forwarder' | 'supplier' | 'recipient'
  accountStatus: String, // 'pending_selection' | 'active' | 'suspended'

  // Abonnement
  subscription: {
    id: ObjectId, // Référence vers subscriptions collection
    planId: ObjectId,
    status: String, // 'active' | 'cancelled' | 'expired'
    startDate: Date,
    endDate: Date
  },

  // Contrat
  contract: {
    id: ObjectId, // Référence vers contracts collection
    signedAt: Date,
    signatureId: String
  },

  // Permissions
  permissions: [String], // ['create_orders', 'manage_fleet', 'view_analytics', ...]

  // Evolution de compte
  accountHistory: [{
    previousType: String,
    newType: String,
    upgradedAt: Date,
    reason: String
  }],

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

#### Collection `account_types`
```javascript
{
  _id: ObjectId,
  type: String, // 'industry', 'transporter', etc.
  displayName: String,
  description: String,

  // Permissions par défaut
  defaultPermissions: [String],

  // Peut créer des commandes ?
  canGenerateOrders: Boolean,

  // Peut évoluer depuis ?
  allowUpgradeFrom: [String], // ['supplier', 'recipient']

  // Portail assigné
  portalUrl: String, // URL du portail spécifique
  amplifyAppId: String,

  // Features disponibles
  features: [String],

  // Configuration
  isDirectlyCreatable: Boolean, // false pour supplier/recipient

  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Backend - Nouveaux Endpoints

### Service: `account-management` (Nouveau)

**Déploiement**: Nouveau service Elastic Beanstalk

#### Endpoints à Créer

##### 1. Sélection de Type de Compte
```
POST /api/account/select-type
Body: {
  userId: string,
  accountType: 'industry' | 'transporter' | 'logistician' | 'forwarder'
}
Response: {
  success: boolean,
  user: User,
  portalUrl: string,
  redirectUrl: string
}
```

##### 2. Vérification Éligibilité
```
POST /api/account/check-eligibility
Body: {
  userId: string,
  desiredType: string
}
Response: {
  eligible: boolean,
  reasons: string[],
  requiredSteps: string[]
}
```

##### 3. Évolution de Compte
```
POST /api/account/upgrade
Body: {
  userId: string,
  fromType: 'supplier' | 'recipient',
  toType: 'industry',
  reason: string
}
Response: {
  success: boolean,
  newAccountType: string,
  newPermissions: string[],
  newPortalUrl: string
}
```

##### 4. Récupération Info Compte
```
GET /api/account/:userId
Response: {
  accountType: string,
  accountStatus: string,
  permissions: string[],
  subscription: Subscription,
  contract: Contract,
  portalUrl: string,
  canUpgrade: boolean,
  availableUpgrades: string[]
}
```

##### 5. Liste Types de Comptes Disponibles
```
GET /api/account-types/available
Query: { userId: string }
Response: {
  types: AccountType[],
  currentType: string | null,
  canCreate: string[], // Types directement créables
  canUpgradeTo: string[] // Types accessibles par upgrade
}
```

---

## 💻 Frontend - Nouvelles Pages

### 1. Page Sélection Type de Compte

**URL**: `/account/select-type`
**Route**: `apps/marketing-site/src/app/account/select-type/page.tsx`

**Composant Principal**:
```typescript
// apps/marketing-site/src/app/account/select-type/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AccountType {
  type: string;
  displayName: string;
  description: string;
  features: string[];
  portalUrl: string;
  canGenerateOrders: boolean;
}

export default function SelectAccountTypePage() {
  const router = useRouter();
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Récupérer les types de comptes disponibles
    fetchAvailableAccountTypes();
  }, []);

  const handleSelectType = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/account/select-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(), // À implémenter
          accountType: type
        })
      });

      const data = await response.json();

      if (data.success) {
        // Rediriger vers le portail approprié
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      console.error('Error selecting account type:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">
        Choisissez votre type de compte
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accountTypes.map((type) => (
          <AccountTypeCard
            key={type.type}
            type={type}
            selected={selectedType === type.type}
            onSelect={() => setSelectedType(type.type)}
            onConfirm={() => handleSelectType(type.type)}
            disabled={loading}
          />
        ))}
      </div>
    </div>
  );
}
```

**Composant Card**:
```typescript
// apps/marketing-site/src/components/AccountTypeCard.tsx
interface AccountTypeCardProps {
  type: AccountType;
  selected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  disabled: boolean;
}

export function AccountTypeCard({
  type,
  selected,
  onSelect,
  onConfirm,
  disabled
}: AccountTypeCardProps) {
  return (
    <div
      className={`
        border-2 rounded-lg p-6 cursor-pointer transition-all
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
      `}
      onClick={!disabled ? onSelect : undefined}
    >
      <h3 className="text-2xl font-semibold mb-2">{type.displayName}</h3>
      <p className="text-gray-600 mb-4">{type.description}</p>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Fonctionnalités :</h4>
        <ul className="list-disc list-inside space-y-1">
          {type.features.map((feature, index) => (
            <li key={index} className="text-sm text-gray-700">{feature}</li>
          ))}
        </ul>
      </div>

      {type.canGenerateOrders && (
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm mb-4">
          ✓ Peut générer des commandes
        </div>
      )}

      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          disabled={disabled}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {disabled ? 'Activation...' : 'Activer ce compte'}
        </button>
      )}
    </div>
  );
}
```

### 2. Page Évolution de Compte

**URL**: `/account/upgrade`
**Route**: `apps/marketing-site/src/app/account/upgrade/page.tsx`

```typescript
// apps/marketing-site/src/app/account/upgrade/page.tsx
'use client';

export default function UpgradeAccountPage() {
  const [currentType, setCurrentType] = useState<string>('');
  const [availableUpgrades, setAvailableUpgrades] = useState<AccountType[]>([]);
  const [reason, setReason] = useState<string>('');

  const handleUpgrade = async (toType: string) => {
    const response = await fetch('/api/account/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: getUserId(),
        fromType: currentType,
        toType,
        reason
      })
    });

    const data = await response.json();

    if (data.success) {
      // Afficher message de succès
      // Rediriger vers nouveau portail
      window.location.href = data.newPortalUrl;
    }
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">
        Évoluer vers un compte Industriel
      </h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Compte actuel : {currentType}
        </h2>
        <p className="text-gray-700">
          En passant à un compte Industriel, vous pourrez :
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Générer vos propres commandes de transport</li>
          <li>Gérer votre flotte de palettes</li>
          <li>Accéder aux analytics avancées</li>
          <li>Créer des contrats avec des transporteurs</li>
        </ul>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Pourquoi souhaitez-vous passer à un compte Industriel ?
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded p-3"
          rows={4}
          placeholder="Décrivez vos besoins..."
        />
      </div>

      <button
        onClick={() => handleUpgrade('industry')}
        disabled={!reason.trim()}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Évoluer vers un compte Industriel
      </button>
    </div>
  );
}
```

### 3. Page Tableau de Bord Compte

**URL**: `/account/dashboard`
**Route**: `apps/marketing-site/src/app/account/dashboard/page.tsx`

```typescript
// apps/marketing-site/src/app/account/dashboard/page.tsx
'use client';

export default function AccountDashboardPage() {
  const [accountInfo, setAccountInfo] = useState<any>(null);

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">Mon Compte</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informations compte */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Type de compte</h2>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {accountInfo?.accountType}
          </div>
          <div className="text-sm text-gray-600">
            Status: {accountInfo?.accountStatus}
          </div>

          {accountInfo?.canUpgrade && (
            <Link
              href="/account/upgrade"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded"
            >
              Évoluer mon compte
            </Link>
          )}
        </div>

        {/* Abonnement */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Abonnement</h2>
          <div className="text-lg font-medium mb-2">
            Plan: {accountInfo?.subscription?.plan}
          </div>
          <div className="text-sm text-gray-600">
            Expire le: {accountInfo?.subscription?.endDate}
          </div>
        </div>

        {/* Contrat */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Contrat</h2>
          <div className="text-sm text-gray-600 mb-2">
            Signé le: {accountInfo?.contract?.signedAt}
          </div>
          <button className="text-blue-600 hover:underline">
            Voir le contrat
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div className="mt-8 bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Mes Permissions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {accountInfo?.permissions?.map((permission: string) => (
            <div key={permission} className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              {permission}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Flux Utilisateur Complet

### 1. Après Onboarding Initial

```
Utilisateur remplit formulaire onboarding
    ↓
Validation TVA + Données entreprise
    ↓
Utilisateur voit les plans d'abonnement
    ↓
Utilisateur choisit un plan
    ↓
Génération du contrat
    ↓
Signature électronique du contrat
    ↓
Création de l'abonnement
    ↓
[NOUVEAU] Redirection vers /account/select-type
    ↓
Utilisateur choisit son type de compte
    ↓
Compte activé avec permissions
    ↓
Redirection vers portail spécifique
```

### 2. Évolution de Compte (Supplier/Recipient → Industry)

```
Utilisateur connecté avec compte Supplier/Recipient
    ↓
Navigation vers /account/dashboard
    ↓
Bouton "Évoluer mon compte" visible
    ↓
Click → Redirection vers /account/upgrade
    ↓
Utilisateur explique ses besoins
    ↓
Validation et upgrade du compte
    ↓
Permissions mises à jour
    ↓
Redirection vers portail Industriel
```

---

## 📊 Mapping Types → Portails

```javascript
const ACCOUNT_TYPE_MAPPING = {
  industry: {
    displayName: 'Industriel',
    portalUrl: 'https://main.dbg6okncuyyiw.amplifyapp.com',
    amplifyAppId: 'dbg6okncuyyiw',
    permissions: ['create_orders', 'manage_palettes', 'view_analytics', 'manage_contracts'],
    canGenerateOrders: true,
    features: [
      'Créer des commandes de transport',
      'Gérer les palettes et stocks',
      'Analytics et rapports avancés',
      'Gestion de contrats transporteurs'
    ]
  },

  transporter: {
    displayName: 'Transporteur',
    portalUrl: 'https://main.d1tb834u144p4r.amplifyapp.com',
    amplifyAppId: 'd1tb834u144p4r',
    permissions: ['accept_missions', 'manage_fleet', 'update_delivery_status', 'driver_management'],
    canGenerateOrders: true,
    features: [
      'Accepter des missions de transport',
      'Gérer la flotte de véhicules',
      'Suivi des livraisons en temps réel',
      'Gestion des chauffeurs'
    ]
  },

  logistician: {
    displayName: 'Logisticien',
    portalUrl: 'https://main.d3hz3xvddrl94o.amplifyapp.com',
    amplifyAppId: 'd3hz3xvddrl94o',
    permissions: ['scan_qr', 'update_palette_status', 'warehouse_management', 'offline_sync'],
    canGenerateOrders: true,
    features: [
      'Scanner les QR codes',
      'Gérer les emplacements warehouse',
      'Suivi des palettes',
      'Mode hors ligne avec synchronisation'
    ]
  },

  forwarder: {
    displayName: 'Transitaire',
    portalUrl: 'https://main.dzvo8973zaqb.amplifyapp.com',
    amplifyAppId: 'dzvo8973zaqb',
    permissions: ['manage_multimodal', 'coordinate_carriers', 'track_shipments', 'generate_reports'],
    canGenerateOrders: true,
    features: [
      'Coordonner les transports multi-modaux',
      'Gérer plusieurs transporteurs',
      'Suivi global des expéditions',
      'Génération de rapports personnalisés'
    ]
  },

  supplier: {
    displayName: 'Fournisseur',
    portalUrl: 'https://main.d3b6p09ihn5w7r.amplifyapp.com',
    amplifyAppId: 'd3b6p09ihn5w7r',
    permissions: ['view_orders', 'schedule_pickups', 'manage_catalog', 'chat_support'],
    canGenerateOrders: false,
    isDirectlyCreatable: false,
    features: [
      'Voir les commandes clients',
      'Planifier les enlèvements',
      'Gérer le catalogue produits',
      'Support chat en direct'
    ]
  },

  recipient: {
    displayName: 'Destinataire',
    portalUrl: 'https://main.d3b6p09ihn5w7r.amplifyapp.com',
    amplifyAppId: 'd3b6p09ihn5w7r',
    permissions: ['track_shipments', 'confirm_deliveries', 'manage_schedule', 'chat_support'],
    canGenerateOrders: false,
    isDirectlyCreatable: false,
    features: [
      'Suivre les livraisons',
      'Confirmer les réceptions',
      'Gérer le planning de réception',
      'Support chat en direct'
    ]
  }
};
```

---

## 🔧 Modifications Services Existants

### Service authz-eb (Authentification)

**Modifications à apporter** :

1. **Ajouter champs dans la réponse de login** :
```javascript
// POST /api/auth/login
Response: {
  token: string,
  user: {
    id: string,
    email: string,
    accountType: string | null,
    accountStatus: string,
    needsAccountTypeSelection: boolean, // true si accountType === null
    portalUrl: string | null
  }
}
```

2. **Ajouter endpoint de vérification** :
```javascript
// GET /api/auth/verify-account-setup
Response: {
  setupComplete: boolean,
  missingSteps: string[], // ['account_type_selection', 'subscription', 'contract']
  nextStepUrl: string
}
```

### Service subscriptions-contracts

**Modifications à apporter** :

1. **Webhook après signature contrat** :
```javascript
// Après signature réussie, déclencher :
POST /api/account/trigger-account-setup
Body: {
  userId: string,
  contractId: string,
  subscriptionId: string
}
```

2. **Ajouter statut dans subscription** :
```javascript
subscription: {
  accountSetupComplete: boolean,
  accountType: string | null
}
```

---

## 📦 Nouveau Service Backend

### Service: `account-management-eb`

**Stack Technique** :
- Node.js 20
- Express.js
- MongoDB
- JWT Authentication

**Déploiement** :
- AWS Elastic Beanstalk
- CloudFront HTTPS
- MongoDB Atlas (même cluster que subscriptions)

**Structure** :
```
services/account-management-eb/
├── index.js                 # Point d'entrée Express
├── package.json
├── Procfile
├── .elasticbeanstalk/
├── .ebextensions/
├── src/
│   ├── controllers/
│   │   ├── accountController.js
│   │   ├── accountTypeController.js
│   │   └── upgradeController.js
│   ├── models/
│   │   ├── User.js
│   │   └── AccountType.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── permissions.js
│   ├── routes/
│   │   ├── account.js
│   │   └── accountTypes.js
│   └── utils/
│       ├── permissions.js
│       └── portalMapping.js
├── README.md
└── DEPLOYMENT.md
```

---

## 🚀 Plan de Déploiement en 5 Phases

### Phase 1: Préparation Backend (2-3 jours)

1. **Créer le service account-management-eb** :
   ```bash
   cd rt-backend-services/services
   mkdir account-management-eb
   cd account-management-eb
   npm init -y
   npm install express mongodb cors helmet jsonwebtoken bcrypt
   ```

2. **Implémenter les endpoints** :
   - [ ] POST /api/account/select-type
   - [ ] POST /api/account/check-eligibility
   - [ ] POST /api/account/upgrade
   - [ ] GET /api/account/:userId
   - [ ] GET /api/account-types/available

3. **Tester localement** :
   ```bash
   npm run dev
   # Tester tous les endpoints avec Postman
   ```

4. **Déployer sur Elastic Beanstalk** :
   ```bash
   eb init
   eb create account-management-api-prod
   eb deploy
   ```

5. **Configurer CloudFront HTTPS**

### Phase 2: Préparation Frontend (2-3 jours)

1. **Créer les nouvelles pages** :
   - [ ] `/account/select-type`
   - [ ] `/account/upgrade`
   - [ ] `/account/dashboard`

2. **Créer les composants** :
   - [ ] AccountTypeCard
   - [ ] UpgradeForm
   - [ ] AccountDashboard
   - [ ] PermissionsList

3. **Ajouter les types TypeScript** :
   ```bash
   # Ajouter dans src/types/api.ts
   ```

4. **Implémenter les hooks** :
   - [ ] useAccountTypes
   - [ ] useAccountUpgrade
   - [ ] useAccountInfo

5. **Tester localement** :
   ```bash
   cd apps/marketing-site
   pnpm dev
   # Tester le flux complet
   ```

### Phase 3: Intégration (1-2 jours)

1. **Modifier le flux d'onboarding** :
   - [ ] Après signature contrat → Redirection vers /account/select-type
   - [ ] Après sélection type → Redirection vers portail approprié

2. **Modifier authz-eb** :
   - [ ] Ajouter champs accountType dans users
   - [ ] Modifier /api/auth/login pour retourner accountType
   - [ ] Ajouter endpoint /api/auth/verify-account-setup

3. **Modifier subscriptions-contracts** :
   - [ ] Ajouter webhook après signature
   - [ ] Déclencher setup compte après souscription

4. **Variables d'environnement** :
   ```bash
   # Ajouter dans AWS Amplify
   NEXT_PUBLIC_ACCOUNT_API_URL=https://[cloudfront-account].cloudfront.net
   ```

### Phase 4: Tests (1-2 jours)

1. **Tests Unitaires Backend** :
   - [ ] Test sélection type compte
   - [ ] Test vérification éligibilité
   - [ ] Test upgrade compte
   - [ ] Test permissions

2. **Tests d'Intégration** :
   - [ ] Flux complet onboarding → sélection type → portail
   - [ ] Flux upgrade supplier → industry
   - [ ] Flux upgrade recipient → industry

3. **Tests E2E Frontend** :
   - [ ] Navigation entre pages
   - [ ] Sélection type et redirection
   - [ ] Upgrade et redirection

4. **Tests de Charge** :
   - [ ] Charge API account-management
   - [ ] Performance MongoDB queries

### Phase 5: Déploiement Production (1 jour)

1. **Déployer Backend** :
   ```bash
   cd services/account-management-eb
   eb deploy
   # Vérifier health check
   ```

2. **Déployer Frontend** :
   ```bash
   git add .
   git commit -m "feat: Add account type selection and upgrade system"
   git push origin main
   # Amplify déploie automatiquement
   ```

3. **Vérifications Post-Déploiement** :
   - [ ] Health checks tous services
   - [ ] Test flux complet en production
   - [ ] Monitoring CloudWatch actif
   - [ ] Logs accessibles

4. **Documentation** :
   - [ ] Mettre à jour PRODUCTION_SERVICES.md
   - [ ] Ajouter guide utilisateur
   - [ ] Documenter API account-management

---

## 📊 Checklist Complète

### Backend
- [ ] Service account-management-eb créé
- [ ] Endpoints implémentés et testés
- [ ] MongoDB collections créées
- [ ] Déployé sur Elastic Beanstalk
- [ ] CloudFront HTTPS configuré
- [ ] Modifications authz-eb déployées
- [ ] Modifications subscriptions-contracts déployées

### Frontend
- [ ] Page select-type créée
- [ ] Page upgrade créée
- [ ] Page dashboard créée
- [ ] Composants créés
- [ ] Types TypeScript ajoutés
- [ ] Hooks implémentés
- [ ] Tests E2E passants
- [ ] Déployé sur Amplify

### Intégration
- [ ] Flux onboarding modifié
- [ ] Redirections configurées
- [ ] Variables d'environnement ajoutées
- [ ] Webhooks configurés

### Documentation
- [ ] API documentation
- [ ] Guide utilisateur
- [ ] Guide développeur
- [ ] Diagrammes de flux

---

## 🎯 Résultat Attendu

Après déploiement complet, l'utilisateur aura ce parcours :

1. ✅ Remplit formulaire onboarding (VAT + données)
2. ✅ Choisit un plan d'abonnement
3. ✅ Signe le contrat électroniquement
4. ✅ **Choisit son type de compte** (Industriel/Transporteur/Logisticien/Transitaire)
5. ✅ **Est redirigé vers son portail spécifique**
6. ✅ Peut accéder à toutes les fonctionnalités de son type
7. ✅ **Peut évoluer** vers compte Industriel si nécessaire (pour Supplier/Recipient)

---

## 📞 Ressources

### URLs de Développement
- Account Management API: https://[cloudfront-id].cloudfront.net
- Frontend Select Type: https://main.df8cnylp3pqka.amplifyapp.com/account/select-type
- Frontend Dashboard: https://main.df8cnylp3pqka.amplifyapp.com/account/dashboard

### Documentation
- MongoDB Atlas: https://cloud.mongodb.com
- AWS Elastic Beanstalk: https://console.aws.amazon.com/elasticbeanstalk
- AWS CloudFront: https://console.aws.amazon.com/cloudfront

---

**Date de création**: 2025-11-24
**Estimation durée totale**: 7-12 jours
**Priorité**: Haute
**Status**: 📋 Plan prêt - En attente de validation
