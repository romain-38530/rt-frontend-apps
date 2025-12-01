/**
 * Types pour le système de Dispatch et Lane Matching
 * Gestion de la cascade transporteur et configuration timeout
 */

// ========== CONFIGURATION DISPATCH ==========

export interface DispatchConfig {
  id: string;
  organizationId: string;

  // Timeout cascade transporteur (paramétrable)
  carrierResponseTimeout: number; // En secondes (défaut: 7200 = 2h)
  reminderEnabled: boolean;
  reminderDelayMinutes: number; // Minutes avant timeout pour rappel

  // Escalade
  escalationDelay: number; // Délai avant escalade Affret.IA
  maxCarriersInChain: number; // Max transporteurs dans la chaîne
  autoEscalateToAffret: boolean; // Escalade auto vers Affret.IA

  // Notifications
  notificationChannels: NotificationChannel[];

  // Dates
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook';

// Options de timeout prédéfinies (en secondes)
export const TIMEOUT_OPTIONS = {
  '30_minutes': 1800,
  '1_hour': 3600,
  '1h30': 5400,
  '2_hours': 7200, // Défaut
  '3_hours': 10800,
  '4_hours': 14400,
  '6_hours': 21600,
  '12_hours': 43200,
  '24_hours': 86400,
} as const;

export type TimeoutOption = keyof typeof TIMEOUT_OPTIONS;

export const DEFAULT_CARRIER_TIMEOUT_SECONDS = 7200; // 2 heures
export const DEFAULT_REMINDER_DELAY_MINUTES = 30;

// ========== LANE MATCHING ==========

export interface Lane {
  id: string;
  organizationId: string;
  name: string;

  // Origine / Destination
  origin: LaneLocation;
  destination: LaneLocation;

  // Transporteurs assignés (ordonnés par priorité)
  carriers: LaneCarrier[];

  // Statistiques
  stats: LaneStats;

  // Configuration
  isActive: boolean;
  autoDispatch: boolean; // Dispatch automatique sur cette lane

  createdAt: string;
  updatedAt: string;
}

export interface LaneLocation {
  country: string;
  region?: string;
  postalCodePrefix?: string; // Ex: "75" pour Paris
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // Rayon en km
}

export interface LaneCarrier {
  carrierId: string;
  carrierName: string;
  priority: number; // 1 = plus haute priorité
  level: 'guest' | 'referenced' | 'premium';

  // Performance sur cette lane
  acceptanceRate: number; // %
  averageResponseTime: number; // Minutes
  totalOrders: number;

  // Tarification
  pricing?: {
    type: 'FTL' | 'LTL';
    basePrice: number;
    currency: string;
  };

  isActive: boolean;
  addedAt: string;
}

export interface LaneStats {
  totalOrders: number;
  acceptedOrders: number;
  averageAcceptanceTime: number; // Minutes
  averagePrice: number;
  lastUsedAt?: string;
}

export interface LaneMatchResult {
  laneId: string;
  laneName: string;
  confidence: number; // 0-100
  matchedCriteria: string[];
  carriers: LaneCarrier[];
  estimatedPrice?: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedTransitDays?: number;
}

// ========== DISPATCH CHAIN ==========

export type DispatchChainStatus =
  | 'pending'      // En attente de démarrage
  | 'active'       // En cours
  | 'completed'    // Terminée (acceptée)
  | 'exhausted'    // Tous les transporteurs épuisés
  | 'escalated'    // Escaladée vers Affret.IA
  | 'cancelled';   // Annulée

export type DispatchEntryStatus =
  | 'pending'      // En attente
  | 'sent'         // Notification envoyée
  | 'accepted'     // Acceptée
  | 'refused'      // Refusée
  | 'timeout'      // Timeout dépassé
  | 'skipped';     // Sautée manuellement

export interface DispatchChain {
  id: string;
  orderId: string;
  organizationId: string;

  status: DispatchChainStatus;

  // Entrées de la chaîne
  entries: DispatchChainEntry[];
  currentEntryIndex: number;

  // Configuration utilisée
  config: {
    timeoutSeconds: number;
    maxCarriers: number;
    reminderEnabled: boolean;
    reminderDelayMinutes: number;
  };

  // Lane détectée (si applicable)
  matchedLane?: {
    laneId: string;
    laneName: string;
    confidence: number;
  };

  // Résultat
  acceptedBy?: {
    carrierId: string;
    carrierName: string;
    acceptedAt: string;
    price?: number;
  };

  // Escalade Affret.IA
  affretEscalation?: {
    searchId: string;
    escalatedAt: string;
    offersReceived: number;
  };

