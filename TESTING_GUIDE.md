# 🧪 Guide de Test - SYMPHONI.A Portals

## 📋 Table des Matières
1. [Préparation](#préparation)
2. [Tests Rapides](#tests-rapides)
3. [Tests Complets](#tests-complets)
4. [Scénarios de Test](#scénarios-de-test)
5. [Checklist](#checklist)

---

## 🚀 Préparation

### Prérequis
- [ ] Navigateur moderne (Chrome, Firefox, Safari, Edge)
- [ ] Connexion Internet
- [ ] Document [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) ouvert

### URLs des Portails

| Portail | URL | Compte |
|---------|-----|--------|
| 🏭 Industry | https://main.dbg6okncuyyiw.amplifyapp.com | industry@demo.symphoni-a.com |
| 📦 Supplier | https://main.dzvo8973zaqb.amplifyapp.com | supplier@demo.symphoni-a.com |
| 🚚 Transporter | https://main.d1tb834u144p4r.amplifyapp.com | transporter@demo.symphoni-a.com |
| 🌐 Forwarder | https://main.d3hz3xvddrl94o.amplifyapp.com | forwarder@demo.symphoni-a.com |
| 📊 Logistician | https://main.d31p7m90ewg4xm.amplifyapp.com | logistician@demo.symphoni-a.com |
| 📍 Recipient | https://main.d3b6p09ihn5w7r.amplifyapp.com | recipient@demo.symphoni-a.com |

---

## ⚡ Tests Rapides (Mode Démo)

### Test 1 : Interface et Design (5 min)
**Objectif :** Vérifier que les images de fond et le design sont corrects

1. Ouvrir le portail **Logistician**
2. Observer l'image de fond (centre logistique)
3. Cliquer sur **"Connexion de test (démo)"**
4. Vérifier :
   - ✅ Image de fond présente sur la page d'accueil
   - ✅ Cartes de fonctionnalités visibles
   - ✅ Statistiques affichées
   - ✅ Design cohérent (glassmorphism, overlay sombre)

5. Cliquer sur **"Abonnement"**
6. Vérifier :
   - ✅ Image de fond présente
   - ✅ Les 3 plans affichés (Gratuit, Pro, Enterprise)
   - ✅ Fonctionnalités verrouillées visibles (🔒)

**Répéter pour les 5 autres portails**

### Test 2 : Multilingue (3 min)
1. Sur n'importe quel portail (page login)
2. Cliquer sur le sélecteur de langue 🌍
3. Tester chaque langue :
   - [ ] Français
   - [ ] English
   - [ ] Deutsch
   - [ ] Español
   - [ ] Italiano
4. Vérifier que les textes changent correctement

---

## 🔍 Tests Complets (Avec API Backend)

### Test 3 : Authentification (10 min)

#### 3.1 Connexion avec API
1. Ouvrir **Industry Portal**
2. Saisir :
   - Email: `industry@demo.symphoni-a.com`
   - Mot de passe: `Industry2024!`
3. Cliquer **"Se connecter"**
4. Vérifier :
   - ✅ Message de chargement affiché
   - ✅ Redirection vers page d'accueil
   - ✅ Email affiché dans l'en-tête
   - ✅ Badge de rôle affiché (Industry)
   - ✅ Badge d'abonnement (Pro)

#### 3.2 Déconnexion
1. Cliquer sur **"Déconnexion"**
2. Vérifier :
   - ✅ Redirection vers page de login
   - ✅ Session supprimée

#### 3.3 Test des Erreurs
1. Essayer de se connecter avec :
   - Email : `wrong@email.com`
   - Mot de passe : `wrongpassword`
2. Vérifier :
   - ✅ Message d'erreur affiché
   - ✅ Pas de redirection
   - ✅ Formulaire reste actif

### Test 4 : Système d'Abonnement (10 min)

#### 4.1 Compte Gratuit (Recipient)
1. Se connecter avec `recipient@demo.symphoni-a.com`
2. Observer les fonctionnalités :
   - ✅ "Suivi des livraisons" - 🔒 Verrouillé
   - ✅ "Notifications en temps réel" - ✅ Accessible
   - ✅ "Historique complet" - 🔒 Verrouillé
   - ✅ "Validation numérique" - 🔒 Verrouillé
3. Statistiques :
   - ✅ Affichage limité (4/10 livraisons ce mois)

#### 4.2 Passage à Pro
1. Cliquer sur **"Abonnement"**
2. Sélectionner le plan **"Pro"**
3. Cliquer sur **"Choisir ce plan"**
4. Vérifier :
   - ✅ Message de confirmation
   - ✅ Badge mis à jour dans l'en-tête
5. Retourner à l'accueil
6. Vérifier :
   - ✅ Fonctionnalités déverrouillées
   - ✅ Statistiques complètes

#### 4.3 Compte Enterprise (Logistician)
1. Se connecter avec `logistician@demo.symphoni-a.com`
2. Vérifier :
   - ✅ Toutes les fonctionnalités accessibles
   - ✅ Badge "Enterprise"
   - ✅ Analytics avancés visibles

---

## 📝 Scénarios de Test Métier

### Scénario 1 : Logisticien optimisant ses opérations

**Persona :** Thomas, Logisticien chez Demo Pro

1. **Connexion**
   - Se connecter avec `logistician@demo.symphoni-a.com`

2. **Vue d'ensemble**
   - Observer les KPI :
     - Opérations ce mois : 152
     - En cours : 34
     - Finalisées : 567
     - Taux d'efficacité : 94%

3. **Exploration des fonctionnalités**
   - Cliquer sur "Tableaux de bord"
   - Cliquer sur "Gestion des stocks"
   - Cliquer sur "Planification des transports"
   - Cliquer sur "Analytics avancés"

4. **Changement de langue**
   - Passer en Anglais
   - Vérifier que l'interface s'adapte

5. **Gestion abonnement**
   - Aller sur la page Abonnement
   - Vérifier le plan Enterprise actif
   - Observer les fonctionnalités disponibles

### Scénario 2 : Destinataire suivant ses livraisons

**Persona :** Emma, Destinataire chez Demo

1. **Connexion Mode Test**
   - Cliquer sur "Connexion de test (démo)"

2. **Découverte des limitations**
   - Observer les fonctionnalités verrouillées (🔒)
   - Voir le compteur "4/10 livraisons ce mois"

3. **Passage à Pro**
   - Aller sur Abonnement
   - Sélectionner le plan Pro (49€/mois)
   - Activer le plan

4. **Vérification des nouveautés**
   - Retour à l'accueil
   - Vérifier les fonctionnalités débloquées
   - Voir les statistiques complètes (67 livraisons)

### Scénario 3 : Transporteur gérant sa flotte

**Persona :** Pierre, Transporteur chez Demo Express

1. **Connexion**
   - Compte : `transporter@demo.symphoni-a.com`

2. **Vue de la flotte**
   - Observer les stats :
     - Trajets ce mois : 89
     - En cours : 23
     - Véhicules actifs : 45
     - Taux de ponctualité : 96%

3. **Fonctionnalités Enterprise**
   - Suivi en temps réel ✅
   - Gestion eCMR ✅
   - Vigilance routière ✅
   - Optimisation des routes ✅

---

## ✅ Checklist Complète

### Design & UX
- [ ] Images de fond présentes sur toutes les pages (login, index, subscription)
- [ ] Overlay sombre (rgba(0,0,0,0.5)) appliqué
- [ ] Effet glassmorphism sur les cartes et en-têtes
- [ ] Texte lisible sur les images de fond
- [ ] Animations de hover fonctionnelles
- [ ] Design responsive (mobile, tablet, desktop)

### Authentification
- [ ] Connexion avec email/password fonctionne
- [ ] Connexion de test (mode démo) fonctionne
- [ ] Messages d'erreur affichés correctement
- [ ] Déconnexion fonctionne
- [ ] Session persiste après refresh
- [ ] Redirection automatique si non connecté

### Multilingue
- [ ] 5 langues disponibles (FR, EN, DE, ES, IT)
- [ ] Sélecteur de langue visible et fonctionnel
- [ ] Traductions correctes sur toutes les pages
- [ ] Langue persiste après navigation

### Abonnements
- [ ] 3 plans visibles (Free, Pro, Enterprise)
- [ ] Fonctionnalités verrouillées (🔒) affichées
- [ ] Bouton "Débloquer" fonctionnel
- [ ] Changement de plan instantané
- [ ] Badge d'abonnement mis à jour
- [ ] Statistiques adaptées au plan

### Portails Spécifiques

#### Industry (🏭)
- [ ] Image : Usine moderne
- [ ] Fonctionnalités : Production, Commandes, Planning
- [ ] Couleur : Bleu industriel

#### Supplier (📦)
- [ ] Image : Entrepôt
- [ ] Fonctionnalités : Stocks, Catalogue, Palettes
- [ ] Couleur : Vert

#### Transporter (🚚)
- [ ] Image : Camions
- [ ] Fonctionnalités : Tracking, eCMR, Vigilance
- [ ] Couleur : Orange

#### Forwarder (🌐)
- [ ] Image : Port de conteneurs
- [ ] Fonctionnalités : Multi-transport, Planning, Palettes
- [ ] Couleur : Bleu océan

#### Logistician (📊)
- [ ] Image : Centre logistique
- [ ] Fonctionnalités : KPI, Analytics, Optimisation
- [ ] Couleur : Rose/Violet

#### Recipient (📍)
- [ ] Image : Quai de chargement
- [ ] Fonctionnalités : Livraisons, Notifications, Réceptions
- [ ] Couleur : Vert turquoise

### Backend
- [ ] Connexion API fonctionnelle
- [ ] Variables d'environnement configurées
- [ ] CORS configuré correctement
- [ ] Erreurs API gérées

---

## 🐛 Rapport de Bugs

Si vous trouvez un bug, documentez-le avec :

**Template :**
```markdown
### Bug #[NUMERO]
- **Portail :** [nom du portail]
- **Page :** [login / index / subscription]
- **Compte :** [email utilisé]
- **Navigateur :** [Chrome / Firefox / Safari / Edge]
- **Description :** [description du bug]
- **Étapes pour reproduire :**
  1. ...
  2. ...
- **Comportement attendu :** ...
- **Comportement observé :** ...
- **Screenshot :** [si disponible]
```

---

## 📞 Support

En cas de problème :
- Vérifier [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md)
- Vérifier que les builds AWS Amplify sont terminés
- Vider le cache du navigateur
- Essayer le mode incognito

---

**Version :** 1.0.0
**Dernière mise à jour :** 2025-11-23
