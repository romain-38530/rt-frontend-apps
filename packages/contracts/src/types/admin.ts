/**
 * Types Admin Gateway pour SYMPHONI.A
 * Administration centralisee de la plateforme
 */

// User Management Types
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'operator'
  | 'viewer'
  | 'api_user';

export type UserStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'deleted';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  companyId: string;
  companyName: string;
  roles: UserRole[];
  permissions: string[];
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Company Management Types
export type CompanyType =
  | 'shipper'
  | 'carrier'
  | 'broker'
  | 'warehouse'
  | 'supplier'
  | 'recipient';

export type CompanyStatus =
  | 'active'
  | 'pending'
  | 'suspended'
  | 'cancelled';

export interface AdminCompany {
  id: string;
  name: string;
  legalName: string;
  registrationNumber: string;
  vatNumber?: string;
  type: CompanyType;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  status: CompanyStatus;
  verified: boolean;
  verifiedAt?: Date;
  subscription?: {
    plan: string;
    status: string;
    expiresAt: Date;
  };
  usersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription & Billing Types
export type SubscriptionPlan =
  | 'free'
  | 'starter'
  | 'professional'
  | 'enterprise'
  | 'custom';

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'past_due'
  | 'cancelled'
  | 'suspended';

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface Subscription {
  id: string;
  companyId: string;
  companyName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  price: number;
  currency: string;
  modules: string[];
  limits: {
    users: number;
    orders: number;
    storage: number;
    apiCalls: number;
  };
  usage: {
    users: number;
    orders: number;
    storage: number;
    apiCalls: number;
  };
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export interface Invoice {
  id: string;
  number: string;
  companyId: string;
  companyName: string;
  subscriptionId: string;
  status: InvoiceStatus;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;
  refundedAmount?: number;
  refundedAt?: Date;
  createdAt: Date;
}

// Module Management Types
export type ModuleStatus = 'active' | 'inactive' | 'beta' | 'deprecated';

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  status: ModuleStatus;
  version: string;
  pricing: {
    type: 'included' | 'addon' | 'usage';
    price?: number;
    unit?: string;
  };
  dependencies: string[];
  permissions: string[];
  configSchema?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyModule {
  moduleId: string;
  moduleName: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  enabledAt?: Date;
  disabledAt?: Date;
}

// API Key Management Types
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  keyPreview: string; // Last 4 chars
  companyId: string;
  companyName: string;
  permissions: string[];
  rateLimit: number;
  status: ApiKeyStatus;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdBy: string;
  createdAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
}

// Audit & Compliance Types
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export type GdprRequestType =
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'portability'
  | 'restriction'
  | 'objection';

export type GdprRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected';

export interface GdprRequest {
  id: string;
  type: GdprRequestType;
  userId: string;
  userEmail: string;
  companyId: string;
  status: GdprRequestStatus;
  description: string;
  response?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
  dueDate: Date;
}

// Platform Monitoring Types
export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  latency: number;
  lastCheck: Date;
  uptime: number;
  details?: Record<string, unknown>;
}

export interface PlatformMetrics {
  timestamp: Date;
  activeUsers: number;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  byService: {
    service: string;
    requests: number;
    errors: number;
    avgLatency: number;
  }[];
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  companies: {
    total: number;
    active: number;
    new: number;
    byType: Record<CompanyType, number>;
  };
  subscriptions: {
    total: number;
    byPlan: Record<SubscriptionPlan, number>;
    mrr: number;
    arr: number;
  };
  usage: {
    orders: number;
    deliveries: number;
    apiCalls: number;
    storage: number;
  };
}

// Notifications & Announcements Types
export type AnnouncementType =
  | 'info'
  | 'warning'
  | 'maintenance'
  | 'feature'
  | 'promotion';

export type AnnouncementTarget =
  | 'all'
  | 'admins'
  | 'companies'
  | 'plan'
  | 'module';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  target: AnnouncementTarget;
  targetIds?: string[];
  priority: number;
  active: boolean;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BroadcastNotification {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  channels: ('email' | 'push' | 'sms' | 'inApp')[];
  target: AnnouncementTarget;
  targetIds?: string[];
  scheduledAt?: Date;
}

// System Logs Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface SystemLog {
  id: string;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  timestamp: Date;
}

export interface ErrorTracking {
  id: string;
  service: string;
  error: string;
  message: string;
  stack?: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Integration Types
export type IntegrationType =
  | 'erp'
  | 'tms'
  | 'wms'
  | 'accounting'
  | 'crm'
  | 'ecommerce'
  | 'carrier'
  | 'payment';

export type IntegrationStatus =
  | 'active'
  | 'inactive'
  | 'error'
  | 'pending';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  companyId: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  lastSyncAt?: Date;
  syncErrors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface AdminApiResponse<T> {
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
