# ✅ Import Réussi - Apps Frontend

Les applications **backoffice-admin** et **marketing-site** ont été importées avec succès dans le repository `rt-frontend-apps` !

---

## 📦 Ce qui a été importé

### 1. backoffice-admin
- ✅ Code source complet copié
- ✅ Dependencies mises à jour avec `@rt/contracts` et `@rt/utils`
- ✅ Variables d'environnement configurées (`.env.production`, `.env.local.example`)
- ✅ Configuration Amplify (`amplify.yml`)
- ✅ API URL pointant vers API Gateway : `https://api.rt-technologie.com/api/v1`

### 2. marketing-site
- ✅ Code source complet copié
- ✅ Dependencies mises à jour avec `@rt/contracts` et `@rt/utils`
- ✅ Variables d'environnement créées (`.env.production`, `.env.local.example`)
- ✅ Configuration Amplify créée (`amplify.yml`)
- ✅ API URL pointant vers API Gateway : `https://api.rt-technologie.com/api/v1`

---

## 🚀 Installation Locale

### Prérequis

```bash
# Avoir le GitHub Token configuré
echo "//npm.pkg.github.com/:_authToken=VOTRE_TOKEN" >> ~/.npmrc
```

### Installation

```bash
cd "c:\Users\jspitaleri\OneDrive - Cesi\Bureau\RT-Technologie\migration\rt-frontend-apps"

# Installer les dépendances (va installer @rt/contracts et @rt/utils depuis GitHub Packages)
pnpm install

# Créer les fichiers .env.local pour le dev
cp apps/backoffice-admin/.env.local.example apps/backoffice-admin/.env.local
cp apps/marketing-site/.env.local.example apps/marketing-site/.env.local
```

### Développement Local

**Backoffice Admin :**

```bash
cd "c:\Users\jspitaleri\OneDrive - Cesi\Bureau\RT-Technologie\migration\rt-frontend-apps"

# Lancer en dev
pnpm --filter @rt/backoffice-admin dev

# Ouvrir http://localhost:3000
```

**Marketing Site :**

```bash
cd "c:\Users\jspitaleri\OneDrive - Cesi\Bureau\RT-Technologie\migration\rt-frontend-apps"

# Lancer en dev
pnpm --filter @rt/marketing-site dev

# Ouvrir http://localhost:3000
```

---

## 🎨 Utiliser @rt/contracts dans le Code

### Exemple : Créer une commande (backoffice-admin)

```typescript
// apps/backoffice-admin/src/api/orders.ts
import { CreateOrderDTO, OrderResponse, OrderStatus } from '@rt/contracts';
import { formatCurrency, formatDateFR } from '@rt/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createOrder(
  data: CreateOrderDTO
): Promise<OrderResponse> {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create order');
  }

  return response.json();
}

// Usage dans un composant
function OrderCard({ order }: { order: OrderResponse }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">Commande {order.numero}</h3>
      <p className="text-sm text-gray-600">
        Statut: {order.status}
      </p>
      <p className="text-sm text-gray-600">
        Date: {formatDateFR(order.createdAt)}
      </p>
      {order.prixEstime && (
        <p className="text-lg font-bold text-green-600">
          {formatCurrency(order.prixEstime.amount, order.prixEstime.currency)}
        </p>
      )}
    </div>
  );
}
```

### Exemple : Formulaire de contact (marketing-site)

```typescript
// apps/marketing-site/src/components/ContactForm.tsx
import { isValidEmail, isValidPhoneFR } from '@rt/utils';
import { useState } from 'react';

export function ContactForm() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Validation avec @rt/utils
    if (!isValidEmail(email)) {
      newErrors.email = 'Email invalide';
    }

    if (phone && !isValidPhoneFR(phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Envoyer à l'API
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });

    if (response.ok) {
      alert('Message envoyé !');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      {errors.email && <p className="text-red-500">{errors.email}</p>}

      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Téléphone"
      />
      {errors.phone && <p className="text-red-500">{errors.phone}</p>}

      <button type="submit">Envoyer</button>
    </form>
  );
}
```

---

## 🔄 Commit et Push

Maintenant que les apps sont importées, committez les changements :

```bash
cd "c:\Users\jspitaleri\OneDrive - Cesi\Bureau\RT-Technologie\migration\rt-frontend-apps"

git add .
git commit -m "feat: Import backoffice-admin and marketing-site

- Add backoffice-admin application with full source code
- Add marketing-site application with full source code
- Configure @rt/contracts and @rt/utils dependencies
- Add Amplify configuration for both apps
- Configure environment variables for dev and production
- Set API URL to use API Gateway (https://api.rt-technologie.com/api/v1)"

git push origin main
```

---

## 🚢 Déploiement sur AWS Amplify

### Backoffice Admin

1. **Créer l'App Amplify**
   - AWS Console → Amplify → New app → Host web app
   - Repository : `rt-frontend-apps`
   - Branch : `main`
   - App root : `apps/backoffice-admin`

2. **Variables d'environnement**
   - `GITHUB_TOKEN` = votre token (pour accéder aux packages)
   - `NEXT_PUBLIC_API_URL` = `https://api.rt-technologie.com/api/v1`

3. **Build settings**
   - Amplify détecte automatiquement `apps/backoffice-admin/amplify.yml`

4. **Domaine custom** (optionnel)
   - Domain management → Add domain
   - `backoffice.rt-technologie.com`

### Marketing Site

1. **Créer l'App Amplify**
   - AWS Console → Amplify → New app → Host web app
   - Repository : `rt-frontend-apps`
   - Branch : `main`
   - App root : `apps/marketing-site`

2. **Variables d'environnement**
   - `GITHUB_TOKEN` = votre token
   - `NEXT_PUBLIC_API_URL` = `https://api.rt-technologie.com/api/v1`

3. **Build settings**
   - Amplify détecte automatiquement `apps/marketing-site/amplify.yml`

4. **Domaine custom** (optionnel)
   - Domain management → Add domain
   - `www.rt-technologie.com`

---

## ✅ Checklist

### Backoffice Admin
- [x] Code source importé
- [x] `@rt/contracts` et `@rt/utils` ajoutés
- [x] `.env.production` configuré
- [x] `.env.local.example` créé
- [x] `amplify.yml` configuré
- [ ] Commit & push sur GitHub
- [ ] App Amplify créée
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Domaine custom configuré

### Marketing Site
- [x] Code source importé
- [x] `@rt/contracts` et `@rt/utils` ajoutés
- [x] `.env.production` créé
- [x] `.env.local.example` créé
- [x] `amplify.yml` créé
- [ ] Commit & push sur GitHub
- [ ] App Amplify créée
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Domaine custom configuré

---

## 🎯 Prochaines Étapes

1. **Tester localement** (optionnel)
   ```bash
   pnpm install
   pnpm --filter @rt/backoffice-admin dev
   ```

2. **Commit et push**
   ```bash
   git add .
   git commit -m "feat: Import frontend apps"
   git push
   ```

3. **Déployer sur Amplify**
   - Suivre les étapes ci-dessus

4. **Importer les autres apps** (optionnel)
   - web-industry
   - web-transporter
   - web-recipient
   - web-supplier
   - web-forwarder
   - web-logistician

---

## 📚 Documentation

- [Guide de déploiement Amplify complet](./DEPLOYMENT_GUIDE.md)
- [README principal](./README.md)
- [Utilisation de @rt/contracts](../rt-shared-contracts/packages/contracts/README.md)

---

**Félicitations ! Les deux apps principales sont maintenant dans le nouveau repository multi-repo ! 🎉**

_Document créé le 2025-11-21_
