# RT Technologie - Site Marketing & Onboarding

Application Next.js pour l'inscription et l'onboarding des nouveaux clients RT Technologie.

## 🎯 Fonctionnalités

- **Page d'inscription** (`/onboarding`) : Formulaire en 5 étapes
  - Vérification TVA automatique
  - Pré-remplissage des données entreprise
  - Choix d'abonnement
  - Génération de contrat PDF

- **Page de signature** (`/sign-contract/[contractId]`) : Signature électronique
  - Visualisation du contrat PDF
  - Canvas de signature tactile
  - Conformité eIDAS
  - Horodatage certifié

## 🚀 Démarrage Local

### Prérequis

- Node.js 20+
- npm ou yarn
- Service backend client-onboarding en cours d'exécution (port 3020)

### Installation

```bash
cd apps/marketing-site
npm install
```

### Développement

```bash
# Créer le fichier .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3020" > .env.local

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build de Production

```bash
npm run build
npm start
```

## 📦 Déploiement Vercel

### Option 1 : Via Interface Web Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Importer le repository GitHub
3. Sélectionner `apps/marketing-site` comme Root Directory
4. Configurer les variables d'environnement :
   - `NEXT_PUBLIC_API_URL` : URL de votre backend (ex: `https://api.rt-technologie.com`)
5. Déployer

### Option 2 : Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer (depuis le dossier apps/marketing-site)
cd apps/marketing-site
vercel

# Déployer en production
vercel --prod
```

### Configuration Vercel

Les variables d'environnement requises :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL du service backend | `https://api.rt-technologie.com` |

**Important** : Ne pas mettre `http://localhost:3020` en production !

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env.local` pour le développement :

```env
NEXT_PUBLIC_API_URL=http://localhost:3020
```

Pour la production sur Vercel, configurer via l'interface ou CLI :

```bash
vercel env add NEXT_PUBLIC_API_URL
# Entrer : https://api.rt-technologie.com
```

### Backend

Le frontend communique avec le service backend `client-onboarding` via ces endpoints :

- `POST /api/onboarding/verify-vat` - Vérification TVA
- `POST /api/onboarding/submit` - Soumission inscription
- `GET /api/onboarding/contract/:contractId` - Récupération contrat PDF
- `POST /api/onboarding/sign/:contractId` - Signature contrat

**Important** : Configurer CORS sur le backend pour autoriser le domaine Vercel.

## 📁 Structure

```
apps/marketing-site/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Layout principal
│   │   ├── globals.css          # Styles globaux
│   │   ├── onboarding/
│   │   │   └── page.tsx         # Page d'inscription (5 étapes)
│   │   └── sign-contract/
│   │       └── [contractId]/
│   │           └── page.tsx     # Page de signature
│   └── components/              # Composants réutilisables (à créer)
├── public/                      # Assets statiques
├── package.json
├── next.config.js               # Configuration Next.js
├── tailwind.config.js           # Configuration Tailwind
├── tsconfig.json                # Configuration TypeScript
├── vercel.json                  # Configuration Vercel
└── README.md
```

## 🎨 Stack Technique

- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Déploiement** : Vercel
- **API Backend** : Node.js/Express (service client-onboarding)

## 🔗 Liens

- **Backend Service** : [services/client-onboarding](../../services/client-onboarding)
- **Documentation Système** : [docs/CLIENT_ONBOARDING_SYSTEM.md](../../docs/CLIENT_ONBOARDING_SYSTEM.md)
- **Guide Déploiement Vercel** : [docs/VERCEL_DEPLOYMENT.md](../../docs/VERCEL_DEPLOYMENT.md)

## 🐛 Dépannage

### Erreur "Network Error" ou "Failed to fetch"

- Vérifier que le service backend est en cours d'exécution
- Vérifier `NEXT_PUBLIC_API_URL` dans `.env.local`
- Vérifier CORS sur le backend

### Build Vercel échoue

- Vérifier que toutes les dépendances sont dans `package.json`
- Vérifier la syntaxe TypeScript
- Vérifier les logs de build Vercel

### Page blanche après déploiement

- Ouvrir la console navigateur pour voir les erreurs
- Vérifier que `NEXT_PUBLIC_API_URL` est configuré sur Vercel
- Vérifier que le backend est accessible depuis Internet

## 📞 Support

Pour toute question, consulter :
- Documentation complète : [docs/](../../docs)
- QuickStart : [QUICKSTART.md](../../QUICKSTART.md)

---

**Version** : 1.0.0
**Date** : Novembre 2025
