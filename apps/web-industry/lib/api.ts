// API Configuration for SYMPHONI.A Industry
// Backend Services URLs (HTTPS via CloudFront)
// CloudFront domains from cloudfront-results.json registry

export const API_CONFIG = {
  // Authentication (authz service)
  AUTH_API: process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://d2swp5s4jfg8ri.cloudfront.net',

  // Planning Sites API - Sites, Docks, Slots, Driver Check-in
  PLANNING_API: process.env.NEXT_PUBLIC_PLANNING_API_URL || 'https://dpw23bg2dclr1.cloudfront.net',

  // eCMR Signature API - Electronic CMR with eIDAS compliance
  ECMR_API: process.env.NEXT_PUBLIC_ECMR_API_URL || 'https://d28q05cx5hmg9q.cloudfront.net',

  // Appointments API - RDV Transporteurs
  APPOINTMENTS_API: process.env.NEXT_PUBLIC_APPOINTMENTS_API_URL || 'https://d28uezz0327lfm.cloudfront.net',

  // Orders API
  ORDERS_API: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net',

  // Tracking API
  TRACKING_API: process.env.NEXT_PUBLIC_TRACKING_API_URL || 'https://d2mn43ccfvt3ub.cloudfront.net',

  // Notifications API
  NOTIFICATIONS_API: process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || 'https://d2t9age53em7o5.cloudfront.net',

  // KPI API
  KPI_API: process.env.NEXT_PUBLIC_KPI_API_URL || 'https://d57lw7v3zgfpy.cloudfront.net',

  // Storage Market API
  STORAGE_MARKET_API: process.env.NEXT_PUBLIC_STORAGE_MARKET_API_URL || 'https://d1ea8wbaf6ws9i.cloudfront.net',

  // Training API
  TRAINING_API: process.env.NEXT_PUBLIC_TRAINING_API_URL || 'https://d39f1h56c4jwz4.cloudfront.net',

  // Subscriptions API
  SUBSCRIPTIONS_API: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net',

  // Subscriptions Pricing API (pricing grids)
  SUBSCRIPTIONS_PRICING_API: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_PRICING_API_URL || 'https://d35kjzzin322yz.cloudfront.net',

  // Billing API
  BILLING_API: process.env.NEXT_PUBLIC_BILLING_API_URL || 'https://d1ciol606nbfs0.cloudfront.net',

  // Scoring API
  SCORING_API: process.env.NEXT_PUBLIC_SCORING_API_URL || 'https://d1uyscmpcwc65a.cloudfront.net',

  // Vigilance API
  VIGILANCE_API: process.env.NEXT_PUBLIC_VIGILANCE_API_URL || 'https://d23m3oa6ef3tr1.cloudfront.net',

  // Palettes API
  PALETTES_API: process.env.NEXT_PUBLIC_PALETTES_API_URL || 'https://d2o4ng8nutcmou.cloudfront.net',

  // AFFRET.IA API
  AFFRET_IA_API: process.env.NEXT_PUBLIC_AFFRET_IA_API_URL || 'https://d393yiia4ig3bw.cloudfront.net',

  // Chatbot API
  CHATBOT_API: process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://de1913kh0ya48.cloudfront.net',

  // Dispatch API (Orders API handles dispatch)
  DISPATCH_API: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net',

  // Pricing Grids API - Grilles tarifaires personnalisées
  PRICING_GRIDS_API: process.env.NEXT_PUBLIC_PRICING_GRIDS_API_URL || 'https://d16zes4rbh7uzi.cloudfront.net'
};

// Helper to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
  'Content-Type': 'application/json'
});

