# Architecture API Supplier

## Vue d'ensemble

L'API Supplier est un service backend Node.js/Express qui gère l'ensemble du cycle de vie des fournisseurs dans l'écosystème RT Technologie.

## Stack Technique

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Base de données**: MongoDB + Mongoose
- **Authentification**: JWT
- **Email**: Nodemailer
- **QR Codes**: qrcode
- **HTTP Client**: Axios

## Structure du Projet

```
api-supplier/
├── src/
│   ├── models/              # Modèles MongoDB (Mongoose)
│   │   ├── Supplier.ts              # Profil fournisseur
│   │   ├── SupplierOrder.ts         # Commandes
│   │   ├── LoadingSlot.ts           # Créneaux de chargement
│   │   ├── SupplierSignature.ts     # Signatures électroniques
│   │   └── SupplierChat.ts          # Conversations
│   │
│   ├── routes/              # Routes Express
│   │   ├── onboarding.ts            # Invitation & activation
│   │   ├── suppliers.ts             # Gestion profil
│   │   ├── orders.ts                # Commandes
│   │   ├── slots.ts                 # Créneaux chargement
│   │   ├── signatures.ts            # Signatures électroniques
│   │   ├── chat.ts                  # Communication
│   │   └── notifications.ts         # Notifications
│   │
│   ├── services/            # Services métier
│   │   ├── invitation-service.ts    # Gestion invitations
│   │   ├── slot-service.ts          # Gestion créneaux + ETA
│   │   ├── signature-service.ts     # Signatures + QR codes
│   │   └── notification-service.ts  # Notifications multi-canal
│   │
│   ├── middleware/          # Middlewares Express
│   │   └── auth.ts                  # Authentification JWT
│   │
│   ├── utils/               # Utilitaires
│   │   ├── validators.ts            # Validation de données
│   │   ├── constants.ts             # Constantes
│   │   ├── event-emitter.ts         # Émission d'événements
│   │   └── seed.ts                  # Script de seed
│   │
│   ├── types/               # Types TypeScript
│   │   └── index.ts                 # Types centralisés
│   │
│   └── index.ts             # Point d'entrée de l'application
│
├── .env                     # Variables d'environnement
├── .env.example             # Template de configuration
├── .gitignore              # Fichiers ignorés par Git
├── package.json            # Dépendances et scripts
├── tsconfig.json           # Configuration TypeScript
├── README.md               # Documentation principale
├── API_TESTS.md            # Tests et exemples d'API
└── ARCHITECTURE.md         # Ce fichier
```

## Modèles de Données

### 1. Supplier
```typescript
{
  supplierId: "SUP-2024-XXXX",       // Auto-généré
  industrialId: string,               // Ref industriel invitant
  companyName: string,
  siret: string,                      // Unique
  address: {
    street, city, postalCode, country
  },
  contacts: [{
    name, role, email, phone, isPrimary
  }],
  status: 'invited'|'pending'|'active'|'incomplete'|'suspended',
  invitationToken: string,            // Pour onboarding
  settings: { notifications, language },
  subscription: { tier, validUntil }
}
```

### 2. SupplierOrder
```typescript
{
  orderId: string,                    // Ref orders-api
  supplierId: string,
  industrialId: string,
  status: 'to_prepare'|'ready'|'in_progress'|'loaded'|'dispute',
  loadingSlot: {
    date, startTime, endTime, dockId
  },
  goods: {
    description, weight, pallets, volume, specialInstructions
  },
  transportInfo: {
    carrierId, vehicleType, driverName, driverPhone, licensePlate
  },
  documents: [{
    type, filename, url, uploadedAt, uploadedBy
  }],
  timeline: [{
    status, timestamp, actor, notes
  }]
}
```

### 3. LoadingSlot
```typescript
{
  slotId: "SLOT-YYYYMM-XXXXX",       // Auto-généré
  supplierId: string,
  orderId: string,
  proposedBy: 'system'|'supplier'|'industrial',
  date: Date,
  startTime: string,                  // Format HH:MM
  endTime: string,
  dockId: string,
  status: 'proposed'|'accepted'|'rejected'|'modified'|'confirmed',
  etaFromTracking: Date,              // Synchronisé depuis Tracking API
  response: {
    action, reason, alternativeSlot, respondedAt, respondedBy
  }
}
```

