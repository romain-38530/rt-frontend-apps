# 📝 Résumé Exécutif - Système de Types de Comptes

**Date**: 2025-11-24
**Priorité**: Haute
**Durée estimée**: 7-12 jours

---

## 🎯 Objectif

Permettre aux clients de **choisir leur type de compte** après avoir souscrit à un abonnement et signé leur contrat, puis être **redirigés automatiquement vers leur portail spécifique**.

---

## 📊 Résumé en 5 Points

### 1. Types de Comptes Créables Directement
- ✅ **Industriel** - Peut générer des commandes
- ✅ **Transporteur** - Gère les missions de transport
- ✅ **Logisticien** - Gère le warehouse (app PWA)
- ✅ **Transitaire** - Coordination multi-modale

### 2. Types de Comptes Non-Créables
- ❌ **Fournisseur** - Peut seulement suivre des commandes
- ❌ **Destinataire** - Peut seulement suivre des livraisons

**Raison** : Ces types ne peuvent pas générer de commandes, seulement suivre.

### 3. Évolution de Compte Possible
- ✅ **Fournisseur → Industriel** - Si le système plaît
- ✅ **Destinataire → Industriel** - Si le système plaît

### 4. Nouveau Flux Utilisateur
```
Onboarding → Abonnement → Contrat → [NOUVEAU] Sélection Type → Portail
   (✅)         (✅)         (✅)          (🆕)                    (🆕)
```

### 5. Implémentation Requise
- **Backend** : 1 nouveau service (account-management-eb)
- **Frontend** : 3 nouvelles pages (/select-type, /upgrade, /dashboard)
- **Modifications** : authz-eb + subscriptions-contracts

---

## 🏗️ Architecture Technique

### Backend (Nouveau Service)

**Service**: `account-management-eb`

**Endpoints** :
```
POST /api/account/select-type       # Sélectionner type de compte
POST /api/account/upgrade            # Évoluer Supplier/Recipient → Industry
GET  /api/account/:userId            # Info compte utilisateur
GET  /api/account-types/available    # Liste types disponibles
POST /api/account/check-eligibility  # Vérifier éligibilité
```

**Base de Données** (MongoDB) :
- Collection `users` avec champs `accountType`, `accountStatus`, `accountHistory`
- Collection `account_types` avec config des types

**Déploiement** :
- AWS Elastic Beanstalk
- CloudFront HTTPS
- MongoDB Atlas (même cluster que subscriptions)

### Frontend (Nouvelles Pages)

**Pages à créer** :

1. **`/account/select-type`**
   - Affiche les 4 types créables (cards visuelles)
   - Sélection et confirmation
   - Redirection vers portail approprié

2. **`/account/upgrade`**
   - Formulaire d'évolution de compte
   - Demande de justification
   - Upgrade Supplier/Recipient → Industry

3. **`/account/dashboard`**
   - Vue d'ensemble du compte
   - Info abonnement et contrat
   - Bouton "Évoluer" si éligible

**Composants** :
- `AccountTypeCard` - Card de sélection de type
- `UpgradeForm` - Formulaire d'upgrade
- `AccountDashboard` - Dashboard compte
- `PermissionsList` - Liste des permissions

---

## 🚀 Plan de Déploiement

### Phase 1: Backend (2-3 jours)
```bash
1. Créer service account-management-eb
2. Implémenter les 5 endpoints
3. Tester localement
4. Déployer sur Elastic Beanstalk
5. Configurer CloudFront HTTPS
```

### Phase 2: Frontend (2-3 jours)
```bash
1. Créer les 3 pages
2. Créer les composants
3. Implémenter les hooks
4. Tester localement
5. Déployer sur Amplify
```

### Phase 3: Intégration (1-2 jours)
```bash
1. Modifier flux onboarding
2. Ajouter redirections
3. Modifier authz-eb (login response)
4. Modifier subscriptions-contracts (webhook)
5. Configurer variables d'environnement
```

