# Configuration de l'Authentification Admin

**Version**: 2.4.0
**Date**: 2025-11-24

---

## 📋 Vue d'ensemble

Ce guide explique comment configurer l'authentification JWT pour sécuriser les endpoints admin du système de pricing.

---

## 🔐 Middleware d'Authentification

Le middleware `authAdmin.js` fournit:

- ✅ Vérification des tokens JWT
- ✅ Validation des permissions admin
- ✅ Protection des endpoints sensibles
- ✅ Gestion des erreurs d'authentification

---

## 🚀 Installation (3 étapes)

### Étape 1: Installer les dépendances

```bash
npm install jsonwebtoken
```

### Étape 2: Configurer les variables d'environnement

Ajoutez dans votre fichier `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_ISSUER=rt-technologie

# Le JWT_SECRET doit être une chaîne aléatoire longue et complexe
# Générez-en un avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ IMPORTANT**: En production, utilisez un secret fort et stockez-le de manière sécurisée (AWS Secrets Manager, etc.)

### Étape 3: Copier le middleware

```bash
# Copier le middleware dans votre backend
cp docs/backend-pricing/middleware/authAdmin.js ./src/middleware/
```

---

## 📝 Utilisation dans les Routes

Les routes pricing sont déjà configurées pour utiliser le middleware. Aucune action n'est requise.

```javascript
// Exemple dans routes/pricing.js
const { requireAdmin } = require('../middleware/authAdmin');

// Endpoint admin protégé
router.post('/api/pricing', requireAdmin, async (req, res) => {
  // Seuls les admins avec un token valide peuvent accéder ici
  // req.user contient les informations de l'utilisateur
  console.log('Admin user:', req.user);
});
```

---

## 🔑 Générer un Token Admin

### Méthode 1: Via le code

```javascript
const { generateAdminToken } = require('./middleware/authAdmin');

// Lors de la connexion d'un admin
const user = {
  id: 'admin-123',
  email: 'admin@rt-technologie.com',
  role: 'admin', // ou 'super_admin', 'pricing_manager'
  accountType: 'DOUANE'
};

const token = generateAdminToken(user, '7d'); // Valide 7 jours

// Retourner le token au client
res.json({
  success: true,
  token: token,
  user: user
});
```

### Méthode 2: Script de génération

Créez `scripts/generate-admin-token.js`:

```javascript
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'rt-technologie';

// Données de l'admin
const adminUser = {
  userId: process.argv[2] || 'admin-dev',
  email: process.argv[3] || 'admin@rt-technologie.com',
  role: 'admin',
  accountType: 'DOUANE',
  isAdmin: true
};

const token = jwt.sign(adminUser, JWT_SECRET, {
  issuer: JWT_ISSUER,
  expiresIn: '30d' // 30 jours
});

console.log('\n=== Admin Token Generated ===\n');
console.log('User:', adminUser);
console.log('\nToken:');
console.log(token);
console.log('\n=== Use this token in Authorization header ===');
console.log(`Authorization: Bearer ${token}`);
console.log('');
```

Utilisation:

```bash
node scripts/generate-admin-token.js admin-123 admin@example.com
```

---

## 🧪 Tester l'Authentification

### Test 1: Sans token (devrait échouer)

```bash
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "displayName": "Transporteur",
    "basePrice": 49
  }'

# Résultat attendu: 401 Unauthorized
# {
#   "success": false,
#   "message": "Token d'authentification requis",
#   "error": "MISSING_AUTH_HEADER"
# }
```

### Test 2: Avec token invalide (devrait échouer)

```bash
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-invalid-token" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "displayName": "Transporteur",
    "basePrice": 49
  }'

# Résultat attendu: 401 Unauthorized
# {
#   "success": false,
#   "message": "Token invalide",
#   "error": "INVALID_TOKEN"
# }
```

### Test 3: Avec token valide (devrait réussir)

```bash
# Générer un token d'abord
TOKEN=$(node scripts/generate-admin-token.js | grep "Bearer" | cut -d' ' -f3)

# Utiliser le token
curl -X POST https://dgze8l03lwl5h.cloudfront.net/api/pricing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "accountType": "TRANSPORTEUR",
    "displayName": "Transporteur",
    "basePrice": 49
  }'

