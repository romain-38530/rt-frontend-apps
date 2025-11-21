# Scripts de Déploiement Automatisé AWS Amplify

Documentation complète des scripts de déploiement automatisé pour AWS Amplify.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Scripts Disponibles](#scripts-disponibles)
- [Guide d'Utilisation](#guide-dutilisation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Ces scripts automatisent le déploiement de toutes les applications frontend sur AWS Amplify :

- **8 applications** : backoffice-admin, marketing-site, web-industry, web-transporter, web-recipient, web-supplier, web-forwarder, web-logistician
- **Configuration automatique** : Variables d'environnement, branches, builds
- **Monitoring** : Vérification de l'état de santé et des déploiements
- **Multi-plateforme** : Scripts Bash (Linux/Mac) et PowerShell (Windows)

---

## 🔧 Prérequis

### Obligatoire

1. **AWS CLI v2** installé et configuré
   ```bash
   # Vérifier l'installation
   aws --version

   # Configurer (si nécessaire)
   aws configure
   ```

2. **Credentials AWS** avec permissions Amplify
   - Access Key ID
   - Secret Access Key
   - Région : `eu-west-3` (Paris)

3. **Git** installé
   ```bash
   git --version
   ```

4. **GitHub Personal Access Token** avec scope `read:packages`
   - Nécessaire pour installer les packages privés `@rt/contracts` et `@rt/utils`
   - Définir la variable : `GITHUB_TOKEN`

### Optionnel

- **jq** : Pour parser JSON (Linux/Mac)
- **curl** : Pour tester la connectivité

---

## 📦 Installation

### 1. Cloner le Repository

```bash
cd rt-frontend-apps
```

### 2. Rendre les Scripts Exécutables (Linux/Mac)

```bash
chmod +x scripts/*.sh
```

### 3. Configurer AWS CLI

```bash
aws configure
# Entrer:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: eu-west-3
# - Default output format: json
```

### 4. Définir le GitHub Token

**Linux/Mac:**
```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

**Windows (PowerShell):**
```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
```

**Permanent (Linux/Mac):**
```bash
echo 'export GITHUB_TOKEN="ghp_your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📜 Scripts Disponibles

### 1. `deploy-amplify.sh` / `deploy-amplify.ps1`

**Script principal de déploiement automatisé**

**Fonctionnalités:**
- Créer des apps Amplify
- Configurer les branches et builds
- Définir les variables d'environnement
- Démarrer les déploiements

**Usage:**

```bash
# Linux/Mac
./scripts/deploy-amplify.sh [command] [app-name]

# Windows
.\scripts\deploy-amplify.ps1 [command] [app-name]
```

**Commandes:**
- `all` : Déployer toutes les applications
- `[app-name]` : Déployer une application spécifique
- `status` : Afficher le statut des apps déployées
- `help` : Afficher l'aide

**Exemples:**

```bash
# Déployer toutes les apps
./scripts/deploy-amplify.sh all

# Déployer uniquement backoffice-admin
./scripts/deploy-amplify.sh backoffice-admin

# Afficher le statut
./scripts/deploy-amplify.sh status
```

---

### 2. `check-deployment.sh`

**Script de vérification et monitoring**

**Fonctionnalités:**
- Vérifier l'état des apps déployées
- Tester la connectivité
- Afficher les variables d'environnement
- Vérifier les domaines personnalisés
- Health check complet

**Usage:**

```bash
./scripts/check-deployment.sh [command] [app-name]
```

**Commandes:**
- `all` : Vérifier toutes les applications
- `[app-name]` : Vérifier une application spécifique
- `logs [app-name]` : Afficher les logs
- `health` : Health check complet

**Exemples:**

```bash
# Vérifier toutes les apps
./scripts/check-deployment.sh all

# Vérifier backoffice-admin
./scripts/check-deployment.sh backoffice-admin

# Health check complet
./scripts/check-deployment.sh health

# Voir les logs
./scripts/check-deployment.sh logs backoffice-admin
```

---

### 3. `amplify-env-vars.json`

**Fichier de configuration des variables d'environnement**

Contient les variables pour chaque application :

```json
{
  "common": {
    "NEXT_PUBLIC_API_URL": "https://api.rt-technologie.com/api/v1",
    "NEXT_PUBLIC_SUPPORT_URL": "https://www.rt-technologie.com/support"
  },
  "backoffice-admin": {
    "NEXT_PUBLIC_AUTHZ_URL": "...",
    "NEXT_PUBLIC_PALETTE_API_URL": "...",
    ...
  }
}
```

**Modification:**
Éditez ce fichier pour modifier les variables d'environnement par défaut.

---

## 🚀 Guide d'Utilisation

### Scénario 1: Déploiement Initial (Toutes les Apps)

```bash
# 1. Vérifier les prérequis
aws --version
aws sts get-caller-identity

# 2. Définir le GITHUB_TOKEN
export GITHUB_TOKEN="ghp_your_token_here"

# 3. Déployer toutes les apps
./scripts/deploy-amplify.sh all

# 4. Surveiller les builds (dans la console AWS)
# https://console.aws.amazon.com/amplify/home?region=eu-west-3

# 5. Vérifier le déploiement
./scripts/check-deployment.sh all
```

**Temps estimé:** 15-20 minutes par app (parallélisable)

---

### Scénario 2: Déployer une App Spécifique

```bash
# 1. Déployer backoffice-admin
./scripts/deploy-amplify.sh backoffice-admin

# 2. Vérifier le build
./scripts/check-deployment.sh backoffice-admin

# 3. Tester l'app
# URL affichée dans le terminal : https://main.xxxxxx.amplifyapp.com
```

---

### Scénario 3: Monitoring Continu

```bash
# Health check complet
./scripts/check-deployment.sh health

# Vérifier une app spécifique
./scripts/check-deployment.sh backoffice-admin

# Afficher les logs
./scripts/check-deployment.sh logs backoffice-admin
```

---

### Scénario 4: Mise à Jour d'une App

```bash
# 1. Pousser les changements sur GitHub
git add .
git commit -m "Update feature X"
git push origin main

# 2. Amplify détecte automatiquement et déclenche un build

# 3. Vérifier le statut du build
./scripts/check-deployment.sh backoffice-admin
```

**Note:** Le CI/CD est automatique une fois l'app déployée !

---

## ⚙️ Configuration

### Configuration des Apps

Modifiez les apps à déployer dans `deploy-amplify.sh` :

```bash
declare -A APP_CONFIGS

APP_CONFIGS["backoffice-admin"]="backoffice.rt-technologie.com|apps/backoffice-admin"
APP_CONFIGS["marketing-site"]="www.rt-technologie.com|apps/marketing-site"
# ... etc
```

Format : `"app-name"="domain|app-root-path"`

---

### Variables d'Environnement

**Variables utilisées par les scripts:**

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `GITHUB_TOKEN` | Token GitHub avec scope `read:packages` | Oui |
| `AWS_ACCESS_KEY_ID` | AWS Access Key (via aws configure) | Oui |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key (via aws configure) | Oui |
| `AWS_DEFAULT_REGION` | Région AWS (eu-west-3) | Oui |

**Variables injectées dans les apps:**

Voir [amplify-env-vars.json](amplify-env-vars.json)

---

### Domaines Personnalisés

**Configurer après le déploiement:**

1. Déployer les apps avec le script
2. Dans AWS Amplify Console → Domain Management
3. Ajouter le domaine personnalisé
4. Configurer les enregistrements DNS dans Route 53 ou votre provider

**Domaines planifiés:**

- `backoffice.rt-technologie.com` → backoffice-admin
- `www.rt-technologie.com` → marketing-site
- `industry.rt-technologie.com` → web-industry
- `transporter.rt-technologie.com` → web-transporter
- `recipient.rt-technologie.com` → web-recipient
- `supplier.rt-technologie.com` → web-supplier
- `forwarder.rt-technologie.com` → web-forwarder
- `logistician.rt-technologie.com` → web-logistician

---

## 🔍 Troubleshooting

### Problème: "AWS CLI non configuré"

**Erreur:**
```
InvalidSignatureException: The request signature we calculated does not match...
```

**Solution:**
```bash
# Reconfigurer AWS CLI
aws configure

# Vérifier la configuration
aws sts get-caller-identity
```

---

### Problème: "Package @rt/contracts not found"

**Erreur:**
```
npm ERR! 404 Not Found - GET https://npm.pkg.github.com/@rt/contracts
```

**Causes:**
- `GITHUB_TOKEN` non défini
- Token sans scope `read:packages`
- Token expiré

**Solution:**
```bash
# Définir le token
export GITHUB_TOKEN="ghp_your_new_token"

# Redéployer
./scripts/deploy-amplify.sh backoffice-admin
```

---

### Problème: "Build failed: out of memory"

**Erreur:**
```
Build failed: JavaScript heap out of memory
```

**Solution:**
1. AWS Amplify Console → App Settings → Build settings
2. Edit build image settings
3. Compute: **Large (7 GB)**

---

### Problème: "App already exists"

**Erreur:**
```
⚠ L'app backoffice-admin existe déjà (ID: xxxx)
```

**Solution:**
C'est normal ! Le script détecte l'app existante et la met à jour au lieu de la recréer.

Si vous voulez vraiment recréer l'app :
```bash
# Supprimer l'app dans AWS Console
# Ou via CLI
aws amplify delete-app --app-id YOUR_APP_ID --region eu-west-3

# Redéployer
./scripts/deploy-amplify.sh backoffice-admin
```

---

### Problème: CORS errors dans le browser

**Erreur:**
```
Access to fetch at 'https://api.rt-technologie.com' has been blocked by CORS policy
```

**Cause:**
L'URL Amplify n'est pas dans la liste des origines autorisées du backend.

**Solution:**
1. Noter l'URL Amplify : `https://main.xxxxxx.amplifyapp.com`
2. Ajouter dans le backend (`admin-gateway/src/index.ts`) :
   ```typescript
   const allowedOrigins = [
     'https://main.xxxxxx.amplifyapp.com',  // Ajouter cette ligne
     'https://backoffice.rt-technologie.com',
     // ...
   ];
   ```
3. Redéployer le backend

---

### Problème: Le script ne trouve pas l'app

**Erreur:**
```
✗ Répertoire apps/web-industry non trouvé
```

**Cause:**
L'app n'existe pas encore dans le monorepo.

**Solution:**
Commentez l'app dans `deploy-amplify.sh` :

```bash
# APP_CONFIGS["web-industry"]="industry.rt-technologie.com|apps/web-industry"
```

Ou créez l'app d'abord :
```bash
cd apps
# Créer web-industry...
```

---

## 📊 Monitoring

### Via Scripts

```bash
# Health check complet
./scripts/check-deployment.sh health

# Statut de toutes les apps
./scripts/check-deployment.sh all

# Statut d'une app
./scripts/check-deployment.sh backoffice-admin
```

### Via AWS Console

1. **Amplify Console**
   - https://console.aws.amazon.com/amplify/home?region=eu-west-3
   - Vue d'ensemble : Status, URL, derniers builds

2. **CloudWatch Logs**
   - https://console.aws.amazon.com/cloudwatch/home?region=eu-west-3#logsV2:log-groups
   - Rechercher : `/aws/amplify/`

### Via CLI

```bash
# Lister toutes les apps
aws amplify list-apps --region eu-west-3

# Détails d'une app
aws amplify get-app --app-id YOUR_APP_ID --region eu-west-3

# Lister les builds
aws amplify list-jobs --app-id YOUR_APP_ID --branch-name main --region eu-west-3
```

---

## 📝 Fichiers Générés

### `.amplify-apps.txt`

Fichier de tracking généré par le script de déploiement.

**Format:**
```
app-name|app-id|app-url|custom-domain
```

**Exemple:**
```
backoffice-admin|d1a2b3c4d5e6f|https://main.d1a2b3c4d5e6f.amplifyapp.com|backoffice.rt-technologie.com
marketing-site|d7e8f9g0h1i2j|https://main.d7e8f9g0h1i2j.amplifyapp.com|www.rt-technologie.com
```

**Usage:**
- Utilisé par `check-deployment.sh` pour vérifier les apps
- Utilisé par `deploy-amplify.sh status` pour afficher le statut

---

## 🎓 Bonnes Pratiques

### 1. Toujours Tester d'Abord

```bash
# Tester sur une seule app d'abord
./scripts/deploy-amplify.sh backoffice-admin

# Si ça marche, déployer le reste
./scripts/deploy-amplify.sh all
```

### 2. Surveiller les Builds

Ne déployez pas toutes les apps en même temps si vous avez des quotas AWS limités.

### 3. Versionner le GITHUB_TOKEN

Utilisez AWS Secrets Manager ou un password manager pour stocker `GITHUB_TOKEN`.

### 4. CI/CD Automatique

Une fois déployé, chaque push sur `main` déclenche automatiquement un build.

### 5. Preview Environments

Activez les preview environments dans Amplify Console pour tester les PRs.

---

## 🔗 Liens Utiles

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS CLI Amplify Reference](https://docs.aws.amazon.com/cli/latest/reference/amplify/)
- [Next.js on Amplify](https://docs.amplify.aws/guides/hosting/nextjs)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)

---

## 📞 Support

**Problèmes avec les scripts ?**
- Ouvrir une issue sur GitHub : `rt-frontend-apps/issues`
- Consulter le [Troubleshooting](#troubleshooting) ci-dessus

**Problèmes AWS ?**
- AWS Support : https://console.aws.amazon.com/support/home

---

## 📅 Changelog

### v1.0.0 - 2025-11-21

- ✨ Script de déploiement automatisé (Bash + PowerShell)
- ✨ Script de vérification et monitoring
- ✨ Configuration centralisée des variables d'environnement
- ✨ Support de 8 applications
- ✨ Health checks automatiques
- 📝 Documentation complète

---

_Guide mis à jour le 2025-11-21_
