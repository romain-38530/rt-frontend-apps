# 🎉 Apps Importées avec Succès !

## ✅ Ce qui vient d'être fait

**2 applications** ont été importées dans `rt-frontend-apps` :

1. ✅ **backoffice-admin** - Portail administrateur
2. ✅ **marketing-site** - Site marketing public

### Modifications apportées

Pour chaque app :
- ✅ Code source copié depuis le monorepo
- ✅ `@rt/contracts` et `@rt/utils` ajoutés aux dependencies
- ✅ `.env.production` configuré avec API Gateway URL
- ✅ `.env.local.example` créé pour le développement local
- ✅ `amplify.yml` configuré pour AWS Amplify
- ✅ API URL unifiée : `https://api.rt-technologie.com/api/v1`

---

## 🚀 Prochaines Actions

### 1. Commit et Push (5 min)

```bash
cd "c:\Users\jspitaleri\OneDrive - Cesi\Bureau\RT-Technologie\migration\rt-frontend-apps"

# Vérifier les changements
git status

# Ajouter tout
git add .

# Commit
git commit -m "feat: Import backoffice-admin and marketing-site apps

- Import full source code for both applications
- Add @rt/contracts and @rt/utils dependencies
- Configure environment variables for dev and production
- Setup Amplify deployment configuration
- Point API to unified API Gateway (api.rt-technologie.com/api/v1)
- Add installation and usage documentation"

# Push
git push origin main
```

---

### 2. Installer et Tester Localement (Optionnel - 10 min)

**Installer les dépendances :**

```bash
cd "c:\Users\jspitaleri\OneDrive - Cesi\Bureau\RT-Technologie\migration\rt-frontend-apps"

# Vérifier que le GitHub Token est configuré
cat ~/.npmrc | grep npm.pkg.github.com
# Si vide, ajouter : echo "//npm.pkg.github.com/:_authToken=VOTRE_TOKEN" >> ~/.npmrc

# Installer (va télécharger @rt/contracts et @rt/utils depuis GitHub Packages)
pnpm install
```

**Tester backoffice-admin :**

```bash
# Créer .env.local
cp apps/backoffice-admin/.env.local.example apps/backoffice-admin/.env.local

# Lancer en dev
pnpm --filter @rt/backoffice-admin dev

# Ouvrir http://localhost:3000
```

**Tester marketing-site :**

```bash
# Créer .env.local
cp apps/marketing-site/.env.local.example apps/marketing-site/.env.local

# Lancer en dev
pnpm --filter @rt/marketing-site dev

# Ouvrir http://localhost:3000
```

---

### 3. Déployer sur AWS Amplify (30 min)

Suivez le [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) complet, ou résumé :

#### A. Backoffice Admin

1. **AWS Console → Amplify → New app**
   - Repository : `rt-frontend-apps`
   - Branch : `main`
   - App root : `apps/backoffice-admin`

2. **Environment variables :**
   - `GITHUB_TOKEN` = votre token
   - `NEXT_PUBLIC_API_URL` = `https://api.rt-technologie.com/api/v1`

3. **Build settings :**
   - Amplify détecte `apps/backoffice-admin/amplify.yml` automatiquement

4. **Domain (optionnel) :**
   - `backoffice.rt-technologie.com`

#### B. Marketing Site

1. **AWS Console → Amplify → New app**
   - Repository : `rt-frontend-apps`
   - Branch : `main`
   - App root : `apps/marketing-site`

2. **Environment variables :**
   - `GITHUB_TOKEN` = votre token
   - `NEXT_PUBLIC_API_URL` = `https://api.rt-technologie.com/api/v1`

3. **Build settings :**
   - Amplify détecte `apps/marketing-site/amplify.yml` automatiquement

4. **Domain (optionnel) :**
   - `www.rt-technologie.com`

---

## 📖 Documentation

- **[IMPORT_SUCCESS.md](./IMPORT_SUCCESS.md)** - Détails sur ce qui a été importé
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guide complet de déploiement Amplify
- **[README.md](./README.md)** - Documentation générale

---

## 🎯 Utiliser @rt/contracts dans le Code

### Exemple : API Call avec Type-Safety

```typescript
// apps/backoffice-admin/src/api/orders.ts
import { CreateOrderDTO, OrderResponse, OrderStatus } from '@rt/contracts';
import { formatCurrency, formatDateFR } from '@rt/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createOrder(data: CreateOrderDTO): Promise<OrderResponse> {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to create order');
  return response.json();
}
```

✨ **TypeScript vous garantit que les types correspondent entre frontend et backend !**

---

## ✅ Checklist

### Import
- [x] backoffice-admin copié
- [x] marketing-site copié
- [x] Dependencies mises à jour
- [x] Environment variables configurées
- [x] Amplify config créées

### Déploiement
- [ ] Code committé et pushé
- [ ] Backoffice admin sur Amplify
- [ ] Marketing site sur Amplify
- [ ] Variables d'environnement Amplify configurées
- [ ] Builds réussis
- [ ] Domaines custom configurés

---

## 🎉 Félicitations !

Vous avez maintenant **2 apps frontend** prêtes à être déployées sur AWS Amplify avec :

✅ Type-safety totale via `@rt/contracts`
✅ Utilitaires partagés via `@rt/utils`
✅ API unifiée via API Gateway
✅ Configuration Amplify prête
✅ Variables d'environnement configurées

**Prochaine étape : Commit & Push, puis déployer sur Amplify ! 🚀**

