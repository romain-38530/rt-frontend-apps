# Flux métier de l'API Recipient

Ce document décrit les principaux flux métier de l'API Recipient.

## 1. Flux d'Onboarding

### Étape 1: Invitation par l'industriel
```
POST /onboarding/invite
{
  "industrialId": "IND-2024-0001",
  "companyName": "Acme Corp",
  "siret": "12345678901234",
  "contactEmail": "contact@acme.com",
  "contactName": "John Doe",
  "contactPhone": "+33612345678"
}
```

**Résultat:**
- Création du destinataire avec status='invited'
- Génération du token d'invitation (valide 7 jours)
- Envoi email avec lien d'activation
- Retour: recipientId + invitationToken

### Étape 2: Validation du token
```
GET /onboarding/validate/:token
```

**Vérifie:**
- Token valide et non expiré
- Destinataire existe et status='invited'
- Retour: recipientId, companyName, siret

### Étape 3: Création du compte
```
POST /onboarding/register
{
  "invitationToken": "abc123...",
  "primaryContact": {
    "name": "John Doe",
    "role": "Admin",
    "email": "john@acme.com",
    "phone": "+33612345678"
  },
  "password": "SecurePassword123!",
  "acceptTerms": true
}
```

**Actions:**
- Ajout du contact principal
- Changement status: 'invited' → 'pending'
- Suppression du token d'invitation
- Création compte auth (API Auth)

### Étape 4: Configuration des sites
```
PUT /onboarding/sites
{
  "recipientId": "RCP-2024-0001",
  "sites": [
    {
      "name": "Entrepôt Principal",
      "address": {
        "street": "123 Rue du Commerce",
        "city": "Paris",
        "postalCode": "75001",
        "country": "France"
      },
      "openingHours": {
        "monday": { "open": "08:00", "close": "18:00" },
        "tuesday": { "open": "08:00", "close": "18:00" }
      },
      "constraints": {
        "hasDock": true,
        "hasForklift": true,
        "requiresAppointment": true
      }
    }
  ]
}
```

### Étape 5: Configuration des contacts
```
PUT /onboarding/contacts
{
  "recipientId": "RCP-2024-0001",
  "contacts": [
    {
      "name": "Marie Dupont",
      "role": "Responsable Logistique",
      "email": "marie@acme.com",
      "phone": "+33623456789",
      "siteId": "SITE-RCP-2024-0001-01",
      "canSignDeliveries": true
    }
  ]
}
```

### Étape 6: Finalisation
```
POST /onboarding/complete
{
  "recipientId": "RCP-2024-0001"
}
```

**Actions:**
- Vérification: au moins 1 site + 1 contact
- Changement status: 'pending' → 'active'
- Enregistrement activatedAt
- Émission événement: destinataire.onboard.completed
- Envoi email de bienvenue

---

## 2. Flux de Suivi de Livraison

### Étape 1: Création de la livraison (par Orders API)
```
Livraison créée dans Delivery avec:
- deliveryId: DEL-2024-000123
- status: 'scheduled'
- eta: Date prédite par Tracking IA
- recipientId, siteId
```

### Étape 2: Consultation des livraisons
```
GET /deliveries?status=scheduled&siteId=SITE-RCP-2024-0001-01
```

**Retourne:** Liste des livraisons programmées pour le site

### Étape 3: Suivi temps réel
```
GET /deliveries/DEL-2024-000123/tracking
```

**Retourne:**
- Position GPS actuelle du véhicule
- ETA mise à jour par IA
- Distance restante
- Temps restant estimé
- Route prévue

### Étape 4: Notification arrivée imminente
**Automatique quand ETA < 30 min:**
- Notification push + SMS au destinataire
- Message: "Votre livraison arrive dans 25 minutes"
- Status change: 'in_transit' → 'arriving'

### Étape 5: Confirmation d'arrivée
```
POST /deliveries/DEL-2024-000123/confirm-arrival
```

