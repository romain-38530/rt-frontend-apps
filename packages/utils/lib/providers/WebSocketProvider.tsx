/**
 * Provider WebSocket pour initialiser la connexion globale
 * À utiliser dans _app.tsx de chaque portail
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeWebSocket, getWebSocketClient } from '../websocket-client';
import type WebSocketClient from '../websocket-client';

interface WebSocketContextValue {
  client: WebSocketClient | null;
  isConnected: boolean;
  isInitialized: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  client: null,
  isConnected: false,
  isInitialized: false,
});

export const useWebSocketContext = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  wsUrl,
  autoConnect = true,
}) => {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!autoConnect) return;

    // Initialiser le client WebSocket
    const wsClient = initializeWebSocket(wsUrl);
    setClient(wsClient);
    setIsInitialized(true);

    // Écouter les événements de connexion
    const handleConnect = () => {
      console.log('[WebSocketProvider] Connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('[WebSocketProvider] Disconnected');
      setIsConnected(false);
    };

    wsClient.on('_internal:connected', handleConnect);
    wsClient.on('_internal:disconnected', handleDisconnect);

    // État initial
    setIsConnected(wsClient.isConnected());

    // Cleanup
    return () => {
      wsClient.off('_internal:connected', handleConnect);
      wsClient.off('_internal:disconnected', handleDisconnect);
      // Ne pas déconnecter automatiquement pour permettre la reconnexion
    };
  }, [wsUrl, autoConnect]);

  return (
    <WebSocketContext.Provider value={{ client, isConnected, isInitialized }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
