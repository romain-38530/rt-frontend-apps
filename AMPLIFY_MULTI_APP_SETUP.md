# Configuration Multi-Apps AWS Amplify

## Apps à créer

Vous devez créer 6 nouvelles applications Amplify en plus de `rt-frontend-apps` (backoffice-admin).

| Application | Nom Amplify | AMPLIFY_MONOREPO_APP_ROOT | URL prévue |
|------------|-------------|---------------------------|------------|
| web-industry | web-industry | apps/web-industry | https://main.xxxxx.amplifyapp.com |
| web-transporter | web-transporter | apps/web-transporter | https://main.xxxxx.amplifyapp.com |
| web-recipient | web-recipient | apps/web-recipient | https://main.xxxxx.amplifyapp.com |
| web-supplier | web-supplier | apps/web-supplier | https://main.xxxxx.amplifyapp.com |
| web-forwarder | web-forwarder | apps/web-forwarder | https://main.xxxxx.amplifyapp.com |
| web-logistician | web-logistician | apps/web-logistician | https://main.xxxxx.amplifyapp.com |

## Étapes pour créer chaque app via AWS Console

Pour CHAQUE application ci-dessus, suivez ces étapes:

### 1. Créer la nouvelle app

1. Allez sur [AWS Amplify Console](https://eu-central-1.console.aws.amazon.com/amplify/home?region=eu-central-1#/)
2. Cliquez sur "New app" > "Host web app"
3. Sélectionnez "GitHub" et cliquez "Continue"
4. Sélectionnez le repository `romain-38530/rt-frontend-apps`
5. Sélectionnez la branche `main`
6. Cochez "Connecting a monorepo? Pick a folder"
7. Dans le champ qui apparaît, entrez: `apps/web-industry` (ou le nom de l'app correspondante)
8. Donnez un nom à l'app (par exemple: `web-industry`)
9. Cliquez "Next"

### 2. Configurer les build settings

1. AWS Amplify devrait détecter automatiquement le fichier `amplify.yml`
2. Le build spec devrait pointer vers la bonne application du monorepo
3. Vérifiez que la configuration correspond à:

```yaml
version: 1
applications:
  - appRoot: apps/web-industry  # ou le nom de l'app
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm@8.15.4
            - cd ../..
            - echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" >> .npmrc
            - pnpm install
            - cd packages/contracts && pnpm run build && cd ../..
            - cd packages/utils && pnpm run build && cd ../..
            - cd apps/web-industry
        build:
          commands:
            - pnpm run build
      artifacts:
        baseDirectory: out
        files:
          - '**/*'
```

4. Cliquez "Next"

### 3. Variables d'environnement

Ajoutez ces variables d'environnement (Menu "Environment variables"):

| Variable | Valeur |
|----------|--------|
| `GITHUB_TOKEN` | `<votre-github-token>` |
| `AMPLIFY_MONOREPO_APP_ROOT` | `apps/web-industry` (adapter selon l'app) |
| `AMPLIFY_DIFF_DEPLOY` | `false` |

### 4. Lancer le build

1. Cliquez "Save and deploy"
2. AWS Amplify va:
   - Cloner le repo GitHub
   - Installer les dépendances avec pnpm
   - Builder l'application Next.js en mode export statique
   - Déployer sur CloudFront CDN
3. Attendez que le build se termine (statut SUCCEED)
4. Notez l'URL de déploiement fournie

### 5. Répéter pour chaque application

Répétez les étapes 1-4 pour:
- web-transporter (apps/web-transporter)
- web-recipient (apps/web-recipient)
- web-supplier (apps/web-supplier)
- web-forwarder (apps/web-forwarder)
- web-logistician (apps/web-logistician)

## Alternative: Script automatisé (nécessite OAuth)

Si vous voulez automatiser, vous devrez:
1. Configurer OAuth GitHub App pour AWS Amplify
2. Utiliser AWS CLI avec les credentials OAuth
3. Créer les apps via script

**Recommandation:** Utilisez AWS Console pour créer les 6 apps manuellement. C'est plus rapide et plus fiable.

## URLs de déploiement

Une fois toutes les apps créées, vous aurez:

```
backoffice-admin: https://main.dntbizetlc7bm.amplifyapp.com (✓ déjà créé)
web-industry: https://main.xxxxxxxx.amplifyapp.com
web-transporter: https://main.xxxxxxxx.amplifyapp.com
web-recipient: https://main.xxxxxxxx.amplifyapp.com
web-supplier: https://main.xxxxxxxx.amplifyapp.com
web-forwarder: https://main.xxxxxxxx.amplifyapp.com
web-logistician: https://main.xxxxxxxx.amplifyapp.com
```

## Domaines personnalisés (optionnel)

Après création, vous pourrez configurer des domaines personnalisés pour chaque app:
- industry.rt-technologie.com
- transporter.rt-technologie.com
- recipient.rt-technologie.com
- supplier.rt-technologie.com
- forwarder.rt-technologie.com
- logistician.rt-technologie.com
