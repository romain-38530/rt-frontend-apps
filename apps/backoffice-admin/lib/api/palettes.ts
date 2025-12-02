// Client API pour le service Palette
// Module d'administration des palettes - Admin backend

const PALETTE_API_URL = process.env.NEXT_PUBLIC_PALETTE_API_URL || 'https://d2o4ng8nutcmou.cloudfront.net';

// Helper pour les requêtes API
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_jwt') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${PALETTE_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Types TypeScript
export interface PalletCheque {
  id: string;
  orderId: string;
  fromCompanyId: string;
  toSiteId: string;
  quantity: number;
  palletType: string;
  transporterPlate: string;
  qrCode: string;
  status: 'EMIS' | 'DEPOSE' | 'RECU' | 'LITIGE';
  createdAt: string;
  depositedAt: string | null;
  receivedAt: string | null;
  signatures: {
    transporter: string | null;
    receiver: string | null;
  };
  photos: Array<{ type: string; url: string; at: string }>;
  geolocations: {
    deposit: { lat: number; lng: number } | null;
    receipt: { lat: number; lng: number } | null;
  };
  cryptoSignature: string;
  quantityReceived?: number;
}

export interface PalletSite {
  id: string;
  companyId: string;
  name: string;
  address: string;
  gps: { lat: number; lng: number };
  quotaDailyMax: number;
  openingHours: { start: string; end: string };
  availableDays: number[];
  priority: 'INTERNAL' | 'NETWORK' | 'EXTERNAL';
}

export interface PalletSiteQuota {
  siteId: string;
  dailyMax: number;
  consumed: number;
  openingHours: { start: string; end: string };
  availableDays: number[];
  priority: string;
  lastReset: string;
}

export interface PalletLedger {
  companyId: string;
  balance: number;
  history: Array<{
    date: string;
    delta: number;
    reason: string;
    chequeId: string | null;
    newBalance: number;
  }>;
}

export interface PalletDispute {
  id: string;
  chequeId: string;
  claimantId: string;
  reason: string;
  photos: string[];
  comments: string;
  status: 'OPEN' | 'PROPOSED' | 'RESOLVED' | 'ESCALATED';
  createdAt: string;
  resolution: string | null;
  proposedSolution: string | null;
  validatedBy: string[];
}

export interface Company {
  id: string;
  name: string;
  type: 'INDUSTRIEL' | 'TRANSPORTEUR' | 'LOGISTICIEN';
  email: string;
  subscribed: boolean;
}

// API Client
export const palettesAdminApi = {
  // ========== CHÈQUES ==========

  // Liste tous les chèques (admin view)
  getAllCheques: async (): Promise<PalletCheque[]> => {
    // Le service palette n'a pas d'endpoint pour lister tous les chèques
    // On va utiliser une approche via le store côté client
    // En production, il faudrait ajouter un endpoint GET /palette/admin/cheques
    throw new Error('Endpoint non disponible - À implémenter dans le service palette');
  },

  // Récupérer un chèque par ID
  getCheque: async (chequeId: string): Promise<PalletCheque> => {
    const response = await apiFetch<{ cheque: PalletCheque }>(`/palette/cheques/${chequeId}`);
    return response.cheque;
  },

  // ========== LEDGERS ==========

  // Liste tous les ledgers (tous les companyId)
  getAllLedgers: async (companyIds: string[]): Promise<PalletLedger[]> => {
    const ledgers = await Promise.all(
      companyIds.map(id => palettesAdminApi.getLedger(id))
    );
    return ledgers;
  },

  // Récupérer le ledger d'une entreprise
  getLedger: async (companyId: string): Promise<PalletLedger> => {
    const response = await apiFetch<{ ledger: PalletLedger }>(`/palette/ledger/${companyId}`);
    return response.ledger;
  },

  // ========== SITES ==========

  // Liste tous les sites
  getSites: async (): Promise<PalletSite[]> => {
    const response = await apiFetch<{ sites: PalletSite[] }>('/palette/sites');
    return response.sites;
  },

  // Détails d'un site avec son quota
  getSite: async (siteId: string): Promise<{ site: PalletSite; quota: PalletSiteQuota }> => {
    return apiFetch<{ site: PalletSite; quota: PalletSiteQuota }>(`/palette/sites/${siteId}`);
  },

  // Mettre à jour le quota d'un site
  updateSiteQuota: async (
    siteId: string,
    quota: {
      dailyMax?: number;
      openingHours?: { start: string; end: string };
      availableDays?: number[];
      priority?: string;
    }
  ): Promise<PalletSiteQuota> => {
    const response = await apiFetch<{ quota: PalletSiteQuota }>(`/palette/sites/${siteId}/quota`, {
      method: 'POST',
      body: JSON.stringify(quota),
    });
    return response.quota;
  },

  // Créer un nouveau site (à implémenter dans le service)
  createSite: async (site: Omit<PalletSite, 'id'>): Promise<PalletSite> => {
    throw new Error('Endpoint non disponible - À implémenter dans le service palette');
  },

  // Désactiver un site
  deactivateSite: async (siteId: string): Promise<void> => {
    throw new Error('Endpoint non disponible - À implémenter dans le service palette');
  },

  // ========== LITIGES ==========

  // Liste tous les litiges
  getDisputes: async (): Promise<PalletDispute[]> => {
    const response = await apiFetch<{ disputes: PalletDispute[] }>('/palette/disputes');
    return response.disputes;
  },

  // Résoudre un litige (à implémenter dans le service)
  resolveDispute: async (
    disputeId: string,
    resolution: string,
    proposedSolution: string
  ): Promise<PalletDispute> => {
    throw new Error('Endpoint non disponible - À implémenter dans le service palette');
  },

  // ========== ANALYTICS ==========

  // Stats globales
  getAnalytics: async (): Promise<{
    totalCheques: number;
    chequesGenerated: number;
    chequesDeposited: number;
    chequesReceived: number;
    totalPalletsInCirculation: number;
    topSites: Array<{ siteId: string; name: string; count: number }>;
    topCompanies: Array<{ companyId: string; name: string; balance: number }>;
  }> => {
    throw new Error('Endpoint non disponible - Calculé côté client à partir des données');
  },

  // Export CSV (à implémenter côté client)
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
};

// Helper pour charger les données des seeds (fallback si API non dispo)
export async function loadPaletteSeeds() {
  try {
    const [companies, sites, ledger] = await Promise.all([
      fetch('/api/seeds/palette-companies.json').then(r => r.json()),
      fetch('/api/seeds/palette-sites.json').then(r => r.json()),
      fetch('/api/seeds/palette-ledger.json').then(r => r.json()),
    ]);
    return { companies, sites, ledger };
  } catch (e) {
    console.warn('Erreur chargement seeds:', e);
    return { companies: [], sites: [], ledger: [] };
  }
}
