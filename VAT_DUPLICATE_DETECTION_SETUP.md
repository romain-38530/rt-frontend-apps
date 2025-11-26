# Configuration de la Détection de Doublons de Numéro de TVA

## 🎯 Objectif

Empêcher l'inscription multiple d'une même entreprise en utilisant le numéro de TVA comme identifiant unique.

## 📋 Date de Configuration

**Date :** 26 Novembre 2025
**Version Backend :** v2.4.0-vat-duplicate-detection
**Version Frontend :** Commits 99ff94d, f3889f5, 9d0ef38

---

## 🔧 Modifications Backend

### 1. Index Unique MongoDB

**Fichier :** `rt-backend-services/services/authz-eb/scripts/setup-mongodb-unique-indexes.js`

**Configuration :**
```javascript
db.collection('onboarding_requests').createIndex(
  { vatNumber: 1 },
  {
    unique: true,
    name: 'vatNumber_unique_idx',
    background: true,
    sparse: true  // Permet les valeurs null
  }
)
```

**Caractéristiques :**
- ✅ Index unique sur le champ `vatNumber`
- ✅ `sparse: true` - Autorise plusieurs documents avec `vatNumber: null`
- ✅ Bloque les insertions avec le même numéro de TVA
- ✅ Génère une erreur MongoDB code 11000 en cas de doublon

### 2. Script de Nettoyage des Doublons

**Fichier :** `rt-backend-services/services/authz-eb/scripts/cleanup-vat-duplicates.js`

**Fonctionnalités :**
- Recherche tous les doublons de numéro de TVA
- Garde le document le plus ancien (par `createdAt`)
- Supprime automatiquement les doublons récents
- Affiche un rapport détaillé

**Exécution :**
```bash
cd rt-backend-services/services/authz-eb
node scripts/cleanup-vat-duplicates.js
```

**Résultat lors de la première exécution :**
```
⚠️  2 numéro(s) de TVA en double trouvé(s):

📋 TVA: FR21350675567 (2 occurrences)
   ✅ GARDER: r.tardy@rt-groupe.com
   🗑️  SUPPRIMÉ: r.tardy@rt-groupe.com (doublon)

📋 TVA: FR12345678901 (2 occurrences)
   ✅ GARDER: test@example.com
   🗑️  SUPPRIMÉ: test@symphonia.com (doublon)

✅ Nettoyage terminé !
   - 2 doublon(s) supprimé(s)
```

### 3. Gestion d'Erreur Backend Améliorée

**Fichier :** `rt-backend-services/services/authz-eb/index.js`

**Avant :**
```javascript
if (dbError.code === 11000) {
  return res.status(409).json({
    success: false,
    error: {
      code: 'DUPLICATE_REQUEST',
      message: 'An onboarding request with this email already exists'
    }
  });
}
```

**Après :**
```javascript
if (dbError.code === 11000) {
  const duplicateField = dbError.keyValue;
  let errorMessage = 'An onboarding request already exists';

  if (duplicateField && duplicateField.vatNumber) {
    errorMessage = `Cette entreprise (TVA: ${duplicateField.vatNumber}) est déjà enregistrée dans notre système`;
  } else if (duplicateField && duplicateField.email) {
    errorMessage = `Cette adresse email (${duplicateField.email}) est déjà enregistrée dans notre système`;
  }

  return res.status(409).json({
    success: false,
    error: {
      code: 'DUPLICATE_REQUEST',
      message: errorMessage,
      field: duplicateField ? Object.keys(duplicateField)[0] : 'unknown'
    }
  });
}
```

**Améliorations :**
- ✅ Détecte automatiquement le champ en double (`email` ou `vatNumber`)
- ✅ Message d'erreur personnalisé avec le numéro de TVA
- ✅ Retourne le champ problématique dans `error.field`
- ✅ Support multilingue (message en français pour TVA)

---

## 🎨 Modifications Frontend

### 1. Gestion des Erreurs Améliorée

**Fichier :** `apps/marketing-site/src/app/onboarding/page.tsx`

