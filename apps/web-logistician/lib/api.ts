/**
 * API Configuration for SYMPHONI.A Logistique Portal
 * Backend Services URLs (HTTPS via CloudFront)
 */

import { getAuthToken } from './auth';

export const API_CONFIG = {
  // Authentication
  AUTH_API: process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://ddaywxps9n701.cloudfront.net',

  // Planning Sites API - Sites, Docks, Slots, Driver Check-in
  PLANNING_API: process.env.NEXT_PUBLIC_PLANNING_API_URL || 'https://dpw23bg2dclr1.cloudfront.net',

  // Orders API
  ORDERS_API: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net',

  // Tracking API
  TRACKING_API: process.env.NEXT_PUBLIC_TRACKING_API_URL || 'https://d2mn43ccfvt3ub.cloudfront.net',

  // eCMR Signature API
  ECMR_API: process.env.NEXT_PUBLIC_ECMR_API_URL || 'https://d28q05cx5hmg9q.cloudfront.net',

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

  // Billing API
  BILLING_API: process.env.NEXT_PUBLIC_BILLING_API_URL || 'https://d1ciol606nbfs0.cloudfront.net',

  // Scoring API
  SCORING_API: process.env.NEXT_PUBLIC_SCORING_API_URL || 'https://d1uyscmpcwc65a.cloudfront.net',

  // Vigilance API
  VIGILANCE_API: process.env.NEXT_PUBLIC_VIGILANCE_API_URL || 'https://d23m3oa6ef3tr1.cloudfront.net',

  // Palettes API
  PALETTES_API: process.env.NEXT_PUBLIC_PALETTES_API_URL || 'https://d2o4ng8nutcmou.cloudfront.net',

  // Chatbot API
  CHATBOT_API: process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://de1913kh0ya48.cloudfront.net',

  // Documents API
  DOCUMENTS_API: process.env.NEXT_PUBLIC_DOCUMENTS_API_URL || 'https://d8987l284s9q4.cloudfront.net',

  // TMS Sync API
  TMS_SYNC_API: process.env.NEXT_PUBLIC_TMS_SYNC_API_URL || 'https://d1yk7yneclf57m.cloudfront.net',
};

// Helper to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken() || ''}`,
  'Content-Type': 'application/json'
});

// Get current warehouse/site ID from auth context
const getSiteId = (): string => {
  if (typeof window === 'undefined') return '';
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.siteId || parsed.warehouseId || parsed.id || '';
    } catch {
      return '';
    }
  }
  return '';
};

// Get company ID from auth context
const getCompanyId = (): string => {
  if (typeof window === 'undefined') return '';
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.companyId || parsed.id || '';
    } catch {
      return '';
    }
  }
  return '';
};

// ============================================
// PLANNING API - Sites, Docks, Slots, Bookings
// ============================================

