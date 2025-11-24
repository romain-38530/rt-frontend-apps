# e-CMR Workflow - Note Importante

**Date**: 2025-11-24
**Service**: subscriptions-contracts v2.2.3

---

## ⚠️ Clarification Importante

### Création Automatique de l'e-CMR

L'e-CMR **n'est PAS créé manuellement** par l'utilisateur via un formulaire.

**Le système fonctionne ainsi** :

```
1. Industriel crée une Commande de Transport (Transport Order)
   ↓
2. Commande assignée à un Transporteur
   ↓
3. Transporteur arrive pour charger la marchandise
   ↓
4. 🎯 AU MOMENT DU CHARGEMENT → e-CMR créé automatiquement
   ↓
5. e-CMR Status: DRAFT
   ↓
6. Signatures successives (expéditeur, transporteur, destinataire)
   ↓
7. e-CMR Status: DELIVERED → ARCHIVED
```

---

## 📦 Flow Technique Détaillé

### 1. Création de la Commande Transport

**Qui** : Industriel (Industry account)
**Où** : Portal web-industry
**API** : Service commandes (à implémenter)

```typescript
// L'industriel crée une commande
POST /api/orders
{
  sender: { ... },        // Expéditeur
  recipient: { ... },     // Destinataire
  goods: [ ... ],         // Marchandises
  pickupDate: "...",
  deliveryDate: "..."
}

Response:
{
  orderId: "order-12345",
  status: "PENDING_ASSIGNMENT"
}
```

### 2. Assignment au Transporteur

**Qui** : Système ou Industriel
**Status** : `PENDING_ASSIGNMENT` → `ASSIGNED`

```typescript
// Assigner à un transporteur
POST /api/orders/order-12345/assign
{
  carrierId: "carrier-789",
  vehiclePlate: "AB-123-CD",
  driverName: "Pierre Durand"
}

Response:
{
  orderId: "order-12345",
  status: "ASSIGNED",
  carrier: { ... }
}
```

### 3. Arrivée pour Chargement

**Qui** : Transporteur
**Où** : Portal web-transporter ou app mobile
**Action** : Check-in sur site

```typescript
// Transporteur confirme son arrivée
POST /api/orders/order-12345/checkin
{
  location: { lat: 48.8566, lon: 2.3522 },
  timestamp: "2025-11-24T08:00:00Z"
}

Response:
{
  orderId: "order-12345",
  status: "LOADING_IN_PROGRESS"
}
```

### 4. 🎯 Création Automatique e-CMR

**Trigger** : Status change → `LOADING_IN_PROGRESS`
**Système** : Backend crée automatiquement l'e-CMR

```typescript
// Backend automatique (webhook ou event handler)
async function handleLoadingStarted(orderId) {
  // Récupérer les données de la commande
  const order = await getOrder(orderId);

  // Créer automatiquement l'e-CMR
  const ecmr = await createECMR({
    transportOrderId: orderId,
    sender: order.sender,
    consignee: order.recipient,
    carrier: order.carrier,
    goods: order.goods,
    pickupDate: order.pickupDate,
    deliveryDate: order.deliveryDate
  });

  // Lier l'e-CMR à la commande
  await linkECMRToOrder(orderId, ecmr.cmrNumber);

  return ecmr;
}

// e-CMR créé automatiquement
{
  _id: "...",
  cmrNumber: "ECMR-1764020548229-3609",
  transportOrderId: "order-12345",
  status: "DRAFT",
  sender: { ... },
  consignee: { ... },
  carrier: { ... },
  goods: [ ... ]
}
```

### 5. Workflow de Signatures

Une fois l'e-CMR créé, le workflow de signatures commence :

