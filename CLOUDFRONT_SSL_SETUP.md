# Configuration SSL pour CloudFront - SYMPHONI.A

## 🎯 Objectif

Remplacer le certificat auto-signé actuel de CloudFront par un certificat SSL valide pour éliminer les warnings de sécurité dans les navigateurs.

## 📋 État Actuel

**CloudFront Distribution:** `d2i50a1vlg138w`
**URL:** `https://d2i50a1vlg138w.cloudfront.net`
**Backend:** `rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com`
**Problème:** Certificat auto-signé → Warning SSL dans les navigateurs
**Impact:** Utilisateurs doivent utiliser `-k` avec curl, warnings dans les navigateurs

## 🔐 Solutions SSL

### Option 1: AWS Certificate Manager (ACM) - Recommandé

**Avantages:**
- ✅ Gratuit
- ✅ Renouvellement automatique
- ✅ Intégration native avec CloudFront
- ✅ Support multi-domaines (SAN)
- ✅ Validé par AWS

**Inconvénients:**
- ⚠️ Nécessite un domaine personnalisé
- ⚠️ Validation DNS ou Email requise

#### Étape 1: Demander un Certificat ACM

**Important:** Les certificats CloudFront doivent être créés dans la région `us-east-1`.

```bash
# Créer le certificat dans us-east-1
aws acm request-certificate \
  --domain-name api.rttechnologie.com \
  --subject-alternative-names "*.rttechnologie.com" "rttechnologie.com" \
  --validation-method DNS \
  --region us-east-1 \
  --tags Key=Project,Value=SYMPHONIA Key=Environment,Value=Production

# Résultat: Retourne un CertificateArn
# Exemple: arn:aws:acm:us-east-1:004843574253:certificate/12345678-1234-1234-1234-123456789012
```

#### Étape 2: Valider le Certificat via DNS

```bash
# Obtenir les enregistrements DNS pour validation
aws acm describe-certificate \
  --certificate-arn <CERTIFICATE_ARN> \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord'

# Résultat:
# [
#   {
#     "Name": "_abc123.api.rttechnologie.com",
#     "Type": "CNAME",
#     "Value": "_xyz456.acm-validations.aws"
#   }
# ]
```

**Ajouter l'enregistrement DNS:**

1. **Via Route 53** (si domaine hébergé sur AWS):
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://dns-validation.json
```

Fichier `dns-validation.json`:
```json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "_abc123.api.rttechnologie.com",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{
        "Value": "_xyz456.acm-validations.aws"
      }]
    }
  }]
}
```

2. **Via Registrar externe** (OVH, Gandi, etc.):
   - Se connecter au panneau de contrôle DNS
   - Ajouter un enregistrement CNAME:
     - **Nom:** `_abc123.api`
     - **Type:** CNAME
     - **Valeur:** `_xyz456.acm-validations.aws`
     - **TTL:** 300

#### Étape 3: Attendre la Validation

```bash
# Vérifier le statut
aws acm describe-certificate \
  --certificate-arn <CERTIFICATE_ARN> \
  --region us-east-1 \
  --query 'Certificate.Status'

# Résultat attendu après 5-10 minutes: "ISSUED"
```

#### Étape 4: Configurer CloudFront

**Méthode A: Via AWS Console**

1. Aller sur https://console.aws.amazon.com/cloudfront
2. Sélectionner la distribution `d2i50a1vlg138w`
3. Cliquer sur `Edit`
4. Section `SSL Certificate`:
   - Sélectionner `Custom SSL Certificate`
   - Choisir le certificat ACM créé
5. Section `Alternate Domain Names (CNAMEs)`:
   - Ajouter: `api.rttechnologie.com`
6. Cliquer sur `Save Changes`
7. Attendre le déploiement (~5-10 minutes)

**Méthode B: Via AWS CLI**

```bash
# Obtenir la configuration actuelle
aws cloudfront get-distribution-config \
  --id d2i50a1vlg138w \
  > cloudfront-config.json

# Modifier le fichier JSON (voir exemple ci-dessous)

