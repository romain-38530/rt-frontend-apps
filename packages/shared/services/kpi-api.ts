/**
 * KPI API Service - Module KPI SYMPHONI.A
 * Client API pour le systeme de pilotage performance transport & logistique
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_KPI_API_URL || 'http://localhost:3400';

// ============================================
// TYPES
// ============================================

export interface OperationalKPIs {
  transportsInProgress: {
    total: number;
    byStatus: {
      enRoute: number;
      loading: number;
      unloading: number;
      waiting: number;
      delayed: number;
    };
  };
  delays: {
    percentage: string;
    averageMinutes: number;
    detectedByTrackingIA: number;
  };
  eta: {
    accuracy: string;
    averageDeviation: number;
  };
  orderAcceptance: {
    averageTimeMinutes: number;
    pendingOrders: number;
  };
  planning: {
    saturationLevel: string;
    availableSlots: number;
  };
  affretIA: {
    activeOrders: number;
    matchRate: string;
  };
  vigilance: {
    blockedCarriers: number;
    pendingValidations: number;
  };
  carrierResponse: {
    averageRate: string;
    belowThreshold: number;
  };
  timestamp: string;
}

export interface CarrierScoreDetails {
  slotRespect: { value: string; weight: number; score: string };
  documentDelay: { value: string; weight: number; score: string };
  unjustifiedDelays: { value: string; weight: number; score: string };
  responseTime: { value: string; weight: number; score: string };
  vigilanceCompliance: { value: string; weight: number; score: string };
  cancellationRate: { value: string; weight: number; score: string };
  trackingQuality: { value: string; weight: number; score: string };
  premiumAdoption: { value: string; weight: number; score: string };
  overallReliability: { value: string; weight: number; score: string };
}

export interface CarrierScore {
  carrierId: string;
  carrierName?: string;
  score: number;
  scoreDetails: CarrierScoreDetails;
  ranking: {
    global: number;
    percentile: number;
    byLane?: Record<string, number>;
  };
  trends: {
    lastWeek: string;
    lastMonth: string;
    evolution: 'up' | 'down' | 'stable';
  };
  metrics: {
    totalTransports: number;
    onTimeDeliveries: number;
    averageDelay: number;
    documentsOnTime: string;
    totalCancellations: number;
    averageResponseTime: number;
  };
  comparisons: {
    vsLaneAverage: string;
    vsNetworkAverage: string;
    vsTop20: string;
  };
  period?: string;
  calculatedAt?: string;
}

export interface IndustryKPIs {
  industryId: string;
  qualityOfService: {
    onTimeDeliveries: string;
    onTimePickups: string;
    delayAnalysis: {
      carrierCaused: number;
      logisticsCaused: number;
      externalCaused: number;
    };
    deliveryConformity: string;
    missingDocuments: number;
  };
  costOptimization: {
    averageCostPerLane: {
      domestic: string;
      international: string;
    };
    costPerKm: string;
    gridVsActual: {
      variance: string;
      overcharges: number;
    };
    affretIAvsReferenced: {
      savings: string;
      utilizationRate: string;
    };
    delayCosts: string;
  };
  volumetry: {
    dailyTransports: number;
    weeklyTransports: number;
    monthlyTransports: number;
    tonnage: { daily: number; monthly: number };
    pallets: { daily: number; monthly: number };
    carrierDistribution: Array<{
      carrierId: string;
      name: string;
      percentage: number;
    }>;
    trends: {
      weekOverWeek: string;
      monthOverMonth: string;
      seasonality: string;
    };
  };
}

export interface LogisticsKPIs {
  warehouseId: string;
  dockPerformance: {
    averageWaitTime: number;
    averageLoadingTime: number;
    dockSaturation: string;
    appointmentsHonored: string;
    noShowRate: string;
    trackingDelays: number;
    kioskAdoption: string;
  };
  coordination: {
    confirmationTime: number;
    reschedulingRate: string;
    capacityIssues: {
      undersized: number;
      oversized: number;
    };
  };
  realTimeStatus: {
    activeDocks: number;
    totalDocks: number;
    currentQueue: number;
    estimatedClearTime: number;
    trucksOnSite: number;
  };
  dailyMetrics: {
    completed: number;
    pending: number;
    cancelled: number;
  };
}

export interface FinancialKPIs {
  companyId: string;
  invoicing: {
    averageSubmissionDelay: number;
    averageValidationDelay: number;
    invoicesWithoutPOD: number;
    pendingValidation: number;
    validated: number;
    disputed: number;
  };
  tariffAnalysis: {
    totalVariance: string;
    variancePercentage: string;
    overcharges: { count: number; amount: string };
    undercharges: { count: number; amount: string };
  };
  margins: {
    affretIAMargin: string;
    averageMargin: string;
    noShowLosses: string;
    delayImpact: string;
  };
  monthlyTotals: {
    invoiced: string;
    collected: string;
    outstanding: string;
  };
}

export interface RSEKPIs {
  companyId: string;
  carbonFootprint: {
    totalCO2: string;
    co2PerTrip: string;
    co2PerKm: string;
    byVehicleType: {
      truck: string;
      van: string;
      electric: string;
    };
  };
  optimization: {
    co2Reduction: string;
    kmAvoided: number;
    truckFillRate: string;
    emptyKmReduction: string;
  };
  operationalGains: {
    planningHoursSaved: number;
    freightHoursSaved: number;
    trackingHoursSaved: number;
    followUpHoursSaved: number;
  };
  compliance: {
    regulatoryCompliance: string;
    documentCompliance: string;
    safetyCompliance: string;
  };
}

export interface Alert {
  alertId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  data?: any;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface GlobalKPIs {
  operational: OperationalKPIs;
  financial: FinancialKPIs;
  topCarriers: CarrierScore[];
  alerts: Alert[];
  summary: {
    healthScore: number;
    trend: 'up' | 'down' | 'stable';
    criticalAlerts: number;
  };
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

// Global KPIs
export const globalKpiApi = {
  getGlobal: () => fetchAPI<GlobalKPIs>('/kpi/global'),
  getLive: () => fetchAPI<OperationalKPIs>('/kpi/live'),
  getFiltered: (params: {
    company?: string;
    transporteur?: string;
    lane?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI<any>(`/kpi?${query}`);
  },
};

// Operational KPIs
export const operationalKpiApi = {
  getLive: () => fetchAPI<OperationalKPIs>('/kpi/operations/live'),
};

// Carrier KPIs & Scoring
export const carrierKpiApi = {
  getScore: (carrierId: string, period?: string) => {
    const query = period ? `?period=${period}` : '';
    return fetchAPI<CarrierScore>(`/kpi/carriers/${carrierId}${query}`);
  },
  getAll: (params?: { sort?: string; order?: string; limit?: number; page?: number }) => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchAPI<{ data: CarrierScore[]; pagination: any }>(`/kpi/carriers?${query}`);
  },
  getTop: (limit?: number, lane?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (lane) params.set('lane', lane);
    return fetchAPI<{ data: CarrierScore[]; averageScore: string }>(`/kpi/scoring/top?${params}`);
  },
};

// Industry KPIs
export const industryKpiApi = {
  get: (industryId: string, period?: string) => {
    const query = period ? `?period=${period}` : '';
    return fetchAPI<IndustryKPIs>(`/kpi/industry/${industryId}${query}`);
  },
};

// Logistics KPIs
export const logisticsKpiApi = {
  get: (warehouseId: string) => fetchAPI<LogisticsKPIs>(`/kpi/logistics/${warehouseId}`),
};

// Financial KPIs
export const financialKpiApi = {
  get: (companyId: string, period?: string) => {
    const query = period ? `?period=${period}` : '';
    return fetchAPI<FinancialKPIs>(`/kpi/financials/${companyId}${query}`);
  },
};

// RSE KPIs
export const rseKpiApi = {
  get: (companyId: string) => fetchAPI<RSEKPIs>(`/kpi/rse/${companyId}`),
};

// Alerts
export const alertsApi = {
  getActive: (params?: { severity?: string; type?: string; limit?: number }) => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchAPI<{ data: Alert[]; summary: any }>(`/kpi/alerts?${query}`);
  },
  acknowledge: (alertId: string, userId: string) =>
    fetchAPI<Alert>(`/kpi/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  resolve: (alertId: string) =>
    fetchAPI<Alert>(`/kpi/alerts/${alertId}/resolve`, { method: 'POST' }),
};

// Exports
export const exportApi = {
  getPDFUrl: (params?: { company?: string; startDate?: string; endDate?: string }) => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return `${API_BASE_URL}/kpi/export/pdf?${query}`;
  },
  getExcelUrl: (params?: { company?: string; startDate?: string; endDate?: string }) => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return `${API_BASE_URL}/kpi/export/excel?${query}`;
  },
  downloadPDF: async (params?: { company?: string; startDate?: string; endDate?: string }) => {
    const url = exportApi.getPDFUrl(params);
    const response = await fetch(url);
    return response.blob();
  },
  downloadExcel: async (params?: { company?: string; startDate?: string; endDate?: string }) => {
    const url = exportApi.getExcelUrl(params);
    const response = await fetch(url);
    return response.blob();
  },
};

// WebSocket connection
export function connectKPIWebSocket(
  onMessage: (data: { topic: string; data: any; timestamp: string }) => void,
  topics?: string[]
): WebSocket | null {
  const wsUrl = process.env.NEXT_PUBLIC_KPI_WS_URL || 'ws://localhost:3401';

  try {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('KPI WebSocket connected');
      if (topics && topics.length > 0) {
        ws.send(JSON.stringify({ action: 'subscribe', topics }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('KPI WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('KPI WebSocket disconnected');
    };

    return ws;
  } catch (error) {
    console.error('Failed to connect KPI WebSocket:', error);
    return null;
  }
}

export default {
  global: globalKpiApi,
  operational: operationalKpiApi,
  carriers: carrierKpiApi,
  industry: industryKpiApi,
  logistics: logisticsKpiApi,
  financial: financialKpiApi,
  rse: rseKpiApi,
  alerts: alertsApi,
  export: exportApi,
  connectWebSocket: connectKPIWebSocket,
};