### 4. SupplierSignature
```typescript
{
  signatureId: "SIG-YYYYMMDD-XXXXX", // Auto-généré
  orderId: string,
  supplierId: string,
  type: 'loading'|'delivery_note',
  method: 'smartphone'|'qrcode'|'kiosk',
  signatureData: string,              // Base64
  signerName: string,
  signerRole: string,
  location: { lat, lng },
  timestamp: Date,
  deviceInfo: string,
  verified: boolean
}
```

### 5. SupplierChat
```typescript
{
  chatId: "CHAT-YYYYMM-XXXXX",       // Auto-généré
  supplierId: string,
  participants: [{
    id, type, name
  }],
  orderId: string,                    // Optionnel
  messages: [{
    senderId, senderType, content, attachments, timestamp, read
  }],
  status: 'active'|'archived',
  lastMessageAt: Date
}
```

## Flux de Données

### Onboarding Fournisseur
```
1. Industrial → POST /onboarding/invite
   └─> Création Supplier (status: invited)
   └─> Email avec token envoyé

2. Fournisseur → GET /onboarding/validate/:token
   └─> Validation token

3. Fournisseur → POST /onboarding/register
   └─> Création compte (status: pending)

4. Fournisseur → PUT /onboarding/contacts
   └─> Configuration contacts (status: incomplete)

5. Fournisseur → POST /onboarding/complete
   └─> Activation compte (status: active)
   └─> Event: fournisseur.onboard.completed
```

### Gestion Créneaux de Chargement
```
1. Proposition créneau
   Industrial/System → POST /slots/propose
   └─> Création LoadingSlot (status: proposed)
   └─> Notification au fournisseur
   └─> Synchronisation ETA depuis Tracking API

2. Réponse fournisseur
   a) Acceptation:
      Supplier → POST /slots/:id/accept
      └─> Update status: accepted
      └─> Update SupplierOrder.loadingSlot
      └─> Event: fournisseur.rdv.validated

   b) Modification:
      Supplier → POST /slots/:id/modify
      └─> Update status: modified
      └─> Création nouveau slot (proposed)
      └─> Event: fournisseur.rdv.updated

   c) Refus:
      Supplier → POST /slots/:id/reject
      └─> Update status: rejected
      └─> Event: fournisseur.rdv.rejected

3. Confirmation finale
   Industrial → Confirmation
   └─> Update status: confirmed
```

### Signature Électronique
```
1. Méthode Smartphone:
   Supplier → POST /signatures/loading
   └─> Création SupplierSignature
   └─> Event: fournisseur.signature.completed

2. Méthode QR Code:
   a) Industrial → POST /signatures/qrcode/generate
      └─> Génération JWT token + QR code
      └─> Affichage QR code

   b) Supplier → Scan QR via app mobile
      └─> POST /signatures/qrcode/scan
      └─> Vérification token
      └─> Création SupplierSignature
      └─> Event: fournisseur.signature.completed

3. Méthode Kiosk:
   Supplier → POST /signatures/loading (method: kiosk)
   └─> Création SupplierSignature
   └─> Event: fournisseur.signature.completed
```

## Intégrations Externes

### API Tracking (Port 3010)
- **GET** `/tracking/order/:orderId/eta`
- Utilisé pour synchroniser l'ETA dans les créneaux de chargement
- Appelé automatiquement lors de la création/mise à jour de slots

### API Orders (Port 3003)
- **GET** `/orders/:orderId`
- Récupération des informations de commande
- Synchronisation des données commandes

### API Events (Port 3005)
- **POST** `/events`
- Émission d'événements pour l'écosystème
- Événements: onboard, status_changed, rdv, signature, document

### API Auth (Port 3001)
- **GET** `/auth/verify`
- Vérification des tokens JWT
- Récupération des informations utilisateur

## Événements Émis

