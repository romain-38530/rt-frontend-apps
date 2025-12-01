# RT Chatbot API

API complète de Chatbot IA avec intégration Claude pour la plateforme RT Technologie.

## Caractéristiques

- **8 types de bots spécialisés** : HelpBot, Planif'IA, Routier, Quai & WMS, Livraisons, Expédition, Freight IA, Copilote
- **Intégration Claude IA** : Génération de réponses contextuelles avec Claude Sonnet 4.5
- **Système de ticketing** : Création et gestion de tickets avec SLA automatique
- **Base de connaissances** : Articles et FAQ searchables
- **Diagnostics automatisés** : Vérification du statut de tous les services
- **WebSocket temps réel** : Notifications et mises à jour instantanées
- **Statistiques complètes** : Analytics sur conversations, résolution, tickets

## Technologies

- **Runtime** : Node.js avec TypeScript
- **Framework** : Express.js
- **Base de données** : MongoDB avec Mongoose
- **IA** : Anthropic Claude API (claude-sonnet-4-5)
- **WebSocket** : ws
- **Authentification** : JWT via auth-api

## Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer en développement
npm run dev

# Build pour production
npm run build
npm start
```

## Variables d'environnement

Voir `.env.example` pour la liste complète. Les variables essentielles :

- `PORT` : Port du serveur (défaut: 3016)
- `MONGODB_URI` : URI de connexion MongoDB
- `ANTHROPIC_API_KEY` : Clé API Claude (requis)
- `AUTH_API_URL` : URL de l'API d'authentification
- URLs des autres APIs pour les intégrations

## Architecture

```
apps/api-chatbot/
├── src/
│   ├── models/           # Modèles MongoDB
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   ├── Ticket.ts
│   │   ├── KnowledgeArticle.ts
│   │   ├── FAQ.ts
│   │   └── Diagnostic.ts
│   ├── routes/           # Routes API
│   │   ├── conversations.ts
│   │   ├── messages.ts
│   │   ├── tickets.ts
│   │   ├── knowledge.ts
│   │   ├── faq.ts
│   │   ├── diagnostics.ts
│   │   └── stats.ts
│   ├── services/         # Logique métier
│   │   ├── claude-service.ts
│   │   ├── diagnostics-service.ts
│   │   ├── ticketing-service.ts
│   │   └── knowledge-service.ts
│   ├── middleware/       # Middleware Express
│   │   └── auth.ts
│   ├── data/            # Données initiales
│   │   ├── initial-faq.ts
│   │   └── knowledge-base.ts
│   └── index.ts         # Point d'entrée
└── package.json
```

## Endpoints principaux

### Conversations

- `POST /api/v1/conversations` - Créer une conversation
- `GET /api/v1/conversations` - Liste des conversations
- `GET /api/v1/conversations/:id` - Détail d'une conversation
- `POST /api/v1/conversations/:id/close` - Fermer
- `POST /api/v1/conversations/:id/feedback` - Ajouter feedback (rating 1-5)
- `POST /api/v1/conversations/:id/escalate` - Escalader vers technicien

### Messages

- `POST /api/v1/conversations/:id/messages` - Envoyer message + réponse IA
- `GET /api/v1/conversations/:id/messages` - Historique messages

### Tickets

- `POST /api/v1/tickets` - Créer ticket depuis conversation
- `GET /api/v1/tickets` - Liste tickets (filtres disponibles)
- `GET /api/v1/tickets/:id` - Détail ticket + SLA status
- `PUT /api/v1/tickets/:id` - Mettre à jour
- `POST /api/v1/tickets/:id/assign` - Assigner technicien
- `POST /api/v1/tickets/:id/resolve` - Résoudre

### Knowledge Base

- `GET /api/v1/knowledge` - Rechercher articles
- `GET /api/v1/knowledge/:id` - Détail article
- `POST /api/v1/knowledge/:id/helpful` - Marquer utile

### FAQ

- `GET /api/v1/faq` - Liste FAQ par botType
- `GET /api/v1/faq/search` - Recherche FAQ
- `GET /api/v1/faq/grouped/:botType` - FAQ groupées par catégorie

### Diagnostics

- `POST /api/v1/diagnostics/run` - Lancer diagnostic (erp|api|tracking|server)
- `GET /api/v1/diagnostics/status` - Statut tous services
- `GET /api/v1/diagnostics/:service` - Statut service spécifique

### Statistiques

- `GET /api/v1/stats/conversations` - Stats conversations
- `GET /api/v1/stats/resolution` - Taux résolution
- `GET /api/v1/stats/tickets` - Stats tickets

## Types de bots disponibles

### HelpBot
Assistant support technique pour problèmes ERP, API, intégrations.

### Planif'IA
Assistant planning pour industriels - optimisation créneaux et tournées.

### Routier
Assistant pour transporteurs - gestion commandes, CMR, suivi flotte.

### Quai & WMS
Assistant logistique - gestion quais, réceptions, expéditions.

### Livraisons
Assistant pour destinataires - suivi livraisons, réservation créneaux.

### Expédition
Assistant pour expéditeurs - création commandes, choix transporteurs.

### Freight IA
Assistant affrètement - optimisation remplissage, scoring transporteurs.

### Copilote
Assistant chauffeur - navigation, eCMR, temps de conduite.

## Fonctionnalités IA

### Génération de réponses
- Contexte adapté par type de bot
- Historique de conversation
- Détection d'intention
- Suggestions d'actions

### Escalade automatique
- Transfert après 3 interactions si non résolu
- Détection de mots-clés urgents
- Scoring de priorité automatique

### Contenu recommandé
- Articles de KB pertinents
- FAQ liées
- Recherche sémantique

## SLA Tickets

Les SLA sont calculés automatiquement selon la priorité :

| Priorité | Temps de réponse | Temps de résolution |
|----------|------------------|---------------------|
| Urgent   | 1 heure         | 4 heures            |
| High     | 4 heures        | 24 heures           |
| Medium   | 8 heures        | 72 heures           |
| Low      | 24 heures       | 168 heures          |

## WebSocket

Connexion WebSocket disponible sur `/ws` pour notifications temps réel :

```javascript
const ws = new WebSocket('ws://localhost:3016/ws');

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Notification:', message);
});

// S'abonner à un canal
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'conversations'
}));
```

## Monitoring

Le monitoring de santé des services peut être activé via :
```env
ENABLE_HEALTH_MONITORING=true
```

Il vérifie automatiquement toutes les 5 minutes :
- auth-api, authz-api
- orders-api, planning-api, tracking-api
- documents-api, ecmr-api
- notifications-api, websocket-api
- affret-ia-api, scoring-api
- palettes-api, billing-api
- erp-integration

## Authentification

L'API utilise JWT tokens via l'auth-api :

```javascript
fetch('/api/v1/conversations', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
})
```

Les routes publiques (FAQ, Knowledge, Diagnostics en lecture) ne nécessitent pas d'authentification.

## Initialisation des données

Au premier démarrage, l'API initialise automatiquement :
- 60+ FAQ couvrant tous les modules
- 10+ articles de base de connaissances

Ces données peuvent être gérées via l'interface admin ou directement en base.

## Production

Variables d'environnement de production à configurer :
- `NODE_ENV=production`
- `MONGODB_URI` pointant vers cluster MongoDB Atlas
- `ANTHROPIC_API_KEY` avec clé de production
- URLs des APIs de production
- `CORS_ORIGIN` avec domaines autorisés

## Support

Pour toute question sur l'API :
- Documentation : docs.rt-technologie.com
- Support : support@rt-technologie.com
- Issues : Créer un ticket via l'API elle-même !
