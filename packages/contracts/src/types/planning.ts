/**
 * Types TypeScript pour le Module Planning Chargement & Livraison
 * SYMPHONI.A - Contrôle & orchestration des flux physiques
 */

// ============================================
// ENUMS
// ============================================

export type SiteType = 'warehouse' | 'factory' | 'supplier' | 'recipient' | 'cross_dock';

export type DockType = 'loading' | 'unloading' | 'mixed' | 'adr' | 'temperature_controlled';

export type DockStatus = 'available' | 'occupied' | 'maintenance' | 'blocked';

export type SlotDuration = 15 | 30 | 45 | 60 | 90 | 120; // minutes

export type FlowType = 'FTL' | 'LTL' | 'express' | 'adr' | 'temperature' | 'messagerie';

export type BookingStatus =
  | 'requested'      // Demande initiale
  | 'proposed'       // Alternative proposée
  | 'confirmed'      // Confirmé
  | 'refused'        // Refusé
  | 'checked_in'     // Chauffeur arrivé
  | 'at_dock'        // Au quai
  | 'loading'        // Chargement en cours
  | 'completed'      // Terminé
  | 'no_show'        // Non présenté
  | 'cancelled';     // Annulé

export type DriverStatus =
  | 'en_route'       // En route vers le site
  | 'arrived'        // Arrivé (géofence)
  | 'waiting'        // En attente
  | 'called'         // Appelé au quai
  | 'at_dock'        // Au quai
  | 'loading'        // Chargement/déchargement
  | 'signing'        // Signature en cours
  | 'completed'      // Terminé
  | 'departed';      // Parti

export type ECMRStatus =
  | 'draft'          // Brouillon
  | 'pending_sender' // En attente signature expéditeur
  | 'pending_carrier'// En attente signature transporteur
  | 'pending_recipient' // En attente signature destinataire
  | 'signed'         // Toutes signatures
  | 'validated'      // Validé
  | 'disputed';      // Litige

export type CheckinMode = 'app' | 'qr_code' | 'kiosk' | 'manual';

// ============================================
// SITE (Site logistique)
// ============================================

export interface OperatingHours {
  dayOfWeek: number; // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  open: string;      // HH:mm
  close: string;     // HH:mm
  breakStart?: string;
  breakEnd?: string;
}

export interface SiteGeofence {
  latitude: number;
  longitude: number;
  radiusMeters: number; // Rayon de détection (default 500-1000m)
}

export interface SiteConstraints {
  maxTruckLength?: number;      // mètres
  maxTruckWeight?: number;      // tonnes
  requiresBadge: boolean;
  requiresAppointment: boolean;
  adrAuthorized: boolean;
  temperatureControlled: boolean;
  minBookingNotice: number;     // heures minimum avant RDV
  maxBookingAdvance: number;    // jours maximum à l'avance
  toleranceMinutes: number;     // tolérance retard (default 30)
}

export interface Site {
  id: string;
  reference: string;            // AUTO: SITE-YYYY-NNNNN

  // Propriétaire
  ownerOrgId: string;
  ownerOrgName: string;
  ownerType: 'logistician' | 'industrial' | 'supplier' | 'recipient';

  // Informations
  name: string;
  type: SiteType;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;

  // Géolocalisation
  geofence: SiteGeofence;

  // Horaires
  operatingHours: OperatingHours[];
  holidays: string[];           // Dates ISO fermées
  exceptionalClosures: {
    date: string;
    reason: string;
  }[];

  // Configuration créneaux
  defaultSlotDuration: SlotDuration;
  slotCapacity: number;         // Camions par créneau

  // Contraintes
  constraints: SiteConstraints;

  // Contact
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  // Instructions
  accessInstructions?: string;
  securityInstructions?: string;
  parkingInstructions?: string;

  // Statut
  active: boolean;

  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DOCK (Quai de chargement)
// ============================================

export interface Dock {
  id: string;
  siteId: string;

  // Identification
  name: string;                 // Ex: "Quai A1", "Porte 3"
  number: number;               // Numéro du quai
  type: DockType;

  // Capacité
  capacity: number;             // Camions simultanés (généralement 1)
  maxTruckLength?: number;      // mètres
  maxTruckHeight?: number;      // mètres

