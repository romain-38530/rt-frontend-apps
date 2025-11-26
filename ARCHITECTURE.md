# 🏗️ ARCHITECTURE FRONTEND SYMPHONI.A

**Version:** 1.0.0
**Dernière mise à jour:** 26 Novembre 2025

---

## 📐 Vue d'Ensemble

SYMPHONI.A est un système TMS (Transport Management System) multi-tenant avec :

- **6 portails utilisateurs** (Industry, Transporter, Logistician, Recipient, Supplier, Forwarder)
- **Architecture monorepo** (pnpm + Turbo)
- **Next.js 14.2.5** avec App Router et Pages Router
- **Communication temps réel** (WebSocket)
- **TypeScript strict**

---

## 🎯 Stack Technologique

### Frontend
- **Framework:** Next.js 14.2.5
- **UI:** React 18.2.0
- **Styling:** Tailwind CSS 3.4.1
- **State Management:** React Hooks + Context
- **Forms:** React Hook Form (à installer si nécessaire)
- **Tables:** TanStack Table 8.21.3
- **Charts:** Recharts 3.4.1
- **Maps:** Leaflet 1.9.4 + React Leaflet 5.0.0
- **Calendar:** FullCalendar 6.1.19
- **Notifications:** React Hot Toast 2.6.0
- **WebSocket:** Socket.io-client 4.8.1

### Backend (Existant)
- **APIs:** Node.js + Express
- **Base de données:** MongoDB
- **Authentification:** JWT
- **Paiements:** Stripe

### Infrastructure
- **Monorepo:** pnpm workspaces + Turbo
- **Déploiement:** AWS Amplify
- **CI/CD:** GitHub Actions (à configurer)

---

## 📁 Structure du Projet

```
rt-frontend-apps/
│
├── apps/                                    # Applications Next.js
│   ├── web-industry/                       # Portail Industriels
│   ├── web-transporter/                    # Portail Transporteurs
│   ├── web-logistician/                    # Portail Logisticiens
│   ├── web-recipient/                      # Portail Destinataires
│   ├── web-supplier/                       # Portail Fournisseurs
│   ├── web-forwarder/                      # Portail Commissionnaires
│   ├── backoffice-admin/                   # Backoffice Admin
│   ├── marketing-site/                     # Site Marketing
│   └── api-*/                              # Microservices API
│
├── packages/                                # Packages partagés
│   ├── utils/                              # Utilitaires partagés
│   │   └── lib/
│   │       ├── api-client.ts              # ✅ Client HTTP
│   │       ├── websocket-client.ts        # ✅ Client WebSocket
│   │       ├── hooks/                     # ✅ Hooks React
│   │       │   ├── useWebSocket.ts
│   │       │   └── useNotifications.ts
│   │       └── services/                  # Services API
│   │           └── orders-service.ts      # ✅ Service commandes
│   │
│   ├── ui-components/                      # Composants UI réutilisables
│   │   └── src/
│   │       ├── Notifications/             # ✅ Notifications
│   │       ├── Orders/                    # Composants commandes
│   │       ├── Tracking/                  # Composants tracking
│   │       └── ...
│   │
│   └── contracts/                          # Types et interfaces
│       └── src/
│           └── types/
│               ├── orders.ts              # ✅ Types commandes
│               ├── tracking.ts
│               ├── documents.ts
│               └── ...
│
├── turbo.json                              # Configuration Turbo
├── package.json                            # Workspace root
├── pnpm-workspace.yaml                     # Configuration pnpm
│
├── ROADMAP_DEVELOPPEMENT_FRONTEND.md       # Roadmap détaillée
└── IMPLEMENTATION_REPORT.md                # ✅ Rapport d'implémentation
```

---

## 🔄 Flux de Données

### 1. Architecture en Couches

```
┌─────────────────────────────────────────────┐
│          PAGES (Next.js)                    │
│  - Gestion du routing                       │
│  - SSR / SSG si nécessaire                  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          COMPOSANTS                         │
│  - UI réutilisables                         │
│  - Business logic locale                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          HOOKS                              │
│  - useWebSocket                             │
│  - useNotifications                         │
│  - useGeolocation                           │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          SERVICES                           │
│  - OrdersService                            │
│  - TrackingService                          │
│  - DocumentsService                         │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
┌────────▼──────┐   ┌─────▼──────────┐
│  API CLIENT   │   │  WS CLIENT     │
│  (REST HTTP)  │   │  (Socket.io)   │
└────────┬──────┘   └─────┬──────────┘
         │                │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │   BACKEND API   │
         └─────────────────┘
```