```typescript
// 1. Expéditeur signe (après chargement)
POST /api/ecmr/ECMR-xxx/sign/sender
{
  signatureData: "base64...",
  signedBy: "Jean Dupont",
  timestamp: "2025-11-24T09:00:00Z"
}
→ senderSignature: { signed: true }

// 2. Transporteur signe l'enlèvement
POST /api/ecmr/ECMR-xxx/sign/carrierPickup
{
  signatureData: "base64...",
  signedBy: "Pierre Durand",
  timestamp: "2025-11-24T09:05:00Z"
}
→ Status: IN_TRANSIT

// 3. Transport GPS tracking (automatique)
POST /api/ecmr/ECMR-xxx/tracking
{
  location: { lat: 48.8566, lon: 2.3522 },
  timestamp: "2025-11-24T12:00:00Z"
}

// 4. Transporteur signe la livraison
POST /api/ecmr/ECMR-xxx/sign/carrierDelivery
{
  signatureData: "base64...",
  signedBy: "Pierre Durand",
  timestamp: "2025-11-24T15:00:00Z"
}

// 5. Destinataire signe la réception
POST /api/ecmr/ECMR-xxx/sign/consignee
{
  signatureData: "base64...",
  signedBy: "Marie Martin",
  timestamp: "2025-11-24T15:10:00Z"
}
→ Status: DELIVERED

// 6. Archivage automatique (après 24h)
→ Status: ARCHIVED
```

---

## 🔗 Liens avec les Autres Services

### Service Commandes (à implémenter)

```
service: orders-management-eb (hypothétique)
URL: https://[cloudfront-id].cloudfront.net

Collections MongoDB:
- orders (commandes de transport)
- shipments (expéditions)
- tracking (suivi GPS)
```

### Service e-CMR (existant)

```
service: subscriptions-contracts v2.2.3
URL: https://dgze8l03lwl5h.cloudfront.net

Collections MongoDB:
- ecmr (lettres de voiture électroniques)
```

### Relation

```
orders.orderId → ecmr.transportOrderId (one-to-one)

Une commande = Un e-CMR
```

---

## 🎨 Interfaces Utilisateur

### Portal Industriel (web-industry)

**Écran 1** : Créer une commande
- Formulaire de création de commande
- Sélection expéditeur/destinataire
- Liste des marchandises
- Dates enlèvement/livraison

**Écran 2** : Suivi des commandes
- Liste des commandes (status: PENDING_ASSIGNMENT, ASSIGNED, IN_TRANSIT, DELIVERED)
- Clic sur une commande → Détails
- Si `status: DELIVERED` → Voir l'e-CMR associé

### Portal Transporteur (web-transporter)

**Écran 1** : Missions disponibles
- Liste des commandes assignées
- Bouton "Commencer le chargement"

**Écran 2** : Chargement en cours
- Informations sur la commande
- **e-CMR créé automatiquement** ✅
- Pad de signature expéditeur
- Pad de signature transporteur (enlèvement)

**Écran 3** : Transport en cours
- e-CMR affiché
- Tracking GPS automatique
- Navigation vers destination

**Écran 4** : Livraison
- Détails livraison
- Pad de signature transporteur (livraison)
- Pad de signature destinataire
- → e-CMR Status: DELIVERED

### Portal Destinataire (web-recipient)

**Écran** : Livraisons attendues
- Liste des livraisons
- Notification d'arrivée
- Signer la réception (pad de signature)

---

## 🔧 Implémentation Frontend Recommandée

### 1. Portal Industriel

```typescript
// pages/orders/create.tsx
// Formulaire de création de commande (PAS d'e-CMR ici!)

function CreateOrderPage() {
  const handleSubmit = async (orderData) => {
    const order = await createOrder(orderData);
    // e-CMR sera créé plus tard automatiquement
    router.push(`/orders/${order.orderId}`);
  };
}

// pages/orders/[orderId].tsx
// Détails d'une commande

function OrderDetailsPage({ orderId }) {
  const order = useOrder(orderId);

  // Si status: DELIVERED, montrer le lien vers l'e-CMR
  if (order.status === 'DELIVERED' && order.ecmrNumber) {
    return (
      <div>
        <h2>Commande livrée</h2>
        <Link href={`/ecmr/${order.ecmrNumber}`}>
          Voir l'e-CMR {order.ecmrNumber}
        </Link>
      </div>
    );
  }
}
```