  // Équipements
  hasForklift: boolean;
  hasRamp: boolean;
  hasDockLeveler: boolean;      // Niveleur de quai
  hasRefrigeration: boolean;

  // Statut
  status: DockStatus;
  statusReason?: string;

  // Contraintes spéciales
  adrOnly: boolean;             // Réservé marchandises dangereuses
  temperatureOnly: boolean;     // Réservé température contrôlée
  priorityTransporters?: string[]; // IDs transporteurs prioritaires

  // Ordre d'affichage
  displayOrder: number;

  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TIME SLOT (Créneau horaire)
// ============================================

export interface PlanningSlot {
  id: string;
  siteId: string;
  dockId: string;

  // Date et heure
  date: string;                 // YYYY-MM-DD
  startTime: string;            // HH:mm
  endTime: string;              // HH:mm
  duration: number;             // minutes

  // Type de flux
  flowType: FlowType;

  // Capacité
  totalCapacity: number;
  bookedCapacity: number;
  availableCapacity: number;

  // Statut
  status: 'available' | 'partial' | 'full' | 'blocked';
  blockedReason?: string;

  // Priorités
  isPriority: boolean;          // Créneaux prioritaires
  isExpress: boolean;           // Créneaux express 24h
  isAdr: boolean;               // Réservé ADR

  // Réservations associées
  bookingIds: string[];

  createdAt: string;
  updatedAt: string;
}

// ============================================
// BOOKING (Réservation/RDV)
// ============================================

export interface BookingParty {
  orgId: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface BookingCargo {
  description: string;
  palletCount?: number;
  weight?: number;              // kg
  volume?: number;              // m³
  isAdr: boolean;
  adrClass?: string;
  temperatureRequired?: string; // ambient, refrigerated, frozen
  specialInstructions?: string;
}

export interface BookingVehicle {
  plateNumber?: string;
  trailerNumber?: string;
  vehicleType: string;          // Ex: "Semi-remorque", "Porteur"
  driverName?: string;
  driverPhone?: string;
}

export interface Booking {
  id: string;
  reference: string;            // AUTO: RDV-YYYY-NNNNN

  // Liens
  siteId: string;
  siteName: string;
  dockId?: string;
  dockName?: string;
  slotId?: string;
  orderId?: string;             // Référence commande SYMPHONI.A
  orderReference?: string;

  // Parties
  requester: BookingParty;      // Celui qui demande
  siteOwner: BookingParty;      // Propriétaire du site
  transporter: BookingParty;    // Transporteur

  // Type
  flowType: 'pickup' | 'delivery';

  // Date et heure
  requestedDate: string;        // Date demandée
  requestedTimeSlot: {
    start: string;              // HH:mm
    end: string;                // HH:mm
  };

  confirmedDate?: string;       // Date confirmée
  confirmedTimeSlot?: {
    start: string;
    end: string;
  };

  // Alternatives proposées
  proposedAlternatives?: {
    date: string;
    timeSlot: { start: string; end: string };
    proposedBy: string;
    proposedAt: string;
    message?: string;
  }[];

  // Cargo
  cargo: BookingCargo;

  // Véhicule (rempli à l'arrivée)
  vehicle?: BookingVehicle;

  // Statut
  status: BookingStatus;
  statusHistory: {
    status: BookingStatus;
    changedAt: string;
    changedBy?: string;
    reason?: string;
  }[];

  // Tracking temps
  timestamps: {
    requestedAt: string;
    confirmedAt?: string;
    arrivedAt?: string;         // Entrée géofence
    checkedInAt?: string;       // Check-in borne
    calledAt?: string;          // Appelé au quai
    atDockAt?: string;          // Arrivé au quai
    loadingStartedAt?: string;  // Début chargement
    loadingEndedAt?: string;    // Fin chargement
    signedAt?: string;          // Signature eCMR
    departedAt?: string;        // Départ
    completedAt?: string;
  };

  // Métriques
  metrics?: {
    waitTimeMinutes?: number;   // Temps d'attente
    dockTimeMinutes?: number;   // Temps au quai
    totalTimeMinutes?: number;  // Temps total sur site
  };