# Mettre à jour la distribution
aws cloudfront update-distribution \
  --id d2i50a1vlg138w \
  --if-match <ETAG_FROM_GET> \
  --distribution-config file://cloudfront-config-updated.json
```

Modifications dans `cloudfront-config-updated.json`:
```json
{
  "Aliases": {
    "Quantity": 1,
    "Items": ["api.rttechnologie.com"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:004843574253:certificate/...",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
```

#### Étape 5: Configurer le DNS pour le Domaine

**Route 53:**
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://dns-cname.json
```

Fichier `dns-cname.json`:
```json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.rttechnologie.com",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{
        "Value": "d2i50a1vlg138w.cloudfront.net"
      }]
    }
  }]
}
```

**Registrar externe:**
- Ajouter un enregistrement CNAME:
  - **Nom:** `api`
  - **Type:** CNAME
  - **Valeur:** `d2i50a1vlg138w.cloudfront.net`
  - **TTL:** 300

#### Étape 6: Mettre à Jour les Variables d'Environnement

**Marketing Site:**
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.rttechnologie.com
NEXT_PUBLIC_VAT_API_URL=https://api.rttechnologie.com
NEXT_PUBLIC_SUBSCRIPTIONS_API_URL=https://api.rttechnologie.com
```

**Déployer les changements:**
```bash
git add apps/marketing-site/.env.production
git commit -m "feat: Utiliser le domaine personnalisé avec SSL pour l'API"
git push origin main
```

#### Étape 7: Tester

```bash
# Test 1: Vérifier le certificat SSL
curl -v https://api.rttechnologie.com 2>&1 | grep "SSL certificate"

# Résultat attendu: "SSL certificate verify ok"

# Test 2: Tester l'endpoint onboarding
curl -X POST "https://api.rttechnologie.com/api/onboarding/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-ssl@example.com",
    "companyName": "Test SSL Company"
  }'

# Résultat attendu: 201 Created (sans -k flag)

# Test 3: Vérifier dans navigateur
# Ouvrir: https://api.rttechnologie.com/health
# Résultat: Cadenas vert dans la barre d'adresse
```

### Option 2: Let's Encrypt (Alternative)

**Avantages:**
- ✅ Gratuit
- ✅ Open-source
- ✅ Largement reconnu

**Inconvénients:**
- ⚠️ Renouvellement manuel tous les 90 jours
- ⚠️ Configuration plus complexe avec CloudFront
- ⚠️ Nécessite certbot ou équivalent

**Non recommandé** pour CloudFront car ACM est gratuit, automatique et mieux intégré.

### Option 3: Certificat Commercial

**Avantages:**
- ✅ Support technique
- ✅ Assurance étendue
- ✅ Validation EV possible (barre verte)

**Inconvénients:**
- ❌ Coût annuel (100€ - 1000€+)
- ⚠️ Renouvellement payant

**Fournisseurs:**
- DigiCert
- GlobalSign
- Sectigo
- GeoTrust

**Non recommandé** car ACM est gratuit et équivalent pour la plupart des cas.

## 🔧 Configuration Avancée CloudFront

### Security Headers

Ajouter des headers de sécurité via CloudFront Functions:

```javascript
function handler(event) {
  var response = event.response;
  var headers = response.headers;

  // Strict Transport Security
  headers['strict-transport-security'] = {
    value: 'max-age=31536000; includeSubdomains; preload'
  };

  // Content Security Policy
  headers['content-security-policy'] = {
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
  };

  // X-Frame-Options
  headers['x-frame-options'] = {
    value: 'DENY'
  };

  // X-Content-Type-Options
  headers['x-content-type-options'] = {
    value: 'nosniff'
  };

  // Referrer Policy
  headers['referrer-policy'] = {
    value: 'strict-origin-when-cross-origin'
  };

  return response;
}
```

### HTTPS Enforcement

**Redirect HTTP to HTTPS:**

Configuration CloudFront:
- `Viewer Protocol Policy`: `Redirect HTTP to HTTPS`

Ou via Behavior:
```json
{
  "ViewerProtocolPolicy": "redirect-to-https"
}
```

### TLS Version

**Minimum TLS Version:** TLSv1.2_2021

**Pourquoi ?**
- TLS 1.0/1.1 sont dépréciés
- TLS 1.2+ requis pour PCI-DSS
- TLS 1.3 pour meilleures performances

```json
{
  "ViewerCertificate": {
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
```

## 📊 Monitoring SSL

### CloudWatch Metrics

**Métriques à surveiller:**
- `Requests`: Nombre de requêtes HTTPS
- `4xxErrorRate`: Taux d'erreurs client
- `5xxErrorRate`: Taux d'erreurs serveur
- `OriginLatency`: Latence vers le backend

### SSL Labs Test

```bash
# Tester la configuration SSL
curl "https://api.ssllabs.com/api/v3/analyze?host=api.rttechnologie.com"

# Ou via navigateur:
# https://www.ssllabs.com/ssltest/analyze.html?d=api.rttechnologie.com

# Score attendu: A ou A+
```

### Certificate Expiration Monitoring

**CloudWatch Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name certificate-expiration-warning \
  --alarm-description "Alert when SSL certificate expires soon" \
  --metric-name DaysToExpiry \
  --namespace AWS/CertificateManager \
  --statistic Minimum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 30 \
  --comparison-operator LessThanThreshold \
  --region us-east-1
```

## 💰 Coûts

### AWS Certificate Manager (ACM)
- **Coût:** 0€ (gratuit pour CloudFront/ALB)
- **Renouvellement:** Automatique et gratuit

### CloudFront Data Transfer
- **IN:** Gratuit
- **OUT:** ~0,085€/GB (Europe)
- **Requêtes HTTPS:** ~0,012€/10,000 requêtes

**Estimation mensuelle** (pour 1M requêtes + 10GB):
- Requêtes: 1,000,000 / 10,000 × 0,012€ = 1,20€
- Data Transfer: 10GB × 0,085€ = 0,85€
- **Total:** ~2€/mois

## ✅ Checklist SSL

- [ ] Domaine personnalisé acheté/configuré
- [ ] Certificat ACM demandé dans us-east-1
- [ ] Validation DNS effectuée
- [ ] Certificat émis (status: ISSUED)
- [ ] CloudFront configuré avec certificat ACM
- [ ] CNAME ajouté pour le domaine
- [ ] DNS propagé (vérifier avec nslookup)
- [ ] Variables d'environnement mises à jour
- [ ] Frontend redéployé avec nouveau domaine
- [ ] Tests SSL passés (curl sans -k)
- [ ] SSL Labs score A/A+
- [ ] CloudWatch alarms configurés
- [ ] Documentation mise à jour

## 🐛 Troubleshooting

### Erreur: "Certificate not valid for domain"

**Cause:** Le certificat ne contient pas le domaine dans les SAN
**Solution:** Recréer le certificat avec tous les domaines nécessaires

### Erreur: "SSL certificate problem: self signed certificate"

**Cause:** CloudFront utilise encore le certificat auto-signé
**Solution:** Vérifier que le certificat ACM est bien assigné dans CloudFront

### Erreur: "DNS resolution failed"

**Cause:** Le CNAME n'est pas configuré ou pas encore propagé
**Solution:**
```bash
# Vérifier la propagation DNS
nslookup api.rttechnologie.com
# Ou
dig api.rttechnologie.com CNAME

# Attendre jusqu'à 48h pour propagation complète (généralement 1-2h)
```

### Erreur: "Too many certificates requested"

**Cause:** Limite ACM atteinte (20 certificats par compte)
**Solution:** Utiliser des certificats wildcard ou supprimer les anciens

## 📝 Notes

**Date de création:** 26 Novembre 2025
**Responsable:** DevOps Team
**Durée estimée:** 2-4 heures (incluant propagation DNS)
**Dépendances:** Domaine personnalisé requis

---

**💡 Recommandation:** Utiliser ACM avec un domaine personnalisé `api.rttechnologie.com` pour une solution professionnelle, sécurisée et gratuite.
