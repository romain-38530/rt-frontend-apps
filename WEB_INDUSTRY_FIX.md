# Fix AWS Amplify Deployment - web-industry

## Probleme identifie

### Erreur AWS Amplify
```
Server trace files are not found in /codebuild/output/src.../apps/web-industry/deploy
```

### Cause racine
AWS Amplify cherche les fichiers de trace serveur Next.js (.nft.json et trace) pour optimiser le deploiement des applications en mode `standalone`. Ces fichiers sont generes par Next.js lors du build mais ne sont PAS copies dans le dossier standalone par defaut.

#### Fichiers manquants
1. `.next/next-server.js.nft.json` - Fichier de trace principal du serveur Next.js
2. `.next/next-minimal-server.js.nft.json` - Fichier de trace du serveur minimal
3. `.next/trace` - Fichier de trace complet

Ces fichiers sont generes a la racine de `.next/` mais ne sont PAS inclus dans `.next/standalone/`.

## Solution appliquee

### Modifications dans amplify.yml

Pour chaque application utilisant `output: 'standalone'` (web-industry, web-transporter, web-supplier, web-forwarder, web-logistician), ajout de ces commandes dans la section build:

```yaml
# Copy server trace files needed by AWS Amplify
- cp .next/*.nft.json deploy/.next/ || true
- cp .next/trace deploy/.next/ || true
```

### Applications corrigees
1. **web-industry** - Principal probleme resolu
2. **web-transporter** - Correction preventive
3. **web-supplier** - Correction preventive
4. **web-forwarder** - Correction preventive
5. **web-logistician** - Correction preventive

### Applications non modifiees
- **backoffice-admin** - Utilise `output: 'export'` (export statique)
- **marketing-site** - Utilise `output: 'export'` (export statique)
- **web-recipient** - Utilise `output: 'export'` (export statique)

## Structure de deploiement complete

Apres le build, le dossier `deploy` contient maintenant:

```
deploy/
├── server.js                          # Serveur Node.js standalone
├── pages/                              # Pages precompilees
├── public/                             # Assets publics
└── .next/
    ├── BUILD_ID
    ├── build-manifest.json
    ├── required-server-files.json
    ├── routes-manifest.json
    ├── next-server.js.nft.json        # NOUVEAU - Fichier de trace serveur
    ├── next-minimal-server.js.nft.json # NOUVEAU - Fichier de trace minimal
    ├── trace                           # NOUVEAU - Fichier de trace complet
    ├── static/                         # Assets statiques
    └── server/
        └── pages/
            ├── index.js.nft.json
            ├── _app.js.nft.json
            ├── _document.js.nft.json
            └── _error.js.nft.json
```

## Validation locale

Test effectue en local pour web-industry:

```bash
cd apps/web-industry
pnpm run build
mkdir -p deploy
cp -r .next/standalone/apps/web-industry/* deploy/
cp -r .next/standalone/apps/web-industry/.next deploy/
cp -r .next/static deploy/.next/static
cp -r public deploy/public || true
cp .next/*.nft.json deploy/.next/ || true
cp .next/trace deploy/.next/ || true
cp .next/required-server-files.json deploy/.next/ || echo "{}" > deploy/.next/required-server-files.json

# Verification
ls -la deploy/.next/*.nft.json
# Output: next-minimal-server.js.nft.json, next-server.js.nft.json

ls -la deploy/.next/trace
# Output: trace file present
```

## Prochaines etapes

1. Commit et push des modifications
2. AWS Amplify detectera automatiquement les changements
3. Le build devrait reussir avec les fichiers de trace presents
4. L'application web-industry sera deployee sur https://main.dbg6okncuyyiw.amplifyapp.com

## Ameliorations complementaires

Dans amplify.yml, j'ai aussi:
- Ajoute la version specifique de pnpm (8.15.4) pour toutes les apps
- Ajoute l'authentification GitHub Packages pour toutes les apps
- Ajoute le build des packages partages (contracts, utils) pour toutes les apps
- Ajoute le cache `.pnpm-store` pour toutes les apps

Ces ameliorations garantissent la coherence entre toutes les applications du monorepo.
