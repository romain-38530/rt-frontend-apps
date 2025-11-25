# 🎯 Plan d'Action Immédiat - Post v2.6.0

**Backend Status**: ✅ Production GREEN
**Date**: 2025-11-25
**Version**: v2.6.0-jwt-stripe

---

## 🔴 **ACTIONS CRITIQUES (À FAIRE MAINTENANT - 45 min)**

### 1. Sécuriser les Secrets JWT (15 min) - **PRIORITÉ 1**

**⚠️ CRITIQUE**: Les secrets JWT actuels sont des valeurs par défaut, il faut les régénérer pour la production.

#### Étape 1.1: Générer de Nouveaux Secrets

```bash
# Générer JWT_SECRET (64 caractères)
openssl rand -base64 64

# Exemple de sortie:
# xK7p9mNvR2qT5wL8jD3fH6nB1cY4eZ0aW9sE8tU7iO5pQ2rL6mK3xN9vC1bM4gH8

# Générer JWT_REFRESH_SECRET (64 caractères)
openssl rand -base64 64

# Exemple de sortie:
# qL3mK9xP7tN5wC2eR8fY1sZ4aD6bH0nJ5iT7uO9pW3qL2xM8vK6rN4cE1gB7jH0
```

**Sauvegarder temporairement** (fichier local à supprimer après):
```bash
# jwt-secrets.txt (NE PAS COMMITTER)
JWT_SECRET=xK7p9mNvR2qT5wL8jD3fH6nB1cY4eZ0aW9sE8tU7iO5pQ2rL6mK3xN9vC1bM4gH8
JWT_REFRESH_SECRET=qL3mK9xP7tN5wC2eR8fY1sZ4aD6bH0nJ5iT7uO9pW3qL2xM8vK6rN4cE1gB7jH0
```

#### Étape 1.2: Mettre à Jour AWS Elastic Beanstalk

**Via AWS Console** (Recommandé):

1. Aller sur https://console.aws.amazon.com/elasticbeanstalk
2. Sélectionner **rt-subscriptions-api → rt-subscriptions-api-prod**
3. Cliquer sur **Configuration** (menu gauche)
4. Scroller jusqu'à **Software** → **Edit**
5. Dans **Environment properties**, trouver ou ajouter:

```
JWT_SECRET = [Coller le nouveau secret de 64 caractères]
JWT_REFRESH_SECRET = [Coller le nouveau secret de 64 caractères]
```

6. **Apply** (attendre 1-2 minutes pour le redéploiement)
7. Vérifier que le status reste **Green**

**Via AWS CLI** (Avancé):

```bash
aws elasticbeanstalk update-environment \
  --environment-name rt-subscriptions-api-prod \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_SECRET,Value=xK7p9mNvR2qT5wL8... \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_REFRESH_SECRET,Value=qL3mK9xP7tN5wC2e...
```

#### Étape 1.3: Tester Après Mise à Jour

```bash
# Test: Register un nouvel utilisateur
curl -X POST http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-security@example.com",
    "password": "SecurePassword123!",
    "firstName": "Test",
    "lastName": "Security",
    "role": "carrier"
  }'

# Réponse attendue:
# {"success":true,"message":"User registered successfully"}
```

**✅ Validation**: Si register fonctionne, les nouveaux secrets sont actifs.

**⏱️ Temps**: 15 minutes

---

### 2. Configurer CORS Strict (10 min) - **PRIORITÉ 2**

**⚠️ IMPORTANT**: CORS est actuellement ouvert à tous les domaines (`origin: '*'`), il faut le restreindre.

#### Option A: Configuration Directe dans le Code (Si Accès au Backend)

**Fichier**: `src/index.js` ou `src/app.js`

**Modifier la configuration CORS**:

```javascript
// AVANT (INSÉCURISÉ):
app.use(cors({
  origin: '*',  // ❌ Accepte tous les domaines
  credentials: true
}));

// APRÈS (SÉCURISÉ):
const allowedOrigins = [
  'https://rt-technologie.com',
  'https://www.rt-technologie.com',
  'https://app.rt-technologie.com',
  // Ajouter vos domaines frontend autorisés
];

// Pour développement local, ajouter conditionnellement:
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://localhost:3001');
}

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (comme Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Déployer** après modification:
```bash
git add src/index.js
git commit -m "security: Configure strict CORS policy"
git push origin main

