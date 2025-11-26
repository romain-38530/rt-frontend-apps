/**
 * Types TypeScript pour le système de commandes SYMPHONI.A
 */

export type OrderStatus =
  | 'draft'
  | 'created'
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

export interface OrderEvent {
  id: string;
  orderId: string;
  type: string;
  timestamp: string;
  data?: any;
  userId?: string;
  userName?: string;
  description: string;
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
