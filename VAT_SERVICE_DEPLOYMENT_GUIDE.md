# 🚀 Guide de Déploiement - Service de Validation TVA

## 📋 Vue d'ensemble

Ce guide explique comment déployer le service de validation TVA depuis le repository `rt-backend-services` vers AWS Elastic Beanstalk et le connecter au frontend.

---

## ✅ Prérequis

- [x] Service VAT développé dans `rt-backend-services`
- [x] AWS CLI configuré avec les credentials appropriés
- [x] EB CLI installé (`pip install awsebcli`)
- [x] Accès au repository `rt-backend-services`
- [x] Frontend configuré (FAIT dans rt-frontend-apps)

---

## 🔧 Étape 1: Préparer le service pour le déploiement

### 1.1 Localiser le service dans rt-backend-services

```bash
cd ~/rt-backend-services
# Le service pourrait être dans un dossier comme:
# - vat-validation-service/
# - services/vat-validation/
# - api-vat-validation/
```

### 1.2 Vérifier la structure du service

Le service devrait avoir:
```
vat-validation-service/
├── package.json
├── server.js (ou index.js)
├── .ebextensions/ (optionnel)
└── .elasticbeanstalk/ (sera créé)
```

### 1.3 Vérifier les variables d'environnement requises

Le service nécessite:
```bash
# MongoDB
MONGODB_URI=mongodb+srv://...

# API INSEE (pour France)
INSEE_API_KEY=votre_clé_insee

# Configuration
NODE_ENV=production
PORT=8080  # Obligatoire pour Elastic Beanstalk
```

---

## 🚀 Étape 2: Déployer sur AWS Elastic Beanstalk

### 2.1 Initialiser Elastic Beanstalk

```bash
cd vat-validation-service/  # ou le nom approprié

# Initialiser EB
eb init -p node.js-20 \
  --region eu-central-1 \
  rt-vat-validation-api

# Sélectionner:
# - Region: eu-central-1
# - Platform: Node.js 20
# - Application name: rt-vat-validation-api
```

### 2.2 Créer l'environnement de production

```bash
# Créer l'environnement
eb create rt-vat-validation-api-prod \
  --instance-type t3.micro \
  --region eu-central-1 \
  --cname rt-vat-validation-api-prod

# Cette commande va:
# 1. Créer l'environnement AWS
# 2. Déployer le code
# 3. Attribuer une URL (CNAME)
# 4. Démarrer l'application
```

### 2.3 Configurer les variables d'environnement

```bash
# Définir les variables d'environnement
eb setenv \
  MONGODB_URI="mongodb+srv://..." \
  INSEE_API_KEY="votre_clé" \
  NODE_ENV="production" \
  PORT="8080"

# Redémarrer pour appliquer
eb deploy
```

### 2.4 Récupérer l'URL du service

```bash
eb status

# Chercher la ligne CNAME:
# CNAME: rt-vat-validation-api-prod.eba-xxxxxxxx.eu-central-1.elasticbeanstalk.com

# Ou directement:
eb status | grep CNAME | awk '{print $2}'
```

**⚠️ IMPORTANT:** Noter cette URL complète pour l'étape 3.

---

## 🔗 Étape 3: Connecter le frontend au service

### 3.1 Mettre à jour .env.production dans marketing-site

```bash
cd ~/rt-frontend-apps/apps/marketing-site

# Éditer .env.production
nano .env.production
```

Remplacer la ligne PLACEHOLDER:
```bash
# AVANT
NEXT_PUBLIC_VAT_API_URL=http://rt-vat-validation-api-prod.PLACEHOLDER.eu-central-1.elasticbeanstalk.com

# APRÈS (avec l'URL réelle obtenue à l'étape 2.4)
NEXT_PUBLIC_VAT_API_URL=http://rt-vat-validation-api-prod.eba-abc123.eu-central-1.elasticbeanstalk.com
```

### 3.2 Configurer AWS Amplify

Trouver l'App ID du marketing-site:
```bash
aws amplify list-apps --region eu-central-1 | grep marketing -A 5
```

Mettre à jour les variables d'environnement Amplify:
```bash
# Remplacer <APP_ID> par l'ID trouvé ci-dessus
# Remplacer <URL_VAT> par l'URL du service VAT

aws amplify update-app \
  --app-id <APP_ID> \
  --environment-variables \
    NEXT_PUBLIC_VAT_API_URL=http://rt-vat-validation-api-prod.eba-abc123.eu-central-1.elasticbeanstalk.com \
  --region eu-central-1
```

