/**
 * Service API pour le module Chatbots SYMPHONI.A
 * Gestion conversations, messages, tickets, knowledge base, diagnostics
 */

import { createApiClient } from '../api-client';
import type {
  ChatbotType,
  Conversation,
  Message,
  SendMessageRequest,
  SendMessageResponse,
  CreateConversationRequest,
  Ticket,
  CreateTicketRequest,
  KnowledgeArticle,
  SearchKnowledgeRequest,
  FAQ,
  DiagnosticReport,
  ChatbotStats,
  ConversationFeedback,
  CopiloteMission,
  ActivateMissionRequest,
  UpdateMissionStatusRequest,
  CheckpointArrivalRequest,
  CheckpointCompletionRequest,
  ChatbotUploadDocumentRequest,
  SendLocationRequest,
} from '@rt/contracts';

// Client API pour Chatbot
const chatbotApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net/api/v1',
  timeout: 30000,
  retries: 3,
});

export class ChatbotService {
  // ========== CONVERSATIONS ==========

  /**
   * Creer une nouvelle conversation
   */
  static async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    return await chatbotApi.post<Conversation>('/conversations', request);
  }

  /**
   * Obtenir une conversation par ID
   */
  static async getConversation(conversationId: string): Promise<Conversation> {
    return await chatbotApi.get<Conversation>(`/conversations/${conversationId}`);
  }

  /**
   * Lister les conversations de l'utilisateur
   */
  static async listConversations(filters?: {
    botType?: ChatbotType;
    status?: 'active' | 'closed' | 'transferred';
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: Conversation[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.botType) params.append('botType', filters.botType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return await chatbotApi.get(`/conversations?${params.toString()}`);
  }

  /**
   * Fermer une conversation
   */
  static async closeConversation(conversationId: string): Promise<Conversation> {
    return await chatbotApi.post<Conversation>(`/conversations/${conversationId}/close`);
  }

  /**
   * Transferer vers un technicien
   */
  static async transferToTechnician(
    conversationId: string,
    reason?: string
  ): Promise<Conversation> {
    return await chatbotApi.post<Conversation>(`/conversations/${conversationId}/transfer`, {
      reason,
    });
  }

  /**
   * Soumettre un feedback
   */
  static async submitFeedback(
    conversationId: string,
    feedback: Omit<ConversationFeedback, 'submittedAt'>
  ): Promise<Conversation> {
    return await chatbotApi.post<Conversation>(
      `/conversations/${conversationId}/feedback`,
      feedback
    );
  }

  // ========== MESSAGES ==========

  /**
   * Envoyer un message
   */
  static async sendMessage(
    conversationId: string,
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    return await chatbotApi.post<SendMessageResponse>(
      `/conversations/${conversationId}/messages`,
      request
    );
  }

  /**
   * Obtenir l'historique des messages
   */
  static async getMessages(
    conversationId: string,
    limit?: number,
    before?: string
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);

    return await chatbotApi.get(
      `/conversations/${conversationId}/messages?${params.toString()}`
    );
  }

  // ========== TICKETS ==========

  /**
   * Creer un ticket depuis une conversation
   */
  static async createTicket(request: CreateTicketRequest): Promise<Ticket> {
    return await chatbotApi.post<Ticket>('/tickets', request);
  }

  /**
   * Obtenir un ticket
   */
  static async getTicket(ticketId: string): Promise<Ticket> {
    return await chatbotApi.get<Ticket>(`/tickets/${ticketId}`);
  }

  /**
   * Lister les tickets
   */
  static async listTickets(filters?: {
    status?: Ticket['status'];
    priority?: Ticket['priority'];
    category?: Ticket['category'];
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority.toString());
    if (filters?.category) params.append('category', filters.category);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return await chatbotApi.get(`/tickets?${params.toString()}`);
  }

  /**
   * Mettre a jour le statut d'un ticket
   */
  static async updateTicketStatus(
    ticketId: string,
    status: Ticket['status'],
    resolution?: string
  ): Promise<Ticket> {
    return await chatbotApi.patch<Ticket>(`/tickets/${ticketId}`, {
      status,
      resolution,
    });
  }

  // ========== KNOWLEDGE BASE ==========

  /**
   * Rechercher dans la base de connaissances
   */
  static async searchKnowledge(
    request: SearchKnowledgeRequest
  ): Promise<{ articles: KnowledgeArticle[]; total: number }> {
    return await chatbotApi.post('/knowledge/search', request);
  }

  /**
   * Obtenir un article
   */
  static async getArticle(articleId: string): Promise<KnowledgeArticle> {
    return await chatbotApi.get<KnowledgeArticle>(`/knowledge/articles/${articleId}`);
  }

  /**
   * Marquer un article comme utile
   */
  static async markArticleHelpful(articleId: string, helpful: boolean): Promise<void> {
    await chatbotApi.post(`/knowledge/articles/${articleId}/feedback`, { helpful });
  }

  /**
   * Obtenir les articles populaires
   */
  static async getPopularArticles(
    botType?: ChatbotType,
    limit = 10
  ): Promise<KnowledgeArticle[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (botType) params.append('botType', botType);

    return await chatbotApi.get(`/knowledge/popular?${params.toString()}`);
  }

  // ========== FAQ ==========

  /**
   * Obtenir les FAQs
   */
  static async getFAQs(
    botType?: ChatbotType | 'all',
    category?: string
  ): Promise<FAQ[]> {
    const params = new URLSearchParams();
    if (botType) params.append('botType', botType);
    if (category) params.append('category', category);

    return await chatbotApi.get(`/faq?${params.toString()}`);
  }

  /**
   * Obtenir les categories de FAQ
   */
  static async getFAQCategories(botType?: ChatbotType): Promise<string[]> {
    const params = new URLSearchParams();
    if (botType) params.append('botType', botType);

    return await chatbotApi.get(`/faq/categories?${params.toString()}`);
  }

  // ========== DIAGNOSTICS ==========

  /**
   * Lancer un diagnostic
   */
  static async runDiagnostic(
    type: DiagnosticReport['type']
  ): Promise<DiagnosticReport> {
    return await chatbotApi.post<DiagnosticReport>('/diagnostics/run', { type });
  }

  /**
   * Obtenir le dernier diagnostic
   */
  static async getLatestDiagnostic(): Promise<DiagnosticReport> {
    return await chatbotApi.get<DiagnosticReport>('/diagnostics/latest');
  }

  /**
   * Obtenir l'historique des diagnostics
   */
  static async getDiagnosticHistory(
    limit = 10
  ): Promise<DiagnosticReport[]> {
    return await chatbotApi.get(`/diagnostics/history?limit=${limit}`);
  }

  // ========== STATS ==========

  /**
   * Obtenir les statistiques globales
   */
  static async getStats(
    botType?: ChatbotType,
    period?: 'day' | 'week' | 'month' | 'year'
  ): Promise<ChatbotStats> {
    const params = new URLSearchParams();
    if (botType) params.append('botType', botType);
    if (period) params.append('period', period);

    return await chatbotApi.get(`/stats?${params.toString()}`);
  }

  // ========== COPILOTE CHAUFFEUR ==========

  /**
   * Obtenir les missions du chauffeur
   */
  static async getDriverMissions(
    driverId: string,
    status?: CopiloteMission['status']
  ): Promise<CopiloteMission[]> {
    const params = new URLSearchParams({ driverId });
    if (status) params.append('status', status);

    return await chatbotApi.get(`/copilote/missions?${params.toString()}`);
  }

  /**
   * Obtenir une mission
   */
  static async getMission(missionId: string): Promise<CopiloteMission> {
    return await chatbotApi.get<CopiloteMission>(`/copilote/missions/${missionId}`);
  }

  /**
   * Activer une mission
   */
  static async activateMission(request: ActivateMissionRequest): Promise<CopiloteMission> {
    return await chatbotApi.post<CopiloteMission>(
      `/copilote/missions/${request.missionId}/activate`,
      request
    );
  }

  /**
   * Mettre a jour le statut d'une mission
   */
  static async updateMissionStatus(
    missionId: string,
    request: UpdateMissionStatusRequest
  ): Promise<CopiloteMission> {
    return await chatbotApi.patch<CopiloteMission>(
      `/copilote/missions/${missionId}/status`,
      request
    );
  }

  /**
   * Signaler l'arrivee a un checkpoint
   */
  static async reportCheckpointArrival(
    missionId: string,
    request: CheckpointArrivalRequest
  ): Promise<CopiloteMission> {
    return await chatbotApi.post<CopiloteMission>(
      `/copilote/missions/${missionId}/checkpoints/${request.checkpointId}/arrive`,
      request
    );
  }

  /**
   * Completer un checkpoint
   */
  static async completeCheckpoint(
    missionId: string,
    request: CheckpointCompletionRequest
  ): Promise<CopiloteMission> {
    return await chatbotApi.post<CopiloteMission>(
      `/copilote/missions/${missionId}/checkpoints/${request.checkpointId}/complete`,
      request
    );
  }

  /**
   * Uploader un document
   */
  static async uploadDocument(request: ChatbotUploadDocumentRequest): Promise<CopiloteMission> {
    return await chatbotApi.post<CopiloteMission>(
      `/copilote/missions/${request.missionId}/documents`,
      request
    );
  }

  /**
   * Envoyer la localisation
   */
  static async sendLocation(request: SendLocationRequest): Promise<void> {
    await chatbotApi.post(`/copilote/missions/${request.missionId}/location`, request);
  }

  /**
   * Obtenir l'historique d'une mission
   */
  static async getMissionHistory(missionId: string): Promise<CopiloteMission['timeline']> {
    return await chatbotApi.get(`/copilote/missions/${missionId}/history`);
  }
}

export default ChatbotService;
