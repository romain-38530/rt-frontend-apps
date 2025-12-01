# API Recipient - RT Technologie

API de gestion des destinataires, livraisons, signatures et incidents pour la plateforme RT Technologie.

## Description

Cette API permet aux destinataires de:
- Compléter leur onboarding après invitation
- Gérer leur profil, sites de livraison et contacts
- Suivre leurs livraisons en temps réel avec ETA IA
- Signer les réceptions de livraison (complète, partielle, refus)
- Déclarer et suivre les incidents
- Communiquer via chat avec les transporteurs et industriels
- Recevoir des notifications push, email et SMS

## Port

**3018**

## Installation

```bash
cd apps/api-recipient
npm install
```

## Configuration

Créer un fichier `.env` à partir de `.env.example`:

```bash
cp .env.example .env
```

Variables d'environnement principales:
- `PORT`: Port du serveur (3018)
- `MONGODB_URI`: URI de connexion MongoDB
- `JWT_SECRET`: Secret pour les tokens JWT
- `TRACKING_API_URL`: URL de l'API Tracking IA
- `ECMR_API_URL`: URL de l'API eCMR
- `BILLING_API_URL`: URL de l'API Billing
- `NOTIFICATIONS_API_URL`: URL de l'API Notifications

## Démarrage

### Développement
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Architecture

### Modèles MongoDB

1. **Recipient** - Profil destinataire
   - `recipientId`: Identifiant unique (RCP-2024-XXXX)
   - `industrialId`: Référence de l'industriel invitant
   - `companyName`, `siret`: Informations entreprise
   - `sites[]`: Liste des sites de livraison
   - `contacts[]`: Contacts autorisés à signer
   - `status`: invited | pending | active | incomplete | suspended
   - `settings`: Préférences de notifications
   - `subscription`: Tier d'abonnement (free | pro | enterprise)

2. **Delivery** - Livraisons entrantes
   - `deliveryId`: Identifiant unique (DEL-2024-XXXXXX)
   - `orderId`: Référence commande
   - `recipientId`, `siteId`: Destination
   - `status`: scheduled | in_transit | arriving | arrived | unloading | delivered | incident
   - `eta`: ETA prédite par Tracking IA avec niveau de confiance
   - `transport`: Infos transporteur, chauffeur, véhicule, GPS
   - `cargo`: Description, palettes, poids, matières dangereuses
   - `documents[]`: CMR, photos, documents transport
   - `timeline[]`: Historique complet des événements

3. **DeliverySignature** - Signatures de livraison
   - `signatureId`: Identifiant unique (SIG-2024-XXXXXX)
   - `deliveryId`: Livraison associée
   - `type`: reception | partial_reception | refusal
   - `method`: smartphone | qrcode | kiosk | tablet | web
   - `signatureData`: Signature base64
   - `signerName`, `signerRole`: Signataire
   - `reservations`: Réserves éventuelles
   - `partialReception`: Détails réception partielle
   - `refusalDetails`: Motifs de refus
   - `photos[]`: Photos de preuve
   - `cmrId`, `ecmrUrl`: eCMR signé

4. **Incident** - Déclarations d'incidents
   - `incidentId`: Identifiant unique (INC-2024-XXXX)
   - `deliveryId`: Livraison concernée
   - `type`: damage | missing | broken_packaging | wrong_product | partial_refusal | total_refusal
   - `severity`: minor | major | critical
   - `affectedItems[]`: Articles concernés avec détails
   - `photos[]`: Photos de preuve
   - `status`: reported | acknowledged | investigating | resolved | closed | disputed
   - `billingBlocked`: Blocage automatique de la préfacturation
   - `acknowledgements[]`: Accusés de réception parties prenantes
   - `resolution`: Action, compensation, résolution

5. **RecipientChat** - Conversations
   - `chatId`: Identifiant unique (CHAT-2024-XXXXXX)
   - `participants[]`: Destinataire, transporteur, industriel, chauffeur
   - `deliveryId`, `incidentId`: Contexte optionnel
   - `messages[]`: Historique messages avec pièces jointes
   - `unreadCount`: Compteur par participant
   - `status`: active | archived | closed

### Routes API

#### Onboarding (`/onboarding`)
- `POST /invite` - Inviter un destinataire (industriel)
- `GET /validate/:token` - Valider le token d'invitation
- `POST /register` - Créer le compte destinataire
- `PUT /sites` - Configurer les sites de livraison
- `PUT /contacts` - Configurer les contacts
- `POST /complete` - Finaliser l'onboarding

#### Recipients (`/recipients`)
- `GET /me` - Profil connecté
- `PUT /me` - Mettre à jour profil
- `GET /me/sites` - Liste des sites
- `POST /me/sites` - Ajouter un site
- `PUT /me/sites/:siteId` - Modifier un site
- `POST /me/contacts` - Ajouter un contact
- `PUT /me/settings` - Paramètres
- `GET /me/stats` - Statistiques

#### Deliveries (`/deliveries`)
- `GET /` - Liste des livraisons (filtres: status, date, supplier, transporter, site, urgency)
- `GET /:id` - Détail avec ETA mis à jour
- `GET /:id/tracking` - Tracking temps réel (GPS, ETA, route)
- `GET /:id/documents` - Documents transport
- `GET /:id/timeline` - Historique événements
- `GET /today/:siteId` - Livraisons du jour par site
- `GET /upcoming` - Livraisons à venir (48h)
- `POST /:id/confirm-arrival` - Confirmer l'arrivée
- `POST /:id/start-unloading` - Démarrer déchargement
- `POST /:id/rate` - Noter la livraison