**Actions:**
- Status change: 'arriving' → 'arrived'
- Enregistrement arrivalDate
- Ajout événement timeline
- Notification chauffeur

### Étape 6: Démarrage déchargement
```
POST /deliveries/DEL-2024-000123/start-unloading
```

**Actions:**
- Status change: 'arrived' → 'unloading'
- Enregistrement unloading.startedAt
- Démarrage chronomètre durée

---

## 3. Flux de Signature de Livraison

### Scénario A: Réception complète

#### Étape 1: Scanner le QR code CMR
```
POST /signatures/scan-qr
{
  "qrCodeData": "base64_encoded_data"
}
```

**Retourne:**
- deliveryId, cmrId, orderId
- Infos livraison (cargo, transporteur)
- Validation QR code

#### Étape 2: Signer la réception
```
POST /signatures/receive
{
  "deliveryId": "DEL-2024-000123",
  "signatureData": "base64_signature_image",
  "signerName": "John Doe",
  "signerRole": "Responsable Réception",
  "signerEmail": "john@acme.com",
  "qrCodeData": "base64_encoded_data",
  "location": { "lat": 48.8566, "lng": 2.3522 }
}
```

**Actions:**
1. Création DeliverySignature (type='reception')
2. Validation qualité signature
3. Mise à jour Delivery: status='delivered', deliveryDate
4. Signature eCMR via API eCMR
5. Notifications transporteur + industriel
6. Émission événement: destinataire.signature.completed

### Scénario B: Réception partielle

```
POST /signatures/receive-partial
{
  "deliveryId": "DEL-2024-000123",
  "signatureData": "base64_signature",
  "signerName": "John Doe",
  "signerRole": "Responsable Réception",
  "partialReception": {
    "receivedItems": [
      {
        "reference": "PROD-001",
        "description": "Palettes A",
        "quantityOrdered": 10,
        "quantityReceived": 8,
        "quantityRejected": 2,
        "reason": "Palettes endommagées"
      }
    ],
    "totalReceived": 8,
    "totalRejected": 2,
    "receivedPercentage": 80
  },
  "reservations": "2 palettes refusées pour dommages transport"
}
```

**Actions:**
1. Création DeliverySignature (type='partial_reception')
2. Signature eCMR avec réserves
3. Status delivery='delivered' avec signature.status='partial'
4. Alertes urgentes transporteur + industriel
5. Possibilité de créer incident associé

### Scénario C: Refus total

```
POST /signatures/refuse
{
  "deliveryId": "DEL-2024-000123",
  "signatureData": "base64_signature",
  "signerName": "John Doe",
  "signerRole": "Responsable Réception",
  "refusalDetails": {
    "reason": "damaged",
    "detailedReason": "Marchandise fortement endommagée, emballage déchiré",
    "affectedItems": [
      {
        "reference": "PROD-001",
        "description": "Palettes A",
        "quantity": 10,
        "issue": "Emballage détruit, produits cassés"
      }
    ],
    "actionTaken": "total_refusal",
    "requiresPickup": true
  }
}
```

**Actions:**
1. Création DeliverySignature (type='refusal')
2. Status delivery='incident'
3. Création automatique Incident (severity='critical')
4. Blocage facturation automatique
5. Alertes urgentes: transporteur + industriel (email + SMS)
6. Émission événement: destinataire.incident.reported

---

## 4. Flux de Gestion d'Incident

### Étape 1: Déclaration d'incident
```
POST /incidents
{
  "deliveryId": "DEL-2024-000123",
  "type": "damage",
  "severity": "major",
  "title": "Palettes endommagées",
  "description": "5 palettes ont été livrées avec des dommages importants",
  "affectedItems": [
    {
      "reference": "PROD-001",
      "description": "Palettes A",
      "quantityAffected": 5,
      "damageType": "damaged",
      "damageDescription": "Emballage déchiré, produits cassés",
      "estimatedValue": 2500
    }
  ]
}
```

