# 🚀 Guide de déploiement rapide - API d'authentification

## Option A: Déploiement automatisé (RECOMMANDÉ) ⚡

### Prérequis
1. **AWS CLI** configuré avec vos credentials
2. **EB CLI** (Elastic Beanstalk CLI) installé
3. **MongoDB Atlas** compte créé (gratuit)

### Installation des outils

```powershell
# AWS CLI (si pas déjà installé)
winget install Amazon.AWSCLI

# Configurer AWS CLI
aws configure
# Entrez: Access Key, Secret Key, Region (eu-central-1), Format (json)

# EB CLI
pip install awsebcli

# Vérifier
eb --version
```

### Déploiement en 1 commande

```powershell
cd apps/api-auth
.\deploy-to-eb.ps1
```

**Le script va:**
1. ✅ Vérifier que les outils sont installés
2. ✅ Vous guider pour configurer MongoDB Atlas
3. ✅ Générer un JWT secret sécurisé
4. ✅ Configurer CORS pour tous vos portails
5. ✅ Initialiser Elastic Beanstalk
6. ✅ Créer l'environnement de production
7. ✅ Déployer l'API
8. ✅ Tester l'API
9. ✅ Vous donner l'URL finale

**Temps estimé:** 10-15 minutes (dont 5-10 min d'attente AWS)

---

## Option B: Déploiement manuel 📝

Si vous préférez contrôler chaque étape, suivez le guide complet:
👉 [apps/api-auth/ELASTIC_BEANSTALK_DEPLOY.md](apps/api-auth/ELASTIC_BEANSTALK_DEPLOY.md)

---

## Après le déploiement

### 1. Mettre à jour les applications frontend

Une fois l'API déployée, exécutez:

```powershell
.\update-amplify-api-url.ps1 -ApiUrl "https://rt-auth-api-prod.eu-central-1.elasticbeanstalk.com"
```

Remplacez l'URL par celle donnée par le script de déploiement.

**Le script va:**
- Mettre à jour `NEXT_PUBLIC_API_URL` dans les 6 applications Amplify
- Déclencher automatiquement le redéploiement
- Afficher les IDs de jobs pour le suivi

### 2. Créer un utilisateur de test

```bash
curl -X POST https://rt-auth-api-prod.eu-central-1.elasticbeanstalk.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rt-technologie.com",
    "password": "Admin123!",
    "name": "Admin RT",
    "portal": "industry"
  }'
```

### 3. Tester la connexion

1. Allez sur un de vos portails: https://main.dbg6okncuyyiw.amplifyapp.com
2. Utilisez les identifiants créés à l'étape 2
3. Vous devriez être connecté! ✅

---

## MongoDB Atlas - Setup rapide

### Étape 1: Créer un compte
👉 https://www.mongodb.com/cloud/atlas/register

### Étape 2: Créer un cluster gratuit
- Plan: **M0 Free**
- Provider: **AWS**
- Région: **eu-central-1 (Frankfurt)**
- Nom: `rt-auth-cluster`

### Étape 3: Créer un utilisateur
- Database Access → Add New User
- Username: `rtadmin`
- Password: Générez un mot de passe fort
- Privileges: "Read and write to any database"

### Étape 4: Autoriser l'accès réseau
- Network Access → Add IP Address
- "Allow Access from Anywhere" (0.0.0.0/0)
- ⚠️ En production, limitez aux IPs de votre Elastic Beanstalk

### Étape 5: Obtenir la chaîne de connexion
- Database → Connect → "Connect your application"
- Copiez l'URI: `mongodb+srv://rtadmin:<password>@rt-auth-cluster...`
- Remplacez `<password>` par votre mot de passe
- Ajoutez `/rt-auth` à la fin

**Exemple final:**
```
mongodb+srv://rtadmin:MonMotDePasse123@rt-auth-cluster.abc123.mongodb.net/rt-auth?retryWrites=true&w=majority
```

---

## Commandes utiles

### Voir les logs
```bash
cd apps/api-auth
eb logs
```

### Voir les logs en temps réel
```bash
eb logs --stream
```

### Voir le statut
```bash
eb status
```

### Redéployer après modifications
```bash
eb deploy
```

### Ouvrir l'API dans le navigateur
```bash
eb open
```

### Supprimer l'environnement (⚠️ DANGER)
```bash
eb terminate rt-auth-api-prod
```

---

## Troubleshooting

### ❌ "EB CLI not found"
```powershell
pip install awsebcli
```

### ❌ "AWS credentials not configured"
```powershell
aws configure
```

### ❌ L'API ne démarre pas après déploiement
```bash
eb logs
# Vérifiez les erreurs de connexion MongoDB
```

### ❌ Erreur CORS depuis le frontend
Vérifiez que les URLs Amplify sont bien dans `CORS_ORIGIN`:
```bash
eb printenv
# Doit contenir vos URLs Amplify
```

Mettez à jour si nécessaire:
```bash
eb setenv CORS_ORIGIN="https://main.d123.amplifyapp.com,https://main.d456.amplifyapp.com"
```

### ❌ MongoDB connection error
- Vérifiez que 0.0.0.0/0 est autorisé dans MongoDB Atlas > Network Access
- Vérifiez que le mot de passe est correct dans `MONGODB_URI`
- Vérifiez qu'il n'y a pas de caractères spéciaux non encodés

---

## Coûts estimés

| Service | Plan | Coût |
|---------|------|------|
| **MongoDB Atlas** | M0 (512 MB) | **Gratuit** ✅ |
| **AWS Elastic Beanstalk** | Tier gratuit | **Gratuit 12 mois** ✅ |
| **EC2 t3.micro** | Après tier gratuit | ~5-10€/mois |

**Total pendant 12 mois: GRATUIT** 🎉

---

## Architecture déployée

```
┌─────────────────────────────────────────────────────┐
│                   Internet                          │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────────────┐
│         AWS Elastic Beanstalk (eu-central-1)        │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Load Balancer (Application LB)            │    │
│  └──────────────┬─────────────────────────────┘    │
│                 │                                    │
│                 ▼                                    │
│  ┌────────────────────────────────────────────┐    │
│  │  EC2 Instance (t3.micro)                   │    │
│  │  ┌──────────────────────────────────────┐  │    │
│  │  │  Node.js 20                          │  │    │
│  │  │  Express API                         │  │    │
│  │  │  Port: 8080                          │  │    │
│  │  └──────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└───────────────────┬──────────────────────────────────┘
                    │
                    │ MongoDB Protocol
                    ▼
┌─────────────────────────────────────────────────────┐
│         MongoDB Atlas (eu-central-1)                 │
│         Cluster: rt-auth-cluster (M0 Free)          │
│         Database: rt-auth                            │
└─────────────────────────────────────────────────────┘


Frontend Apps (AWS Amplify) ──> API (EB) ──> MongoDB (Atlas)
      Static Sites               Node.js      Database
```

---

## Sécurité en production

### ✅ À faire avant la production

1. **Restreindre CORS**
   - Listez uniquement vos domaines réels
   - Pas de wildcard `*`

2. **Restreindre MongoDB**
   - Network Access: IPs spécifiques de votre EB
   - Pas de 0.0.0.0/0

3. **Domaine personnalisé**
   - Configurez un domaine: `api.rt-technologie.com`
   - Via Route 53 + Certificate Manager

4. **Monitoring**
   - Activez CloudWatch Alarms
   - Configurez SNS pour les alertes

5. **Backup MongoDB**
   - Atlas fait des backups automatiques (M0 = 1 jour de rétention)
   - Pour plus: upgradez vers M2/M5

6. **Secrets Manager**
   - Stockez JWT_SECRET dans AWS Secrets Manager
   - Au lieu de variable d'environnement

---

**🎉 Vous êtes prêt! Lancez le déploiement avec `.\deploy-to-eb.ps1` !**
