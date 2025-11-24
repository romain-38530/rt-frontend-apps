# Guide de Déploiement du Système de Pricing Dynamique

**Version**: 2.4.0
**Date**: 2025-11-24
**Service Backend**: subscriptions-contracts v2.4.0
**Frontend**: backoffice-admin + apps web

---

## 📋 Vue d'ensemble

Ce guide vous accompagne étape par étape pour déployer le système de pricing dynamique complet, de A à Z.

### Ce qui a été implémenté

✅ **Backend (Complet)**
- Modèle Mongoose pour la collection `pricing`
- Service de pricing avec toute la logique métier
- 7 endpoints API REST + 6 endpoints utilitaires
- Script de seed pour initialiser les données
- Documentation complète

✅ **Frontend (Complet)**
- Hook React `usePricing` avec TypeScript
- Interface admin de gestion des prix
- Utilitaires de mapping des types de comptes
- Documentation de mapping

✅ **Documentation (Complète)**
- README backend
- Guide de mapping des types
- Plan du système de pricing
- Ce guide de déploiement

---

## 🗂️ Structure des Fichiers Créés

```
rt-frontend-apps/
├── docs/
│   ├── backend-pricing/
│   │   ├── models/
│   │   │   └── Pricing.js              # Modèle Mongoose (370 lignes)
│   │   ├── services/
│   │   │   └── pricingService.js       # Service métier (500 lignes)
│   │   ├── routes/
│   │   │   └── pricing.js              # 13 endpoints API (700 lignes)
│   │   ├── scripts/
│   │   │   └── seed-pricing.js         # Script d'init (400 lignes)
│   │   └── README.md                   # Doc backend (600 lignes)
│   ├── ACCOUNT_TYPES_MAPPING.md        # Mapping frontend↔backend (500 lignes)
│   ├── PRICING_SYSTEM_DEPLOYMENT.md    # Ce fichier
│   └── PRICING_SYSTEM_PLAN.md          # Plan détaillé (créé précédemment)
├── src/
│   ├── hooks/
│   │   └── usePricing.ts               # Hook React (600 lignes)
│   └── utils/
│       └── accountTypeMapping.ts       # Utilitaires mapping (500 lignes)
└── apps/
    └── backoffice-admin/
        └── pages/
            └── account-pricing.tsx     # Interface admin (800 lignes)
```

**Total**: ~5000 lignes de code + documentation

---

## 🚀 Déploiement en 5 Étapes

### Étape 1: Déployer le Backend (30 minutes)

#### 1.1. Copier les fichiers backend

Connectez-vous au serveur où le service `subscriptions-contracts` est déployé, ou clonez le repo backend localement.

```bash
# Depuis rt-frontend-apps/docs/backend-pricing/, copier vers le backend
cd /path/to/subscriptions-contracts

# Créer les dossiers si nécessaire
mkdir -p src/models
mkdir -p src/services
mkdir -p src/routes
mkdir -p scripts

# Copier les fichiers
cp /path/to/rt-frontend-apps/docs/backend-pricing/models/Pricing.js ./src/models/
cp /path/to/rt-frontend-apps/docs/backend-pricing/services/pricingService.js ./src/services/
cp /path/to/rt-frontend-apps/docs/backend-pricing/routes/pricing.js ./src/routes/
cp /path/to/rt-frontend-apps/docs/backend-pricing/scripts/seed-pricing.js ./scripts/
```

#### 1.2. Enregistrer les routes

Éditez `src/app.js` ou `src/server.js`:

```javascript
// Ajouter après les autres imports
const pricingRoutes = require('./routes/pricing');

// Enregistrer les routes (après les routes existantes)
app.use('/api/pricing', pricingRoutes);
```

#### 1.3. Vérifier les variables d'environnement

Vérifiez que `.env` contient:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rt-technologie?retryWrites=true&w=majority
PORT=8080
```

#### 1.4. Installer les dépendances (si nécessaire)

```bash
npm install mongoose express dotenv
```

#### 1.5. Tester en local

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal, tester l'API
curl http://localhost:8080/api/pricing

# Devrait retourner: {"success":true,"count":0,"data":[]}
# (vide car pas encore de seed)
```

#### 1.6. Exécuter le script de seed

```bash
node scripts/seed-pricing.js
```

Vous devriez voir:

```
🌱 Démarrage du seed de la collection pricing...
📡 Connexion à MongoDB Atlas...
✅ Connecté à MongoDB Atlas

🗑️  Suppression des anciennes données pricing...
   0 documents supprimés

📝 Insertion des nouvelles données pricing...

✅ EXPEDITEUR               - 499€/monthly
   Industriel (Expéditeur)
   Promotions: 1
      - LAUNCH2025: -50%

✅ TRANSPORTEUR              - 49€/monthly
   Transporteur
   Variantes: 2
      - TRANSPORTEUR_INVITE: 0€
      - TRANSPORTEUR_PREMIUM: 499€

... (suite pour les autres types)

✅ Seed de pricing terminé avec succès!
```

