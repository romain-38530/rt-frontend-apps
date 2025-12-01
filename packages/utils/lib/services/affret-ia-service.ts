/**
 * Service API pour Affret.IA
 * Recherche carriers, gestion offres, négociation, enchères
 */

import { createApiClient } from '../api-client';
import type {
  CarrierSearchRequest,
  CarrierSearchResult,
  AffretCarrier,
  AffretOffer,
  Negotiation,
  Bid,
  SendOfferRequestRequest,
  AcceptOfferRequest,
  CounterOfferRequest,
  CreateBidRequest,
  PlaceBidRequest,
  AffretStats,
  SearchHistory,
  AffretOfferStatus,
  BidStatus,
} from '@rt/contracts';

// Client API pour Affret.IA
const affretApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_AFFRET_API_URL || 'http://localhost:3010/api/v1',
  timeout: 30000,
  retries: 3,
});

export class AffretIAService {
  // ========== RECHERCHE CARRIERS ==========

  /**
   * Rechercher des transporteurs
   */
  static async searchCarriers(request: CarrierSearchRequest): Promise<CarrierSearchResult> {
    return await affretApi.post<CarrierSearchResult>('/search/carriers', request);
  }

  /**
   * Obtenir les détails d'un transporteur
   */
  static async getCarrierDetails(carrierId: string): Promise<AffretCarrier> {
    return await affretApi.get<AffretCarrier>(`/carriers/${carrierId}`);
  }

  /**
   * Obtenir les transporteurs favoris
   */
  static async getFavoriteCarriers(userId?: string): Promise<AffretCarrier[]> {
    return await affretApi.get<AffretCarrier[]>('/carriers/favorites', { userId });
  }

  /**
   * Ajouter un transporteur aux favoris
   */
  static async addToFavorites(carrierId: string): Promise<void> {
    return await affretApi.post(`/carriers/${carrierId}/favorite`);
  }

  /**
   * Retirer un transporteur des favoris
   */
  static async removeFromFavorites(carrierId: string): Promise<void> {
    return await affretApi.delete(`/carriers/${carrierId}/favorite`);
  }

  // ========== OFFRES ==========

  /**
   * Envoyer une demande d'offre à un transporteur
   */
  static async sendOfferRequest(request: SendOfferRequestRequest): Promise<AffretOffer> {
    return await affretApi.post<AffretOffer>('/offers/request', request);
  }

  /**
   * Envoyer une demande d'offre à plusieurs transporteurs
   */
  static async sendBulkOfferRequests(
    searchId: string,
    carrierIds: string[],
    orderId?: string
  ): Promise<AffretOffer[]> {
    return await affretApi.post<AffretOffer[]>('/offers/request/bulk', {
      searchId,
      carrierIds,
      orderId,
    });
  }

  /**
   * Obtenir toutes les offres
   */
  static async getOffers(orderId?: string, status?: AffretOfferStatus): Promise<AffretOffer[]> {
    return await affretApi.get<AffretOffer[]>('/offers', { orderId, status });
  }

  /**
   * Obtenir une offre par ID
   */
  static async getOfferById(offerId: string): Promise<AffretOffer> {
    return await affretApi.get<AffretOffer>(`/offers/${offerId}`);
  }

  /**
   * Accepter une offre
   */
  static async acceptOffer(request: AcceptOfferRequest): Promise<AffretOffer> {
    return await affretApi.post<AffretOffer>(`/offers/${request.offerId}/accept`, request);
  }

  /**
   * Rejeter une offre
   */
  static async rejectOffer(offerId: string, reason?: string): Promise<AffretOffer> {
    return await affretApi.post<AffretOffer>(`/offers/${offerId}/reject`, { reason });
  }

  /**
   * Faire une contre-offre
   */
  static async counterOffer(request: CounterOfferRequest): Promise<Negotiation> {
    return await affretApi.post<Negotiation>(`/offers/${request.offerId}/counter`, request);
  }

  // ========== NÉGOCIATION ==========

  /**
   * Obtenir une négociation
   */
  static async getNegotiation(negotiationId: string): Promise<Negotiation> {
    return await affretApi.get<Negotiation>(`/negotiations/${negotiationId}`);
  }

  /**
   * Obtenir les négociations d'une offre
   */
  static async getNegotiationsByOffer(offerId: string): Promise<Negotiation[]> {
    return await affretApi.get<Negotiation[]>(`/negotiations/offers/${offerId}`);
  }

  /**
   * Envoyer un message dans une négociation
   */
  static async sendNegotiationMessage(
    negotiationId: string,
    message: string,
    attachments?: string[]
  ): Promise<Negotiation> {
    return await affretApi.post<Negotiation>(`/negotiations/${negotiationId}/messages`, {
      message,
      attachments,
    });
  }

  /**
   * Accepter l'offre actuelle dans une négociation
   */
  static async acceptNegotiationOffer(
    negotiationId: string,
    offerId: string
  ): Promise<Negotiation> {
    return await affretApi.post<Negotiation>(
      `/negotiations/${negotiationId}/offers/${offerId}/accept`
    );
  }