  // Documents
  documents?: {
    type: 'cmr' | 'delivery_note' | 'photo' | 'other';
    name: string;
    url: string;
    uploadedAt: string;
  }[];

  // eCMR associée
  ecmrId?: string;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Scoring (pour no-show)
  impactedScore: boolean;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// DRIVER CHECKIN (Check-in chauffeur)
// ============================================

export interface DriverCheckin {
  id: string;
  bookingId: string;
  bookingReference: string;
  siteId: string;

  // Chauffeur
  driverName: string;
  driverPhone?: string;
  transporterOrgId: string;
  transporterName: string;

  // Véhicule
  plateNumber: string;
  trailerNumber?: string;

  // Mode de check-in
  checkinMode: CheckinMode;
  checkinCode?: string;         // Code saisi sur borne

  // Géolocalisation
  checkinLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  isWithinGeofence: boolean;

  // Statut
  status: DriverStatus;

  // Quai assigné
  assignedDockId?: string;
  assignedDockName?: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;

  // Timestamps
  arrivedAt?: string;           // Détection géofence
  checkedInAt: string;          // Check-in effectif
  calledAt?: string;            // Appelé au quai
  atDockAt?: string;            // Arrivé au quai
  loadingStartedAt?: string;
  loadingEndedAt?: string;
  signedAt?: string;
  departedAt?: string;

  // Instructions affichées
  displayedInstructions?: string;
  securityAcknowledged: boolean;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// eCMR (Lettre de voiture électronique)
// ============================================

export interface ECMRParty {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface ECMRSignature {
  party: 'sender' | 'carrier' | 'recipient';
  signedBy: string;
  signedAt: string;
  signatureData: string;        // Base64 de la signature
  ipAddress?: string;
  deviceInfo?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  comments?: string;            // Réserves
}

export interface ECMRGoods {
  description: string;
  packaging: string;            // Ex: "Palettes", "Cartons"
  quantity: number;
  weight: number;               // kg
  volume?: number;              // m³
  marks?: string;               // Marques et numéros
  adrClass?: string;
  adrUnNumber?: string;
}

export interface ECMR {
  id: string;
  reference: string;            // AUTO: CMR-YYYY-NNNNN

  // Liens
  bookingId: string;
  bookingReference: string;
  orderId?: string;
  orderReference?: string;

  // Parties
  sender: ECMRParty;            // Expéditeur
  carrier: ECMRParty;           // Transporteur
  recipient: ECMRParty;         // Destinataire

  // Lieux
  loadingPlace: {
    address: string;
    city: string;
    country: string;
    date: string;
  };
  deliveryPlace: {
    address: string;
    city: string;
    country: string;
    requestedDate?: string;
  };

  // Marchandises
  goods: ECMRGoods[];
  totalWeight: number;
  totalPackages: number;

  // Documents joints
  attachedDocuments?: string[];

  // Instructions
  senderInstructions?: string;
  paymentInstructions?: string;
  specialAgreements?: string;

  // Véhicule
  vehiclePlate: string;
  trailerPlate?: string;

  // Signatures
  signatures: ECMRSignature[];

  // Réserves
  senderReserves?: string;
  carrierReserves?: string;
  recipientReserves?: string;

  // Photos
  photos?: {
    type: 'loading' | 'unloading' | 'damage' | 'other';
    url: string;
    takenAt: string;
    takenBy: string;
  }[];

  // Statut
  status: ECMRStatus;

  // PDF généré
  pdfUrl?: string;
  pdfGeneratedAt?: string;