#### 1.7. Vérifier que les données sont bien en base

```bash
# Tester l'API à nouveau
curl http://localhost:8080/api/pricing

# Devrait retourner les 6 types de comptes
```

#### 1.8. Déployer sur AWS Elastic Beanstalk

```bash
# Committer les changements
git add .
git commit -m "feat: Add dynamic pricing system v2.4.0

- Add Pricing model with variants and promotions
- Add pricing service with calculation logic
- Add 13 API endpoints for pricing management
- Add seed script with initial pricing data
- Support for invited vs premium account variants
- Price history tracking
- Promotion codes support"

# Déployer sur EB
eb deploy subscriptions-contracts-env

# Ou via amplify si configuré
amplify publish
```

#### 1.9. Vérifier le déploiement en production

```bash
# Tester l'API en production
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing

# Devrait retourner les 6 types de comptes
```

✅ **Backend déployé!**

---

### Étape 2: Déployer le Frontend - Hook usePricing (5 minutes)

Le hook est déjà créé dans `src/hooks/usePricing.ts`.

#### 2.1. Vérifier les variables d'environnement

Dans chaque app frontend (backoffice-admin, web-industry, etc.), vérifiez `.env.local`:

```env
NEXT_PUBLIC_SUBSCRIPTIONS_API_URL=https://dgze8l03lwl5h.cloudfront.net
```

#### 2.2. Tester le hook localement

Créez une page de test temporaire:

```typescript
// apps/backoffice-admin/pages/test-pricing.tsx
import { usePricing } from '../../../src/hooks/usePricing';

export default function TestPricing() {
  const { allPricing, loading, error } = usePricing();

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur: {error}</p>;

  return (
    <div>
      <h1>Test Pricing</h1>
      {allPricing.map(p => (
        <div key={p.accountType}>
          <h3>{p.displayName}</h3>
          <p>Prix: {p.basePrice}€/{p.billingPeriod}</p>
          <p>Variantes: {p.variants.length}</p>
        </div>
      ))}
    </div>
  );
}
```

```bash
cd apps/backoffice-admin
npm run dev

# Ouvrir http://localhost:3000/test-pricing
# Vérifier que les prix s'affichent
```

✅ **Hook usePricing fonctionnel!**

---

### Étape 3: Déployer l'Interface Admin (10 minutes)

L'interface admin est déjà créée dans `apps/backoffice-admin/pages/account-pricing.tsx`.

#### 3.1. Ajouter un lien dans la navigation

Éditez `apps/backoffice-admin/components/Sidebar.tsx` (ou le fichier de navigation):

```tsx
<nav>
  {/* ... autres liens ... */}
  <a href="/pricing">Tarifs</a>
  <a href="/account-pricing">Gestion des Prix</a>
  {/* ... */}
</nav>
```

#### 3.2. Tester localement

```bash
cd apps/backoffice-admin
npm run dev

# Ouvrir http://localhost:3000/account-pricing
```

Vous devriez voir:
- Liste de tous les types de comptes avec leurs prix
- Possibilité de modifier les prix
- Voir les variantes et promotions
- Bouton "Créer une promotion"

#### 3.3. Déployer

```bash
# Depuis la racine du projet
git add .
git commit -m "feat: Add pricing management admin interface

- Add account-pricing page with full CRUD
- Display all account types with prices
- Edit base prices with history tracking
- Manage variants and promotions
- Create new promotions with codes"

# Déployer backoffice-admin
cd apps/backoffice-admin
amplify publish

# Ou build et déployer manuellement
npm run build
# ... déployer le dossier .next ou out/ selon config
```

✅ **Interface admin déployée!**

---

### Étape 4: Déployer les Utilitaires (5 minutes)

Les utilitaires sont déjà créés dans `src/utils/accountTypeMapping.ts`.

#### 4.1. Tester les utilitaires

Créez une page de test temporaire:

```typescript
// apps/backoffice-admin/pages/test-mapping.tsx
import {
  getAccountTypeInfo,
  getAllCreatableTypesInfo,
  BackendAccountType
} from '../../../src/utils/accountTypeMapping';

export default function TestMapping() {
  const types = getAllCreatableTypesInfo();

  return (
    <div>
      <h1>Test Mapping</h1>
      {types.map(info => (
        <div key={info.type} style={{ borderLeft: `4px solid ${info.color}`, paddingLeft: 16, marginBottom: 20 }}>
          <h3>{info.icon} {info.displayName}</h3>
          <p>{info.description}</p>
          <p>Créable: {info.isCreatable ? 'Oui' : 'Non'}</p>
          <p>Fonctionnalités: {info.features.length}</p>
          <a href={info.portalUrl}>Voir le portal</a>
        </div>
      ))}
    </div>
  );
}
```

