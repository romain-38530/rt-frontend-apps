/**
 * Types TypeScript pour le système Destinataires (Recipient) SYMPHONI.A
 * Gestion complète des destinataires, livraisons, signatures et incidents
 */

import { Address } from './orders';
import { SubscriptionInfo, TransportInfo, CargoInfo, TimelineEvent } from './common';

// Recipient types
export type RecipientStatus = 'invited' | 'pending' | 'active' | 'incomplete' | 'suspended';
export type DeliveryStatus = 'scheduled' | 'in_transit' | 'arriving' | 'arrived' | 'unloading' | 'delivered' | 'incident';
export type IncidentType = 'damage' | 'missing' | 'broken_packaging' | 'wrong_product' | 'partial_refusal' | 'total_refusal';
export type IncidentSeverity = 'minor' | 'major' | 'critical';
export type IncidentStatus = 'reported' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';

export interface RecipientSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  requireSignature: boolean;
  allowPartialDelivery: boolean;
  preferences: {
    preferredDeliveryTimes?: string[];
    constraints?: string[];
  };
}

export interface RecipientContact {
  name: string;
  role: 'reception' | 'logistics' | 'management';
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface OpeningHours {
  monday?: { start: string; end: string; closed?: boolean };
  tuesday?: { start: string; end: string; closed?: boolean };
  wednesday?: { start: string; end: string; closed?: boolean };
  thursday?: { start: string; end: string; closed?: boolean };
  friday?: { start: string; end: string; closed?: boolean };
  saturday?: { start: string; end: string; closed?: boolean };
  sunday?: { start: string; end: string; closed?: boolean };
  exceptions?: {
    date: string;
    closed: boolean;
    hours?: { start: string; end: string };
  }[];
}

export interface DeliverySite {
  siteId: string;
  name: string;
  address: Address;
  contacts: RecipientContact[];
  openingHours: OpeningHours;
  constraints?: string[];
  facilities?: {
    hasDock: boolean;
    hasForklift: boolean;
    hasStorage: boolean;
    parkingSpaces?: number;
  };
}

export interface Recipient {
  recipientId: string;
  industrialId: string;
  companyName: string;
  siret: string;
  sites: DeliverySite[];
  contacts: RecipientContact[];
  status: RecipientStatus;
  invitedAt: string;
  activatedAt?: string;
  settings: RecipientSettings;
  subscription: SubscriptionInfo;
}

export interface ETAInfo {
  predicted: string;
  source: 'tracking_ia' | 'manual';
  confidence: number;
  lastUpdate: string;
  variance?: {
    min: string;
    max: string;
  };
}

export interface DeliveryDocument {
  documentId: string;
  type: 'cmr' | 'delivery_note' | 'packing_list' | 'photo' | 'signature' | 'incident_report' | 'other';
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  metadata?: Record<string, any>;
}

export interface Delivery {
  deliveryId: string;
  orderId: string;
  recipientId: string;
  siteId: string;
  supplierId: string;
  industrialId: string;
  status: DeliveryStatus;
  eta: ETAInfo;
  transport: TransportInfo;
  cargo: CargoInfo;
  documents: DeliveryDocument[];
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SignaturePhoto {
  photoId: string;
  url: string;
  type: 'cargo' | 'damage' | 'general';
  caption?: string;
  timestamp: string;
}

export interface DeliverySignature {
  signatureId: string;
  deliveryId: string;
  type: 'reception' | 'partial_reception' | 'refusal';
  method: 'smartphone' | 'qrcode' | 'kiosk';
  signatureData: string;
  signerName: string;
  signerRole: string;
  location?: { lat: number; lng: number };
  timestamp: string;
  reservations?: string;
  photos: SignaturePhoto[];
  cmrId?: string;
}

export interface AffectedItem {
  reference: string;
  description: string;
  quantity: number;
  expectedQuantity?: number;
  damageType: string;
  damageDescription?: string;
}

export interface IncidentPhoto {
  photoId: string;
  url: string;
  caption?: string;
  timestamp: string;
}

export interface IncidentNotifications {
  supplier: boolean;
  industrial: boolean;
  carrier: boolean;
  sentAt?: string;
}

export interface IncidentResolution {
  action: string;
  description?: string;
  resolvedAt: string;
  resolvedBy: string;
  compensation?: {
    amount: number;
    currency: string;
    type: 'refund' | 'credit' | 'replacement';
  };
  agreedBy?: {
    supplier: boolean;
    industrial: boolean;
    carrier: boolean;
  };
}

export interface Incident {
  incidentId: string;
  deliveryId: string;
  recipientId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  affectedItems: AffectedItem[];
  photos: IncidentPhoto[];
  status: IncidentStatus;
  reportedAt: string;
  reportedBy: { name: string; role: string };
  notifications: IncidentNotifications;
  billingBlocked: boolean;
  disputeId?: string;
  resolution?: IncidentResolution;
  timeline: TimelineEvent[];
}

// API Request/Response types
export interface InviteRecipientRequest {
  companyName: string;
  email: string;
  industrialId: string;
  sites?: DeliverySite[];
}

export interface InviteRecipientResponse {
  recipientId: string;
  invitationToken: string;
  invitationUrl: string;
  expiresAt: string;
}

export interface RegisterRecipientRequest {
  token: string;
  password: string;
  contacts: RecipientContact[];
  companyInfo?: {
    siret: string;
    address: Address;
  };
}

export interface RegisterRecipientResponse {
  recipientId: string;
  status: RecipientStatus;
  accessToken: string;
  refreshToken: string;
}

export interface ReportIncidentRequest {
  deliveryId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  affectedItems: AffectedItem[];
  photos?: string[]; // URLs des photos
}

export interface ReportIncidentResponse {
  incidentId: string;
  deliveryId: string;
  status: IncidentStatus;
  notificationsSent: boolean;
  billingBlocked: boolean;
  timestamp: string;
}

export interface SignDeliveryRequest {
  deliveryId: string;
  type: 'reception' | 'partial_reception' | 'refusal';
  signatureData: string;
  signerName: string;
  signerRole: string;
  reservations?: string;
  location?: { lat: number; lng: number };
  photos?: string[]; // URLs des photos
}

export interface SignDeliveryResponse {
  signatureId: string;
  deliveryId: string;
  timestamp: string;
  verified: boolean;
  documentUrl?: string;
  cmrId?: string;
}

export interface UpdateETARequest {
  deliveryId: string;
  newEta: string;
  source: 'tracking_ia' | 'manual';
  confidence?: number;
}

export interface UpdateETAResponse {
  deliveryId: string;
  eta: ETAInfo;
  notificationsSent: boolean;
}

export interface RecipientNotification {
  notificationId: string;
  recipientId: string;
  type: 'delivery_scheduled' | 'eta_updated' | 'driver_arriving' | 'delivery_completed' | 'incident_reported';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface RecipientStats {
  totalDeliveries: number;
  scheduledDeliveries: number;
  completedDeliveries: number;
  incidentsReported: number;
  averageReceptionTime: number; // en minutes
  onTimeDeliveryRate: number; // pourcentage
  satisfactionScore?: number; // 0-5
}

export interface PaginatedDeliveries {
  data: Delivery[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeliveryFilters {
  status?: DeliveryStatus[];
  siteId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedIncidents {
  data: Incident[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IncidentFilters {
  status?: IncidentStatus[];
  type?: IncidentType[];
  severity?: IncidentSeverity[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
