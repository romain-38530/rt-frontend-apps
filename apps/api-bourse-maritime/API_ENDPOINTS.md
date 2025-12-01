# Bourse Maritime API - Endpoint Reference

Base URL: `http://localhost:3019`

## Health & Documentation

### GET /
Get API documentation and endpoint list
```bash
curl http://localhost:3019/
```

### GET /health
Health check endpoint
```bash
curl http://localhost:3019/health
```

## Freight Requests

### POST /api/v1/freight-requests
Create a new freight request (requires authentication)
```bash
curl -X POST http://localhost:3019/api/v1/freight-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shipper": {
      "companyName": "Global Shipping Inc",
      "contactName": "John Doe",
      "contactEmail": "john@globalshipping.com",
      "contactPhone": "+1234567890"
    },
    "origin": {
      "port": "Rotterdam",
      "country": "Netherlands",
      "address": "Port of Rotterdam, Wilhelminakade 909"
    },
    "destination": {
      "port": "Singapore",
      "country": "Singapore",
      "address": "Port of Singapore, 460 Alexandra Road"
    },
    "cargo": {
      "type": "container",
      "description": "Electronics and consumer goods",
      "weight": 24000,
      "volume": 68,
      "containerType": "40ft HC",
      "containerCount": 3,
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
      "documentation": ["Bill of Lading", "Commercial Invoice"]
    },
    "pricing": {
      "targetPrice": 18000,
      "currency": "USD",
      "paymentTerms": "30 days from BL date"
    }
  }'
```

### GET /api/v1/freight-requests
List freight requests with filters
```bash
# All published requests
curl http://localhost:3019/api/v1/freight-requests?status=published

# Filter by origin and cargo type
curl http://localhost:3019/api/v1/freight-requests?origin=Rotterdam&type=container

# With pagination
curl http://localhost:3019/api/v1/freight-requests?page=1&limit=10
```

### GET /api/v1/freight-requests/:id
Get freight request details
```bash
curl http://localhost:3019/api/v1/freight-requests/FREIGHT_REQUEST_ID
```

### PUT /api/v1/freight-requests/:id
Update freight request (requires authentication)
```bash
curl -X PUT http://localhost:3019/api/v1/freight-requests/FREIGHT_REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pricing": {
      "targetPrice": 20000,
      "currency": "USD",
      "paymentTerms": "60 days"
    }
  }'
```

### POST /api/v1/freight-requests/:id/publish
Publish freight request to marketplace
```bash
curl -X POST http://localhost:3019/api/v1/freight-requests/FREIGHT_REQUEST_ID/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "closingDate": "2024-12-25T23:59:59Z"
  }'
```

### POST /api/v1/freight-requests/:id/close
Close bidding for freight request
```bash
curl -X POST http://localhost:3019/api/v1/freight-requests/FREIGHT_REQUEST_ID/close \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### DELETE /api/v1/freight-requests/:id
Cancel freight request
```bash
curl -X DELETE http://localhost:3019/api/v1/freight-requests/FREIGHT_REQUEST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Bids

### POST /api/v1/freight-requests/:id/bids
Submit a bid for freight request
```bash
curl -X POST http://localhost:3019/api/v1/freight-requests/FREIGHT_REQUEST_ID/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "carrier": {
      "companyName": "Ocean Carriers Ltd",
      "contactName": "Jane Smith",
      "rating": 4.5,
      "completedJobs": 156
    },
    "pricing": {
      "amount": 17500,
      "currency": "USD",
      "breakdown": {
        "freight": 15000,
        "bunker": 1500,
        "thc": 500,
        "documentation": 200,
        "insurance": 300,
        "other": 0
      }
    },
    "vessel": {
      "name": "Ocean Voyager",
      "imo": "IMO1234567",
      "type": "container ship",
      "flag": "Panama",
      "capacity": 5000,
      "yearBuilt": 2018
    },
    "schedule": {
      "estimatedDeparture": "2024-12-16",
      "estimatedArrival": "2025-01-12",
      "transitDays": 27
    },
    "terms": {
      "validity": "2024-12-20",
      "paymentTerms": "30 days from BL date",
      "conditions": ["Subject to vessel availability", "Price valid for 7 days"]
    },
    "expiresAt": "2024-12-20T23:59:59Z"
  }'
```

### GET /api/v1/freight-requests/:id/bids
List all bids for a freight request (shipper only)
```bash
curl http://localhost:3019/api/v1/freight-requests/FREIGHT_REQUEST_ID/bids \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/v1/bids/my
Get my submitted bids
```bash
curl http://localhost:3019/api/v1/bids/my \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by status
curl http://localhost:3019/api/v1/bids/my?status=submitted \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PUT /api/v1/bids/:id
Update a bid
```bash
curl -X PUT http://localhost:3019/api/v1/bids/BID_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pricing": {
      "amount": 16500,
      "currency": "USD",
      "breakdown": {
        "freight": 14000,
        "bunker": 1500,
        "thc": 500,
        "documentation": 200,
        "insurance": 300,
        "other": 0
      }
    }
  }'
```

