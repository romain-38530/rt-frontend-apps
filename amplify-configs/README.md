# Guide d'Intégration Manuelle des BuildSpecs AWS Amplify

## Instructions

Pour chaque portal, tu dois intégrer manuellement le buildSpec dans la console AWS Amplify:

### Étape 1: Accéder à la Console AWS Amplify

1. Aller sur https://eu-central-1.console.aws.amazon.com/amplify/home?region=eu-central-1
2. Sélectionner l'application (ex: app/web-transporter)

### Étape 2: Configurer le BuildSpec

1. Dans le menu de gauche, cliquer sur "App settings" > "Build settings"
2. Descendre jusqu'à "Build specification"
3. Cliquer sur "Edit"
4. Cocher "Add build spec" ou sélectionner "Use the Amplify console"
5. Copier le contenu du fichier YAML correspondant
6. Coller dans le champ "Build specification YAML"
7. Cliquer sur "Save"

### Étape 3: Déclencher un Nouveau Build

1. Aller dans l'onglet "Hosting" ou "Branch"
2. Cliquer sur "Redeploy this version" ou "Run build"

## Fichiers de Configuration

| Portal | Fichier | App ID AWS |
|--------|---------|------------|
| web-transporter | `web-transporter.yml` | d1tb834u144p4r |
| web-recipient | `web-recipient.yml` | d3b6p09ihn5w7r |
| web-supplier | `web-supplier.yml` | dzvo8973zaqb |
| web-forwarder | `web-forwarder.yml` | d3hz3xvddrl94o |
| web-industry | `web-industry.yml` | dbg6okncuyyiw |
| web-logistician | `web-logistician.yml` | d31p7m90ewg4xm |

## Notes Importantes

- Ces configurations utilisent `transpilePackages` dans `next.config.js` pour compiler automatiquement les packages workspace (@repo/ui-components, @rt/contracts, @rt/utils)
- Pas besoin de builder les packages séparément
- Next.js va les transpiler directement pendant le build
- L'export statique génère des fichiers HTML/CSS/JS dans le dossier `out/`

## Vérification après Déploiement

Une fois le build réussi, vérifier que:
1. Le logo SYMPHONI.A s'affiche correctement
2. Le tagline "L'IA qui orchestre vos flux transport." apparaît
3. Le design glassmorphism fonctionne
4. Le système d'abonnement (Free/Pro/Enterprise) est présent
