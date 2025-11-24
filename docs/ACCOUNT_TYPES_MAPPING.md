# Mapping des Types de Comptes - Frontend ↔ Backend

**Date**: 2025-11-24
**Version**: 2.4.0

---

## 📊 Table de Correspondance

Cette table définit la correspondance exacte entre les noms utilisés dans le frontend et le backend.

| Frontend (Ancien) | Backend (Officiel) | Nom d'Affichage FR | Portal URL | Prix Base |
|-------------------|---------------------|---------------------|------------|-----------|
| `industry` | `EXPEDITEUR` | Industriel (Expéditeur) | https://main.dbg6okncuyyiw.amplifyapp.com | 499€/mois |
| `transporter` | `TRANSPORTEUR` | Transporteur | https://transporter.rt-technologie.com | 49€/mois (ou gratuit si invité) |
| `logistician` | `PLATEFORME_LOGISTIQUE` | Plateforme Logistique | https://logistics.rt-technologie.com | 199€/mois (ou gratuit si invité) |
| `forwarder` | `COMMISSIONNAIRE` | Commissionnaire de Transport | https://forwarder.rt-technologie.com | 299€/mois |
| N/A | `COMMISSIONNAIRE_AGRÉÉ` | Commissionnaire Agréé en Douane | https://forwarder.rt-technologie.com | 599€/mois (upgrade seulement) |
| N/A | `DOUANE` | Administration Douanière | https://customs.rt-technologie.com | 0€ (admin seulement) |

---

## 🎯 Noms Officiels à Utiliser

### Backend (Officiel)

Ces noms sont utilisés dans:
- MongoDB (collection `pricing`, `contracts`, etc.)
- API REST (routes `/api/pricing/:accountType`)
- Service backend (subscriptions-contracts v2.4.0)

```typescript
type BackendAccountType =
  | 'TRANSPORTEUR'
  | 'EXPEDITEUR'
  | 'PLATEFORME_LOGISTIQUE'
  | 'COMMISSIONNAIRE'
  | 'COMMISSIONNAIRE_AGRÉÉ'
  | 'DOUANE';
```

### Frontend (À mettre à jour)

Pour éviter toute confusion, le frontend devrait également utiliser les noms backend officiels.

**Avant** (ancien système):
```typescript
type AccountType = 'industry' | 'transporter' | 'logistician' | 'forwarder';
```

**Après** (nouveau système):
```typescript
import { BackendAccountType } from '@/hooks/usePricing';
// Utiliser directement BackendAccountType
```

---

## 🔄 Structure de Prix par Type

### 1. EXPEDITEUR (Industriel)

**Prix**: 499€/mois

**Variantes**: Aucune (toujours payant)

**Caractéristiques**:
- Crée des commandes de transport
- Peut inviter des transporteurs, logisticiens, commissionnaires (qui deviennent gratuits)
- Accès complet e-CMR
- Tableau de bord analytique
- API access

**Créatable directement**: ✅ OUI

---

### 2. TRANSPORTEUR

**Prix de base**: 49€/mois

**Variantes**:

#### TRANSPORTEUR_INVITE (Gratuit)
- **Conditions**: `{ invitedBy: "EXPEDITEUR" }`
- **Prix**: 0€
- **Fonctionnalités**:
  - Réception de missions
  - Signature e-CMR
  - Suivi GPS
  - Notifications

#### TRANSPORTEUR_PREMIUM (499€/mois)
- **Conditions**: `{ hasFeatures: ["create_orders"] }`
- **Prix**: 499€/mois
- **Fonctionnalités**:
  - Toutes les fonctionnalités INVITE
  - Création de commandes de transport (comme un industriel)
  - Gestion multi-clients
  - Analytique avancée
  - API access

**Créatable directement**: ✅ OUI

---

### 3. PLATEFORME_LOGISTIQUE

**Prix de base**: 199€/mois

**Variantes**:

