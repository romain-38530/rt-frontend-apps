# 🔐 Guide de Configuration Stripe - v2.6.0

**Environnement**: rt-subscriptions-api-prod
**Version**: v2.6.0-jwt-stripe
**Status Actuel**: ⚠️ Clés API non configurées
**Temps estimé**: 10 minutes

---

## 📋 Prérequis

- ✅ Compte Stripe actif (https://stripe.com)
- ✅ Accès à la console AWS Elastic Beanstalk
- ✅ Backend déployé et opérationnel (Green)

---

## 🎯 Objectif

Activer les 8 endpoints Stripe pour permettre:
- ✅ Créer des sessions de paiement
- ✅ Gérer les abonnements
- ✅ Recevoir les webhooks de paiement
- ✅ Consulter l'historique des paiements

---

## 📝 Étape 1: Obtenir les Clés Stripe (2 minutes)

### 1.1 Se Connecter à Stripe

1. Aller sur https://dashboard.stripe.com
2. Se connecter avec votre compte Stripe
3. Sélectionner le mode:
   - **Test mode** (développement) - pk_test_... / sk_test_...
   - **Live mode** (production) - pk_live_... / sk_live_...

**Recommandation**: Commencer avec **Test mode** pour valider l'intégration.

### 1.2 Récupérer les Clés API

1. Aller dans **Developers → API keys** (https://dashboard.stripe.com/test/apikeys)
2. Copier les deux clés:

**Publishable key** (clé publique):
```
pk_test_51ABcde...
```
→ Cette clé sera utilisée dans votre frontend (non sensible)

**Secret key** (clé secrète):
```
sk_test_51ABcde...
```
→ **IMPORTANT**: Cette clé ne doit JAMAIS être exposée publiquement

### 1.3 Sauvegarder Temporairement

Créer un fichier local temporaire (à supprimer après):

```bash
# stripe-keys-temp.txt (NE PAS COMMITTER)
STRIPE_PUBLISHABLE_KEY=pk_test_51ABcde...
STRIPE_SECRET_KEY=sk_test_51ABcde...
```

---

## 🌐 Étape 2: Configurer le Webhook Stripe (3 minutes)

### 2.1 Créer le Endpoint Webhook

1. Aller dans **Developers → Webhooks** (https://dashboard.stripe.com/test/webhooks)
2. Cliquer sur **Add endpoint** (ou **Create endpoint**)
3. URL du endpoint:

**Pour production**:
```
http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/stripe/webhook
```

**Pour test local** (optionnel):
```
http://localhost:8080/api/stripe/webhook
```

**Recommandation**: Si vous voulez tester en local, utilisez **Stripe CLI** avec `stripe listen --forward-to localhost:8080/api/stripe/webhook`

### 2.2 Sélectionner les Événements

Cocher les événements suivants:

**Paiements**:
- ✅ `checkout.session.completed` - Session de paiement complétée
- ✅ `payment_intent.succeeded` - Paiement réussi
- ✅ `payment_intent.payment_failed` - Paiement échoué

**Abonnements**:
- ✅ `customer.subscription.created` - Abonnement créé
- ✅ `customer.subscription.updated` - Abonnement modifié
- ✅ `customer.subscription.deleted` - Abonnement annulé

**Factures**:
- ✅ `invoice.paid` - Facture payée
- ✅ `invoice.payment_failed` - Échec de paiement de facture

**Alternative**: Cocher **Select all events** pour recevoir tous les événements.

### 2.3 Récupérer le Signing Secret

1. Cliquer sur **Add endpoint**
2. Copier le **Signing secret** (whsec_...)

```
whsec_ABCdef123456...
```

3. Ajouter dans votre fichier temporaire:

```bash
# stripe-keys-temp.txt
STRIPE_PUBLISHABLE_KEY=pk_test_51ABcde...
STRIPE_SECRET_KEY=sk_test_51ABcde...
STRIPE_WEBHOOK_SECRET=whsec_ABCdef123456...
```

---

## ⚙️ Étape 3: Configurer AWS Elastic Beanstalk (3 minutes)

### Option A: Via AWS Console (Recommandé)

#### 3.1 Accéder à la Configuration

1. Aller sur https://console.aws.amazon.com/elasticbeanstalk
2. Région: **EU (Frankfurt) eu-central-1**
3. Application: **rt-subscriptions-api**
4. Environnement: **rt-subscriptions-api-prod**
5. Cliquer sur **Configuration** dans le menu de gauche

#### 3.2 Modifier les Variables d'Environnement

1. Scroller jusqu'à **Software**
2. Cliquer sur **Edit**
3. Scroller jusqu'à **Environment properties**
4. Ajouter les 4 variables suivantes:

| Name | Value |
|------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_51ABcde...` (votre clé secrète) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51ABcde...` (votre clé publique) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_ABCdef...` (votre webhook secret) |
| `FRONTEND_URL` | `https://votre-frontend.com` ou `http://localhost:3000` |

**Screenshot des champs**:
```
[Name]                      [Value]
STRIPE_SECRET_KEY           sk_test_51ABcde...
STRIPE_PUBLISHABLE_KEY      pk_test_51ABcde...
STRIPE_WEBHOOK_SECRET       whsec_ABCdef...
FRONTEND_URL                https://rt-technologie.com
```

#### 3.3 Appliquer les Modifications

1. Scroller en bas de la page
2. Cliquer sur **Apply**
3. Attendre le redéploiement (~1-2 minutes)
4. Vérifier que le status reste **Green**

---

### Option B: Via AWS CLI (Avancé)

```bash
# Configurer AWS CLI si ce n'est pas déjà fait
aws configure

# Mettre à jour les variables d'environnement
aws elasticbeanstalk update-environment \
  --environment-name rt-subscriptions-api-prod \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_SECRET_KEY,Value=sk_test_51ABcde... \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_PUBLISHABLE_KEY,Value=pk_test_51ABcde... \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRIPE_WEBHOOK_SECRET,Value=whsec_ABCdef... \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=FRONTEND_URL,Value=https://rt-technologie.com

# Vérifier le statut
aws elasticbeanstalk describe-environments \
  --environment-names rt-subscriptions-api-prod \
  --query 'Environments[0].Status'
```

---

## ✅ Étape 4: Vérifier la Configuration (2 minutes)

### 4.1 Test des Produits Stripe

```bash
# Avant configuration (erreur attendue)
curl http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/stripe/products

# Réponse AVANT:
{
  "error": "Invalid API Key"
}

# Après configuration (succès attendu)
curl http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/stripe/products

# Réponse APRÈS:
{
  "success": true,
  "products": [
    {
      "id": "prod_ABC123",
      "name": "Abonnement Transporteur",
      "description": "...",
      "active": true
    }
  ]
}
```

### 4.2 Créer un Produit de Test (Optionnel)

Si vous n'avez pas encore de produits Stripe:

1. Aller dans **Products** (https://dashboard.stripe.com/test/products)
2. Cliquer sur **Add product**
3. Remplir:
   - **Name**: `Abonnement Transporteur`
   - **Description**: `Abonnement mensuel pour transporteurs`
   - **Price**: `499` EUR (ou votre prix)
   - **Billing period**: `Monthly`
4. Cliquer sur **Add product**

### 4.3 Test de Création de Checkout Session

```bash
curl -X POST http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_ABC123",
    "successUrl": "https://rt-technologie.com/checkout/success",
    "cancelUrl": "https://rt-technologie.com/checkout/cancel"
  }'

# Réponse attendue:
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### 4.4 Test du Webhook (Optionnel)

**Via Stripe Dashboard**:
1. Aller dans **Developers → Webhooks**
2. Cliquer sur votre endpoint
3. Cliquer sur **Send test webhook**
4. Sélectionner `payment_intent.succeeded`
5. Cliquer sur **Send test webhook**

**Vérifier les logs**:
```bash
# Via AWS CLI
eb logs --all | grep "Webhook received"

# Devrait afficher:
# Webhook received: payment_intent.succeeded
```

---

## 🎯 Checklist de Validation

Cocher tous les items:

- [ ] ✅ Clés Stripe récupérées (pk_test_... et sk_test_...)
- [ ] ✅ Webhook créé sur Stripe Dashboard
- [ ] ✅ Signing secret récupéré (whsec_...)
- [ ] ✅ 4 variables ajoutées dans AWS EB Environment Properties
- [ ] ✅ Environnement redéployé (status Green)
- [ ] ✅ Endpoint `/api/stripe/products` retourne les produits
- [ ] ✅ Création de checkout session fonctionne
- [ ] ✅ Webhook Stripe répond correctement

**Si tous les items sont cochés** → Configuration Stripe complète ! ✅

---

## 🔒 Sécurité

### Best Practices

1. **Ne jamais exposer la Secret Key**
   - ❌ Ne pas committer dans Git
   - ❌ Ne pas envoyer dans le frontend
   - ✅ Utiliser uniquement côté backend

2. **Utiliser Test Mode en développement**
   - ✅ pk_test_... / sk_test_... pour dev
   - ✅ pk_live_... / sk_live_... pour production

3. **Vérifier les signatures webhook**
   - ✅ Toujours valider `stripe-signature` header
   - ✅ Utiliser `STRIPE_WEBHOOK_SECRET`

4. **Rotations des clés**
   - ✅ Régénérer les clés tous les 6-12 mois
   - ✅ Révoquer les anciennes clés après rotation

---

## 🐛 Troubleshooting

### Erreur: "Invalid API Key"

**Cause**: La clé Stripe n'est pas configurée ou est incorrecte.

**Solution**:
1. Vérifier que `STRIPE_SECRET_KEY` est bien dans les variables EB
2. Vérifier que la clé commence par `sk_test_` ou `sk_live_`
3. Régénérer une nouvelle clé sur Stripe Dashboard si nécessaire

---

### Erreur: "Webhook signature verification failed"

**Cause**: Le `STRIPE_WEBHOOK_SECRET` est incorrect ou manquant.

**Solution**:
1. Copier le secret depuis Stripe Dashboard → Webhooks → Votre endpoint
2. Vérifier que la variable `STRIPE_WEBHOOK_SECRET` est configurée
3. Redémarrer l'application EB

---

### Erreur: "No such product: prod_..."

**Cause**: Le produit Stripe n'existe pas.

**Solution**:
1. Créer un produit dans Stripe Dashboard → Products
2. Utiliser l'ID du produit créé (prod_...)
3. Vérifier que vous êtes en Test ou Live mode selon vos clés

---

### L'environnement ne redémarre pas

**Cause**: Erreur de configuration AWS EB.

**Solution**:
1. Vérifier les logs: `eb logs --all`
2. Vérifier que les variables sont bien ajoutées
3. Vérifier qu'aucune autre modification n'a été faite par erreur

---

## 📊 Résumé

| Étape | Durée | Complexité |
|-------|-------|------------|
| Obtenir clés Stripe | 2 min | 🟢 Facile |
| Configurer webhook | 3 min | 🟢 Facile |
| Configurer AWS EB | 3 min | 🟡 Moyenne |
| Tester configuration | 2 min | 🟢 Facile |
| **Total** | **10 min** | 🟢 **Facile** |

---

## 🎊 Configuration Complète

Une fois tous les tests passés:

✅ **Les 8 endpoints Stripe sont maintenant opérationnels !**

- ✅ POST /api/stripe/create-checkout-session
- ✅ POST /api/stripe/create-payment-intent
- ✅ GET /api/stripe/subscriptions
- ✅ POST /api/stripe/cancel-subscription
- ✅ GET /api/stripe/payment-history
- ✅ POST /api/stripe/webhook
- ✅ GET /api/stripe/products
- ✅ GET /api/stripe/prices

**Total endpoints actifs**: 58/58 (100%) 🎉

---

## 📚 Ressources

**Documentation Stripe**:
- API Reference: https://stripe.com/docs/api
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

**Documentation AWS**:
- Environment Properties: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/environments-cfg-softwaresettings.html

**Notre Documentation**:
- [V2.6.0_PRODUCTION_SUCCESS.md](V2.6.0_PRODUCTION_SUCCESS.md) - État de production
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Checklist déploiement

---

**Date**: 2025-11-25
**Version**: v2.6.0-jwt-stripe
**Status**: ⚠️ Configuration Stripe en attente
**Prochaine étape**: Configuration des clés API Stripe
