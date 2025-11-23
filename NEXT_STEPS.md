# 🎯 Prochaines Étapes - Déploiement Complet

## Statut Actuel ✅

### Fait
- ✅ Système d'authentification MongoDB créé pour les 6 portails
- ✅ API d'authentification préparée pour Elastic Beanstalk
- ✅ Scripts de déploiement automatisés créés
- ✅ EB CLI installé et configuré
- ✅ AWS CLI configuré (Account: 004843574253)
- ✅ Marketing site optimisé et prêt
- ✅ Documentation complète créée

### En attente
- ⏳ Création du compte MongoDB Atlas
- ⏳ Déploiement de l'API sur Elastic Beanstalk
- ⏳ Mise à jour des portails avec l'URL de l'API
- ⏳ Déploiement du marketing site

---

## 🚀 Étape 1: Créer MongoDB Atlas (5 minutes)

### Actions requises par l'utilisateur:

1. **Créer un compte MongoDB Atlas**
   - Allez sur: https://www.mongodb.com/cloud/atlas/register
   - Utilisez votre email: romain@rt-technologie.com (ou autre)
   - Créez un mot de passe sécurisé

2. **Créer un cluster gratuit (M0)**
   - Cliquez sur "Build a Database"
   - Sélectionnez **FREE** (M0 Sandbox - 512 MB)
   - Provider: **AWS**
   - Région: **eu-central-1 (Frankfurt)** ⚠️ Important: même région que vos apps
   - Nom du cluster: `rt-auth-cluster`
   - Cliquez "Create"

3. **Créer un utilisateur de base de données**
   - Menu: Database Access → "Add New Database User"
   - Username: `rtadmin`
   - Cliquez "Autogenerate Secure Password" → **COPIEZ LE MOT DE PASSE**
   - Privileges: "Read and write to any database"
   - Cliquez "Add User"

4. **Autoriser l'accès réseau**
   - Menu: Network Access → "Add IP Address"
   - Cliquez "Allow Access from Anywhere"
   - Confirm (0.0.0.0/0)
   - ⚠️ Note: En production, limitez aux IPs de votre Elastic Beanstalk

5. **Obtenir la chaîne de connexion**
   - Menu: Database → Cliquez "Connect" sur votre cluster
   - "Connect your application"
   - Driver: Node.js
   - Copiez l'URI: `mongodb+srv://rtadmin:<password>@...`
   - Remplacez `<password>` par votre mot de passe (étape 3)
   - Ajoutez `/rt-auth` à la fin

**Format final attendu:**
```
mongodb+srv://rtadmin:VotreMotDePasse@rt-auth-cluster.xxxxx.mongodb.net/rt-auth?retryWrites=true&w=majority
```

⚠️ **Gardez cette URI MongoDB pour l'étape suivante!**

---

## 🚀 Étape 2: Déployer l'API sur Elastic Beanstalk (10 minutes)

### Option A: Script Automatisé (RECOMMANDÉ)

```powershell
cd apps/api-auth
.\deploy-to-eb.ps1
```

Le script vous demandera:
1. **MongoDB URI** → Entrez l'URI de l'étape 1
2. Puis il fera tout automatiquement:
   - Génération JWT secret
   - Configuration CORS
   - Initialisation EB
   - Création environnement
   - Déploiement
   - Test

