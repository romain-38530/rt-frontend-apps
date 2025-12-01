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

// Bid Types
export type BidStatus =
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

export interface Bid {
  id: string;
  reference: string;
  freightRequestId: string;
  carrier: BidCarrier;
  pricing: BidPricing;
  vessel?: BidVessel;
  schedule: BidSchedule;
  terms: BidTerms;
  status: BidStatus;
  submittedAt: Date;
  expiresAt: Date;
  updatedAt?: Date;
}

// Contract Types
export type ContractStatus =
  | 'draft'
  | 'pendingSignatures'
  | 'active'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export interface ContractParty {
  companyId: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface ContractSignature {
  signedAt?: Date;
  signedBy?: string;
  signatureData?: string;
  ipAddress?: string;
}

export interface ContractPayment {
  dueDate: Date;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: Date;
}

export interface ContractDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Contract {
  id: string;
  reference: string;
  freightRequestId: string;
  bidId: string;
  shipper: ContractParty;
  carrier: ContractParty;
  cargo: FreightRequestCargo;
  route: {
    origin: Port;
    destination: Port;
  };
  schedule: BidSchedule;
  pricing: BidPricing;
  paymentSchedule: ContractPayment[];
  terms: string;
  documents: ContractDocument[];
  signatures: {
    shipper: ContractSignature;
    carrier: ContractSignature;
  };
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Carrier Types
export interface CarrierVessel {
  name: string;
  imo: string;
  type: string;
  flag: string;
  capacity: number;
  capacityUnit: 'TEU' | 'DWT' | 'GT';
  yearBuilt: number;
}

export interface CarrierCertification {
  type: string;
  number: string;
  issuedBy: string;
  validUntil: Date;
}

export interface CarrierRoute {
  origin: string;
  destination: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'irregular';
}

export interface CarrierRatings {
  overall: number;
  reliability: number;
  communication: number;
  pricing: number;
  totalReviews: number;
}

export interface CarrierStats {
  completedJobs: number;
  totalVolume: number;
  volumeUnit: 'TEU' | 'tons';
  onTimeDelivery: number; // percentage
}

export interface Carrier {
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
    vessels: CarrierVessel[];
  };
  certifications: CarrierCertification[];
  routes: CarrierRoute[];
  ratings: CarrierRatings;
  verified: boolean;
  verifiedAt?: Date;
  stats: CarrierStats;
  createdAt: Date;
  updatedAt: Date;
}

// Alert Types
export type AlertType = 'route' | 'price' | 'carrier';
export type AlertFrequency = 'instant' | 'daily' | 'weekly';

export interface AlertCriteria {
  origins?: string[];
  destinations?: string[];
  cargoTypes?: CargoType[];
  maxPrice?: number;
  carriers?: string[];
}

export interface Alert {
  id: string;
  userId: string;
  companyId: string;
  type: AlertType;
  criteria: AlertCriteria;
  frequency: AlertFrequency;
  active: boolean;
  lastTriggered?: Date;
  triggeredCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Search & Matching Types
export interface RouteSearchParams {
  origin?: string;
  destination?: string;
  cargoType?: CargoType;
  loadingDateFrom?: Date;
  loadingDateTo?: Date;
  maxPrice?: number;
}

export interface CarrierSearchParams {
  route?: {
    origin: string;
    destination: string;
  };
  minRating?: number;
  vesselTypes?: string[];
  verified?: boolean;
}

export interface MatchingResult {
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

export interface MarketStats {
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
