// Client API pour le service Storage Market
// Module d'administration du marché de stockage - Admin backend

const STORAGE_API_URL = process.env.NEXT_PUBLIC_STORAGE_MARKET_API_URL || 'https://d1ea8wbaf6ws9i.cloudfront.net';

// Helper pour les requêtes API
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_jwt') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${STORAGE_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// TYPES
// ============================================

export interface StorageNeed {
  id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CONTRACTED' | 'COMPLETED' | 'CANCELLED';
  ownerOrgId: string;
  storageType: 'long_term' | 'short_term' | 'seasonal' | 'project';
  volume: {
    type: 'palettes' | 'sqm' | 'cbm';
    quantity: number;
  };
  duration: {
    startDate: string;
    endDate?: string;
    flexible?: boolean;
    renewable?: boolean;
  };
  location: {
    region?: string;
    department?: string;
    city?: string;
    maxRadius?: number;
    lat?: number;
    lon?: number;
  };
  constraints?: {
    temperature?: string;
    adrAuthorized?: boolean;
    securityLevel?: string;
    certifications?: string[];
  };
  budget?: {
    indicative?: number;
    currency?: string;
    period?: string;
  };
  deadline?: string;
  publicationType: 'GLOBAL' | 'REFERRED_ONLY' | 'MIXED';
  createdAt: string;
  updatedAt?: string;
  offersCount?: number;
}

export interface StorageOffer {
  id: string;
  needId: string;
  logisticianId: string;
  logisticianName: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  siteId: string;
  siteName: string;
  pricing: {
    totalPrice?: number;
    currency: string;
  };
  createdAt: string;
}

export interface StorageContract {
  id: string;
  needId: string;
  offerId: string;
  industrialId: string;
  logisticianId: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'COMPLETED' | 'TERMINATED';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LogisticianSubscription {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: string;
  approvedAt?: string;
}

export interface StorageStats {
  totalNeeds: number;
  totalOffers: number;
  totalContracts: number;
  totalSites: number;
  activeContracts: number;
  needsByStatus: Record<string, number>;
  contractsByStatus: Record<string, number>;
  averageOffersPerNeed: number;
}

// ============================================
// ADMIN API
// ============================================

export const storageAdminApi = {
  // ========== STATISTICS ==========

  /**
   * Get global statistics for the storage market
   */
  getStats: async (): Promise<StorageStats> => {
    const response = await apiFetch<{ stats: StorageStats }>(
      '/storage-market/admin/stats'
    );
    return response.stats;
  },

  // ========== NEEDS MANAGEMENT ==========

  /**
   * Get all storage needs (admin view)
   */
  getAllNeeds: async (filters?: {
    status?: string;
    ownerOrgId?: string;
  }): Promise<StorageNeed[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.ownerOrgId) params.set('ownerOrgId', filters.ownerOrgId);

    const queryString = params.toString();
    const url = queryString
      ? `/storage-market/needs?${queryString}`
      : '/storage-market/needs';

    const response = await apiFetch<{ items: StorageNeed[] }>(url);
    return response.items;
  },

  /**
   * Get specific need details
   */
  getNeed: async (needId: string): Promise<StorageNeed> => {
    const response = await apiFetch<{ need: StorageNeed }>(
      `/storage-market/needs/${needId}`
    );
    return response.need;
  },

  /**
   * Moderate a need (approve, reject, suspend)
   */
  moderateNeed: async (
    needId: string,
    decision: {
      status: StorageNeed['status'];
      reason?: string;
    }
  ): Promise<StorageNeed> => {
    const response = await apiFetch<{ need: StorageNeed }>(
      `/storage-market/needs/${needId}`,
      {
        method: 'PUT',
        body: JSON.stringify(decision),
      }
    );
    return response.need;
  },

  // ========== LOGISTICIANS MANAGEMENT ==========

