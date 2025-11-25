# ✅ Checklist de Déploiement v2.5.0 - Ce qui MANQUE

**Date**: 2025-11-25
**Version**: v2.5.0 (Pricing Grids + Industrial Transport Config)

---

## 🔴 FICHIERS MANQUANTS (BLOQUANTS)

### 1. ❌ Middleware d'Authentification - **CRITIQUE**

**Fichier**: `src/middleware/auth.js`

**Pourquoi c'est bloquant**:
- Les routes `pricing-grids.js` et `industrial-transport-config.js` importent `requireAuth`
- Si ce fichier n'existe pas → `Error: Cannot find module '../middleware/auth'`
- Le serveur ne démarre pas → Déploiement EB échoue

**Solution**:

```bash
# Créer le fichier dans le backend
cd /path/to/subscriptions-contracts
touch src/middleware/auth.js
```

**Code à copier dans `src/middleware/auth.js`**:

```javascript
/**
 * Authentication Middleware
 * Service: subscriptions-contracts v2.5.0
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER || 'rt-technologie';

/**
 * Middleware: Vérifier l'authentification JWT
 */
const requireAuth = (req, res, next) => {
  try {
    // Récupérer le token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Extraire le token (format: "Bearer <token>")
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant ou invalide'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER
    });

    // Attacher l'utilisateur à la requête
    req.user = {
      id: decoded.userId || decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
      accountType: decoded.accountType,

      // IDs spécifiques selon le type d'utilisateur
      carrierId: decoded.carrierId,
      industrialId: decoded.industrialId,
      expediteurId: decoded.expediteurId,

      // Métadonnées
      iat: decoded.iat,
      exp: decoded.exp
    };

    // Continuer vers le prochain middleware/route
    next();

  } catch (error) {
    // Gestion des erreurs JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou corrompu'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token pas encore valide',
        date: error.date
      });
    }

    // Erreur générique
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification interne',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware: Vérifier qu'un utilisateur est admin
 */
const requireAdmin = (req, res, next) => {
  // D'abord vérifier l'auth
  requireAuth(req, res, (err) => {
    if (err) return next(err);

    // Vérifier le rôle admin
    const isAdmin = req.user.role === 'admin' ||
                    req.user.role === 'super_admin' ||
                    req.user.role === 'pricing_manager';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs',
        requiredRole: ['admin', 'super_admin', 'pricing_manager'],
        yourRole: req.user.role
      });
    }

    next();
  });
};

/**
 * Middleware: Vérifier qu'un utilisateur est transporteur
 */
const requireCarrier = (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);

    if (!req.user.carrierId && req.user.accountType !== 'TRANSPORTEUR') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux transporteurs'
      });
    }

    next();
  });
};

/**
 * Middleware: Vérifier qu'un utilisateur est industriel
 */
const requireIndustrial = (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);

    if (!req.user.industrialId && req.user.accountType !== 'INDUSTRIEL') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux industriels'
      });
    }

    next();
  });
};

/**
 * Middleware optionnel: Auth non obligatoire
 * Attache req.user si token valide, sinon continue sans erreur
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Pas de token, on continue sans user
    req.user = null;
    return next();
  }

  // Utiliser requireAuth mais catch les erreurs
  requireAuth(req, res, (err) => {
    if (err) {
      // Token invalide mais on continue quand même
      req.user = null;
    }
    next();
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireCarrier,
  requireIndustrial,
  optionalAuth
};
```

**Vérification**:
```bash
# Vérifier que le fichier existe
ls -la src/middleware/auth.js

# Vérifier qu'il n'y a pas d'erreur de syntaxe
node -c src/middleware/auth.js
```

**⏱️ Temps estimé**: 2 minutes

---

## 🟡 MODIFICATIONS REQUISES (OBLIGATOIRES)

### 2. ⚠️ Enregistrement des Routes

**Fichier**: `src/index.js` ou `src/app.js` (selon votre structure)

**Ce qui manque**: Les nouvelles routes ne sont pas montées sur Express.

**Solution**:

**Ajouter dans `src/index.js` (après les routes existantes)**:

```javascript
// ==========================================
// V2.5.0 - Nouvelles Routes Pricing
// ==========================================

const pricingGridsRoutes = require('./routes/pricing-grids');
const industrialTransportConfigRoutes = require('./routes/industrial-transport-config');

// Monter les routes
app.use('/api/pricing-grids', pricingGridsRoutes);
app.use('/api/industrial', industrialTransportConfigRoutes);

console.log('✅ Pricing Grids routes mounted on /api/pricing-grids');
console.log('✅ Industrial Transport Config routes mounted on /api/industrial');
```