# Résultat attendu: 200 OK
# {
#   "success": true,
#   "message": "Pricing créé/mis à jour avec succès",
#   "data": { ... }
# }
```

---

## 🔒 Rôles Admin

Le système supporte 3 rôles admin:

| Rôle | Description | Permissions |
|------|-------------|-------------|
| `admin` | Administrateur standard | Gérer tous les prix |
| `super_admin` | Super administrateur | Gérer prix + utilisateurs |
| `pricing_manager` | Gestionnaire de pricing | Gérer uniquement les prix |

Tous ces rôles ont accès aux endpoints pricing admin.

---

## 🔧 Intégration avec l'Interface Admin

L'interface admin doit stocker le token JWT et l'envoyer avec chaque requête.

### Stockage du Token

```typescript
// apps/backoffice-admin/utils/auth.ts

export function setAdminToken(token: string) {
  localStorage.setItem('admin_token', token);
}

export function getAdminToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function removeAdminToken() {
  localStorage.removeItem('admin_token');
}

export function isAuthenticated(): boolean {
  return !!getAdminToken();
}
```

### Utilisation dans les Requêtes

Mettez à jour le hook `usePricing` pour inclure le token:

```typescript
// src/hooks/usePricing.ts

import { getAdminToken } from '../utils/auth';

// Dans la fonction qui fait la requête
const updatePrice = async (accountType, newPrice, reason) => {
  const token = getAdminToken();

  const response = await fetch(`${apiUrl}/api/pricing/${accountType}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ✅ Ajouter le token
    },
    body: JSON.stringify({ newPrice, reason })
  });

  if (response.status === 401) {
    // Token invalide ou expiré, rediriger vers login
    window.location.href = '/login';
    return;
  }

  // ... reste du code
};
```

---

## 📋 Checklist de Sécurité

### Développement

- [x] Middleware d'authentification créé
- [x] Routes admin protégées
- [ ] Variable JWT_SECRET configurée dans .env
- [ ] Script de génération de token créé
- [ ] Tests d'authentification passés

### Production

- [ ] JWT_SECRET fort et aléatoire généré
- [ ] JWT_SECRET stocké dans AWS Secrets Manager
- [ ] HTTPS obligatoire (déjà fait via CloudFront)
- [ ] Rotation des secrets configurée
- [ ] Logs d'audit pour les modifications de prix
- [ ] Rate limiting sur les endpoints admin
- [ ] Monitoring des tentatives d'accès non autorisées

---

## 🚨 Troubleshooting

### Erreur: "Token d'authentification requis"

**Cause**: Header `Authorization` manquant

**Solution**: Vérifier que le header est bien envoyé:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Erreur: "Token invalide"

**Causes possibles**:
1. Token mal formé
2. JWT_SECRET différent entre génération et validation
3. Token signé avec un autre secret

**Solution**:
- Vérifier que JWT_SECRET est le même partout
- Régénérer un nouveau token

### Erreur: "Token expiré"

**Cause**: Le token a dépassé sa durée de validité (expiresIn)

**Solution**: Régénérer un nouveau token ou augmenter la durée de validité

### Erreur: "Accès refusé: permissions admin requises"

**Cause**: L'utilisateur n'a pas un rôle admin

**Solution**: Vérifier que le token contient `role: 'admin'` (ou super_admin, pricing_manager)

---

## 🔄 Rotation des Tokens

Il est recommandé de mettre en place une rotation des tokens:

1. **Tokens courte durée (7 jours)** + **Refresh tokens (30 jours)**
2. Implémenter un endpoint `/api/auth/refresh` pour renouveler les tokens
3. Stocker les refresh tokens de manière sécurisée

---

## 📚 Ressources

- [JWT.io](https://jwt.io/) - Déboguer et valider les JWT
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Node.js jsonwebtoken documentation](https://github.com/auth0/node-jsonwebtoken)

---

## ✅ Résumé

L'authentification admin est maintenant configurée ! 🎉

**Ce qui fonctionne**:
- ✅ Middleware JWT complet
- ✅ Vérification des permissions admin
- ✅ Routes pricing protégées
- ✅ Gestion des erreurs d'authentification

**Prochaines étapes**:
1. Configurer JWT_SECRET dans .env
2. Créer un script de génération de token
3. Intégrer l'authentification dans l'interface admin
4. Tester avec un vrai token

---

**Version**: 2.4.0
**Date**: 2025-11-24
**Statut**: ✅ Prêt à utiliser
