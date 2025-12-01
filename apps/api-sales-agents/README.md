# API Sales Agents - Module Agents Commerciaux & Commissions

Backend API microservice for managing sales agents and their commissions.

## Features

- **Agent Management**: Complete CRUD operations for sales agents
- **Contract Management**: Electronic contract generation and signature
- **Commission Calculation**: Automated monthly commission calculation (70€ per active client)
- **Client Management**: Track agent's clients and their status
- **Challenges**: Create and manage sales challenges with leaderboards
- **Agent Portal**: Dedicated portal for agents to view their stats and commissions
- **Dashboard**: Direction dashboard with KPIs and regional statistics

## Architecture

### Models
- **Agent**: Sales agent information with documents and contract
- **AgentContract**: Electronic contracts with signature tracking
- **Commission**: Monthly commission records per agent
- **Challenge**: Sales challenges with ranking system
- **AgentClient**: Clients managed by agents

### Routes
- `/agents` - Agent management
- `/contracts` - Contract generation and signing
- `/commissions` - Commission calculation and management
- `/challenges` - Challenge creation and leaderboard
- `/clients` - Client management
- `/portal` - Agent portal endpoints
- `/dashboard` - Direction dashboard

### Services
- **commission-calculator**: Automated commission calculation (70€ per client)
- **contract-generator**: PDF contract generation
- **email-service**: Email notifications
- **scheduler**: Monthly automated tasks (runs 1st of each month at 00:00)

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## Usage

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

- `PORT`: Server port (default: 3015)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORTAL_URL`: Agent portal URL

## API Endpoints

### Agents
- `POST /agents` - Create agent
- `GET /agents` - List agents with filters
- `GET /agents/:id` - Get agent details
- `PUT /agents/:id` - Update agent
- `PUT /agents/:id/status` - Change agent status
- `POST /agents/:id/documents` - Upload document
- `PUT /agents/:id/documents/:docType/verify` - Verify document
- `POST /agents/:id/activate` - Activate agent
- `DELETE /agents/:id` - Terminate agent

### Contracts
- `POST /contracts/generate` - Generate contract PDF
- `GET /contracts/:id` - Get contract details
- `POST /contracts/:id/send` - Send for signature
- `POST /contracts/:id/sign` - Sign electronically
- `GET /contracts/:id/pdf` - Download PDF

### Commissions
- `POST /commissions/calculate` - Calculate monthly commissions
- `GET /commissions` - List commissions with filters
- `GET /commissions/:id` - Get commission details
- `PUT /commissions/:id/validate` - Validate commission
- `PUT /commissions/:id/pay` - Mark as paid
- `GET /commissions/export` - Export CSV

### Portal
- `POST /portal/login` - Agent login
- `GET /portal/dashboard` - Agent dashboard
- `GET /portal/commissions` - Commission history
- `GET /portal/clients` - Agent's clients
- `PUT /portal/profile` - Update profile
- `PUT /portal/password` - Change password

### Dashboard
- `GET /dashboard/overview` - National statistics
- `GET /dashboard/agents/:id` - Agent detail view
- `GET /dashboard/regions` - Regional statistics
- `GET /dashboard/kpis` - Key performance indicators

## Commission System

- **Rate**: 70€ per active client per month
- **Calculation**: Automated on the 1st of each month at 00:00
- **Workflow**:
  1. System calculates commissions for all active agents
  2. Status: `pending` → `validated` → `paid`
  3. Agents receive email notifications

## Agent Workflow

1. **Creation**: Agent profile created with status `pending_signature`
2. **Documents**: Upload required documents (ID, KBIS, URSSAF, RIB)
3. **Contract**: Generate and sign electronic contract
4. **Activation**: Agent becomes `active` after contract signature
5. **Commission**: Monthly commissions calculated automatically
6. **Portal**: Access to personal dashboard and statistics

## Document Requirements

- ID Card (Pièce d'identité)
- KBIS (Business registration)
- URSSAF Certificate (Social security)
- RIB (Bank details)

## Scheduler Tasks

- **Monthly Commissions**: 1st of each month at 00:00
- **Document Expiration**: Daily at 01:00

## Status Flow

### Agent Status
- `pending_signature` → `active` → `suspended` / `terminated` / `non_compliant`

### Contract Status
- `draft` → `sent` → `signed` / `expired` / `terminated`

### Commission Status
- `pending` → `validated` → `paid` / `cancelled`

### Client Status
- `prospect` → `active` → `churned`

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Production

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

## License

MIT