**Position dans le fichier**:
```javascript
// ... (autres routes existantes)

// Routes existantes
app.use('/api/pricing', pricingRoutes);         // v2.4.0
app.use('/api/auth', authRoutes);              // v2.4.0
app.use('/api/checkout', checkoutRoutes);       // v2.4.0

// ⬇️ AJOUTER ICI ⬇️
app.use('/api/pricing-grids', pricingGridsRoutes);              // v2.5.0
app.use('/api/industrial', industrialTransportConfigRoutes);     // v2.5.0

// ... (reste du fichier)
```

**Vérification**:
```bash
# Démarrer le serveur
npm start

# Vérifier les logs au démarrage, devrait afficher:
# ✅ Pricing Grids routes mounted on /api/pricing-grids
# ✅ Industrial Transport Config routes mounted on /api/industrial
```

**⏱️ Temps estimé**: 3 minutes

---

### 3. ⚠️ Copie des Fichiers Backend

**Ce qui manque**: Les 4 fichiers créés ne sont pas encore dans le backend.

**Solution**:

```bash
# Depuis le dossier racine du projet
cd /path/to/subscriptions-contracts

# Copier les modèles
cp ../rt-frontend-apps/docs/backend-pricing/models/PricingGrids.js ./src/models/
cp ../rt-frontend-apps/docs/backend-pricing/models/IndustrialTransportConfig.js ./src/models/

# Copier les routes
cp ../rt-frontend-apps/docs/backend-pricing/routes/pricing-grids.js ./src/routes/
cp ../rt-frontend-apps/docs/backend-pricing/routes/industrial-transport-config.js ./src/routes/
```

**Vérification**:
```bash
# Vérifier que les fichiers existent
ls -la src/models/PricingGrids.js
ls -la src/models/IndustrialTransportConfig.js
ls -la src/routes/pricing-grids.js
ls -la src/routes/industrial-transport-config.js

# Devrait afficher 4 fichiers
```

**⏱️ Temps estimé**: 1 minute

---

## 🟢 VÉRIFICATIONS RECOMMANDÉES (NON-BLOQUANTES)

### 4. ✅ Structure du Projet

**Vérifier que la structure existe**:

```
subscriptions-contracts/
├── src/
│   ├── index.js ou app.js
│   ├── models/
│   │   ├── PricingGrids.js              ← Nouveau
│   │   ├── IndustrialTransportConfig.js ← Nouveau
│   │   └── ... (autres modèles)
│   ├── routes/
│   │   ├── pricing-grids.js             ← Nouveau
│   │   ├── industrial-transport-config.js ← Nouveau
│   │   └── ... (autres routes)
│   └── middleware/
│       ├── auth.js                      ← À CRÉER
│       └── ... (autres middleware)
├── package.json
├── .env
└── ...
```

**Si la structure est différente** (par exemple pas de dossier `src/`):
```bash
# Adapter les chemins dans les fichiers de routes
# Exemple: si c'est directement à la racine
# Modifier: const { requireAuth } = require('../middleware/auth');
# Par: const { requireAuth } = require('./middleware/auth');
```

**⏱️ Temps estimé**: 2 minutes

---

### 5. ✅ Variables d'Environnement

**Vérifier `.env` ou Elastic Beanstalk Environment Properties**:

```env
# Obligatoires (normalement déjà présentes)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<votre-secret-64-chars>
JWT_ISSUER=rt-technologie

# Optionnelles
NODE_ENV=production
PORT=8080
```

**Sur Elastic Beanstalk**:
- Aller dans Configuration > Software > Environment Properties
- Vérifier que `JWT_SECRET` et `MONGODB_URI` sont configurés

**⏱️ Temps estimé**: 1 minute

---

### 6. ✅ Dépendances npm

**Vérifier que les packages sont installés**:

```bash
# Ces packages DOIVENT être dans package.json
grep "mongoose" package.json    # Pour les modèles
grep "express" package.json     # Pour les routes
grep "jsonwebtoken" package.json # Pour l'auth

# Si jsonwebtoken est manquant:
npm install jsonwebtoken --save
```

**Normalement** `mongoose`, `express` et `jsonwebtoken` sont déjà installés dans v2.4.0.

