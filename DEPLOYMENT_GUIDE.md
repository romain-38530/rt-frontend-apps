# 🚀 Guide de Déploiement SYMPHONI.A Frontend

## 📋 Prérequis

- ✅ Node.js 18+ installé
- ✅ pnpm installé
- ✅ URLs des APIs backend
- ✅ Compte Vercel (recommandé)
- ✅ Clés API (TomTom, Google Maps, AWS)

## 🔧 Configuration Backend

### 1. Créer .env.production
cp .env.production.example .env.production

### 2. Remplir les URLs backend dans .env.production

## 🏗️ Build Local

pnpm install
pnpm build

## ☁️ Déploiement Vercel

1. Connecter GitHub repo sur vercel.com
2. Pour chaque portail:
   - Root Directory: apps/web-industry
   - Build Command: cd ../.. && pnpm install && pnpm build --filter=web-industry
   - Output Directory: .next
3. Ajouter variables d'environnement
4. Deploy!

## 🚀 URLs Production

- Industry: https://industry.symphonia.com
- Transporter: https://transporter.symphonia.com
- Forwarder: https://forwarder.symphonia.com
- Supplier: https://supplier.symphonia.com
- Logistician: https://logistician.symphonia.com
- Recipient: https://recipient.symphonia.com

**Le frontend est prêt pour la production! 🎉**
