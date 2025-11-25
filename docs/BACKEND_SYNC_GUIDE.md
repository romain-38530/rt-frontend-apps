# Guide de Synchronisation Backend - Système de Pricing

**Destinataire**: Équipe Backend
**Service**: subscriptions-contracts
**Version cible**: 2.4.2
**Date**: 2025-11-24

---

## 📋 Vue d'ensemble

Ce guide vous permet d'intégrer le système de pricing dynamique complet dans le service `subscriptions-contracts`. Tous les fichiers backend sont prêts dans le dossier `docs/backend-pricing/`.

**Durée estimée**: 1-2 heures
**Impact**: Ajout de 18 nouveaux endpoints API + 1 nouvelle collection MongoDB

---

## 📦 Fichiers à Intégrer

### Récapitulatif

| Type | Fichiers | Destination |
|------|----------|-------------|
| **Modèles** | 1 fichier | `src/models/` |
| **Services** | 1 fichier | `src/services/` |
| **Routes** | 3 fichiers | `src/routes/` |
| **Middleware** | 1 fichier | `src/middleware/` |
| **Scripts** | 2 fichiers | `scripts/` |
| **Total** | **8 fichiers** | - |

---

## 🗂️ Étape 1: Copier les Fichiers

### 1.1. Modèles MongoDB

```bash
# Depuis le repo frontend
cp docs/backend-pricing/models/Pricing.js ./src/models/

# Vérifier
ls -la src/models/Pricing.js
```

**Fichier**: `src/models/Pricing.js` (370 lignes)
**Description**: Modèle Mongoose pour la collection `pricing`
**Collection créée**: `pricing`

**Contenu**:
- Schema principal Pricing
- Sub-schemas: VariantSchema, PromotionSchema, PriceHistorySchema
- Méthodes: calculatePrice(), updatePrice(), updateVariant(), addPromotion()
- Indexes: accountType, isActive, variants.name, promotions.code

---

### 1.2. Services Métier

```bash
cp docs/backend-pricing/services/pricingService.js ./src/services/

# Vérifier
ls -la src/services/pricingService.js
```

**Fichier**: `src/services/pricingService.js` (500 lignes)
**Description**: Logique métier pour le pricing

**Fonctions principales**:
- `getAllPricing()` - Liste tous les prix
- `getPricingByAccountType(accountType)` - Prix d'un type
- `calculatePrice(accountType, conditions, promoCode)` - Calcul final
- `createOrUpdatePricing(accountType, data)` - CRUD
- `updateBasePrice(accountType, newPrice, changedBy, reason)` - Mise à jour avec historique
- `updateVariant(accountType, variantName, data)` - Gestion variantes
- `addPromotion(accountType, promotionData)` - Ajout promos
- `validatePromoCode(accountType, promoCode)` - Validation codes
- + 10 autres fonctions utilitaires

---

### 1.3. Routes API

```bash
cp docs/backend-pricing/routes/pricing.js ./src/routes/
cp docs/backend-pricing/routes/auth.js ./src/routes/
cp docs/backend-pricing/routes/checkout.js ./src/routes/

# Vérifier
ls -la src/routes/{pricing,auth,checkout}.js
```

#### Fichier 1: `src/routes/pricing.js` (700 lignes)

**13 endpoints créés**:

**Publics** (6 endpoints):
1. `GET /api/pricing` - Liste tous les prix
2. `GET /api/pricing/summary` - Résumé pour dashboard
3. `GET /api/pricing/promotions/active` - Promos actives
4. `GET /api/pricing/:accountType` - Prix d'un type
5. `POST /api/pricing/calculate` - Calculer prix avec conditions
6. `POST /api/pricing/calculate/multiple` - Calcul multiple
7. `POST /api/pricing/validate-promo` - Valider code promo