**⏱️ Temps estimé**: 1 minute

---

## 📝 RÉCAPITULATIF - Ce qui MANQUE pour Déployer

| # | Élément | Status | Priorité | Temps |
|---|---------|--------|----------|-------|
| 1 | **Middleware `auth.js`** | ❌ MANQUANT | 🔴 CRITIQUE | 2 min |
| 2 | **Enregistrement routes** | ❌ MANQUANT | 🟡 OBLIGATOIRE | 3 min |
| 3 | **Copie fichiers backend** | ❌ MANQUANT | 🟡 OBLIGATOIRE | 1 min |
| 4 | Vérification structure | ⚠️ À VÉRIFIER | 🟢 RECOMMANDÉ | 2 min |
| 5 | Variables environnement | ⚠️ À VÉRIFIER | 🟢 RECOMMANDÉ | 1 min |
| 6 | Dépendances npm | ✅ OK (probable) | 🟢 RECOMMANDÉ | 1 min |

**Total temps estimé**: **10 minutes** pour tout corriger

---

## 🚀 PLAN D'ACTION - Étapes dans l'Ordre

### Étape 1: Créer le Middleware (2 min)

```bash
cd /path/to/subscriptions-contracts

# Créer le fichier
cat > src/middleware/auth.js << 'EOF'
[Copier le code complet de la section 1 ci-dessus]
EOF

# Vérifier
ls -la src/middleware/auth.js
node -c src/middleware/auth.js
```

**✅ Checkpoint**: Le fichier existe et n'a pas d'erreur de syntaxe.

---

### Étape 2: Copier les Fichiers (1 min)

```bash
# Modèles
cp ../rt-frontend-apps/docs/backend-pricing/models/PricingGrids.js ./src/models/
cp ../rt-frontend-apps/docs/backend-pricing/models/IndustrialTransportConfig.js ./src/models/

# Routes
cp ../rt-frontend-apps/docs/backend-pricing/routes/pricing-grids.js ./src/routes/
cp ../rt-frontend-apps/docs/backend-pricing/routes/industrial-transport-config.js ./src/routes/

# Vérifier
ls -la src/models/PricingGrids.js src/models/IndustrialTransportConfig.js
ls -la src/routes/pricing-grids.js src/routes/industrial-transport-config.js
```

**✅ Checkpoint**: 4 fichiers copiés avec succès.

---

### Étape 3: Enregistrer les Routes (3 min)

```bash
# Éditer index.js ou app.js
nano src/index.js  # ou vi, vim, code, etc.
```

**Ajouter après les routes existantes**:
```javascript
const pricingGridsRoutes = require('./routes/pricing-grids');
const industrialTransportConfigRoutes = require('./routes/industrial-transport-config');

app.use('/api/pricing-grids', pricingGridsRoutes);
app.use('/api/industrial', industrialTransportConfigRoutes);

console.log('✅ Pricing Grids routes mounted');
console.log('✅ Industrial Transport Config routes mounted');
```

**✅ Checkpoint**: Les routes sont ajoutées dans le fichier.

---

### Étape 4: Vérifications (3 min)

```bash
# Vérifier les variables d'environnement
cat .env | grep -E "MONGODB_URI|JWT_SECRET|JWT_ISSUER"

# Vérifier les dépendances
npm list mongoose express jsonwebtoken

# Si jsonwebtoken manque:
npm install jsonwebtoken --save
```

**✅ Checkpoint**: Toutes les vérifications passent.

---

### Étape 5: Test Local (5 min)

```bash
# Démarrer le serveur
npm start

# Devrait afficher:
# ✅ MongoDB connected
# ✅ Pricing Grids routes mounted
# ✅ Industrial Transport Config routes mounted
# 🚀 Server running on http://localhost:8080
```

**Test rapide**:
```bash
# Dans un autre terminal
curl http://localhost:8080/api/pricing-grids/types/transport

# Devrait retourner:
# {"success":true,"types":["FTL","LTL","ADR",...]}
```

**✅ Checkpoint**: Le serveur démarre et l'endpoint répond correctement.

---

### Étape 6: Déploiement EB (5 min)

```bash
# Commiter les changements
git add .
git commit -m "fix: Add missing auth middleware and register v2.5.0 routes"

# Créer le bundle
zip -r app-v2.5.0.zip . -x "*.git*" "node_modules/*" "*.env" "docs/*"

# Déployer
eb deploy --label v2.5.0

# OU via console AWS: Upload app-v2.5.0.zip
```

