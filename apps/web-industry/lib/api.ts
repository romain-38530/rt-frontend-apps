// API Configuration for SYMPHONI.A Industry
// Backend Services URLs (HTTPS via CloudFront)

// Main CloudFront Gateway - All APIs route through this
const MAIN_API = 'https://d2i50a1vlg138w.cloudfront.net';
const SUBSCRIPTIONS_CLOUDFRONT = 'https://dgze8l03lwl5h.cloudfront.net';

export const API_CONFIG = {
  // Authentication
  AUTH_API: process.env.NEXT_PUBLIC_AUTH_API_URL || MAIN_API,

  // Planning Sites API - Sites, Docks, Slots, Driver Check-in
  PLANNING_API: process.env.NEXT_PUBLIC_PLANNING_API_URL || MAIN_API,

  // eCMR Signature API - Electronic CMR with eIDAS compliance
  ECMR_API: process.env.NEXT_PUBLIC_ECMR_API_URL || MAIN_API,

  // Appointments API - RDV Transporteurs
  APPOINTMENTS_API: process.env.NEXT_PUBLIC_APPOINTMENTS_API_URL || MAIN_API,

  // Orders API
  ORDERS_API: process.env.NEXT_PUBLIC_ORDERS_API_URL || MAIN_API,

  // Tracking API
  TRACKING_API: process.env.NEXT_PUBLIC_TRACKING_API_URL || MAIN_API,

  // Notifications API
  NOTIFICATIONS_API: process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || MAIN_API,

  // KPI API
  KPI_API: process.env.NEXT_PUBLIC_KPI_API_URL || MAIN_API,

  // Storage Market API
  STORAGE_MARKET_API: process.env.NEXT_PUBLIC_STORAGE_MARKET_API_URL || MAIN_API,

  // Training API
  TRAINING_API: process.env.NEXT_PUBLIC_TRAINING_API_URL || MAIN_API,

  // Subscriptions API (dedicated CloudFront)
  SUBSCRIPTIONS_API: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || SUBSCRIPTIONS_CLOUDFRONT,

  // Billing API
  BILLING_API: process.env.NEXT_PUBLIC_BILLING_API_URL || MAIN_API,

  // Scoring API
  SCORING_API: process.env.NEXT_PUBLIC_SCORING_API_URL || MAIN_API,

  // Vigilance API
  VIGILANCE_API: process.env.NEXT_PUBLIC_VIGILANCE_API_URL || MAIN_API,

  // Palettes API
  PALETTES_API: process.env.NEXT_PUBLIC_PALETTES_API_URL || MAIN_API,

  // AFFRET.IA API
  AFFRET_IA_API: process.env.NEXT_PUBLIC_AFFRET_IA_API_URL || MAIN_API,

  // Chatbot API
  CHATBOT_API: process.env.NEXT_PUBLIC_CHATBOT_API_URL || MAIN_API,

  // Dispatch API (Orders API handles dispatch)
  DISPATCH_API: process.env.NEXT_PUBLIC_ORDERS_API_URL || MAIN_API
};

// Helper to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
  'Content-Type': 'application/json'
});

// ============================================
// PLANNING API - Sites, Docks, Slots
// ============================================