  /**
   * Annuler une négociation
   */
  static async cancelNegotiation(negotiationId: string, reason?: string): Promise<Negotiation> {
    return await affretApi.post<Negotiation>(`/negotiations/${negotiationId}/cancel`, {
      reason,
    });
  }

  // ========== ENCHÈRES (BIDDING) ==========

  /**
   * Créer une enchère
   */
  static async createBid(request: CreateBidRequest): Promise<Bid> {
    return await affretApi.post<Bid>('/bids', request);
  }

  /**
   * Obtenir une enchère
   */
  static async getBid(bidId: string): Promise<Bid> {
    return await affretApi.get<Bid>(`/bids/${bidId}`);
  }

  /**
   * Obtenir toutes les enchères
   */
  static async getBids(orderId?: string, status?: BidStatus): Promise<Bid[]> {
    return await affretApi.get<Bid[]>('/bids', { orderId, status });
  }

  /**
   * Publier une enchère
   */
  static async publishBid(bidId: string): Promise<Bid> {
    return await affretApi.post<Bid>(`/bids/${bidId}/publish`);
  }

  /**
   * Placer une offre dans une enchère
   */
  static async placeBid(request: PlaceBidRequest): Promise<Bid> {
    return await affretApi.post<Bid>(`/bids/${request.bidId}/place`, request);
  }

  /**
   * Clôturer une enchère
   */
  static async closeBid(bidId: string): Promise<Bid> {
    return await affretApi.post<Bid>(`/bids/${bidId}/close`);
  }

  /**
   * Attribuer une enchère au gagnant
   */
  static async awardBid(bidId: string, bidOfferId: string): Promise<Bid> {
    return await affretApi.post<Bid>(`/bids/${bidId}/award`, { bidOfferId });
  }

  /**
   * Annuler une enchère
   */
  static async cancelBid(bidId: string, reason?: string): Promise<Bid> {
    return await affretApi.post<Bid>(`/bids/${bidId}/cancel`, { reason });
  }

  // ========== STATISTIQUES ==========

  /**
   * Obtenir les statistiques Affret.IA
   */
  static async getStats(): Promise<AffretStats> {
    return await affretApi.get<AffretStats>('/stats');
  }

  /**
   * Obtenir l'historique de recherches
   */
  static async getSearchHistory(limit: number = 20): Promise<SearchHistory[]> {
    return await affretApi.get<SearchHistory[]>('/search/history', { limit });
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
   * Obtenir la couleur d'un statut d'offre
   */
  static getAffretOfferStatusColor(status: AffretOfferStatus): string {
    const colors: Record<AffretOfferStatus, string> = {
      pending: '#f59e0b',
      submitted: '#3b82f6',
      accepted: '#10b981',
      rejected: '#ef4444',
      withdrawn: '#9ca3af',
      expired: '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Obtenir le label d'un statut d'offre
   */
  static getAffretOfferStatusLabel(status: AffretOfferStatus): string {
    const labels: Record<AffretOfferStatus, string> = {
      pending: 'En attente',
      submitted: 'Soumise',
      accepted: 'Acceptée',
      rejected: 'Rejetée',
      withdrawn: 'Retirée',
      expired: 'Expirée',
    };
    return labels[status] || status;
  }

  /**
   * Obtenir la couleur d'un statut d'enchère
   */
  static getBidStatusColor(status: BidStatus): string {
    const colors: Record<BidStatus, string> = {
      draft: '#9ca3af',
      published: '#3b82f6',
      active: '#10b981',
      closed: '#6b7280',
      awarded: '#8b5cf6',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Obtenir le label d'un statut d'enchère
   */
  static getBidStatusLabel(status: BidStatus): string {
    const labels: Record<BidStatus, string> = {
      draft: 'Brouillon',
      published: 'Publiée',
      active: 'En cours',
      closed: 'Clôturée',
      awarded: 'Attribuée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  }

  /**
   * Calculer l'économie réalisée
   */
  static calculateSavings(originalPrice: number, finalPrice: number): {
    amount: number;
    percentage: number;
  } {
    const amount = originalPrice - finalPrice;
    const percentage = (amount / originalPrice) * 100;
    return { amount, percentage };
  }

  /**
   * Vérifier si une offre est expirée
   */
  static isOfferExpired(offer: AffretOffer): boolean {
    return new Date(offer.price.validUntil) < new Date();
  }

  /**
   * Vérifier si une enchère est active
   */
  static isBidActive(bid: Bid): boolean {
    const now = new Date();
    const starts = new Date(bid.startsAt);
    const ends = new Date(bid.extendedUntil || bid.endsAt);
    return bid.status === 'active' && now >= starts && now <= ends;
  }

  /**
   * Obtenir le temps restant d'une enchère
   */
  static getRemainingTime(endsAt: string): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number; // En millisecondes
  } {
    const now = new Date().getTime();
    const end = new Date(endsAt).getTime();
    const total = Math.max(0, end - now);

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total };
  }

  /**
   * Formater le temps restant
   */
  static formatRemainingTime(endsAt: string): string {
    const { days, hours, minutes, total } = this.getRemainingTime(endsAt);

    if (total === 0) return 'Terminé';
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  }
}

export default AffretIAService;