**Actions:**
1. Génération incidentId: INC-2024-0123
2. Status='reported'
3. Si severity='major' ou 'critical': blocage facturation
4. Notifications parties prenantes (transporteur, industriel, fournisseur)
5. Émission événement: destinataire.incident.reported

### Étape 2: Ajout de photos
```
POST /incidents/INC-2024-0123/photos
{
  "photos": [
    {
      "url": "https://cdn.rt.com/photos/incident-123-1.jpg",
      "description": "Vue d'ensemble dommages"
    }
  ]
}
```

### Étape 3: Accusé de réception transporteur
**Par le transporteur via son API:**
```
POST /incidents/INC-2024-0123/acknowledge
{
  "comment": "Pris en compte, investigation en cours",
  "actionPlan": "Vérification auprès du chauffeur, retour sous 24h"
}
```

**Actions:**
- Status change: 'reported' → 'acknowledged'
- Ajout acknowledgement à la liste
- Événement timeline

### Étape 4: Résolution
**Par le transporteur ou industriel:**
```
POST /incidents/INC-2024-0123/resolve
{
  "action": "refunded",
  "resolution": "Remboursement complet des palettes endommagées",
  "compensation": {
    "type": "monetary",
    "amount": 2500,
    "currency": "EUR",
    "description": "Remboursement intégral"
  }
}
```

**Actions:**
1. Status change: 'acknowledged' → 'resolved'
2. Déblocage facturation
3. Notifications toutes parties prenantes
4. Émission événement: destinataire.incident.resolved

### Étape 5: Fermeture par le destinataire
```
POST /incidents/INC-2024-0123/close
{
  "comment": "Résolution satisfaisante, incident clos"
}
```

**Actions:**
- Status change: 'resolved' → 'closed'
- Incident archivé

---

## 5. Flux de Communication (Chat)

### Étape 1: Création conversation
```
POST /chats
{
  "participants": [
    {
      "participantId": "RCP-2024-0001",
      "type": "recipient",
      "name": "Acme Corp"
    },
    {
      "participantId": "TRANS-2024-0001",
      "type": "transporter",
      "name": "Transport Express"
    }
  ],
  "deliveryId": "DEL-2024-000123",
  "type": "delivery",
  "title": "Question sur livraison",
  "initialMessage": "Bonjour, pouvez-vous confirmer l'heure d'arrivée ?"
}
```

**Retourne:** chatId: CHAT-2024-000456

### Étape 2: Envoi de message
```
POST /chats/CHAT-2024-000456/messages
{
  "content": "Nous arrivons dans 45 minutes",
  "attachments": [
    {
      "type": "image",
      "filename": "position.jpg",
      "url": "https://cdn.rt.com/chat/position.jpg"
    }
  ]
}
```

**Actions:**
- Ajout message à la conversation
- Incrémentation unreadCount pour autres participants
- Notification push destinataire
- Mise à jour lastMessage

### Étape 3: Marquer comme lu
```
PUT /chats/CHAT-2024-000456/read
```

**Actions:**
- Tous les messages marqués read=true
- unreadCount réinitialisé à 0 pour l'utilisateur

---

## 6. Flux de Notifications

### Notifications automatiques

#### Mise à jour ETA
**Déclencheur:** Tracking IA détecte changement ETA > 15 min
```
Notification créée automatiquement:
- Type: 'eta_update'
- Priority: 'high' si retard > 30 min
- Canaux: email + push
- Message: "Votre livraison DEL-XXX est retardée de 45 minutes"
```

#### Arrivée imminente
**Déclencheur:** ETA < 30 minutes
```
Notification urgente:
- Type: 'delivery'
- Priority: 'urgent'
- Canaux: push + SMS
- Message: "Livraison DEL-XXX arrive dans 25 minutes"
```