# Puis redéployer sur EB
```

#### Option B: Variable d'Environnement (Plus Flexible)

**Ajouter dans AWS EB Environment Properties**:

```
ALLOWED_ORIGINS=https://rt-technologie.com,https://www.rt-technologie.com,https://app.rt-technologie.com
```

**Dans le code** (si non déjà fait):

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];  // Fallback

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

**⏱️ Temps**: 10 minutes

---

### 3. Activer HTTPS avec CloudFront (20 min) - **PRIORITÉ 3**

**⚠️ CRITIQUE**: Actuellement l'API est en HTTP, il faut activer HTTPS pour sécuriser les tokens JWT.

#### Étape 3.1: Créer une Distribution CloudFront

1. Aller sur https://console.aws.amazon.com/cloudfront
2. Cliquer sur **Create distribution**
3. **Origin Settings**:
   - **Origin domain**: `rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com`
   - **Protocol**: HTTP only (EB gère HTTP)
   - **Name**: `rt-api-origin`

4. **Default cache behavior**:
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache policy**: CachingDisabled (pour API)
   - **Origin request policy**: AllViewer

5. **Settings**:
   - **Price class**: Use all edge locations (best performance)
   - **Alternate domain name (CNAME)**: `api.rt-technologie.com` (optionnel)
   - **Custom SSL certificate**: Demander un certificat ACM ou utiliser par défaut

6. **Create distribution**

#### Étape 3.2: Attendre le Déploiement (~10 min)

Status: **In Progress** → **Deployed**

#### Étape 3.3: Obtenir l'URL CloudFront

Format: `https://d1234abcd5678.cloudfront.net`

#### Étape 3.4: Tester via HTTPS

```bash
# Test via CloudFront HTTPS
curl https://d1234abcd5678.cloudfront.net/health

# Réponse attendue:
# {"status":"healthy","service":"subscriptions-contracts",...}
```

#### Étape 3.5: (Optionnel) Configurer un Domaine Custom

**Si vous avez `api.rt-technologie.com`**:

1. **Demander un certificat SSL dans ACM**:
   - Aller sur https://console.aws.amazon.com/acm
   - **Region**: US East (N. Virginia) - **IMPORTANT pour CloudFront**
   - Request certificate → `api.rt-technologie.com`
   - Valider via DNS (ajouter CNAME dans Route 53)

2. **Associer le certificat à CloudFront**:
   - CloudFront → Distribution → Edit
   - Custom SSL certificate → Sélectionner le certificat ACM

3. **Configurer DNS**:
   - Route 53 → Hosted zone → rt-technologie.com
   - Créer un record CNAME:
     - Name: `api`
     - Type: `A` (Alias)
     - Target: Distribution CloudFront

4. **Tester**:
```bash
curl https://api.rt-technologie.com/health
```

**⏱️ Temps**: 20 minutes (+ 10 min attente déploiement)

---

## 🟡 **ACTIONS IMPORTANTES (CETTE SEMAINE - 2h)**

### 4. Intégration Frontend (30 min)

**Créer le hook d'authentification dans votre frontend Next.js**.

#### Fichier: `src/hooks/useAuth.ts`

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  accountType?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Charger le profil au démarrage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getProfile();
    }
  }, []);

  // Register
  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Erreur réseau' };
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data: LoginResponse = await response.json();

      if (data.success && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken || '');
        setUser(data.user || null);
        setIsAuthenticated(true);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Erreur réseau' };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Get Profile
  const getProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsAuthenticated(false);
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        return data.user;
      } else if (response.status === 401) {
        // Token expiré, tenter refresh
        await refreshToken();
      }
    } catch (error) {
      console.error('Get profile error:', error);
      setIsAuthenticated(false);
    }

    return null;
  };

  // Refresh Token
  const refreshToken = async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) return false;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refresh}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      logout();
      return false;
    }
  };

  // Change Password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return { success: false, message: 'Non authentifié' };

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Erreur réseau' };
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    getProfile,
    changePassword
  };
}
```

#### Fichier: `.env.local`

```env
# API Backend
NEXT_PUBLIC_API_URL=http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com

# OU si CloudFront configuré:
# NEXT_PUBLIC_API_URL=https://d1234abcd5678.cloudfront.net
# OU si domaine custom:
# NEXT_PUBLIC_API_URL=https://api.rt-technologie.com