**Code ligne 118-136 :**
```typescript
const submitOnboarding = async () => {
  setLoading(true);
  setError('');

  try {
    const response = await fetch(`${apiUrl}/api/onboarding/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success) {
      router.push(`/onboarding/success?requestId=${data.requestId}&email=${encodeURIComponent(data.email)}`);
    } else {
      let errorMessage = data.error?.message || data.error || 'Erreur lors de la soumission';

      if (response.status === 409 || data.error?.code === 'DUPLICATE_REQUEST') {
        errorMessage = `Cette entreprise (TVA: ${formData.vatNumber}) est déjà enregistrée dans notre système. Utilisez un autre numéro de TVA ou contactez le support si vous pensez qu'il s'agit d'une erreur.`;
      } else if (response.status === 400) {
        errorMessage = data.error?.message || 'Données invalides. Veuillez vérifier vos informations.';
      } else if (response.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer dans quelques instants.';
      }

      setError(errorMessage);
    }
  } catch (err) {
    setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
  } finally {
    setLoading(false);
  }
};
```

**Améliorations :**
- ✅ Détection du code HTTP 409 Conflict
- ✅ Détection du code d'erreur `DUPLICATE_REQUEST`
- ✅ Message d'erreur personnalisé avec le numéro de TVA
- ✅ Suggestion de contacter le support
- ✅ Gestion différenciée par type d'erreur (400, 409, 500)

### 2. Affichage Visuel des Erreurs

**Code ligne 682-700 :**
```typescript
{error && (
  <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <p className="text-red-900 font-bold text-lg mb-1">Erreur</p>
        <p className="text-red-800 text-sm">{error}</p>
        {error.includes('TVA') || error.includes('DUPLICATE') || error.includes('déjà') ? (
          <p className="text-red-700 text-xs mt-2">
            💡 Ce numéro de TVA est déjà enregistré dans notre système.
            Si vous pensez qu'il s'agit d'une erreur, contactez notre support.
          </p>
        ) : null}
      </div>
    </div>
  </div>
)}
```

**Caractéristiques visuelles :**
- 🔴 Fond rouge clair avec bordure rouge
- ❌ Icône X en rouge
- 📝 Titre "Erreur" en gras
- 💡 Message d'aide contextuel pour les doublons de TVA
- 📱 Design responsive

---

## 🧪 Tests Effectués

### Test 1 : Première Inscription

**Requête :**
```bash
POST https://d2i50a1vlg138w.cloudfront.net/api/onboarding/submit
{
  "email": "test-duplicate@example.com",
  "companyName": "Test Duplicate Detection",
  "vatNumber": "FR99988877766",
  "siret": "99988877766655",
  "phone": "+33123456789",
  "address": "123 Test Street, 75001 Paris",
  "subscriptionType": "premium",
  "source": "WEB"
}
```

**Résultat :**
```json
{
  "success": true,
  "message": "Onboarding request submitted successfully",
  "requestId": "6926dd59cd0dd9c8e4ab885d",
  "email": "test-duplicate@example.com",
  "companyName": "Test Duplicate Detection",
  "status": "pending",
  "createdAt": "2025-11-26T10:58:33.244Z"
}
```

✅ **Statut :** 201 Created - SUCCESS

### Test 2 : Tentative de Doublon

**Requête :**
```bash
POST https://d2i50a1vlg138w.cloudfront.net/api/onboarding/submit
{
  "email": "autre-email@example.com",
  "companyName": "Autre Nom Entreprise",
  "vatNumber": "FR99988877766",  # ⚠️ MÊME numéro de TVA
  "siret": "11122233344455",
  "phone": "+33987654321",
  "address": "456 Different Street, 69001 Lyon",
  "subscriptionType": "basic",
  "source": "WEB"
}
```

**Résultat :**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_REQUEST",
    "message": "Cette entreprise (TVA: FR99988877766) est déjà enregistrée dans notre système",
    "field": "vatNumber"
  }
}
```

✅ **Statut :** 409 Conflict - BLOCKED

---

## 📊 État MongoDB

### Index Actuels

```bash
use rt-auth
db.onboarding_requests.getIndexes()
```

**Résultat :**
```javascript
[
  {
    v: 2,
    key: { _id: 1 },
    name: '_id_'
  },
  {
    v: 2,
    key: { vatNumber: 1 },
    name: 'vatNumber_unique_idx',
    unique: true,
    sparse: true
  }
]
```

### Statistiques Collection

- **Total de documents :** 7
- **Documents avec numéro de TVA :** 7
- **Doublons existants :** 0

---

## 🚀 Déploiement

### Backend

**Environnement :** AWS Elastic Beanstalk
**Application :** rt-authz-api
**Environnement :** rt-authz-api-prod
**Version :** v2.4.0-vat-duplicate-detection

