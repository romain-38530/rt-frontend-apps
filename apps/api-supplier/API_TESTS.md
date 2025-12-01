# API Supplier - Tests et Exemples

## Base URL
```
http://localhost:3017
```

## Health Check

```bash
curl http://localhost:3017/health
```

## 1. Onboarding

### 1.1 Inviter un fournisseur
```bash
curl -X POST http://localhost:3017/onboarding/invite \
  -H "Content-Type: application/json" \
  -d '{
    "industrialId": "IND-2024-0001",
    "companyName": "Test Supplier Co.",
    "siret": "12345678901234",
    "email": "contact@testsupplier.fr",
    "address": {
      "street": "1 rue du Test",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    }
  }'
```

### 1.2 Valider un token d'invitation
```bash
curl http://localhost:3017/onboarding/validate/test-token-123
```

### 1.3 Créer un compte
```bash
curl -X POST http://localhost:3017/onboarding/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-token-123",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### 1.4 Configurer les contacts
```bash
curl -X PUT http://localhost:3017/onboarding/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-token-123",
    "contacts": [
      {
        "name": "Jean Dupont",
        "role": "logistique",
        "email": "j.dupont@test.fr",
        "phone": "0123456789",
        "isPrimary": true
      },
      {
        "name": "Marie Martin",
        "role": "production",
        "email": "m.martin@test.fr",
        "phone": "0123456790",
        "isPrimary": false
      }
    ]
  }'
```

### 1.5 Finaliser l'onboarding
```bash
curl -X POST http://localhost:3017/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-token-123"
  }'
```

## 2. Suppliers

### 2.1 Profil du fournisseur
```bash
curl http://localhost:3017/suppliers/me \
  -H "x-supplier-id: SUP-2024-0001"
```

### 2.2 Mettre à jour le profil
```bash
curl -X PUT http://localhost:3017/suppliers/me \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Updated Company Name",
    "address": {
      "street": "2 rue Updated",
      "city": "Lyon",
      "postalCode": "69001",
      "country": "France"
    }
  }'
```

### 2.3 Liste des industriels liés
```bash
curl http://localhost:3017/suppliers/me/industrials \
  -H "x-supplier-id: SUP-2024-0001"
```

### 2.4 Paramètres du fournisseur
```bash
curl -X PUT http://localhost:3017/suppliers/me/settings \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": true,
    "language": "fr"
  }'
```

### 2.5 Liste des fournisseurs (pour industriels)
```bash
curl "http://localhost:3017/suppliers?industrialId=IND-2024-0001&status=active&page=1&limit=20"
```

## 3. Orders

### 3.1 Liste des commandes
```bash
curl "http://localhost:3017/orders?status=to_prepare&page=1&limit=20" \
  -H "x-supplier-id: SUP-2024-0001"
```

### 3.2 Détail d'une commande
```bash
curl http://localhost:3017/orders/ORD-2024-0001 \
  -H "x-supplier-id: SUP-2024-0001"
```

### 3.3 Mettre à jour le statut
```bash
curl -X PUT http://localhost:3017/orders/ORD-2024-0001/status \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ready",
    "notes": "Marchandise prête pour chargement"
  }'
```

### 3.4 Upload un document
```bash
curl -X POST http://localhost:3017/orders/ORD-2024-0001/documents \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "delivery_note",
    "filename": "BL-ORD-2024-0001.pdf",
    "url": "https://storage.example.com/documents/bl-001.pdf"
  }'
```

### 3.5 Liste des documents
```bash
curl http://localhost:3017/orders/ORD-2024-0001/documents \
  -H "x-supplier-id: SUP-2024-0001"
```

### 3.6 Timeline de la commande
```bash
curl http://localhost:3017/orders/ORD-2024-0001/timeline \
  -H "x-supplier-id: SUP-2024-0001"
```

### 3.7 Créer une commande (pour tests)
```bash
curl -X POST http://localhost:3017/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2024-TEST",
    "supplierId": "SUP-2024-0001",
    "industrialId": "IND-2024-0001",
    "goods": {
      "description": "Test goods",
      "weight": 1000,
      "pallets": 2,
      "volume": 5.0,
      "specialInstructions": "Handle with care"
    },
    "transportInfo": {
      "carrierId": "TRANS-001",
      "vehicleType": "Van",
      "driverName": "John Doe",
      "driverPhone": "0612345678"
    }
  }'
```

## 4. Loading Slots

### 4.1 Liste des créneaux
```bash
curl "http://localhost:3017/slots?status=proposed&page=1&limit=20" \
  -H "x-supplier-id: SUP-2024-0001"
```

### 4.2 Créneau pour une commande
```bash
curl http://localhost:3017/slots/ORD-2024-0001 \
  -H "x-supplier-id: SUP-2024-0001"
```

### 4.3 Accepter un créneau
```bash
curl -X POST http://localhost:3017/slots/SLOT-202412-00001/accept \
  -H "x-supplier-id: SUP-2024-0001"
```

### 4.4 Proposer une modification
```bash
curl -X POST http://localhost:3017/slots/SLOT-202412-00001/modify \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "alternativeSlot": {
      "date": "2024-12-15",
      "startTime": "10:00",
      "endTime": "12:00",
      "dockId": "DOCK-B1"
    },
    "reason": "Retard de production, besoin de 2h supplémentaires"
  }'
```

### 4.5 Refuser un créneau
```bash
curl -X POST http://localhost:3017/slots/SLOT-202412-00001/reject \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Problème de production, impossible de livrer cette date"
  }'
```

### 4.6 Disponibilités
```bash
curl "http://localhost:3017/slots/availability?date=2024-12-15" \
  -H "x-supplier-id: SUP-2024-0001"
