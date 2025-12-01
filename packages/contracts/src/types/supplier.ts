/**
 * Types TypeScript pour le système Fournisseurs (Supplier) SYMPHONI.A
 * Gestion complète des fournisseurs, commandes, créneaux de chargement et signatures
 */

import { Address } from './orders';
import { SubscriptionInfo, TransportInfo, TimelineEvent } from './common';

// Supplier types
export type SupplierStatus = 'invited' | 'pending' | 'active' | 'incomplete' | 'suspended';
export type SupplierOrderStatus = 'to_prepare' | 'ready' | 'in_progress' | 'loaded' | 'dispute';
export type SlotStatus = 'proposed' | 'accepted' | 'rejected' | 'modified' | 'confirmed';
export type ContactRole = 'logistique' | 'production' | 'planning';

export interface SupplierSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  autoAcceptSlots: boolean;
  defaultLoadingDuration: number; // en minutes
  preferences: {
    preferredLoadingTimes?: string[];
    constraints?: string[];
  };
}

export interface SupplierContact {
  name: string;
  role: ContactRole;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface Supplier {
  supplierId: string;
  industrialId: string;
  companyName: string;
  siret: string;
  address: Address;
  contacts: SupplierContact[];
  status: SupplierStatus;
  invitedAt: string;
  activatedAt?: string;
  settings: SupplierSettings;
  subscription: SubscriptionInfo;
}

export interface GoodsInfo {
  description: string;
  weight: number; // en kg
  volume?: number; // en m³
  quantity: number;
  palettes?: number;
  packaging?: string;
  references?: string[];
}

export interface SupplierDocument {
  documentId: string;
  type: 'order' | 'packing_list' | 'delivery_note' | 'photo' | 'other';
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SupplierOrder {
  orderId: string;
  supplierId: string;
  industrialId: string;
  status: SupplierOrderStatus;
  loadingSlot?: LoadingSlot;
  goods: GoodsInfo;
  transportInfo?: TransportInfo;
  documents: SupplierDocument[];
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface LoadingSlot {
  slotId: string;
  orderId: string;
  proposedBy: 'system' | 'supplier' | 'industrial';
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  etaFromTracking?: string;
  response?: SlotResponse;
}

export interface SlotResponse {
  action: 'accept' | 'modify' | 'reject';
  reason?: string;
  alternativeSlot?: Partial<LoadingSlot>;
}

export interface SupplierSignature {
  signatureId: string;
  orderId: string;
  type: 'loading' | 'delivery_note';
  method: 'smartphone' | 'qrcode' | 'kiosk';
  signatureData: string;
  signerName: string;
  signerRole: string;
  location?: { lat: number; lng: number };
  timestamp: string;
  verified: boolean;
}

export interface ChatParticipant {
  userId: string;
  name: string;
  role: 'supplier' | 'industrial' | 'carrier' | 'system';
  online: boolean;
  lastSeen?: string;
}

export interface ChatMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: {
    type: string;
    url: string;
    name: string;
  }[];
}

export interface SupplierChat {
  chatId: string;
  participants: ChatParticipant[];
  orderId?: string;
  messages: ChatMessage[];
  status: 'active' | 'archived';
  lastMessageAt: string;
}

// Templates de messages
export type ChatTemplate = 'loading_ready' | 'production_delay' | 'missing_documents';

export interface ChatTemplateData {
  template: ChatTemplate;
  variables?: Record<string, string>;
}

// API Request/Response types
export interface InviteSupplierRequest {
  companyName: string;
  email: string;
  industrialId: string;
}

export interface InviteSupplierResponse {
  supplierId: string;
  invitationToken: string;
  invitationUrl: string;
  expiresAt: string;
}

export interface RegisterSupplierRequest {
  token: string;
  password: string;
  contacts: SupplierContact[];
  companyInfo?: {
    siret: string;
    address: Address;
  };
}

export interface RegisterSupplierResponse {
  supplierId: string;
  status: SupplierStatus;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateOrderStatusRequest {
  status: SupplierOrderStatus;
  notes?: string;
}

export interface RespondToSlotRequest {
  action: 'accept' | 'modify' | 'reject';
  reason?: string;
  alternativeDate?: string;
  alternativeStartTime?: string;
  alternativeEndTime?: string;
}

export interface RespondToSlotResponse {
  slotId: string;
  status: SlotStatus;
  newSlot?: LoadingSlot;
  message: string;
}

export interface SignLoadingRequest {
  orderId: string;
  method: 'smartphone' | 'qrcode' | 'kiosk';
  signatureData: string;
  signerName: string;
  signerRole: string;
  location?: { lat: number; lng: number };
}

export interface SignLoadingResponse {
  signatureId: string;
  orderId: string;
  timestamp: string;
  verified: boolean;
  documentUrl?: string;
}

export interface SendChatMessageRequest {
  chatId: string;
  content: string;
  attachments?: {
    type: string;
    url: string;
    name: string;
  }[];
}

export interface SendChatMessageResponse {
  messageId: string;
  timestamp: string;
  delivered: boolean;
}

export interface SupplierNotification {
  notificationId: string;
  supplierId: string;
  type: 'new_order' | 'slot_proposed' | 'slot_confirmed' | 'message_received' | 'order_updated';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface SupplierStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  averagePreparationTime: number; // en heures
  onTimeRate: number; // pourcentage
  satisfactionScore?: number; // 0-5
}

export interface PaginatedSupplierOrders {
  data: SupplierOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SupplierOrderFilters {
  status?: SupplierOrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