### 2. Communication Temps Réel

```
┌──────────────┐
│   Backend    │
│  WebSocket   │
│   Server     │
└──────┬───────┘
       │
       │ Socket.io
       │
┌──────▼───────────────────────────┐
│   WebSocket Client               │
│   (packages/utils)               │
│   - Auto-reconnection            │
│   - Event management             │
└──────┬───────────────────────────┘
       │
       │ Events (typed)
       │
┌──────▼────────────────────────────┐
│   useWebSocket Hook               │
│   - Subscribe to events           │
│   - Emit events                   │
└──────┬────────────────────────────┘
       │
       │ React Context / State
       │
┌──────▼─────────────────────────────┐
│   Components                       │
│   - Update UI in real-time        │
│   - Show notifications            │
└────────────────────────────────────┘
```

---

## 🔐 Authentification

### Flow JWT

1. **Login:**
   ```typescript
   const response = await fetch('/api/auth/login', {
     method: 'POST',
     body: JSON.stringify({ email, password }),
   });
   const { token, user } = await response.json();
   localStorage.setItem('token', token);
   ```

2. **Requêtes authentifiées:**
   ```typescript
   // Automatique via api-client.ts
   const token = localStorage.getItem('token');
   headers['Authorization'] = `Bearer ${token}`;
   ```

3. **WebSocket authentifié:**
   ```typescript
   const socket = io(WS_URL, {
     auth: { token: localStorage.getItem('token') }
   });
   ```

---

## 🎨 Conventions de Code

### Nomenclature

**Fichiers:**
- Composants: `PascalCase.tsx` (ex: `OrdersTable.tsx`)
- Hooks: `camelCase.ts` avec préfixe `use` (ex: `useWebSocket.ts`)
- Services: `kebab-case.ts` avec suffixe `-service` (ex: `orders-service.ts`)
- Types: `kebab-case.ts` (ex: `orders.ts`)
- Pages Next.js: `kebab-case.tsx` ou `[param].tsx`

**Variables et fonctions:**
- `camelCase` pour tout
- Constantes: `UPPER_SNAKE_CASE`

**Composants React:**
```typescript
// ✅ BON
interface OrdersTableProps {
  data: Order[];
  onRowClick: (order: Order) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ data, onRowClick }) => {
  const [loading, setLoading] = useState(false);

  return <div>{/* ... */}</div>;
};

export default OrdersTable;
```

**Services:**
```typescript
// ✅ BON
export class OrdersService {
  static async getOrders(filters?: OrderFilters): Promise<PaginatedOrders> {
    return await ordersApi.get('/orders', filters);
  }
}
```

**Hooks:**
```typescript
// ✅ BON
export function useNotifications(options: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  return {
    notifications,
    fetchNotifications,
    markAsRead,
  };
}
```

---

## 🧪 Tests

### Structure des tests

```
src/
├── components/
│   ├── OrdersTable.tsx
│   └── __tests__/
│       └── OrdersTable.test.tsx
│
└── lib/
    ├── scoring.ts
    └── __tests__/
        └── scoring.test.ts
```

### Exemples

**Test unitaire (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateCarrierScore } from '../scoring';

describe('calculateCarrierScore', () => {
  it('should return 100 for perfect criteria', () => {
    const score = calculateCarrierScore({
      punctualityPickup: 100,
      punctualityDelivery: 100,
      // ...
    });
    expect(score).toBe(100);
  });
});
```

**Test composant (Testing Library):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { OrdersTable } from '../OrdersTable';

describe('OrdersTable', () => {
  it('should display orders', () => {
    const orders = [{ id: '1', reference: 'CMD-001' }];
    render(<OrdersTable data={orders} onRowClick={jest.fn()} />);

    expect(screen.getByText('CMD-001')).toBeInTheDocument();
  });
});
```

**Commandes:**
```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

---

## 🚀 Développement

### Installation

```bash
# Cloner le repo
git clone <repo-url>
cd rt-frontend-apps

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp apps/web-industry/.env.local.example apps/web-industry/.env.local
# Répéter pour chaque app
```

### Lancement

```bash
# Démarrer tous les apps
pnpm dev

# Démarrer une app spécifique
pnpm --filter @rt/web-industry dev

# Build toutes les apps
pnpm build

