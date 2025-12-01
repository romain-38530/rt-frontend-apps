/**
 * Types Bourse Maritime pour SYMPHONI.A
 * Marketplace pour le fret maritime
 */

// Freight Request Types
export type FreightRequestStatus =
  | 'draft'
  | 'published'
  | 'bidding'
  | 'awarded'
  | 'inProgress'
  | 'completed'
  | 'cancelled';

export type CargoType =
  | 'container'
  | 'bulk'
  | 'roro'
  | 'breakbulk'
  | 'tanker'
  | 'reefer'
  | 'project';

export type ContainerType =
  | '20GP'
  | '40GP'
  | '40HC'
  | '20RF'
  | '40RF'
  | '20OT'
  | '40OT'
  | '20FR'
  | '40FR';

export type Incoterm =
  | 'EXW'
  | 'FCA'
  | 'FAS'
  | 'FOB'
  | 'CFR'
  | 'CIF'
  | 'CPT'
  | 'CIP'
  | 'DAP'
  | 'DPU'
  | 'DDP';

export interface Port {
  code: string;
  name: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface FreightRequestShipper {
  companyId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface FreightRequestCargo {
  type: CargoType;
  description: string;
  weight: number;
  weightUnit: 'kg' | 'tons';
  volume?: number;
  volumeUnit?: 'm3' | 'cbm';
  containerType?: ContainerType;
  containerCount?: number;
  hazmat: boolean;
  hazmatClass?: string;
  temperature?: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  specialHandling?: string[];
}

export interface FreightRequestSchedule {
  loadingDate: Date;
  loadingDateFlexibility?: number; // days
  deliveryDeadline: Date;
  deliveryFlexibility?: number; // days
}

export interface FreightRequestRequirements {
  incoterm: Incoterm;
  insurance: boolean;
  insuranceValue?: number;
  customsClearance: boolean;
  documentation: string[];
}

export interface FreightRequestPricing {
  targetPrice?: number;
  currency: string;
  paymentTerms: string;
}

export interface FreightRequest {
  id: string;
  reference: string;
  shipper: FreightRequestShipper;
  origin: Port;
  destination: Port;
  cargo: FreightRequestCargo;
  schedule: FreightRequestSchedule;
  requirements: FreightRequestRequirements;
  pricing: FreightRequestPricing;
  status: FreightRequestStatus;
  bidsCount: number;
  lowestBid?: number;
  highestBid?: number;
  selectedBidId?: string;
  awardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  closingDate?: Date;
}

// Bid Types (préfixé Maritime pour éviter conflits)
export type MaritimeBidStatus =
  | 'submitted'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export interface BidCarrier {
  companyId: string;
  companyName: string;
  contactName: string;
  rating: number;
  completedJobs: number;
}

export interface BidPricingBreakdown {
  freight: number;
  bunker?: number;
  thc?: number;
  documentation?: number;
  insurance?: number;
  other?: number;
}

export interface BidPricing {
  amount: number;
  currency: string;
  breakdown: BidPricingBreakdown;
}

export interface BidVessel {
  name: string;
  imo: string;
  type: string;
  flag: string;
  capacity: number;
  capacityUnit: 'TEU' | 'DWT' | 'GT';
  yearBuilt: number;
}

export interface BidSchedule {
  estimatedDeparture: Date;
  estimatedArrival: Date;
  transitDays: number;
}

export interface BidTerms {
  validity: Date;
  paymentTerms: string;
  conditions: string[];
}

export interface MaritimeBid {
  id: string;
  reference: string;
  freightRequestId: string;
  carrier: BidCarrier;
  pricing: BidPricing;
  vessel?: BidVessel;
  schedule: BidSchedule;
  terms: BidTerms;
  status: MaritimeBidStatus;
  submittedAt: Date;
  expiresAt: Date;
  updatedAt?: Date;
}

// Contract Types (préfixé Maritime pour éviter conflits)
export type MaritimeContractStatus =
  | 'draft'
  | 'pendingSignatures'
  | 'active'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export interface MaritimeContractParty {
  companyId: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface MaritimeContractSignature {
  signedAt?: Date;
  signedBy?: string;
  signatureData?: string;
  ipAddress?: string;
}

export interface MaritimeContractPayment {
  dueDate: Date;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: Date;
}

export interface MaritimeContractDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface MaritimeContract {
  id: string;
  reference: string;
  freightRequestId: string;
  bidId: string;
  shipper: MaritimeContractParty;
  carrier: MaritimeContractParty;
  cargo: FreightRequestCargo;
  route: {
    origin: Port;
    destination: Port;
  };
  schedule: BidSchedule;
  pricing: BidPricing;
  paymentSchedule: MaritimeContractPayment[];
  terms: string;
  documents: MaritimeContractDocument[];
  signatures: {
    shipper: MaritimeContractSignature;
    carrier: MaritimeContractSignature;
  };
  status: MaritimeContractStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Carrier Types
export interface MaritimeCarrierVessel {
  name: string;
  imo: string;
  type: string;
  flag: string;
  capacity: number;
  capacityUnit: 'TEU' | 'DWT' | 'GT';
  yearBuilt: number;
}

export interface MaritimeCarrierCertification {
  type: string;
  number: string;
  issuedBy: string;
  validUntil: Date;
}

export interface MaritimeCarrierRoute {
  origin: string;
  destination: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'irregular';
}

export interface MaritimeCarrierRatings {
  overall: number;
  reliability: number;
  communication: number;
  pricing: number;
  totalReviews: number;
}

export interface MaritimeCarrierStats {
  completedJobs: number;
  totalVolume: number;
  volumeUnit: 'TEU' | 'tons';
  onTimeDelivery: number; // percentage
}

export interface MaritimeCarrier {
  id: string;
  companyId: string;
  company: {
    name: string;
    registrationNumber: string;
    country: string;
    address: string;
  };
  fleet: {
    vesselCount: number;
    totalCapacity: number;
    capacityUnit: 'TEU' | 'DWT';
    vesselTypes: string[];
    vessels: MaritimeCarrierVessel[];
  };
  certifications: MaritimeCarrierCertification[];
  routes: MaritimeCarrierRoute[];
  ratings: MaritimeCarrierRatings;
  verified: boolean;
  verifiedAt?: Date;
  stats: MaritimeCarrierStats;
  createdAt: Date;
  updatedAt: Date;
}

// Alert Types (préfixé Maritime pour éviter conflits)
export type MaritimeAlertType = 'route' | 'price' | 'carrier';
export type MaritimeAlertFrequency = 'instant' | 'daily' | 'weekly';

export interface MaritimeAlertCriteria {
  origins?: string[];
  destinations?: string[];
  cargoTypes?: CargoType[];
  maxPrice?: number;
  carriers?: string[];
}

export interface MaritimeAlert {
  id: string;
  userId: string;
  companyId: string;
  type: MaritimeAlertType;
  criteria: MaritimeAlertCriteria;
  frequency: MaritimeAlertFrequency;
  active: boolean;
  lastTriggered?: Date;
  triggeredCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Search & Matching Types (préfixé Maritime pour éviter conflits)
export interface MaritimeRouteSearchParams {
  origin?: string;
  destination?: string;
  cargoType?: CargoType;
  loadingDateFrom?: Date;
  loadingDateTo?: Date;
  maxPrice?: number;
}

export interface MaritimeCarrierSearchParams {
  route?: {
    origin: string;
    destination: string;
  };
  minRating?: number;
  vesselTypes?: string[];
  verified?: boolean;
}

export interface MaritimeMatchingResult {
  carrierId: string;
  carrierName: string;
  score: number;
  factors: {
    routeExpertise: number;
    priceCompetitiveness: number;
    reliability: number;
    fleetSuitability: number;
    scheduleCompatibility: number;
  };
  estimatedPrice?: {
    min: number;
    max: number;
    currency: string;
  };
  recommendation: string;
}

export interface MaritimeMarketStats {
  totalActiveRequests: number;
  totalBidsThisMonth: number;
  averagePrice: number;
  topRoutes: {
    origin: string;
    destination: string;
    count: number;
  }[];
  priceIndex: {
    route: string;
    currentPrice: number;
    change: number; // percentage
  }[];
}

// API Response Types
export interface BourseMaritimeApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
