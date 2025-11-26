# Guide d'intégration WebSocket et Notifications

## Vue d'ensemble

Le système de notifications temps réel est maintenant complètement implémenté avec :
- ✅ Client WebSocket avec reconnexion automatique
- ✅ Hooks React personnalisés (`useWebSocket`, `useNotifications`)
- ✅ Composants UI (NotificationBell, NotificationPanel)
- ✅ Provider WebSocket pour l'initialisation globale
- ✅ Types TypeScript complets

## Architecture

```
packages/
├── utils/
│   ├── lib/
│   │   ├── websocket-client.ts         # Client WebSocket avec Socket.io
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts         # Hook pour connexion WebSocket
│   │   │   └── useNotifications.ts     # Hook pour gérer les notifications
│   │   └── providers/
│   │       └── WebSocketProvider.tsx   # Provider global
│   └── ...
└── ui-components/
    └── src/
        └── Notifications/
            ├── NotificationBell.tsx    # Cloche simple
            ├── NotificationPanel.tsx   # Panel complet avec dropdown
            └── index.ts
```

## Étape 1 : Configurer les variables d'environnement

Ajoutez ces variables dans les fichiers `.env.local` de chaque portail :

```bash
# URL du serveur WebSocket
NEXT_PUBLIC_WS_URL=http://localhost:3010

# URL de l'API Notifications
NEXT_PUBLIC_NOTIFICATIONS_API_URL=http://localhost:3004/api/v1
```

## Étape 2 : Intégrer le WebSocketProvider dans _app.tsx

Modifiez le fichier `pages/_app.tsx` de chaque portail :

```tsx
import type { AppProps } from 'next/app';
import { WebSocketProvider } from '@rt/utils/lib/providers/WebSocketProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WebSocketProvider
      wsUrl={process.env.NEXT_PUBLIC_WS_URL}
      autoConnect={true}
    >
      <Component {...pageProps} />
    </WebSocketProvider>
  );
}
```

## Étape 3 : Utiliser le NotificationPanel dans un composant

### Option A : Intégration dans un Header personnalisé

```tsx
import { NotificationPanel } from '@rt/ui-components';
import { useNotifications } from '@rt/utils/lib/hooks/useNotifications';

export default function MyPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications({
    autoFetch: true,        // Charger automatiquement au montage
    enableWebSocket: true,  // Activer les notifications temps réel
  });

  return (
    <div>
      {/* Header avec notifications */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
        <h1>Mon Portail</h1>

        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onRefresh={fetchNotifications}
        />
      </header>

      {/* Contenu de la page */}
      <main>
        {/* ... */}
      </main>
    </div>
  );
}
```

### Option B : Utilisation du hook useWebSocket directement

Si vous voulez écouter des événements WebSocket spécifiques :

```tsx
import { useWebSocket } from '@rt/utils/lib/hooks/useWebSocket';
import { useEffect } from 'react';

export default function OrdersPage() {
  const { isConnected, subscribe, send } = useWebSocket({
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: (reason) => console.log('WebSocket disconnected:', reason),
    onError: (error) => console.error('WebSocket error:', error),
  });

  useEffect(() => {
    // S'abonner à des événements spécifiques
    const unsubscribeOrderCreated = subscribe('order.created', (data) => {
      console.log('Nouvelle commande créée:', data.orderId);
      // Rafraîchir la liste des commandes, afficher une notification, etc.
    });

    const unsubscribeCarrierAccepted = subscribe('carrier.accepted', (data) => {
      console.log('Transporteur accepté pour:', data.orderId);
    });

    const unsubscribeTrackingUpdate = subscribe('tracking.location.updated', (data) => {
      console.log('Position mise à jour:', data.location);
    });

    // Cleanup
    return () => {
      unsubscribeOrderCreated();
      unsubscribeCarrierAccepted();
      unsubscribeTrackingUpdate();
    };
  }, [subscribe]);

  return (
    <div>
      <div>Status WebSocket: {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}</div>
      {/* Contenu */}
    </div>
  );
}
```

## Étape 4 : Événements WebSocket disponibles

Le système écoute automatiquement 48 événements différents :

### Événements de commandes
- `order.created` - Nouvelle commande créée
- `order.lane.detected` - Lane détecté pour une commande
- `dispatch.chain.generated` - Chaîne de dispatch générée
- `order.sent.to.carrier` - Commande envoyée au transporteur
- `carrier.accepted` - Transporteur a accepté
- `carrier.refused` - Transporteur a refusé
- `carrier.timeout` - Timeout du transporteur

