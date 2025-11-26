/**
 * Hook React pour utiliser le client WebSocket
 * Gère automatiquement la connexion/déconnexion et les subscriptions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketEvent } from '../websocket-client';
import { getWebSocketClient } from '../websocket-client';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
  onReconnect?: (attempts: number) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const wsClientRef = useRef(getWebSocketClient());
  const optionsRef = useRef(options);

  // Mettre à jour les options
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const client = wsClientRef.current;
    if (!client) return;

    // Événements internes de connexion
    const handleConnect = () => {
      setIsConnected(true);
      setStatus('connected');
      optionsRef.current.onConnect?.();
    };

    const handleDisconnect = (data: { reason: string }) => {
      setIsConnected(false);
      setStatus('disconnected');
      optionsRef.current.onDisconnect?.(data.reason);
    };

    const handleError = (data: { error: any }) => {
      optionsRef.current.onError?.(data.error);
    };

    const handleReconnect = (data: { attempts: number }) => {
      optionsRef.current.onReconnect?.(data.attempts);
    };

    client.on('_internal:connected', handleConnect);
    client.on('_internal:disconnected', handleDisconnect);
    client.on('_internal:error', handleError);
    client.on('_internal:reconnected', handleReconnect);

    // État initial
    setIsConnected(client.isConnected());
    setStatus(client.getStatus());

    // Cleanup
    return () => {
      client.off('_internal:connected', handleConnect);
      client.off('_internal:disconnected', handleDisconnect);
      client.off('_internal:error', handleError);
      client.off('_internal:reconnected', handleReconnect);
    };
  }, []);

  const send = useCallback(<K extends keyof WebSocketEvent>(event: K, data: WebSocketEvent[K]) => {
    const client = wsClientRef.current;
    if (client) {
      client.send(event, data);
    }
  }, []);

  const subscribe = useCallback(
    <K extends keyof WebSocketEvent>(
      event: K,
      callback: (data: WebSocketEvent[K]) => void
    ) => {
      const client = wsClientRef.current;
      if (!client) return () => {};

      client.on(event, callback);

      // Retourner la fonction de nettoyage
      return () => {
        client.off(event, callback);
      };
    },
    []
  );

  return {
    isConnected,
    status,
    send,
    subscribe,
  };
}

export default useWebSocket;