### Phase 4: Tests (1-2 jours)
```bash
1. Tests unitaires backend
2. Tests d'intégration
3. Tests E2E frontend
4. Tests de charge
```

### Phase 5: Production (1 jour)
```bash
1. Déploiement backend
2. Déploiement frontend
3. Vérifications post-déploiement
4. Documentation utilisateur
```

---

## 📋 Mapping Types → Portails

| Type | Portail URL | Peut Créer Commandes | Créable Direct |
|------|-------------|---------------------|----------------|
| Industriel | `https://main.dbg6okncuyyiw...` | ✅ | ✅ |
| Transporteur | `https://main.d1tb834u144p4r...` | ✅ | ✅ |
| Logisticien | `https://main.d3hz3xvddrl94o...` | ✅ | ✅ |
| Transitaire | `https://main.dzvo8973zaqb...` | ✅ | ✅ |
| Fournisseur | `https://main.d3b6p09ihn5w7r...` | ❌ | ❌ |
| Destinataire | `https://main.d3b6p09ihn5w7r...` | ❌ | ❌ |

---

## 🔄 Flux Utilisateur Détaillé

### Nouveau Client
```
1. Remplit formulaire onboarding (VAT + données)        ✅ Existant
2. Choisit plan d'abonnement                            ✅ Existant
3. Signe contrat électronique                           ✅ Existant
4. Accède à /account/select-type                        🆕 Nouveau
5. Choisit type (Industriel/Transporteur/...)          🆕 Nouveau
6. Compte activé avec permissions                       🆕 Nouveau
7. Redirigé vers portail spécifique                    🆕 Nouveau
```

### Évolution Supplier/Recipient → Industry
```
1. Utilisateur connecté (type: supplier/recipient)
2. Accède à /account/dashboard
3. Voit bouton "Évoluer vers Industriel"
4. Click → Redirection vers /account/upgrade
5. Remplit formulaire de justification
6. Validation et upgrade automatique
7. Compte mis à jour (type: industry)
8. Redirigé vers portail Industriel
```

---

## 💾 Structure Base de Données

### Collection `users` (MongoDB)
```javascript
{
  _id: ObjectId,
  email: String,
  // ... autres champs existants

  // NOUVEAUX CHAMPS
  accountType: String,  // 'industry' | 'transporter' | 'logistician' | ...
  accountStatus: String, // 'pending_selection' | 'active' | 'suspended'

  subscription: {
    id: ObjectId,
    status: String,
    startDate: Date,
    endDate: Date
  },

  contract: {
    id: ObjectId,
    signedAt: Date
  },

  permissions: [String], // ['create_orders', 'manage_fleet', ...]

  accountHistory: [{
    previousType: String,
    newType: String,
    upgradedAt: Date,
    reason: String
  }]
}
```

---

## 🔐 Sécurité et Permissions

### Permissions par Type de Compte

**Industriel** :
- `create_orders` - Créer des commandes
- `manage_palettes` - Gérer les palettes
- `view_analytics` - Analytics avancées
- `manage_contracts` - Gérer contrats transporteurs

**Transporteur** :
- `accept_missions` - Accepter missions
- `manage_fleet` - Gérer flotte véhicules
- `update_delivery_status` - Mise à jour statuts
- `driver_management` - Gérer chauffeurs

**Logisticien** :
- `scan_qr` - Scanner QR codes
- `update_palette_status` - Statuts palettes
- `warehouse_management` - Gestion warehouse
- `offline_sync` - Sync hors ligne

**Transitaire** :
- `manage_multimodal` - Transports multi-modaux
- `coordinate_carriers` - Coordonner transporteurs
- `track_shipments` - Suivi expéditions
- `generate_reports` - Rapports personnalisés

**Fournisseur/Destinataire** :
- `view_orders` - Voir commandes
- `track_shipments` - Suivre livraisons
- `chat_support` - Support chat

---

## 📊 Checklist de Validation