# Build une app spécifique
pnpm --filter @rt/web-industry build
```

### Ports par défaut

- `web-industry`: 3101
- `web-transporter`: 3102
- `web-logistician`: 3103
- `web-recipient`: 3104
- `web-supplier`: 3105
- `web-forwarder`: 3106
- `backoffice-admin`: 3107
- `marketing-site`: 3001

---

## 📦 Gestion des Packages

### Ajouter une dépendance

**Workspace root (partagée):**
```bash
pnpm add -w package-name
```

**App spécifique:**
```bash
pnpm --filter @rt/web-industry add package-name
```

**Package partagé:**
```bash
pnpm --filter @repo/utils add package-name
```

### Utiliser un package partagé

```json
// apps/web-industry/package.json
{
  "dependencies": {
    "@rt/utils": "^1.0.0",
    "@rt/contracts": "^1.0.0",
    "@repo/ui-components": "^1.0.0"
  }
}
```

```typescript
// Dans le code
import { ordersApi, useWebSocket } from '@rt/utils';
import type { Order } from '@rt/contracts/src/types/orders';
import { NotificationBell } from '@repo/ui-components';
```

---

## 🌐 Variables d'Environnement

### Configuration par environnement

**Development (`.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3010
```

**Staging (`.env.staging`):**
```bash
NEXT_PUBLIC_API_URL=https://api-staging.symphonia.com/api/v1
NEXT_PUBLIC_WS_URL=wss://ws-staging.symphonia.com
```

**Production (`.env.production`):**
```bash
NEXT_PUBLIC_API_URL=https://api.symphonia.com/api/v1
NEXT_PUBLIC_WS_URL=wss://ws.symphonia.com
```

### Variables requises

Chaque app doit avoir:
```bash
# APIs
NEXT_PUBLIC_ORDERS_API_URL=
NEXT_PUBLIC_TRACKING_API_URL=
NEXT_PUBLIC_DOCUMENTS_API_URL=
NEXT_PUBLIC_NOTIFICATIONS_API_URL=
NEXT_PUBLIC_CARRIERS_API_URL=
NEXT_PUBLIC_AFFRET_IA_API_URL=
NEXT_PUBLIC_WS_URL=

# Services externes
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_TOMTOM_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
```

---

## 🔧 Troubleshooting

### Erreur de build

```bash
# Nettoyer le cache
pnpm clean

# Supprimer node_modules
rm -rf node_modules
pnpm install

# Supprimer .next et rebuild
rm -rf apps/*/.next
pnpm build
```

### WebSocket ne se connecte pas

1. Vérifier `NEXT_PUBLIC_WS_URL` dans `.env.local`
2. Vérifier que le serveur WebSocket backend est lancé
3. Vérifier le token JWT dans localStorage
4. Vérifier les logs du navigateur (Console > Network > WS)

### API retourne 401 Unauthorized

1. Vérifier que le token existe: `localStorage.getItem('token')`
2. Vérifier que le token n'est pas expiré
3. Re-login si nécessaire

---

## 📖 Ressources

### Documentation

- [ROADMAP_DEVELOPPEMENT_FRONTEND.md](./ROADMAP_DEVELOPPEMENT_FRONTEND.md) - Roadmap complète
- [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) - Rapport d'implémentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Packages clés

- [TanStack Table](https://tanstack.com/table) - Tables de données
- [FullCalendar](https://fullcalendar.io) - Calendrier
- [React Leaflet](https://react-leaflet.js.org) - Cartes
- [Recharts](https://recharts.org) - Graphiques
- [Socket.io](https://socket.io) - WebSocket

---

## 🤝 Contribution

### Workflow Git

```bash
# Créer une branche feature
git checkout -b feature/phase-1-orders

# Commit avec message descriptif
git commit -m "feat(orders): Add import CSV functionality"

# Push et créer PR
git push origin feature/phase-1-orders
```

### Convention de commits

```
feat(scope): Description courte
fix(scope): Description du bug fixé
docs(scope): Mise à jour documentation
refactor(scope): Refactoring sans changement de fonctionnalité
test(scope): Ajout de tests
chore(scope): Tâches de maintenance
```

---

## 📊 Monitoring et Performance

### Métriques à surveiller

- **Lighthouse Score:** > 90 (Performance, Accessibility, Best Practices)
- **Bundle Size:** < 500KB (initial load)
- **Time to Interactive:** < 3s
- **First Contentful Paint:** < 1.5s

### Outils

```bash
# Analyser le bundle
ANALYZE=true pnpm build

# Lighthouse
npm install -g lighthouse
lighthouse https://your-app.com
```

---

**Maintenu par:** Équipe SYMPHONI.A
**Contact:** tech@symphonia.com
**Dernière mise à jour:** 26 Novembre 2025