### 2. Portal Transporteur

```typescript
// pages/loading/[orderId].tsx
// Écran de chargement

function LoadingPage({ orderId }) {
  const [ecmr, setEcmr] = useState(null);

  const handleStartLoading = async () => {
    // Confirmer arrivée pour chargement
    await checkInForLoading(orderId);

    // Backend crée automatiquement l'e-CMR
    // Récupérer l'e-CMR créé
    const createdEcmr = await getECMRByOrder(orderId);
    setEcmr(createdEcmr);
  };

  const handleSignSender = async (signature) => {
    await signECMR(ecmr._id, 'sender', signature);
  };

  const handleSignCarrierPickup = async (signature) => {
    await signECMR(ecmr._id, 'carrierPickup', signature);
    router.push(`/transport/${orderId}`); // Commencer le transport
  };

  return (
    <div>
      <h2>Chargement en cours</h2>

      {!ecmr && (
        <button onClick={handleStartLoading}>
          Commencer le chargement
        </button>
      )}

      {ecmr && (
        <>
          <ECMRViewer ecmr={ecmr} />

          <SignaturePad
            label="Signature expéditeur"
            onSign={handleSignSender}
          />

          <SignaturePad
            label="Signature transporteur (enlèvement)"
            onSign={handleSignCarrierPickup}
          />
        </>
      )}
    </div>
  );
}
```

---

## 📋 Points Clés à Retenir

### ✅ DO

- ✅ Créer l'e-CMR **automatiquement** lors du chargement
- ✅ Lier l'e-CMR à la commande transport (`transportOrderId`)
- ✅ Permettre au transporteur de signer immédiatement après création
- ✅ Afficher l'e-CMR dans les portails (industry, transporter, recipient)
- ✅ Garder un lien bidirectionnel : Order ↔ e-CMR

### ❌ DON'T

- ❌ NE PAS créer un formulaire manuel de création d'e-CMR
- ❌ NE PAS permettre à l'utilisateur de créer un e-CMR sans commande
- ❌ NE PAS dupliquer les données (ordre et e-CMR sont liés)
- ❌ NE PAS oublier de valider avant signatures

---

## 🚀 Prochaines Étapes

### 1. Service Orders (à créer)

Un nouveau service backend pour gérer les commandes de transport :
- Création de commandes
- Assignment transporteurs
- Tracking statuts
- **Trigger création e-CMR**

### 2. Intégration Orders ↔ e-CMR

**Event-driven architecture** :

```javascript
// Dans le service Orders
eventEmitter.on('order.loading_started', async (orderId) => {
  // Appeler le service e-CMR pour créer automatiquement
  const order = await getOrder(orderId);

  const ecmr = await fetch('https://dgze8l03lwl5h.cloudfront.net/api/ecmr', {
    method: 'POST',
    body: JSON.stringify({
      transportOrderId: orderId,
      sender: order.sender,
      consignee: order.recipient,
      carrier: order.carrier,
      goods: order.goods,
      pickupDate: order.pickupDate,
      deliveryDate: order.deliveryDate
    })
  });

  // Lier l'e-CMR à la commande
  await updateOrder(orderId, {
    ecmrId: ecmr._id,
    ecmrNumber: ecmr.cmrNumber
  });
});
```

### 3. Frontend

- Portal Industry : Écrans de gestion des commandes
- Portal Transporter : Écran de chargement avec signatures
- Portal Recipient : Écran de réception avec signature

---

## 💡 Résumé Simple

```
🏭 Industriel crée commande
    ↓
🚚 Transporteur assigné
    ↓
📦 Transporteur arrive pour charger
    ↓
🎯 e-CMR créé AUTOMATIQUEMENT par le système
    ↓
✍️ Signatures (expéditeur → transporteur → destinataire)
    ↓
✅ Livraison complète + e-CMR archivé
```

**L'e-CMR est un sous-produit automatique de la commande de transport, pas un document créé manuellement.**

---

**Date** : 2025-11-24
**Version e-CMR** : v2.2.3
**Status** : ✅ Clarification Validée