export const planningApi = {
  // Sites
  getSites: async () => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getSite: async (siteId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createSite: async (data: { name: string; address: string; type: string }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateSite: async (siteId: string, data: any) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
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

  getDock: async (siteId: string, dockId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/docks/${dockId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createDock: async (siteId: string, data: { name: string; type: string; capacity: number }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/docks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateDockStatus: async (siteId: string, dockId: string, status: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/docks/${dockId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Time Slots
  getSlots: async (siteId: string, date: string, dockId?: string) => {
    const params = new URLSearchParams({ date });
    if (dockId) params.append('dockId', dockId);
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/slots?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getAllSlots: async (date: string, siteId?: string) => {
    const params = new URLSearchParams({ date });
    if (siteId) params.append('siteId', siteId);
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/slots?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createSlot: async (siteId: string, data: { dockId: string; date: string; startTime: string; endTime: string; type: string }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/slots`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  blockSlot: async (slotId: string, reason: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/slots/${slotId}/block`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  unblockSlot: async (slotId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/slots/${slotId}/unblock`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Bookings
  getBookings: async (params: { date?: string; siteId?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.date) searchParams.append('date', params.date);
    if (params.siteId) searchParams.append('siteId', params.siteId);
    if (params.status) searchParams.append('status', params.status);
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings?${searchParams}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getBooking: async (bookingId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  approveBooking: async (bookingId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  rejectBooking: async (bookingId: string, reason: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  cancelBooking: async (bookingId: string, reason: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  // Driver Check-in/Check-out
  getDriverCheckins: async (siteId: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/checkins${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  confirmDriverArrival: async (bookingId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/confirm-arrival`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  startLoading: async (bookingId: string, dockId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/start-loading`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dockId })
    });
    return res.json();
  },

  completeLoading: async (bookingId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Statistics
  getStats: async (siteId?: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (siteId) params.append('siteId', siteId);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/stats?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Geofence Events
  getGeofenceEvents: async (siteId: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites/${siteId}/geofence-events${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// ORDERS API - Commandes
// ============================================

export const ordersApi = {
  list: async (filters?: { status?: string; date?: string }) => {
    const siteId = getSiteId();
    const params = new URLSearchParams({ siteId, ...filters as any });
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

  updateStatus: async (id: string, status: string, data?: any) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, ...data })
    });
    return res.json();
  },

  getIncoming: async (date?: string) => {
    const siteId = getSiteId();
    const params = new URLSearchParams({ siteId, type: 'incoming' });
    if (date) params.append('date', date);
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getOutgoing: async (date?: string) => {
    const siteId = getSiteId();
    const params = new URLSearchParams({ siteId, type: 'outgoing' });
    if (date) params.append('date', date);
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// ECMR API - Signature electronique CMR
// ============================================

export const ecmrApi = {
  list: async (filters?: { status?: string; date?: string }) => {
    const siteId = getSiteId();
    const params = new URLSearchParams({ siteId, ...filters as any });
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr?${params}`, {
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

  sign: async (id: string, signature: { type: 'warehouse' | 'sender' | 'recipient'; signatureData: string; name: string }) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/sign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(signature)
    });
    return res.json();
  },

  addReservation: async (id: string, reservation: { type: string; description: string; photo?: string }) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reservation)
    });
    return res.json();
  },

  downloadPdf: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/pdf`, {
      headers: getAuthHeaders()
    });
    return res.blob();
  },

  getPendingSignatures: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/pending?siteId=${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// NOTIFICATIONS API
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
  }
};

// ============================================
// KPI API - Tableaux de bord entrepot
// ============================================

export const kpiApi = {
  getDashboard: async (period?: string) => {
    const siteId = getSiteId();
    const params = period ? `?period=${period}&siteId=${siteId}` : `?siteId=${siteId}`;
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/warehouse${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getMetrics: async (type: string, filters?: any) => {
    const siteId = getSiteId();
    const params = new URLSearchParams({ siteId, ...filters as any });
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/metrics/${type}?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getWarehouseKpis: async (period?: string) => {
    const siteId = getSiteId();
    const params = period ? `?period=${period}&siteId=${siteId}` : `?siteId=${siteId}`;
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/warehouse${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getDockUtilization: async (siteId: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/warehouse/${siteId}/dock-utilization${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getThroughput: async (siteId: string, period?: string) => {
    const params = period ? `?period=${period}` : '';
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/warehouse/${siteId}/throughput${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// SCORING API - Score entrepot/site
// ============================================

export const scoringApi = {
  getScore: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.SCORING_API}/api/v1/scoring/site/${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getScoreDetails: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.SCORING_API}/api/v1/scoring/site/${siteId}/details`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getBenchmark: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.SCORING_API}/api/v1/scoring/site/${siteId}/benchmark`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// STORAGE MARKET API - Bourse de stockage
// ============================================

export const storageMarketApi = {
  // My spaces (as provider)
  listMySpaces: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/spaces?ownerId=${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createSpace: async (data: { name: string; type: string; size: number; price: number; available: boolean }) => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/spaces`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, siteId })
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

  // Reservations received
  getReservations: async (status?: string) => {
    const siteId = getSiteId();
    const params = new URLSearchParams({ siteId });
    if (status) params.append('status', status);
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/reservations?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  approveReservation: async (id: string) => {
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/reservations/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  rejectReservation: async (id: string, reason: string) => {
    const res = await fetch(`${API_CONFIG.STORAGE_MARKET_API}/api/v1/storage/reservations/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  }
};

// ============================================
// TRAINING API - Formation
// ============================================

export const trainingApi = {
  getModules: async () => {
    const res = await fetch(`${API_CONFIG.TRAINING_API}/api/v1/training/modules?context=warehouse`, {
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
  }
};

// ============================================
// BILLING API - Facturation
// ============================================

export const billingApi = {
  getInvoices: async (filters?: { status?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_CONFIG.BILLING_API}/api/v1/billing/invoices?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getInvoice: async (id: string) => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/api/v1/billing/invoices/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  downloadInvoice: async (id: string) => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/api/v1/billing/invoices/${id}/pdf`, {
      headers: getAuthHeaders()
    });
    return res.blob();
  }
};

// ============================================
// PALETTES API - Gestion palettes Europe
// ============================================

export const palettesApi = {
  getBalance: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.PALETTES_API}/api/v1/palettes/balance/${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getTransactions: async (filters?: { dateFrom?: string; dateTo?: string }) => {
    const siteId = getSiteId();
    const params = new URLSearchParams({ siteId, ...filters as any });
    const res = await fetch(`${API_CONFIG.PALETTES_API}/api/v1/palettes/transactions?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createExchange: async (data: { type: 'give' | 'take'; quantity: number; partnerId: string; orderId?: string }) => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.PALETTES_API}/api/v1/palettes/exchanges`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, siteId })
    });
    return res.json();
  }
};

// ============================================
// CHATBOT API
// ============================================

export const chatbotApi = {
  sendMessage: async (message: string, conversationId?: string) => {
    const res = await fetch(`${API_CONFIG.CHATBOT_API}/api/v1/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, conversationId, context: 'warehouse' })
    });
    return res.json();
  },

  getHistory: async (conversationId: string) => {
    const res = await fetch(`${API_CONFIG.CHATBOT_API}/api/v1/chat/history/${conversationId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getConversations: async () => {
    const res = await fetch(`${API_CONFIG.CHATBOT_API}/api/v1/chat/conversations`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// DOCUMENTS API - GED
// ============================================

export const documentsApi = {
  list: async (filters?: { type?: string; orderId?: string }) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/v1/documents?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  get: async (id: string) => {
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/v1/documents/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  upload: async (file: File, metadata: { type: string; orderId?: string; description?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', metadata.type);
    if (metadata.orderId) formData.append('orderId', metadata.orderId);
    if (metadata.description) formData.append('description', metadata.description);

    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/v1/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken() || ''}`
      },
      body: formData
    });
    return res.json();
  },

  download: async (id: string) => {
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/v1/documents/${id}/download`, {
      headers: getAuthHeaders()
    });
    return res.blob();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/v1/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// TRACKING API - Suivi temps reel
// ============================================

export const trackingApi = {
  getOrderTracking: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/order/${orderId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getIncomingDeliveries: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/incoming?siteId=${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getOutgoingShipments: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/outgoing?siteId=${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getETA: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/order/${orderId}/eta`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// TMS SYNC API - Synchronisation TMS
// ============================================

export const tmsSyncApi = {
  getStatus: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/status?siteId=${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getConnections: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/connections?siteId=${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  syncNow: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ siteId })
    });
    return res.json();
  },

  getHistory: async (limit?: number) => {
    const siteId = getSiteId();
    const params = new URLSearchParams({ siteId });
    if (limit) params.append('limit', limit.toString());
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/history?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getErrors: async () => {
    const siteId = getSiteId();
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/errors?siteId=${siteId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

export default planningApi;
