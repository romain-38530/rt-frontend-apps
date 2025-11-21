# 🚀 Quick Start - Déploiement AWS Amplify

Guide rapide pour déployer toutes les applications frontend en 5 minutes.

---

## ⚡ Démarrage Rapide

### 1. Prérequis

```bash
# Vérifier AWS CLI
aws --version

# Configurer AWS (si nécessaire)
aws configure
```

### 2. Configuration Initiale

**Linux/Mac:**
```bash
# Exécuter l'assistant de configuration
./scripts/setup.sh
```

**Windows (PowerShell):**
```powershell
# Vérifier AWS CLI
aws --version

# Configurer si nécessaire
aws configure
```

### 3. Définir le GitHub Token

```bash
# Linux/Mac
export GITHUB_TOKEN="ghp_your_token_here"

# Windows (PowerShell)
$env:GITHUB_TOKEN = "ghp_your_token_here"
```

**Comment obtenir un GitHub Token:**
1. Allez sur https://github.com/settings/tokens
2. Generate new token (classic)
3. Cochez: `read:packages`
4. Générez et copiez le token

---

## 🎯 Déploiement

### Option A: Déployer Toutes les Apps

**Linux/Mac:**
```bash
./scripts/deploy-amplify.sh all
```

**Windows (PowerShell):**
```powershell
.\scripts\deploy-amplify.ps1 all
```

### Option B: Déployer une App Spécifique

**Exemple: Backoffice Admin**

```bash
# Linux/Mac
./scripts/deploy-amplify.sh backoffice-admin

# Windows (PowerShell)
.\scripts\deploy-amplify.ps1 backoffice-admin
```

**Apps disponibles:**
- `backoffice-admin`
- `marketing-site`
- `web-industry`
- `web-transporter`
- `web-recipient`
- `web-supplier`
- `web-forwarder`
- `web-logistician`

---

## ✅ Vérification

### Vérifier le Déploiement

```bash
# Linux/Mac
./scripts/check-deployment.sh all

# Pour une app spécifique
./scripts/check-deployment.sh backoffice-admin
```

### Health Check Complet

```bash
./scripts/check-deployment.sh health
```

### Voir les URLs Déployées

```bash
# Linux/Mac
./scripts/deploy-amplify.sh status

# Windows (PowerShell)
.\scripts\deploy-amplify.ps1 status
```

---

## 🌐 URLs d'Accès

Une fois déployées, les apps seront accessibles sur :

### URLs Temporaires Amplify

Format : `https://main.[app-id].amplifyapp.com`

Exemples :
- `https://main.d1a2b3c4d5e6f.amplifyapp.com` (backoffice-admin)
- `https://main.d7e8f9g0h1i2j.amplifyapp.com` (marketing-site)

### URLs Personnalisées (après configuration DNS)

- `https://backoffice.rt-technologie.com` → Backoffice Admin
- `https://www.rt-technologie.com` → Marketing Site
- `https://industry.rt-technologie.com` → Industry Portal
- `https://transporter.rt-technologie.com` → Transporter Portal
- `https://recipient.rt-technologie.com` → Recipient Portal
- `https://supplier.rt-technologie.com` → Supplier Portal
- `https://forwarder.rt-technologie.com` → Forwarder Portal
- `https://logistician.rt-technologie.com` → Logistician Portal

---

## 🔧 Configuration des Domaines Personnalisés

### Via AWS Console

1. **Ouvrir AWS Amplify Console**
   - https://console.aws.amazon.com/amplify/home?region=eu-central-1

2. **Pour chaque app:**
   - Cliquer sur l'app
   - Domain management → Add domain
   - Entrer le domaine (ex: `backoffice.rt-technologie.com`)
   - AWS génère les enregistrements DNS

3. **Configurer DNS dans Route 53 (ou votre provider)**
   ```
   backoffice.rt-technologie.com  CNAME  xxxxx.cloudfront.net
   www.rt-technologie.com         CNAME  yyyyy.cloudfront.net
   ```