**Admin** (7 endpoints - nécessitent JWT):
8. `POST /api/pricing` - Créer/modifier pricing
9. `PUT /api/pricing/:accountType` - Modifier prix base
10. `PUT /api/pricing/:accountType/variant` - Gérer variante
11. `POST /api/pricing/:accountType/promotion` - Ajouter promo
12. `DELETE /api/pricing/:accountType/promotion/:code` - Désactiver promo
13. `GET /api/pricing/:accountType/history` - Historique prix

#### Fichier 2: `src/routes/auth.js` (400 lignes)

**5 endpoints créés**:
1. `POST /api/auth/admin/login` - Login admin
2. `POST /api/auth/admin/refresh` - Refresh token
3. `POST /api/auth/admin/logout` - Logout
4. `GET /api/auth/admin/me` - Infos admin connecté
5. `POST /api/auth/admin/create` - Créer admin (super_admin only)

**Note importante**: Ce fichier contient une liste d'admins en dur (`ADMIN_USERS`). À terme, vous devrez créer un modèle MongoDB `Admin` et remplacer cette liste.

**Admins de test inclus**:
- Email: `admin@rt-technologie.com`, Password: `admin123`, Role: `super_admin`
- Email: `pricing@rt-technologie.com`, Password: `pricing123`, Role: `pricing_manager`

#### Fichier 3: `src/routes/checkout.js` (500 lignes)

**3 endpoints créés**:
1. `POST /api/checkout/create-session` - Créer session Stripe
2. `POST /api/checkout/webhook` - Webhook Stripe
3. `GET /api/checkout/success` - Récupération session

**Événements webhook gérés** (6 types):
- `checkout.session.completed` - Activation compte
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

### 1.4. Middleware

```bash
cp docs/backend-pricing/middleware/authAdmin.js ./src/middleware/

# Vérifier
ls -la src/middleware/authAdmin.js
```

**Fichier**: `src/middleware/authAdmin.js` (300 lignes)
**Description**: Middleware JWT pour authentification admin

**Exports**:
- `requireAdmin` - Middleware pour protéger les endpoints
- `optionalAuth` - Auth optionnelle
- `generateAdminToken(user, expiresIn)` - Génération token
- `verifyToken(token)` - Vérification token
- `isAdmin(user)` - Check si admin
- `ADMIN_ROLES` - Array des rôles admin

**Rôles supportés**: `admin`, `super_admin`, `pricing_manager`

---

### 1.5. Scripts

```bash
cp docs/backend-pricing/scripts/seed-pricing.js ./scripts/
cp docs/backend-pricing/scripts/generate-admin-token.js ./scripts/

# Vérifier
ls -la scripts/{seed-pricing,generate-admin-token}.js
```

#### Script 1: `scripts/seed-pricing.js` (400 lignes)

**Description**: Initialise la collection `pricing` avec les 6 types de comptes

**Usage**:
```bash
node scripts/seed-pricing.js
```

**Données créées**:
- EXPEDITEUR: 499€/mois + promo LAUNCH2025 (-50%)
- TRANSPORTEUR: 49€/mois + 2 variantes (INVITE gratuit, PREMIUM 499€)
- PLATEFORME_LOGISTIQUE: 199€/mois + 2 variantes
- COMMISSIONNAIRE: 299€/mois + 2 variantes
- COMMISSIONNAIRE_AGRÉÉ: 599€/mois (upgrade only)
- DOUANE: 0€ (admin only)

**Fonctions utilitaires**:
```bash
# Ajouter une promotion
node scripts/seed-pricing.js add-promo TRANSPORTEUR SUMMER50 percentage 50 2025-06-01 2025-08-31 100

# Modifier un prix
node scripts/seed-pricing.js update-price TRANSPORTEUR 59 "Ajustement inflation 2025"
```

#### Script 2: `scripts/generate-admin-token.js` (250 lignes)

**Description**: Génère des tokens JWT pour les admins

**Usage**:
```bash
# Utilisation de base
node scripts/generate-admin-token.js

# Avec paramètres
node scripts/generate-admin-token.js admin-123 admin@rt.com super_admin 30d

# Valider un token
node scripts/generate-admin-token.js --validate <token>
```

