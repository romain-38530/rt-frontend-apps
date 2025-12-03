import type {
  Prefacturation,
  GeneratePrefacturationRequest,
  UploadInvoiceRequest,
  CarrierInvoice,
  Block,
  CreateBlockRequest,
  TariffGrid,
  CreateTariffRequest,
  CarrierVigilance,
  CreateVigilanceDocumentRequest,
  ERPExport,
  ExportToERPRequest,
  BillingStats,
  Dispute
} from '@rt/contracts';

/**
 * Service client pour l'API Billing
 * Gère toutes les interactions avec le module Préfacturation & Facturation
 */
export class BillingService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'https://d2i50a1vlg138w.cloudfront.net/api/billing', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // ==================== PREFACTURATION ====================

  /**
   * Génère une préfacturation à partir des données de commandes
   */
  async generatePrefacturation(request: GeneratePrefacturationRequest): Promise<{ success: boolean; data?: Prefacturation; error?: string }> {
    return this.fetch<Prefacturation>('/prefacturation/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Récupère une préfacturation par ID
   */
  async getPrefacturation(id: string): Promise<{ success: boolean; data?: Prefacturation; error?: string }> {
    return this.fetch<Prefacturation>(`/prefacturation/${id}`);
  }

  /**
   * Liste les préfacturations avec filtres
   */
  async listPrefacturations(filters?: {
    carrierId?: string;
    status?: string;
    hasDiscrepancies?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: Prefacturation[]; pagination?: any; error?: string }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    return this.fetch<Prefacturation[]>(`/prefacturation?${params.toString()}`);
  }

  /**
   * Finalise une préfacturation en facture
   */
  async finalizePrefacturation(id: string): Promise<{ success: boolean; data?: Prefacturation; error?: string }> {
    return this.fetch<Prefacturation>(`/prefacturation/${id}/finalize`, {
      method: 'POST'
    });
  }

  /**
   * Télécharge le PDF d'une préfacturation
   */
  async downloadPrefacturationPDF(id: string): Promise<{ success: boolean; data?: { pdfUrl: string; reference: string }; error?: string }> {
    return this.fetch<{ pdfUrl: string; reference: string }>(`/prefacturation/${id}/pdf`);
  }

  // ==================== INVOICES ====================

  /**
   * Upload une facture transporteur avec OCR
   */
  async uploadCarrierInvoice(request: UploadInvoiceRequest): Promise<{ success: boolean; data?: CarrierInvoice; error?: string }> {
    return this.fetch<CarrierInvoice>('/invoice/upload', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Récupère le statut de validation d'une facture
   */
  async getInvoiceStatus(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.fetch(`/invoice/${id}/status`);
  }

  /**
   * Valide ou rejette une facture
   */
  async validateInvoice(
    id: string,
    action: 'approve' | 'reject',
    reason?: string,
    userId?: string
  ): Promise<{ success: boolean; data?: CarrierInvoice; error?: string }> {
    return this.fetch<CarrierInvoice>(`/invoice/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ action, reason, userId })
    });
  }

  // ==================== DISCREPANCIES ====================

  /**
   * Récupère les détails d'une discordance
   */
  async getDiscrepancy(id: string): Promise<{ success: boolean; data?: Dispute; error?: string }> {
    return this.fetch<Dispute>(`/discrepancy/${id}`);
  }

  /**
   * Résout une discordance
   */
  async resolveDiscrepancy(
    id: string,
    action: string,
    adjustedAmount?: number,
    comment?: string,
    userId?: string
  ): Promise<{ success: boolean; data?: Dispute; error?: string }> {
    return this.fetch<Dispute>(`/discrepancy/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, adjustedAmount, comment, userId })
    });
  }

  /**
   * Liste toutes les discordances
   */
  async listDiscrepancies(filters?: {
    status?: string;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: Dispute[]; pagination?: any; error?: string }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    return this.fetch<Dispute[]>(`/discrepancy?${params.toString()}`);
  }

  // ==================== BLOCKS ====================

  /**
   * Vérifie les blocages pour une entité
   */
  async checkBlocks(
    entityType: string,
    entityId: string,
    carrierId?: string
  ): Promise<{ success: boolean; data?: { hasBlocks: boolean; blocksCount: number; blocks: any[] }; error?: string }> {
    return this.fetch('/block/check', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, carrierId })
    });
  }

  /**
   * Crée un blocage manuel
   */
  async createBlock(request: CreateBlockRequest): Promise<{ success: boolean; data?: Block; error?: string }> {
    return this.fetch<Block>('/block', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Supprime/résout un blocage
   */
  async removeBlock(
    blockId: string,
    action: string,
    comment?: string,
    userId?: string
  ): Promise<{ success: boolean; data?: Block; error?: string }> {
    return this.fetch<Block>('/block/unblock', {
      method: 'POST',
      body: JSON.stringify({ blockId, action, comment, userId })
    });
  }

  /**
   * Liste les blocages actifs
   */
  async listBlocks(filters?: {
    entityType?: string;
    entityId?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: Block[]; pagination?: any; error?: string }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    return this.fetch<Block[]>(`/block?${params.toString()}`);
  }

  // ==================== TARIFFS ====================

  /**
   * Crée une grille tarifaire
   */
  async createTariff(request: CreateTariffRequest): Promise<{ success: boolean; data?: TariffGrid; error?: string }> {
    return this.fetch<TariffGrid>('/tariffs', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Liste les grilles tarifaires
   */
  async listTariffs(filters?: {
    carrierId?: string;
    clientId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: TariffGrid[]; pagination?: any; error?: string }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    return this.fetch<TariffGrid[]>(`/tariffs?${params.toString()}`);
  }

  /**
   * Récupère une grille tarifaire par ID
   */
  async getTariff(id: string): Promise<{ success: boolean; data?: TariffGrid; error?: string }> {
    return this.fetch<TariffGrid>(`/tariffs/${id}`);
  }

  /**
   * Met à jour une grille tarifaire
   */
  async updateTariff(id: string, updates: Partial<TariffGrid>): Promise<{ success: boolean; data?: TariffGrid; error?: string }> {
    return this.fetch<TariffGrid>(`/tariffs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // ==================== VIGILANCE ====================

  /**
   * Récupère les documents de vigilance d'un transporteur
   */
  async getCarrierVigilance(transporterId: string): Promise<{ success: boolean; data?: CarrierVigilance; error?: string }> {
    return this.fetch<CarrierVigilance>(`/vigilance/${transporterId}`);
  }

  /**
   * Crée ou upload un document de vigilance
   */
  async createVigilanceDocument(request: CreateVigilanceDocumentRequest): Promise<{ success: boolean; data?: CarrierVigilance; error?: string }> {
    return this.fetch<CarrierVigilance>('/vigilance', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Met à jour un document de vigilance
   */
  async updateVigilanceDocument(
    vigilanceId: string,
    documentId: string,
    updates: any,
    userId?: string
  ): Promise<{ success: boolean; data?: CarrierVigilance; error?: string }> {
    return this.fetch<CarrierVigilance>(`/vigilance/${vigilanceId}`, {
      method: 'PUT',
      body: JSON.stringify({ documentId, updates, userId })
    });
  }

  // ==================== ERP EXPORT ====================

  /**
   * Exporte vers l'ERP
   */
  async exportToERP(request: ExportToERPRequest): Promise<{ success: boolean; data?: ERPExport; error?: string }> {
    return this.fetch<ERPExport>('/export', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Liste l'historique des exports
   */
  async listExports(filters?: {
    erpSystem?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: ERPExport[]; pagination?: any; error?: string }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    return this.fetch<ERPExport[]>(`/export?${params.toString()}`);
  }

  // ==================== STATISTICS ====================

  /**
   * Récupère les statistiques du dashboard
   */
  async getStatistics(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{ success: boolean; data?: BillingStats; error?: string }> {
    return this.fetch<BillingStats>(`/stats?period=${period}`);
  }
}

export default BillingService;
