# État des Déploiements AWS Amplify

## Résumé Exécutif

**Date**: 21 novembre 2025
**Statut Global**: En cours de débogage

## Applications Créées

### ✅ Applications Déployées avec Succès

1. **backoffice-admin**
   - App ID: `dntbizetlc7bm`
   - URL: https://main.dntbizetlc7bm.amplifyapp.com
   - Statut: ✅ DEPLOYED
   - Mode: Next.js Standalone
   - Domaines configurés:
     - backoffice.rt-technologie.com
     - www.rt-technologie.com

2. **marketing-site**
   - App ID: `dxxxxxxxxxxxx` (à confirmer)
   - URL: À configurer
   - Statut: Non déployé

### ⏳ Applications en Cours de Débogage

3. **web-industry** (Portail Industrie)
   - App ID: `dbg6okncuyyiw`
   - URL Prévue: https://main.dbg6okncuyyiw.amplifyapp.com
   - Statut: ❌ BUILD FAILED
   - Erreur: "Server trace files are not found"
   - Port Dev: 3101

4. **web-transporter** (Portail Transporteur)
   - App ID: `d1tb834u144p4r`
   - URL Prévue: https://main.d1tb834u144p4r.amplifyapp.com
   - Statut: ❌ BUILD FAILED
   - Erreur: "Server trace files are not found"
   - Port Dev: 3102

5. **web-recipient** (Portail Destinataire)
   - App ID: `d3b6p09ihn5w7r`
   - URL Prévue: https://main.d3b6p09ihn5w7r.amplifyapp.com
   - Statut: ❌ BUILD FAILED
   - Erreur: "Server trace files are not found"
   - Port Dev: 3103

6. **web-supplier** (Portail Fournisseur)
   - App ID: `dzvo8973zaqb`
   - URL Prévue: https://main.dzvo8973zaqb.amplifyapp.com
   - Statut: ❌ BUILD FAILED
   - Erreur: "Server trace files are not found"
   - Port Dev: 3104

7. **web-forwarder** (Portail Transitaire)
   - App ID: `d3hz3xvddrl94o`
   - URL Prévue: https://main.d3hz3xvddrl94o.amplifyapp.com
   - Statut: ❌ BUILD FAILED
   - Erreur: "Server trace files are not found"
   - Port Dev: 3105

8. **web-logistician** (Portail Logisticien)
   - App ID: `d31p7m90ewg4xm`
   - URL Prévue: https://main.d31p7m90ewg4xm.amplifyapp.com
   - Statut: ❌ BUILD FAILED
   - Erreur: "Server trace files are not found"
   - Port Dev: 3106

## Problèmes Rencontrés

### 1. Erreur: Can't find required-server-files.json
**Résolu** ✅
- **Cause**: AWS Amplify cherchait ce fichier dans le dossier de déploiement
- **Solution**: Ajout de la copie du fichier dans amplify.yml

### 2. Erreur: Server trace files are not found
**En cours** ⏳
- **Cause**: Structure standalone de Next.js dans monorepo incompatible avec AWS Amplify Hosting
- **Erreur exacte**: "Server trace files are not found in /codebuild/output/src.../apps/web-industry/deploy"
- **Solutions explorées**:
  - ✅ Mode export statique (incompatible car Amplify cherche required-server-files.json)
  - ✅ Mode standalone avec copie manuelle (incompatible car manque les trace files)
  - ⏳ Mode standalone avec structure complète (à tester)

## Configuration Actuelle

### Next.js
- Version: 14.2.5
- Mode: `output: 'standalone'`
- Build: Réussit toujours sans erreur
- Problème: Au moment du déploiement sur Amplify

### AWS Amplify
- Région: eu-central-1 (Frankfurt)
- Build Compute: STANDARD_8GB
- Monorepo: pnpm workspace
- GitHub Token: Configuré

### Structure Monorepo
```
rt-frontend-apps/
├── apps/
│   ├── backoffice-admin/      ✅ Fonctionne
│   ├── marketing-site/        ⏸️ Pas déployé
│   ├── web-industry/          ❌ En débogage
│   ├── web-transporter/       ❌ En débogage
│   ├── web-recipient/         ❌ En débogage
│   ├── web-supplier/          ❌ En débogage
│   ├── web-forwarder/         ❌ En débogage
│   └── web-logistician/       ❌ En débogage
├── packages/
│   ├── contracts/             ✅ Build OK
│   └── utils/                 ✅ Build OK
└── amplify.yml
```

## Prochaines Étapes

### Court Terme
1. ⏳ Débugger l'erreur "Server trace files not found"
2. ⏳ Tester différentes approches de copie des fichiers standalone
3. ⏳ Vérifier la compatibilité AWS Amplify Hosting avec Next.js standalone en monorepo

### Moyen Terme
4. ⏸️ Déployer marketing-site
5. ⏸️ Configurer les domaines personnalisés pour chaque portail
6. ⏸️ Configurer DNS dans OVH

### Long Terme
7. ⏸️ Optimiser les builds avec cache Amplify
8. ⏸️ Ajouter monitoring et alertes
9. ⏸️ Documentation complète du processus de déploiement

## Commits Récents

- `3f57677`: fix: Add required-server-files.json copy to all app builds
- `75b5e4a`: fix: Update amplify.yml to use standalone mode for all 6 new apps
- `705b3e2`: fix: Switch to output: standalone for AWS Amplify compatibility
- `c55e86f`: feat: Add 6 new portal applications
- `7c57eef`: fix: Switch to static export for AWS Amplify Hosting compatibility

## Notes Techniques

### Build Spec Pattern Utilisé
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - cd ../..
        - pnpm install
        - cd apps/[APP_NAME]
    build:
      commands:
        - pnpm run build
        - mkdir -p deploy
        - cp -r .next/standalone/apps/[APP_NAME]/* deploy/
        - cp -r .next/standalone/apps/[APP_NAME]/.next deploy/
        - cp -r .next/static deploy/.next/static
        - cp -r public deploy/public || true
        - cp .next/required-server-files.json deploy/ || echo "{}" > deploy/required-server-files.json
  artifacts:
    baseDirectory: deploy
    files:
      - '**/*'
  cache:
    paths:
      - ../../node_modules/**/*
      - .next/cache/**/*
```

### Amélioration du Design Backoffice

✅ **Complété** - Un agent a modernisé complètement le design du backoffice-admin:
- Dashboard moderne avec 20+ sections
- Composants UI réutilisables (StatCard, DashboardCard, ActivityChart)
- Sidebar professionnelle avec navigation
- Header avec recherche et notifications
- Graphiques interactifs avec Recharts
- Système de design cohérent avec Tailwind
- Animations fluides
- Documentation complète (4 fichiers MD)

## Ressources

- [AWS Amplify Console](https://eu-central-1.console.aws.amazon.com/amplify/home?region=eu-central-1)
- [GitHub Repository](https://github.com/romain-38530/rt-frontend-apps)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)

---

**Dernière mise à jour**: 21/11/2025 21:35
**Par**: Claude Code Agent
