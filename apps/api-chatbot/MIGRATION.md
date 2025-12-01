# Migration Guide - Orders API vers Chatbot API

## Vue d'ensemble

Cette API a été transformée d'une simple API Orders en une **API Chatbot IA complète** avec intégration Claude.

## Changements majeurs

### 1. Port modifié
- **Ancien** : Port 3030
- **Nouveau** : Port 3016 (pour éviter conflit avec api-planning)

### 2. Base de données
- **Ancien** : `rt-orders` (modèle Order uniquement)
- **Nouveau** : `rt-chatbot` (6 modèles : Conversation, Message, Ticket, KnowledgeArticle, FAQ, Diagnostic)

### 3. Anciens fichiers (peuvent être supprimés)
- `src/models/Order.ts` - Remplacé par nouveaux modèles
- `src/routes/orders.ts` - Remplacé par nouvelles routes

## Nouveaux fichiers créés

### Modèles (6 fichiers)
```
src/models/
├── Conversation.ts    - Conversations chatbot
├── Message.ts         - Messages IA
├── Ticket.ts          - Système ticketing
├── KnowledgeArticle.ts - Base de connaissances
├── FAQ.ts             - FAQ
└── Diagnostic.ts      - Diagnostics services
```

### Services (4 fichiers)
```
src/services/
├── claude-service.ts        - Intégration Claude IA
├── diagnostics-service.ts   - Diagnostics automatisés
├── ticketing-service.ts     - Gestion tickets
└── knowledge-service.ts     - Recherche KB/FAQ
```

### Routes (7 fichiers)
```
src/routes/
├── conversations.ts  - Gestion conversations
├── messages.ts       - Messages + IA
├── tickets.ts        - Ticketing
├── knowledge.ts      - Articles KB
├── faq.ts           - FAQ
├── diagnostics.ts   - Health checks
└── stats.ts         - Statistiques
```

### Middleware & Data
```
src/middleware/
└── auth.ts          - Authentification JWT

src/data/
├── initial-faq.ts        - 60+ FAQ initiales
└── knowledge-base.ts     - 10+ articles KB
```

### Configuration
```
.env.example         - Template variables d'environnement
README.md            - Documentation complète
```

## Installation post-migration

### 1. Installer nouvelles dépendances
```bash
cd apps/api-chatbot
npm install
```

Nouvelles dépendances ajoutées :
- `@anthropic-ai/sdk` - SDK Claude
- `ws` - WebSocket support
- `axios` - HTTP client
- `@types/ws` - Types WebSocket

### 2. Configuration .env

Créer `.env` depuis `.env.example` et configurer :

```env
# REQUIS
PORT=3016
MONGODB_URI=mongodb://localhost:27017/rt-chatbot
ANTHROPIC_API_KEY=votre_clé_claude

# URLs APIs
AUTH_API_URL=http://localhost:3001
ORDERS_API_URL=http://localhost:3010
PLANNING_API_URL=http://localhost:3030
# ... autres APIs
```

### 3. Démarrer l'API

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

### 4. Vérification

Tester que l'API fonctionne :
```bash
curl http://localhost:3016/health
```

Devrait retourner :
```json
{
  "status": "ok",
  "message": "RT Chatbot API is running",
  "mongodb": "connected"
}
```

## Données initiales

Au premier démarrage, l'API initialise automatiquement :
- **60+ FAQ** couvrant tous les modules (HelpBot, Planif'IA, Routier, etc.)
- **10+ articles** de base de connaissances

Ces données sont insérées uniquement si la base est vide.

## Intégration avec autres APIs

L'API Chatbot s'intègre avec :
- **auth-api** : Authentification JWT
- **notifications-api** : Notifications tickets
- **Toutes les autres APIs** : Pour diagnostics et contexte IA

Assurez-vous que ces APIs sont configurées dans `.env`.

## WebSocket

Nouveau : Support WebSocket pour temps réel
- Endpoint : `ws://localhost:3016/ws`
- Types de messages : ping/pong, subscribe
- Utilisé pour notifications live

## Fonctionnalités clés

### 1. Chatbot IA
- 8 types de bots spécialisés
- Intégration Claude Sonnet 4.5
- Détection d'intention
- Suggestions d'actions

### 2. Ticketing
- Création automatique depuis conversations
- SLA automatiques selon priorité
- Assignation et suivi

### 3. Base de connaissances
- Articles searchables
- FAQ par module
- Scoring d'utilité

### 4. Diagnostics
- Vérification automatique des services
- Monitoring continu (optionnel)
- Alertes en temps réel

### 5. Statistiques
- Analytics conversations
- Taux de résolution
- Performance tickets
- Métriques IA

## Migration des données existantes (si nécessaire)

Si vous aviez des données Orders importantes :

1. Backup de l'ancienne base :
```bash
mongodump --db rt-orders --out backup/
```

2. Les données Orders ne sont pas migrées automatiquement
3. L'ancien modèle Order.ts est conservé mais non utilisé
4. Vous pouvez créer un script de migration personnalisé si nécessaire

## Tests

Exemples de requêtes pour tester :

### Créer une conversation
```bash
curl -X POST http://localhost:3016/api/v1/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "botType": "helpbot",
    "context": {}
  }'
```

### Envoyer un message (avec réponse IA)
```bash
curl -X POST http://localhost:3016/api/v1/conversations/CONV_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Comment intégrer votre API ?"
  }'
```

### Rechercher FAQ
```bash
curl "http://localhost:3016/api/v1/faq?botType=helpbot"
```

### Lancer diagnostic
```bash
curl -X POST http://localhost:3016/api/v1/diagnostics/run \
  -H "Content-Type: application/json" \
  -d '{"type": "api"}'
```

## Prochaines étapes

1. Configurer Anthropic API key de production
2. Configurer MongoDB Atlas pour production
3. Déployer sur votre infrastructure
4. Configurer monitoring externe
5. Intégrer frontend chatbot
6. Former équipe support sur ticketing

## Support

Pour toute question sur la migration :
- Consulter README.md
- Vérifier les logs : `npm run dev`
- Tester health check : `/health`
- Vérifier MongoDB : connexion active

## Rollback (si nécessaire)

Pour revenir à l'ancienne version :
1. Restaurer depuis git : `git checkout [commit-avant-migration]`
2. Restaurer backup MongoDB si nécessaire
3. Redémarrer avec ancien port 3030

**Note** : Il est recommandé de tester complètement en dev avant production.