### 3.3 Committer et déployer

```bash
cd ~/rt-frontend-apps

git add apps/marketing-site/.env.production
git commit -m "feat: Configure VAT service endpoint for production"
git push origin main

# Amplify va automatiquement redéployer le marketing-site
```

---

## ✅ Étape 4: Vérification et tests

### 4.1 Tester le service VAT directement

```bash
# Tester le health check
curl http://rt-vat-validation-api-prod.eba-abc123.eu-central-1.elasticbeanstalk.com/api/health

# Tester la validation TVA (exemple avec TVA française)
curl -X POST \
  http://rt-vat-validation-api-prod.eba-abc123.eu-central-1.elasticbeanstalk.com/api/vat/validate \
  -H "Content-Type: application/json" \
  -d '{"vatNumber": "FR41948816988"}'

# Réponse attendue:
# {
#   "valid": true,
#   "countryCode": "FR",
#   "vatNumber": "41948816988",
#   "name": "...",
#   "address": "..."
# }
```

### 4.2 Tester depuis le frontend

1. Aller sur https://rttechnologie.com/onboarding
2. Entrer un numéro de TVA valide (ex: FR41948816988)
3. Cliquer sur "Vérifier et continuer"
4. Vérifier que les données sont pré-remplies automatiquement

### 4.3 Surveiller les logs

```bash
# Depuis le dossier du service VAT
eb logs

# Ou en temps réel
eb logs --stream
```

---

## 🔍 Dépannage

### Le service ne démarre pas

```bash
# Vérifier les logs
eb logs

# Vérifier l'état
eb status

# Redéployer
eb deploy
```

### Erreur de connexion MongoDB

```bash
# Vérifier les variables d'environnement
eb printenv

# Mettre à jour la connexion MongoDB
eb setenv MONGODB_URI="mongodb+srv://nouvelle_uri"
```

### Le frontend ne se connecte pas au service

1. Vérifier que l'URL dans `.env.production` est correcte
2. Vérifier que la variable est configurée dans AWS Amplify
3. Vérifier que le service VAT est accessible (curl)
4. Vérifier les logs du navigateur (F12 > Console)

### CORS errors

Le service VAT doit autoriser les requêtes depuis le domaine du frontend:
```javascript
// Dans le service VAT (server.js)
app.use(cors({
  origin: [
    'https://rttechnologie.com',
    'http://localhost:3000'
  ]
}));
```

---

## 📊 Monitoring

### Vérifier la santé du service

```bash
# Via EB CLI
eb health

# Via AWS Console
eb console
# Puis: Environment > Monitoring
```

### Logs et métriques

```bash
# Logs récents
eb logs

# Monitoring en temps réel
eb ssh
tail -f /var/log/nodejs/nodejs.log
```

---

## 🔄 Mises à jour ultérieures

Pour déployer des mises à jour du service VAT:

```bash
cd ~/rt-backend-services/vat-validation-service/

# Pull les derniers changements
git pull origin main

# Déployer
eb deploy rt-vat-validation-api-prod

# Vérifier
eb status
```

---

## 📝 Checklist finale

- [ ] Service VAT déployé sur AWS EB
- [ ] URL du service récupérée (rt-vat-validation-api-prod.eba-XXXXX...)
- [ ] .env.production mis à jour avec l'URL réelle
- [ ] Variables Amplify configurées
- [ ] Code commité et poussé
- [ ] Tests manuels réussis
- [ ] Health check OK
- [ ] Validation TVA fonctionne depuis le frontend

---

## 🎯 Résultat attendu

Une fois toutes les étapes complétées:

1. ✅ Le service VAT est accessible sur: `http://rt-vat-validation-api-prod.eba-XXXXX.eu-central-1.elasticbeanstalk.com`
2. ✅ Le frontend marketing-site utilise ce service pour la validation TVA
3. ✅ L'onboarding automatisé fonctionne comme prévu
4. ✅ Les données entreprise sont pré-remplies automatiquement

---

**Auteur:** Claude (Assistant IA)
**Date:** 2025-11-24
**Version:** 1.0