### DELETE /api/v1/bids/:id
Withdraw a bid
```bash
curl -X DELETE http://localhost:3019/api/v1/bids/BID_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /api/v1/bids/:id/accept
Accept a bid (shipper only)
```bash
curl -X POST http://localhost:3019/api/v1/bids/BID_ID/accept \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /api/v1/bids/:id/reject
Reject a bid
```bash
curl -X POST http://localhost:3019/api/v1/bids/BID_ID/reject \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Contracts

### GET /api/v1/contracts
List my contracts
```bash
curl http://localhost:3019/api/v1/contracts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by status
curl http://localhost:3019/api/v1/contracts?status=active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/v1/contracts/:id
Get contract details
```bash
curl http://localhost:3019/api/v1/contracts/CONTRACT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /api/v1/contracts/:id/sign
Sign a contract
```bash
curl -X POST http://localhost:3019/api/v1/contracts/CONTRACT_ID/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "signature": "base64_signature_data"
  }'
```

### GET /api/v1/contracts/:id/documents
Get contract documents
```bash
curl http://localhost:3019/api/v1/contracts/CONTRACT_ID/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /api/v1/contracts/:id/documents
Upload contract document
```bash
curl -X POST http://localhost:3019/api/v1/contracts/CONTRACT_ID/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "Bill of Lading",
    "name": "BL-2024-001.pdf",
    "url": "https://storage.example.com/documents/bl-001.pdf"
  }'
```

## Carriers

### GET /api/v1/carriers
List verified carriers
```bash
# All verified carriers
curl http://localhost:3019/api/v1/carriers?verified=true

# Filter by country and rating
curl http://localhost:3019/api/v1/carriers?country=Denmark&minRating=4.5

# Filter by vessel type
curl http://localhost:3019/api/v1/carriers?vesselType=container%20ship
```

### GET /api/v1/carriers/:id
Get carrier profile
```bash
curl http://localhost:3019/api/v1/carriers/CARRIER_ID
```

### GET /api/v1/carriers/:id/ratings
Get carrier ratings and stats
```bash
curl http://localhost:3019/api/v1/carriers/CARRIER_ID/ratings
```

### POST /api/v1/carriers/:id/rate
Rate a carrier (after completed shipment)
```bash
curl -X POST http://localhost:3019/api/v1/carriers/CARRIER_ID/rate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "overall": 4.5,
    "reliability": 5.0,
    "communication": 4.0,
    "pricing": 4.5
  }'
```

### POST /api/v1/carriers/register
Register as a carrier
```bash
curl -X POST http://localhost:3019/api/v1/carriers/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "company": {
      "name": "My Shipping Company",
      "registrationNumber": "REG123456",
      "country": "USA",
      "address": "123 Harbor St, Miami, FL",
      "email": "contact@myshipping.com",
      "phone": "+1234567890"
    },
    "fleet": {
      "vesselCount": 5,
      "totalCapacity": 50000,
      "vesselTypes": ["container ship", "bulk carrier"]
    }
  }'
```

## Search & Matching

### GET /api/v1/search/routes
Search available routes
```bash
# Search by origin and destination
curl http://localhost:3019/api/v1/search/routes?origin=Rotterdam&destination=Singapore

# Filter by cargo type and dates
curl http://localhost:3019/api/v1/search/routes?cargoType=container&dateFrom=2024-12-01&dateTo=2025-01-31
```

### GET /api/v1/search/carriers
Search carriers by criteria
```bash
# Search by route
curl http://localhost:3019/api/v1/search/carriers?route=Rotterdam-Singapore

# Search by capacity and rating
curl http://localhost:3019/api/v1/search/carriers?minCapacity=10000&minRating=4.0
```

### POST /api/v1/search/match/freight
AI matching for freight requests
```bash
curl -X POST http://localhost:3019/api/v1/search/match/freight \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "freightRequestId": "FREIGHT_REQUEST_ID"
  }'
```

### GET /api/v1/search/market/stats
Get market statistics
```bash
# Default (last 30 days)
curl http://localhost:3019/api/v1/search/market/stats

# Custom period
curl http://localhost:3019/api/v1/search/market/stats?period=90d
```

## Alerts

### POST /api/v1/alerts
Create a new alert
```bash
curl -X POST http://localhost:3019/api/v1/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "route",
    "criteria": {
      "origins": ["Rotterdam", "Hamburg"],
      "destinations": ["Singapore", "Shanghai"],
      "cargoTypes": ["container"],
      "maxPrice": 20000
    },
    "frequency": "instant",
    "notificationChannels": {
      "email": true,
      "sms": false,
      "push": true
    }
  }'
```

### GET /api/v1/alerts
Get my alerts
```bash
curl http://localhost:3019/api/v1/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by active status
curl http://localhost:3019/api/v1/alerts?active=true \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PUT /api/v1/alerts/:id
Update an alert
```bash
curl -X PUT http://localhost:3019/api/v1/alerts/ALERT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "criteria": {
      "maxPrice": 18000
    }
  }'
```

### DELETE /api/v1/alerts/:id
Delete an alert
```bash
curl -X DELETE http://localhost:3019/api/v1/alerts/ALERT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PATCH /api/v1/alerts/:id/toggle
Toggle alert active status
```bash
curl -X PATCH http://localhost:3019/api/v1/alerts/ALERT_ID/toggle \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Response Format

All endpoints return JSON in this format:

Success:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

List with pagination:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```
