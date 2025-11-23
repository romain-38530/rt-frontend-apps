# 🍃 Guide MongoDB Atlas - Pas à Pas avec Captures d'Écran

## Étape 1: Créer un Compte MongoDB Atlas ✅

### 1.1 Aller sur le site
👉 **Ouvrez ce lien:** https://www.mongodb.com/cloud/atlas/register

### 1.2 S'inscrire
Vous avez 2 options:

**Option A: Avec Google (RECOMMANDÉ - plus rapide)**
- Cliquez sur "Sign up with Google"
- Sélectionnez votre compte Google
- ✅ C'est fait!

**Option B: Avec Email**
- Email: `romain@rt-technologie.com` (ou votre email)
- First Name: `Romain`
- Last Name: `Tard`
- Password: Créez un mot de passe fort
- Cochez "I agree to the Terms of Service and Privacy Policy"
- Cliquez "Create your Atlas account"
- ✅ Vérifiez votre email et cliquez sur le lien de confirmation

---

## Étape 2: Créer un Cluster Gratuit (M0) 🆓

Après connexion, vous arrivez sur la page d'accueil.

### 2.1 Démarrer la création
Vous devriez voir un bouton **"+ Create"** ou **"Build a Database"**
- Cliquez dessus

### 2.2 Choisir le plan GRATUIT
Vous verrez 3 options:

```
┌─────────────────────────────────────────┐
│  Serverless          M0 FREE      M10   │
│  Pay as you go       $0/month    $57/mo │
│                      512 MB             │
│  [Learn More]     [CREATE] ✅    [...]  │
└─────────────────────────────────────────┘
```

**⚠️ IMPORTANT: Cliquez sur "CREATE" sous "M0 FREE"**

### 2.3 Configurer le Cluster

Sur la page suivante, configurez:

**Provider & Region:**
```
Cloud Provider:   [AWS] ✅  (déjà sélectionné)

Region:          Cherchez "eu-central-1" ou "Frankfurt"

                 ┌──────────────────────────────────┐
                 │ Europe (Frankfurt) eu-central-1  │ ✅
                 └──────────────────────────────────┘
```

⚠️ **Très important:** Choisissez **eu-central-1 (Frankfurt)** - même région que vos apps AWS!

**Cluster Name:**
```
Cluster Name: rt-auth-cluster
```

**Cluster Tier:**
```
M0 Sandbox (Shared RAM, 512 MB Storage) - FREE ✅
```

### 2.4 Créer le Cluster
- Vérifiez que tout est correct
- Cliquez sur **"Create Deployment"** ou **"Create Cluster"**
- ⏳ Attendez 1-3 minutes pendant la création...

---

## Étape 3: Créer un Utilisateur de Base de Données 👤

### 3.1 Popup de Sécurité
Juste après la création du cluster, une popup **"Security Quickstart"** apparaît:

```
┌──────────────────────────────────────────────────────┐
│  How would you like to authenticate your connection? │
│                                                       │
│  ◉ Username and Password                             │
│  ○ Certificate                                        │
│                                                       │
│  Username: [                    ]                     │
│  Password: [                    ] [Autogenerate]      │
│                                                       │
│            [Create Database User]                     │
└──────────────────────────────────────────────────────┘
```

**À remplir:**

1. **Username:** `rtadmin` ✅

2. **Password:** Cliquez sur **"Autogenerate Secure Password"** ✅
   - ⚠️ **TRÈS IMPORTANT:** Une fenêtre apparaît avec le mot de passe
   - **COPIEZ-LE IMMÉDIATEMENT** et sauvegardez-le quelque part!
   - Exemple: `xK9mP2nQ7vL3zR8w`

3. Cliquez sur **"Create Database User"** ou **"Create User"**

---

## Étape 4: Configurer l'Accès Réseau 🌐

### 4.1 Toujours dans la popup
La popup passe à la section **"Where would you like to connect from?"**

```
┌──────────────────────────────────────────────────────┐
│  Where would you like to connect from?               │
│                                                       │
│  ◉ My Local Environment                              │
│  ○ Cloud Environment                                 │
│                                                       │
│  IP Address: [                    ] [Add Entry]      │
│                                                       │
│  Or: [Add My Current IP Address]                     │
│      [Allow Access from Anywhere] ✅                 │
│                                                       │
│            [Finish and Close]                         │
└──────────────────────────────────────────────────────┘
```

**À faire:**

1. Cliquez sur **"Allow Access from Anywhere"** ✅
   - Cela ajoute `0.0.0.0/0` (tous les IPs)
   - ⚠️ C'est ok pour le développement, on sécurisera plus tard

2. Cliquez sur **"Finish and Close"** ou **"Close"**

---

## Étape 5: Obtenir l'URI de Connexion 🔗

### 5.1 Aller à Database
Dans le menu de gauche, cliquez sur **"Database"** (icône 🗄️)

Vous devriez voir votre cluster `rt-auth-cluster` avec le statut **"Active"**

