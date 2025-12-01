# Quick Start - API Recipient

Guide de démarrage rapide pour l'API Recipient de RT Technologie.

## Installation rapide

```bash
# Naviguer vers le dossier
cd apps/api-recipient

# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env

# Éditer le fichier .env avec vos paramètres
# Minimum requis:
# - PORT=3018
# - MONGODB_URI=mongodb://localhost:27017/rt-recipient
# - JWT_SECRET=votre-secret-jwt
```

## Démarrage

### Mode développement (avec hot reload)
```bash
npm run dev
```

### Mode production
```bash
npm run build
npm start
```

## Vérification

### 1. Health check
```bash
curl http://localhost:3018/health
```

Réponse attendue:
```json
{
  "status": "ok",
  "service": "api-recipient",
  "version": "1.0.0",
  "timestamp": "2024-12-01T10:00:00.000Z",
  "mongodb": "connected"
}
```

### 2. Info API
```bash
curl http://localhost:3018/
```

### 3. Test d'invitation (sans auth)
```bash
curl -X POST http://localhost:3018/onboarding/invite \
  -H "Content-Type: application/json" \
  -d '{
    "industrialId": "IND-2024-0001",
    "companyName": "Test Company",
    "siret": "12345678901234",
    "contactEmail": "test@example.com",
    "contactName": "John Doe",
    "contactPhone": "+33612345678"
  }'
```

## Prérequis

### MongoDB
```bash
# Démarrer MongoDB localement
mongod --dbpath /data/db

# Ou avec Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Variables d'environnement essentielles

```env
# Serveur
PORT=3018
NODE_ENV=development

# Base de données
MONGODB_URI=mongodb://localhost:27017/rt-recipient

# Sécurité
JWT_SECRET=change-this-secret-in-production

# APIs externes (optionnel pour dev)
TRACKING_API_URL=http://localhost:3010
ECMR_API_URL=http://localhost:3008
BILLING_API_URL=http://localhost:3014
NOTIFICATIONS_API_URL=http://localhost:3013
```

## Structure des endpoints

### Publics (sans auth)
- `POST /onboarding/invite` - Inviter un destinataire
- `GET /onboarding/validate/:token` - Valider token
- `POST /onboarding/register` - Créer compte
- `GET /health` - État du service

### Protégés (avec JWT)
Tous les autres endpoints nécessitent:
```
Authorization: Bearer <votre-jwt-token>
```

## Exemples de requêtes

### 1. Onboarding complet

#### a. Invitation
```bash
curl -X POST http://localhost:3018/onboarding/invite \
  -H "Content-Type: application/json" \
  -d '{
    "industrialId": "IND-2024-0001",
    "companyName": "Acme Corp",
    "siret": "12345678901234",
    "contactEmail": "contact@acme.com",
    "contactName": "John Doe",
    "contactPhone": "+33612345678"
  }'
```

#### b. Validation token
```bash
curl http://localhost:3018/onboarding/validate/TOKEN_RECU
```

#### c. Création compte
```bash
curl -X POST http://localhost:3018/onboarding/register \
  -H "Content-Type: application/json" \
  -d '{
    "invitationToken": "TOKEN_RECU",
    "primaryContact": {
      "name": "John Doe",
      "role": "Admin",
      "email": "john@acme.com",
      "phone": "+33612345678"
    },
    "password": "SecurePassword123!",
    "acceptTerms": true
  }'
```

#### d. Configuration sites
```bash
curl -X PUT http://localhost:3018/onboarding/sites \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "RCP-2024-0001",
    "sites": [
      {
        "name": "Entrepôt Principal",
        "address": {
          "street": "123 Rue du Commerce",
          "city": "Paris",
          "postalCode": "75001",
          "country": "France"
        }
      }
    ]
  }'
```

#### e. Finalisation
```bash
curl -X POST http://localhost:3018/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{"recipientId": "RCP-2024-0001"}'
```

### 2. Consultation livraisons (avec auth)

```bash
curl http://localhost:3018/deliveries \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Signature de livraison

```bash
curl -X POST http://localhost:3018/signatures/receive \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryId": "DEL-2024-000123",
    "signatureData": "base64_signature_data",
    "signerName": "John Doe",
    "signerRole": "Responsable Réception"
  }'
```

### 4. Déclaration incident

```bash
curl -X POST http://localhost:3018/incidents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryId": "DEL-2024-000123",
    "type": "damage",
    "severity": "major",
    "title": "Palettes endommagées",
    "description": "5 palettes livrées avec dommages",
    "affectedItems": [
      {
        "reference": "PROD-001",
        "description": "Palettes A",
        "quantityAffected": 5,
        "damageType": "damaged",
        "damageDescription": "Emballage déchiré"
      }
    ]
  }'
```

