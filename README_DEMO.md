# 🧪 SYMPHONI.A - Système de Test et Démo

## 📚 Documentation Créée

Ce projet inclut un système complet de test et démo avec 4 fichiers de documentation :

### 1. [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) 🔑
**Identifiants de connexion pour tous les portails**
- 7 comptes de test (un par portail + admin)
- Mots de passe sécurisés
- Différents niveaux d'abonnement (Free, Pro, Enterprise)
- URLs des portails déployés

### 2. [TESTING_GUIDE.md](./TESTING_GUIDE.md) ✅
**Guide complet de test**
- Tests rapides (5-10 minutes)
- Tests complets (30 minutes)
- Scénarios métier détaillés
- Checklist exhaustive
- Template de rapport de bugs

### 3. [create-demo-users.js](./create-demo-users.js) 🛠️
**Script Node.js pour créer les utilisateurs**
- Génère le fichier `demo-users.json`
- Hash les mots de passe avec bcrypt
- Peut insérer directement dans MongoDB

### 4. [insert-demo-users.ps1](./insert-demo-users.ps1) 📥
**Script PowerShell pour insérer les utilisateurs dans MongoDB**
- Utilise `mongoimport`
- Connexion automatique à MongoDB Atlas
- Mode upsert (mise à jour ou insertion)

---

## 🚀 Démarrage Rapide

### Option 1 : Test Rapide (Mode Démo - Sans Backend)

**Temps requis :** 5 minutes

1. Ouvrez n'importe quel portail :
   ```
   https://main.dbg6okncuyyiw.amplifyapp.com  (Industry)
   https://main.d31p7m90ewg4xm.amplifyapp.com (Logistician)
   https://main.d1tb834u144p4r.amplifyapp.com (Transporter)
   ...
   ```

2. Cliquez sur **"Connexion de test (démo)"**

3. Explorez l'interface !

### Option 2 : Test Complet (Avec Backend)

**Temps requis :** 10-15 minutes

#### Étape 1 : Créer les utilisateurs de test

```bash
# Générer le fichier JSON
node create-demo-users.js

# Option A : Insertion avec MongoDB Tools (si installé)
powershell -ExecutionPolicy Bypass -File insert-demo-users.ps1

# Option B : Insertion avec Node.js
node create-demo-users.js --mongodb
```

#### Étape 2 : Se connecter

1. Ouvrir un portail (ex: Industry)
2. Utiliser les identifiants de [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) :
   ```
   Email: industry@demo.symphoni-a.com
   Password: Industry2024!
   ```

3. Explorer les fonctionnalités !

---

## 📋 Comptes de Test Disponibles

| Portail | Email | Mot de passe | Abonnement |
|---------|-------|--------------|------------|
| 🏭 Industry | industry@demo.symphoni-a.com | Industry2024! | Pro |
| 📦 Supplier | supplier@demo.symphoni-a.com | Supplier2024! | Pro |
| 🚚 Transporter | transporter@demo.symphoni-a.com | Transport2024! | Enterprise |
| 🌐 Forwarder | forwarder@demo.symphoni-a.com | Forwarder2024! | Pro |
| 📊 Logistician | logistician@demo.symphoni-a.com | Logistics2024! | Enterprise |
| 📍 Recipient | recipient@demo.symphoni-a.com | Recipient2024! | Free |
| 👤 Admin | admin@demo.symphoni-a.com | Admin2024! | Enterprise |

---

## 🧪 Scénarios de Test Recommandés

### Scénario 1 : Design et UX (5 min)
✅ Vérifier les images de fond sur toutes les pages
✅ Tester les effets hover et animations
✅ Vérifier la cohérence du design

### Scénario 2 : Système d'Abonnement (10 min)
✅ Se connecter avec un compte Free (Recipient)
✅ Observer les fonctionnalités verrouillées (🔒)
✅ Passer à Pro et vérifier le déverrouillage
✅ Vérifier les statistiques mises à jour

### Scénario 3 : Multilingue (3 min)
✅ Tester les 5 langues (FR, EN, DE, ES, IT)
✅ Vérifier que les traductions sont correctes
✅ Vérifier que la langue persiste

### Scénario 4 : Authentification (10 min)
✅ Connexion avec API
✅ Gestion des erreurs
✅ Déconnexion
✅ Persistance de session