# Stripe (si configuré)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Page: `src/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.message || 'Échec de la connexion');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h1 className="text-3xl font-bold text-center">Connexion</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**⏱️ Temps**: 30 minutes

---

### 5. Configuration Stripe (10 min) - **OPTIONNEL**

**Uniquement si vous avez besoin des paiements en ligne**.

📚 **Guide complet**: [STRIPE_CONFIGURATION_GUIDE.md](STRIPE_CONFIGURATION_GUIDE.md)

**Résumé ultra-rapide**:

```bash
# 1. Obtenir clés sur https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# 2. Créer webhook sur https://dashboard.stripe.com/test/webhooks
URL: http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/stripe/webhook
STRIPE_WEBHOOK_SECRET=whsec_...

# 3. Ajouter dans AWS EB → Configuration → Environment Properties

# 4. Tester
curl http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/stripe/products
```

**⏱️ Temps**: 10 minutes

---

### 6. Monitoring CloudWatch (30 min)

**Créer des alarmes pour surveiller le backend**.

#### Alarme 1: CPU Élevé

1. CloudWatch → Alarms → Create alarm
2. Select metric → Elastic Beanstalk → Environment metrics
3. Metric: `CPUUtilization`
4. Environment: `rt-subscriptions-api-prod`
5. Threshold: Static > 80%
6. Period: 5 minutes
7. Datapoints: 2 out of 2
8. Notification: Create new SNS topic
   - Topic name: `rt-api-alerts`
   - Email: votre-email@example.com
9. Alarm name: `RT-API-High-CPU`
10. Create alarm

#### Alarme 2: Erreurs 5xx

1. Create alarm
2. Metric: `ApplicationRequests5xx`
3. Threshold: Static > 10
4. Period: 5 minutes
5. Notification: SNS topic `rt-api-alerts`
6. Alarm name: `RT-API-5xx-Errors`

#### Alarme 3: Santé Environnement

1. Create alarm
2. Metric: `EnvironmentHealth`
3. Threshold: Static < 2 (2 = Ok, 1 = Warning, 0 = Degraded)
4. Period: 1 minute
5. Notification: SNS topic `rt-api-alerts`
6. Alarm name: `RT-API-Health-Degraded`

#### Dashboard CloudWatch

1. CloudWatch → Dashboards → Create dashboard
2. Dashboard name: `RT-API-Production`
3. Add widgets:
   - Line graph: CPU Utilization
   - Line graph: Memory Utilization
   - Number: Total Requests
   - Line graph: Requests 2xx, 4xx, 5xx
   - Line graph: Response Time P50, P95, P99
4. Save dashboard

**⏱️ Temps**: 30 minutes

---

### 7. Rate Limiting (20 min)

**Protéger l'API contre les abus**.

**Installer express-rate-limit** (dans le backend):

```bash
npm install express-rate-limit
```

**Configurer** (`src/index.js`):

```javascript
const rateLimit = require('express-rate-limit');

// Rate limiter général
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour auth (plus strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de login
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
  skipSuccessfulRequests: true, // Ne pas compter les login réussis
});

// Appliquer
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

**Déployer**:

```bash
git add src/index.js package.json
git commit -m "security: Add rate limiting"
git push origin main
# Redéployer sur EB
```

**⏱️ Temps**: 20 minutes

---

## 🟢 **ACTIONS SOUHAITABLES (2 SEMAINES)**

### 8. Documentation API Swagger (1h)

**Générer documentation interactive**.

```bash
npm install swagger-ui-express swagger-jsdoc
```

```javascript
// src/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RT Technologie API',
      version: '2.6.0',
      description: 'API REST pour RT Technologie (Transport & Logistics)',
    },
    servers: [
      {
        url: 'http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com',
        description: 'Production'
      }
    ],
  },
  apis: ['./src/routes/*.js'], // Chemins vers les routes
};

module.exports = swaggerJsdoc(options);