## Tests de développement

### Créer un destinataire de test
```javascript
// Via MongoDB directement
use rt-recipient

db.recipients.insertOne({
  recipientId: "RCP-TEST-0001",
  industrialId: "IND-2024-0001",
  companyName: "Test Company",
  siret: "12345678901234",
  status: "active",
  sites: [{
    siteId: "SITE-TEST-01",
    name: "Site Test",
    address: {
      street: "123 Test St",
      city: "Paris",
      postalCode: "75001",
      country: "France"
    },
    isActive: true
  }],
  contacts: [{
    contactId: "CONTACT-TEST-01",
    name: "Test User",
    role: "Admin",
    email: "test@test.com",
    phone: "+33612345678",
    isPrimary: true,
    canSignDeliveries: true
  }],
  settings: {
    notifications: {
      emailEnabled: true,
      pushEnabled: true,
      etaAlerts: true
    },
    language: "fr",
    timezone: "Europe/Paris"
  },
  subscription: {
    tier: "free",
    maxSites: 1,
    maxUsers: 3
  },
  metadata: {
    totalDeliveries: 0,
    totalIncidents: 0
  },
  invitedAt: new Date(),
  activatedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Créer une livraison de test
```javascript
db.deliveries.insertOne({
  deliveryId: "DEL-TEST-000001",
  orderId: "ORD-2024-001",
  recipientId: "RCP-TEST-0001",
  siteId: "SITE-TEST-01",
  industrialId: "IND-2024-0001",
  status: "scheduled",
  priority: "normal",
  eta: {
    predicted: new Date(Date.now() + 2 * 60 * 60 * 1000), // Dans 2h
    source: "manual",
    confidence: 80,
    lastUpdate: new Date()
  },
  scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
  transport: {
    carrierName: "Transport Test",
    trackingEnabled: false
  },
  cargo: {
    description: "Test cargo",
    pallets: 10,
    weight: 500
  },
  documents: [],
  timeline: [{
    eventId: "EVT-001",
    event: "created",
    timestamp: new Date(),
    actor: {
      id: "system",
      type: "system",
      name: "System"
    }
  }],
  notifications: {
    recipientNotified: false,
    etaUpdatesSent: 0
  },
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Dépannage

### Erreur de connexion MongoDB
```
Error: MongoDB connection error
```

**Solution:**
1. Vérifier que MongoDB est démarré
2. Vérifier MONGODB_URI dans .env
3. Tester la connexion: `mongo mongodb://localhost:27017`

### Port déjà utilisé
```
Error: listen EADDRINUSE: address already in use :::3018
```

**Solution:**
```bash
# Trouver le processus
lsof -i :3018

# Tuer le processus
kill -9 PID
```

### JWT invalide
```
401 Unauthorized: Invalid or expired token
```

**Solution:**
1. Vérifier que le token est présent dans Authorization header
2. Vérifier JWT_SECRET dans .env
3. Vérifier que le token n'a pas expiré

## Logs

### Activer les logs détaillés
```env
NODE_ENV=development
DEBUG=*
```

### Logs MongoDB
Les événements MongoDB sont loggés automatiquement:
- ✅ Connected to MongoDB
- ⚠️ MongoDB disconnected
- ❌ MongoDB error

## Scripts npm

```bash
# Développement avec hot reload
npm run dev

# Build production
npm run build

# Démarrage production
npm start

# Linter
npm run lint

# Tests (à implémenter)
npm test
```

## Base de données

### Collections créées automatiquement
1. `recipients` - Destinataires
2. `deliveries` - Livraisons
3. `deliverysignatures` - Signatures
4. `incidents` - Incidents
5. `recipientchats` - Conversations

### Nettoyer la base (dev only)
```javascript
use rt-recipient
db.recipients.deleteMany({})
db.deliveries.deleteMany({})
db.deliverysignatures.deleteMany({})
db.incidents.deleteMany({})
db.recipientchats.deleteMany({})
```

## Prochaines étapes

1. ✅ API fonctionnelle sur port 3018
2. ✅ 59 endpoints disponibles
3. ✅ 5 modèles MongoDB
4. ✅ 5 services d'intégration

**À faire:**
- [ ] Implémenter les tests
- [ ] Ajouter Swagger documentation
- [ ] Configurer les APIs externes
- [ ] Déployer en production

## Support

- **Documentation complète**: README.md
- **Structure détaillée**: STRUCTURE.md
- **Flux métier**: FLOWS.md
- **Port**: 3018

---

**Vous êtes prêt à utiliser l'API Recipient!**

Pour toute question: support@rt-technologie.com
