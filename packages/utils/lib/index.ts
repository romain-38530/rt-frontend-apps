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