```bash
cd apps/backoffice-admin
npm run dev

# Ouvrir http://localhost:3000/test-mapping
# Vérifier que toutes les infos s'affichent correctement
```

✅ **Utilitaires fonctionnels!**

---

### Étape 5: Documentation et Tests Finaux (10 minutes)

#### 5.1. Tester le calcul de prix avec conditions

```bash
# Test 1: Transporteur invité (devrait être gratuit)
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "conditions": { "invitedBy": "EXPEDITEUR" }
  }'

# Résultat attendu: finalPrice = 0

# Test 2: Transporteur premium
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "conditions": { "hasFeatures": ["create_orders"] }
  }'

# Résultat attendu: finalPrice = 499

# Test 3: Industriel avec promo LAUNCH2025
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "EXPEDITEUR",
    "conditions": {},
    "promoCode": "LAUNCH2025"
  }'

# Résultat attendu: finalPrice = 249.5 (50% de 499€)
```

#### 5.2. Créer une promotion via l'interface admin

1. Ouvrir https://backoffice-admin.amplifyapp.com/account-pricing
2. Cliquer sur "Créer une promotion"
3. Remplir:
   - Type de compte: TRANSPORTEUR
   - Code promo: SUMMER50
   - Type de réduction: Pourcentage
   - Valeur: 50
   - Valide du: 2025-06-01
   - Valide jusqu'au: 2025-08-31
   - Max utilisations: 100
4. Cliquer "Créer la promotion"
5. Vérifier qu'elle apparaît dans la liste

#### 5.3. Modifier un prix via l'interface admin

1. Sur la même page, trouver "TRANSPORTEUR"
2. Cliquer "Modifier le prix"
3. Nouveau prix: 59€
4. Raison: "Ajustement inflation 2025"
5. Cliquer "Enregistrer"
6. Vérifier que le prix est mis à jour
7. Consulter l'historique (endpoint GET /api/pricing/TRANSPORTEUR/history)

#### 5.4. Vérifier MongoDB

Connectez-vous à MongoDB Atlas et vérifiez:

```javascript
// Collection: pricing
db.pricing.find({})

// Devrait afficher 6 documents (un par type de compte)
// Chaque document devrait avoir:
// - accountType
// - basePrice
// - variants[] (pour ceux qui en ont)
// - promotions[] (pour ceux qui en ont)
// - priceHistory[] (si des prix ont été modifiés)
```

✅ **Tous les tests passent!**

---

## 📊 Vérification Post-Déploiement

### Checklist Backend

- [ ] Collection `pricing` existe dans MongoDB
- [ ] 6 types de comptes présents (EXPEDITEUR, TRANSPORTEUR, PLATEFORME_LOGISTIQUE, COMMISSIONNAIRE, COMMISSIONNAIRE_AGRÉÉ, DOUANE)
- [ ] Endpoint GET /api/pricing retourne les 6 types
- [ ] Endpoint POST /api/pricing/calculate fonctionne avec conditions
- [ ] Calcul avec `invitedBy: "EXPEDITEUR"` retourne prix 0€
- [ ] Promotion LAUNCH2025 applique -50%
- [ ] Routes admin nécessitent l'authentification (TODO: à implémenter)

### Checklist Frontend

- [ ] Hook `usePricing` charge les prix au montage
- [ ] Fonction `calculatePrice` retourne le bon résultat
- [ ] Utilitaires de mapping fonctionnent
- [ ] Interface admin affiche tous les types de comptes
- [ ] Modification de prix fonctionne
- [ ] Création de promotion fonctionne
- [ ] Variables d'environnement configurées

### Checklist Documentation

- [ ] README backend à jour
- [ ] Mapping des types documenté
- [ ] Guide de déploiement disponible
- [ ] Exemples de code fournis

---

## 🔧 Troubleshooting

### Problème 1: Les prix ne se chargent pas

**Symptômes**: Hook `usePricing` reste en loading, ou retourne une erreur

**Solutions**:
1. Vérifier que `NEXT_PUBLIC_SUBSCRIPTIONS_API_URL` est défini
2. Vérifier que le backend est déployé et accessible
3. Vérifier la console du navigateur pour les erreurs CORS
4. Tester directement l'API avec curl

```bash
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing
```

### Problème 2: Erreur 404 sur /api/pricing

**Symptômes**: `404 Not Found` lors de l'appel API

**Solutions**:
1. Vérifier que les routes sont bien enregistrées dans `app.js`:
   ```javascript
   app.use('/api/pricing', pricingRoutes);
   ```
