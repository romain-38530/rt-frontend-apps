# Configuration de l'authentification MongoDB

## Architecture

Le système d'authentification se compose de:

### 1. Service API Backend (`apps/api-auth`)
Service Express standalone qui gère l'authentification centralisée avec MongoDB pour tous les portails.

**Fonctionnalités:**
- Inscription d'utilisateurs
- Connexion avec JWT
- Validation de tokens
- Stockage sécurisé des mots de passe (bcrypt)

### 2. Applications Frontend
Chaque application frontend (web-industry, web-transporter, etc.) utilise:
- Page de connexion (`/login`)
- Protection des routes avec `lib/auth.ts`
- Bouton de test pour développement

## Installation

### 1. Installer les dépendances de l'API

```bash
cd apps/api-auth
pnpm install
```

### 2. Configurer MongoDB

Créez un fichier `.env` dans `apps/api-auth`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/rt-auth
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3002,http://localhost:3003
```

### 3. Lancer MongoDB

```bash
# Avec Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Ou installer MongoDB localement
```

### 4. Démarrer l'API d'authentification

```bash
cd apps/api-auth
pnpm dev
```

L'API sera disponible sur http://localhost:3001

### 5. Configurer les applications frontend

Pour chaque application, créez un fichier `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 6. Lancer les applications

```bash
# Depuis la racine
pnpm dev

# Ou pour une app spécifique
cd apps/web-industry
pnpm dev
```

## Utilisation

### Mode Test (Développement)
Chaque page de login a un bouton "Connexion de test" qui permet de se connecter sans API ni base de données. Cela crée un token fictif dans localStorage.

### Mode Production
Les utilisateurs doivent créer un compte via l'API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "portal": "industry"
  }'
```

Puis se connecter normalement via l'interface.

## Endpoints API

### POST /api/auth/register
Créer un nouveau compte utilisateur

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "portal": "industry"
}
```

### POST /api/auth/login
Se connecter

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "portal": "industry"
  }
}
```

### GET /api/auth/me
Obtenir les informations de l'utilisateur connecté

**Headers:**
```
Authorization: Bearer <token>
```

### GET /health
Vérifier l'état de l'API

## Déploiement

### API Backend
L'API peut être déployée sur:
- AWS EC2
- Heroku
- DigitalOcean
- AWS Lambda avec API Gateway

### Frontend
Les applications restent en mode `output: 'export'` et peuvent être déployées sur AWS Amplify comme avant.

**Important:** Configurez `NEXT_PUBLIC_API_URL` en production pour pointer vers l'URL de l'API déployée.

## Sécurité

- Les mots de passe sont hashés avec bcrypt (10 rounds)
- Les tokens JWT expirent après 7 jours
- CORS configuré pour les domaines autorisés
- Validation des entrées utilisateur

## Applications configurées

Tous les portails suivants ont l'authentification configurée:
- 🏭 **web-industry** - Portail Industrie (violet)
- 🚚 **web-transporter** - Portail Transporteur (cyan/orange)
- 📦 **web-recipient** - Portail Destinataire (vert)
- 🏪 **web-supplier** - Portail Fournisseur (rose)
- 🌐 **web-forwarder** - Portail Transitaire (bleu)
- 📊 **web-logistician** - Portail Logisticien (rose/jaune)

Chaque portail a:
- Page de login personnalisée avec ses couleurs
- Protection d'authentification sur la page d'accueil
- Affichage de l'utilisateur connecté
- Bouton de déconnexion