### Événements de tracking
- `tracking.started` - Tracking démarré
- `tracking.location.updated` - Position mise à jour
- `order.arrived.pickup` - Arrivé au point de collecte
- `order.loaded` - Marchandise chargée
- `order.arrived.delivery` - Arrivé au point de livraison
- `order.delivered` - Commande livrée

### Événements de documents
- `documents.uploaded` - Documents uploadés
- `ocr.completed` - OCR terminé

### Événements de RDV
- `rdv.requested` - RDV demandé
- `rdv.proposed` - RDV proposé
- `rdv.confirmed` - RDV confirmé
- `rdv.cancelled` - RDV annulé

### Autres événements
- `carrier.scored` - Scoring transporteur mis à jour
- `order.escalated.to.affretia` - Escalade vers Affret.IA
- `order.closed` - Commande clôturée
- `notification` - Notification générique
- `error` - Erreur système

## Étape 5 : Personnalisation des notifications

Le hook `useNotifications` convertit automatiquement certains événements en notifications :

```tsx
// Dans useNotifications.ts, les événements suivants créent des notifications :
- order.created → "Nouvelle commande"
- carrier.accepted → "Transporteur accepté"
- carrier.refused → "Transporteur refusé"
- order.delivered → "Commande livrée"
```

Pour ajouter d'autres types de notifications, modifiez le hook dans `packages/utils/lib/hooks/useNotifications.ts`.

## Étape 6 : Test local

1. **Démarrer le serveur WebSocket backend** (port 3010) :
```bash
cd rt-backend-services/services/websocket-api
node index.js
```

2. **Démarrer le serveur Notifications** (port 3004) :
```bash
cd rt-backend-services/services/notifications-api-v2
node index.js
```

3. **Démarrer votre app frontend** :
```bash
cd rt-frontend-apps
pnpm dev
```

4. **Ouvrir la console** et observer les logs :
```
[WebSocket] Connected
[WebSocketProvider] Connected
```

5. **Tester en créant une commande** via l'interface et observer les notifications en temps réel.

## Exemple d'intégration complète

Voici un exemple complet d'intégration dans le dashboard principal :

```tsx
// apps/web-industry/pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NotificationPanel } from '@rt/ui-components';
import { useNotifications } from '@rt/utils/lib/hooks/useNotifications';
import { useWebSocket } from '@rt/utils/lib/hooks/useWebSocket';
import { isAuthenticated } from '../lib/auth';

export default function DashboardPage() {
  const router = useRouter();

  const { isConnected, status } = useWebSocket();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications({
    autoFetch: true,
    enableWebSocket: true,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header
        style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>
          Tableau de bord Industry
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Indicateur de connexion WebSocket */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: isConnected ? '#10b981' : '#6b7280',
            }}
          >
            <span style={{ fontSize: '8px' }}>
              {isConnected ? '🟢' : '🔴'}
            </span>
            {status}
          </div>

          {/* Panneau de notifications */}
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
            onRefresh={fetchNotifications}
          />

          <button
            onClick={() => router.push('/profile')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Profil
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main style={{ padding: '40px' }}>
        <h2>Bienvenue sur votre tableau de bord</h2>

        {/* Statistiques, graphiques, etc. */}
      </main>
    </div>
  );
}
```

## Dépannage

### WebSocket ne se connecte pas
1. Vérifiez que le serveur WebSocket est bien démarré sur le port 3010
2. Vérifiez la variable `NEXT_PUBLIC_WS_URL` dans `.env.local`
3. Ouvrez la console et regardez les erreurs

### Notifications ne s'affichent pas
1. Vérifiez que `enableWebSocket: true` est passé au hook `useNotifications`
2. Vérifiez que le WebSocketProvider enveloppe votre application dans `_app.tsx`
3. Vérifiez que l'API Notifications est démarrée sur le port 3004

### Reconnexion ne fonctionne pas
Le client WebSocket a une reconnexion automatique avec 5 tentatives. Si cela ne fonctionne pas :
1. Vérifiez les logs dans la console : `[WebSocket] Reconnected after X attempts`
2. Augmentez `reconnectionAttempts` dans la configuration du client

## Prochaines étapes

- [ ] Ajouter des sons pour les notifications importantes
- [ ] Implémenter les notifications push (Service Worker)
- [ ] Ajouter la persistance des notifications dans localStorage
- [ ] Créer des préférences de notifications par utilisateur
- [ ] Ajouter des filtres de notifications par type

## Support

Pour toute question ou problème, consultez :
- Documentation Socket.io : https://socket.io/docs/v4/
- Documentation Next.js : https://nextjs.org/docs