  // Conformité eIDAS
  eidasCompliant: boolean;
  timestampToken?: string;
  archiveId?: string;           // ID archivage légal

  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
}

// ============================================
// AI SUGGESTIONS
// ============================================

export interface SlotSuggestion {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  dockId: string;
  dockName: string;
  score: number;                // 0-100
  reasons: string[];
  estimatedWaitMinutes: number;
  confidence: number;           // 0-1
}

export interface AISlotOptimization {
  requestedDate: string;
  requestedTimeSlot: { start: string; end: string };
  suggestions: SlotSuggestion[];
  factors: {
    dockAvailability: number;
    historicalWaitTime: number;
    transporterReliability: number;
    cargoCompatibility: number;
  };
  recommendedSlotId: string;
  reasoning: string;
}

export interface ConflictResolution {
  conflictType: 'overlap' | 'capacity' | 'constraint';
  affectedBookings: string[];
  proposedSolutions: {
    type: 'reschedule' | 'reassign_dock' | 'split';
    description: string;
    affectedBookingId: string;
    newSlotId?: string;
    newDockId?: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  autoResolved: boolean;
  resolution?: string;
}

// ============================================
// STATISTICS
// ============================================

export interface PlanningStats {
  period: {
    start: string;
    end: string;
  };

  // Volumes
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;

  // Taux
  completionRate: number;       // %
  noShowRate: number;           // %
  onTimeRate: number;           // %

  // Temps
  averageWaitMinutes: number;
  averageDockMinutes: number;
  averageTotalMinutes: number;

  // Capacité
  dockUtilization: number;      // %
  slotUtilization: number;      // %
  peakHours: string[];

  // Par type de flux
  byFlowType: {
    type: FlowType;
    count: number;
    avgWaitMinutes: number;
  }[];

  // Par transporteur (top 10)
  topTransporters: {
    orgId: string;
    name: string;
    bookings: number;
    onTimeRate: number;
    avgWaitMinutes: number;
  }[];
}

export interface DockStats {
  dockId: string;
  dockName: string;

  totalOperations: number;
  averageOccupancyRate: number;
  averageProcessingMinutes: number;

  byHour: {
    hour: number;
    operations: number;
    avgWaitMinutes: number;
  }[];
}

// ============================================
// API REQUESTS/RESPONSES
// ============================================

export interface CreateSiteRequest {
  name: string;
  type: SiteType;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
  geofence: SiteGeofence;
  operatingHours: OperatingHours[];
  defaultSlotDuration: SlotDuration;
  slotCapacity: number;
  constraints: SiteConstraints;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CreateDockRequest {
  siteId: string;
  name: string;
  number: number;
  type: DockType;
  capacity: number;
  hasForklift?: boolean;
  hasRamp?: boolean;
  hasDockLeveler?: boolean;
  hasRefrigeration?: boolean;
  adrOnly?: boolean;
  temperatureOnly?: boolean;
}

export interface CreateBookingRequest {
  siteId: string;
  orderId?: string;
  flowType: 'pickup' | 'delivery';
  requestedDate: string;
  requestedTimeSlot: { start: string; end: string };
  cargo: BookingCargo;
  transporterOrgId: string;
  notes?: string;
}

export interface DriverCheckinRequest {
  bookingId?: string;
  checkinCode?: string;
  driverName: string;
  driverPhone?: string;
  plateNumber: string;
  trailerNumber?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  checkinMode: CheckinMode;
}

export interface SignECMRRequest {
  ecmrId: string;
  party: 'sender' | 'carrier' | 'recipient';
  signedBy: string;
  signatureData: string;
  comments?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface PlanningFilters {
  siteId?: string;
  dockId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus[];
  flowType?: FlowType;
  transporterOrgId?: string;
  page?: number;
  limit?: number;
}

// ============================================
// EVENTS (pour WebSocket/notifications)
// ============================================

export type PlanningEventType =
  | 'booking.requested'
  | 'booking.proposed'
  | 'booking.confirmed'
  | 'booking.refused'
  | 'booking.cancelled'
  | 'driver.arrived'
  | 'driver.checked_in'
  | 'driver.called'
  | 'driver.at_dock'
  | 'driver.loading_started'
  | 'driver.loading_ended'
  | 'driver.departed'
  | 'driver.no_show'
  | 'ecmr.created'
  | 'ecmr.signed'
  | 'ecmr.validated'
  | 'slot.blocked'
  | 'slot.unblocked'
  | 'conflict.detected'
  | 'conflict.resolved';

export interface PlanningEvent {
  type: PlanningEventType;
  timestamp: string;
  siteId: string;
  bookingId?: string;
  driverId?: string;
  ecmrId?: string;
  data: Record<string, any>;
  triggeredBy?: string;
}