---

## ⚙️ Étape 2: Installer les Dépendances

### 2.1. Vérifier package.json

```bash
cat package.json | grep -E "mongoose|express|jsonwebtoken|bcryptjs|stripe"
```

### 2.2. Installer les nouvelles dépendances

```bash
npm install jsonwebtoken bcryptjs stripe
```

**Versions recommandées**:
- `jsonwebtoken`: ^9.0.0
- `bcryptjs`: ^2.4.3
- `stripe`: ^14.0.0

**Dépendances déjà installées** (normalement):
- `mongoose`: ^8.0.0
- `express`: ^4.18.0
- `dotenv`: ^16.0.0

---

## 🔧 Étape 3: Configuration

### 3.1. Variables d'environnement

Ajouter dans `.env`:

```env
# JWT Configuration (nouveau)
JWT_SECRET=METTRE_ICI_UN_SECRET_FORT_ET_ALEATOIRE
JWT_ISSUER=rt-technologie

# Stripe Configuration (nouveau)
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_STRIPE_TEST
STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_TEST
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK

# Base URL pour redirections Stripe (nouveau)
BASE_URL=https://rt-technologie.com

# MongoDB (déjà existant - vérifier)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rt-technologie?retryWrites=true&w=majority

# Port (déjà existant)
PORT=8080
```

### 3.2. Générer un JWT_SECRET fort

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copier le résultat dans `.env`:
```env
JWT_SECRET=a1b2c3d4e5f6...résultat_64_caractères_hex
```

### 3.3. Configuration Stripe

**Mode Test** (pour développement):
1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/test/dashboard)
2. Developers → API Keys
3. Copier la **Secret key** (sk_test_...)
4. Copier la **Publishable key** (pk_test_...)

**Webhook**:
1. Developers → Webhooks
2. Add endpoint: `https://dgze8l03lwl5h.cloudfront.net/api/checkout/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copier le **Signing secret** (whsec_...)

---

## 🔗 Étape 4: Enregistrer les Routes

### 4.1. Modifier app.js ou server.js

Localiser le fichier principal (généralement `src/app.js` ou `src/server.js`):

```javascript
// ============================================
// AJOUTER CES IMPORTS EN HAUT DU FICHIER
// ============================================

const pricingRoutes = require('./routes/pricing');
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');

// ============================================
// AJOUTER CES ROUTES APRÈS LES ROUTES EXISTANTES
// (après les autres app.use())
// ============================================

// Pricing routes (13 endpoints)
app.use('/api/pricing', pricingRoutes);

// Admin auth routes (5 endpoints)
app.use('/api/auth', authRoutes);

// Stripe checkout routes (3 endpoints)
app.use('/api/checkout', checkoutRoutes);

console.log('✅ Pricing, Auth and Checkout routes registered');
```

### 4.2. Exemple complet de fichier app.js

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ===== ROUTES EXISTANTES =====
// ... vos routes actuelles (subscriptions, contracts, etc.) ...

// ===== NOUVELLES ROUTES (AJOUTER ICI) =====
const pricingRoutes = require('./routes/pricing');
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');

app.use('/api/pricing', pricingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);

console.log('✅ Pricing system routes registered');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
```

---

## 📊 Étape 5: Initialiser la Base de Données

### 5.1. Exécuter le script de seed

```bash
node scripts/seed-pricing.js
```

**Output attendu**:
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

... (suite pour les 4 autres types)

✅ Seed de pricing terminé avec succès!
```

### 5.2. Vérifier dans MongoDB

```javascript
// Dans MongoDB Compass ou shell
use rt-technologie

db.pricing.find({})
// Devrait retourner 6 documents