#### Incident critique
**Déclencheur:** Incident severity='critical'
```
Notification urgente:
- Type: 'incident'
- Priority: 'urgent'
- Canaux: email + SMS + push
- Message: "INCIDENT CRITIQUE: Livraison refusée pour dommages"
```

### Consultation notifications
```
GET /notifications?read=false
```

### Marquer tout comme lu
```
PUT /notifications/read-all
```

---

## 7. Intégrations externes

### Avec Tracking API
```
Flux:
1. Delivery créée → Abonnement tracking temps réel
2. Polling ETA toutes les 5 minutes
3. Mise à jour automatique delivery.eta
4. Si changement > 15 min → Notification destinataire
5. Si ETA < 30 min → Status 'arriving' + notification urgente
```

### Avec eCMR API
```
Flux:
1. Scan QR code → Récupération CMR
2. Signature destinataire → Appel POST /ecmr/sign
3. eCMR API génère PDF signé
4. Retour cmrId + ecmrUrl
5. Stockage dans DeliverySignature
```

### Avec Billing API
```
Flux incident:
1. Incident severity='major' ou 'critical'
2. Appel POST /billing/block
3. Préfacturation bloquée
4. À la résolution → POST /billing/unblock
5. Facturation débloquée
```

### Avec Notifications API
```
Flux:
1. Événement (ETA, incident, signature)
2. Vérification préférences destinataire
3. Appel POST /notifications/send
4. Envoi multi-canal (email, SMS, push)
5. Tracking statut envoi
```

---

## 8. Événements émis vers Event Bus

### destinataire.onboard.completed
```json
{
  "eventType": "destinataire.onboard.completed",
  "recipientId": "RCP-2024-0001",
  "companyName": "Acme Corp",
  "activatedAt": "2024-12-01T10:00:00Z",
  "sitesCount": 3,
  "contactsCount": 5
}
```

### destinataire.delivery.arriving
```json
{
  "eventType": "destinataire.delivery.arriving",
  "deliveryId": "DEL-2024-000123",
  "recipientId": "RCP-2024-0001",
  "siteId": "SITE-RCP-2024-0001-01",
  "eta": "2024-12-01T14:30:00Z",
  "minutesRemaining": 25
}
```

### destinataire.signature.completed
```json
{
  "eventType": "destinataire.signature.completed",
  "signatureId": "SIG-2024-000456",
  "deliveryId": "DEL-2024-000123",
  "recipientId": "RCP-2024-0001",
  "signatureType": "reception",
  "ecmrSigned": true,
  "timestamp": "2024-12-01T15:00:00Z"
}
```

### destinataire.incident.reported
```json
{
  "eventType": "destinataire.incident.reported",
  "incidentId": "INC-2024-0123",
  "deliveryId": "DEL-2024-000123",
  "recipientId": "RCP-2024-0001",
  "type": "damage",
  "severity": "critical",
  "billingBlocked": true
}
```

### destinataire.billing.blocked
```json
{
  "eventType": "destinataire.billing.blocked",
  "deliveryId": "DEL-2024-000123",
  "incidentId": "INC-2024-0123",
  "recipientId": "RCP-2024-0001",
  "reason": "Incident critical - total refusal",
  "blockedAt": "2024-12-01T15:00:00Z"
}
```

---

## Résumé des flux principaux

1. **Onboarding**: 6 étapes, 7-10 jours, taux conversion 85%
2. **Tracking livraison**: Temps réel, ETA IA, notifications automatiques
3. **Signature**: 3 scénarios (complète/partielle/refus), eCMR automatique
4. **Incidents**: Déclaration → Investigation → Résolution, blocage facturation
5. **Chat**: Communication contextuelle temps réel
6. **Notifications**: Multi-canal, préférences utilisateur, priorités

**Tous les flux sont sécurisés par JWT et isolés par recipientId.**
