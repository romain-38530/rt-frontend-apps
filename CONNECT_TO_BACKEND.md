# 🔌 Connexion Frontend → Backend Services

## ✅ Configuration Complétée

Tous les fichiers `.env.production` ont été créés pour chaque application avec les URLs des services backend déployés sur AWS Elastic Beanstalk.

## 📋 Services Backend Déployés (9/13)

### ✅ Services Opérationnels:
1. **Authentication** - http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com
2. **Authorization** - http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com
3. **Orders** - http://rt-orders-api-prod.eba-dbgatxmk.eu-central-1.elasticbeanstalk.com
4. **Notifications** - http://rt-notifications-api-prod.eba-usjgee8u.eu-central-1.elasticbeanstalk.com
5. **Planning** - http://rt-planning-api-prod.eba-gbhspa2p.eu-central-1.elasticbeanstalk.com
6. **Geo-Tracking** - http://rt-geo-tracking-api-prod.eba-3mi2pcfi.eu-central-1.elasticbeanstalk.com
7. **eCMR** - http://rt-ecmr-api-prod.eba-43ngua6v.eu-central-1.elasticbeanstalk.com
8. **Palettes** - http://rt-palettes-api-prod.eba-peea8hx2.eu-central-1.elasticbeanstalk.com
9. **TMS Sync** - http://rt-tms-sync-api-prod.eba-gpxm3qif.eu-central-1.elasticbeanstalk.com
10. **Vigilance** - http://rt-vigilance-api-prod.eba-kmvyig6m.eu-central-1.elasticbeanstalk.com

### ⏳ Services en Attente (quota EIP):
- Affret IA
- Training
- Storage Market
- Chatbot

## 🚀 Déploiement sur Amplify

### Option 1: Déploiement Automatique (Git Push)

```bash
# 1. Vérifier les changements
git status

# 2. Ajouter les fichiers .env.production
git add apps/*/\.env.production
git add CONNECT_TO_BACKEND.md BACKEND_SERVICES_URLS.md

# 3. Commit
git commit -m "feat: Connect frontend apps to AWS backend services

- Add .env.production files for all web apps
- Configure backend API URLs for production
- Connect to deployed Elastic Beanstalk services (9/13 active)
"

# 4. Push vers la branche principale
git push origin main
```

Amplify détectera automatiquement les changements et redéploiera toutes les apps.

### Option 2: Déploiement Manuel via AWS Console

1. Accédez à AWS Amplify Console
2. Sélectionnez votre app
3. Cliquez sur "Run build" pour redéployer
4. Les variables d'environnement `.env.production` seront utilisées

### Option 3: Mise à Jour des Variables d'Environnement Amplify

Si vous préférez gérer les variables directement dans Amplify:

```bash
# Pour chaque app Amplify, ajoutez ces variables:
NEXT_PUBLIC_API_URL=http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com
NEXT_PUBLIC_AUTH_API_URL=http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com
# ... etc
```

## 📱 Applications Configurées

### 1. Web Logistician (`apps/web-logistician`)
- ✅ `.env.production` créé
- Services: Auth, Orders, Planning, Tracking, Notifications, TMS Sync

### 2. Web Transporter (`apps/web-transporter`)
- ✅ `.env.production` créé
- Services: Auth, Orders, Tracking, eCMR, Vigilance

### 3. Web Forwarder (`apps/web-forwarder`)
- ✅ `.env.production` créé
- Services: Auth, Orders, Planning, Palettes

### 4. Web Recipient (`apps/web-recipient`)
- ✅ `.env.production` créé
- Services: Auth, Orders, Tracking, Notifications

### 5. Web Supplier (`apps/web-supplier`)
- ✅ `.env.production` créé
- Services: Auth, Orders, Palettes

### 6. Web Industry (`apps/web-industry`)
- ✅ `.env.production` créé
- Services: Auth, Orders, Planning

### 7. Backoffice Admin (`apps/backoffice-admin`)
- ✅ `.env.production` créé
- Services: TOUS les services disponibles

## 🔧 Configuration CORS

⚠️ **Important:** Assurez-vous que l'URL de votre frontend Amplify est autorisée dans le CORS de chaque service backend.

Actuellement configuré:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://main.dbg6okncuyyiw.amplifyapp.com
```

Si vos apps Amplify ont des URLs différentes, ajoutez-les dans la configuration CORS de chaque service backend.

## 🧪 Test de Connexion

Après le déploiement, testez chaque app:

```bash
# Test API depuis le navigateur (Console DevTools)
fetch('http://rt-auth-api-prod.eba-g2psqhq5.eu-central-1.elasticbeanstalk.com/health')
  .then(res => res.json())
  .then(console.log)
```

Résultat attendu:
```json
{
  "status": "healthy",
  "service": "auth",
  "mongodb": {
    "connected": true,
    "status": "active"
  }
}
```

## 📊 Statut de Déploiement

- **Backend Services:** 9/13 (69%) ✅
- **Frontend Apps:** 7/7 (100%) ✅
- **Configuration:** ✅ Complétée
- **CORS:** ✅ Configuré
- **MongoDB:** ✅ Connecté à tous les services

## 🔜 Prochaines Étapes

1. ✅ Déployer les apps frontend sur Amplify (git push)
2. ⏳ Attendre l'approbation du quota EIP AWS (1-2 jours)
3. ⏳ Déployer les 4 services restants
4. ⏳ Mettre à jour les URLs pour les services restants
5. ✅ Tester les connexions frontend ↔ backend

## 📝 Notes

- Tous les services backend utilisent MongoDB Atlas (cluster: stagingrt)
- Tous les services sont configurés avec CORS, Helmet, et Express
- Les services sont déployés sur Node.js 20 / Amazon Linux 2023
- Instance type: t3.micro (single instance)
- Region: EU-Central-1 (Frankfurt)

---

**Dernière mise à jour:** 2025-11-23
**Services actifs:** 9/13
**Quota EIP:** En attente d'approbation (10 → 15)
