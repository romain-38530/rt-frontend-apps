# Deployment Guide - Frontend Apps

Guide complet pour déployer les applications frontend sur AWS Amplify.

## 📋 Prérequis

- Compte AWS avec accès Amplify
- Repository GitHub `rt-frontend-apps` créé
- GitHub Personal Access Token (PAT) avec accès `read:packages`
- Backend déployé sur `https://api.rt-technologie.com`

---

## 🚀 Déploiement sur AWS Amplify

### 1. Créer une App Amplify (backoffice-admin)

#### Via AWS Console

1. **Accéder à AWS Amplify**
   - AWS Console → Services → AWS Amplify
   - Région: `eu-west-3` (Paris)

2. **Nouvelle App**
   - Cliquer sur "New app" → "Host web app"
   - Sélectionner "GitHub"
   - Autoriser AWS Amplify à accéder à votre organisation GitHub

3. **Connecter le Repository**
   - Repository: `rt-frontend-apps`
   - Branch: `main`
   - Détecter automatiquement la config Amplify

4. **Configurer le Monorepo**
   - Amplify détecte le monorepo
   - App root directory: `apps/backoffice-admin`
   - Build specification file: `apps/backoffice-admin/amplify.yml`

5. **Variables d'environnement**

   Ajouter dans "Environment variables":

   | Variable | Value | Visibility |
   |----------|-------|------------|
   | `GITHUB_TOKEN` | `ghp_your_token_here` | Secret |
   | `NEXT_PUBLIC_API_URL` | `https://api.rt-technologie.com/api/v1` | Plain text |

   **Important:** Le `GITHUB_TOKEN` doit avoir le scope `read:packages` pour accéder à `@rt/contracts` et `@rt/utils`.

6. **Advanced settings** (optionnel)
   - Enable auto-deploy: ✅ Yes
   - Build image: Default (Amazon Linux 2023)
   - Environment: Production

7. **Review & Save**
   - Vérifier la configuration
   - Sauvegarder et déployer

#### Via Amplify CLI

```bash
# Installer Amplify CLI
npm install -g @aws-amplify/cli

# Configurer Amplify
amplify configure

# Initialiser dans le projet
cd rt-frontend-apps/apps/backoffice-admin
amplify init

# Publier
amplify publish
```

---

### 2. Déployer les autres Apps

Répéter le processus pour chaque app:

| App | App Root | URL Suggestion |
|-----|----------|----------------|
| `backoffice-admin` | `apps/backoffice-admin` | `backoffice.rt-technologie.com` |
| `marketing-site` | `apps/marketing-site` | `www.rt-technologie.com` |
| `web-industry` | `apps/web-industry` | `industry.rt-technologie.com` |
| `web-transporter` | `apps/web-transporter` | `transporter.rt-technologie.com` |
| `web-recipient` | `apps/web-recipient` | `recipient.rt-technologie.com` |
| `web-supplier` | `apps/web-supplier` | `supplier.rt-technologie.com` |
| `web-forwarder` | `apps/web-forwarder` | `forwarder.rt-technologie.com` |
| `web-logistician` | `apps/web-logistician` | `logistician.rt-technologie.com` |

---

### 3. Configurer les Domaines Personnalisés

1. **Accéder au Domain Management**
   - AWS Amplify Console
   - Sélectionner l'app
   - "Domain management" dans le menu

2. **Ajouter un domaine**
   - Domain: `rt-technologie.com`
   - Ajouter les subdomains:
     - `backoffice.rt-technologie.com` → backoffice-admin app
     - `www.rt-technologie.com` → marketing-site app
     - `industry.rt-technologie.com` → web-industry app
     - etc.

3. **Configurer DNS**

   Amplify génère automatiquement les enregistrements DNS.

   **Dans Route 53 (ou votre DNS provider):**

   ```
   backoffice.rt-technologie.com  CNAME  xxxxx.cloudfront.net
   www.rt-technologie.com         CNAME  yyyyy.cloudfront.net
   ```

4. **SSL Certificate**

   Amplify génère automatiquement un certificat SSL via ACM.

   Attendre la validation (quelques minutes).

---

### 4. Vérifier le Déploiement

#### Build Logs

1. Amplify Console → App → "Build" tab
2. Cliquer sur le build en cours
3. Vérifier les logs:
   - ✅ preBuild: pnpm install success
   - ✅ Build: pnpm build success
   - ✅ Deploy: CloudFront distribution updated

#### Erreurs Communes

**Erreur: "Package @rt/contracts not found"**

Solution:
- Vérifier que `GITHUB_TOKEN` est configuré
- Vérifier que le token a le scope `read:packages`
- Vérifier que `.npmrc` est correctement configuré dans `amplify.yml`

**Erreur: "NEXT_PUBLIC_API_URL is not defined"**

Solution:
- Ajouter `NEXT_PUBLIC_API_URL` dans les Environment Variables
- Rebuild l'app

**Erreur: "Build failed: out of memory"**

Solution:
- Augmenter la taille de l'instance de build
- Amplify Console → Build settings → Edit build image settings
- Compute: Large (7 GB)

