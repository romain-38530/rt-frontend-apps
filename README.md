# RT Technologie - Frontend Applications

Frontend applications for the RT Technologie platform, deployed on AWS Amplify.

## 🎨 Applications

### Admin & Marketing

| App | Port | Description | Deployment |
|-----|------|-------------|------------|
| `backoffice-admin` | - | Admin backoffice | AWS Amplify |
| `marketing-site` | 3000 | Public marketing website | AWS Amplify |

### User Portals

| App | Port | Description | Users |
|-----|------|-------------|-------|
| `web-industry` | 3010 | Industrial portal | Industriels |
| `web-transporter` | 3100 | Transporter portal | Transporteurs |
| `web-recipient` | 3102 | Recipient portal | Destinataires |
| `web-supplier` | 3103 | Supplier portal | Fournisseurs |
| `web-forwarder` | 4002 | Forwarder portal | Commissionnaires |
| `web-logistician` | 3106 | Logistician portal (PWA) | Logisticiens |

## 📦 Shared Packages

| Package | Description | Used By |
|---------|-------------|---------|
| `@rt/contracts` | API contracts & types | All apps |
| `@rt/utils` | Utility functions | All apps |
| `@rt/design-system` | UI component library | All apps |
| `@rt/chatbot-widget` | Reusable chatbot widget | 4 apps |
| `@rt/onboarding` | Onboarding system | Select apps |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- GitHub Personal Access Token (for @rt packages)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/rt-frontend-apps.git
cd rt-frontend-apps

# Configure GitHub Packages authentication
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc

# Install dependencies
pnpm install

# Copy environment variables
cp apps/backoffice-admin/.env.example apps/backoffice-admin/.env.local
# Edit .env.local with your API URL

# Run specific app in dev mode
pnpm --filter @rt/backoffice-admin dev

# Or run all apps (uses a lot of resources!)
pnpm dev
```

### Development

```bash
# Run specific app
pnpm --filter @rt/web-industry dev
pnpm --filter @rt/marketing-site dev

# Build specific app
pnpm --filter @rt/backoffice-admin build

# Lint
pnpm lint

# Run tests
pnpm test
```

## 🌍 Environment Variables

Each app needs these environment variables:

```bash
# .env.production (for Amplify)
NEXT_PUBLIC_API_URL=https://api.rt-technologie.com/api/v1

# .env.local (for local dev)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Configure in AWS Amplify

1. Go to AWS Amplify Console
2. Select your app
3. Go to **App settings** → **Environment variables**
4. Add:
   - `GITHUB_TOKEN` = your GitHub PAT (for accessing @rt packages)
   - `NEXT_PUBLIC_API_URL` = `https://api.rt-technologie.com/api/v1`

## 📱 Apps Details

### backoffice-admin

Admin portal for managing the entire platform.

**Features:**
- User management
- Order management
- Fleet monitoring
- Analytics dashboard
- System configuration

**Tech Stack:**
- Next.js 14 (App Router)
- Tailwind CSS
- React Query
- Zustand

### marketing-site

Public-facing marketing website.

**Features:**
- Landing page
- Product information
- Pricing
- Contact forms
- Blog

**Tech Stack:**
- Next.js 14
- Tailwind CSS
- Framer Motion

### web-industry

Portal for industrial clients.

**Features:**
- Create shipping orders
- Track shipments
- Manage palettes
- View analytics
- Document management

**Tech Stack:**
- Next.js 14
- Radix UI
- Recharts
- React Query

### web-transporter

Portal for transporters.

**Features:**
- View available loads
- Accept transport missions
- Update delivery status
- Driver management
- Fleet tracking

**Tech Stack:**
- Next.js 14
- Radix UI
- date-fns

### web-recipient

Portal for recipients.

**Features:**
- Track incoming shipments
- Confirm deliveries
- Manage receiving schedule
- Chat with support

**Tech Stack:**
- Next.js 14
- React Query
- Zustand
- Axios
- @rt/chatbot-widget

### web-supplier

Portal for suppliers.

**Features:**
- Manage product catalog
- Process orders
- Schedule pickups
- Inventory management
- Live chat support

**Tech Stack:**
- Next.js 14
- Radix UI
- React Query
- Zod
- @rt/chatbot-widget

### web-forwarder

Portal for freight forwarders.

**Features:**
- Manage multi-leg shipments
- Coordinate with carriers
- Track all shipments
- Generate reports
- AI-powered optimization

**Tech Stack:**
- Next.js 14
- Recharts
- @rt/chatbot-widget

### web-logistician

PWA for warehouse logisticians.

**Features:**
- Scan QR codes
- Update palette status
- Warehouse management
- Offline support
- Real-time sync

**Tech Stack:**
- Next.js 14
- html5-qrcode
- next-pwa
- Service Workers

## 🚢 Deployment (AWS Amplify)

### Setup Amplify App

1. **Connect Repository**
   ```bash
   # In AWS Amplify Console
   # 1. New app → Host web app
   # 2. Connect GitHub repository: rt-frontend-apps
   # 3. Select branch: main
   ```

2. **Configure Build Settings**

   Each app has an `amplify.yml` file:

   ```yaml
   version: 1
   applications:
     - appRoot: apps/backoffice-admin
       frontend:
         phases:
           preBuild:
             commands:
               - npm install -g pnpm@8.15.4
               - echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" >> .npmrc
               - pnpm install --frozen-lockfile
           build:
             commands:
               - pnpm --filter @rt/backoffice-admin build
         artifacts:
           baseDirectory: apps/backoffice-admin/.next
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
             - apps/backoffice-admin/.next/cache/**/*
   ```

3. **Environment Variables**

   Add in Amplify Console:
   - `GITHUB_TOKEN` = your GitHub PAT
   - `NEXT_PUBLIC_API_URL` = `https://api.rt-technologie.com/api/v1`

4. **Deploy**

   Amplify will automatically deploy on push to `main`.

### Manual Deployment

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Deploy specific app
amplify publish --app backoffice-admin
```

## 🔐 API Communication

### Using @rt/contracts

```typescript
import { CreateOrderDTO, OrderResponse } from '@rt/contracts';
import { formatCurrency, formatDateFR } from '@rt/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Type-safe API call
export async function createOrder(
  data: CreateOrderDTO
): Promise<OrderResponse> {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create order');
  }

  return response.json();
}

// Usage in component
function OrderForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: CreateOrderDTO) => {
    setLoading(true);
    try {
      const order = await createOrder(formData);
      console.log('Order created:', order.numero);
      // TypeScript knows all fields of OrderResponse!
      console.log('Tracking URL:', order.trackingUrl);
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

## 🧪 Testing

```bash
# Run tests for all apps
pnpm test

# Run tests for specific app
pnpm --filter @rt/backoffice-admin test

# Run tests with coverage
pnpm test:coverage
```

## 📊 Monitoring

### Amplify Console

- **Build logs**: View build output and errors
- **Monitoring**: Traffic, errors, performance
- **Custom domains**: Configure custom domains

### CloudWatch

- **Logs**: Application logs
- **Metrics**: User activity, API calls
- **Alarms**: Set up alerts

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Create a Pull Request
5. After merge, Amplify deploys automatically

## 📖 Documentation

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [RT Contracts API](../rt-shared-contracts/packages/contracts/README.md)

## 📄 License

Proprietary - RT Technologie © 2025
