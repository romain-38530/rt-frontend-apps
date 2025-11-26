# Configuration Sécurité MongoDB - SYMPHONI.A

## 🎯 Objectif

Améliorer la sécurité et les performances de la collection `onboarding_requests` dans MongoDB Atlas.

## 📋 Prérequis

- Accès MongoDB Atlas: https://cloud.mongodb.com
- Credentials: `rt_admin` / `RtAdmin2024`
- Cluster: `stagingrt.v2jnoh2.mongodb.net`
- Database: `rt-auth`
- Collection: `onboarding_requests`

## 🔐 Améliorations de Sécurité

### 1. Ajouter un Index Unique sur Email

**Priorité:** HAUTE
**Statut:** ⏳ À faire
**Impact:** Prévient les doublons d'emails + améliore les performances

#### Méthode 1: Via MongoDB Atlas UI

1. Se connecter à https://cloud.mongodb.com
2. Naviguer vers: `Clusters → stagingrt → Collections → rt-auth → onboarding_requests`
3. Cliquer sur l'onglet `Indexes`
4. Cliquer sur `Create Index`
5. Configurer:
   - **Fields:** `{ "email": 1 }`
   - **Options:** Cocher `unique`
   - **Name:** `email_unique_idx`
6. Cliquer sur `Review` puis `Create Index`

#### Méthode 2: Via mongosh (CLI)

```bash
# Connexion à MongoDB Atlas
mongosh "mongodb+srv://stagingrt.v2jnoh2.mongodb.net/" \
  --username rt_admin \
  --password RtAdmin2024

# Sélectionner la base de données
use rt-auth

# Créer l'index unique
db.onboarding_requests.createIndex(
  { email: 1 },
  {
    unique: true,
    name: "email_unique_idx",
    background: true
  }
)

# Vérifier la création
db.onboarding_requests.getIndexes()
```

**Résultat attendu:**
```json
{
  "v": 2,
  "key": { "email": 1 },
  "name": "email_unique_idx",
  "unique": true,
  "background": true
}
```

#### Méthode 3: Via Script Node.js (Backend)

Créer un fichier `scripts/setup-mongodb-indexes.js` dans le backend:

```javascript
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://rt_admin:RtAdmin2024@stagingrt.v2jnoh2.mongodb.net/rt-auth';

async function setupIndexes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('rt-auth');
    const collection = db.collection('onboarding_requests');

    // Créer l'index unique sur email
    const result = await collection.createIndex(
      { email: 1 },
      {
        unique: true,
        name: 'email_unique_idx',
        background: true
      }
    );

    console.log('✅ Index créé:', result);

    // Vérifier les index
    const indexes = await collection.indexes();
    console.log('📊 Indexes actuels:');
    console.table(indexes);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await client.close();
  }
}

setupIndexes();
```

Exécution:
```bash
cd c:\Users\rtard\rt-backend-services\services\authz-eb
node scripts/setup-mongodb-indexes.js
```

### 2. Validation de Schéma MongoDB

**Priorité:** MOYENNE
**Statut:** ⏳ À faire
**Impact:** Garantit la qualité des données à l'insertion

#### Via mongosh

```javascript
use rt-auth

// Appliquer la validation de schéma
db.runCommand({
  collMod: "onboarding_requests",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "companyName", "status", "source"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
          description: "Email valide requis"
        },
        companyName: {
          bsonType: "string",
          minLength: 2,
          maxLength: 200,
          description: "Nom de l'entreprise requis (2-200 caractères)"
        },
        siret: {
          bsonType: ["string", "null"],
          pattern: "^[0-9]{14}$",
          description: "SIRET français (14 chiffres) ou null"
        },
        vatNumber: {
          bsonType: ["string", "null"],
          pattern: "^[A-Z]{2}[0-9A-Z]+$",
          description: "Numéro de TVA européen ou null"
        },
        phone: {
          bsonType: ["string", "null"],
          description: "Numéro de téléphone au format international"
        },
        address: {
          bsonType: ["string", "null"],
          description: "Adresse complète"
        },
        subscriptionType: {
          enum: ["basic", "premium", "enterprise", null],
          description: "Type d'abonnement"
        },
        source: {
          enum: ["WEB", "MOBILE", "API"],
          description: "Source de la demande"
        },
        status: {
          enum: ["pending", "approved", "rejected"],
          description: "Statut de la demande"
        },
        createdAt: {
          bsonType: "date",
          description: "Date de création"
        },
        updatedAt: {
          bsonType: "date",
          description: "Date de dernière modification"
        },
        ipAddress: {
          bsonType: ["string", "null"],
          description: "Adresse IP du client"
        },
        userAgent: {
          bsonType: ["string", "null"],
          description: "User-Agent du navigateur"
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
})
```

