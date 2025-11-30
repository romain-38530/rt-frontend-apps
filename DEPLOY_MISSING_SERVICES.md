# Déploiement des Services Manquants sur AWS Elastic Beanstalk

## 📋 Situation Actuelle

### ✅ Services DÉJÀ déployés sur AWS
1. **Orders API** - `http://rt-orders-api-prod.eba-dbgatxmk.eu-central-1.elasticbeanstalk.com`
2. **Auth API (authz)** - `http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com`
3. **Geo-Tracking API** - `http://rt-geo-tracking-api-prod.eba-3mi2pcfi.eu-central-1.elasticbeanstalk.com`
4. **Notifications API** - `http://rt-notifications-api-prod.eba-usjgee8u.eu-central-1.elasticbeanstalk.com`

### ❌ Services À DÉPLOYER (requis par le frontend)
1. **Tracking API** (`../rt-backend-services/services/tracking-api`)
2. **Appointments API** (`../rt-backend-services/services/appointments-api`)
3. **Documents API** (`../rt-backend-services/services/documents-api`)
4. **Scoring API** (`../rt-backend-services/services/scoring-api`)
5. **Affret.IA API v2** (`../rt-backend-services/services/affret-ia-api-v2`)
6. **WebSocket API** (`../rt-backend-services/services/websocket-api`)

---

## 🚀 OPTION A: Déploiement Rapide via Script Automatique

### Prérequis
```bash
# 1. Installer AWS CLI
# Windows: https://awscli.amazonaws.com/AWSCLIV2.msi
# Vérifier: aws --version

# 2. Installer EB CLI
pip install awsebcli

# 3. Configurer AWS credentials
aws configure
# AWS Access Key ID: [VOTRE_KEY]
# AWS Secret Access Key: [VOTRE_SECRET]
# Default region: eu-central-1
# Default output format: json
```

### Script de Déploiement Automatique

Créez `deploy-all-services.sh` :

```bash
#!/bin/bash

# Configuration
REGION="eu-central-1"
PLATFORM="Node.js 20 running on 64bit Amazon Linux 2023"
INSTANCE_TYPE="t3.micro"
MONGODB_URI="mongodb+srv://rt_admin:RtAdmin2024@stagingrt.v2jnoh2.mongodb.net/rt-{SERVICE}?retryWrites=true&w=majority"

# Services à déployer
declare -A services
services=(
  ["tracking-api"]="rt-tracking-api:3012:rt-tracking"
  ["appointments-api"]="rt-appointments-api:3013:rt-appointments"
  ["documents-api"]="rt-documents-api:3014:rt-documents"
  ["scoring-api"]="rt-scoring-api:3016:rt-scoring"
  ["affret-ia-api-v2"]="rt-affret-ia-api:3017:rt-affret-ia"
  ["websocket-api"]="rt-websocket-api:3010:rt-websocket"
)

cd "../rt-backend-services/services"

for service_dir in "${!services[@]}"; do
  IFS=':' read -r app_name port db_name <<< "${services[$service_dir]}"

  echo "=================================================="
  echo "🚀 Déploiement de $service_dir"
  echo "=================================================="

  if [ ! -d "$service_dir" ]; then
    echo "❌ Dossier $service_dir introuvable"
    continue
  fi

  cd "$service_dir"

  # 1. Initialiser EB
  echo "📦 Initialisation EB..."
  eb init -p "$PLATFORM" -r "$REGION" "$app_name" --no-verify-ssl

  # 2. Créer environnement
  echo "🏗️  Création environnement..."
  eb create "${app_name}-prod" \
    --instance-type "$INSTANCE_TYPE" \
    --single \
    --no-verify-ssl

  # 3. Configurer variables d'environnement
  echo "⚙️  Configuration variables..."
  MONGO_URI="${MONGODB_URI/\{SERVICE\}/$db_name}"

  eb setenv \
    NODE_ENV="production" \
    PORT="$port" \
    MONGODB_URI="$MONGO_URI" \
    CORS_ALLOWED_ORIGINS="http://localhost:3000,https://main.dbg6okncuyyiw.amplifyapp.com" \
    JWT_SECRET="rt-super-secret-jwt-key-2024" \
    --no-verify-ssl

  # 4. Obtenir URL
  URL=$(eb status | grep "CNAME" | awk '{print $2}')
  echo "✅ $service_dir déployé: http://$URL"
  echo "   Port: $port"
  echo "   MongoDB: $db_name"
  echo ""

  cd ..
done

echo "=================================================="
echo "🎉 DÉPLOIEMENT TERMINÉ!"
echo "=================================================="
echo ""
echo "📝 URLs des services:"
for service_dir in "${!services[@]}"; do
  IFS=':' read -r app_name port db_name <<< "${services[$service_dir]}"
  cd "$service_dir"
  URL=$(eb status 2>/dev/null | grep "CNAME" | awk '{print $2}')
  if [ -n "$URL" ]; then
    echo "   $service_dir: http://$URL"
  fi
  cd ..
done
```

### Exécution
```bash
cd /c/Users/rtard/rt-backend-services/services
chmod +x ../../deploy-all-services.sh
../../deploy-all-services.sh
```

---

## 🔧 OPTION B: Déploiement Manuel (Service par Service)

