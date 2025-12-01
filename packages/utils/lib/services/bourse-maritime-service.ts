/**
 * Service Bourse Maritime pour SYMPHONI.A
 * Client API pour le marketplace fret maritime
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BOURSE_MARITIME_API_URL || 'http://localhost:3019/api/v1';

export interface BourseMaritimeServiceConfig {
  baseUrl?: string;
  token?: string;
}

export class BourseMaritimeService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(config?: BourseMaritimeServiceConfig) {
    this.baseUrl = config?.baseUrl || API_BASE_URL;
    this.token = config?.token || null;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ FREIGHT REQUESTS ============

  async createFreightRequest(data: {
    origin: { port: string; country: string; address?: string };
    destination: { port: string; country: string; address?: string };
    cargo: {
      type: string;
      description: string;
      weight: number;
      volume?: number;
      containerType?: string;
      containerCount?: number;
      hazmat?: boolean;
      specialHandling?: string[];
    };
    schedule: {
      loadingDate: Date;
      deliveryDeadline: Date;
      flexibility?: number;
    };
    requirements: {
      incoterm: string;
      insurance: boolean;
      customsClearance: boolean;
      documentation?: string[];
    };
    pricing?: {
      targetPrice?: number;
      currency?: string;
      paymentTerms?: string;
    };
  }) {
    return this.request('/freight-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFreightRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    origin?: string;
    destination?: string;
    cargoType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.origin) query.set('origin', params.origin);
    if (params?.destination) query.set('destination', params.destination);
    if (params?.cargoType) query.set('cargoType', params.cargoType);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom.toISOString());
    if (params?.dateTo) query.set('dateTo', params.dateTo.toISOString());
    return this.request(`/freight-requests?${query}`);
  }

  async getFreightRequest(requestId: string) {
    return this.request(`/freight-requests/${requestId}`);
  }

  async updateFreightRequest(requestId: string, data: Record<string, unknown>) {
    return this.request(`/freight-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFreightRequest(requestId: string) {
    return this.request(`/freight-requests/${requestId}`, { method: 'DELETE' });
  }

  async publishFreightRequest(requestId: string, closingDate?: Date) {
    return this.request(`/freight-requests/${requestId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ closingDate }),
    });
  }

  async closeFreightRequest(requestId: string) {
    return this.request(`/freight-requests/${requestId}/close`, { method: 'POST' });
  }

  // ============ BIDS ============

  async submitBid(freightRequestId: string, data: {
    pricing: {
      amount: number;
      currency: string;
      breakdown?: {
        freight?: number;
        bunker?: number;
        thc?: number;
        documentation?: number;
        insurance?: number;
        other?: number;
      };
    };
    vessel?: {
      name: string;
      imo: string;
      type: string;
      flag: string;
      capacity: number;
      yearBuilt: number;
    };
    schedule: {
      estimatedDeparture: Date;
      estimatedArrival: Date;
    };
    terms: {
      validity: Date;
      paymentTerms: string;
      conditions?: string[];
    };
  }) {
    return this.request(`/freight-requests/${freightRequestId}/bids`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFreightRequestBids(freightRequestId: string) {
    return this.request(`/freight-requests/${freightRequestId}/bids`);
  }

  async getMyBids(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    return this.request(`/bids/my?${query}`);
  }

  async updateBid(bidId: string, data: Record<string, unknown>) {
    return this.request(`/bids/${bidId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async withdrawBid(bidId: string) {
    return this.request(`/bids/${bidId}`, { method: 'DELETE' });
  }

  async acceptBid(bidId: string) {
    return this.request(`/bids/${bidId}/accept`, { method: 'POST' });
  }

  async rejectBid(bidId: string, reason?: string) {
    return this.request(`/bids/${bidId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============ CONTRACTS ============

  async getContracts(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    return this.request(`/contracts?${query}`);
  }

  async getContract(contractId: string) {
    return this.request(`/contracts/${contractId}`);
  }

  async signContract(contractId: string, signatureData: {
    signedBy: string;
    signature: string;
  }) {
    return this.request(`/contracts/${contractId}/sign`, {
      method: 'POST',
      body: JSON.stringify(signatureData),
    });
  }

  async getContractDocuments(contractId: string) {
    return this.request(`/contracts/${contractId}/documents`);
  }

  async uploadContractDocument(contractId: string, data: {
    name: string;
    type: string;
    content: string; // base64
  }) {
    return this.request(`/contracts/${contractId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ CARRIERS ============

  async getCarriers(params?: {
    page?: number;
    limit?: number;
    verified?: boolean;
    minRating?: number;
    vesselType?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.verified !== undefined) query.set('verified', String(params.verified));
    if (params?.minRating) query.set('minRating', String(params.minRating));
    if (params?.vesselType) query.set('vesselType', params.vesselType);
    return this.request(`/carriers?${query}`);
  }

  async getCarrier(carrierId: string) {
    return this.request(`/carriers/${carrierId}`);
  }

  async getCarrierRatings(carrierId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.request(`/carriers/${carrierId}/ratings?${query}`);
  }

  async rateCarrier(carrierId: string, data: {
    contractId: string;
    overall: number;
    reliability: number;
    communication: number;
    pricing: number;
    comment?: string;
  }) {
    return this.request(`/carriers/${carrierId}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async registerAsCarrier(data: {
    company: {
      name: string;
      registrationNumber: string;
      country: string;
      address: string;
    };
    fleet: {
      vesselCount: number;
      totalCapacity: number;
      vesselTypes: string[];
    };
    certifications?: {
      type: string;
      number: string;
      issuedBy: string;
      validUntil: Date;
    }[];
    routes?: {
      origin: string;
      destination: string;
      frequency: string;
    }[];
  }) {
    return this.request('/carriers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ SEARCH & MATCHING ============

  async searchRoutes(params: {
    origin?: string;
    destination?: string;
    cargoType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    maxPrice?: number;
  }) {
    const query = new URLSearchParams();
    if (params.origin) query.set('origin', params.origin);
    if (params.destination) query.set('destination', params.destination);
    if (params.cargoType) query.set('cargoType', params.cargoType);
    if (params.dateFrom) query.set('dateFrom', params.dateFrom.toISOString());
    if (params.dateTo) query.set('dateTo', params.dateTo.toISOString());
    if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
    return this.request(`/search/routes?${query}`);
  }

  async searchCarriers(params: {
    origin?: string;
    destination?: string;
    minRating?: number;
    vesselTypes?: string[];
    verified?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params.origin) query.set('origin', params.origin);
    if (params.destination) query.set('destination', params.destination);
    if (params.minRating) query.set('minRating', String(params.minRating));
    if (params.vesselTypes) query.set('vesselTypes', params.vesselTypes.join(','));
    if (params.verified !== undefined) query.set('verified', String(params.verified));
    return this.request(`/search/carriers?${query}`);
  }

  async matchFreight(freightRequestId: string) {
    return this.request(`/match/freight`, {
      method: 'POST',
      body: JSON.stringify({ freightRequestId }),
    });
  }

  async getMarketStats() {
    return this.request('/market/stats');
  }

  // ============ ALERTS ============

  async createAlert(data: {
    type: 'route' | 'price' | 'carrier';
    criteria: {
      origins?: string[];
      destinations?: string[];
      cargoTypes?: string[];
      maxPrice?: number;
      carriers?: string[];
    };
    frequency: 'instant' | 'daily' | 'weekly';
  }) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAlerts(params?: { page?: number; limit?: number; active?: boolean }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.active !== undefined) query.set('active', String(params.active));
    return this.request(`/alerts?${query}`);
  }

  async updateAlert(alertId: string, data: Record<string, unknown>) {
    return this.request(`/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAlert(alertId: string) {
    return this.request(`/alerts/${alertId}`, { method: 'DELETE' });
  }

  async toggleAlert(alertId: string, active: boolean) {
    return this.request(`/alerts/${alertId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    });
  }
}

// Singleton instance
let bourseMaritimeServiceInstance: BourseMaritimeService | null = null;

export function getBourseMaritimeService(config?: BourseMaritimeServiceConfig): BourseMaritimeService {
  if (!bourseMaritimeServiceInstance) {
    bourseMaritimeServiceInstance = new BourseMaritimeService(config);
  }
  return bourseMaritimeServiceInstance;
}

export function createBourseMaritimeService(config?: BourseMaritimeServiceConfig): BourseMaritimeService {
  return new BourseMaritimeService(config);
}

export default BourseMaritimeService;