db.pricing.countDocuments()
// Devrait retourner: 6
```

---

## 🧪 Étape 6: Tests

### 6.1. Démarrer le serveur

```bash
npm run dev
# ou
node src/app.js
```

### 6.2. Tester les endpoints publics

**Test 1: Récupérer tous les prix**
```bash
curl http://localhost:8080/api/pricing
```

**Résultat attendu**: JSON avec 6 types de comptes

**Test 2: Calculer un prix avec conditions**
```bash
curl -X POST http://localhost:8080/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "conditions": { "invitedBy": "EXPEDITEUR" }
  }'
```

**Résultat attendu**:
```json
{
  "success": true,
  "data": {
    "accountType": "TRANSPORTEUR",
    "displayName": "Transporteur",
    "originalPrice": 49,
    "finalPrice": 0,
    "appliedVariant": {
      "name": "TRANSPORTEUR_INVITE",
      "price": 0
    }
  }
}
```

**Test 3: Valider un code promo**
```bash
curl -X POST http://localhost:8080/api/pricing/validate-promo \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "EXPEDITEUR",
    "promoCode": "LAUNCH2025"
  }'
```

### 6.3. Tester l'authentification admin

**Test 1: Générer un token**
```bash
node scripts/generate-admin-token.js
```

**Copier le token affiché, puis:**

**Test 2: Login admin via API**
```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rt-technologie.com",
    "password": "admin123"
  }'
```

**Résultat attendu**: Token JWT + infos utilisateur

**Test 3: Utiliser le token pour modifier un prix**
```bash
TOKEN="COLLER_ICI_LE_TOKEN_GENERE"

curl -X PUT http://localhost:8080/api/pricing/TRANSPORTEUR \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "newPrice": 59,
    "reason": "Test de mise à jour"
  }'
```

### 6.4. Tester Stripe (mode test)

**Test 1: Créer une session checkout**
```bash
curl -X POST http://localhost:8080/api/checkout/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "accountType": "TRANSPORTEUR",
    "conditions": { "hasFeatures": ["create_orders"] }
  }'
```

**Résultat attendu**: URL Stripe Checkout

**Test 2: Simuler un webhook Stripe**

Dans Stripe Dashboard:
1. Developers → Webhooks
2. Cliquer sur votre webhook
3. Send test webhook
4. Sélectionner `checkout.session.completed`
5. Envoyer

Vérifier les logs du serveur pour voir l'événement traité.

---

## 🚀 Étape 7: Déploiement

### 7.1. Pré-déploiement

**Checklist**:
- [ ] Tous les fichiers copiés
- [ ] Dépendances installées
- [ ] Variables .env configurées
- [ ] Routes enregistrées dans app.js
- [ ] Seed exécuté
- [ ] Tests locaux passés
- [ ] JWT_SECRET fort généré
- [ ] Stripe configuré (mode test)

### 7.2. Commit des changements

```bash
git add .
git commit -m "feat: Add pricing system v2.4.2

- Add Pricing model and service
- Add 13 pricing API endpoints
- Add 5 admin auth endpoints
- Add 3 Stripe checkout endpoints
- Add JWT authentication middleware
- Add seed and token generation scripts
- Integration complete for subscriptions-contracts v2.4.0"

git push origin main
```

### 7.3. Déployer sur AWS Elastic Beanstalk

```bash
# Si EB CLI est configuré
eb deploy subscriptions-contracts-env

# Vérifier les logs
eb logs -f
```

### 7.4. Configuration Stripe en production

**Important**: En production, utiliser les clés **Live** au lieu de **Test**

1. Stripe Dashboard → Mode Live
2. API Keys → Copier les clés Live
3. Webhooks → Créer endpoint production
   - URL: `https://dgze8l03lwl5h.cloudfront.net/api/checkout/webhook`
   - Mêmes événements que test
4. Mettre à jour .env en production avec les clés Live

### 7.5. Vérifier le déploiement

```bash
# Test endpoint public
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing

# Test calcul de prix
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "conditions": { "invitedBy": "EXPEDITEUR" }
  }'
```

---

## 📋 Checklist Finale