#### PLATEFORME_LOGISTIQUE_INVITE (Gratuit)
- **Conditions**: `{ invitedBy: "EXPEDITEUR" }`
- **Prix**: 0€
- **Fonctionnalités**:
  - Gestion des stocks
  - Réception/expédition
  - Signature e-CMR
  - Suivi des palettes

#### PLATEFORME_LOGISTIQUE_PREMIUM (199€/mois)
- **Conditions**: `{}`
- **Prix**: 199€/mois
- **Fonctionnalités**:
  - Toutes les fonctionnalités INVITE
  - Multi-clients
  - WMS basique
  - Analytique
  - Intégrations API

**Créatable directement**: ✅ OUI

---

### 4. COMMISSIONNAIRE

**Prix de base**: 299€/mois

**Variantes**:

#### COMMISSIONNAIRE_INVITE (Gratuit)
- **Conditions**: `{ invitedBy: "EXPEDITEUR" }`
- **Prix**: 0€
- **Fonctionnalités**:
  - Gestion des transports
  - Coordination transporteurs
  - Signature e-CMR
  - Suivi multi-modal

#### COMMISSIONNAIRE_PREMIUM (299€/mois)
- **Conditions**: `{}`
- **Prix**: 299€/mois
- **Fonctionnalités**:
  - Toutes les fonctionnalités INVITE
  - Multi-clients
  - Gestion multi-transporteurs
  - Optimisation de routes
  - Analytique avancée

**Créatable directement**: ✅ OUI

---

### 5. COMMISSIONNAIRE_AGRÉÉ

**Prix**: 599€/mois

**Variantes**: Aucune

**Caractéristiques**:
- Toutes les fonctionnalités COMMISSIONNAIRE
- Déclarations en douane
- Gestion des régimes douaniers
- Certificats d'origine
- Intégrations douane EU
- Support prioritaire

**Créatable directement**: ❌ NON (upgrade seulement depuis COMMISSIONNAIRE)

---

### 6. DOUANE

**Prix**: 0€ (admin seulement)

**Variantes**: Aucune

**Caractéristiques**:
- Consultation des déclarations
- Validation des documents
- Suivi des régimes douaniers
- Audit trail complet
- Exports réglementaires

**Créatable directement**: ❌ NON (admin seulement)

---

## 🔧 Code de Mapping (Utilitaires)

### Mapping Frontend → Backend

