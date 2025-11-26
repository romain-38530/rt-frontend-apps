# 🚀 GUIDE DE DÉMARRAGE RAPIDE - SYMPHONI.A

**Pour les développeurs qui rejoignent le projet**

---

## ⚡ Démarrage en 5 minutes

### 1. Prérequis

```bash
# Vérifier Node.js (>= 20.0.0)
node --version

# Vérifier pnpm (>= 8.0.0)
pnpm --version

# Si pnpm n'est pas installé
npm install -g pnpm
```

### 2. Installation

```bash
# Cloner le projet
git clone <repo-url>
cd rt-frontend-apps

# Installer toutes les dépendances
pnpm install

# Copier les variables d'environnement
cp apps/web-industry/.env.local.example apps/web-industry/.env.local
cp apps/web-transporter/.env.local.example apps/web-transporter/.env.local
# ... répéter pour chaque app
```

### 3. Configuration

Éditer `apps/web-industry/.env.local`:

```bash
NEXT_PUBLIC_ORDERS_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3010
# ... autres variables
```

### 4. Lancement

```bash
# Démarrer toutes les apps
pnpm dev

# Ou une app spécifique
pnpm --filter @rt/web-industry dev
```

### 5. Accès

Ouvrir le navigateur:
- Industry: http://localhost:3101
- Transporter: http://localhost:3102
- Backoffice: http://localhost:3107

---

## 📝 Créer votre première fonctionnalité

### Exemple: Ajouter une page "Liste des commandes"

#### Étape 1: Créer la page

```bash
# Créer le fichier
touch apps/web-industry/pages/orders/index.tsx
```

```typescript
// apps/web-industry/pages/orders/index.tsx
import { useEffect, useState } from 'react';
import { OrdersService } from '@rt/utils/lib/services/orders-service';
import type { Order } from '@rt/contracts/src/types/orders';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await OrdersService.getOrders({
        page: 1,
        limit: 20,
      });
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mes Commandes</h1>

      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{order.reference}</h3>
                <p className="text-sm text-gray-600">
                  {order.pickupAddress.city} → {order.deliveryAddress.city}
                </p>
              </div>
              <div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Étape 2: Créer le composant réutilisable

```bash
# Créer le dossier
mkdir -p apps/web-industry/components/orders

# Créer le composant
touch apps/web-industry/components/orders/OrderCard.tsx
```

```typescript
// apps/web-industry/components/orders/OrderCard.tsx
import React from 'react';
import type { Order } from '@rt/contracts/src/types/orders';

interface OrderCardProps {
  order: Order;
  onClick?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  return (
    <div
      onClick={() => onClick?.(order)}
      className="bg-white shadow hover:shadow-lg rounded-lg p-6 cursor-pointer transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{order.reference}</h3>
          <p className="text-sm text-gray-500">ID: {order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Enlèvement</p>
          <p className="font-medium">{order.pickupAddress.city}</p>
          <p className="text-sm text-gray-600">
            {new Date(order.dates.pickupDate).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Livraison</p>
          <p className="font-medium">{order.deliveryAddress.city}</p>
          <p className="text-sm text-gray-600">
            {new Date(order.dates.deliveryDate).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          <p className="text-xs text-gray-500">Poids</p>
          <p className="font-semibold">{order.goods.weight} kg</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Prix</p>
          <p className="font-semibold text-lg">
            {order.finalPrice ? `${order.finalPrice} €` : 'En attente'}
          </p>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    created: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
};

export default OrderCard;
```

#### Étape 3: Utiliser le composant

```typescript
// Mettre à jour apps/web-industry/pages/orders/index.tsx
import { OrderCard } from '../../components/orders/OrderCard';
import { useRouter } from 'next/router';

export default function OrdersPage() {
  const router = useRouter();
  // ... reste du code

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mes Commandes</h1>

      <div className="grid gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onClick={(o) => router.push(`/orders/${o.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 Patterns de Développement

### Pattern 1: Service + Hook + Component

**1. Service (API):**
```typescript
// packages/utils/lib/services/carriers-service.ts
export class CarriersService {
  static async getCarriers(filters?) {
    return await carriersApi.get('/carriers', filters);
  }

  static async getCarrierScore(carrierId: string) {
    return await carriersApi.get(`/carriers/${carrierId}/score`);
  }
}
```

**2. Hook (Logic):**
```typescript
// packages/utils/lib/hooks/useCarriers.ts
export function useCarriers() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCarriers = async (filters?) => {
    setLoading(true);
    try {
      const data = await CarriersService.getCarriers(filters);
      setCarriers(data);
    } finally {
      setLoading(false);
    }
  };

  return { carriers, loading, loadCarriers };
}
```

**3. Component (UI):**
```typescript
// components/carriers/CarriersList.tsx
export const CarriersList: React.FC = () => {
  const { carriers, loading, loadCarriers } = useCarriers();

  useEffect(() => {
    loadCarriers();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {carriers.map(carrier => (
        <CarrierCard key={carrier.id} carrier={carrier} />
      ))}
    </div>
  );
};
```

### Pattern 2: WebSocket Event Handling

```typescript
import { useWebSocket } from '@rt/utils';
import toast from 'react-hot-toast';

export default function OrderDetailPage({ orderId }) {
  const [order, setOrder] = useState<Order | null>(null);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Charger la commande
    loadOrder();

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = subscribe('tracking.location.updated', (data) => {
      if (data.orderId === orderId) {
        setOrder((prev) => ({
          ...prev!,
          currentLocation: data.location,
        }));
        toast.success('Position mise à jour');
      }
    });

    return unsubscribe;
  }, [orderId, subscribe]);

  // ...
}
```

### Pattern 3: Form avec Validation

```typescript
import { useState } from 'react';
import { z } from 'zod';

// Schéma de validation
const orderSchema = z.object({
  pickupCity: z.string().min(1, 'Ville requise'),
  deliveryCity: z.string().min(1, 'Ville requise'),
  weight: z.number().positive('Poids doit être positif'),
});

export const CreateOrderForm: React.FC = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validation
      const validated = orderSchema.parse(formData);

      // Création
      const order = await OrdersService.createOrder(validated);

      // Succès
      toast.success('Commande créée !');
      router.push(`/orders/${order.id}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.pickupCity || ''}
        onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
      />
      {errors.pickupCity && <p className="text-red-500">{errors.pickupCity}</p>}

      {/* ... autres champs */}

      <button type="submit">Créer</button>
    </form>
  );
};
```

---

## 🛠️ Commandes Utiles

### Développement

```bash
# Démarrer une app spécifique
pnpm --filter @rt/web-industry dev

# Démarrer plusieurs apps
pnpm --filter @rt/web-industry --filter @rt/web-transporter dev

# Build une app
pnpm --filter @rt/web-industry build

# Lint
pnpm --filter @rt/web-industry lint
```

### Gestion des packages

```bash
# Ajouter une dépendance à une app
pnpm --filter @rt/web-industry add axios

# Ajouter une dépendance au workspace
pnpm add -w date-fns

# Ajouter une dev dependency
pnpm --filter @rt/web-industry add -D @types/node

# Supprimer une dépendance
pnpm --filter @rt/web-industry remove axios
```

### Nettoyage

```bash
# Nettoyer tous les node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Nettoyer les builds
rm -rf apps/*/.next apps/*/out

# Réinstaller proprement
pnpm install
```

---

## 🐛 Debug

### Debug dans VS Code

Créer `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug industry",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "@rt/web-industry", "dev"],
      "port": 9229,
      "console": "integratedTerminal"
    }
  ]
}
```

### Debug WebSocket

```typescript
// Activer les logs détaillés
import { initializeWebSocket } from '@rt/utils';