---

## 📊 URLs des Portails Déployés

### Portails Métier
- 🏭 **Industry:** https://main.dbg6okncuyyiw.amplifyapp.com
- 📦 **Supplier:** https://main.dzvo8973zaqb.amplifyapp.com
- 🚚 **Transporter:** https://main.d1tb834u144p4r.amplifyapp.com
- 🌐 **Forwarder:** https://main.d3hz3xvddrl94o.amplifyapp.com
- 📊 **Logistician:** https://main.d31p7m90ewg4xm.amplifyapp.com
- 📍 **Recipient:** https://main.d3b6p09ihn5w7r.amplifyapp.com

### Administration
- 👤 **Backoffice Admin:** https://main.d23mv8xwxo0rr0.amplifyapp.com

---

## 🛠️ Outils Disponibles

### Scripts Node.js

```bash
# Générer les utilisateurs de démo (JSON)
node create-demo-users.js

# Insérer les utilisateurs dans MongoDB
node create-demo-users.js --mongodb
```

### Scripts PowerShell

```powershell
# Insérer les utilisateurs via mongoimport
.\insert-demo-users.ps1

# Configurer les variables d'environnement Amplify
.\configure-env-manual.ps1
```

---

## 📁 Structure des Fichiers

```
rt-frontend-apps/
├── DEMO_CREDENTIALS.md       # 🔑 Identifiants de test
├── TESTING_GUIDE.md          # ✅ Guide de test complet
├── README_DEMO.md            # 📖 Ce fichier
├── create-demo-users.js      # 🛠️ Script de génération des utilisateurs
├── insert-demo-users.ps1     # 📥 Script d'insertion MongoDB
├── demo-users.json           # 📄 Données utilisateurs générées
└── configure-env-manual.ps1  # ⚙️ Configuration Amplify
```

---

## 🔒 Sécurité

**⚠️ IMPORTANT :**

- Ces comptes sont **UNIQUEMENT** pour la démo et le test
- **NE JAMAIS** utiliser ces identifiants en production
- Les mots de passe doivent être changés pour un usage réel
- Le fichier `demo-users.json` contient des mots de passe hashés

---

## 🐛 Signaler un Bug

Si vous trouvez un bug lors des tests :

1. Consulter [TESTING_GUIDE.md](./TESTING_GUIDE.md)
2. Utiliser le template de rapport de bug fourni
3. Inclure :
   - Portail concerné
   - Compte utilisé
   - Étapes pour reproduire
   - Screenshot si possible

---

## 📞 Support

**Questions sur les tests ?**
- Consulter [TESTING_GUIDE.md](./TESTING_GUIDE.md)

**Problème de connexion ?**
- Vérifier [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md)
- Vider le cache du navigateur
- Essayer le mode incognito

**Problème avec MongoDB ?**
- Vérifier que MongoDB Tools est installé
- Vérifier l'URI de connexion
- Essayer `node create-demo-users.js --mongodb`

---

## ✅ Checklist de Mise en Route

- [ ] Lire [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md)
- [ ] Lire [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- [ ] Générer les utilisateurs : `node create-demo-users.js`
- [ ] (Optionnel) Insérer dans MongoDB
- [ ] Tester au moins 3 portails
- [ ] Tester le système d'abonnement
- [ ] Tester le multilingue
- [ ] Compléter la checklist dans TESTING_GUIDE.md

---

## 🎯 Objectifs des Tests

### Phase 1 : Design et UX ✅
- Vérifier les images de fond thématiques
- Valider l'effet glassmorphism
- Tester les animations et interactions

### Phase 2 : Fonctionnalités Core ✅
- Authentification (login/logout)
- Mode test/démo
- Navigation entre pages

### Phase 3 : Business Logic ✅
- Système d'abonnement (Free/Pro/Enterprise)
- Verrouillage/déverrouillage de fonctionnalités
- Statistiques adaptées au plan

### Phase 4 : Internationalization ✅
- 5 langues disponibles
- Traductions complètes
- Persistance de la langue

### Phase 5 : Backend Integration ⏳
- Connexion aux API AWS
- Gestion des erreurs
- Tests de charge

---

**Version :** 1.0.0
**Dernière mise à jour :** 2025-11-23
**Statut :** ✅ Prêt pour les tests