**Commandes de déploiement :**
```bash
cd rt-backend-services/services/authz-eb

# Créer le package
python3 create-deployment-package.py

# Upload sur S3
aws s3 cp authz-eb-v2.4.0-vat-detection.zip \
  s3://elasticbeanstalk-eu-central-1-004843574253/ \
  --region eu-central-1

# Créer la version
aws elasticbeanstalk create-application-version \
  --application-name rt-authz-api \
  --version-label v2.4.0-vat-duplicate-detection \
  --source-bundle S3Bucket=elasticbeanstalk-eu-central-1-004843574253,S3Key=authz-eb-v2.4.0-vat-detection.zip \
  --region eu-central-1

# Déployer
aws elasticbeanstalk update-environment \
  --application-name rt-authz-api \
  --environment-name rt-authz-api-prod \
  --version-label v2.4.0-vat-duplicate-detection \
  --region eu-central-1
```

**Statut du déploiement :**
```
Environment: rt-authz-api-prod
Status: Ready
Health: Green
Version: v2.4.0-vat-duplicate-detection
```

✅ **Déploiement réussi !**

### Frontend

**Environnement :** AWS Amplify
**Application :** marketing-site (df8cnylp3pqka)
**Branche :** main

**Commits déployés :**
- `99ff94d` - feat: Ajouter détection et affichage des doublons de numéro de TVA
- `f3889f5` - feat: Transformer la sélection d'abonnements avec cartes visuelles détaillées
- `9d0ef38` - feat: Ajouter formulaire de paiement par carte et améliorer présentation des tarifs

**Jobs Amplify :**
- Job #80: SUCCESS (subscription cards)
- Job #81: SUCCESS (payment form)
- Job #82: SUCCESS (duplicate detection)

---

## ✅ Checklist de Configuration

- [x] Index unique MongoDB créé sur `vatNumber`
- [x] Script de nettoyage des doublons exécuté
- [x] Backend mis à jour avec détection de doublons
- [x] Frontend mis à jour avec affichage d'erreurs
- [x] Tests backend passés (409 Conflict)
- [x] Backend déployé sur Elastic Beanstalk
- [x] Frontend déployé sur Amplify
- [x] Commits poussés vers GitHub
- [x] Documentation créée

---

## 🔗 Liens Utiles

### Backend
- **Repository :** https://github.com/romain-38530/rt-backend-services
- **Elastic Beanstalk Console :** https://eu-central-1.console.aws.amazon.com/elasticbeanstalk
- **API Health :** https://d2i50a1vlg138w.cloudfront.net/health
- **Onboarding Endpoint :** https://d2i50a1vlg138w.cloudfront.net/api/onboarding/submit

### Frontend
- **Repository :** https://github.com/romain-38530/rt-frontend-apps
- **Amplify Console :** https://eu-central-1.console.aws.amazon.com/amplify/home?region=eu-central-1#/df8cnylp3pqka
- **Live URL :** https://main.df8cnylp3pqka.amplifyapp.com

### MongoDB
- **Atlas Console :** https://cloud.mongodb.com
- **Cluster :** stagingrt.v2jnoh2.mongodb.net
- **Database :** rt-auth
- **Collection :** onboarding_requests

---

## 🛠️ Maintenance

### Vérifier l'Index

```bash
mongosh "mongodb+srv://stagingrt.v2jnoh2.mongodb.net/" \
  --username rt_admin \
  --password RtAdmin2024

use rt-auth
db.onboarding_requests.getIndexes()
```

### Chercher les Doublons

```bash
node scripts/cleanup-vat-duplicates.js
```

### Monitorer les Erreurs 409

**CloudWatch Logs :** Rechercher `MongoDB insert error` et `code 11000`

---

## 📝 Notes Techniques

### Comportement de l'Index `sparse: true`

- ✅ Permet plusieurs documents avec `vatNumber: null`
- ✅ Permet plusieurs documents avec `vatNumber: undefined`
- ❌ Bloque les doublons de numéros de TVA réels
- ✅ N'affecte pas les documents sans champ `vatNumber`

### Messages d'Erreur

**Backend → Frontend :**
- Code HTTP 409 (Conflict)
- `error.code`: "DUPLICATE_REQUEST"
- `error.field`: "vatNumber" ou "email"
- `error.message`: Message personnalisé en français

**Frontend → Utilisateur :**
- Affichage visuel rouge avec icône X
- Message principal clair
- Message d'aide contextuel avec suggestion de contacter le support

---

## 🎉 Résultat Final

Le système empêche maintenant complètement l'inscription multiple d'une même entreprise en utilisant le numéro de TVA comme identifiant unique. Les utilisateurs reçoivent un message d'erreur clair et visuel quand ils tentent de s'inscrire avec un numéro de TVA déjà enregistré.

**Déploiement effectué par :** Claude Code
**Date :** 26 Novembre 2025
**Durée totale :** ~45 minutes
**Statut :** ✅ SUCCESS
