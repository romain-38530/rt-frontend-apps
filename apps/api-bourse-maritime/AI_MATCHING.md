# AI Matching Service Documentation

## Overview

The Bourse Maritime API includes an intelligent AI matching service that scores and ranks carriers based on their suitability for specific freight requests. This helps shippers quickly identify the most qualified carriers for their shipments.

## Scoring Algorithm

The matching service evaluates carriers across five key dimensions:

### 1. Route Expertise (Weight: 25%)
Evaluates the carrier's experience and knowledge of the specific route.

**Factors:**
- Direct route experience (operates the exact route)
- Regional expertise (operates in the same regions)
- Historical performance on similar routes

**Scoring:**
- Base score: 50 points
- Exact route match: +40 points
- Regional match: +10 points
- Maximum: 100 points

### 2. Price Competitiveness (Weight: 20%)
Assesses the carrier's pricing history and market competitiveness.

**Factors:**
- Historical pricing competitiveness
- Volume of completed jobs (higher volume often = better rates)
- Customer pricing satisfaction ratings

**Scoring:**
- Base score: 70 points
- High volume carrier (>50 jobs): +15 points
- Good pricing rating (≥4.0): +15 points
- Maximum: 100 points

### 3. Reliability (Weight: 25%)
Measures the carrier's track record for dependable service.

**Factors:**
- Overall customer rating (0-5 stars)
- On-time delivery percentage
- Cancellation rate
- Dispute rate
- Number of completed jobs

**Scoring:**
- Overall rating × 15 points
- On-time delivery % × 0.20 points
- Cancellation penalty: -20 points per cancellation rate
- Dispute penalty: -15 points per dispute rate
- Experience bonus (>100 jobs): +5 points
- Maximum: 100 points

### 4. Fleet Suitability (Weight: 20%)
Evaluates whether the carrier has appropriate vessels for the cargo type.

**Factors:**
- Vessel type compatibility with cargo type
- Fleet capacity vs. cargo requirements
- Fleet size and availability
- Cargo type preferences

**Vessel-Cargo Compatibility Matrix:**
```
Container cargo:
  - Container ship
  - Multi-purpose vessel
  - General cargo vessel

Bulk cargo:
  - Bulk carrier
  - Handymax
  - Panamax
  - Capesize

RoRo cargo:
  - RoRo vessel
  - Car carrier
  - Multi-purpose vessel

Breakbulk cargo:
  - General cargo vessel
  - Multi-purpose vessel
  - Heavy lift vessel

Tanker cargo:
  - Tanker
  - Chemical tanker
  - Product tanker
  - Crude carrier
```

**Scoring:**
- Base score (suitable vessels exist): 50 points
- Cargo type preference match: +30 points
- Large fleet (≥10 vessels): +10 points
- Medium fleet (≥5 vessels): +5 points
- Ample capacity (2× required): +10 points
- Maximum: 100 points

### 5. Schedule Compatibility (Weight: 10%)
Checks alignment between carrier's schedule and freight requirements.

**Factors:**
- Transit time vs. delivery deadline
- Service frequency
- Route scheduling flexibility

**Scoring:**
- Base score: 70 points
- Transit time fits deadline: +20 points
- Transit time within 110% of deadline: +10 points
- High frequency service (daily/weekly): +10 points
- Maximum: 100 points

## Final Score Calculation

```
Final Score = (Route Expertise × 0.25) +
              (Price Competitiveness × 0.20) +
              (Reliability × 0.25) +
              (Fleet Suitability × 0.20) +
              (Schedule Compatibility × 0.10)

Range: 0 - 100 points
```

## Score Interpretation

| Score Range | Rating | Description |
|-------------|--------|-------------|
| 90-100 | Excellent Match | Highly recommended, meets all criteria exceptionally |
| 80-89 | Very Good Match | Strong candidate with excellent qualifications |
| 70-79 | Good Match | Suitable carrier with good credentials |
| 60-69 | Fair Match | Acceptable option but may have some limitations |
| 50-59 | Marginal Match | Consider only if better options unavailable |
| Below 50 | Poor Match | Not recommended for this freight request |

