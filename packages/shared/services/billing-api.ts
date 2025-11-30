/**
 * Billing API Service
 * Service partagé pour l'API de facturation SYMPHONI.A
 */

const API_BASE = process.env.NEXT_PUBLIC_BILLING_API || 'http://localhost:3014';

// Types
export interface TariffGrid {
  gridId: string;
  transporterId: string;
  clientId: string;
  name: string;
  validFrom: string;
  validTo?: string;
  baseRates: {
    zoneFrom: string;
    zoneTo: string;
    minKm: number;
    maxKm: number;
    pricePerKm: number;
    fixedPrice: number;
    currency: string;
  }[];
  options: {
    adr: number;
    hayon: number;
    express: number;
    frigo: number;
    palettesEchange: number;
    redescendeMateriel: number;
    weekend: number;
    nuit: number;
    horairesSpeciaux: number;
  };
  waitingTime: {
    freeMinutes: number;
    pricePerHour: number;
  };
  penalties: {
    lateDeliveryPerHour: number;
    missingDocument: number;
    damagedGoods: number;
  };
  active: boolean;
  createdAt: string;
}

export interface Prefacturation {
  _id: string;
  prefacturationId: string;
  orderId: string;
  transporterId: string;
  transporterName: string;
  clientId: string;
  clientName: string;
  status: PrefacturationStatus;
  orderData: {
    pickupDate: string;
    deliveryDate: string;
    pickupAddress: string;
    deliveryAddress: string;
    pickupPostalCode: string;
    deliveryPostalCode: string;
    distance: number;
    duration: number;
    vehicleType: string;
    vehiclePlate: string;
    driverName: string;
  };
  cargo: {
    description: string;
    weight: number;
    volume: number;
    pallets: number;
    packages: number;
    isADR: boolean;
    adrClass: string;
    temperature: number;
  };
  options: {
    adr: boolean;
    hayon: boolean;
    express: boolean;
    frigo: boolean;
    palettesEchange: number;
    redescendeMateriel: boolean;
    weekend: boolean;
    nuit: boolean;
  };
  waitingTime: {
    pickup: number;
    delivery: number;
    total: number;
    billable: number;
  };
  calculation: {
    gridId: string;
    basePrice: number;
    distancePrice: number;
    optionsPrice: number;
    waitingTimePrice: number;
    palettesPrice: number;
    penalties: number;
    surcharges: number;
    discounts: number;
    totalHT: number;
    tva: number;
    totalTTC: number;
  };
  calculationDetails: {
    item: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  carrierInvoice?: {
    invoiceNumber: string;
    invoiceDate: string;
    totalHT: number;
    tva: number;
    totalTTC: number;
    pdfUrl: string;
    ocrData: any;
    uploadedAt: string;
  };
  discrepancies: Discrepancy[];
  blocks: Block[];
  documents: {
    pod: { present: boolean; url: string; validatedAt: string };
    cmr: { present: boolean; url: string; signaturePresent: boolean };
    ecmr: { present: boolean; url: string };
    bl: { present: boolean; url: string };
    photos: { url: string; type: string; uploadedAt: string }[];
  };
  carrierValidation: {
    status: 'pending' | 'accepted' | 'contested' | 'timeout';
    sentAt: string;
    respondedAt: string;
    timeoutAt: string;
    contestReason: string;
    proposedAmount: number;
    comments: string;
  };
  finalInvoice?: {
    invoiceId: string;
    invoiceNumber: string;
    generatedAt: string;
    pdfUrl: string;
    sentToERP: boolean;
    erpExportDate: string;
    erpReference: string;
    erpSystem: string;
  };
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    details: any;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type PrefacturationStatus =
  | 'draft'
  | 'generated'
  | 'discrepancy_detected'
  | 'pending_validation'
  | 'validated'
  | 'contested'
  | 'conflict_closed'
  | 'blocked'
  | 'finalized'
  | 'exported'
  | 'archived';

export interface Discrepancy {
  _id?: string;
  type: 'price_global' | 'distance' | 'options' | 'palettes' | 'waiting_time' | 'volume' | 'other';
  description: string;
  expectedValue: any;
  actualValue: any;
  difference: number;
  differencePercent: number;
  status: 'detected' | 'justified' | 'contested' | 'resolved';
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Block {
  _id?: string;
  blockId?: string;
  type: 'missing_documents' | 'vigilance' | 'pallets' | 'late' | 'manual';
  reason: string;
  details?: any;
  blockedAt: string;
  blockedBy: string;
  unlockedAt?: string;
  unlockedBy?: string;
  active: boolean;
}

export interface BillingDispute {
  disputeId: string;
  prefacturationId: string;
  orderId: string;
  transporterId: string;
  clientId: string;
  type: string;
  description: string;
  symphoniaAmount: number;
  carrierAmount: number;
  difference: number;
  status: 'open' | 'pending_carrier' | 'pending_client' | 'negotiation' | 'resolved' | 'escalated' | 'closed';
  resolution?: {
    type: string;
    finalAmount: number;
    description: string;
    resolvedAt: string;
    resolvedBy: string;
  };
  createdAt: string;
}

export interface ERPExport {
  exportId: string;
  prefacturationId: string;
  invoiceId: string;
  erpSystem: 'sap' | 'oracle' | 'sage_x3' | 'divalto' | 'dynamics_365' | 'odoo' | 'generic_api';
  status: 'pending' | 'sent' | 'acknowledged' | 'failed' | 'retry';
  erpResponse?: {
    status: number;
    reference: string;
    message: string;
    receivedAt: string;
  };
  exportedAt: string;
  createdAt: string;
}

export interface CarrierVigilance {
  vigilanceId: string;
  transporterId: string;
  transporterName: string;
  documents: {
    urssaf: VigilanceDocument;
    assurance: VigilanceDocument;
    licenceTransport: VigilanceDocument;
    kbis: VigilanceDocument;
  };
  status: 'valid' | 'expiring_soon' | 'expired' | 'incomplete';
  lastChecked: string;
}

export interface VigilanceDocument {
  present: boolean;
  documentUrl: string;
  validUntil: string;
  verifiedAt: string;
}

export interface BillingStats {
  prefacturations: {
    total: number;
    byStatus: Record<string, number>;
  };
  amounts: {
    totalHT: number;
    totalTTC: number;
  };
  discrepancyRate: number;
  activeBlocks: number;
}

export interface ERPConfig {
  system: 'sap' | 'oracle' | 'sage_x3' | 'divalto' | 'dynamics_365' | 'odoo' | 'generic_api';
  endpoint?: string;
  apiKey?: string;
  companyCode?: string;
  costCenter?: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// Helper function
const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ===========================================
// TARIFF GRIDS
// ===========================================

export const tariffApi = {
  create: async (tariff: Partial<TariffGrid>, token?: string): Promise<ApiResponse<TariffGrid>> => {
    const response = await fetch(`${API_BASE}/api/billing/tariffs`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(tariff),
    });
    return response.json();
  },

  list: async (filters?: { transporterId?: string; clientId?: string; active?: boolean }, token?: string): Promise<ApiResponse<TariffGrid[]>> => {
    const params = new URLSearchParams();
    if (filters?.transporterId) params.append('transporterId', filters.transporterId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.active !== undefined) params.append('active', String(filters.active));

    const response = await fetch(`${API_BASE}/api/billing/tariffs?${params}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  get: async (gridId: string, token?: string): Promise<ApiResponse<TariffGrid>> => {
    const response = await fetch(`${API_BASE}/api/billing/tariffs/${gridId}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ===========================================
// PREFACTURATIONS
// ===========================================

export const prefacturationApi = {
  generate: async (
    data: {
      orderId: string;
      orderData: Partial<Prefacturation['orderData']>;
      transporterId: string;
      clientId: string;
      options?: Partial<Prefacturation['options']> & {
        transporterName?: string;
        clientName?: string;
        cargo?: Partial<Prefacturation['cargo']>;
        waitingTime?: Partial<Prefacturation['waitingTime']>;
        incidents?: any[];
      };
    },
    token?: string
  ): Promise<ApiResponse<Prefacturation>> => {
    const response = await fetch(`${API_BASE}/api/billing/prefacturation/generate`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  get: async (id: string, token?: string): Promise<ApiResponse<Prefacturation>> => {
    const response = await fetch(`${API_BASE}/api/billing/prefacturation/${id}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  list: async (
    filters?: {
      transporterId?: string;
      clientId?: string;
      status?: PrefacturationStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
    token?: string
  ): Promise<ApiResponse<Prefacturation[]>> => {
    const params = new URLSearchParams();
    if (filters?.transporterId) params.append('transporterId', filters.transporterId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await fetch(`${API_BASE}/api/billing/prefacturations?${params}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  finalize: async (prefacturationId: string, token?: string): Promise<ApiResponse<Prefacturation>> => {
    const response = await fetch(`${API_BASE}/api/billing/finalize`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ prefacturationId }),
    });
    return response.json();
  },

  downloadPdf: async (prefacturationId: string, token?: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/api/billing/invoice/${prefacturationId}/pdf`, {
      headers: getAuthHeaders(token),
    });
    return response.blob();
  },
};

// ===========================================
// CARRIER INVOICES
// ===========================================

export const carrierInvoiceApi = {
  upload: async (
    prefacturationId: string,
    invoiceData: {
      invoiceNumber?: string;
      totalHT: number;
      tva?: number;
      totalTTC?: number;
      distance?: number;
      palettes?: number;
      waitingTimeMinutes?: number;
    },
    file?: File,
    token?: string
  ): Promise<ApiResponse<Prefacturation>> => {
    const formData = new FormData();
    formData.append('prefacturationId', prefacturationId);
    if (invoiceData.invoiceNumber) formData.append('invoiceNumber', invoiceData.invoiceNumber);
    formData.append('totalHT', String(invoiceData.totalHT));
    if (invoiceData.tva) formData.append('tva', String(invoiceData.tva));
    if (invoiceData.totalTTC) formData.append('totalTTC', String(invoiceData.totalTTC));
    if (invoiceData.distance) formData.append('distance', String(invoiceData.distance));
    if (invoiceData.palettes) formData.append('palettes', String(invoiceData.palettes));
    if (invoiceData.waitingTimeMinutes) formData.append('waitingTimeMinutes', String(invoiceData.waitingTimeMinutes));
    if (file) formData.append('invoice', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/api/billing/invoice/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return response.json();
  },

  getStatus: async (
    filters?: { prefacturationId?: string; transporterId?: string },
    token?: string
  ): Promise<ApiResponse<Prefacturation[]>> => {
    const params = new URLSearchParams();
    if (filters?.prefacturationId) params.append('prefacturationId', filters.prefacturationId);
    if (filters?.transporterId) params.append('transporterId', filters.transporterId);

    const response = await fetch(`${API_BASE}/api/billing/invoice/status?${params}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ===========================================
// DISCREPANCIES
// ===========================================

export const discrepancyApi = {
  get: async (prefacturationId: string, token?: string): Promise<ApiResponse<{
    prefacturationId: string;
    orderId: string;
    symphoniaAmount: number;
    carrierAmount: number;
    discrepancies: Discrepancy[];
  }>> => {
    const response = await fetch(`${API_BASE}/api/billing/discrepancy/${prefacturationId}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  resolve: async (
    data: {
      prefacturationId: string;
      discrepancyIndex: number;
      resolution: string;
      resolvedAmount?: number;
    },
    token?: string
  ): Promise<ApiResponse<Prefacturation>> => {
    const response = await fetch(`${API_BASE}/api/billing/discrepancy/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// ===========================================
// BLOCKS
// ===========================================

export const blockApi = {
  check: async (prefacturationId: string, token?: string): Promise<ApiResponse<{
    prefacturation: Prefacturation;
    blocks: Block[];
  }>> => {
    const response = await fetch(`${API_BASE}/api/billing/check-blocks`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ prefacturationId }),
    });
    return response.json();
  },

  create: async (
    data: {
      prefacturationId: string;
      type?: Block['type'];
      reason: string;
      details?: any;
    },
    token?: string
  ): Promise<ApiResponse<Block>> => {
    const response = await fetch(`${API_BASE}/api/billing/block`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  remove: async (
    data: { blockId?: string; prefacturationId?: string; reason: string },
    token?: string
  ): Promise<ApiResponse<Block>> => {
    const response = await fetch(`${API_BASE}/api/billing/unblock`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  list: async (
    filters?: {
      transporterId?: string;
      clientId?: string;
      type?: Block['type'];
      active?: boolean;
    },
    token?: string
  ): Promise<ApiResponse<Block[]>> => {
    const params = new URLSearchParams();
    if (filters?.transporterId) params.append('transporterId', filters.transporterId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.active !== undefined) params.append('active', String(filters.active));

    const response = await fetch(`${API_BASE}/api/billing/blocks?${params}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ===========================================
// ERP EXPORT
// ===========================================

export const erpApi = {
  export: async (
    prefacturationId: string,
    erpConfig: ERPConfig,
    token?: string
  ): Promise<ApiResponse<{
    exportId: string;
    status: string;
    erpSystem: string;
    erpReference?: string;
    exportData: any;
  }>> => {
    const response = await fetch(`${API_BASE}/api/billing/export`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ prefacturationId, erpConfig }),
    });
    return response.json();
  },

  list: async (
    filters?: {
      prefacturationId?: string;
      erpSystem?: ERPConfig['system'];
      status?: ERPExport['status'];
      limit?: number;
    },
    token?: string
  ): Promise<ApiResponse<ERPExport[]>> => {
    const params = new URLSearchParams();
    if (filters?.prefacturationId) params.append('prefacturationId', filters.prefacturationId);
    if (filters?.erpSystem) params.append('erpSystem', filters.erpSystem);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await fetch(`${API_BASE}/api/billing/exports?${params}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ===========================================
// VIGILANCE
// ===========================================

export const vigilanceApi = {
  get: async (transporterId: string, token?: string): Promise<ApiResponse<CarrierVigilance>> => {
    const response = await fetch(`${API_BASE}/api/billing/vigilance/${transporterId}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  create: async (vigilance: Partial<CarrierVigilance>, token?: string): Promise<ApiResponse<CarrierVigilance>> => {
    const response = await fetch(`${API_BASE}/api/billing/vigilance`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(vigilance),
    });
    return response.json();
  },

  update: async (
    transporterId: string,
    vigilance: Partial<CarrierVigilance>,
    token?: string
  ): Promise<ApiResponse<CarrierVigilance>> => {
    const response = await fetch(`${API_BASE}/api/billing/vigilance/${transporterId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(vigilance),
    });
    return response.json();
  },
};

// ===========================================
// STATISTICS
// ===========================================

export const statsApi = {
  get: async (
    filters?: {
      clientId?: string;
      transporterId?: string;
      startDate?: string;
      endDate?: string;
    },
    token?: string
  ): Promise<ApiResponse<BillingStats>> => {
    const params = new URLSearchParams();
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.transporterId) params.append('transporterId', filters.transporterId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE}/api/billing/stats?${params}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// ===========================================
// WEBHOOKS
// ===========================================

export const webhookApi = {
  create: async (
    webhook: {
      clientId: string;
      name: string;
      url: string;
      events: string[];
      secret?: string;
    },
    token?: string
  ): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE}/api/billing/webhooks`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(webhook),
    });
    return response.json();
  },

  list: async (clientId?: string, token?: string): Promise<ApiResponse<any[]>> => {
    const params = clientId ? `?clientId=${clientId}` : '';
    const response = await fetch(`${API_BASE}/api/billing/webhooks${params}`, {
      headers: getAuthHeaders(token),
    });
    return response.json();
  },
};

// Default export
const billingApi = {
  tariffs: tariffApi,
  prefacturations: prefacturationApi,
  carrierInvoices: carrierInvoiceApi,
  discrepancies: discrepancyApi,
  blocks: blockApi,
  erp: erpApi,
  vigilance: vigilanceApi,
  stats: statsApi,
  webhooks: webhookApi,
};

export default billingApi;
