// API Configuration for SYMPHONI.A Industry
// Backend Services URLs

export const API_CONFIG = {
  // Planning Sites API - Sites, Docks, Slots, Driver Check-in
  PLANNING_API: process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://rt-planning-api-prod.eba-gbhspa2p.eu-central-1.elasticbeanstalk.com',

  // eCMR Signature API - Electronic CMR with eIDAS compliance
  ECMR_API: process.env.NEXT_PUBLIC_ECMR_API_URL || 'http://rt-ecmr-api-prod.eba-43ngua6v.eu-central-1.elasticbeanstalk.com',

  // Appointments API - RDV Transporteurs
  APPOINTMENTS_API: process.env.NEXT_PUBLIC_APPOINTMENTS_API_URL || 'http://rt-appointments-api-prod.eba-b5rcxvcw.eu-central-1.elasticbeanstalk.com',

  // Core API - Orders, Tracking, etc.
  CORE_API: process.env.NEXT_PUBLIC_API_URL || 'http://rt-api-prod.eba-mwaprcin.eu-central-1.elasticbeanstalk.com'
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
const CHATBOT_API = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://rt-chatbot-api-prod.eba-xxx.eu-central-1.elasticbeanstalk.com';

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
