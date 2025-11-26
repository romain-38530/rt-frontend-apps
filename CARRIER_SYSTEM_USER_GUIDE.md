# Guide d'Utilisation - Système de Gestion des Transporteurs SYMPHONI.A

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser le système complet de référencement des transporteurs dans SYMPHONI.A, depuis l'invitation jusqu'à la gestion quotidienne.

---

## 📚 Table des matières

1. [Invitation d'un Transporteur](#invitation-dun-transporteur)
2. [Gestion des Documents](#gestion-des-documents)
3. [Onboarding d'un Transporteur](#onboarding-dun-transporteur)
4. [Gestion des Grilles Tarifaires](#gestion-des-grilles-tarifaires)
5. [Configuration de la Chaîne d'Affectation](#configuration-de-la-chaîne-daffectation)
6. [Système de Scoring](#système-de-scoring)
7. [Système de Vigilance](#système-de-vigilance)
8. [Tableau de Bord](#tableau-de-bord)

---

## 1. Invitation d'un Transporteur

### Accès
- **URL Frontend :** https://main.df8cnylp3pqka.amplifyapp.com/admin/carriers/invite
- **Endpoint API :** `POST /api/carriers/invite`

### Étapes

1. **Accéder au formulaire d'invitation**
   - Aller sur la page de gestion des transporteurs
   - Cliquer sur "Inviter un Transporteur"

2. **Remplir les informations obligatoires**
   - Nom de l'entreprise
   - Email
   - SIRET (14 chiffres)
   - Numéro de TVA (format : FRxxxxxxxxx)
   - Téléphone
   - Adresse

3. **Choisir le mode de référencement**
   - **Direct** - Invitation par un industriel (recommandé)
   - **Automatique** - Via Affret.IA
   - **Premium** - Réseau Premium

4. **Soumettre le formulaire**

### Résultat
- Le transporteur est créé avec le statut **Niveau 2 (Guest)**
- Il est **bloqué** par défaut (raison : "Aucun document fourni")
- Un ID unique est généré
- Le transporteur peut maintenant uploader ses documents

### Exemple API

```bash
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/carriers/invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "transport@example.com",
    "companyName": "Transport Express SARL",
    "siret": "12345678901234",
    "vatNumber": "FR12345678901",
    "phone": "+33612345678",
    "address": "25 Avenue du Transport, 69100 Lyon",
    "invitedBy": "industrial_rt_groupe",
    "referenceMode": "direct"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Transporteur invité avec succès",
  "carrierId": "6926f3779f80dcd8d3f3f101",
  "status": "guest"
}
```

---

## 2. Gestion des Documents

### Documents Obligatoires

| Document | Type | Expiration | Niveau requis |
|----------|------|------------|---------------|
| **Kbis** | `kbis` | Oui | Niveau 1 |
| **Attestation URSSAF** | `urssaf` | Oui | Niveau 1 |
| **Assurance Transport** | `insurance` | Oui | Niveau 1 |
| **Licence de Transport** | `license` | Oui | Niveau 1 |
| RIB | `rib` | Non | Optionnel |
| Pièce d'identité | `id_card` | Oui | Optionnel |

### Upload d'un Document

**Endpoint :** `POST /api/carriers/:carrierId/documents`

**Exemple :**
```bash
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/carriers/6926f3779f80dcd8d3f3f101/documents \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "kbis",
    "fileName": "kbis-2025.pdf",
    "fileUrl": "https://s3.../kbis-2025.pdf",
    "expiryDate": "2026-12-31"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Document uploadé avec succès",
  "documentId": "6926f4819f80dcd8d3f3f103",
  "status": "pending"
}
```

### Vérification d'un Document

**Endpoint :** `PUT /api/carriers/:carrierId/documents/:documentId/verify`

**Exemple :**
```bash
curl -X PUT https://d2i50a1vlg138w.cloudfront.net/api/carriers/6926f3779f80dcd8d3f3f101/documents/6926f4819f80dcd8d3f3f103/verify \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified",
    "verifiedBy": "admin@symphonia.com",
    "ocrData": {
      "companyName": "Transport Express SARL",
      "siret": "12345678901234"
    }
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Document vérifié",
  "vigilanceStatus": "compliant"
}
```

### Statuts des Documents

| Statut | Description | Badge |
|--------|-------------|-------|
| `pending` | En attente de vérification | ⏳ En attente |
| `verified` | Document vérifié et valide | ✅ Vérifié |
| `rejected` | Document rejeté | ❌ Rejeté |
| `expired` | Document expiré | 📅 Expiré |

---

## 3. Onboarding d'un Transporteur

### Conditions Requises

Pour qu'un transporteur passe de **Niveau 2 (Guest)** à **Niveau 1 (Referenced)**, il doit avoir :

✅ **4 documents obligatoires vérifiés :**
- Kbis
- Attestation URSSAF
- Assurance Transport
- Licence de Transport

### Processus

**Endpoint :** `POST /api/carriers/onboard`

**Exemple :**
```bash
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/carriers/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "carrierId": "6926f3779f80dcd8d3f3f101"
  }'
```

**Réponse en cas de succès :**
```json
{
  "success": true,
  "message": "Transporteur onboardé avec succès",
  "status": "referenced",
  "score": 120
}
```

**Réponse en cas de documents manquants :**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_DOCUMENTS",
    "message": "Documents manquants: urssaf, insurance"
  }
}
```

### Résultat de l'Onboarding

- ✅ Statut passe à **Niveau 1 (Referenced)**
- ✅ Le transporteur est **débloqué**
- ✅ Le score initial est calculé (minimum 80 points)
- ✅ Le transporteur peut maintenant recevoir des affectations
- ✅ Événement `carrier.onboarded` enregistré

---

## 4. Gestion des Grilles Tarifaires

### Upload d'une Grille

**Endpoint :** `POST /api/carriers/:carrierId/pricing-grids`

**Exemple :**
```bash
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/carriers/6926f3779f80dcd8d3f3f101/pricing-grids \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "grille-tarifs-2025.xlsx",
    "fileUrl": "https://s3.../grille-tarifs-2025.xlsx",
    "routes": [
      {
        "origin": "Paris",
        "destination": "Lyon",
        "pricePerKm": 1.5,
        "basePrice": 100
      },
      {
        "origin": "Lyon",
        "destination": "Marseille",
        "pricePerKm": 1.3,
        "basePrice": 80
      }
    ]
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Grille tarifaire uploadée",
  "gridId": "673grid456..."
}
```

### Impact sur le Score

- ✅ +30 points au score si la grille est active
- ✅ Le transporteur devient plus compétitif dans la chaîne d'affectation

---

## 5. Configuration de la Chaîne d'Affectation

### Concept

La chaîne d'affectation détermine l'**ordre de priorité** des transporteurs pour l'attribution automatique des missions.

### Configuration

**Endpoint :** `POST /api/dispatch-chains`

**Exemple :**
```bash
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/dispatch-chains \
  -H "Content-Type: application/json" \
  -d '{
    "industrialId": "industrial_rt_groupe",
    "carrierIds": [
      "carrier_premium_1",
      "carrier_premium_2",
      "carrier_referenced_1",
      "carrier_referenced_2"
    ]
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Chaîne d'affectation mise à jour"
}
```

### Ordre de Priorité

1. **Transporteurs Premium** (Niveau 1+) - Score décroissant
2. **Transporteurs Référencés** (Niveau 1) - Score décroissant
3. **Fallback vers Affret.IA**

### Impact sur le Score

- ✅ +50 points si le transporteur est dans la chaîne d'affectation

---

## 6. Système de Scoring

### Calcul du Score

Le score est calculé automatiquement selon cette formule :

```
Score = Base + Bonifications - Pénalités

Base:
  • +20 points par document vérifié (max 120 pour 6 documents)

Bonifications:
  • +50 points si dans la chaîne d'affectation
  • +30 points si grille tarifaire active
  • +1 point par jour depuis l'onboarding

Pénalités:
  • -100 points si bloqué
```

### Exemples

**Transporteur Débutant (Niveau 2) :**
```
0 document vérifié: 0 points
Pas dans la chaîne: 0 points
Pas de grille: 0 points
Bloqué: -100 points (mais score min = 0)
──────────────────────────
Score: 0 points
```

**Transporteur Onboardé (Niveau 1) :**
```
4 documents vérifiés: 80 points
Pas dans la chaîne: 0 points
Pas de grille: 0 points
Onboardé depuis 10 jours: +10 points
──────────────────────────
Score: 90 points
```

**Transporteur Actif (Niveau 1) :**
```
6 documents vérifiés: 120 points
Dans la chaîne: +50 points
Grille tarifaire: +30 points
Onboardé depuis 45 jours: +45 points
──────────────────────────
Score: 245 points
```

**Transporteur Premium (Niveau 1+) :**
```
6 documents vérifiés: 120 points
Dans la chaîne: +50 points
Grille tarifaire: +30 points
Onboardé depuis 365 jours: +365 points
──────────────────────────
Score: 565 points
```

### Recalcul Manuel

**Endpoint :** `POST /api/carriers/:carrierId/calculate-score`

**Exemple :**
```bash
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/carriers/6926f3779f80dcd8d3f3f101/calculate-score
```

**Réponse :**
```json
{
  "success": true,
  "score": 245
}
```

### Recalcul Automatique

Le score est recalculé automatiquement lors de :
- ✅ Upload d'un document
- ✅ Vérification d'un document
- ✅ Ajout/Retrait de la chaîne d'affectation
- ✅ Upload d'une grille tarifaire
- ✅ Blocage/Déblocage
- ✅ CRON quotidien (6h00 UTC)

---

## 7. Système de Vigilance

### Statuts de Vigilance

| Statut | Description | Action | Badge |
|--------|-------------|--------|-------|
| `compliant` | Tous les documents valides | Aucune | ✅ Conforme |
| `warning` | Documents expirant < 30j | Alertes envoyées | ⚠️ Alerte |
| `blocked` | Documents expirés | Blocage automatique | 🚫 Bloqué |

### Cycle d'Alertes Automatiques

Le système vérifie automatiquement les dates d'expiration et envoie des alertes :

```
Document expire le 01/04/2025

┌─────────────────────────────────────────────────┐
│ J-30 (02/03/2025)                               │
│ └─> 📧 Email à l'administrateur                 │
├─────────────────────────────────────────────────┤
│ J-15 (17/03/2025)                               │
│ └─> 📧 Email + 🔔 Push notification             │
├─────────────────────────────────────────────────┤
│ J-7 (25/03/2025)                                │
│ └─> 🔔 Push + 📱 SMS urgence                    │
├─────────────────────────────────────────────────┤
│ J-0 (01/04/2025)                                │
│ └─> 🚫 Blocage automatique du transporteur      │
└─────────────────────────────────────────────────┘
```

### CRON Quotidien

Le système exécute automatiquement chaque jour à **6h00 UTC** (7h Paris hiver) :

1. ✅ Vérification des documents expirés
2. ✅ Blocage automatique si nécessaire
3. ✅ Envoi des alertes J-30, J-15, J-7
4. ✅ Mise à jour des statuts de vigilance
5. ✅ Recalcul des scores

### Déblocage

Pour débloquer un transporteur, il doit :
1. Uploader un nouveau document valide
2. Faire vérifier le document par un administrateur
3. Le système le débloquera automatiquement si tous les documents sont conformes

---

## 8. Tableau de Bord

### Accès
- **URL :** https://main.df8cnylp3pqka.amplifyapp.com/admin/carriers

### Statistiques Affichées

**Cartes de statistiques :**
- 📊 Total de transporteurs
- 👥 Niveau 2 (Guest)
- ✅ Niveau 1 (Referenced)
- ⭐ Niveau 1+ (Premium)

### Filtres

**Par Statut :**
- Tous les statuts
- Niveau 2 - Invités
- Niveau 1 - Référencés
- Niveau 1+ - Premium

**Par Vigilance :**
- Toutes les vigilances
- ✅ Conformes
- ⚠️ En alerte
- 🚫 Bloqués

### Liste des Transporteurs

Pour chaque transporteur, le tableau affiche :
- **Entreprise** : Nom, SIRET, TVA
- **Contact** : Email, téléphone
- **Statut** : Badge de niveau
- **Vigilance** : Badge de vigilance + raison du blocage
- **Score** : Points du transporteur
- **Actions** : Lien vers la page de détails

### Page de Détails

**URL :** `/admin/carriers/:id`

**Sections :**
1. **Informations générales** - Toutes les coordonnées
2. **Documents de vigilance** - 6 types avec statuts
3. **Statistiques** - Dates, mode de référencement
4. **Actions** - Onboarding, calcul de score

---

## 🔗 Endpoints API Complets

### Liste des Transporteurs
```
GET /api/carriers?status=referenced&vigilanceStatus=compliant
```

### Détails d'un Transporteur
```
GET /api/carriers/:carrierId
```

### Invitation
```
POST /api/carriers/invite
```

### Onboarding
```
POST /api/carriers/onboard
```

### Upload Document
```
POST /api/carriers/:carrierId/documents
```

### Vérification Document
```
PUT /api/carriers/:carrierId/documents/:documentId/verify
```

### Upload Grille Tarifaire
```
POST /api/carriers/:carrierId/pricing-grids
```

### Calcul Score
```
POST /api/carriers/:carrierId/calculate-score
```

### Chaîne d'Affectation
```
POST /api/dispatch-chains
```

---

## 📞 Support

**API URL :** https://d2i50a1vlg138w.cloudfront.net/
**Health Check :** https://d2i50a1vlg138w.cloudfront.net/health

**En cas de problème :**
1. Vérifier le statut de l'API : `/health`
2. Consulter les logs CloudWatch
3. Vérifier les événements dans `carrier_events`

---

**Version du système :** 3.0.1
**Dernière mise à jour :** 26 Novembre 2025
**CRON configuré :** ✅ Actif (6h00 UTC quotidien)