const ws = initializeWebSocket();

ws.on('_internal:connected', () => console.log('✅ WS Connected'));
ws.on('_internal:disconnected', (data) => console.log('❌ WS Disconnected:', data));
ws.on('_internal:error', (data) => console.error('⚠️ WS Error:', data));
```

### Debug API

```typescript
// packages/utils/lib/api-client.ts
// Ajouter des logs temporaires

private async request<T>(path: string, options: RequestInit) {
  const url = `${this.baseURL}${path}`;
  console.log('🌐 API Request:', url, options);

  const response = await fetch(url, options);
  console.log('📥 API Response:', response.status, response.statusText);

  // ...
}
```

---

## 📚 Ressources Rapides

### Exemples de Code

**Afficher une notification:**
```typescript
import toast from 'react-hot-toast';

toast.success('Commande créée !');
toast.error('Erreur lors de la création');
toast.loading('Chargement...');
```

**Appeler une API:**
```typescript
import { OrdersService } from '@rt/utils/lib/services/orders-service';

const orders = await OrdersService.getOrders({ page: 1, limit: 20 });
const order = await OrdersService.createOrder(orderData);
```

**Écouter un événement WebSocket:**
```typescript
import { useWebSocket } from '@rt/utils';

const { subscribe } = useWebSocket();

useEffect(() => {
  const unsub = subscribe('order.created', (data) => {
    console.log('Nouvelle commande:', data);
  });
  return unsub;
}, []);
```

**Afficher un loader:**
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData().finally(() => setLoading(false));
}, []);

if (loading) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}
```

---

## 🎯 Checklist Première Contribution

- [ ] J'ai lu l'ARCHITECTURE.md
- [ ] J'ai lu l'IMPLEMENTATION_REPORT.md
- [ ] J'ai installé le projet et lancé une app
- [ ] J'ai créé une branche feature
- [ ] J'ai testé ma fonctionnalité localement
- [ ] J'ai ajouté des tests (si applicable)
- [ ] J'ai mis à jour la documentation (si nécessaire)
- [ ] J'ai créé une Pull Request

---

## 💬 Support

**Questions ?**
- Consulter [ARCHITECTURE.md](./ARCHITECTURE.md)
- Consulter [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md)
- Contacter l'équipe: tech@symphonia.com

**Problèmes ?**
- Vérifier les logs: `pnpm dev` (console)
- Vérifier le réseau: DevTools > Network
- Vérifier les variables d'env: `.env.local`

---

**Bon développement ! 🚀**

L'infrastructure est prête, il ne reste plus qu'à implémenter les fonctionnalités en suivant les patterns documentés.
