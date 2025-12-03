/**
 * Client WebSocket pour les notifications et mises à jour temps réel
 * Gère la reconnexion automatique et le heartbeat
 */

import { io, Socket } from 'socket.io-client';

export type EventCallback = (data: any) => void;

export interface WebSocketConfig {
  url: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export interface WebSocketEvent {
  // Événements de commandes
  'order.created': { orderId: string; data: any };
  'order.lane.detected': { orderId: string; lane: any };
  'dispatch.chain.generated': { orderId: string; chain: any };
  'order.sent.to.carrier': { orderId: string; carrierId: string };
  'carrier.accepted': { orderId: string; carrierId: string };
  'carrier.refused': { orderId: string; carrierId: string; reason?: string };
  'carrier.timeout': { orderId: string; carrierId: string };

  // Événements de tracking
  'tracking.started': { orderId: string; trackingLevel: 'basic' | 'gps' | 'premium' };
  'tracking.location.updated': { orderId: string; location: { lat: number; lng: number } };
  'order.arrived.pickup': { orderId: string; timestamp: string };
  'order.loaded': { orderId: string; timestamp: string };
  'order.arrived.delivery': { orderId: string; timestamp: string };
  'order.delivered': { orderId: string; timestamp: string };

  // Événements de documents
  'documents.uploaded': { orderId: string; documentIds: string[] };
  'ocr.completed': { documentId: string; extractedData: any };

  // Événements de scoring
  'carrier.scored': { carrierId: string; score: number };

  // Événements d'escalade
  'order.escalated.to.affretia': { orderId: string; reason: string };

  // Événements de RDV
  'rdv.requested': { orderId: string; appointmentId: string };
  'rdv.proposed': { orderId: string; appointmentId: string };
  'rdv.confirmed': { orderId: string; appointmentId: string };
  'rdv.cancelled': { orderId: string; appointmentId: string; reason?: string };

  // Événement de clôture
  'order.closed': { orderId: string; finalData: any };

  // Événements système
  'notification': { type: string; message: string; data?: any };
  'error': { message: string; code?: string };
}

class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private reconnectAttempt: number = 0;

  constructor(config: WebSocketConfig) {
    this.config = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  connect(token?: string): void {
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    this.connectionStatus = 'connecting';

    // Récupérer le token depuis le localStorage si non fourni
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    this.socket = io(this.config.url, {
      auth: {
        token: authToken,
      },
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.connectionStatus = 'connected';
      this.reconnectAttempt = 0;
      this.emit('_internal:connected', {});
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.connectionStatus = 'disconnected';
      this.emit('_internal:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.reconnectAttempt++;
      this.emit('_internal:error', { error, attempt: this.reconnectAttempt });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      this.emit('_internal:reconnected', { attempts: attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      this.emit('_internal:reconnect_failed', {});
    });

    // Écouter tous les événements enregistrés
    this.eventListeners.forEach((_, eventName) => {
      if (!eventName.startsWith('_internal:')) {
        this.socket!.on(eventName, (data) => {
          this.emit(eventName, data);
        });
      }
    });
  }

  on<K extends keyof WebSocketEvent>(event: K, callback: (data: WebSocketEvent[K]) => void): void;
  on(event: string, callback: EventCallback): void;
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());

      // Si le socket est déjà connecté, commencer à écouter cet événement
      if (this.socket?.connected && !event.startsWith('_internal:')) {
        this.socket.on(event, (data) => {
          this.emit(event, data);
        });
      }
    }

    this.eventListeners.get(event)!.add(callback);
  }

  off<K extends keyof WebSocketEvent>(event: K, callback?: (data: WebSocketEvent[K]) => void): void;
  off(event: string, callback?: EventCallback): void;
  off(event: string, callback?: EventCallback): void {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      this.eventListeners.get(event)!.delete(callback);
    } else {
      this.eventListeners.delete(event);
      if (this.socket && !event.startsWith('_internal:')) {
        this.socket.off(event);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  send<K extends keyof WebSocketEvent>(event: K, data: WebSocketEvent[K]): void;
  send(event: string, data: any): void;
  send(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot send event, not connected:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = 'disconnected';
    }
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  getStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatus;
  }

  reconnect(token?: string): void {
    this.disconnect();
    this.connect(token);
  }
}

// Instance globale du client WebSocket
let globalWebSocketClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient | null {
  return globalWebSocketClient;
}

export function createWebSocketClient(config: WebSocketConfig): WebSocketClient {
  if (globalWebSocketClient) {
    globalWebSocketClient.disconnect();
  }

  globalWebSocketClient = new WebSocketClient(config);
  return globalWebSocketClient;
}

export function initializeWebSocket(url?: string): WebSocketClient {
  const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || 'wss://d2i50a1vlg138w.cloudfront.net';
  return createWebSocketClient({ url: wsUrl });
}

export default WebSocketClient;
