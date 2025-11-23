# Quick Reference - RT Technologie Platform

## 🔗 URLs Importantes

### Site Marketing
- **Page d'accès aux portails**: `/portals`
- **Page d'abonnement centrale**: `/subscription`
- **Page d'accueil**: `/`

### Portails Web

#### 🏪 Supplier (Fournisseur)
- URL: `http://localhost:3104` (dev)
- Production: `https://supplier.rttechnologie.com`
- Pages:
  - Accueil: `/`
  - Abonnement: `/subscription`
  - Connexion: `/login`

#### 📦 Recipient (Destinataire)
- URL: `http://localhost:3103` (dev)
- Production: `https://recipient.rttechnologie.com`
- Pages: `/`, `/subscription`, `/login`

#### 🚚 Transporter (Transporteur)
- URL: `http://localhost:3102` (dev)
- Production: `https://transporter.rttechnologie.com`
- Pages: `/`, `/subscription`, `/login`

#### 📊 Logistician (Logisticien)
- URL: `http://localhost:3105` (dev)
- Production: `https://logistician.rttechnologie.com`
- Pages: `/`, `/subscription`, `/login`

#### 🌍 Forwarder (Transitaire)
- URL: `http://localhost:3106` (dev)
- Production: `https://forwarder.rttechnologie.com`
- Pages: `/`, `/subscription`, `/login`

#### 🏭 Industry (Industrie)
- URL: `http://localhost:3101` (dev)
- Production: `https://industry.rttechnologie.com`
- Pages: `/`, `/subscription`, `/login`

---

## 📁 Structure des Fichiers Importants

### Package UI Components
```
packages/ui-components/
├── src/
│   ├── components/
│   │   ├── Button.tsx           # Bouton réutilisable
│   │   ├── Card.tsx             # Cartes normales et glassmorphism
│   │   ├── Header.tsx           # En-tête de portail
│   │   ├── PortalCard.tsx       # Carte de présentation portail
│   │   └── SubscriptionCard.tsx # Carte de plan d'abonnement
│   ├── hooks/
│   │   └── useSubscription.ts   # Hook de gestion d'abonnement
│   ├── styles/
│   │   └── colors.ts            # Système de couleurs
│   └── types/
│       ├── portal.ts            # Types des portails
│       └── subscription.ts      # Types des abonnements
```

### Pages Marketing Site
```
apps/marketing-site/src/app/
├── portals/
│   └── page.tsx        # Page d'accès aux 6 portails
├── subscription/
│   └── page.tsx        # Page centrale d'abonnement
└── page.tsx            # Page d'accueil marketing
```

### Template Portail (web-supplier)
```
apps/web-supplier/
├── pages/
│   ├── index.tsx           # Page d'accueil MODERNISÉE
│   ├── subscription.tsx    # Page d'abonnement locale
│   ├── login.tsx          # Page de connexion
│   └── _app.tsx           # App wrapper
├── lib/
│   └── auth.ts            # Utilitaires d'authentification
└── styles/
    └── globals.css        # Styles globaux
```

---

## 🎨 Gradients par Portail

Copier-coller ces gradients pour la cohérence :

```typescript
// Supplier
gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'

// Recipient
gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'

// Transporter
gradient: 'linear-gradient(135deg, #22c1c3 0%, #fdbb2d 100%)'

// Logistician
gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'

// Forwarder
gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'

// Industry
gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
```

---

## 💾 LocalStorage Keys

```javascript
// Authentification
'authToken'          // Token JWT de l'utilisateur
'user'               // Objet user { email, role }

// Abonnement
'userSubscription'   // { tier, startDate, status, autoRenew }
'selectedPlan'       // Plan sélectionné (avant confirmation)
```

---

## 🔧 Commandes de Développement

### Démarrer tous les projets
```bash
npm run dev
# ou
pnpm dev
# ou avec turbo
turbo run dev
```

### Démarrer un portail spécifique
```bash
# Supplier
cd apps/web-supplier && npm run dev

# Recipient
cd apps/web-recipient && npm run dev

# etc...
```

### Build
```bash
# Tous les projets
npm run build

# Un projet spécifique
cd apps/web-supplier && npm run build
```

---

## 🎯 Niveaux d'Abonnement