### 5.2 Se Connecter au Cluster
Cliquez sur le bouton **"Connect"** de votre cluster

```
┌──────────────────────────────────────────┐
│  rt-auth-cluster                         │
│  M0 Sandbox (Frankfurt)                  │
│                                           │
│  [Connect] ✅  [Browse Collections] [...] │
└──────────────────────────────────────────┘
```

### 5.3 Choisir la Méthode de Connexion
Une popup s'ouvre avec plusieurs options:

```
┌──────────────────────────────────────────────────────┐
│  Connect to rt-auth-cluster                          │
│                                                       │
│  [Shell]  [Drivers] ✅  [Compass]  [VS Code]         │
│                                                       │
└──────────────────────────────────────────────────────┘
```

Cliquez sur **"Drivers"** ✅

### 5.4 Configurer le Driver
Dans la section Drivers:

1. **Driver:** Node.js ✅ (déjà sélectionné)
2. **Version:** 6.8 or later ✅

### 5.5 Copier l'URI de Connexion

Vous verrez une section **"Connection string"** avec:

```
mongodb+srv://rtadmin:<password>@rt-auth-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=rt-auth-cluster
```

**À faire:**

1. **Cliquez sur le bouton de copie** à côté de l'URI ✅

2. **Collez-la dans un éditeur de texte** (Notepad, VSCode, etc.)

3. **Remplacez `<password>` par votre mot de passe réel**
   - Utilisez le mot de passe généré à l'étape 3.1
   - Exemple: Si le mot de passe est `xK9mP2nQ7vL3zR8w`

   **AVANT:**
   ```
   mongodb+srv://rtadmin:<password>@rt-auth-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=rt-auth-cluster
   ```

   **APRÈS:**
   ```
   mongodb+srv://rtadmin:xK9mP2nQ7vL3zR8w@rt-auth-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=rt-auth-cluster
   ```

4. **Ajoutez `/rt-auth` juste après `.net`**
   - Cela spécifie le nom de la base de données

   **AVANT:**
   ```
   mongodb+srv://rtadmin:xK9mP2nQ7vL3zR8w@rt-auth-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=rt-auth-cluster
   ```

   **APRÈS:**
   ```
   mongodb+srv://rtadmin:xK9mP2nQ7vL3zR8w@rt-auth-cluster.xxxxx.mongodb.net/rt-auth?retryWrites=true&w=majority&appName=rt-auth-cluster
   ```

5. **✅ Voilà votre URI finale!** Sauvegardez-la pour l'étape suivante!

---

## ✅ Vérification Rapide

Votre URI doit ressembler à ceci:

```
mongodb+srv://rtadmin:MOT_DE_PASSE@rt-auth-cluster.XXXXX.mongodb.net/rt-auth?retryWrites=true&w=majority&appName=rt-auth-cluster
```

Où:
- `rtadmin` = votre username ✅
- `MOT_DE_PASSE` = votre mot de passe généré (PAS `<password>`) ✅
- `XXXXX` = identifiant unique de votre cluster ✅
- `/rt-auth` = nom de la base de données ✅

---

## 🚀 Prochaine Étape: Déployer l'API

Maintenant que vous avez votre URI MongoDB, passons au déploiement de l'API:

```powershell
cd apps/api-auth
.\deploy-to-eb.ps1
```

Le script vous demandera l'URI MongoDB - collez celle que vous venez de créer!

---

## 🆘 Problèmes Courants

### "Je ne trouve pas le bouton Create"
→ Cherchez "Build a Database" ou "+ Create" en haut à gauche

### "Je n'ai pas reçu l'email de confirmation"
→ Vérifiez vos spams, ou utilisez "Sign up with Google"

### "Je ne vois pas eu-central-1"
→ Tapez "frankfurt" dans la barre de recherche des régions

### "J'ai oublié de copier le mot de passe"
→ Pas de panique! Allez dans Database Access → Cliquez sur "Edit" → "Edit Password" → Autogenerate

### "Mon URI ne fonctionne pas"
→ Vérifiez:
- Pas de `<password>` dans l'URI (remplacez par le vrai mot de passe)
- `/rt-auth` est bien présent après `.net`
- Pas d'espaces dans l'URI
- Le mot de passe ne contient pas de caractères spéciaux non encodés

---

## 📸 Besoin d'Aide Visuelle?

Si vous bloquez quelque part, dites-moi à quelle étape et je vous guide plus précisément!

**Étapes:**
1. ✅ Créer compte → https://www.mongodb.com/cloud/atlas/register
2. ✅ Créer cluster M0 → Frankfurt, rt-auth-cluster
3. ✅ Créer user → rtadmin + mot de passe généré
4. ✅ Accès réseau → 0.0.0.0/0
5. ✅ Obtenir URI → mongodb+srv://...

**Une fois l'URI obtenue, vous êtes prêt pour déployer l'API! 🎉**