// Helper to get current user ID from localStorage
const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user?.id || user?._id || null;
  } catch {
    return null;
  }
};

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
  },

  // =========== INTERCONNEXIONS ===========

  // Interconnexion avec le module Commandes (Orders)
  getOrdersForSite: async (siteId: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/interconnect/orders/${siteId}${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Interconnexion avec le module Transporteurs (Carriers)
  getCarriersForSite: async (siteId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/interconnect/carriers/${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Interconnexion avec le module CRM
  getClientsForSite: async (siteId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/interconnect/clients/${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Interconnexion avec AFFRET.IA (recommandations créneaux)
  getAIRecommendations: async (siteId: string, date: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/interconnect/ai-recommendations?siteId=${siteId}&date=${date}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Statistiques consolidées du site
  getSiteStats: async (siteId: string, period?: 'day' | 'week' | 'month') => {
    const params = period ? `?period=${period}` : '';
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/stats${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Notifications temps réel
  subscribeToUpdates: async (siteId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/subscribe`, {
      method: 'POST',
      headers: getAuthHeaders()
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
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/driver/${checkinId}/call`, {
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

  downloadPdf: async (id: string): Promise<Blob> => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/pdf`, {
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to download PDF: ${res.status}`);
    }
    return res.blob();
  },

  generatePdf: async (ecmrData: any): Promise<Blob> => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`
      },
      body: JSON.stringify(ecmrData)
    });
    if (!res.ok) {
      throw new Error(`Failed to generate PDF: ${res.status}`);
    }
    return res.blob();
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
const CHATBOT_API = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://de1913kh0ya48.cloudfront.net';

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
  },

  // ===== Order Events =====
  getEvents: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${orderId}/events`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // ===== Documents Management =====
  getDocuments: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/documents/${orderId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  validateDocument: async (documentId: string) => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/documents/${documentId}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        validatedBy: {
          id: user.id || 'system',
          name: user.name || user.companyName || 'Industrial',
          role: 'industrial'
        }
      })
    });
    return res.json();
  },

  rejectDocument: async (documentId: string, reason: string) => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/documents/${documentId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        rejectedBy: {
          id: user.id || 'system',
          name: user.name || user.companyName || 'Industrial',
          role: 'industrial'
        },
        reason
      })
    });
    return res.json();
  },

  getDocumentDownloadUrl: async (documentId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/documents/${documentId}/download-url`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  checkDocuments: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/documents/${orderId}/check`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // ===== Closure Management =====
  checkClosureEligibility: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/closure/${orderId}/check`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  closeOrder: async (orderId: string) => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/closure/${orderId}/close`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        closedBy: {
          id: user.id || 'system',
          name: user.name || user.companyName || 'Industrial'
        }
      })
    });
    return res.json();
  },

  getClosureStats: async () => {
    const industrialId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').industrialId : '';
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/closure/stats?industrialId=${industrialId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // ===== Delivery Stats =====
  getDeliveryStats: async () => {
    const industrialId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').industrialId : '';
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/delivery/stats?industrialId=${industrialId}`, {
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
    const userId = getUserId();
    const params = new URLSearchParams({ userId: userId || '', ...filters } as any);
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getUnreadCount: async () => {
    const userId = getUserId();
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/unread-count?userId=${userId}`, {
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
    const userId = getUserId();
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/mark-all-read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId })
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
  getDashboard: async (options?: { universe?: string; companyId?: string; period?: string }) => {
    const params = new URLSearchParams();
    if (options?.universe) params.append('universe', options.universe);
    if (options?.companyId) params.append('companyId', options.companyId);
    if (options?.period) params.append('period', options.period);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/dashboard${queryString}`, {
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

// ============================================
// PREINVOICES API - Préfacturation transporteurs
// ============================================

export interface PreInvoiceLine {
  orderId: string;
  orderReference: string;
  pickupDate: string;
  deliveryDate: string;
  pickupCity: string;
  deliveryCity: string;
  baseAmount: number;
  waitingHours: number;
  waitingAmount: number;
  delayHours: number;
  delayPenalty: number;
  fuelSurcharge: number;
  tolls: number;
  otherCharges: number;
  totalAmount: number;
  cmrValidated: boolean;
  cmrNotes?: string;
  kpiData: {
    onTimePickup: boolean;
    onTimeDelivery: boolean;
    documentsComplete: boolean;
    incidentFree: boolean;
  };
}

export interface PreInvoice {
  preInvoiceId: string;
  preInvoiceNumber: string;
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  industrialId: string;
  industrialName: string;
  industrialEmail: string;
  carrierId: string;
  carrierName: string;
  carrierEmail: string;
  carrierSiret?: string;
  lines: PreInvoiceLine[];
  totals: {
    baseAmount: number;
    waitingAmount: number;
    delayPenalty: number;
    fuelSurcharge: number;
    tolls: number;
    otherCharges: number;
    subtotalHT: number;
    tvaRate: number;
    tvaAmount: number;
    totalTTC: number;
  };
  kpis: {
    totalOrders: number;
    onTimePickupRate: number;
    onTimeDeliveryRate: number;
    documentsCompleteRate: number;
    incidentFreeRate: number;
    averageWaitingHours: number;
    totalWaitingHours: number;
  };
  status: 'pending' | 'sent_to_industrial' | 'validated_industrial' | 'invoice_uploaded' | 'invoice_accepted' | 'invoice_rejected' | 'payment_pending' | 'paid' | 'disputed';
  industrialValidation?: {
    validatedAt: string;
    validatedBy: string;
    comments?: string;
  };
  carrierInvoice?: {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceAmount: number;
    documentId: string;
    uploadedAt: string;
  };
  invoiceControl?: {
    preInvoiceAmount: number;
    carrierInvoiceAmount: number;
    difference: number;
    differencePercent: number;
    autoAccepted: boolean;
  };
  payment?: {
    dueDate: string;
    paymentTermDays: number;
    daysRemaining: number;
    paidAt?: string;
    paidAmount?: number;
    paymentReference?: string;
    bankDetails?: {
      bankName: string;
      iban: string;
      bic: string;
      accountHolder: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PreInvoiceStats {
  totalPreInvoices: number;
  byStatus: Record<string, number>;
  totalAmountPending: number;
  totalAmountPaid: number;
  averagePaymentDays: number;
}

export const preinvoicesApi = {
  // Liste des préfactures avec filtres
  list: async (filters?: { industrialId?: string; carrierId?: string; status?: string; month?: number; year?: number }) => {
    const params = new URLSearchParams();
    if (filters?.industrialId) params.append('industrialId', filters.industrialId);
    if (filters?.carrierId) params.append('carrierId', filters.carrierId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());

    const res = await fetch(`${API_CONFIG.BILLING_API}/billing/prefacturations?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Statistiques préfacturation
  getStats: async (industrialId?: string) => {
    const params = industrialId ? `?industrialId=${industrialId}` : '';
    const res = await fetch(`${API_CONFIG.BILLING_API}/billing/stats${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Détail d'une préfacture
  get: async (preInvoiceId: string) => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/billing/prefacturation/${preInvoiceId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Valider une préfacture (industriel)
  validate: async (preInvoiceId: string, data: {
    validatedBy: string;
    comments?: string;
    adjustments?: { lineIndex: number; adjustedAmount: number; reason: string }[];
  }) => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/billing/prefacturation/${preInvoiceId}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Marquer comme payé
  markAsPaid: async (preInvoiceId: string, data: {
    paymentReference: string;
    paidAmount: number;
  }) => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/billing/prefacturation/${preInvoiceId}/mark-paid`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Export CSV pour paiements
  exportPayments: async () => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/billing/prefacturations/export`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Forcer l'envoi des préfactures mensuelles (admin)
  sendMonthly: async () => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/billing/prefacturations/send-monthly`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Mettre à jour les décomptes de paiement
  updateCountdowns: async () => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/billing/prefacturations/update-countdowns`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// PRICING GRIDS API - Grilles tarifaires personnalisées
// ============================================

export interface PricingGridZone {
  code: string;
  name: string;
  country?: string;
  type?: 'department' | 'region' | 'province' | 'land' | 'canton' | 'county';
}

export interface PricingGridFee {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  description?: string;
  mandatory?: boolean;
  conditions?: string;
}

export interface PricingGridVehicle {
  id: string;
  name: string;
  category?: string;
  capacityMin?: number;
  capacityMax?: number;
  weightMin?: number;
  weightMax?: number;
  description?: string;
}

export interface PricingGridAttachedFile {
  id: string;
  name: string;
  originalName: string;
  type: 'excel' | 'pdf' | 'csv' | 'other';
  mimeType: string;
  size: number;
  url?: string;
  s3Key?: string;
  description?: string;
  category: 'template' | 'specifications' | 'conditions' | 'other';
  uploadedAt: string;
}

export interface PricingGridConfigData {
  id?: string;
  name: string;
  description?: string;
  version?: number;
  status?: 'draft' | 'active' | 'archived';
  zonesConfig?: {
    type?: 'department' | 'region' | 'custom';
    selectedZonesFrance?: PricingGridZone[];
    selectedZonesEurope?: PricingGridZone[];
  };
  feesConfig?: {
    standardFees?: PricingGridFee[];
    customFees?: PricingGridFee[];
  };
  vehiclesConfig?: {
    selectedVehicles?: PricingGridVehicle[];
    customVehicles?: PricingGridVehicle[];
  };
  attachedFilesData?: PricingGridAttachedFile[];
  settings?: {
    currency?: string;
    taxRate?: number;
    validityDays?: number;
    minimumOrderValue?: number;
    paymentTermsDays?: number;
    notes?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingRequest {
  id?: string;
  configId?: string;
  carrierId: string;
  carrierCompanyName?: string;
  carrierContactEmail?: string;
  message?: string;
  zones?: PricingGridZone[];
  vehicles?: PricingGridVehicle[];
  fees?: PricingGridFee[];
  attachedFiles?: PricingGridAttachedFile[];
  validUntil?: string;
  responseDeadline?: string;
  status?: 'pending' | 'viewed' | 'responded' | 'expired' | 'cancelled';
}

export interface PricingProposal {
  id?: string;
  requestId: string;
  proposedPrices?: {
    zoneOrigin?: PricingGridZone;
    zoneDestination?: PricingGridZone;
    vehicleType?: string;
    pricePerKm?: number;
    priceFixed?: number;
    minPrice?: number;
    currency?: string;
    notes?: string;
  }[];
  proposedFees?: PricingGridFee[];
  validityDays?: number;
  validFrom?: string;
  validUntil?: string;
  paymentTerms?: string;
  conditions?: string;
  notes?: string;
  attachedFiles?: PricingGridAttachedFile[];
  status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'negotiating' | 'expired';
}

export const pricingGridsApi = {
  // ===== CONFIGURATIONS =====

  // Créer une nouvelle configuration
  createConfig: async (data: PricingGridConfigData) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/configs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Liste des configurations
  listConfigs: async (filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/configs?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Détail d'une configuration
  getConfig: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/configs/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Modifier une configuration
  updateConfig: async (id: string, data: Partial<PricingGridConfigData>) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/configs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Supprimer une configuration
  deleteConfig: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/configs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Dupliquer une configuration
  duplicateConfig: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/configs/${id}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // ===== FICHIERS =====

  // Upload un fichier
  uploadFile: async (file: File, category: 'template' | 'specifications' | 'conditions' | 'other' = 'other', description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) formData.append('description', description);

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`
      },
      body: formData
    });
    return res.json();
  },

  // Upload plusieurs fichiers
  uploadMultipleFiles: async (files: File[], categories?: Record<string, string>, descriptions?: Record<string, string>) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (categories) formData.append('categories', JSON.stringify(categories));
    if (descriptions) formData.append('descriptions', JSON.stringify(descriptions));

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/files/upload-multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`
      },
      body: formData
    });
    return res.json();
  },

  // Liste des fichiers
  listFiles: async (filters?: { category?: string; type?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/files?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Détail d'un fichier
  getFile: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/files/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Supprimer un fichier
  deleteFile: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/files/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Télécharger un fichier
  downloadFile: (id: string) => {
    window.location.href = `${API_CONFIG.PRICING_GRIDS_API}/files/${id}/download`;
  },

  // ===== DEMANDES DE TARIFS =====

  // Créer une demande de tarif
  createRequest: async (data: PricingRequest) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Liste des demandes envoyées
  listSentRequests: async (filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/requests/sent?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Détail d'une demande
  getRequest: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/requests/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Annuler une demande
  cancelRequest: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/requests/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // ===== PROPOSITIONS =====

  // Liste des propositions reçues
  listReceivedProposals: async (filters?: { status?: string; requestId?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.requestId) params.append('requestId', filters.requestId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals/received?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Détail d'une proposition
  getProposal: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Accepter une proposition
  acceptProposal: async (id: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals/${id}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Refuser une proposition
  rejectProposal: async (id: string, reason?: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  // Envoyer un message de négociation
  negotiateProposal: async (id: string, message: string, proposedChanges?: any) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals/${id}/negotiate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, proposedChanges })
    });
    return res.json();
  },

  // ===== STATISTIQUES =====

  // Stats des configurations
  getConfigStats: async () => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/stats/configs`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Stats des demandes
  getRequestStats: async () => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/stats/requests`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // ===== INTERCONNEXIONS =====

  // Récupérer la liste des transporteurs depuis le CRM
  getCarriers: async (search?: string, page = 1, limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/interconnect/carriers?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Récupérer les détails d'un transporteur avec son historique
  getCarrierDetails: async (carrierId: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/interconnect/carrier/${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Calculer le prix d'un transport basé sur les grilles acceptées
  calculatePrice: async (params: {
    origin?: { department?: string; region?: string; country?: string };
    destination?: { department?: string; region?: string; country?: string };
    weight?: number;
    volume?: number;
    pallets?: number;
    vehicleType?: string;
    distance?: number;
    carrierId?: string;
  }) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/interconnect/calculate-price`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  },

  // Récupérer les accords tarifaires actifs
  getPricingAgreements: async (carrierId?: string, status = 'accepted') => {
    const params = new URLSearchParams();
    if (carrierId) params.append('carrierId', carrierId);
    params.append('status', status);

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/interconnect/pricing-agreements?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Récupérer les scores des transporteurs
  getCarrierScores: async () => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/interconnect/carrier-scores`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Obtenir des recommandations de transporteurs via AFFRET.IA
  getCarrierRecommendations: async (zones?: any[], vehicleTypes?: string[], criteria?: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/interconnect/recommend-carriers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ zones, vehicleTypes, criteria })
    });
    return res.json();
  },

  // Créer une ligne de facturation basée sur un accord
  createInvoiceLine: async (orderId: string, proposalId: string, priceUsed: number) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/interconnect/create-invoice-line`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderId, proposalId, priceUsed })
    });
    return res.json();
  }
};
