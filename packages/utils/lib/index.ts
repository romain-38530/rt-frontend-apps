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
export { PlanningService, formatDuration, getBookingStatusLabel, getBookingStatusColor, getDriverStatusLabel, getDriverStatusColor, getSlotStatusLabel, getSlotStatusColor, getSiteTypeLabel, getDockTypeLabel, getEcmrStatusLabel, getEcmrStatusColor, generateTimeSlots, isSlotAvailable, calculateOccupancyRate } from './services/planning-service';
export { BillingService } from './services/billing-service';
export { ChatbotService } from './services/chatbot-service';