export const planningApi = {
  // Sites
  getSites: async () => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createSite: async (data: any) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateSite: async (id: string, data: any) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteSite: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Docks
  getDocks: async (siteId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/docks`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createDock: async (siteId: string, data: any) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/docks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateDock: async (id: string, data: any) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/docks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteDock: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/docks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Slots
  getSlots: async (siteId: string, date: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/slots?date=${date}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  generateSlots: async (data: { siteId: string; date: string; duration: number }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/slots/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  blockSlot: async (data: { slotId: string; reason: string }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/slots/block`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  unblockSlot: async (slotId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/slots/unblock`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ slotId })
    });
    return res.json();
  }
};

// ============================================
// DRIVER API - Check-in/out, Queue
// ============================================

export const driverApi = {
  checkin: async (data: { code: string; siteId: string; method?: string; coordinates?: { lat: number; lng: number } }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/driver/checkin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  checkout: async (checkinId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/driver/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ checkinId })
    });
    return res.json();
  },

  getStatus: async (checkinId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/driver/status/${checkinId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getQueue: async (siteId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/driver/queue?siteId=${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  callDriver: async (checkinId: string, dockId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/driver/call/${checkinId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dockId })
    });
    return res.json();
  },

  geofenceCheckin: async (data: { appointmentId: string; coordinates: { lat: number; lng: number }; siteId: string }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/driver/geofence-checkin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// ============================================
// eCMR API - Electronic CMR Signatures
// ============================================

export const ecmrApi = {
  list: async () => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  get: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  create: async (data: any) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  sign: async (id: string, data: { party: 'shipper' | 'carrier' | 'consignee'; signatureData: string; signerName: string; reservations?: string }) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/sign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  validate: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/validate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  download: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/download`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  history: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/history`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// APPOINTMENTS API - RDV Transporteurs
// ============================================

export const appointmentsApi = {
  list: async (filters?: { status?: string; date?: string }) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_CONFIG.APPOINTMENTS_API}/api/v1/appointments?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  get: async (id: string) => {
    const res = await fetch(`${API_CONFIG.APPOINTMENTS_API}/api/v1/appointments/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  propose: async (data: any) => {
    const res = await fetch(`${API_CONFIG.APPOINTMENTS_API}/api/v1/appointments/propose`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  confirm: async (id: string) => {
    const res = await fetch(`${API_CONFIG.APPOINTMENTS_API}/api/v1/appointments/${id}/confirm`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  reschedule: async (id: string, data: { proposedDate: string; proposedTime: string }) => {
    const res = await fetch(`${API_CONFIG.APPOINTMENTS_API}/api/v1/appointments/${id}/reschedule`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  cancel: async (id: string, reason?: string) => {
    const res = await fetch(`${API_CONFIG.APPOINTMENTS_API}/api/v1/appointments/${id}/cancel`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  getAvailability: async (siteId: string, date: string) => {
    const res = await fetch(`${API_CONFIG.APPOINTMENTS_API}/api/v1/appointments/availability?siteId=${siteId}&date=${date}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// CHATBOT API - Suite de Chatbots RT Technologie
// ============================================

// Chatbot API URL
const CHATBOT_API = process.env.NEXT_PUBLIC_CHATBOT_API_URL || MAIN_API;

export type ChatBotType = 'helpbot' | 'planif-ia' | 'routier' | 'quai-wms' | 'livraisons' | 'expedition' | 'freight-ia' | 'copilote';

export const chatbotApi = {
  // Envoyer un message au chatbot
  sendMessage: async (botType: ChatBotType, data: {
    message: string;
    context?: {
      userId?: string;
      companyId?: string;
      role?: string;
      currentModule?: string;
      currentOrderId?: string;
      interactionCount?: number;
      category?: string;
      conversationHistory?: { role: string; content: string }[];
    };
    attachments?: string[];
  }) => {
    const res = await fetch(`${CHATBOT_API}/api/v1/chat/${botType}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Obtenir l'historique de conversation
  getHistory: async (sessionId: string) => {
    const res = await fetch(`${CHATBOT_API}/api/v1/chat/history/${sessionId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Transfert vers technicien
  transferToTechnician: async (data: {
    conversationHistory: any[];
    userContext: any;
    botType: ChatBotType;
    priority: 1 | 2 | 3;
    description?: string;
  }) => {
    const res = await fetch(`${CHATBOT_API}/api/v1/support/transfer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Obtenir le statut du support
  getSupportStatus: async (ticketId: string) => {
    const res = await fetch(`${CHATBOT_API}/api/v1/support/status/${ticketId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Diagnostics API (pour RT HelpBot)
  runDiagnostic: async (type: 'api_erp' | 'api_tracking' | 'connection' | 'documents' | 'servers') => {
    const res = await fetch(`${CHATBOT_API}/api/v1/diagnostics/${type}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Base de connaissances - Recherche FAQ
  searchKnowledge: async (query: string, category?: string) => {
    const params = new URLSearchParams({ query, ...(category && { category }) });
    const res = await fetch(`${CHATBOT_API}/api/v1/knowledge/search?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Obtenir les articles FAQ
  getFAQ: async (category?: string) => {
    const params = category ? `?category=${category}` : '';
    const res = await fetch(`${CHATBOT_API}/api/v1/knowledge/faq${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Feedback sur une reponse
  submitFeedback: async (messageId: string, helpful: boolean, comment?: string) => {
    const res = await fetch(`${CHATBOT_API}/api/v1/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messageId, helpful, comment })
    });
    return res.json();
  }
};

// ============================================
// ORDERS API - Gestion des commandes
// ============================================

export const ordersApi = {
  list: async (filters?: { status?: string; date?: string; clientId?: string }) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  get: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  create: async (data: any) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id: string, data: any) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getTracking: async (id: string) => {
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// NOTIFICATIONS API - Centre de notifications
// ============================================

export const notificationsApi = {
  list: async (filters?: { read?: boolean; type?: string }) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  markAsRead: async (id: string) => {
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  markAllAsRead: async () => {
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getPreferences: async () => {
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/preferences`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  updatePreferences: async (data: any) => {
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// ============================================
// KPI API - Tableaux de bord et indicateurs
// ============================================

export const kpiApi = {
  getDashboard: async (period?: string) => {
    const params = period ? `?period=${period}` : '';
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/dashboard${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getMetrics: async (type: string, filters?: any) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/metrics/${type}?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getTransportKpis: async (period?: string) => {
    const params = period ? `?period=${period}` : '';
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/transport${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getDeliveryKpis: async (period?: string) => {
    const params = period ? `?period=${period}` : '';
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/delivery${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// STORAGE MARKET API - Bourse de stockage
// ============================================

export const storageMarketApi = {
  listSpaces: async (filters?: { type?: string; location?: string; available?: boolean }) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/spaces?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getSpace: async (id: string) => {
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/spaces/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createSpace: async (data: any) => {
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/spaces`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateSpace: async (id: string, data: any) => {
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/spaces/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteSpace: async (id: string) => {
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/spaces/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createReservation: async (data: any) => {
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getReservations: async () => {
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/reservations`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// TRAINING API - Formation et e-learning
// ============================================

export const trainingApi = {
  getModules: async () => {
    const res = await fetch(`${API_CONFIG.TRAINING_API}/api/v1/training/modules`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getModule: async (id: string) => {
    const res = await fetch(`${API_CONFIG.TRAINING_API}/api/v1/training/modules/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getProgress: async () => {
    const res = await fetch(`${API_CONFIG.TRAINING_API}/api/v1/training/progress`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  updateProgress: async (moduleId: string, data: { completed: boolean; score?: number }) => {
    const res = await fetch(`${API_CONFIG.TRAINING_API}/api/v1/training/progress/${moduleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getCertificates: async () => {
    const res = await fetch(`${API_CONFIG.TRAINING_API}/api/v1/training/certificates`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// SUBSCRIPTIONS API - Abonnements SaaS
// ============================================

export const subscriptionsApi = {
  getCurrent: async () => {
    const res = await fetch(`${API_CONFIG.SUBSCRIPTIONS_API}/api/v1/subscriptions/current`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getPlans: async () => {
    const res = await fetch(`${API_CONFIG.SUBSCRIPTIONS_API}/api/v1/subscriptions/plans`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  subscribe: async (planId: string) => {
    const res = await fetch(`${API_CONFIG.SUBSCRIPTIONS_API}/api/v1/subscriptions/subscribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ planId })
    });
    return res.json();
  },

  cancel: async () => {
    const res = await fetch(`${API_CONFIG.SUBSCRIPTIONS_API}/api/v1/subscriptions/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getInvoices: async () => {
    const res = await fetch(`${API_CONFIG.SUBSCRIPTIONS_API}/api/v1/subscriptions/invoices`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getUsage: async () => {
    const res = await fetch(`${API_CONFIG.SUBSCRIPTIONS_API}/api/v1/subscriptions/usage`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// DISPATCH API - Configuration chaine d'affectation
// ============================================

// Types
export interface DispatchConfig {
  industrielId: string;
  carrierResponseTimeout: number;
  escalationDelay: number;
  maxCarriersInChain: number;
  reminderEnabled: boolean;
  reminderDelayMinutes: number;
  notificationChannels: ('email' | 'sms' | 'push' | 'webhook')[];
  eligibilityRules: {
    minScore: number;
    requireVigilanceCompliant: boolean;
    requireActiveInsurance: boolean;
    requirePricingGrid: boolean;
    excludeBlocked: boolean;
  };
  autoEscalateToAffretIA: boolean;
  affretIAConfig?: {
    maxPrice?: number;
    minScore: number;
  };
}

export interface CarrierChainEntry {
  carrierId: string;
  carrierName: string;
  position: number;
  priority: 'high' | 'medium' | 'low';
  score: number;
  onTimeRate: number;
  acceptanceRate: number;
  isActive: boolean;
}

export interface TransportLane {
  id: string;
  industrielId: string;
  name: string;
  origin: { country: string; region: string; city: string };
  destination: { country: string; region: string; city: string };
  carrierChain: CarrierChainEntry[];
  stats: {
    totalOrders: number;
    avgTransitDays: number;
    avgPrice: number;
    successRate: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchStats {
  totalOrders: number;
  acceptanceRate: number;
  avgResponseTime: number;
  escalationRate: number;
}

// Tracking Pricing Constants
export const TRACKING_PRICING = {
  basic: {
    level: 'basic',
    name: 'Tracking Basic',
    description: 'Suivi standard par etapes',
    pricingType: 'per_transport' as const,
    pricePerTransport: 0.5,
    priceMonthly: 0,
    features: {
      updateFrequency: 'Toutes les 2h',
      gpsTracking: false,
      geofencing: false,
      etaPrediction: false,
      realtimeMap: false,
      autoRescheduling: false,
    },
  },
  premium: {
    level: 'premium',
    name: 'Tracking Premium',
    description: 'Suivi GPS temps reel avec IA',
    pricingType: 'monthly' as const,
    pricePerTransport: 0,
    priceMonthly: 199,
    features: {
      updateFrequency: 'Temps reel',
      gpsTracking: true,
      geofencing: true,
      etaPrediction: true,
      realtimeMap: true,
      autoRescheduling: false,
    },
  },
  enterprise: {
    level: 'enterprise',
    name: 'Tracking Enterprise',
    description: 'Solution complete avec replanification auto',
    pricingType: 'monthly' as const,
    pricePerTransport: 0,
    priceMonthly: 499,
    features: {
      updateFrequency: 'Temps reel',
      gpsTracking: true,
      geofencing: true,
      etaPrediction: true,
      realtimeMap: true,
      autoRescheduling: true,
    },
  },
};

// API Functions
export const getDispatchConfig = async (industrielId: string): Promise<DispatchConfig> => {
  const res = await fetch(`${API_CONFIG.DISPATCH_API}/api/v1/dispatch/config/${industrielId}`, {
    headers: getAuthHeaders()
  });
  return res.json();
};

export const updateDispatchConfig = async (industrielId: string, config: Partial<DispatchConfig>): Promise<DispatchConfig> => {
  const res = await fetch(`${API_CONFIG.DISPATCH_API}/api/v1/dispatch/config/${industrielId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(config)
  });
  return res.json();
};

export const getLanes = async (industrielId: string): Promise<{ lanes: TransportLane[] }> => {
  const res = await fetch(`${API_CONFIG.DISPATCH_API}/api/v1/dispatch/lanes/${industrielId}`, {
    headers: getAuthHeaders()
  });
  return res.json();
};

export const createLane = async (industrielId: string, lane: Partial<TransportLane>): Promise<TransportLane> => {
  const res = await fetch(`${API_CONFIG.DISPATCH_API}/api/v1/dispatch/lanes/${industrielId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(lane)
  });
  return res.json();
};

export const updateLane = async (laneId: string, lane: Partial<TransportLane>): Promise<TransportLane> => {
  const res = await fetch(`${API_CONFIG.DISPATCH_API}/api/v1/dispatch/lanes/${laneId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(lane)
  });
  return res.json();
};

export const deleteLane = async (laneId: string): Promise<void> => {
  await fetch(`${API_CONFIG.DISPATCH_API}/api/v1/dispatch/lanes/${laneId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
};

export const getDispatchStats = async (industrielId: string): Promise<DispatchStats> => {
  const res = await fetch(`${API_CONFIG.DISPATCH_API}/api/v1/dispatch/stats/${industrielId}`, {
    headers: getAuthHeaders()
  });
  return res.json();
};

// Dispatch API namespace export for compatibility
export const dispatchApi = {
  getDispatchConfig,
  updateDispatchConfig,
  getLanes,
  createLane,
  updateLane,
  deleteLane,
  getDispatchStats,
  TRACKING_PRICING,
};