### Avant de Commencer
- [ ] Valider l'approche générale
- [ ] Valider la structure des données
- [ ] Valider les types de comptes
- [ ] Valider les permissions par type
- [ ] Valider le flux utilisateur

### Backend
- [ ] Service account-management-eb créé
- [ ] 5 endpoints implémentés
- [ ] Tests unitaires OK
- [ ] Déployé sur EB
- [ ] CloudFront HTTPS configuré

### Frontend
- [ ] 3 pages créées
- [ ] Composants créés
- [ ] Hooks implémentés
- [ ] Tests E2E OK
- [ ] Déployé sur Amplify

### Intégration
- [ ] Modifications authz-eb déployées
- [ ] Modifications subscriptions-contracts déployées
- [ ] Redirections configurées
- [ ] Variables d'environnement OK

### Documentation
- [ ] API documentation
- [ ] Guide utilisateur
- [ ] Diagrammes de flux
- [ ] Guide développeur

---

## 🎯 Résultat Attendu

### Expérience Utilisateur Finale

**Nouveau Client** :
1. ✅ Complète onboarding en 5 minutes
2. ✅ Choisit abonnement et signe contrat
3. ✅ **Sélectionne type de compte en 30 secondes**
4. ✅ **Accède immédiatement à son portail personnalisé**
5. ✅ Toutes fonctionnalités activées selon son type

**Client Existant (Supplier/Recipient)** :
1. ✅ Découvre le système en suivant des commandes
2. ✅ Réalise qu'il peut faire plus
3. ✅ **Click sur "Évoluer vers Industriel"**
4. ✅ **Upgrade instantané**
5. ✅ **Accès complet au portail Industriel**

---

## 💰 Coûts Estimés

### Infrastructure AWS

**Nouveau Service Backend** :
- Elastic Beanstalk (t3.micro) : ~10€/mois
- CloudFront : ~5€/mois
- MongoDB Atlas : Gratuit (cluster existant)

**Total** : ~15€/mois supplémentaires

### Développement
- Backend : 2-3 jours
- Frontend : 2-3 jours
- Intégration : 1-2 jours
- Tests : 1-2 jours
- Déploiement : 1 jour

**Total** : 7-12 jours développeur

---

## 📞 Ressources et Documentation

### Documentation Complète
- **[PLAN_ACCOUNT_TYPES.md](./PLAN_ACCOUNT_TYPES.md)** - Plan détaillé complet (50+ pages)
- **[ACCOUNT_TYPES_FLOW.md](./ACCOUNT_TYPES_FLOW.md)** - Diagrammes de flux détaillés
- **Ce fichier** - Résumé exécutif

### URLs de Production
- Service actuel authz: `https://d2i50a1vlg138w.cloudfront.net`
- Service actuel subscriptions: `https://dgze8l03lwl5h.cloudfront.net`
- Frontend actuel: `https://main.df8cnylp3pqka.amplifyapp.com`

### Prochaines Étapes
1. ✅ **Valider ce plan** avec l'équipe
2. 🔜 Créer le service account-management-eb
3. 🔜 Implémenter les endpoints backend
4. 🔜 Créer les pages frontend
5. 🔜 Intégrer et tester
6. 🔜 Déployer en production

---

## ✅ Validation Requise

**Questions pour validation** :

1. ✅ **Types de comptes** - Les 4 types créables (Industriel, Transporteur, Logisticien, Transitaire) sont corrects ?
2. ✅ **Évolution** - OK que Supplier/Recipient puissent évoluer vers Industriel ?
3. ✅ **Flux** - Le parcours utilisateur est clair ?
4. ✅ **Permissions** - Les permissions par type vous conviennent ?
5. ✅ **Timing** - 7-12 jours de développement acceptable ?

---

**Status**: 📋 En attente de validation
**Prêt à démarrer** : Dès validation reçue

**Date de création**: 2025-11-24
**Version**: 1.0