### Exemple: Déployer Tracking API

```bash
# 1. Aller dans le dossier du service
cd /c/Users/rtard/rt-backend-services/services/tracking-api

# 2. Vérifier que le service a index.js et package.json
ls -la

# 3. Initialiser EB
eb init \
  -p "Node.js 20 running on 64bit Amazon Linux 2023" \
  -r eu-central-1 \
  rt-tracking-api

# 4. Créer l'environnement
eb create rt-tracking-api-prod \
  --instance-type t3.micro \
  --single

# 5. Configurer les variables d'environnement
eb setenv \
  NODE_ENV="production" \
  PORT="3012" \
  MONGODB_URI="mongodb+srv://rt_admin:RtAdmin2024@stagingrt.v2jnoh2.mongodb.net/rt-tracking?retryWrites=true&w=majority" \
  CORS_ALLOWED_ORIGINS="http://localhost:3000,https://main.dbg6okncuyyiw.amplifyapp.com" \
  JWT_SECRET="rt-super-secret-jwt-key-2024"

# 6. Tester
eb open
curl $(eb status | grep CNAME | awk '{print $2}')/health
```

### Répéter pour chaque service

| Service | App Name | Port | MongoDB DB |
|---------|----------|------|------------|
| tracking-api | rt-tracking-api | 3012 | rt-tracking |
| appointments-api | rt-appointments-api | 3013 | rt-appointments |
| documents-api | rt-documents-api | 3014 | rt-documents |
| scoring-api | rt-scoring-api | 3016 | rt-scoring |
| affret-ia-api-v2 | rt-affret-ia-api | 3017 | rt-affret-ia |
| websocket-api | rt-websocket-api | 3010 | rt-websocket |

---

## 📝 Après le Déploiement

### 1. Récupérer toutes les URLs

```bash
cd /c/Users/rtard/rt-backend-services/services

for dir in tracking-api appointments-api documents-api scoring-api affret-ia-api-v2 websocket-api; do
  cd "$dir"
  echo "$dir: $(eb status | grep CNAME | awk '{print $2}')"
  cd ..
done
```

### 2. Mettre à jour amplify.yml

Une fois que vous avez toutes les URLs, mettez à jour `rt-frontend-apps/amplify.yml` :

```yaml
NEXT_PUBLIC_TRACKING_API_URL: 'http://[URL-TRACKING-API]/api'
NEXT_PUBLIC_APPOINTMENTS_API_URL: 'http://[URL-APPOINTMENTS-API]/api'
NEXT_PUBLIC_DOCUMENTS_API_URL: 'http://[URL-DOCUMENTS-API]/api'
NEXT_PUBLIC_SCORING_API_URL: 'http://[URL-SCORING-API]/api'
NEXT_PUBLIC_AFFRET_API_URL: 'http://[URL-AFFRET-IA-API]/api'
NEXT_PUBLIC_WS_URL: 'ws://[URL-WEBSOCKET-API]'
```

### 3. Tester les endpoints

```bash
# Health checks
curl http://[URL-TRACKING-API]/health
curl http://[URL-APPOINTMENTS-API]/health
curl http://[URL-DOCUMENTS-API]/health
curl http://[URL-SCORING-API]/health
curl http://[URL-AFFRET-IA-API]/health
curl http://[URL-WEBSOCKET-API]/health
```

---

## 🐛 Dépannage

### Erreur: "No Application Version found"
```bash
# Recréer l'application
eb init -p "Node.js 20" -r eu-central-1 [app-name]
eb create [env-name] --instance-type t3.micro --single
```

### Erreur 502 Bad Gateway
```bash
# Vérifier les logs
eb logs

# Redéployer
eb deploy

# Vérifier les variables d'environnement
eb printenv
```

### MongoDB Connection Failed
```bash
# Vérifier que l'IP du service EB est autorisée dans MongoDB Atlas
# 1. Aller sur MongoDB Atlas → Network Access
# 2. Ajouter l'IP publique du service EB
# 3. Ou autoriser 0.0.0.0/0 (développement uniquement)
```

---

## ✅ Checklist de Déploiement

- [ ] AWS CLI installé et configuré
- [ ] EB CLI installé
- [ ] Credentials AWS configurés
- [ ] Tracking API déployé
- [ ] Appointments API déployé
- [ ] Documents API déployé
- [ ] Scoring API déployé
- [ ] Affret.IA API déployé
- [ ] WebSocket API déployé
- [ ] Toutes les URLs récupérées
- [ ] amplify.yml mis à jour avec les nouvelles URLs
- [ ] Frontend redéployé sur AWS Amplify
- [ ] Tests des endpoints réussis
- [ ] Application web fonctionnelle

---

## 💡 Recommandations

1. **Déployer un service à la fois** pour mieux identifier les problèmes
2. **Tester chaque service** avant de passer au suivant
3. **Noter toutes les URLs** dans un fichier DEPLOYED_SERVICES.md
4. **Configurer CloudWatch** pour les logs (optionnel)
5. **Mettre en place des health checks** pour le monitoring

---

**Temps estimé:** 30-60 minutes pour déployer les 6 services

**Prêt à commencer ? Laquelle des options préférez-vous ?**
