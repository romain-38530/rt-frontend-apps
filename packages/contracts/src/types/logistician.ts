/**
 * Types TypeScript pour le système Logisticien SYMPHONI.A
 * Gestion des logisticiens invités par les industriels pour gérer les commandes
 */

import { Address } from './orders';

// Statuts du logisticien
export type LogisticianStatus = 'invited' | 'pending' | 'active' | 'suspended';

// Niveaux d'accès aux commandes
export type OrderAccessLevel = 'view' | 'edit' | 'sign' | 'full';

// Rôles du logisticien
export type LogisticianRole = 'gestionnaire' | 'superviseur' | 'operateur';

/**
 * Contact du logisticien
 */
export interface LogisticianContact {
  name: string;
  email: string;
  phone: string;
  role: LogisticianRole;
  isPrimary: boolean;
}

/**
 * Paramètres du logisticien
 */
export interface LogisticianSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  defaultAccessLevel: OrderAccessLevel;
  canManageSuppliers: boolean;
  canManageRecipients: boolean;
  canViewBilling: boolean;
}

/**
 * Logisticien - Utilisateur invité par un industriel
 */
export interface Logistician {
  logisticianId: string;
  industrialId: string;
  industrialName?: string;
  companyName: string;
  siret?: string;
  email: string;
  address?: Address;
  contacts: LogisticianContact[];
  status: LogisticianStatus;
  accessLevel: OrderAccessLevel;
  settings: LogisticianSettings;
  invitedAt: string;
  invitedBy: string;
  activatedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invitation logisticien
 */
export interface LogisticianInvitation {
  invitationId: string;
  industrialId: string;
  industrialName: string;
  email: string;
  companyName?: string;
  accessLevel: OrderAccessLevel;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

/**
 * Accès d'un logisticien à une commande spécifique
 */
export interface OrderAccess {
  accessId: string;
  orderId: string;
  logisticianId: string;
  accessLevel: OrderAccessLevel;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  revoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
}

// ============ API Requests ============

/**
 * Requête d'invitation d'un logisticien
 */
export interface InviteLogisticianRequest {
  email: string;
  companyName?: string;
  accessLevel: OrderAccessLevel;
  message?: string;
  orderIds?: string[]; // Commandes spécifiques à partager
}

/**
 * Réponse d'invitation
 */
export interface InviteLogisticianResponse {
  invitationId: string;
  logisticianId?: string;
  invitationUrl: string;
  expiresAt: string;
  emailSent: boolean;
}

/**
 * Requête d'enregistrement logisticien (acceptation invitation)
 */
export interface RegisterLogisticianRequest {
  token: string;
  password: string;
  companyName: string;
  contacts: LogisticianContact[];
  siret?: string;
  address?: Address;
}

/**
 * Réponse d'enregistrement
 */
export interface RegisterLogisticianResponse {
  logisticianId: string;
  industrialId: string;
  industrialName: string;
  accessToken: string;
  refreshToken: string;
  status: LogisticianStatus;
}

/**
 * Validation du token d'invitation
 */
export interface ValidateInvitationRequest {
  token: string;
}

export interface ValidateInvitationResponse {
  valid: boolean;
  email?: string;
  industrialName?: string;
  companyName?: string;
  accessLevel?: OrderAccessLevel;
  expiresAt?: string;
  error?: string;
}

/**
 * Requête de partage de commande
 */
export interface ShareOrderRequest {
  orderId: string;
  logisticianIds: string[];
  accessLevel: OrderAccessLevel;
  message?: string;
  expiresAt?: string;
}

export interface ShareOrderResponse {
  orderId: string;
  sharedWith: {
    logisticianId: string;
    accessLevel: OrderAccessLevel;
    notified: boolean;
  }[];
}

/**
 * Révocation d'accès
 */
export interface RevokeAccessRequest {
  orderId: string;
  logisticianId: string;
  reason?: string;
}

export interface RevokeAccessResponse {
  success: boolean;
  revokedAt: string;
}

/**
 * Mise à jour du logisticien
 */
export interface UpdateLogisticianRequest {
  companyName?: string;
  contacts?: LogisticianContact[];
  settings?: Partial<LogisticianSettings>;
  accessLevel?: OrderAccessLevel;
}

/**
 * Statistiques logisticien utilisateur
 */
export interface LogisticianUserStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  sharedOrders: number;
  lastActivityAt?: string;
}

/**
 * Filtres de liste
 */
export interface LogisticianFilters {
  status?: LogisticianStatus[];
  accessLevel?: OrderAccessLevel[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Liste paginée
 */
export interface PaginatedLogisticians {
  data: Logistician[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Notification logisticien
 */
export interface LogisticianNotification {
  notificationId: string;
  logisticianId: string;
  type: 'invitation' | 'order_shared' | 'order_updated' | 'access_revoked' | 'message';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}
