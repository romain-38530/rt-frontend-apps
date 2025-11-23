# 🧪 Identifiants de Démo - SYMPHONI.A

## Comptes de Test par Portail

### 🏭 Web Industry (Industrie)
**URL:** https://main.dbg6okncuyyiw.amplifyapp.com

- **Email:** `industry@demo.symphoni-a.com`
- **Mot de passe:** `Industry2024!`
- **Rôle:** Manufacturer
- **Abonnement:** Pro

### 📦 Web Supplier (Fournisseur)
**URL:** https://main.dzvo8973zaqb.amplifyapp.com

- **Email:** `supplier@demo.symphoni-a.com`
- **Mot de passe:** `Supplier2024!`
- **Rôle:** Supplier
- **Abonnement:** Pro

### 🚚 Web Transporter (Transporteur)
**URL:** https://main.d1tb834u144p4r.amplifyapp.com

- **Email:** `transporter@demo.symphoni-a.com`
- **Mot de passe:** `Transport2024!`
- **Rôle:** Transporter
- **Abonnement:** Enterprise

### 🌐 Web Forwarder (Transitaire)
**URL:** https://main.d3hz3xvddrl94o.amplifyapp.com

- **Email:** `forwarder@demo.symphoni-a.com`
- **Mot de passe:** `Forwarder2024!`
- **Rôle:** Forwarder
- **Abonnement:** Pro

### 📊 Web Logistician (Logisticien)
**URL:** https://main.d31p7m90ewg4xm.amplifyapp.com

- **Email:** `logistician@demo.symphoni-a.com`
- **Mot de passe:** `Logistics2024!`
- **Rôle:** Logistician
- **Abonnement:** Enterprise

### 📍 Web Recipient (Destinataire)
**URL:** https://main.d3b6p09ihn5w7r.amplifyapp.com

- **Email:** `recipient@demo.symphoni-a.com`
- **Mot de passe:** `Recipient2024!`
- **Rôle:** Recipient
- **Abonnement:** Free

---

## 🔑 Compte Administrateur

### Admin Backoffice
**URL:** https://main.d23mv8xwxo0rr0.amplifyapp.com

- **Email:** `admin@demo.symphoni-a.com`
- **Mot de passe:** `Admin2024!`
- **Rôle:** Super Admin
- **Accès:** Tous les portails + administration

---

## 🧪 Mode Test (Sans API)

Tous les portails incluent un bouton **"Connexion de test (démo)"** qui permet de se connecter sans appeler l'API backend. Utile pour :
- Tester l'interface utilisateur
- Vérifier le design et les fonctionnalités frontend
- Développement sans backend

Lors de l'utilisation du mode test, l'utilisateur est automatiquement connecté avec :
- **Email:** `test@symphoni-a.com`
- **Rôle:** Admin
- **Token:** `demo-token`

---

## 📝 Instructions de Test

### 1. Test Rapide (Mode Démo)
1. Accédez à l'URL du portail
2. Cliquez sur "Connexion de test (démo)"
3. Explorez les fonctionnalités

### 2. Test Complet (Avec API)
1. Accédez à l'URL du portail
2. Utilisez les identifiants ci-dessus
3. Testez la connexion au backend
4. Vérifiez les fonctionnalités métier

### 3. Test Multilingue
1. Connectez-vous à un portail
2. Cliquez sur le sélecteur de langue (🌍)
3. Testez : Français, English, Deutsch, Español, Italiano

### 4. Test des Abonnements
1. Connectez-vous avec un compte Free
2. Naviguez vers la page "Abonnement"
3. Observez les fonctionnalités verrouillées (🔒)
4. Testez le passage à Pro ou Enterprise

---

## 🔒 Sécurité

**⚠️ IMPORTANT:** Ces identifiants sont uniquement pour les environnements de démonstration et de test.

- Ne jamais utiliser en production
- Les mots de passe doivent être changés dans un environnement de production
- Les comptes de test ont des permissions limitées

---

## 🛠️ Administration

Pour créer ces utilisateurs dans MongoDB, utilisez le script :
```bash
node create-demo-users.js
```

Ou importez directement avec MongoDB Compass :
```bash
mongoimport --uri "mongodb+srv://..." --collection users --file demo-users.json
```

---

## 📊 Matrice de Test

| Portail | Compte Démo | Fonctionnalités Clés à Tester |
|---------|-------------|-------------------------------|
| Industry | industry@demo | Gestion production, commandes, planning |
| Supplier | supplier@demo | Catalogue produits, gestion stocks |
| Transporter | transporter@demo | Suivi véhicules, eCMR, planification routes |
| Forwarder | forwarder@demo | Gestion multi-transporteurs, palettes |
| Logistician | logistician@demo | KPI, analytics, optimisation globale |
| Recipient | recipient@demo | Suivi livraisons, notifications, réceptions |

---

**Dernière mise à jour:** 2025-11-23
**Version:** 1.0.0
