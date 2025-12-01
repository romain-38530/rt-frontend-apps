/**
 * Types et interfaces centralisés pour l'API Supplier
 */

// Statuts des fournisseurs
export type SupplierStatus = 'invited' | 'pending' | 'active' | 'incomplete' | 'suspended';

// Statuts des commandes
export type OrderStatus = 'to_prepare' | 'ready' | 'in_progress' | 'loaded' | 'dispute';

// Statuts des créneaux
export type SlotStatus = 'proposed' | 'accepted' | 'rejected' | 'modified' | 'confirmed';

// Rôles de contact
export type ContactRole = 'logistique' | 'production' | 'planning';

// Tiers d'abonnement
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// Types de signature
export type SignatureType = 'loading' | 'delivery_note';

// Méthodes de signature
export type SignatureMethod = 'smartphone' | 'qrcode' | 'kiosk';

// Types de participant au chat
export type ParticipantType = 'supplier' | 'transporter' | 'industrial' | 'logistician';

// Statuts de conversation
export type ChatStatus = 'active' | 'archived';

// Types de notification
export type NotificationType = 'order' | 'slot' | 'signature' | 'message' | 'system';

// Priorités de notification
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Proposé par
export type ProposedBy = 'system' | 'supplier' | 'industrial';

// Actions sur les créneaux
export type SlotAction = 'accept' | 'modify' | 'reject';

// Interface de réponse API standard
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Interface de pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Interface de réponse paginée
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: Pagination;
}

// Filtres pour requêtes
export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  industrialId?: string;
  page?: number;
  limit?: number;
}

export interface SlotFilters {
  status?: SlotStatus;
  dateFrom?: Date;
  dateTo?: Date;
  orderId?: string;
  page?: number;
  limit?: number;
}

export interface ChatFilters {
  status?: ChatStatus;
  orderId?: string;
  page?: number;
  limit?: number;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  page?: number;
  limit?: number;
}

// DTOs (Data Transfer Objects)
export interface CreateSupplierDTO {
  industrialId: string;
  companyName: string;
  siret: string;
  email: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface UpdateSupplierDTO {
  companyName?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contacts?: Array<{
    name: string;
    role: ContactRole;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
}

export interface CreateOrderDTO {
  orderId: string;
  supplierId: string;
  industrialId: string;
  goods: {
    description: string;
    weight: number;
    pallets: number;
    volume: number;
    specialInstructions?: string;
  };
  transportInfo?: {
    carrierId?: string;
    vehicleType?: string;
    driverName?: string;
    driverPhone?: string;
    licensePlate?: string;
  };
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  notes?: string;
}

export interface CreateSlotDTO {
  supplierId: string;
  orderId: string;
  proposedBy: ProposedBy;
  date: Date;
  startTime: string;
  endTime: string;
  dockId?: string;
}

export interface ModifySlotDTO {
  alternativeSlot: {
    date: Date;
    startTime: string;
    endTime: string;
    dockId?: string;
  };
  reason: string;
}

export interface CreateSignatureDTO {
  orderId: string;
  supplierId: string;
  type: SignatureType;
  method: SignatureMethod;
  signatureData: string;
  signerName: string;
  signerRole: string;
  location?: {
    lat: number;
    lng: number;
  };
  deviceInfo?: string;
}

export interface CreateChatDTO {
  participants: Array<{
    id: string;
    type: ParticipantType;
    name: string;
  }>;
  orderId?: string;
  initialMessage?: string;
}

export interface SendMessageDTO {
  content: string;
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;
}

export interface SendTemplateMessageDTO {
  templateType: string;
  additionalInfo?: string;
}

export interface CreateNotificationDTO {
  supplierId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: any;
}

export interface UpdateNotificationSettingsDTO {
  notificationsEnabled?: boolean;
  channels?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  preferences?: {
    [key: string]: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
  };
}

// Types pour les événements
export interface EventPayload {
  type: string;
  source: string;
  data: any;
  metadata: {
    timestamp: string;
    environment: string;
    [key: string]: any;
  };
}

// Types pour les erreurs
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
  details?: any;
}

// Types pour l'authentification
export interface JWTPayload {
  supplierId: string;
  type: 'supplier';
  [key: string]: any;
}

export interface AuthRequest {
  supplierId?: string;
  user?: JWTPayload;
}
