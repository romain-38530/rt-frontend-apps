/**
 * Service API pour Storage Market / Bourse de Stockage
 * Gestion des besoins, offres, capacités, contrats et abonnements
 */

import { createApiClient } from '../api-client';
import type {
  StorageNeed,
  StorageOffer,
  StorageContract,
  LogisticianSite,
  LogisticianSubscription,
  NeedStatus,
  StorageOfferStatus,
  StorageContractStatus,
  StorageType,
  VolumeUnit,
  CreateStorageNeedInput,
  CreateStorageOfferInput,
  CreateLogisticianSiteInput,
  OfferRankingResponse,
  RFPGenerationResponse,
} from '@rt/contracts';

// Temporary local types until contracts are updated
type UpdateStorageNeedRequest = Partial<CreateStorageNeedInput>;
type PublishNeedRequest = { targetLogisticians?: string[]; sendNotifications?: boolean };
type CounterOfferRequest = { newPrice?: number; newConditions?: string; message?: string };
type UpdateSiteRequest = Partial<CreateLogisticianSiteInput>;
type OfferRanking = OfferRankingResponse;
type RFPDocument = RFPGenerationResponse;
type MarketInsights = { averagePrice: number; demandTrend: string; topRegions: string[] };
type SubscriptionPlan = { id: string; name: string; price: number; features: string[] };
type SubscriptionUsage = { sitesUsed: number; offersSubmitted: number; contractsActive: number };

