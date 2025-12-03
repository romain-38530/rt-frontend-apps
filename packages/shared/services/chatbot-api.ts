/**
 * SYMPHONI.A - Chatbot API Client
 * Service TypeScript pour le chatbot IA avec support WebSocket
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';
const WS_URL = process.env.NEXT_PUBLIC_CHATBOT_WS_URL || 'wss://d2i50a1vlg138w.cloudfront.net/chatbot/ws';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
    suggestedActions?: string[];
  };
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  context: 'general' | 'order' | 'tracking' | 'support' | 'affret' | 'planning';
  contextId?: string;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotResponse {
  message: ChatMessage;
  suggestions?: string[];
  actions?: ChatbotAction[];
}

export interface ChatbotAction {
  type: 'navigate' | 'open_modal' | 'execute_function' | 'show_data';
  label: string;
  data: any;
}

export interface ChatbotStats {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  satisfactionRate: number;
}

export type MessageHandler = (message: ChatMessage) => void;
export type ConnectionHandler = (connected: boolean) => void;
export type ErrorHandler = (error: Error) => void;

// =============================================================================
// WEBSOCKET CLIENT
// =============================================================================

export class ChatbotWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: MessageHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  constructor(private token?: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.token ? `${WS_URL}?token=${this.token}` : WS_URL;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('Chatbot WebSocket connected');
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && data.message) {
              this.notifyMessageHandlers(data.message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Chatbot WebSocket error:', error);
          this.notifyErrorHandlers(new Error('WebSocket connection error'));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Chatbot WebSocket disconnected');
          this.notifyConnectionHandlers(false);
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(conversationId: string, content: string, context?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'message',
      conversationId,
      content,
      context,
    }));
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  onConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  private notifyMessageHandlers(message: ChatMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// =============================================================================
// REST API FUNCTIONS
// =============================================================================

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// CONVERSATION MANAGEMENT
// =============================================================================

export async function createConversation(params: {
  userId: string;
  context?: Conversation['context'];
  contextId?: string;
  title?: string;
}): Promise<Conversation> {
  return fetchAPI('/api/conversations', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  return fetchAPI(`/api/conversations?userId=${userId}`);
}

export async function getConversation(conversationId: string): Promise<Conversation> {
  return fetchAPI(`/api/conversations/${conversationId}`);
}

export async function deleteConversation(conversationId: string): Promise<{ message: string }> {
  return fetchAPI(`/api/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<Conversation> {
  return fetchAPI(`/api/conversations/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

// =============================================================================
// MESSAGES
// =============================================================================

export async function sendMessage(params: {
  conversationId: string;
  content: string;
  context?: any;
}): Promise<ChatbotResponse> {
  return fetchAPI('/api/messages', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  return fetchAPI(`/api/messages?conversationId=${conversationId}`);
}

export async function getMessage(messageId: string): Promise<ChatMessage> {
  return fetchAPI(`/api/messages/${messageId}`);
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

export async function getQuickActions(context?: string): Promise<{
  actions: Array<{ id: string; label: string; prompt: string; icon?: string }>;
}> {
  const query = context ? `?context=${context}` : '';
  return fetchAPI(`/api/quick-actions${query}`);
}

export async function executeQuickAction(params: {
  conversationId: string;
  actionId: string;
  data?: any;
}): Promise<ChatbotResponse> {
  return fetchAPI('/api/quick-actions/execute', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// FEEDBACK
// =============================================================================

export async function submitFeedback(params: {
  messageId: string;
  rating: 'positive' | 'negative';
  comment?: string;
}): Promise<{ message: string }> {
  return fetchAPI('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// STATISTICS
// =============================================================================

export async function getChatbotStats(): Promise<ChatbotStats> {
  return fetchAPI('/api/stats');
}

export async function getUserStats(userId: string): Promise<{
  conversationsCount: number;
  messagesCount: number;
  lastActivityAt: string;
}> {
  return fetchAPI(`/api/stats/user/${userId}`);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function getContextIcon(context: Conversation['context']): string {
  const icons = {
    general: '💬',
    order: '📦',
    tracking: '📍',
    support: '🎧',
    affret: '🚛',
    planning: '📅',
  };
  return icons[context] || '💬';
}

export function getContextLabel(context: Conversation['context']): string {
  const labels = {
    general: 'Conversation générale',
    order: 'Commande',
    tracking: 'Suivi',
    support: 'Support',
    affret: 'Affretement',
    planning: 'Planning',
  };
  return labels[context] || 'Conversation';
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const chatbotApi = {
  // WebSocket
  ChatbotWebSocket,
  // Conversations
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
  updateConversationTitle,
  // Messages
  sendMessage,
  getMessages,
  getMessage,
  // Quick Actions
  getQuickActions,
  executeQuickAction,
  // Feedback
  submitFeedback,
  // Statistics
  getChatbotStats,
  getUserStats,
  // Utilities
  formatTimestamp,
  getContextIcon,
  getContextLabel,
};

export default chatbotApi;
