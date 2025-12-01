# API Supplier - RT Technologie

API de gestion des fournisseurs, créneaux de chargement et signatures électroniques pour la plateforme RT Technologie.

## Description

Cette API permet de gérer l'ensemble du cycle de vie des fournisseurs :
- Onboarding et invitation des fournisseurs
- Gestion des commandes et statuts
- Gestion des créneaux de chargement (proposition, acceptation, modification)
- Signatures électroniques (smartphone, QR code, kiosk)
- Communication en temps réel (chat)
- Notifications multi-canal (email, push, SMS)

## Port

**Port par défaut : 3017**

## Installation

```bash
# Installation des dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables d'environnement
nano .env
```

## Configuration

Créer un fichier `.env` à la racine :

```env
PORT=3017
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/rt-supplier

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@rt-technologie.fr

API_TRACKING_URL=http://localhost:3010
API_ORDERS_URL=http://localhost:3003
API_AUTH_URL=http://localhost:3001
API_EVENTS_URL=http://localhost:3005

SUPPLIER_PORTAL_URL=http://localhost:3000/supplier
```

## Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## Architecture

### Modèles MongoDB

1. **Supplier** - Profil et informations fournisseur
2. **SupplierOrder** - Commandes avec timeline et documents
3. **LoadingSlot** - Créneaux de chargement avec ETA tracking
4. **SupplierSignature** - Signatures électroniques
5. **SupplierChat** - Conversations et messages

### Routes Principales

#### Onboarding (`/onboarding`)
- `POST /invite` - Inviter un fournisseur
- `GET /validate/:token` - Valider invitation
- `POST /register` - Créer compte
- `PUT /contacts` - Configurer contacts
- `POST /complete` - Finaliser onboarding

#### Suppliers (`/suppliers`)
- `GET /me` - Profil du fournisseur
- `PUT /me` - Mettre à jour profil
- `GET /me/industrials` - Liste industriels liés
- `PUT /me/settings` - Paramètres

#### Orders (`/orders`)
- `GET /` - Liste des commandes (filtres: status, date, industrial)
- `GET /:id` - Détail commande
- `PUT /:id/status` - Changer statut (to_prepare → ready → in_progress → loaded)
- `POST /:id/documents` - Upload document
- `GET /:id/timeline` - Historique événements

#### Slots (`/slots`)
- `GET /` - Créneaux proposés
- `GET /:orderId` - Créneau pour commande
- `POST /:id/accept` - Accepter créneau
- `POST /:id/modify` - Proposer modification
- `POST /:id/reject` - Refuser créneau
- `GET /availability` - Disponibilités
- `POST /sync-eta` - Synchroniser ETA depuis Tracking API

#### Signatures (`/signatures`)
- `POST /loading` - Signer bon de chargement
- `POST /qrcode/generate` - Générer QR code
- `POST /qrcode/scan` - Scanner QR et signer
- `GET /:orderId` - Signatures pour commande
- `POST /verify` - Vérifier authenticité
- `GET /:orderId/status` - Statut des signatures requises

#### Chat (`/chats`)
- `GET /` - Liste conversations
- `POST /` - Créer conversation
- `GET /:id` - Détail conversation
- `POST /:id/messages` - Envoyer message
- `POST /:id/template` - Message template prédéfini
- `PUT /:id/read` - Marquer comme lu

#### Notifications (`/notifications`)
- `GET /` - Liste notifications
- `PUT /:id/read` - Marquer comme lue
- `PUT /read-all` - Tout marquer lu
- `GET /settings` - Paramètres notifications
- `POST /settings` - Mettre à jour paramètres

## Événements émis

L'API émet les événements suivants vers l'API Events :

- `fournisseur.onboard.completed` - Fournisseur activé
- `fournisseur.order.status_changed` - Statut commande modifié
- `fournisseur.rdv.validated` - Créneau accepté
- `fournisseur.rdv.updated` - Créneau modifié
- `fournisseur.signature.completed` - Signature effectuée
- `fournisseur.document.uploaded` - Document uploadé

## Intégrations Externes

### API Tracking
- Synchronisation des ETA pour les créneaux de chargement
- Endpoint: `GET /tracking/order/:orderId/eta`

### API Orders
- Récupération des informations de commande
- Endpoint: `GET /orders/:orderId`

### API Events
- Émission d'événements pour l'écosystème
- Endpoint: `POST /events`

## Flux Onboarding Fournisseur

1. **Invitation** : L'industriel invite le fournisseur via `POST /onboarding/invite`
2. **Email** : Le fournisseur reçoit un email avec lien d'activation
3. **Validation** : Le fournisseur clique sur le lien (`GET /validate/:token`)
4. **Inscription** : Création du compte (`POST /register`)
5. **Contacts** : Configuration des contacts (`PUT /contacts`)
6. **Activation** : Finalisation (`POST /complete`)
7. **Événement** : `fournisseur.onboard.completed` émis

## Flux Gestion des Créneaux

1. **Proposition** : Système/Industrial propose créneau (`POST /slots/propose`)
2. **Notification** : Fournisseur reçoit notification
3. **Action** :
   - Accepter : `POST /slots/:id/accept`
   - Modifier : `POST /slots/:id/modify` (propose alternative)
   - Refuser : `POST /slots/:id/reject`
4. **Synchronisation** : ETA mis à jour depuis Tracking API
5. **Confirmation** : Créneau confirmé définitivement

## Flux Signature Électronique

### Méthode Smartphone
```
POST /signatures/loading
{
  orderId, method: 'smartphone', signatureData, signerName, signerRole, location
}
```

### Méthode QR Code
```
1. POST /signatures/qrcode/generate → Génère QR
2. Affichage QR code au fournisseur
3. Scan du QR via app mobile
4. POST /signatures/qrcode/scan → Signature
```

### Méthode Kiosk
```
POST /signatures/loading
{
  orderId, method: 'kiosk', signatureData, signerName, signerRole
}
```

## Messages Templates Prédéfinis

Templates disponibles via `POST /chats/:id/template` :

- `loading_ready` - Chargement prêt
- `delay_production` - Retard de production
- `missing_documents` - Documents manquants
- `quality_issue` - Problème qualité
- `early_loading` - Chargement anticipé possible

## Sécurité

- Authentification JWT
- Validation des tokens d'invitation
- Vérification des signatures électroniques
- Sanitization des entrées utilisateur
- CORS configuré

## Tests

```bash
# Health check
curl http://localhost:3017/health

# Liste des endpoints
curl http://localhost:3017/

# Inviter un fournisseur
curl -X POST http://localhost:3017/onboarding/invite \
  -H "Content-Type: application/json" \
  -d '{
    "industrialId": "IND-001",
    "companyName": "Fournisseur Test",
    "siret": "12345678901234",
    "email": "contact@fournisseur.fr",
    "address": {
      "street": "1 rue Test",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    }
  }'
```

## Monitoring

- Logs de requêtes
- Health check endpoint : `/health`
- Gestion des erreurs centralisée
- Événements émis vers API Events

## Développement

```bash
# Watch mode
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Technologies

- **Express.js** - Framework web
- **MongoDB + Mongoose** - Base de données
- **JWT** - Authentification
- **Nodemailer** - Emails
- **QRCode** - Génération QR codes
- **Axios** - Requêtes HTTP
- **TypeScript** - Langage typé

## Support

Pour toute question : support@rt-technologie.fr

## Licence

Propriétaire - RT Technologie © 2024