4. **Attendre la validation SSL**
   - AWS génère automatiquement un certificat SSL
   - Validation : 5-10 minutes

---

## 🔍 Monitoring

### Voir les Logs d'un Build

```bash
./scripts/check-deployment.sh logs backoffice-admin
```

### Surveiller les Builds

**AWS Amplify Console:**
- https://console.aws.amazon.com/amplify/home?region=eu-central-1
- Cliquer sur l'app → Build history

**CloudWatch Logs:**
- https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1#logsV2:log-groups
- Chercher : `/aws/amplify/`

---

## 🔄 CI/CD Automatique

Une fois déployé, **chaque push sur `main` déclenche automatiquement un build** !

```bash
# Faire des modifications
git add .
git commit -m "Update feature X"
git push origin main

# Amplify détecte le push et build automatiquement
# Surveillez dans la console AWS Amplify
```

---

## ❌ Troubleshooting

### Problème: "Package @rt/contracts not found"

**Solution:**
```bash
# Définir GITHUB_TOKEN
export GITHUB_TOKEN="ghp_your_token_here"

# Redéployer
./scripts/deploy-amplify.sh backoffice-admin
```

### Problème: "Build failed: out of memory"

**Solution:**
1. AWS Amplify Console → App → Build settings
2. Edit build image settings
3. Compute: **Large (7 GB)**

### Problème: CORS Errors

**Solution:**
Ajouter l'URL Amplify dans le backend (`admin-gateway/src/index.ts`) :
```typescript
const allowedOrigins = [
  'https://main.d1234abc.amplifyapp.com',  // Ajouter
  'https://backoffice.rt-technologie.com',
  // ...
];
```

### Plus de Solutions

Consultez la documentation complète : [scripts/README.md](scripts/README.md#troubleshooting)

---

## 📚 Documentation Complète

- **Scripts de Déploiement:** [scripts/README.md](scripts/README.md)
- **Guide de Déploiement:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Documentation du Projet:** [README.md](README.md)

---

## 🎯 Checklist de Déploiement

### Backoffice Admin
- [ ] App déployée sur Amplify
- [ ] Variables d'environnement configurées
- [ ] Build réussi (vert dans AWS Console)
- [ ] URL accessible (`https://main.[app-id].amplifyapp.com`)
- [ ] Domaine personnalisé configuré (`backoffice.rt-technologie.com`)
- [ ] DNS configuré
- [ ] SSL activé (cadenas vert)
- [ ] CORS configuré dans le backend
- [ ] Test de connexion : Login fonctionne

### Marketing Site
- [ ] App déployée sur Amplify
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] URL accessible
- [ ] Domaine personnalisé (`www.rt-technologie.com`)
- [ ] DNS configuré
- [ ] SSL activé
- [ ] Test : Page d'accueil s'affiche correctement

### Autres Apps (6 portails)
- [ ] 6 apps restantes déployées
- [ ] Variables configurées
- [ ] Builds réussis
- [ ] URLs accessibles
- [ ] Domaines configurés
- [ ] Tests fonctionnels

---

## 💡 Conseils

1. **Déployez d'abord backoffice-admin** pour tester le processus
2. **Surveillez les builds** dans AWS Console
3. **Testez les URLs** avant de configurer les domaines
4. **Configurez CORS** dans le backend après le déploiement
5. **Activez les Preview Environments** pour tester les PRs

---

## 📞 Besoin d'Aide ?

- **Documentation:** [scripts/README.md](scripts/README.md)
- **Troubleshooting:** [scripts/README.md#troubleshooting](scripts/README.md#troubleshooting)
- **Issues GitHub:** Ouvrir une issue sur le repository
- **AWS Support:** https://console.aws.amazon.com/support/home

---

**Temps estimé pour déployer toutes les apps:** 1-2 heures

**Temps estimé par app:** 10-15 minutes

---

_Guide mis à jour le 2025-11-21_
