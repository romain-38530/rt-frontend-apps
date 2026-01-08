import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: string;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
  connect: () => void;
  disconnect: () => void;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user?.id || user?._id || null;
  } catch {
    return null;
  }
};

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WEBSOCKET_API_URL || 'wss://d2aodzk1jwptdr.cloudfront.net',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = getAuthToken();
    const userId = getUserId();

    if (!token || !userId) {
      console.warn('[WebSocket] No auth token or user ID, skipping connection');
      return;
    }

    setConnectionState('connecting');

    try {
      // Build WebSocket URL with auth params
      const wsUrl = new URL(url.replace('https://', 'wss://').replace('http://', 'ws://'));
      wsUrl.searchParams.set('token', token);
      wsUrl.searchParams.set('userId', userId);

      const ws = new WebSocket(wsUrl.toString());

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setConnectionState('connected');
        reconnectCountRef.current = 0;

        // Send authentication message
        ws.send(JSON.stringify({
          type: 'auth',
          payload: { token, userId }
        }));

        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionState('error');
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        setConnectionState('disconnected');
        wsRef.current = null;
        onDisconnect?.();

        // Auto-reconnect logic
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          console.log(`[WebSocket] Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Failed to connect:', err);
      setConnectionState('error');
    }
  }, [url, reconnectAttempts, reconnectInterval, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectCountRef.current = reconnectAttempts; // Prevent auto-reconnect

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, [reconnectAttempts]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && typeof window !== 'undefined') {
      // Delay connection to ensure auth is available
      const timeout = setTimeout(connect, 500);
      return () => clearTimeout(timeout);
    }
  }, [autoConnect, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    connectionState,
  };
}

// Hook specifically for notifications
export function useNotificationSocket(onNotification?: (notification: any) => void) {
  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'notification' || message.type === 'new_notification') {
      onNotification?.(message.payload);
    }
  }, [onNotification]);

  return useWebSocket({
    onMessage: handleMessage,
  });
}