```

### 4.7 Proposer un nouveau créneau
```bash
curl -X POST http://localhost:3017/slots/propose \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2024-0001",
    "date": "2024-12-16",
    "startTime": "08:00",
    "endTime": "10:00",
    "dockId": "DOCK-A1"
  }'
```

### 4.8 Synchroniser les ETA
```bash
curl -X POST http://localhost:3017/slots/sync-eta
```

## 5. Signatures

### 5.1 Signer un bon de chargement
```bash
curl -X POST http://localhost:3017/signatures/loading \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2024-0001",
    "method": "smartphone",
    "signatureData": "data:image/png;base64,iVBORw0KGgo...",
    "signerName": "Jean Dupont",
    "signerRole": "Chef logistique",
    "location": {
      "lat": 48.8566,
      "lng": 2.3522
    },
    "deviceInfo": "iPhone 13, iOS 16.0"
  }'
```

### 5.2 Générer un QR code
```bash
curl -X POST http://localhost:3017/signatures/qrcode/generate \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2024-0001",
    "type": "loading"
  }'
```

### 5.3 Scanner et signer via QR code
```bash
curl -X POST http://localhost:3017/signatures/qrcode/scan \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "signatureData": "data:image/png;base64,iVBORw0KGgo...",
    "signerName": "Marie Martin",
    "signerRole": "Responsable production",
    "location": {
      "lat": 48.8566,
      "lng": 2.3522
    }
  }'
```

### 5.4 Signatures pour une commande
```bash
curl http://localhost:3017/signatures/ORD-2024-0001 \
  -H "x-supplier-id: SUP-2024-0001"
```

### 5.5 Vérifier une signature
```bash
curl -X POST http://localhost:3017/signatures/verify \
  -H "Content-Type: application/json" \
  -d '{
    "signatureId": "SIG-20241201-00001"
  }'
```

### 5.6 Statut des signatures requises
```bash
curl http://localhost:3017/signatures/ORD-2024-0001/status \
  -H "x-supplier-id: SUP-2024-0001"
```

## 6. Chat

### 6.1 Liste des conversations
```bash
curl "http://localhost:3017/chats?status=active&page=1&limit=20" \
  -H "x-supplier-id: SUP-2024-0001"
```

### 6.2 Créer une conversation
```bash
curl -X POST http://localhost:3017/chats \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {
        "id": "IND-2024-0001",
        "type": "industrial",
        "name": "Industriel Client SA"
      },
      {
        "id": "TRANS-001",
        "type": "transporter",
        "name": "Transport Express"
      }
    ],
    "orderId": "ORD-2024-0001",
    "initialMessage": "Bonjour, je confirme la disponibilité pour le chargement."
  }'
```

### 6.3 Détail d'une conversation
```bash
curl "http://localhost:3017/chats/CHAT-202412-00001?limit=50&offset=0" \
  -H "x-supplier-id: SUP-2024-0001"
```

### 6.4 Envoyer un message
```bash
curl -X POST http://localhost:3017/chats/CHAT-202412-00001/messages \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Le chargement sera prêt à 9h demain matin.",
    "attachments": [
      {
        "filename": "photo-preparation.jpg",
        "url": "https://storage.example.com/photos/prep-001.jpg",
        "type": "image/jpeg",
        "size": 245678
      }
    ]
  }'
```

### 6.5 Envoyer un message template
```bash
curl -X POST http://localhost:3017/chats/CHAT-202412-00001/template \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "templateType": "loading_ready",
    "additionalInfo": "Disponible à partir de 8h00"
  }'
```

### 6.6 Marquer comme lu
```bash
curl -X PUT http://localhost:3017/chats/CHAT-202412-00001/read \
  -H "x-supplier-id: SUP-2024-0001"
```

### 6.7 Liste des templates
```bash
curl http://localhost:3017/chats/templates
```

## 7. Notifications

### 7.1 Liste des notifications
```bash
curl "http://localhost:3017/notifications?read=false&page=1&limit=20" \
  -H "x-supplier-id: SUP-2024-0001"
```

### 7.2 Marquer comme lue
```bash
curl -X PUT http://localhost:3017/notifications/NOTIF-001/read \
  -H "x-supplier-id: SUP-2024-0001"
```

### 7.3 Tout marquer comme lu
```bash
curl -X PUT http://localhost:3017/notifications/read-all \
  -H "x-supplier-id: SUP-2024-0001"
```

### 7.4 Paramètres de notification
```bash
curl http://localhost:3017/notifications/settings \
  -H "x-supplier-id: SUP-2024-0001"
```

### 7.5 Mettre à jour les paramètres
```bash
curl -X POST http://localhost:3017/notifications/settings \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationsEnabled": true,
    "channels": {
      "email": true,
      "push": true,
      "sms": false
    },
    "preferences": {
      "newOrder": { "email": true, "push": true, "sms": false },
      "slotProposed": { "email": true, "push": true, "sms": true },
      "loadingReminder": { "email": true, "push": true, "sms": true }
    }
  }'
```

### 7.6 Notification de test
```bash
curl -X POST http://localhost:3017/notifications/test \
  -H "x-supplier-id: SUP-2024-0001"
```

## Collection Postman

Importer cette collection dans Postman pour tester facilement tous les endpoints.

Variables d'environnement à définir:
- `BASE_URL`: http://localhost:3017
- `SUPPLIER_ID`: SUP-2024-0001
- `ORDER_ID`: ORD-2024-0001
- `SLOT_ID`: SLOT-202412-00001
- `CHAT_ID`: CHAT-202412-00001