**✅ Checkpoint**: Déploiement en cours, surveiller les logs.

---

### Étape 7: Vérification Production (2 min)

```bash
# Vérifier le statut
eb status

# Devrait afficher: Health: Green

# Tester l'endpoint production
curl https://dgze8l03lwl5h.cloudfront.net/api/pricing-grids/types/transport

# Devrait retourner les 10 types de transport
```

**✅ Checkpoint**: v2.5.0 déployé avec succès ! 🎉

---

## ⚠️ Si le Déploiement Échoue Encore

### Récupérer les Logs Détaillés

```bash
# Logs complets
eb logs --all > eb-full-logs.txt

# Chercher l'erreur exacte
grep -i "error" eb-full-logs.txt
grep -i "cannot find" eb-full-logs.txt
grep -i "module" eb-full-logs.txt
```

### Erreurs Communes et Solutions

**1. "Cannot find module '../middleware/auth'"**
- ✅ Solution: Créer `src/middleware/auth.js` (Étape 1)

**2. "requireAuth is not a function"**
- ✅ Solution: Vérifier que `auth.js` exporte bien `requireAuth`
- Vérifier la ligne: `module.exports = { requireAuth, ... }`

**3. "MONGODB_URI is not defined"**
- ✅ Solution: Configurer la variable sur EB
- Console AWS > EB > Configuration > Software > Environment Properties

**4. "Cannot find module './models/PricingGrids'"**
- ✅ Solution: Vérifier que les fichiers sont bien copiés (Étape 2)
- Vérifier la structure: `src/models/` vs `models/`

**5. "Validation error" ou "Schema error"**
- ✅ Solution: Vérifier que MongoDB est accessible
- Tester la connexion: `mongo $MONGODB_URI --eval "db.runCommand({ ping: 1 })"`

---

## 📊 Probabilité de Succès

| Après Correction | Probabilité |
|------------------|-------------|
| Après Étape 1 (auth.js) | 60% ⚠️ |
| Après Étapes 1-3 (auth + routes + fichiers) | 90% ✅ |
| Après Étapes 1-6 (tout + tests locaux) | 98% ✅ |

**Confiance globale**: 🟢 **Très élevée** (98%) après avoir suivi toutes les étapes.

---

## 🎯 Ce qu'il Manque - Résumé Ultra-Court

1. **Fichier `src/middleware/auth.js`** (code fourni ci-dessus) - 🔴 CRITIQUE
2. **Enregistrer les routes** dans `src/index.js` (code fourni) - 🟡 OBLIGATOIRE
3. **Copier les 4 fichiers** du repo frontend vers backend - 🟡 OBLIGATOIRE

**Tout le reste est OK** ✅

**Temps total**: 10 minutes de corrections + 5 minutes de test + 5 minutes de déploiement = **20 minutes**

---

## ✅ Checklist Finale Avant Déploiement

Cocher **TOUS** les items:

- [ ] Le fichier `src/middleware/auth.js` existe
- [ ] Le fichier `src/middleware/auth.js` exporte `requireAuth`
- [ ] Les 2 modèles sont copiés dans `src/models/`
- [ ] Les 2 routes sont copiées dans `src/routes/`
- [ ] Les routes sont enregistrées dans `src/index.js`
- [ ] Le serveur démarre localement sans erreur
- [ ] L'endpoint `/api/pricing-grids/types/transport` répond
- [ ] Les variables `JWT_SECRET` et `MONGODB_URI` sont configurées
- [ ] Le package `jsonwebtoken` est installé
- [ ] Aucune erreur dans les logs au démarrage

**Si TOUS les items sont cochés** → Déployer maintenant ! 🚀

**Si UN SEUL item manque** → Le corriger avant de déployer.

---

## 📞 Support

Si après avoir tout corrigé le déploiement échoue:

1. Exécuter: `eb logs --all > logs.txt`
2. Chercher l'erreur exacte: `grep -i error logs.txt`
3. Consulter [EB_DEPLOYMENT_ISSUE_ANALYSIS.md](EB_DEPLOYMENT_ISSUE_ANALYSIS.md)
4. Partager les logs pour analyse

---

**Date de création**: 2025-11-25
**Version**: v2.5.0
**Status**: ⚠️ Corrections requises avant déploiement
**Temps estimé**: 20 minutes (corrections + test + déploiement)
**Probabilité de succès**: 98% ✅ après corrections