### Installation
- [ ] 8 fichiers copiés dans les bons dossiers
- [ ] 3 dépendances npm installées (jsonwebtoken, bcryptjs, stripe)
- [ ] 5 variables .env configurées
- [ ] JWT_SECRET fort généré
- [ ] Routes enregistrées dans app.js

### Base de données
- [ ] Script seed exécuté
- [ ] Collection `pricing` créée
- [ ] 6 types de comptes présents
- [ ] Indexes MongoDB créés

### Tests
- [ ] Server démarre sans erreur
- [ ] GET /api/pricing retourne 6 types
- [ ] POST /api/pricing/calculate fonctionne
- [ ] Login admin fonctionne
- [ ] Token admin généré
- [ ] Endpoints admin protégés
- [ ] Session Stripe créée

### Configuration Stripe
- [ ] Clés API Stripe configurées
- [ ] Webhook endpoint créé
- [ ] Webhook secret configuré
- [ ] 6 événements sélectionnés
- [ ] Webhook testé

### Déploiement
- [ ] Code commité
- [ ] Déployé sur EB
- [ ] Variables d'environnement en production
- [ ] Endpoints accessibles en HTTPS
- [ ] Stripe mode Live configuré (production)

---

## 🆘 Troubleshooting

### Problème 1: "Cannot find module './routes/pricing'"

**Cause**: Fichier pas copié ou mauvais chemin

**Solution**:
```bash
ls -la src/routes/pricing.js
# Si absent, copier à nouveau
cp docs/backend-pricing/routes/pricing.js ./src/routes/
```

### Problème 2: "JWT_SECRET is not defined"

**Cause**: Variable .env manquante

**Solution**:
```bash
# Générer un secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ajouter dans .env
echo "JWT_SECRET=<résultat_généré>" >> .env
```

### Problème 3: "Collection pricing is empty"

**Cause**: Seed pas exécuté

**Solution**:
```bash
node scripts/seed-pricing.js
```

### Problème 4: "Stripe webhook signature verification failed"

**Cause**: STRIPE_WEBHOOK_SECRET incorrect

**Solution**:
1. Aller dans Stripe Dashboard → Webhooks
2. Cliquer sur votre endpoint
3. Reveal signing secret
4. Copier dans .env

### Problème 5: "Cannot POST /api/pricing"

**Cause**: Routes pas enregistrées ou middleware manquant

**Solution**:
- Vérifier que les routes sont bien dans app.js
- Vérifier que express.json() est activé
- Vérifier que requireAdmin est importé

---

## 📞 Support

Si vous rencontrez des problèmes:

1. **Vérifier les logs**:
   ```bash
   # Logs serveur local
   npm run dev

   # Logs AWS EB
   eb logs
   ```

2. **Vérifier MongoDB**:
   ```bash
   # Connexion
   mongosh "mongodb+srv://..."

   # Vérifier collection
   use rt-technologie
   db.pricing.find().pretty()
   ```

3. **Tester les endpoints un par un**:
   - Utiliser Postman ou cURL
   - Vérifier les headers
   - Vérifier le body JSON

4. **Consulter la documentation**:
   - [docs/backend-pricing/README.md](./backend-pricing/README.md)
   - [docs/backend-pricing/AUTH_SETUP.md](./backend-pricing/AUTH_SETUP.md)

---

## 🎉 Conclusion

Une fois toutes les étapes complétées, vous aurez :

✅ **18 nouveaux endpoints API** fonctionnels
✅ **Pricing dynamique** sans redéploiement
✅ **Authentification admin** sécurisée
✅ **Intégration Stripe** complète
✅ **Webhooks temps réel** opérationnels
✅ **Documentation** exhaustive

**Le système est prêt pour la production !** 🚀

---

**Document créé le**: 2025-11-24
**Version**: 2.4.2
**Auteur**: Équipe Frontend
**Contact**: Pour questions, consulter la documentation ou les fichiers sources

**Bon courage pour l'intégration !** 💪