// src/index.js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Accessible sur: http://.../api-docs
```

**⏱️ Temps**: 1 heure

---

### 9. Tests Automatisés (2h)

**Créer des tests pour valider l'API**.

```bash
npm install --save-dev jest supertest
```

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Authentication API', () => {
  test('POST /api/auth/register - should create user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'carrier'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/auth/login - should login successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePassword123!'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

**⏱️ Temps**: 2 heures

---

### 10. CI/CD Pipeline (2h)

**Automatiser les déploiements avec GitHub Actions**.

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS EB

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Run tests
      run: npm test

    - name: Create deployment package
      run: zip -r deploy.zip . -x "*.git*" "node_modules/*"

    - name: Deploy to EB
      uses: einaregilsson/beanstalk-deploy@v20
      with:
        aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        application_name: rt-subscriptions-api
        environment_name: rt-subscriptions-api-prod
        version_label: ${{ github.sha }}
        region: eu-central-1
        deployment_package: deploy.zip
```

**⏱️ Temps**: 2 heures

---

## 📊 **Récapitulatif des Priorités**

| Action | Priorité | Temps | Impact |
|--------|----------|-------|--------|
| **1. Sécuriser JWT secrets** | 🔴 Critique | 15 min | Sécurité |
| **2. Configurer CORS** | 🔴 Critique | 10 min | Sécurité |
| **3. Activer HTTPS** | 🔴 Critique | 20 min | Sécurité |
| **4. Intégration Frontend** | 🟡 Important | 30 min | Fonctionnel |
| **5. Stripe (optionnel)** | 🟡 Important | 10 min | Business |
| **6. Monitoring** | 🟡 Important | 30 min | Ops |
| **7. Rate Limiting** | 🟡 Important | 20 min | Sécurité |
| **8. Documentation API** | 🟢 Souhaitable | 1h | Dev |
| **9. Tests automatisés** | 🟢 Souhaitable | 2h | Qualité |
| **10. CI/CD** | 🟢 Souhaitable | 2h | DevOps |

---

## ⏱️ **Planning Recommandé**

### **Aujourd'hui (1h)**
- ✅ Sécuriser JWT secrets (15 min)
- ✅ Configurer CORS (10 min)
- ✅ Activer HTTPS CloudFront (20 min)
- ✅ Tester intégration (15 min)

### **Cette semaine (2h)**
- ✅ Intégration Frontend (30 min)
- ✅ Configuration Stripe si nécessaire (10 min)
- ✅ Monitoring CloudWatch (30 min)
- ✅ Rate Limiting (20 min)
- ✅ Tests validation (30 min)

### **Semaine prochaine (5h)**
- ✅ Documentation API Swagger (1h)
- ✅ Tests automatisés (2h)
- ✅ CI/CD Pipeline (2h)

---

## ✅ **Checklist Finale**

Cocher au fur et à mesure:

### Sécurité
- [ ] JWT_SECRET régénéré (15 min)
- [ ] JWT_REFRESH_SECRET régénéré (inclus)
- [ ] CORS configuré avec domaines spécifiques (10 min)
- [ ] HTTPS activé via CloudFront (20 min)
- [ ] Rate limiting activé (20 min)

### Fonctionnel
- [ ] Hook useAuth créé dans frontend (30 min)
- [ ] Page login créée et testée (inclus)
- [ ] .env.local configuré (inclus)
- [ ] Tests end-to-end validés (15 min)

### Optionnel
- [ ] Stripe configuré (10 min)
- [ ] Alarmes CloudWatch créées (30 min)
- [ ] Dashboard CloudWatch créé (inclus)

### Avancé
- [ ] Documentation Swagger générée (1h)
- [ ] Tests automatisés écrits (2h)
- [ ] CI/CD Pipeline configuré (2h)

---

## 🎯 **Prochaine Action Immédiate**

**COMMENCER MAINTENANT** (15 minutes):

```bash
# 1. Générer nouveaux secrets
openssl rand -base64 64  # Copier résultat 1
openssl rand -base64 64  # Copier résultat 2

# 2. Aller sur AWS Console:
# https://console.aws.amazon.com/elasticbeanstalk

# 3. rt-subscriptions-api → rt-subscriptions-api-prod → Configuration → Software → Edit

# 4. Ajouter/Modifier:
# JWT_SECRET = [résultat 1]
# JWT_REFRESH_SECRET = [résultat 2]

# 5. Apply → Attendre Green

# 6. Tester:
curl -X POST http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test-new@example.com","password":"SecurePass123!","firstName":"Test","lastName":"New","role":"carrier"}'
```

**Si succès** ✅ → Passer à l'action 2 (CORS)

---

**Date**: 2025-11-25
**Version**: v2.6.0-jwt-stripe
**Status**: Production Active
**Priorité**: Actions critiques 1-3 à faire MAINTENANT (45 min)
