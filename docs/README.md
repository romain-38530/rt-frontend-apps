# RT Backend Services - Documentation API

Cette documentation décrit l'intégration des services backend RT dans les applications frontend.

## 📚 Documentation Disponible

### [API_INTEGRATION.md](./API_INTEGRATION.md)
Documentation complète de l'intégration API incluant :
- Configuration détaillée
- Tous les endpoints avec exemples
- Composants React complets
- Gestion d'erreurs et retry logic
- Tests unitaires
- Monitoring et analytics

### [API_QUICK_REF.md](./API_QUICK_REF.md)
Référence rapide avec :
- URLs des endpoints
- Exemples de code courts
- Codes pays UE avec taux TVA
- Tests curl rapides

## 🚀 Quick Start

### 1. Configuration

Les variables d'environnement sont déjà configurées dans AWS Amplify :

```bash
NEXT_PUBLIC_API_URL=https://d2i50a1vlg138w.cloudfront.net
NEXT_PUBLIC_VAT_API_URL=https://d2i50a1vlg138w.cloudfront.net
```

### 2. Fichiers Disponibles

```
apps/marketing-site/
├── src/
│   ├── types/
│   │   └── api.ts              # Types TypeScript pour l'API
│   ├── lib/
│   │   └── api-utils.ts        # Fonctions utilitaires API
│   └── hooks/
│       └── useVATValidation.ts # Hook React pour validation TVA
```

### 3. Utilisation dans vos Composants

```typescript
import { useVATValidation } from '@/hooks/useVATValidation';

export function MyComponent() {
  const { validate, loading, result, error } = useVATValidation();

  const handleSubmit = async (vatNumber: string) => {
    const result = await validate(vatNumber);
    if (result.valid) {
      console.log('Entreprise:', result.companyName);
    }
  };

  return (
    <div>
      {loading && <p>Validation en cours...</p>}
      {error && <p className="error">{error}</p>}
      {result?.valid && <p>✅ {result.companyName}</p>}
    </div>
  );
}
```

## 🔐 Services Disponibles

### ✅ Service d'Authentification (authz-eb)
**Status**: Déployé en production
**URL**: https://d2i50a1vlg138w.cloudfront.net
**Version**: v2.2.0

**Endpoints opérationnels**:
- `GET /health` - Health check
- `POST /api/vat/validate-format` - Validation format TVA
- `POST /api/vat/validate` - Validation complète TVA + infos entreprise
- `POST /api/vat/calculate-price` - Calcul prix avec TVA

**Fonctionnalités**:
- ✅ Validation TVA avec système de fallback multi-API (VIES → AbstractAPI → APILayer)
- ✅ Pré-remplissage automatique des données entreprise
- ✅ Calcul automatique des prix TTC/HT
- ✅ Support de 27 pays UE + UK
- ✅ Cache intelligent (1h)
- ✅ Monitoring et traçabilité

### ⏳ Service Abonnements & Contrats (subscriptions-contracts)
**Status**: En développement (non déployé)

**Endpoints prévus**:
- Plans d'abonnement (CRUD)
- Abonnements (création, renouvellement, annulation)
- Factures et paiements
- Contrats (création, signature électronique)
- Templates de contrats

## 🧪 Tests

### Test de Validation TVA

```bash
# Depuis rt-frontend-apps/
powershell -ExecutionPolicy Bypass -File test-vat-production.ps1
```

### Tests Manuels

```bash
# Health check
curl https://d2i50a1vlg138w.cloudfront.net/health

# Validation TVA Belgique
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/vat/validate \
  -H "Content-Type: application/json" \
  -d '{"vatNumber":"BE0417497106"}'

# Calcul prix France
curl -X POST https://d2i50a1vlg138w.cloudfront.net/api/vat/calculate-price \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"countryCode":"FR"}'
```

## 📦 Architecture

```
Frontend (HTTPS Next.js)
    ↓
AWS Amplify
    ↓
CloudFront (HTTPS + CDN)
    ↓
Elastic Beanstalk (authz-eb v2.2.0)
    ↓
Validation TVA multi-API:
    1. VIES (gratuite, prioritaire)
    2. AbstractAPI (fallback payante)
    3. APILayer (fallback final)
```

## 🔗 Liens Utiles

- **Frontend Production**: https://main.df8cnylp3pqka.amplifyapp.com
- **API Production**: https://d2i50a1vlg138w.cloudfront.net
- **AWS Amplify Console**: [Console Amplify](https://eu-central-1.console.aws.amazon.com/amplify)
- **AWS Elastic Beanstalk**: [Console EB](https://eu-central-1.console.aws.amazon.com/elasticbeanstalk)

## 📝 Changelog

### 2025-11-24
- ✅ Déploiement backend v2.2.0 avec système de fallback multi-API
- ✅ Configuration HTTPS CloudFront pour authz-eb
- ✅ Intégration frontend avec validation TVA stricte
- ✅ Documentation complète API
- ✅ Hooks React pour validation TVA
- ✅ Tests automatisés PowerShell

## 🆘 Support

Pour toute question ou problème :
1. Consulter [API_INTEGRATION.md](./API_INTEGRATION.md) pour la documentation complète
2. Vérifier les logs dans AWS CloudWatch
3. Tester les endpoints avec les exemples dans [API_QUICK_REF.md](./API_QUICK_REF.md)
