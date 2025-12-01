/**
 * Types: Storage Market / Bourse de Stockage
 * Place de marché pour connecter industriels et logisticiens
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type StorageType =
  | 'long_term'      // Stockage long terme
  | 'temporary'      // Stockage temporaire
  | 'picking'        // Préparation de commandes
  | 'cross_dock'     // Cross-docking
  | 'customs'        // Sous douane
  | 'temperature';   // Température dirigée

export type VolumeUnit = 'sqm' | 'pallets' | 'linear_meters' | 'cbm';

export type TemperatureCondition =
  | 'ambient'        // Ambiant
  | 'refrigerated'   // Réfrigéré (0-4°C)
  | 'frozen'         // Surgelé (-18°C)
  | 'controlled';    // Température contrôlée (personnalisée)

export type SecurityLevel = 'standard' | 'high' | 'maximum';

export type PublicationType =
  | 'GLOBAL'         // Visible par tous les logisticiens abonnés
  | 'REFERRED_ONLY'  // Uniquement partenaires référencés
  | 'MIXED';         // Combinaison des deux

export type NeedStatus =
  | 'DRAFT'          // Brouillon
  | 'PUBLISHED'      // Publié sur la bourse
  | 'CLOSED'         // Clôturé (deadline passée)
  | 'ATTRIBUTED'     // Attribué à un logisticien
  | 'CANCELLED';     // Annulé

export type OfferStatus =
  | 'SUBMITTED'      // Soumise
  | 'UNDER_REVIEW'   // En cours d'analyse
  | 'SHORTLISTED'    // Présélectionnée
  | 'ACCEPTED'       // Acceptée
  | 'REJECTED'       // Refusée
  | 'WITHDRAWN'      // Retirée par le logisticien
  | 'EXPIRED';       // Expirée

export type ContractStatus =
  | 'PENDING'        // En attente de signature
  | 'ACTIVE'         // Actif
  | 'SUSPENDED'      // Suspendu
  | 'COMPLETED'      // Terminé
  | 'TERMINATED';    // Résilié

export type SubscriptionStatus =
  | 'PENDING'        // En attente de validation
  | 'APPROVED'       // Approuvé
  | 'REJECTED'       // Refusé
  | 'SUSPENDED';     // Suspendu

export type AlertType =
  | 'stock_critical'       // Stock critique
  | 'rupture_imminent'     // Rupture imminente
  | 'quality_incident'     // Incident qualité
  | 'capacity_overflow'    // Dépassement capacité
  | 'contract_expiry'      // Fin de contrat approchant
  | 'document_missing';    // Document manquant

// ============================================
// VOLUME & LOCATION
// ============================================

export interface StorageVolume {
  unit: VolumeUnit;
  quantity: number;
  palletType?: 'EUR' | 'UK' | 'US' | 'custom';
}

export interface StorageLocation {
  country: string;
  region?: string;
  department?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  maxRadius?: number; // km - rayon maximal acceptable
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface StorageDuration {
  startDate: string;
  endDate?: string;
  durationMonths?: number;
  flexible: boolean;
  renewable: boolean;
  minCommitment?: number; // mois minimum
}

// ============================================
// CONSTRAINTS & REQUIREMENTS
// ============================================

export interface StorageConstraints {
  temperature: TemperatureCondition;
  temperatureRange?: {
    min: number;
    max: number;
  };
  adrAuthorized: boolean;
  adrClasses?: string[]; // Classes ADR acceptées
  securityLevel: SecurityLevel;
  certifications: string[]; // ISO 9001, ISO 14001, HACCP, GDP, IFS, BRC...
  specificRequirements?: string[];
}

export interface InfrastructureRequirements {
  minCeilingHeight?: number; // mètres
  minDocks?: number;
  handlingEquipment?: string[]; // Chariot, transpalette, gerbeur...
  wmsRequired: boolean;
  apiIntegration: boolean;
}

export interface OperationalRequirements {
  operatingHours?: {
    start: string;
    end: string;
    days: string[]; // ['monday', 'tuesday', ...]
  };
  dailyMovements?: number; // Fréquence mouvements/jour
  pickingRequired: boolean;
  copackingRequired: boolean;
  labelingRequired: boolean;
}

// ============================================
// STORAGE NEED (Besoin de stockage)
// ============================================

export interface StorageNeedBudget {
  indicative?: number;
  maxBudget?: number;
  currency: string;
  period: 'monthly' | 'yearly' | 'total';
  negotiable: boolean;
}

export interface StorageNeed {
  id: string;
  reference: string;

  // Industriel
  ownerOrgId: string;
  ownerOrgName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Caractéristiques
  storageType: StorageType;
  volume: StorageVolume;
  duration: StorageDuration;
  location: StorageLocation;
  constraints: StorageConstraints;
  infrastructure?: InfrastructureRequirements;
  operational?: OperationalRequirements;

  // Budget
  budget?: StorageNeedBudget;

  // Publication
  publicationType: PublicationType;
  referredLogisticians?: string[]; // IDs des logisticiens référencés

  // Documents
  technicalSpecsUrl?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;

  // RFP IA
  rfpGenerated?: boolean;
  rfpContent?: string;
  rfpStandardized?: boolean;

  // Status
  status: NeedStatus;
  deadline: string;
  publishedAt?: string;
  closedAt?: string;
  attributedAt?: string;

  // Stats
  viewCount: number;
  offersCount: number;

  // Dates
  createdAt: string;
  updatedAt: string;
}

export interface CreateStorageNeedInput {
  storageType: StorageType;
  volume: StorageVolume;
  duration: StorageDuration;
  location: StorageLocation;
  constraints: StorageConstraints;
  infrastructure?: InfrastructureRequirements;
  operational?: OperationalRequirements;
  budget?: StorageNeedBudget;
  publicationType: PublicationType;
  referredLogisticians?: string[];
  deadline: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
}

// ============================================
// LOGISTICIAN CAPACITY (Capacité logisticien)
// ============================================

export interface LogisticianSite {
  id: string;
  logisticianId: string;
  logisticianName: string;

  // Informations du site
  name: string;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Capacités
  totalCapacity: StorageVolume;
  availableCapacity: StorageVolume;
  reservedCapacity?: StorageVolume;

  // Types de stockage possibles
  storageTypes: StorageType[];
  temperatureConditions: TemperatureCondition[];

  // Infrastructure
  ceilingHeight: number;
  docksCount: number;
  handlingEquipment: string[];
  securityFeatures: string[];

  // Certifications
  certifications: string[];
  adrAuthorized: boolean;
  adrClasses?: string[];
  customsAuthorized: boolean;

  // WMS & Intégration
  wmsSystem?: string;
  apiAvailable: boolean;
  realTimeTracking: boolean;

  // Tarification
  pricing: {
    pricePerSqmMonth?: number;
    pricePerPaletteMonth?: number;
    pricePerMovement?: number;
    setupFees?: number;
    currency: string;
  };

  // Disponibilité
  operatingHours: {
    start: string;
    end: string;
    days: string[];
  };

  // Status
  active: boolean;
  lastCapacityUpdate: string;

  // Dates
  createdAt: string;
  updatedAt: string;
}

export interface CreateLogisticianSiteInput {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
  coordinates?: { latitude: number; longitude: number };
  totalCapacity: StorageVolume;
  availableCapacity: StorageVolume;
  storageTypes: StorageType[];
  temperatureConditions: TemperatureCondition[];
  ceilingHeight: number;
  docksCount: number;
  handlingEquipment: string[];
  certifications: string[];
  adrAuthorized: boolean;
  pricing: {
    pricePerSqmMonth?: number;
    pricePerPaletteMonth?: number;
    pricePerMovement?: number;
    currency: string;
  };
}

export interface UpdateCapacityInput {
  siteId: string;
  availableCapacity: StorageVolume;
}

// ============================================
// STORAGE OFFER (Offre/Proposition)
// ============================================

export interface StorageOfferPricing {
  totalMonthlyPrice: number;
  pricePerUnit: number;
  priceUnit: VolumeUnit;
  movementPriceIn: number;
  movementPriceOut: number;
  setupFees: number;
  currency: string;
  validUntil: string;

  // Détails optionnels
  includedServices?: string[];
  optionalServices?: Array<{
    name: string;
    price: number;
  }>;
}

export interface StorageOffer {
  id: string;
  needId: string;
  needReference: string;

  // Logisticien
  logisticianId: string;
  logisticianName: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  siteCity: string;

  // Proposition
  pricing: StorageOfferPricing;
  availabilityDate: string;
  proposedDuration?: number; // mois

  // Détails techniques
  proposedCapacity: StorageVolume;
  certifications: string[];
  services: string[];

  // Message
  message?: string;
  attachments?: Array<{
    name: string;
    url: string;
  }>;

  // Scoring IA
  aiScore?: number;
  aiRank?: number;
  aiAnalysis?: {
    priceScore: number;
    proximityScore: number;
    reliabilityScore: number;
    reactivityScore: number;
    complianceScore: number;
    overallRecommendation: string;
  };

  // Status
  status: OfferStatus;
  submittedAt: string;
  reviewedAt?: string;

  // Négociation
  negotiationHistory?: Array<{
    timestamp: string;
    type: 'counter_offer' | 'clarification' | 'message';
    from: 'industrial' | 'logistician';
    content: string;
    newPrice?: number;
  }>;

  // Dates
  createdAt: string;
  updatedAt: string;
}

export interface CreateStorageOfferInput {
  needId: string;
  siteId: string;
  pricing: StorageOfferPricing;
  availabilityDate: string;
  proposedCapacity: StorageVolume;
  services: string[];
  message?: string;
}

// ============================================
// STORAGE CONTRACT (Contrat)
// ============================================

export interface StorageContract {
  id: string;
  reference: string;

  // Parties
  needId: string;
  offerId: string;
  industrialId: string;
  industrialName: string;
  logisticianId: string;
  logisticianName: string;
  siteId: string;
  siteName: string;

  // Termes
  storageType: StorageType;
  capacity: StorageVolume;
  pricing: StorageOfferPricing;

  // Durée
  startDate: string;
  endDate: string;
  autoRenewal: boolean;
  noticePeriodDays: number;

  // Documents
  contractDocumentUrl?: string;
  signedAt?: string;
  signedByIndustrial?: string;
  signedByLogistician?: string;

  // Opérationnel
  wmsConnected: boolean;
  lastSyncAt?: string;

  // KPIs
  kpis?: {
    totalMovements: number;
    averageOccupancy: number;
    incidentCount: number;
    satisfactionScore?: number;
  };

  // Status
  status: ContractStatus;

  // Dates
  createdAt: string;
  updatedAt: string;
}

// ============================================
// LOGISTICIAN SUBSCRIPTION (Abonnement)
// ============================================

export interface LogisticianSubscription {
  id: string;
  logisticianId: string;
  logisticianName: string;
  companyName: string;
  siret: string;

  // Contact
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  // Documents
  kbisUrl?: string;
  insuranceUrl?: string;
  certificationsUrls?: string[];

  // Sites
  sitesCount: number;
  totalCapacity?: StorageVolume;

  // Abonnement
  subscriptionTier: 'basic' | 'pro' | 'enterprise';
  monthlyFee?: number;

  // Status
  status: SubscriptionStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  suspensionReason?: string;

  // Stats
  totalOffers: number;
  acceptedOffers: number;
  activeContracts: number;
  averageRating?: number;

  // Dates
  createdAt: string;
  updatedAt: string;
}

// ============================================
// REAL-TIME TRACKING (Suivi temps réel)
// ============================================

export interface StockMovement {
  id: string;
  contractId: string;
  siteId: string;

  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  unit: VolumeUnit;

  // Produit
  productReference?: string;
  productDescription?: string;
  lotNumber?: string;

  // Documents
  documentReference?: string;
  documentType?: string;

  // Status
  status: 'pending' | 'completed' | 'cancelled';

  // Dates
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface StockLevel {
  contractId: string;
  siteId: string;

  currentLevel: StorageVolume;
  reservedLevel: StorageVolume;
  availableLevel: StorageVolume;

  // Par produit
  byProduct?: Array<{
    reference: string;
    description: string;
    quantity: number;
    unit: VolumeUnit;
    lotNumber?: string;
    expiryDate?: string;
  }>;

  lastUpdated: string;
}

export interface StorageAlert {
  id: string;
  contractId: string;
  siteId: string;

  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;

  // Données contextuelles
  data?: Record<string, any>;

  // Status
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;

  createdAt: string;
}

// ============================================
// AI FEATURES (Fonctionnalités IA)
// ============================================

export interface RFPGenerationRequest {
  needId: string;
  language?: 'fr' | 'en';
  includeTerms?: boolean;
}

export interface RFPGenerationResponse {
  needId: string;
  rfpContent: string;
  generatedAt: string;
}

export interface OfferRankingCriteria {
  priceWeight: number;      // 0-100
  proximityWeight: number;  // 0-100
  reliabilityWeight: number;// 0-100
  reactivityWeight: number; // 0-100
  complianceWeight: number; // 0-100
}

export interface OfferRankingRequest {
  needId: string;
  criteria?: OfferRankingCriteria;
  topN?: number;
}

export interface OfferRankingResponse {
  needId: string;
  rankedOffers: Array<{
    offerId: string;
    rank: number;
    totalScore: number;
    scores: {
      price: number;
      proximity: number;
      reliability: number;
      reactivity: number;
      compliance: number;
    };
    recommendation: string;
  }>;
  generatedAt: string;
}

export interface ResponseExtractionRequest {
  rawContent: string;
  format: 'email' | 'document' | 'text';
}

export interface ResponseExtractionResponse {
  extractedData: {
    price?: number;
    currency?: string;
    availabilityDate?: string;
    capacity?: StorageVolume;
    services?: string[];
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    additionalInfo?: string;
  };
  confidence: number;
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

export interface StorageMarketStats {
  // Globaux
  totalNeeds: number;
  totalOffers: number;
  totalContracts: number;
  totalSites: number;
  totalLogisticians: number;

  // Par status
  needsByStatus: Record<NeedStatus, number>;
  offersByStatus: Record<OfferStatus, number>;
  contractsByStatus: Record<ContractStatus, number>;

  // Actifs
  activeNeeds: number;
  activeContracts: number;
  pendingSubscriptions: number;

  // KPIs
  averageOffersPerNeed: number;
  averageTimeToAttribution: number; // heures
  conversionRate: number; // % de needs attribués
  averagePricePerSqm: number;

  // Tendances
  needsTrend: Array<{ date: string; count: number }>;
  volumeTrend: Array<{ date: string; volume: number }>;
}

export interface LogisticianStats {
  logisticianId: string;

  // Activité
  totalOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  activeContracts: number;

  // Performance
  acceptanceRate: number;
  averageResponseTime: number; // heures
  averageRating: number;

  // Capacité
  totalCapacity: StorageVolume;
  usedCapacity: StorageVolume;
  occupancyRate: number;

  // Revenus
  totalRevenue: number;
  averageContractValue: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedStorageNeeds {
  data: StorageNeed[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedStorageOffers {
  data: StorageOffer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StorageNeedFilters {
  status?: NeedStatus | NeedStatus[];
  storageType?: StorageType | StorageType[];
  region?: string;
  minVolume?: number;
  maxVolume?: number;
  volumeUnit?: VolumeUnit;
  temperature?: TemperatureCondition;
  adrRequired?: boolean;
  publicationType?: PublicationType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StorageOfferFilters {
  needId?: string;
  status?: OfferStatus | OfferStatus[];
  logisticianId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