  // Dates
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchChainEntry {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierLevel: 'guest' | 'referenced' | 'premium';
  priority: number;

  status: DispatchEntryStatus;

  // Notification
  notification?: {
    sentAt: string;
    channels: NotificationChannel[];
    responseDeadline: string;
    reminderSentAt?: string;
  };

  // Réponse
  response?: {
    type: 'accepted' | 'refused';
    respondedAt: string;
    price?: number;
    refusalReason?: string;
    notes?: string;
  };

  // Timeout
  timeoutAt?: string;
  timedOutAt?: string;
}

// ========== CARRIER NOTIFICATION ==========

export interface CarrierNotification {
  id: string;
  orderId: string;
  dispatchChainId: string;
  carrierId: string;
  carrierName: string;

  // Contenu
  type: 'dispatch_request' | 'reminder' | 'timeout_warning';
  channels: NotificationChannel[];

  // Timing
  sentAt: string;
  responseDeadline: string;
  timeoutAt: string;

  // Réponse
  respondedAt?: string;
  response?: 'accepted' | 'refused';

  // Metadata
  metadata?: Record<string, any>;
}

// ========== CARRIER RESPONSE ==========

export interface CarrierDispatchResponse {
  dispatchChainId: string;
  entryId: string;
  carrierId: string;

  response: 'accepted' | 'refused';

  // Si accepté
  acceptedPrice?: number;
  estimatedPickupDate?: string;
  estimatedDeliveryDate?: string;
  vehicleInfo?: {
    type: string;
    registration?: string;
    driverName?: string;
    driverPhone?: string;
  };

  // Si refusé
  refusalReason?: RefusalReason;
  refusalNotes?: string;

  respondedAt: string;
}

export type RefusalReason =
  | 'no_capacity'       // Pas de capacité
  | 'price_too_low'     // Prix trop bas
  | 'route_not_covered' // Route non couverte
  | 'timing_issue'      // Problème de timing
  | 'vehicle_unavailable' // Véhicule indisponible
  | 'other';            // Autre

// ========== STATISTIQUES DISPATCH ==========

export interface DispatchStats {
  period: {
    from: string;
    to: string;
  };

  // Global
  totalDispatches: number;
  successfulDispatches: number;
  averageAcceptanceTime: number; // Minutes

  // Par statut
  byStatus: Record<DispatchChainStatus, number>;

  // Performance transporteurs
  carrierPerformance: {
    totalNotifications: number;
    acceptedCount: number;
    refusedCount: number;
    timeoutCount: number;
    acceptanceRate: number; // %
    averageResponseTime: number; // Minutes
  };

  // Escalades
  affretEscalations: {
    count: number;
    successRate: number; // %
    averageOffersReceived: number;
  };

  // Lanes
  laneMatchRate: number; // % de commandes matchées à une lane
  topLanes: Array<{
    laneId: string;
    laneName: string;
    ordersCount: number;
    acceptanceRate: number;
  }>;
}

// ========== REQUÊTES ==========

export interface CreateLaneRequest {
  name: string;
  origin: LaneLocation;
  destination: LaneLocation;
  carrierIds?: string[];
  autoDispatch?: boolean;
}

export interface UpdateLaneRequest {
  name?: string;
  origin?: LaneLocation;
  destination?: LaneLocation;
  isActive?: boolean;
  autoDispatch?: boolean;
}

export interface AddCarrierToLaneRequest {
  laneId: string;
  carrierId: string;
  priority?: number;
}

export interface ReorderLaneCarriersRequest {
  laneId: string;
  carrierIds: string[]; // Nouvel ordre
}

export interface StartDispatchRequest {
  orderId: string;
  laneId?: string; // Si spécifié, utilise cette lane
  carrierIds?: string[]; // Si spécifié, utilise ces transporteurs
  config?: Partial<DispatchConfig>;
}

export interface UpdateDispatchConfigRequest {
  carrierResponseTimeout?: number;
  reminderEnabled?: boolean;
  reminderDelayMinutes?: number;
  escalationDelay?: number;
  maxCarriersInChain?: number;
  autoEscalateToAffret?: boolean;
  notificationChannels?: NotificationChannel[];
}

// ========== FILTRES ==========

export interface LaneFilters {
  search?: string;
  originCountry?: string;
  destinationCountry?: string;
  isActive?: boolean;
  hasCarriers?: boolean;
  page?: number;
  limit?: number;
}

export interface DispatchChainFilters {
  orderId?: string;
  status?: DispatchChainStatus;
  carrierId?: string;
  laneId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
