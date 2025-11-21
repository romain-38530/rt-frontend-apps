# 🎯 Guide de Déploiement Manuel AWS Amplify

Guide pas à pas pour déployer **backoffice-admin** via AWS Console avec OAuth GitHub.

---

## 📋 Prérequis

✅ Compte AWS configuré
✅ Repository GitHub: `romain-38530/rt-frontend-apps`
✅ GitHub Token: `ghp_YOUR_GITHUB_TOKEN_HERE` (pour packages privés)

---

## 🚀 Étape 1: Ouvrir AWS Amplify Console

**URL directe:** https://console.aws.amazon.com/amplify/home?region=eu-central-1

Ou manuellement :
1. Allez sur https://console.aws.amazon.com/
2. Connectez-vous avec vos credentials AWS
3. Dans la barre de recherche en haut, tapez **"Amplify"**
4. Cliquez sur **"AWS Amplify"**
5. Vérifiez que la région est **"eu-central-1 (Europe Francfort)"** en haut à droite

---

## 📱 Étape 2: Créer une Nouvelle App

1. **Cliquez sur:** `New app` (bouton orange en haut à droite)
2. **Sélectionnez:** `Host web app`

![Nouveau App](https://docs.aws.amazon.com/images/amplify/latest/userguide/images/amplify-gettingstarted-1.png)

---

## 🔗 Étape 3: Connecter le Repository GitHub

### 3.1 Sélectionner le Provider

1. **Sélectionnez:** `GitHub`
2. **Cliquez sur:** `Continue`

### 3.2 Autoriser AWS Amplify (OAuth)

**Une popup GitHub s'ouvre:**

1. **Connectez-vous à GitHub** si nécessaire
2. **Autorisez AWS Amplify** à accéder à vos repositories
3. **Important:** Sélectionnez l'organisation `julienSpitaleri` si demandé
4. **Cliquez sur:** `Authorize aws-amplify-console`

⏳ **Attendez quelques secondes** pendant que GitHub se connecte...

---

## 📂 Étape 4: Sélectionner Repository et Branch

### 4.1 Repository

**Dans le dropdown "Recently updated repositories":**

1. **Sélectionnez:** `romain-38530/rt-frontend-apps`

### 4.2 Branch

1. **Sélectionnez:** `main`

### 4.3 Détection Monorepo

✅ Amplify détecte automatiquement le monorepo !

**Vous devriez voir:**
```
✓ Monorepo detected
```

**Cliquez sur:** `Next`

---

## ⚙️ Étape 5: Configurer le Build (Monorepo)

### 5.1 App Name

**Champ "App name":**
```
backoffice-admin
```

### 5.2 Monorepo Configuration

✅ **Cochez:** `My app is a monorepo`

**Champ "Monorepo path":**
```
apps/backoffice-admin
```

### 5.3 Build Settings

Amplify devrait détecter automatiquement le fichier `amplify.yml`.

**Vérifiez que "Build specification" montre:**
```yaml
version: 1
applications:
  - appRoot: apps/backoffice-admin
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm
            - cd ../..
            - pnpm install
            - cd apps/backoffice-admin
        build:
          commands:
            - pnpm run build
            ...
```

**Si le fichier n'est pas détecté automatiquement**, copiez-collez ce contenu dans l'éditeur :

```yaml
version: 1
applications:
  - appRoot: apps/backoffice-admin
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm
            - cd ../..
            - pnpm install
            - cd apps/backoffice-admin
        build:
          commands:
            - pnpm run build
            - mkdir -p deploy
            - cp -r .next/standalone/apps/backoffice-admin/* deploy/
            - cp -r .next/standalone/apps/backoffice-admin/.next deploy/
            - cp -r .next/static deploy/.next/static
            - cp -r public deploy/public || true
            - ls -la deploy/
            - ls -la deploy/.next/
            - test -f deploy/.next/required-server-files.json && echo "required-server-files.json present" || echo "ERROR required-server-files.json missing"
      artifacts:
        baseDirectory: deploy
        files:
          - '**/*'
      cache:
        paths:
          - ../../node_modules/**/*
          - .next/cache/**/*
```

**Cliquez sur:** `Next`

---

## 🔐 Étape 6: Configurer les Variables d'Environnement

**Section "Environment variables":**

Cliquez sur `Add environment variable` et ajoutez **TOUTES** ces variables :

| Variable Name | Value |
|--------------|-------|
| `GITHUB_TOKEN` | `ghp_YOUR_GITHUB_TOKEN_HERE` |
| `NEXT_PUBLIC_API_URL` | `https://api.rt-technologie.com/api/v1` |
| `NEXT_PUBLIC_AUTHZ_URL` | `https://api.rt-technologie.com/api/v1/auth` |
| `NEXT_PUBLIC_PALETTE_API_URL` | `https://api.rt-technologie.com/api/v1/palettes` |
| `NEXT_PUBLIC_STORAGE_MARKET_API_URL` | `https://api.rt-technologie.com/api/v1/storage` |
| `NEXT_PUBLIC_PLANNING_API` | `https://api.rt-technologie.com/api/v1/planning` |
| `NEXT_PUBLIC_ECMR_API` | `https://api.rt-technologie.com/api/v1/ecmr` |
| `NEXT_PUBLIC_ORDERS_API` | `https://api.rt-technologie.com/api/v1/orders` |
| `NEXT_PUBLIC_CHATBOT_API_URL` | `https://api.rt-technologie.com/api/v1/chatbot` |
| `NEXT_PUBLIC_CHATBOT_WS_URL` | `wss://api.rt-technologie.com/chatbot/ws` |
| `NEXT_PUBLIC_ADMIN_EMAIL` | `admin@rt-technologie.com` |
| `NEXT_PUBLIC_SUPPORT_URL` | `https://www.rt-technologie.com/support` |

**Important:**
- Pour `GITHUB_TOKEN`, cochez la case **"Secret"** pour le masquer
- Les autres variables peuvent rester en "Plain text"

---

## 🎛️ Étape 7: Configuration Avancée (Optionnel)

### 7.1 Service Role

**Laissez par défaut** ou sélectionnez un rôle IAM existant si vous en avez un.

### 7.2 Build Settings

- ✅ **Auto-deploy**: `Enabled` (recommandé - CI/CD automatique)
- **Build image**: `Amazon Linux 2023` (par défaut)
- **Compute**:
  - **Standard (3 GB)** pour commencer
  - Si le build échoue avec "out of memory", changez pour **Large (7 GB)**

---

## ✅ Étape 8: Révision et Déploiement

### 8.1 Vérification Finale

**Vérifiez que tout est correct:**

- ✅ Repository: `romain-38530/rt-frontend-apps`
- ✅ Branch: `main`
- ✅ App name: `backoffice-admin`
- ✅ Monorepo path: `apps/backoffice-admin`
- ✅ Variables d'environnement: 12 variables configurées

### 8.2 Lancer le Déploiement

**Cliquez sur:** `Save and deploy`

⏳ **Le déploiement démarre automatiquement !**

---

## 📊 Étape 9: Surveiller le Build

### 9.1 Phases du Build

Vous verrez 3 phases :

1. **Provision** (30 secondes) ⏳
   - Création de l'environnement de build

2. **Build** (5-10 minutes) ⏳
   - Installation des dépendances (pnpm install)
   - Build de l'application (pnpm build)

3. **Deploy** (1-2 minutes) ⏳
   - Upload vers CloudFront CDN
   - Configuration des domaines

### 9.2 Suivre les Logs

**Pour voir les logs en temps réel:**

1. Cliquez sur la phase en cours (ex: "Build")
2. Les logs s'affichent automatiquement
3. **Recherchez:**
   - ✅ `preBuild completed` → Dépendances installées
   - ✅ `Build completed successfully` → Build réussi
   - ✅ `Deployment completed` → Déploiement terminé

### 9.3 Erreurs Courantes

**Si "Package @rt/contracts not found":**
- Vérifiez que `GITHUB_TOKEN` est bien configuré
- Vérifiez que le token est marqué comme "Secret"
- Re-déployez manuellement (bouton "Redeploy this version")

**Si "Out of memory":**
1. Aller dans `App settings` → `Build settings`
2. Cliquer sur `Edit`
3. Changer Compute à **Large (7 GB)**
4. Re-déployer

---

## 🌐 Étape 10: Accéder à l'Application

### 10.1 URL Amplify Temporaire

Une fois le déploiement terminé (✅ vert), votre app est accessible !

**Format d'URL:**
```
https://main.[app-id].amplifyapp.com
```

**Exemple:**
```
https://main.d1a2b3c4d5.amplifyapp.com
```

**Pour trouver votre URL:**
1. Dans AWS Amplify Console
2. Cliquez sur votre app `backoffice-admin`
3. L'URL est affichée en haut sous le nom de l'app

### 10.2 Tester l'Application

**Ouvrez l'URL dans votre navigateur** et vérifiez :

- ✅ La page de login s'affiche
- ✅ Pas d'erreurs 404
- ✅ Les styles CSS sont chargés
- ✅ Testez le login avec un compte test

---

## 🔧 Étape 11: Configurer un Domaine Personnalisé (Optionnel)

### 11.1 Ajouter le Domaine

**Dans AWS Amplify Console:**

1. Cliquez sur votre app `backoffice-admin`
2. Menu de gauche → `Domain management`
3. Cliquez sur `Add domain`

### 11.2 Configuration

1. **Domain**: `rt-technologie.com`
2. **Subdomain prefix**: `backoffice`
3. **Cliquez sur:** `Configure domain`

### 11.3 DNS Configuration

AWS génère automatiquement les enregistrements DNS :

```
Type: CNAME
Name: backoffice.rt-technologie.com
Value: xxxxx.cloudfront.net
```

**Dans votre DNS provider (Route 53, Cloudflare, etc.):**

1. Ajoutez un enregistrement CNAME
2. Name: `backoffice`
3. Value: La valeur CloudFront fournie par AWS
4. TTL: 300 (5 minutes)

### 11.4 Validation SSL

AWS génère automatiquement un certificat SSL.

⏳ **Attendre 5-10 minutes** pour la validation du certificat.

Une fois validé, votre app sera accessible sur :
```
https://backoffice.rt-technologie.com
```

---

## 🔄 Étape 12: CI/CD Automatique

### 12.1 Webhook Configuré

✅ AWS Amplify a créé automatiquement un webhook sur GitHub !

**Vérifier:**
1. Allez sur GitHub → `romain-38530/rt-frontend-apps`
2. `Settings` → `Webhooks`
3. Vous devriez voir un webhook AWS Amplify

### 12.2 Auto-Deploy

**Désormais, chaque fois que vous pushez sur `main`:**

```bash
git add .
git commit -m "Update feature"
git push origin main
```

**AWS Amplify détecte automatiquement et lance un build ! 🎉**

---

## 📈 Étape 13: Monitoring

### 13.1 Dashboard Amplify

**Métriques disponibles:**
- Nombre de builds
- Taux de succès
- Temps de build moyen
- Traffic (visites)

### 13.2 CloudWatch Logs

**Pour des logs plus détaillés:**

1. AWS Console → `CloudWatch`
2. `Logs` → `Log groups`
3. Cherchez: `/aws/amplify/[app-id]`

### 13.3 Alertes (Optionnel)

**Configurer des alertes par email:**

1. Dans Amplify Console → `Monitoring`
2. `Set up notification`
3. Entrez votre email
4. Choisissez les événements (build failed, deploy failed, etc.)

---

## ✅ Checklist Finale

- [ ] App `backoffice-admin` créée sur AWS Amplify
- [ ] Repository GitHub connecté via OAuth
- [ ] Monorepo configuré (`apps/backoffice-admin`)
- [ ] 12 variables d'environnement configurées
- [ ] Premier build réussi ✅ (vert)
- [ ] URL Amplify accessible (`https://main.[app-id].amplifyapp.com`)
- [ ] Page de login s'affiche correctement
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] DNS configuré (optionnel)
- [ ] SSL validé (optionnel)
- [ ] Webhook GitHub actif (auto-deploy)
- [ ] Test de commit → push → auto-deploy

---

## 🎉 Félicitations !

Votre application **backoffice-admin** est maintenant déployée sur AWS Amplify ! 🚀

**Prochaines étapes:**

1. Déployer les autres apps (marketing-site, web-industry, etc.)
2. Configurer CORS dans le backend si nécessaire
3. Tester toutes les fonctionnalités
4. Configurer les domaines personnalisés pour toutes les apps

---

## 🆘 Besoin d'Aide ?

**Déploiement bloqué ?**
- Consultez les logs dans AWS Console
- Vérifiez [Troubleshooting](QUICK_START_DEPLOYMENT.md#troubleshooting)

**Questions ?**
- Documentation AWS: https://docs.amplify.aws/
- Support: Ouvrir une issue GitHub

---

_Guide créé le 2025-11-21_
