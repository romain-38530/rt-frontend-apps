/**
 * Types TypeScript pour le système de commandes SYMPHONI.A
 */

export type OrderStatus =
  | 'draft'
  | 'created'
  | 'pending'
  // Auto-dispatch statuts
  | 'planification_auto'
  | 'affret_ia'
  | 'echec_planification'
  | 'accepted'
  // Legacy statuts
  | 'sent_to_carrier'
  | 'carrier_accepted'
  | 'carrier_refused'
  | 'in_transit'
  | 'arrived_pickup'
  | 'loaded'
  | 'arrived_delivery'
  | 'delivered'
  | 'closed'
  | 'cancelled'
  | 'escalated';

export type TrackingLevel = 'basic' | 'gps' | 'premium';

export type ConstraintType =
  | 'ADR'
  | 'HAYON'
  | 'RDV'
  | 'PALETTES'
  | 'TEMPERATURE'
  | 'FRAGILE'
  | 'ASSURANCE';

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  instructions?: string;
  // Portal access configuration
  enablePortalAccess?: boolean;
  portalRole?: 'supplier' | 'recipient';
}

/**
 * Portal invitation for sender/recipient access
 */
export interface PortalInvitation {
  id: string;
  orderId: string;
  email: string;
  phone?: string;
  role: 'supplier' | 'recipient';
  status: 'pending' | 'sent' | 'accepted' | 'expired';
  token: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  userId?: string; // Linked user after acceptance
}

export interface Constraint {
  type: ConstraintType;
  value?: string | number | boolean;
  description?: string;
}

export interface Goods {
  description: string;
  weight: number; // en kg
  volume?: number; // en m³
  quantity: number;
  palettes?: number;
  packaging?: string;
  value?: number; // valeur déclarée en euros
}

export interface OrderDates {
  pickupDate: string;
  pickupTimeSlotStart?: string;
  pickupTimeSlotEnd?: string;
  deliveryDate: string;
  deliveryTimeSlotStart?: string;
  deliveryTimeSlotEnd?: string;
}

export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  trackingLevel: TrackingLevel;

  // Parties prenantes
  industrialId: string;
  carrierId?: string;
  supplierId?: string;
  recipientId?: string;

  // Noms denormalises (pour affichage)
  industrialName?: string;
  carrierName?: string;
  supplierName?: string;
  recipientName?: string;

  // Adresses
  pickupAddress: Address;
  deliveryAddress: Address;

  // Dates
  dates: OrderDates;

  // Marchandise
  goods: Goods;

  // Contraintes
  constraints: Constraint[];

  // Pricing
  estimatedPrice?: number;
  finalPrice?: number;
  currency: string;

  // Tracking
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  eta?: string;

  // Documents
  documentIds: string[];

  // Portal access for sender/recipient
  portalInvitations?: PortalInvitation[];

  // Auto-dispatch
  events?: OrderEvent[];
  dispatchChain?: DispatchChain;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
}

export interface CreateOrderInput {
  pickupAddress: Address;
  deliveryAddress: Address;
  dates: OrderDates;
  goods: Goods;
  constraints?: Constraint[];
  carrierId?: string;
  notes?: string;
}

// Types d'evenements auto-dispatch
export type AutoDispatchEventType =
  | 'auto_dispatch_started'
  | 'sent_to_carrier'
  | 'carrier_accepted'
  | 'carrier_refused'
  | 'escalated_affret_ia'
  | 'affret_ia_match_found'
  | 'dispatch_completed'
  | 'dispatch_failed';

export interface OrderEvent {
  id: string;
  orderId: string;
  type: string;
  timestamp: string;
  data?: any;
  userId?: string;
  userName?: string;
  description: string;
  // Auto-dispatch specific fields
  carrierId?: string;
  carrierName?: string;
  carrierScore?: number;
  reason?: string;
}

// Dispatch chain interfaces
export interface DispatchChainCarrier {
  carrierId: string;
  carrierName: string;
  score: number;
  status: 'pending' | 'sent' | 'accepted' | 'refused' | 'timeout';
  sentAt?: string;
  respondedAt?: string;
  responseTime?: number;
  refusalReason?: string;
}

export interface DispatchChain {
  orderId: string;
  status: 'dispatching' | 'completed' | 'failed' | 'affret_ia';
  currentIndex: number;
  carriers: DispatchChainCarrier[];
  startedAt: string;
  completedAt?: string;
  assignedCarrierId?: string;
  assignedCarrierName?: string;
}

export interface DispatchStatus {
  orderId: string;
  status: string;
  dispatchChain: DispatchChain;
  events: OrderEvent[];
  currentCarrier?: DispatchChainCarrier;
}

export interface OrderTemplate {
  id: string;
  name: string;
  industrialId: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  goods: Goods;
  constraints: Constraint[];
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 pour hebdomadaire
    dayOfMonth?: number; // 1-31 pour mensuel
    active: boolean;
    nextExecution?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PricingEstimate {
  basePrice: number;
  distanceKm: number;
  durationMinutes: number;
  constraints: {
    type: ConstraintType;
    surcharge: number;
  }[];
  totalPrice: number;
  currency: string;
  validUntil: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: {
    line: number;
    error: string;
  }[];
  orderIds: string[];
}

export interface OrderFilters {
  status?: OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  carrierId?: string;
  search?: string;
  trackingLevel?: TrackingLevel;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