## Recommendations

The AI matching service also generates personalized recommendations based on the scoring breakdown:

**High Route Expertise (≥80):**
- "Excellent route expertise for [origin] to [destination]"

**Low Route Expertise (<50):**
- "Limited experience on this route - request detailed transit plan"

**High Reliability (≥85):**
- "Highly reliable carrier with X% on-time delivery rate"

**Low Reliability (<60):**
- "Consider requesting performance guarantees"

**High Fleet Suitability (≥80):**
- "Fleet well-suited for [cargo type] cargo"

**Top-Rated Carrier (≥4.5 stars):**
- "Top-rated carrier (X/5 stars from Y reviews)"

**Experienced Carrier (>100 jobs):**
- "Experienced carrier with X completed shipments"

**Price Competitive (≥80):**
- "Historically competitive pricing"

## API Usage

### Get AI Matches for Freight Request

```bash
POST /api/v1/search/match/freight
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "freightRequestId": "FREIGHT_REQUEST_ID"
}
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "carrier": {
        "_id": "carrier_id",
        "company": {
          "name": "Maersk Line",
          "country": "Denmark"
        },
        "ratings": {
          "overall": 4.8,
          "totalReviews": 312
        },
        "stats": {
          "completedJobs": 578,
          "onTimeDelivery": 97.2
        }
      },
      "score": 92.5,
      "breakdown": {
        "routeExpertise": 90,
        "priceCompetitiveness": 85,
        "reliability": 95,
        "fleetSuitability": 100,
        "scheduleCompatibility": 80
      },
      "recommendations": [
        "Excellent route expertise for Rotterdam to Singapore",
        "Highly reliable carrier with 97.2% on-time delivery rate",
        "Top-rated carrier (4.8/5 stars from 312 reviews)",
        "Fleet well-suited for container cargo"
      ]
    }
  ],
  "message": "Found 15 potential carriers"
}
```

## Example Use Cases

### Use Case 1: Urgent Container Shipment
For time-sensitive container shipments:
- Schedule Compatibility gets higher weight
- Reliability is crucial
- Route expertise ensures smooth transit

**Expected Top Matches:**
- Carriers with proven on-time delivery
- Direct route experience
- Regular service frequency

### Use Case 2: Bulk Commodity Transport
For bulk cargo shipments:
- Fleet Suitability is most important
- Price Competitiveness matters for commodities
- Schedule can be more flexible

**Expected Top Matches:**
- Carriers with specialized bulk vessels
- Competitive pricing history
- Adequate capacity

### Use Case 3: New Route Exploration
For shipments on less common routes:
- Regional expertise becomes more important
- Reliability is crucial (less familiar territory)
- Flexibility in schedule may be needed

**Expected Top Matches:**
- Carriers with regional presence
- High reliability ratings
- Strong communication scores

## Continuous Improvement

The AI matching service can be improved over time by:

1. **Learning from Outcomes:**
   - Track which matched carriers received bids
   - Monitor which bids were accepted
   - Analyze successful vs. unsuccessful matches

2. **User Feedback:**
   - Allow shippers to rate match quality
   - Collect feedback on carrier performance
   - Adjust weights based on user preferences

3. **Market Dynamics:**
   - Update pricing competitiveness based on market trends
   - Adjust for seasonal route variations
   - Factor in current market capacity

4. **Additional Factors:**
   - Environmental credentials
   - Digital integration capabilities
   - Insurance and safety records
   - Specialized equipment availability

## Future Enhancements

Planned improvements to the matching algorithm:

1. **Machine Learning Integration:**
   - Pattern recognition from historical data
   - Predictive pricing models
   - Automated weight optimization

2. **Real-Time Data:**
   - Live vessel tracking
   - Current capacity availability
   - Dynamic route optimization

3. **Advanced Filtering:**
   - Carbon footprint considerations
   - Multi-leg journey optimization
   - Risk assessment scoring

4. **Personalization:**
   - Company-specific preferences
   - Historical relationship data
   - Custom scoring weights
