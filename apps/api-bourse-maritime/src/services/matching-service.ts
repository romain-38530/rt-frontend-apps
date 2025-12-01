import Carrier, { ICarrier } from '../models/Carrier';
import FreightRequest, { IFreightRequest } from '../models/FreightRequest';

interface MatchScore {
  carrier: ICarrier;
  score: number;
  breakdown: {
    routeExpertise: number;
    priceCompetitiveness: number;
    reliability: number;
    fleetSuitability: number;
    scheduleCompatibility: number;
  };
  recommendations: string[];
}

export class MatchingService {
  /**
   * AI matching service that scores carriers based on freight request
   */
  async matchCarriersToFreight(freightRequestId: string): Promise<MatchScore[]> {
    const freightRequest = await FreightRequest.findById(freightRequestId);

    if (!freightRequest) {
      throw new Error('Freight request not found');
    }

    // Get all verified carriers
    const carriers = await Carrier.find({ verified: true });

    const matches: MatchScore[] = [];

    for (const carrier of carriers) {
      const score = await this.calculateMatchScore(carrier, freightRequest);
      matches.push(score);
    }

    // Sort by total score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Calculate match score for a carrier against freight request
   */
  private async calculateMatchScore(
    carrier: ICarrier,
    freightRequest: IFreightRequest
  ): Promise<MatchScore> {
    const breakdown = {
      routeExpertise: this.scoreRouteExpertise(carrier, freightRequest),
      priceCompetitiveness: this.scorePriceCompetitiveness(carrier, freightRequest),
      reliability: this.scoreReliability(carrier),
      fleetSuitability: this.scoreFleetSuitability(carrier, freightRequest),
      scheduleCompatibility: this.scoreScheduleCompatibility(carrier, freightRequest)
    };

    // Weighted average
    const weights = {
      routeExpertise: 0.25,
      priceCompetitiveness: 0.20,
      reliability: 0.25,
      fleetSuitability: 0.20,
      scheduleCompatibility: 0.10
    };

    const totalScore =
      breakdown.routeExpertise * weights.routeExpertise +
      breakdown.priceCompetitiveness * weights.priceCompetitiveness +
      breakdown.reliability * weights.reliability +
      breakdown.fleetSuitability * weights.fleetSuitability +
      breakdown.scheduleCompatibility * weights.scheduleCompatibility;

    const recommendations = this.generateRecommendations(breakdown, carrier, freightRequest);

    return {
      carrier,
      score: Math.round(totalScore * 100) / 100,
      breakdown,
      recommendations
    };
  }

  /**
   * Score based on carrier's route history and expertise
   */
  private scoreRouteExpertise(carrier: ICarrier, freightRequest: IFreightRequest): number {
    let score = 50; // Base score

    // Check if carrier operates on this route
    const hasRoute = carrier.routes.some(route => {
      const matchesOrigin = route.origin.toLowerCase().includes(freightRequest.origin.port.toLowerCase()) ||
                           route.origin.toLowerCase().includes(freightRequest.origin.country.toLowerCase());
      const matchesDestination = route.destination.toLowerCase().includes(freightRequest.destination.port.toLowerCase()) ||
                                 route.destination.toLowerCase().includes(freightRequest.destination.country.toLowerCase());
      return matchesOrigin && matchesDestination;
    });

    if (hasRoute) {
      score += 40;
    }

    // Regional expertise bonus
    const regionMatch = carrier.preferences.regions.some(region =>
      freightRequest.origin.country.toLowerCase().includes(region.toLowerCase()) ||
      freightRequest.destination.country.toLowerCase().includes(region.toLowerCase())
    );

    if (regionMatch) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Score based on carrier's historical pricing
   */
  private scorePriceCompetitiveness(carrier: ICarrier, freightRequest: IFreightRequest): number {
    let score = 70; // Base score (neutral)

    // If freight request has target price
    if (freightRequest.pricing.targetPrice) {
      // This would typically compare with carrier's historical pricing
      // For now, use carrier stats as a proxy
      if (carrier.stats.completedJobs > 50) {
        score += 15; // High volume carriers often have competitive pricing
      }

      // Good rating in pricing
      if (carrier.ratings.pricing >= 4) {
        score += 15;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Score based on carrier reliability metrics
   */
  private scoreReliability(carrier: ICarrier): number {
    let score = 0;

    // Overall rating (0-5) * 15
    score += carrier.ratings.overall * 15;

    // On-time delivery percentage (0-100)
    score += carrier.stats.onTimeDelivery * 0.20;

    // Penalty for cancelled and disputed jobs
    const totalJobs = carrier.stats.completedJobs + carrier.stats.cancelledJobs;
    if (totalJobs > 0) {
      const cancellationRate = carrier.stats.cancelledJobs / totalJobs;
      const disputeRate = carrier.stats.disputedJobs / totalJobs;

      score -= cancellationRate * 20;
      score -= disputeRate * 15;
    }

    // Bonus for experience
    if (carrier.stats.completedJobs > 100) {
      score += 5;
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Score based on fleet suitability for cargo type
   */
  private scoreFleetSuitability(carrier: ICarrier, freightRequest: IFreightRequest): number {
    let score = 0;

    // Check if carrier has vessels suitable for cargo type
    const hasSuitableVessels = carrier.fleet.vessels.some(vessel => {
      return vessel.status === 'active' &&
             this.isVesselSuitableForCargo(vessel.type, freightRequest.cargo.type);
    });

    if (!hasSuitableVessels) {
      return 0;
    }

    score += 50; // Base score for having suitable vessels

    // Check cargo type preference
    const prefersCargoType = carrier.preferences.cargoTypes.includes(freightRequest.cargo.type);
    if (prefersCargoType) {
      score += 30;
    }

    // Fleet size bonus
    if (carrier.fleet.vesselCount >= 10) {
      score += 10;
    } else if (carrier.fleet.vesselCount >= 5) {
      score += 5;
    }

    // Check capacity
    const totalCapacity = carrier.fleet.totalCapacity;
    const requiredCapacity = freightRequest.cargo.weight;

    if (totalCapacity >= requiredCapacity * 2) {
      score += 10; // Ample capacity
    }

    return Math.min(score, 100);
  }

  /**
   * Score based on schedule compatibility
   */
  private scoreScheduleCompatibility(carrier: ICarrier, freightRequest: IFreightRequest): number {
    let score = 70; // Base score

    // Find relevant route
    const relevantRoute = carrier.routes.find(route => {
      const matchesOrigin = route.origin.toLowerCase().includes(freightRequest.origin.port.toLowerCase());
      const matchesDestination = route.destination.toLowerCase().includes(freightRequest.destination.port.toLowerCase());
      return matchesOrigin && matchesDestination;
    });

    if (relevantRoute) {
      // Check if transit time fits within deadline
      const loadingDate = new Date(freightRequest.schedule.loadingDate);
      const deadline = new Date(freightRequest.schedule.deliveryDeadline);
      const availableDays = Math.floor((deadline.getTime() - loadingDate.getTime()) / (1000 * 60 * 60 * 24));

      if (relevantRoute.avgTransitTime <= availableDays) {
        score += 20;
      } else if (relevantRoute.avgTransitTime <= availableDays * 1.1) {
        score += 10; // Tight but possible
      }

      // Frequency bonus
      if (relevantRoute.frequency === 'daily' || relevantRoute.frequency === 'weekly') {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Check if vessel type is suitable for cargo type
   */
  private isVesselSuitableForCargo(vesselType: string, cargoType: string): boolean {
    const suitabilityMap: { [key: string]: string[] } = {
      'container': ['container ship', 'multi-purpose vessel', 'general cargo'],
      'bulk': ['bulk carrier', 'handymax', 'panamax', 'capesize'],
      'roro': ['roro vessel', 'car carrier', 'multi-purpose vessel'],
      'breakbulk': ['general cargo', 'multi-purpose vessel', 'heavy lift vessel'],
      'tanker': ['tanker', 'chemical tanker', 'product tanker', 'crude carrier']
    };

    const suitableTypes = suitabilityMap[cargoType] || [];
    return suitableTypes.some(type => vesselType.toLowerCase().includes(type.toLowerCase()));
  }

  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(
    breakdown: MatchScore['breakdown'],
    carrier: ICarrier,
    freightRequest: IFreightRequest
  ): string[] {
    const recommendations: string[] = [];

    if (breakdown.routeExpertise >= 80) {
      recommendations.push(`Excellent route expertise for ${freightRequest.origin.port} to ${freightRequest.destination.port}`);
    } else if (breakdown.routeExpertise < 50) {
      recommendations.push('Limited experience on this route - request detailed transit plan');
    }

    if (breakdown.reliability >= 85) {
      recommendations.push(`Highly reliable carrier with ${carrier.stats.onTimeDelivery}% on-time delivery rate`);
    } else if (breakdown.reliability < 60) {
      recommendations.push('Consider requesting performance guarantees');
    }

    if (breakdown.fleetSuitability >= 80) {
      recommendations.push(`Fleet well-suited for ${freightRequest.cargo.type} cargo`);
    }

    if (carrier.ratings.overall >= 4.5) {
      recommendations.push(`Top-rated carrier (${carrier.ratings.overall}/5 stars from ${carrier.ratings.totalReviews} reviews)`);
    }

    if (carrier.stats.completedJobs > 100) {
      recommendations.push(`Experienced carrier with ${carrier.stats.completedJobs} completed shipments`);
    }

    if (breakdown.priceCompetitiveness >= 80) {
      recommendations.push('Historically competitive pricing');
    }

    return recommendations;
  }

  /**
   * Get similar freight requests for market comparison
   */
  async findSimilarFreightRequests(freightRequestId: string, limit: number = 10) {
    const freightRequest = await FreightRequest.findById(freightRequestId);

    if (!freightRequest) {
      throw new Error('Freight request not found');
    }

    // Find similar requests based on route, cargo type, and timeframe
    const similar = await FreightRequest.find({
      _id: { $ne: freightRequestId },
      'cargo.type': freightRequest.cargo.type,
      status: { $in: ['completed', 'awarded'] },
      $or: [
        { 'origin.port': freightRequest.origin.port },
        { 'origin.country': freightRequest.origin.country }
      ],
      $or: [
        { 'destination.port': freightRequest.destination.port },
        { 'destination.country': freightRequest.destination.country }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit);

    return similar;
  }
}

export default new MatchingService();