```typescript
// src/utils/accountTypeMapping.ts

import { BackendAccountType } from '@/hooks/usePricing';

/**
 * Types frontend (anciens) - À NE PLUS UTILISER
 * @deprecated Utiliser directement BackendAccountType
 */
type LegacyFrontendAccountType = 'industry' | 'transporter' | 'logistician' | 'forwarder';

/**
 * Mapping des anciens types frontend vers les types backend officiels
 * @deprecated Cette fonction n'est nécessaire que pour la migration
 */
export function mapFrontendToBackend(frontendType: LegacyFrontendAccountType): BackendAccountType {
  const mapping: Record<LegacyFrontendAccountType, BackendAccountType> = {
    industry: 'EXPEDITEUR',
    transporter: 'TRANSPORTEUR',
    logistician: 'PLATEFORME_LOGISTIQUE',
    forwarder: 'COMMISSIONNAIRE'
  };

  return mapping[frontendType];
}

/**
 * Mapping des types backend vers les anciens types frontend
 * @deprecated Cette fonction n'est nécessaire que pour la rétrocompatibilité
 */
export function mapBackendToFrontend(backendType: BackendAccountType): LegacyFrontendAccountType | null {
  const reverseMapping: Partial<Record<BackendAccountType, LegacyFrontendAccountType>> = {
    EXPEDITEUR: 'industry',
    TRANSPORTEUR: 'transporter',
    PLATEFORME_LOGISTIQUE: 'logistician',
    COMMISSIONNAIRE: 'forwarder'
    // COMMISSIONNAIRE_AGRÉÉ et DOUANE n'ont pas d'équivalent frontend ancien
  };

  return reverseMapping[backendType] || null;
}

/**
 * Obtenir le nom d'affichage pour un type de compte
 */
export function getDisplayName(backendType: BackendAccountType): string {
  const displayNames: Record<BackendAccountType, string> = {
    EXPEDITEUR: 'Industriel (Expéditeur)',
    TRANSPORTEUR: 'Transporteur',
    PLATEFORME_LOGISTIQUE: 'Plateforme Logistique',
    COMMISSIONNAIRE: 'Commissionnaire de Transport',
    COMMISSIONNAIRE_AGRÉÉ: 'Commissionnaire Agréé en Douane',
    DOUANE: 'Administration Douanière'
  };

  return displayNames[backendType];
}

/**
 * Obtenir l'URL du portal pour un type de compte
 */
export function getPortalUrl(backendType: BackendAccountType): string {
  const portalUrls: Record<BackendAccountType, string> = {
    EXPEDITEUR: 'https://main.dbg6okncuyyiw.amplifyapp.com',
    TRANSPORTEUR: 'https://transporter.rt-technologie.com',
    PLATEFORME_LOGISTIQUE: 'https://logistics.rt-technologie.com',
    COMMISSIONNAIRE: 'https://forwarder.rt-technologie.com',
    COMMISSIONNAIRE_AGRÉÉ: 'https://forwarder.rt-technologie.com',
    DOUANE: 'https://customs.rt-technologie.com'
  };

  return portalUrls[backendType];
}

/**
 * Vérifier si un type de compte peut être créé directement
 */
export function isDirectlyCreatable(backendType: BackendAccountType): boolean {
  const creatableTypes: BackendAccountType[] = [
    'EXPEDITEUR',
    'TRANSPORTEUR',
    'PLATEFORME_LOGISTIQUE',
    'COMMISSIONNAIRE'
  ];

  return creatableTypes.includes(backendType);
}

/**
 * Vérifier si un type de compte est un upgrade seulement
 */
export function isUpgradeOnly(backendType: BackendAccountType): boolean {
  return backendType === 'COMMISSIONNAIRE_AGRÉÉ';
}

/**
 * Vérifier si un type de compte est admin seulement
 */
export function isAdminOnly(backendType: BackendAccountType): boolean {
  return backendType === 'DOUANE';
}

/**
 * Obtenir les types de comptes depuis lesquels on peut upgrade
 */
export function getUpgradeFromTypes(backendType: BackendAccountType): BackendAccountType[] {
  const upgradeMap: Partial<Record<BackendAccountType, BackendAccountType[]>> = {
    COMMISSIONNAIRE_AGRÉÉ: ['COMMISSIONNAIRE']
  };

  return upgradeMap[backendType] || [];
}
```

---

## 📋 Checklist de Migration

### Phase 1: Backend (Déjà fait ✅)
- [✅] Modèle Mongoose avec types backend officiels
- [✅] Service de pricing avec BackendAccountType
- [✅] Routes API utilisant les types backend
- [✅] Script de seed avec les 6 types de comptes

### Phase 2: Frontend

#### 2.1. Créer les fichiers de mapping
- [ ] Créer `src/utils/accountTypeMapping.ts`
- [ ] Importer et tester les fonctions de mapping