2. Vérifier que le fichier `routes/pricing.js` est bien copié
3. Redémarrer le serveur backend
4. Vérifier les logs du serveur

### Problème 3: Collection pricing vide

**Symptômes**: API retourne `{"success":true,"count":0,"data":[]}`

**Solutions**:
1. Exécuter le script de seed:
   ```bash
   node scripts/seed-pricing.js
   ```
2. Vérifier la connexion MongoDB dans `.env`
3. Vérifier que MongoDB Atlas autorise la connexion depuis votre IP

### Problème 4: Calcul de prix incorrect

**Symptômes**: Le prix calculé ne correspond pas aux attentes

**Solutions**:
1. Vérifier les conditions passées:
   ```javascript
   // Mauvais
   { invitedBy: "industry" }  // Ancien nom frontend

   // Bon
   { invitedBy: "EXPEDITEUR" }  // Nom backend officiel
   ```
2. Vérifier que les variantes existent dans la base
3. Consulter les logs du service pricing

### Problème 5: Interface admin ne charge pas

**Symptômes**: Page blanche ou erreur d'import

**Solutions**:
1. Vérifier que le hook `usePricing` est bien dans `src/hooks/usePricing.ts`
2. Vérifier les imports:
   ```typescript
   // Depuis apps/backoffice-admin/
   import { usePricing } from '../../../src/hooks/usePricing';
   ```
3. Vérifier que TypeScript compile sans erreur:
   ```bash
   npm run type-check
   ```

---

## 📈 Prochaines Étapes

### Court Terme (Semaine 1)

1. **Implémenter l'authentification admin**
   - Ajouter JWT validation dans le middleware `requireAdmin`
   - Vérifier les permissions admin avant chaque modification

2. **Tester en production avec de vrais utilisateurs**
   - Créer quelques comptes de test
   - Tester le flow complet: inscription → sélection type → paiement

3. **Ajouter des logs et monitoring**
   - Logger tous les changements de prix
   - Logger l'utilisation des codes promo
   - Monitoring des erreurs

### Moyen Terme (Semaine 2-4)

1. **Créer des pages de sélection de type dans chaque app web**
   - `apps/web-industry/pages/select-account-type.tsx`
   - `apps/web-transporter/pages/select-account-type.tsx`
   - etc.

2. **Intégrer avec le système de paiement**
   - Stripe ou autre provider
   - Calculer le prix final avant paiement
   - Appliquer les codes promo

3. **Ajouter des analytiques**
   - Tracking des conversions par type de compte
   - Tracking des codes promo utilisés
   - Dashboard analytics pour les admins

### Long Terme (Mois 1-3)

1. **A/B Testing des prix**
   - Tester différents prix
   - Mesurer l'impact sur les conversions

2. **Système de recommandation intelligent**
   - Suggérer le type de compte approprié selon le profil
   - Proposer des upgrades au bon moment

3. **Support multi-devises**
   - Ajouter EUR, USD, GBP
   - Conversion automatique

---

## 📝 Notes de Version

### v2.4.0 - 2025-11-24

**Nouveautés**:
- ✅ Système de pricing dynamique complet
- ✅ Support des variantes (invité vs premium)
- ✅ Système de promotions avec codes
- ✅ Historique des changements de prix
- ✅ Interface admin de gestion
- ✅ 13 endpoints API REST
- ✅ Documentation complète

**Fichiers ajoutés** (10 fichiers):
1. `docs/backend-pricing/models/Pricing.js`
2. `docs/backend-pricing/services/pricingService.js`
3. `docs/backend-pricing/routes/pricing.js`
4. `docs/backend-pricing/scripts/seed-pricing.js`
5. `docs/backend-pricing/README.md`
6. `src/hooks/usePricing.ts`
7. `src/utils/accountTypeMapping.ts`
8. `apps/backoffice-admin/pages/account-pricing.tsx`
9. `docs/ACCOUNT_TYPES_MAPPING.md`
10. `docs/PRICING_SYSTEM_DEPLOYMENT.md` (ce fichier)

**Lignes de code**: ~5000 lignes

**Collections MongoDB**: +1 (pricing)

**Endpoints API**: +13

---

## 🆘 Support

### Ressources
- [Backend Pricing README](./backend-pricing/README.md)
- [Mapping des Types de Comptes](./ACCOUNT_TYPES_MAPPING.md)
- [Pricing System Plan](./PRICING_SYSTEM_PLAN.md)

### Contactez l'équipe
En cas de problème lors du déploiement, contactez:
- Backend: Équipe subscriptions-contracts
- Frontend: Équipe web apps
- Documentation: Créateur du système pricing

---

**Date de création**: 2025-11-24
**Dernière mise à jour**: 2025-11-24
**Statut**: ✅ Prêt pour déploiement
**Version**: 2.4.0