**Options:**
- `validationLevel: "moderate"` - Applique la validation uniquement aux nouveaux documents et aux mises à jour
- `validationAction: "error"` - Rejette les documents invalides (alternative: `"warn"`)

### 3. Index sur createdAt pour Performances

**Priorité:** BASSE
**Statut:** ⏳ À faire
**Impact:** Accélère les requêtes de tri par date

```javascript
db.onboarding_requests.createIndex(
  { createdAt: -1 },
  {
    name: "createdAt_desc_idx",
    background: true
  }
)
```

### 4. Index Composé sur status + createdAt

**Priorité:** BASSE
**Statut:** ⏳ À faire
**Impact:** Optimise les requêtes de listing par statut

```javascript
db.onboarding_requests.createIndex(
  { status: 1, createdAt: -1 },
  {
    name: "status_createdAt_idx",
    background: true
  }
)
```

## 🧪 Tests de Validation

### Test 1: Tentative de Doublon

```bash
# Première insertion (doit réussir)
curl -X POST "https://d2i50a1vlg138w.cloudfront.net/api/onboarding/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-unique@example.com",
    "companyName": "Test Company"
  }'

# Résultat attendu: 201 Created

# Deuxième insertion avec même email (doit échouer)
curl -X POST "https://d2i50a1vlg138w.cloudfront.net/api/onboarding/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-unique@example.com",
    "companyName": "Another Company"
  }'

# Résultat attendu: 409 Conflict avec error.code = "DUPLICATE_REQUEST"
```

### Test 2: Validation Email Invalide

```bash
curl -X POST "https://d2i50a1vlg138w.cloudfront.net/api/onboarding/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "companyName": "Test Company"
  }'

# Résultat attendu: 400 Bad Request avec error.code = "INVALID_EMAIL"
```

### Test 3: Vérification des Index

```javascript
use rt-auth
db.onboarding_requests.getIndexes()

// Résultat attendu: 4 indexes
// 1. _id_ (par défaut)
// 2. email_unique_idx (unique)
// 3. createdAt_desc_idx
// 4. status_createdAt_idx
```

## 📊 Monitoring

### Requêtes Utiles

**Compter les demandes par statut:**
```javascript
db.onboarding_requests.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])
```

**Lister les emails en double (avant l'index):**
```javascript
db.onboarding_requests.aggregate([
  {
    $group: {
      _id: "$email",
      count: { $sum: 1 },
      docs: { $push: "$_id" }
    }
  },
  { $match: { count: { $gt: 1 } } }
])
```

**Statistiques de performance des index:**
```javascript
db.onboarding_requests.stats({ indexDetails: true })
```

## 🔗 Autres Améliorations de Sécurité

### 1. Rate Limiting API

Voir: `CLOUDFRONT_SECURITY_SETUP.md`

### 2. Certificat SSL CloudFront

Voir: `CLOUDFRONT_SSL_SETUP.md`

### 3. Backup Automatique

**MongoDB Atlas** (Recommandé):
- Activer les backups automatiques dans Atlas
- Retention: 7 jours minimum
- Point-in-time recovery disponible

**Configuration:**
1. Atlas Dashboard → Clusters → `stagingrt`
2. Onglet `Backup`
3. Activer `Cloud Backup`
4. Configurer la rétention et la fréquence

### 4. Monitoring CloudWatch

**Métriques à surveiller:**
- Nombre de demandes par heure
- Taux d'erreur (400, 409, 500)
- Latence des requêtes MongoDB
- Taille de la collection

### 5. Rotation des Credentials

**Fréquence recommandée:** Tous les 90 jours

**Procédure:**
1. Créer un nouveau user dans MongoDB Atlas
2. Mettre à jour `MONGODB_URI` dans Elastic Beanstalk
3. Redémarrer le backend
4. Supprimer l'ancien user

## ✅ Checklist de Sécurité

- [ ] Index unique sur email créé
- [ ] Validation de schéma appliquée
- [ ] Index de performance créés
- [ ] Tests de validation passés
- [ ] Backups automatiques activés
- [ ] Monitoring CloudWatch configuré
- [ ] Rate limiting API implémenté
- [ ] Certificat SSL CloudFront configuré
- [ ] Documentation mise à jour
- [ ] Équipe formée aux procédures

## 📝 Notes

**Date de création:** 26 Novembre 2025
**Responsable:** DevOps / Backend Team
**Durée estimée:** 1-2 heures
**Environnement:** Production (`rt-auth`)

---

**⚠️ ATTENTION:** Ces modifications affectent la base de données de production. Toujours tester en staging avant d'appliquer en production.