### Gratuit (Free)
- Tier ID: `'free'`
- Prix: 0€/mois
- Limite: 10 commandes/mois
- Utilisateurs: 1
- Portails: Industry, Recipient, Transporter

### Pro
- Tier ID: `'pro'`
- Prix: 49€/mois (39.20€/mois si annuel)
- Commandes: Illimitées
- Utilisateurs: 10
- Portails: Tous

### Enterprise
- Tier ID: `'enterprise'`
- Prix: 199€/mois (159.20€/mois si annuel)
- Tout: Illimité
- Support: 24/7 dédié
- Portails: Tous + features exclusives

---

## 🔐 Logique de Verrouillage

### Vérifier si une feature est accessible
```typescript
const isLocked = (userTier: string, requiredTier: string) => {
  const tiers = { free: 0, pro: 1, enterprise: 2 };
  return tiers[userTier] < tiers[requiredTier];
};

// Exemple
isLocked('free', 'pro')       // true
isLocked('pro', 'free')       // false
isLocked('pro', 'enterprise') // true
```

### Fonctionnalités par tier
```typescript
const features = {
  free: [
    'Suivi de base',
    'Email support',
    '10 commandes/mois'
  ],
  pro: [
    'Toutes les fonctionnalités free',
    'Support prioritaire',
    'API access',
    'Rapports personnalisés'
  ],
  enterprise: [
    'Toutes les fonctionnalités pro',
    'Support 24/7',
    'Gestionnaire dédié',
    'SLA garanti'
  ]
};
```

---

## 🎨 Classes CSS Réutilisables

### Glassmorphism Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Gradient Text
```css
.gradient-text {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Hover Animation
```css
.hover-lift {
  transition: all 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
```

---

## 📊 Plan de Migration

### Pour moderniser un nouveau portail (ex: web-recipient)

1. **Copier index.tsx de web-supplier**
   ```bash
   cp apps/web-supplier/pages/index.tsx apps/web-recipient/pages/index.tsx
   ```

2. **Adapter le gradient**
   ```typescript
   // Remplacer
   background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
   // Par
   background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
   ```

3. **Changer le titre**
   ```typescript
   <title>Recipient Portal - RT Technologie</title>
   <h1>📦 Recipient Portal</h1>
   ```

4. **Adapter les features**
   ```typescript
   const features = [
     {
       icon: '📍',
       title: 'Suivi en temps réel',
       desc: 'Suivez vos colis en direct',
       locked: false
     },
     // etc...
   ];
   ```

5. **Tester**
   ```bash
   cd apps/web-recipient
   npm run dev
   ```

---

## 🚀 Deployment

### AWS Amplify
Chaque app est déployée séparément sur AWS Amplify.

### Build Settings
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: out
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

---

## 📚 Documentation Complète

- `DESIGN_IMPROVEMENTS.md` - Guide détaillé de toutes les améliorations
- `RESUME_AMELIORATIONS.md` - Résumé exécutif
- `QUICK_REFERENCE.md` - Ce fichier (référence rapide)
- `README.md` - Documentation générale du projet

---

## ✨ Tips & Tricks

### Changer l'abonnement via console
```javascript
// Dans les DevTools
const subscription = {
  tier: 'pro',  // ou 'free', 'enterprise'
  startDate: new Date().toISOString(),
  status: 'active',
  autoRenew: true
};
localStorage.setItem('userSubscription', JSON.stringify(subscription));
location.reload();
```

### Réinitialiser l'abonnement
```javascript
localStorage.removeItem('userSubscription');
location.reload();
```

### Mode debug
```javascript
// Voir l'abonnement actuel
console.log(JSON.parse(localStorage.getItem('userSubscription')));

// Voir l'utilisateur
console.log(JSON.parse(localStorage.getItem('user')));
```

---

## 🎯 Checklist de Modernisation d'un Portail

- [ ] Copier `index.tsx` depuis web-supplier
- [ ] Adapter le gradient du portail
- [ ] Changer le titre et l'icône
- [ ] Personnaliser les 4 features
- [ ] Ajuster les statistiques
- [ ] Vérifier que `/subscription` existe déjà
- [ ] Tester le verrouillage des features
- [ ] Tester les transitions entre plans
- [ ] Vérifier le responsive
- [ ] Tester les animations
- [ ] Commit les changements

---

Dernière mise à jour: 2024-11-23
Version: 1.0.0
