/**
 * Package @rt/utils
 * Utilitaires partagés pour toutes les applications SYMPHONI.A
 */

// API Client
export {
  default as ApiClient,
  createApiClient,
  ordersApi,
  trackingApi,
  documentsApi,
  notificationsApi,
  carriersApi,
  affretIaApi,
} from './api-client';
export type { ApiClientConfig, ApiError } from './api-client';

// WebSocket Client
export {
  default as WebSocketClient,
  createWebSocketClient,
  initializeWebSocket,
  getWebSocketClient,
} from './websocket-client';
export type { WebSocketConfig, WebSocketEvent, EventCallback } from './websocket-client';

// Hooks
export { useWebSocket } from './hooks/useWebSocket';
export type { UseWebSocketOptions } from './hooks/useWebSocket';

export { useNotifications } from './hooks/useNotifications';
export type { UseNotificationsOptions, Notification } from './hooks/useNotifications';

// Services
export { AffretIAService } from './services/affret-ia-service';
export { StorageMarketService } from './services/storage-market-service';
export type { PaginatedResponse, ApiResponse } from './services/storage-market-service';
export { PlanningService, formatDuration, getBookingStatusLabel, getBookingStatusColor, getDriverStatusLabel, getSlotStatusLabel, getECMRStatusLabel, getDockStatusLabel } from './services/planning-service';
export { BillingService } from './services/billing-service';
export { ChatbotService } from './services/chatbot-service';
export { SupplierService } from './services/supplier-service';
export { RecipientService } from './services/recipient-service';

// SMS Service
export { SmsService, getSmsService, createSmsService, SMS_TEMPLATES } from './services/sms-service';
export type { SmsConfig, SmsMessage, SmsSendResult, SmsTemplate, SmsProvider } from './services/sms-service';

// Admin Service
export { AdminService, getAdminService, createAdminService } from './services/admin-service';

// Bourse Maritime Service
export { BourseMaritimeService, getBourseMaritimeService, createBourseMaritimeService } from './services/bourse-maritime-service';

// Orders Service
export { OrdersService } from './services/orders-service';

// Documents Service
export { DocumentsService } from './services/documents-service';

// Tracking Service
export { TrackingService } from './services/tracking-service';

// Appointments Service
export { AppointmentsService } from './services/appointments-service';

// Scoring Service
export { ScoringService, DEFAULT_WEIGHTS } from './services/scoring-service';

// Logistician Service
export { LogisticianService } from './services/logistician-service';