| Événement | Déclencheur | Données |
|-----------|-------------|---------|
| `fournisseur.onboard.completed` | Activation compte | supplierId, industrialId, companyName, activatedAt |
| `fournisseur.order.status_changed` | Changement statut commande | orderId, supplierId, previousStatus, newStatus |
| `fournisseur.rdv.validated` | Acceptation créneau | slotId, orderId, supplierId, date, time |
| `fournisseur.rdv.updated` | Modification créneau | originalSlotId, newSlotId, orderId, reason |
| `fournisseur.signature.completed` | Signature effectuée | signatureId, orderId, type, method, signerName |
| `fournisseur.document.uploaded` | Upload document | orderId, supplierId, documentType, filename |

## Sécurité

### Authentification
- JWT tokens avec expiration (7 jours par défaut)
- Header: `Authorization: Bearer TOKEN`
- Alternative: Header `x-supplier-id` pour développement

### Validation
- Validation SIRET (algorithme de Luhn)
- Validation email, téléphone, codes postaux
- Sanitization des entrées utilisateur
- Validation des fichiers (type, taille)

### CORS
- Origines configurables via `.env`
- Support credentials pour cookies

## Notifications

### Canaux
- **Email**: Via Nodemailer (SMTP)
- **Push**: Préparé pour Firebase Cloud Messaging
- **SMS**: Préparé pour Twilio/AWS SNS

### Types de Notifications
1. **Nouvelle commande**: Email + Push
2. **Créneau proposé**: Email + Push + SMS
3. **Créneau confirmé**: Email + Push
4. **Rappel de chargement**: Email + Push + SMS (urgent)
5. **Nouveau message**: Push
6. **Signature requise**: Email + Push

## Performance

### Index MongoDB
- `supplierId` (unique)
- `siret` (unique)
- `industrialId` + `status`
- `orderId` (unique)
- `supplierId` + `status`
- `date` + `status`
- `lastMessageAt`

### Pagination
- Limite par défaut: 20 éléments
- Limite maximale: 100 éléments
- Offset/limit pattern

## Monitoring

### Endpoints de Santé
- **GET** `/health` - Status API
- **GET** `/` - Documentation endpoints

### Logs
- Logs de requêtes (timestamp, method, path)
- Logs d'erreurs avec stack traces (dev)
- Logs d'événements émis

## Déploiement

### Variables d'Environnement Requises
```env
PORT=3017
MONGODB_URI=mongodb://...
JWT_SECRET=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASSWORD=...
API_TRACKING_URL=...
API_EVENTS_URL=...
```

### Scripts NPM
```bash
npm run dev      # Mode développement avec watch
npm run build    # Compilation TypeScript
npm start        # Production
npm run seed     # Peupler la DB avec données test
```

### Docker (À implémenter)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3017
CMD ["node", "dist/index.js"]
```

## Tests

### Script de Seed
```bash
npm run seed
```
Crée des données de test:
- 3 fournisseurs (2 actifs, 1 invité)
- 3 commandes (statuts variés)
- 2 créneaux de chargement
- 1 signature
- 1 conversation

### Tests manuels
Voir `API_TESTS.md` pour exemples cURL/Postman

## Évolutions Futures

### Court terme
- [ ] Rate limiting
- [ ] Authentification OAuth2
- [ ] Upload de fichiers (multipart/form-data)
- [ ] Webhooks pour événements

### Moyen terme
- [ ] WebSockets pour chat temps réel
- [ ] Génération PDF des bons signés
- [ ] Analytics et reporting
- [ ] Intégration calendar (iCal) pour créneaux

### Long terme
- [ ] ML pour prédiction des délais
- [ ] Recommandation de créneaux optimaux
- [ ] OCR pour extraction données documents
- [ ] Multi-tenant avec isolation des données

## Support

Pour toute question technique:
- Email: dev@rt-technologie.fr
- Documentation: https://docs.rt-technologie.fr
- Issues: GitHub repository

---

**Version**: 1.0.0
**Dernière mise à jour**: 2024-12-01
**Auteur**: RT Technologie Development Team