**Temps estimé:** 10-15 minutes (dont 5-10 min d'attente AWS)

### Option B: Commandes Manuelles

```powershell
cd apps/api-auth

# Ajouter EB CLI au PATH
$env:PATH += ";C:\Users\rtard\AppData\Roaming\Python\Python314\Scripts"

# 1. Initialiser EB
eb init
# Region: 14 (eu-central-1)
# App name: rt-auth-api
# Platform: Node.js
# Platform version: Node.js 20
# SSH: n

# 2. Créer l'environnement
eb create rt-auth-api-prod
# Attendre 5-10 minutes...

# 3. Configurer les variables (REMPLACEZ <MONGODB_URI> par la vôtre!)
eb setenv `
  MONGODB_URI="<MONGODB_URI>" `
  JWT_SECRET="$(openssl rand -base64 32)" `
  NODE_ENV="production" `
  CORS_ORIGIN="https://main.dbg6okncuyyiw.amplifyapp.com,https://main.d1tb834u144p4r.amplifyapp.com,https://main.d3b6p09ihn5w7r.amplifyapp.com,https://main.dzvo8973zaqb.amplifyapp.com,https://main.d3hz3xvddrl94o.amplifyapp.com,https://main.d31p7m90ewg4xm.amplifyapp.com"

# 4. Déployer
eb deploy

# 5. Obtenir l'URL
eb status
# Cherchez la ligne "CNAME:" → c'est votre URL API!
```

### Vérifier le déploiement

```powershell
# Remplacez par votre URL
curl https://rt-auth-api-prod.eu-central-1.elasticbeanstalk.com/health
# Devrait retourner: {"status":"ok","message":"RT Auth API is running"}
```

---

## 🚀 Étape 3: Mettre à jour les portails (2 minutes)

Une fois l'API déployée, exécutez:

```powershell
# Remplacez par l'URL de votre API
.\update-amplify-api-url.ps1 -ApiUrl "https://rt-auth-api-prod.eu-central-1.elasticbeanstalk.com"
```

Cela va:
- Mettre à jour `NEXT_PUBLIC_API_URL` dans les 6 applications Amplify
- Déclencher automatiquement le redéploiement
- Afficher les job IDs pour le suivi

**Temps estimé:** 2 minutes + 5-10 min de build par app

---

## 🚀 Étape 4: Tester l'authentification (5 minutes)

### 4.1 Créer un utilisateur test

```powershell
# Remplacez <API_URL> par votre URL
curl -X POST https://<API_URL>/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@rt-technologie.com",
    "password": "Admin123!",
    "name": "Admin RT",
    "portal": "industry"
  }'
```

### 4.2 Tester la connexion

1. Allez sur: https://main.dbg6okncuyyiw.amplifyapp.com (web-industry)
2. Utilisez:
   - Email: `admin@rt-technologie.com`
   - Password: `Admin123!`
3. ✅ Vous devriez voir le dashboard!

### 4.3 Tester tous les portails

Répétez pour:
- 🚚 Transporter: https://main.d1tb834u144p4r.amplifyapp.com
- 📦 Recipient: https://main.d3b6p09ihn5w7r.amplifyapp.com
- 🏪 Supplier: https://main.dzvo8973zaqb.amplifyapp.com
- 🌐 Forwarder: https://main.d3hz3xvddrl94o.amplifyapp.com
- 📊 Logistician: https://main.d31p7m90ewg4xm.amplifyapp.com

---

## 🚀 Étape 5: Déployer le Marketing Site (10 minutes)

### Via AWS Amplify Console

1. **Accéder à AWS Amplify**
   - https://eu-central-1.console.aws.amazon.com/amplify/
   - Région: eu-central-1

2. **Créer une nouvelle app**
   - "New app" → "Host web app"
   - Source: GitHub
   - Repository: `rt-frontend-apps`
   - Branch: `main`

3. **Configuration du monorepo**
   - Amplify détecte automatiquement `apps/marketing-site`
   - App root: `apps/marketing-site`
   - Build spec: utilise `apps/marketing-site/amplify.yml`

4. **Variables d'environnement**

   Ajoutez:
   ```
   GITHUB_TOKEN = <votre token GitHub avec read:packages>
   NEXT_PUBLIC_SITE_URL = https://www.rt-technologie.com
   NEXT_PUBLIC_PORTAL_INDUSTRY = https://main.dbg6okncuyyiw.amplifyapp.com
   NEXT_PUBLIC_PORTAL_TRANSPORTER = https://main.d1tb834u144p4r.amplifyapp.com
   NEXT_PUBLIC_PORTAL_RECIPIENT = https://main.d3b6p09ihn5w7r.amplifyapp.com
   NEXT_PUBLIC_PORTAL_SUPPLIER = https://main.dzvo8973zaqb.amplifyapp.com
   NEXT_PUBLIC_PORTAL_FORWARDER = https://main.d3hz3xvddrl94o.amplifyapp.com
   NEXT_PUBLIC_PORTAL_LOGISTICIAN = https://main.d31p7m90ewg4xm.amplifyapp.com
   ```

5. **Déployer**
   - Sauvegarder et déployer
   - Attendre 5-10 minutes

6. **Configurer le domaine (optionnel)**
   - Domain management → Add domain
   - Domain: `rt-technologie.com`
   - Subdomain: `www`
   - Suivre les instructions DNS

---

## 📊 Checklist Finale

### API d'authentification
- [ ] Compte MongoDB Atlas créé
- [ ] Cluster MongoDB créé (eu-central-1)
- [ ] Utilisateur DB créé
- [ ] Accès réseau configuré (0.0.0.0/0)
- [ ] URI MongoDB obtenue
- [ ] API déployée sur Elastic Beanstalk
- [ ] Variables d'environnement configurées
- [ ] Test `/health` réussi
- [ ] URL API notée

### Portails (6 apps)
- [ ] Variable `NEXT_PUBLIC_API_URL` mise à jour
- [ ] Redéploiement déclenché
- [ ] Builds réussis (vérifier AWS Amplify Console)
- [ ] Utilisateur test créé
- [ ] Connexion testée sur les 6 portails
- [ ] Dashboard affiché correctement

### Marketing Site
- [ ] App Amplify créée
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Site accessible
- [ ] SEO testé
- [ ] Domaine configuré (optionnel)

---

## 🛠️ Commandes Utiles

### API (Elastic Beanstalk)
```powershell
cd apps/api-auth

# Voir les logs
eb logs

# Logs en temps réel
eb logs --stream

# Statut
eb status

# Redéployer
eb deploy

# Ouvrir dans le navigateur
eb open
```

### Portails (AWS Amplify)
```powershell
# Vérifier les builds
aws amplify list-jobs --app-id dbg6okncuyyiw --branch-name main --region eu-central-1

# Déclencher un nouveau build
aws amplify start-job --app-id dbg6okncuyyiw --branch-name main --job-type RELEASE --region eu-central-1
```

---

## 💰 Coûts Estimés

| Service | Tier | Coût mensuel |
|---------|------|--------------|
| MongoDB Atlas M0 | Free | **0 €** ✅ |
| AWS Elastic Beanstalk | Tier gratuit 12 mois | **0 €** ✅ |
| AWS Amplify (7 apps) | Tier gratuit | **0 €** ✅ |
| EC2 (après tier gratuit) | t3.micro | ~5-10 € |

**Total pendant 12 mois: GRATUIT** 🎉

---

## 🆘 Support

### Problèmes courants

**MongoDB connection error**
- Vérifiez 0.0.0.0/0 dans Network Access
- Vérifiez le mot de passe (pas de caractères spéciaux non encodés)

**API ne démarre pas**
```powershell
eb logs
# Cherchez les erreurs MongoDB ou build
```

**CORS errors depuis le frontend**
```powershell
eb printenv | grep CORS_ORIGIN
# Doit contenir toutes vos URLs Amplify
```

**Build failed sur Amplify**
- Vérifiez `GITHUB_TOKEN` (doit avoir `read:packages`)
- Vérifiez les logs dans Amplify Console

### Documentation

- 📘 [Guide rapide](QUICK_START_DEPLOY.md)
- 📘 [Guide détaillé EB](apps/api-auth/ELASTIC_BEANSTALK_DEPLOY.md)
- 📘 [Guide auth](AUTH_SETUP.md)

---

**🎉 Prêt à déployer! Commencez par l'étape 1: Créer MongoDB Atlas**
