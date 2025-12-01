# Bourse Maritime API - Setup Guide

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. Start MongoDB:
```bash
# Make sure MongoDB is running on localhost:27017
# Or update MONGODB_URI in .env
```

4. Seed database with sample data:
```bash
npm run seed
```

5. Start development server:
```bash
npm run dev
```

The API will be available at: http://localhost:3019

## Quick Start

### View API Documentation
Visit http://localhost:3019/ to see all available endpoints

### Test the API

1. Create a freight request:
```bash
curl -X POST http://localhost:3019/api/v1/freight-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "shipper": {
      "companyName": "Test Company",
      "contactName": "John Doe",
      "contactEmail": "john@test.com",
      "contactPhone": "+1234567890"
    },
    "origin": {
      "port": "Rotterdam",
      "country": "Netherlands",
      "address": "Port of Rotterdam"
    },
    "destination": {
      "port": "Singapore",
      "country": "Singapore",
      "address": "Port of Singapore"
    },
    "cargo": {
      "type": "container",
      "description": "Test cargo",
      "weight": 20000,
      "volume": 60,
      "hazmat": false
    },
    "schedule": {
      "loadingDate": "2024-12-15",
      "deliveryDeadline": "2025-01-20",
      "flexibility": "Moderate"
    },
    "requirements": {
      "incoterm": "FOB",
      "insurance": true,
      "customsClearance": false,
      "documentation": ["Bill of Lading"]
    },
    "pricing": {
      "currency": "USD",
      "paymentTerms": "30 days"
    }
  }'
```

2. List published freight requests:
```bash
curl http://localhost:3019/api/v1/freight-requests?status=published
```

3. Get carriers:
```bash
curl http://localhost:3019/api/v1/carriers?verified=true
```

## Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

## Environment Variables

- `PORT` - Server port (default: 3019)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token verification
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

## Database Collections

- **freightrequests** - Freight requests from shippers
- **bids** - Carrier bids on freight requests
- **contracts** - Awarded contracts
- **carriers** - Carrier profiles and fleet information
- **alerts** - User alerts for routes/prices

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

The JWT should contain:
- userId
- companyId
- email
- role

## Sample Data

After running `npm run seed`, you'll have:
- 3 verified carriers (MSC, Maersk, CMA CGM)
- 2 published freight requests
- Complete fleet and route information

## Port

Default port: **3019**