#### Signatures (`/signatures`)
- `POST /scan-qr` - Scanner QR code du CMR
- `POST /receive` - Signer réception complète
- `POST /receive-partial` - Signer réception partielle avec réserves
- `POST /refuse` - Refuser la livraison
- `GET /:deliveryId` - Signatures d'une livraison
- `POST /photos` - Ajouter photos de preuve
- `GET /:signatureId/ecmr` - Télécharger eCMR signé

#### Incidents (`/incidents`)
- `POST /` - Déclarer un incident
- `GET /` - Liste des incidents (filtres: status, severity, type, delivery, site)
- `GET /:id` - Détail incident
- `PUT /:id` - Mettre à jour incident
- `POST /:id/photos` - Ajouter photos
- `POST /:id/acknowledge` - Accuser réception
- `POST /:id/resolve` - Résoudre incident
- `POST /:id/close` - Fermer incident
- `GET /stats` - Statistiques incidents

#### Chat (`/chats`)
- `GET /` - Liste conversations
- `POST /` - Créer conversation
- `GET /:id` - Détail avec messages
- `POST /:id/messages` - Envoyer message
- `PUT /:id/read` - Marquer lu
- `PUT /:id/archive` - Archiver
- `PUT /:id/close` - Fermer
- `POST /:id/participants` - Ajouter participant
- `GET /unread/count` - Nombre de messages non lus

#### Notifications (`/notifications`)
- `GET /` - Liste notifications
- `GET /unread/count` - Nombre non lues
- `PUT /:id/read` - Marquer lue
- `PUT /read-all` - Tout marquer lu
- `DELETE /:id` - Supprimer
- `DELETE /clear-all` - Supprimer toutes les lues

### Services

1. **InvitationService** - Gestion invitations
   - Envoi email invitation avec token
   - Validation token
   - Email de rappel
   - Confirmation d'activation

2. **TrackingService** - Intégration Tracking IA
   - Récupération ETA temps réel
   - Position GPS véhicule
   - Calcul distance/temps restant
   - Détection arrivée imminente
   - Historique tracking

3. **SignatureService** - Validation signatures
   - Décodage QR code CMR
   - Signature eCMR via API eCMR
   - Validation qualité signature
   - Notifications post-signature
   - Alertes urgentes (refus/partiel)

4. **IncidentService** - Gestion incidents
   - Création automatique depuis refus
   - Notifications parties prenantes
   - Blocage/déblocage facturation via API Billing
   - Calcul statistiques incidents
   - Notifications de résolution

5. **NotificationService** - Push, email, SMS
   - Notifications ETA, arrivée, incidents
   - Email bienvenue, résumés quotidiens/hebdomadaires
   - Respect préférences destinataire
   - Intégration API Notifications

## Événements émis

L'API émet les événements suivants vers l'Event Bus:

- `destinataire.onboard.completed` - Onboarding terminé
- `destinataire.delivery.arriving` - Livraison en approche (ETA < 30 min)
- `destinataire.signature.completed` - Signature effectuée
- `destinataire.incident.reported` - Incident déclaré
- `destinataire.incident.resolved` - Incident résolu
- `destinataire.billing.blocked` - Facturation bloquée
- `destinataire.billing.unblocked` - Facturation débloquée

## Intégrations externes

### APIs RT Technologie
- **tracking-api** (3010): Récupération ETA et position GPS
- **ecmr-api** (3008): Signature électronique CMR
- **billing-api** (3014): Blocage préfacturation si incident
- **notifications-api** (3013): Envoi email, SMS, push
- **orders-api** (3007): Référence commandes

### Authentification
JWT avec middleware `authenticate` et `requireActiveRecipient`

## Fonctionnalités clés

### 1. Onboarding complet
- Invitation par email depuis industriel
- Token sécurisé 7 jours
- Configuration sites multi-adresses
- Gestion contacts avec droits de signature
- Validation complète avant activation

### 2. Tracking temps réel
- ETA prédite par IA avec niveau de confiance
- Position GPS en direct
- Notifications arrivée imminente (< 30 min)
- Calcul retards automatique
- Historique complet timeline

### 3. Signatures électroniques
- QR code scanning CMR
- Réception complète, partielle ou refus
- Photos de preuve obligatoires
- Intégration eCMR automatique
- Alertes urgentes transporteur/industriel

### 4. Gestion incidents
- Déclaration avec photos
- Types: damage, missing, wrong_product, refusal
- Sévérité: minor, major, critical
- Blocage automatique facturation
- Workflow complet jusqu'à résolution
- Notifications toutes parties prenantes

### 5. Communication
- Chat contextuel (livraison/incident)
- Messages temps réel
- Pièces jointes
- Compteur messages non lus
- Archivage conversations

## Sécurité

- Authentification JWT obligatoire (sauf onboarding)
- Validation `recipientId` sur toutes les routes
- Vérification statut `active` pour opérations sensibles
- Isolation des données par destinataire
- Validation entrées utilisateur
- Limitation taille uploads (10 MB)

## Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Coverage
npm run test:coverage
```

## Monitoring

Endpoints de santé:
- `GET /health` - État du service et MongoDB

Logs:
- Toutes les requêtes HTTP
- Erreurs avec stack trace (dev)
- Événements MongoDB

## Support

Pour toute question ou problème:
- Email: support@rt-technologie.com
- Documentation: https://docs.rt-technologie.com/api-recipient