---

### 5. Configuration CORS (Backend)

Le backend (admin-gateway) doit autoriser les origines Amplify:

```typescript
// services/admin-gateway/src/index.ts

const allowedOrigins = [
  // Amplify auto-generated URLs
  'https://main.d1234abc567def.amplifyapp.com',
  'https://main.d9876xyz543ghi.amplifyapp.com',

  // Custom domains
  'https://backoffice.rt-technologie.com',
  'https://www.rt-technologie.com',
  'https://industry.rt-technologie.com',
  'https://transporter.rt-technologie.com',
  'https://recipient.rt-technologie.com',
  'https://supplier.rt-technologie.com',
  'https://forwarder.rt-technologie.com',
  'https://logistician.rt-technologie.com',

  // Local development
  'http://localhost:3000',
  'http://localhost:3010',
  'http://localhost:3100',
  'http://localhost:3102',
  'http://localhost:3103',
  'http://localhost:4002',
  'http://localhost:3106',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

**Important:** Redéployer le backend après chaque ajout d'origine.

---

### 6. Monitoring

#### Amplify Console

- **Overview**: Status de l'app, URL, dernière build
- **Monitoring**: Traffic, errors, performance
- **Alarms**: Configurer des alertes

#### CloudWatch

Les logs sont automatiquement envoyés à CloudWatch.

**Accéder aux logs:**
1. AWS Console → CloudWatch
2. Logs → Log groups
3. Chercher `/aws/amplify/`

---

### 7. CI/CD Automatique

Amplify détecte automatiquement les pushs sur `main` et déclenche un build.

**Workflow:**
```
git push origin main
    ↓
GitHub notifie Amplify
    ↓
Amplify déclenche build
    ↓
preBuild: pnpm install
    ↓
Build: pnpm build
    ↓
Deploy: CloudFront CDN
    ↓
✅ Live sur https://app.rt-technologie.com
```

**Désactiver auto-deploy** (si besoin):
- Amplify Console → App settings → Build settings
- Décocher "Automatically deploy commits"

---

### 8. Preview Environments (Feature Branches)

Amplify peut créer des environnements de preview pour chaque PR.

**Activer:**
1. Amplify Console → Previews
2. "Manage previews"
3. Activer pour `main` branch

**Utilisation:**
- Créer une PR sur GitHub
- Amplify génère automatiquement une URL de preview
- URL format: `https://pr-123.d1234abc567def.amplifyapp.com`

---

### 9. Rollback

Si un déploiement échoue, rollback vers la version précédente:

1. Amplify Console → App
2. "Deployments" tab
3. Sélectionner une build précédente qui fonctionne
4. Cliquer "Redeploy this version"

---

### 10. Performance Optimization

#### Caching

Amplify utilise CloudFront CDN automatiquement.

**Cache invalidation** (si besoin):
```bash
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD5678 \
  --paths "/*"
```

#### Build Optimization

Dans `next.config.js`:

```js
module.exports = {
  // Optimize production builds
  swcMinify: true,

  // Reduce build time
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },

  // Image optimization
  images: {
    domains: ['api.rt-technologie.com'],
  },
};
```

---

## 📊 Checklist Déploiement

### Backoffice Admin
- [ ] App Amplify créée
- [ ] `GITHUB_TOKEN` configuré
- [ ] `NEXT_PUBLIC_API_URL` configuré
- [ ] Build réussi
- [ ] Domaine custom configuré (`backoffice.rt-technologie.com`)
- [ ] SSL activé
- [ ] CORS backend configuré
- [ ] Tests manuels (login, créer commande, etc.)

### Marketing Site
- [ ] App Amplify créée
- [ ] Variables configurées
- [ ] Build réussi
- [ ] Domaine custom (`www.rt-technologie.com`)
- [ ] Tests SEO

### Autres Apps (web-industry, web-transporter, etc.)
- [ ] 6 apps restantes déployées
- [ ] Toutes les variables configurées
- [ ] Builds réussis
- [ ] Domaines configurés
- [ ] CORS configuré
- [ ] Tests fonctionnels

---

## 🆘 Troubleshooting

### Build échoue avec "ENOTFOUND npm.pkg.github.com"

**Cause:** Problème de réseau ou token GitHub invalide.

**Solution:**
1. Vérifier que `GITHUB_TOKEN` est valide
2. Regénérer le token si nécessaire
3. Rebuild

### App charge mais API calls fail avec CORS error

**Cause:** Origine Amplify non autorisée dans le backend.

**Solution:**
1. Noter l'URL Amplify (dans les logs browser)
2. Ajouter l'origine dans `admin-gateway/src/index.ts`
3. Redéployer le backend
4. Re-tester

### 404 sur les routes Next.js

**Cause:** Amplify rewrites mal configurés.

**Solution:**
Vérifier dans `next.config.js`:
```js
module.exports = {
  trailingSlash: true,
  // ou
  output: 'standalone',
};
```

---

## 📞 Support

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- Support interne: Ouvrir une issue sur GitHub

---

_Guide mis à jour le 2025-11-21_