  /**
   * Get all logisticians subscriptions
   */
  getLogisticians: async (): Promise<LogisticianSubscription[]> => {
    const response = await apiFetch<{ items: LogisticianSubscription[] }>(
      '/storage-market/admin/logisticians'
    );
    return response.items;
  },

  /**
   * Approve a logistician to participate in the market
   */
  approveLogistician: async (logisticianId: string): Promise<LogisticianSubscription> => {
    const response = await apiFetch<{ subscription: LogisticianSubscription }>(
      `/storage-market/admin/logisticians/${logisticianId}/approve`,
      {
        method: 'POST',
      }
    );
    return response.subscription;
  },

  /**
   * Reject a logistician subscription
   */
  rejectLogistician: async (
    logisticianId: string,
    reason: string
  ): Promise<LogisticianSubscription> => {
    const response = await apiFetch<{ subscription: LogisticianSubscription }>(
      `/storage-market/admin/logisticians/${logisticianId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return response.subscription;
  },

  /**
   * Suspend a logistician (temporarily remove from market)
   */
  suspendLogistician: async (
    logisticianId: string,
    reason: string
  ): Promise<LogisticianSubscription> => {
    const response = await apiFetch<{ subscription: LogisticianSubscription }>(
      `/storage-market/admin/logisticians/${logisticianId}/suspend`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return response.subscription;
  },

  // ========== CONTRACTS MANAGEMENT ==========

  /**
   * Get all contracts (admin view)
   */
  getAllContracts: async (filters?: {
    status?: string;
    industrialId?: string;
    logisticianId?: string;
  }): Promise<StorageContract[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.industrialId) params.set('industrialId', filters.industrialId);
    if (filters?.logisticianId) params.set('logisticianId', filters.logisticianId);

    const queryString = params.toString();
    const url = queryString
      ? `/storage-market/contracts?${queryString}`
      : '/storage-market/contracts';

    const response = await apiFetch<{ items: StorageContract[] }>(url);
    return response.items;
  },

  /**
   * Get specific contract details
   */
  getContract: async (contractId: string): Promise<StorageContract> => {
    const response = await apiFetch<{ contract: StorageContract }>(
      `/storage-market/contracts/${contractId}`
    );
    return response.contract;
  },

  /**
   * Update contract status (for mediation/resolution)
   */
  updateContractStatus: async (
    contractId: string,
    status: StorageContract['status'],
    reason?: string
  ): Promise<StorageContract> => {
    const response = await apiFetch<{ contract: StorageContract }>(
      `/storage-market/contracts/${contractId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      }
    );
    return response.contract;
  },

  // ========== OFFERS MANAGEMENT ==========

  /**
   * Get all offers for a specific need
   */
  getOffersForNeed: async (needId: string): Promise<StorageOffer[]> => {
    const response = await apiFetch<{ items: StorageOffer[] }>(
      `/storage-market/offers/${needId}`
    );
    return response.items;
  },

  // ========== MONITORING & ANALYTICS ==========

  /**
   * Get marketplace health metrics
   */
  getHealthMetrics: async (): Promise<{
    averageResponseTime: number;
    successRate: number;
    activeUsers: number;
    totalRevenue: number;
  }> => {
    // This would be a dedicated admin endpoint
    // For now, we derive from stats
    const stats = await storageAdminApi.getStats();

    return {
      averageResponseTime: 0, // To be calculated
      successRate: stats.activeContracts / stats.totalContracts || 0,
      activeUsers: 0, // To be calculated
      totalRevenue: 0, // To be calculated
    };
  },

  // ========== EXPORT & REPORTING ==========

  /**
   * Export data to CSV
   */
  exportToCSV: (data: any[], filename: string): void => {
    if (typeof window === 'undefined') return;

    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  },

  /**
   * Generate monthly report
   */
  generateMonthlyReport: async (year: number, month: number): Promise<{
    needs: number;
    offers: number;
    contracts: number;
    revenue: number;
  }> => {
    // This would need a dedicated endpoint with date filtering
    throw new Error('À implémenter - endpoint avec filtres de date requis');
  },
};