#### 2.2. Mettre à jour les hooks
- [✅] Hook `usePricing` utilise déjà BackendAccountType
- [ ] Vérifier/mettre à jour `useAccountTypes` (s'il existe)
- [ ] Vérifier/mettre à jour `useAccountUpgrade` (s'il existe)

#### 2.3. Mettre à jour les composants
- [ ] Mettre à jour les composants de sélection de type de compte
- [ ] Mettre à jour les composants d'affichage de prix
- [ ] Mettre à jour les formulaires d'inscription

#### 2.4. Mettre à jour les pages
- [ ] Page de sélection de type de compte
- [ ] Page d'upgrade de compte
- [ ] Dashboard utilisateur
- [✅] Interface admin de pricing

#### 2.5. Variables d'environnement
- [ ] Vérifier que `NEXT_PUBLIC_SUBSCRIPTIONS_API_URL` est défini
- [ ] Vérifier que les URLs de portails sont correctes

### Phase 3: Tests
- [ ] Tester la récupération de tous les prix
- [ ] Tester le calcul de prix avec conditions (invité)
- [ ] Tester le calcul de prix avec conditions (premium)
- [ ] Tester l'application de codes promo
- [ ] Tester l'interface admin

### Phase 4: Documentation
- [✅] Mapping des types de comptes
- [✅] README backend pricing
- [ ] Guide de migration pour l'équipe
- [ ] Documentation utilisateur

---

## 🚨 Points d'Attention

### 1. Rétrocompatibilité

Si vous avez des données existantes avec les anciens noms (`industry`, `transporter`, etc.), vous devrez les migrer:

```javascript
// Script de migration MongoDB
db.contracts.updateMany(
  { accountType: 'industry' },
  { $set: { accountType: 'EXPEDITEUR' } }
);

db.contracts.updateMany(
  { accountType: 'transporter' },
  { $set: { accountType: 'TRANSPORTEUR' } }
);

db.contracts.updateMany(
  { accountType: 'logistician' },
  { $set: { accountType: 'PLATEFORME_LOGISTIQUE' } }
);

db.contracts.updateMany(
  { accountType: 'forwarder' },
  { $set: { accountType: 'COMMISSIONNAIRE' } }
);
```

### 2. Types TypeScript

Utilisez toujours `BackendAccountType` du hook `usePricing`:

```typescript
// ✅ BON
import { BackendAccountType } from '@/hooks/usePricing';
const accountType: BackendAccountType = 'TRANSPORTEUR';

// ❌ MAUVAIS
const accountType: string = 'transporter';
```

### 3. API Calls

Tous les appels API doivent utiliser les types backend:

```typescript
// ✅ BON
await calculatePrice('TRANSPORTEUR', { invitedBy: 'EXPEDITEUR' });

// ❌ MAUVAIS
await calculatePrice('transporter', { invitedBy: 'industry' });
```

---

## 📝 Exemple Complet d'Utilisation

```typescript
import { usePricing, BackendAccountType, formatPrice } from '@/hooks/usePricing';
import { getDisplayName, isDirectlyCreatable } from '@/utils/accountTypeMapping';

function AccountSelection() {
  const { allPricing, calculatePrice } = usePricing();

  // Filtrer uniquement les types créables directement
  const creatableTypes = allPricing.filter(p => isDirectlyCreatable(p.accountType));

  const handleSelect = async (accountType: BackendAccountType) => {
    // Vérifier si l'utilisateur a été invité
    const userInvitedBy = getUserInvitedBy(); // Fonction hypothétique

    const conditions = userInvitedBy ? { invitedBy: userInvitedBy } : {};

    // Calculer le prix avec conditions
    const result = await calculatePrice(accountType, conditions);

    console.log(`Prix final: ${formatPrice(result.finalPrice, result.currency, result.billingPeriod)}`);
    console.log(`Variante appliquée: ${result.appliedVariant?.name || 'aucune'}`);
  };

  return (
    <div>
      <h2>Sélectionnez votre type de compte</h2>
      {creatableTypes.map(pricing => (
        <div key={pricing.accountType}>
          <h3>{getDisplayName(pricing.accountType)}</h3>
          <p>À partir de {formatPrice(pricing.basePrice, pricing.currency, pricing.billingPeriod)}</p>
          <button onClick={() => handleSelect(pricing.accountType)}>
            Sélectionner
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔗 Ressources

- [Backend Pricing README](./backend-pricing/README.md)
- [Pricing System Plan](./PRICING_SYSTEM_PLAN.md)
- [Backend Account Types Documentation](./BACKEND_ACCOUNT_TYPES.md)
- [Production Status](../PRODUCTION_STATUS.md)

---

**Version**: 2.4.0
**Date**: 2025-11-24
**Statut**: ✅ Documentation complète