// Client API pour Storage Market
const storageApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_STORAGE_MARKET_API_URL || 'https://d1ea8wbaf6ws9i.cloudfront.net/api/storage-market',
  timeout: 30000,
  retries: 3,
});

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class StorageMarketService {
  // ========== BESOINS DE STOCKAGE ==========

  /**
   * Obtenir la liste des besoins
   */
  static async getNeeds(params?: {
    status?: NeedStatus;
    storageType?: StorageType;
    region?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StorageNeed>> {
    return await storageApi.get<PaginatedResponse<StorageNeed>>('/needs', params);
  }

  /**
   * Obtenir mes besoins
   */
  static async getMyNeeds(params?: {
    status?: NeedStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StorageNeed>> {
    return await storageApi.get<PaginatedResponse<StorageNeed>>('/needs/my', params);
  }

  /**
   * Obtenir les besoins publiés (pour logisticiens)
   */
  static async getPublishedNeeds(params?: {
    storageType?: StorageType;
    region?: string;
    minCapacity?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StorageNeed>> {
    return await storageApi.get<PaginatedResponse<StorageNeed>>('/needs/published', params);
  }

  /**
   * Obtenir un besoin par ID
   */
  static async getNeedById(needId: string): Promise<ApiResponse<StorageNeed>> {
    return await storageApi.get<ApiResponse<StorageNeed>>(`/needs/${needId}`);
  }

  /**
   * Créer un besoin de stockage
   */
  static async createNeed(request: CreateStorageNeedInput): Promise<ApiResponse<StorageNeed>> {
    return await storageApi.post<ApiResponse<StorageNeed>>('/needs', request);
  }

  /**
   * Modifier un besoin
   */
  static async updateNeed(needId: string, request: UpdateStorageNeedRequest): Promise<ApiResponse<StorageNeed>> {
    return await storageApi.put<ApiResponse<StorageNeed>>(`/needs/${needId}`, request);
  }

  /**
   * Publier un besoin
   */
  static async publishNeed(needId: string, request: PublishNeedRequest): Promise<ApiResponse<StorageNeed>> {
    return await storageApi.post<ApiResponse<StorageNeed>>(`/needs/${needId}/publish`, request);
  }

  /**
   * Clôturer un besoin
   */
  static async closeNeed(needId: string, reason?: string): Promise<ApiResponse<StorageNeed>> {
    return await storageApi.post<ApiResponse<StorageNeed>>(`/needs/${needId}/close`, { reason });
  }

  /**
   * Attribuer un besoin à un logisticien
   */
  static async attributeNeed(needId: string, offerId: string, logisticianId: string): Promise<ApiResponse<StorageNeed>> {
    return await storageApi.post<ApiResponse<StorageNeed>>(`/needs/${needId}/attribute`, { offerId, logisticianId });
  }

  /**
   * Supprimer un besoin (brouillon)
   */
  static async deleteNeed(needId: string): Promise<ApiResponse<void>> {
    return await storageApi.delete<ApiResponse<void>>(`/needs/${needId}`);
  }

  /**
   * Obtenir les statistiques d'un besoin
   */
  static async getNeedStats(needId: string): Promise<ApiResponse<any>> {
    return await storageApi.get<ApiResponse<any>>(`/needs/${needId}/stats`);
  }

  // ========== OFFRES ==========

  /**
   * Obtenir la liste des offres
   */
  static async getOffers(params?: {
    needId?: string;
    status?: StorageOfferStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StorageOffer>> {
    return await storageApi.get<PaginatedResponse<StorageOffer>>('/offers', params);
  }

  /**
   * Obtenir mes offres (logisticien)
   */
  static async getMyOffers(params?: {
    status?: StorageOfferStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StorageOffer>> {
    return await storageApi.get<PaginatedResponse<StorageOffer>>('/offers/my', params);
  }

  /**
   * Obtenir les offres pour un besoin
   */
  static async getOffersForNeed(needId: string, params?: {
    status?: StorageOfferStatus;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StorageOffer>> {
    return await storageApi.get<PaginatedResponse<StorageOffer>>(`/offers/for-need/${needId}`, params);
  }

  /**
   * Obtenir une offre par ID
   */
  static async getOfferById(offerId: string): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.get<ApiResponse<StorageOffer>>(`/offers/${offerId}`);
  }

  /**
   * Soumettre une offre
   */
  static async submitOffer(request: CreateStorageOfferInput): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.post<ApiResponse<StorageOffer>>('/offers', request);
  }

  /**
   * Modifier une offre
   */
  static async updateOffer(offerId: string, request: Partial<CreateStorageOfferInput>): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.put<ApiResponse<StorageOffer>>(`/offers/${offerId}`, request);
  }

  /**
   * Retirer une offre
   */
  static async withdrawOffer(offerId: string, reason?: string): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.post<ApiResponse<StorageOffer>>(`/offers/${offerId}/withdraw`, { reason });
  }

  /**
   * Mettre une offre en shortlist
   */
  static async shortlistOffer(offerId: string): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.post<ApiResponse<StorageOffer>>(`/offers/${offerId}/shortlist`);
  }

  /**
   * Accepter une offre
   */
  static async acceptOffer(offerId: string): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.post<ApiResponse<StorageOffer>>(`/offers/${offerId}/accept`);
  }

  /**
   * Rejeter une offre
   */
  static async rejectOffer(offerId: string, reason?: string): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.post<ApiResponse<StorageOffer>>(`/offers/${offerId}/reject`, { reason });
  }

  /**
   * Faire une contre-offre
   */
  static async counterOffer(offerId: string, request: CounterOfferRequest): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.post<ApiResponse<StorageOffer>>(`/offers/${offerId}/counter`, request);
  }

  /**
   * Répondre à une contre-offre
   */
  static async respondToCounter(offerId: string, accept: boolean, updatedOffer?: any): Promise<ApiResponse<StorageOffer>> {
    return await storageApi.post<ApiResponse<StorageOffer>>(`/offers/${offerId}/respond-counter`, { accept, updatedOffer });
  }

  // ========== CAPACITÉS / SITES ==========

  /**
   * Obtenir les sites disponibles
   */
  static async getSites(params?: {
    region?: string;
    storageType?: StorageType;
    minCapacity?: number;
    adrAuthorized?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<LogisticianSite>> {
    return await storageApi.get<PaginatedResponse<LogisticianSite>>('/capacity/sites', params);
  }

  /**
   * Obtenir les sites à proximité
   */
  static async getNearbySites(lat: number, lng: number, radius?: number, params?: {
    storageType?: StorageType;
    minCapacity?: number;
  }): Promise<ApiResponse<LogisticianSite[]>> {
    return await storageApi.get<ApiResponse<LogisticianSite[]>>('/capacity/sites/nearby', { lat, lng, radius, ...params });
  }

  /**
   * Obtenir mes sites
   */
  static async getMySites(): Promise<ApiResponse<LogisticianSite[]>> {
    return await storageApi.get<ApiResponse<LogisticianSite[]>>('/capacity/my-sites');
  }

  /**
   * Obtenir un site par ID
   */
  static async getSiteById(siteId: string): Promise<ApiResponse<LogisticianSite>> {
    return await storageApi.get<ApiResponse<LogisticianSite>>(`/capacity/sites/${siteId}`);
  }

  /**
   * Créer un site
   */
  static async createSite(request: CreateLogisticianSiteInput): Promise<ApiResponse<LogisticianSite>> {
    return await storageApi.post<ApiResponse<LogisticianSite>>('/capacity/sites', request);
  }

  /**
   * Modifier un site
   */
  static async updateSite(siteId: string, request: UpdateSiteRequest): Promise<ApiResponse<LogisticianSite>> {
    return await storageApi.put<ApiResponse<LogisticianSite>>(`/capacity/sites/${siteId}`, request);
  }

  /**
   * Mise à jour rapide de la capacité
   */
  static async updateSiteCapacity(siteId: string, availableQuantity?: number, reservedQuantity?: number): Promise<ApiResponse<any>> {
    return await storageApi.patch<ApiResponse<any>>(`/capacity/sites/${siteId}/capacity`, { availableQuantity, reservedQuantity });
  }

  /**
   * Désactiver un site
   */
  static async deleteSite(siteId: string): Promise<ApiResponse<void>> {
    return await storageApi.delete<ApiResponse<void>>(`/capacity/sites/${siteId}`);
  }

  /**
   * Obtenir les statistiques de capacité
   */
  static async getCapacityStats(): Promise<ApiResponse<any>> {
    return await storageApi.get<ApiResponse<any>>('/capacity/stats');
  }

  /**
   * Obtenir les régions disponibles
   */
  static async getRegions(): Promise<ApiResponse<any[]>> {
    return await storageApi.get<ApiResponse<any[]>>('/capacity/regions');
  }

  // ========== CONTRATS ==========

  /**
   * Obtenir la liste des contrats
   */
  static async getContracts(params?: {
    status?: StorageContractStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StorageContract>> {
    return await storageApi.get<PaginatedResponse<StorageContract>>('/contracts', params);
  }

  /**
   * Obtenir les contrats actifs
   */
  static async getActiveContracts(): Promise<ApiResponse<StorageContract[]>> {
    return await storageApi.get<ApiResponse<StorageContract[]>>('/contracts/active');
  }

  /**
   * Obtenir un contrat par ID
   */
  static async getContractById(contractId: string): Promise<ApiResponse<StorageContract>> {
    return await storageApi.get<ApiResponse<StorageContract>>(`/contracts/${contractId}`);
  }

  /**
   * Créer un contrat depuis une offre
   */
  static async createContractFromOffer(offerId: string, terms?: any): Promise<ApiResponse<StorageContract>> {
    return await storageApi.post<ApiResponse<StorageContract>>('/contracts/from-offer', { offerId, terms });
  }

  /**
   * Créer un contrat manuellement
   */
  static async createContract(request: any): Promise<ApiResponse<StorageContract>> {
    return await storageApi.post<ApiResponse<StorageContract>>('/contracts', request);
  }

  /**
   * Modifier un contrat (brouillon)
   */
  static async updateContract(contractId: string, request: any): Promise<ApiResponse<StorageContract>> {
    return await storageApi.put<ApiResponse<StorageContract>>(`/contracts/${contractId}`, request);
  }

  /**
   * Envoyer pour signature
   */
  static async sendContractForSignature(contractId: string): Promise<ApiResponse<StorageContract>> {
    return await storageApi.post<ApiResponse<StorageContract>>(`/contracts/${contractId}/send-for-signature`);
  }

  /**
   * Signer un contrat
   */
  static async signContract(contractId: string): Promise<ApiResponse<StorageContract>> {
    return await storageApi.post<ApiResponse<StorageContract>>(`/contracts/${contractId}/sign`);
  }

  /**
   * Suspendre un contrat
   */
  static async suspendContract(contractId: string, reason?: string): Promise<ApiResponse<StorageContract>> {
    return await storageApi.post<ApiResponse<StorageContract>>(`/contracts/${contractId}/suspend`, { reason });
  }

  /**
   * Résilier un contrat
   */
  static async terminateContract(contractId: string, reason?: string, effectiveDate?: string): Promise<ApiResponse<StorageContract>> {
    return await storageApi.post<ApiResponse<StorageContract>>(`/contracts/${contractId}/terminate`, { reason, effectiveDate });
  }

  /**
   * Créer un avenant
   */
  static async createAmendment(contractId: string, description: string, changes: any, effectiveDate: string): Promise<ApiResponse<StorageContract>> {
    return await storageApi.post<ApiResponse<StorageContract>>(`/contracts/${contractId}/amendment`, { description, changes, effectiveDate });
  }

  /**
   * Obtenir les factures d'un contrat
   */
  static async getContractInvoices(contractId: string): Promise<ApiResponse<any>> {
    return await storageApi.get<ApiResponse<any>>(`/contracts/${contractId}/invoices`);
  }

  /**
   * Statistiques des contrats
   */
  static async getContractStats(): Promise<ApiResponse<any>> {
    return await storageApi.get<ApiResponse<any>>('/contracts/stats/summary');
  }

  // ========== ABONNEMENTS ==========

  /**
   * Obtenir mon abonnement
   */
  static async getMySubscription(): Promise<ApiResponse<LogisticianSubscription>> {
    return await storageApi.get<ApiResponse<LogisticianSubscription>>('/subscriptions/my');
  }

  /**
   * Obtenir les plans disponibles
   */
  static async getPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    return await storageApi.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans');
  }

  /**
   * S'inscrire comme logisticien
   */
  static async register(logisticianName: string, primaryContact: any): Promise<ApiResponse<LogisticianSubscription>> {
    return await storageApi.post<ApiResponse<LogisticianSubscription>>('/subscriptions/register', { logisticianName, primaryContact });
  }

  /**
   * Passer à un tier supérieur
   */
  static async upgrade(tier: 'subscriber' | 'premium', billingCycle?: 'monthly' | 'annually', paymentMethod?: any): Promise<ApiResponse<LogisticianSubscription>> {
    return await storageApi.post<ApiResponse<LogisticianSubscription>>('/subscriptions/upgrade', { tier, billingCycle, paymentMethod });
  }

  /**
   * Rétrograder
   */
  static async downgrade(targetTier?: string, reason?: string): Promise<ApiResponse<LogisticianSubscription>> {
    return await storageApi.post<ApiResponse<LogisticianSubscription>>('/subscriptions/downgrade', { targetTier, reason });
  }

  /**
   * Annuler l'abonnement
   */
  static async cancelSubscription(reason?: string): Promise<ApiResponse<LogisticianSubscription>> {
    return await storageApi.post<ApiResponse<LogisticianSubscription>>('/subscriptions/cancel', { reason });
  }

  /**
   * Obtenir l'usage actuel
   */
  static async getUsage(): Promise<ApiResponse<SubscriptionUsage>> {
    return await storageApi.get<ApiResponse<SubscriptionUsage>>('/subscriptions/usage');
  }

  /**
   * Démarrer un essai gratuit
   */
  static async startTrial(): Promise<ApiResponse<LogisticianSubscription>> {
    return await storageApi.post<ApiResponse<LogisticianSubscription>>('/subscriptions/start-trial');
  }

  /**
   * Obtenir les métriques
   */
  static async getMetrics(): Promise<ApiResponse<any>> {
    return await storageApi.get<ApiResponse<any>>('/subscriptions/metrics');
  }

  // ========== IA ==========

  /**
   * Scorer une offre
   */
  static async scoreOffer(offerId: string): Promise<ApiResponse<any>> {
    return await storageApi.post<ApiResponse<any>>('/ai/score-offer', { offerId });
  }

  /**
   * Classer les offres pour un besoin
   */
  static async rankOffers(needId: string, weights?: any): Promise<ApiResponse<OfferRanking>> {
    return await storageApi.post<ApiResponse<OfferRanking>>('/ai/rank-offers', { needId, weights });
  }

  /**
   * Générer un RFP
   */
  static async generateRFP(needId: string, format?: 'markdown' | 'pdf'): Promise<ApiResponse<RFPDocument>> {
    return await storageApi.post<ApiResponse<RFPDocument>>('/ai/generate-rfp', { needId, format });
  }

  /**
   * Analyser une réponse
   */
  static async analyzeResponse(offerId: string): Promise<ApiResponse<any>> {
    return await storageApi.post<ApiResponse<any>>('/ai/analyze-response', { offerId });
  }

  /**
   * Recommander des logisticiens
   */
  static async recommendLogisticians(needId: string, maxResults?: number): Promise<ApiResponse<any[]>> {
    return await storageApi.post<ApiResponse<any[]>>('/ai/recommend-logisticians', { needId, maxResults });
  }

  /**
   * Obtenir les insights marché
   */
  static async getMarketInsights(region?: string, storageType?: StorageType): Promise<ApiResponse<MarketInsights>> {
    return await storageApi.get<ApiResponse<MarketInsights>>('/ai/market-insights', { region, storageType });
  }

  // ========== HELPERS ==========

  /**
   * Formater le prix
   */
  static formatPrice(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Formater la capacité
   */
  static formatCapacity(quantity: number, unit: VolumeUnit): string {
    const unitLabels: Record<VolumeUnit, string> = {
      sqm: 'm²',
      pallets: 'palettes',
      linear_meters: 'ml',
      cbm: 'm³',
    };
    return `${quantity.toLocaleString('fr-FR')} ${unitLabels[unit] || unit}`;
  }

  /**
   * Obtenir la couleur d'un statut de besoin
   */
  static getNeedStatusColor(status: NeedStatus): string {
    const colors: Record<NeedStatus, string> = {
      DRAFT: '#9ca3af',
      PUBLISHED: '#3b82f6',
      CLOSED: '#6b7280',
      ATTRIBUTED: '#10b981',
      CANCELLED: '#ef4444',
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Obtenir le label d'un statut de besoin
   */
  static getNeedStatusLabel(status: NeedStatus): string {
    const labels: Record<NeedStatus, string> = {
      DRAFT: 'Brouillon',
      PUBLISHED: 'Publié',
      CLOSED: 'Clôturé',
      ATTRIBUTED: 'Attribué',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  }

  /**
   * Obtenir la couleur d'un statut d'offre
   */
  static getOfferStatusColor(status: StorageOfferStatus): string {
    const colors: Record<StorageOfferStatus, string> = {
      SUBMITTED: '#3b82f6',
      UNDER_REVIEW: '#f59e0b',
      SHORTLISTED: '#8b5cf6',
      ACCEPTED: '#10b981',
      REJECTED: '#ef4444',
      WITHDRAWN: '#9ca3af',
      EXPIRED: '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Obtenir le label d'un statut d'offre
   */
  static getOfferStatusLabel(status: StorageOfferStatus): string {
    const labels: Record<StorageOfferStatus, string> = {
      SUBMITTED: 'Soumise',
      UNDER_REVIEW: 'En examen',
      SHORTLISTED: 'Présélectionnée',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Rejetée',
      WITHDRAWN: 'Retirée',
      EXPIRED: 'Expirée',
    };
    return labels[status] || status;
  }

  /**
   * Obtenir le label d'un type de stockage
   */
  static getStorageTypeLabel(type: StorageType): string {
    const labels: Record<StorageType, string> = {
      long_term: 'Stockage long terme',
      temporary: 'Stockage temporaire',
      picking: 'Picking / Préparation',
      cross_dock: 'Cross-dock',
      customs: 'Zone sous douane',
      temperature: 'Température contrôlée',
    };
    return labels[type] || type;
  }

  /**
   * Obtenir l'icône d'un type de stockage
   */
  static getStorageTypeIcon(type: StorageType): string {
    const icons: Record<StorageType, string> = {
      long_term: '📦',
      temporary: '⏱️',
      picking: '🎯',
      cross_dock: '🔄',
      customs: '🛃',
      temperature: '❄️',
    };
    return icons[type] || '📦';
  }

  /**
   * Obtenir le label d'un tier d'abonnement
   */
  static getSubscriptionTierLabel(tier: 'guest' | 'subscriber' | 'premium'): string {
    const labels = {
      guest: 'Invité (Gratuit)',
      subscriber: 'Abonné',
      premium: 'Premium',
    };
    return labels[tier] || tier;
  }

  /**
   * Calculer le temps restant avant une deadline
   */
  static getTimeRemaining(deadline: string): {
    days: number;
    hours: number;
    expired: boolean;
    formatted: string;
  } {
    const now = new Date().getTime();
    const end = new Date(deadline).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, expired: true, formatted: 'Expiré' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    let formatted = '';
    if (days > 0) {
      formatted = `${days}j ${hours}h`;
    } else {
      formatted = `${hours}h`;
    }

    return { days, hours, expired: false, formatted };
  }
}

export default StorageMarketService;
