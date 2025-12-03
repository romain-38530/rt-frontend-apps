/**
 * API Configuration for SYMPHONI.A Transporter Portal
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

  // AFFRET.IA API (Bourse de fret)
  AFFRET_IA_API: process.env.NEXT_PUBLIC_AFFRET_IA_API_URL || 'https://d393yiia4ig3bw.cloudfront.net',

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

// Get current carrier ID from auth context
const getCarrierId = (): string => {
  if (typeof window === 'undefined') return '';
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user).carrierId || JSON.parse(user).id || '';
    } catch {
      return '';
    }
  }
  return '';
};

// ============================================
// PLANNING API - Slots, Bookings, Driver Kiosk
// ============================================

export const planningApi = {
  // Available Slots
  getAvailableSlots: async (params: { date?: string; siteId?: string; type?: 'loading' | 'unloading' }) => {
    const searchParams = new URLSearchParams();
    if (params.date) searchParams.append('date', params.date);
    if (params.siteId) searchParams.append('siteId', params.siteId);
    if (params.type) searchParams.append('type', params.type);
    searchParams.append('status', 'available');
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/slots?${searchParams}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getSites: async () => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/sites`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Bookings (My Reservations)
  getMyBookings: async (status?: string) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId });
    if (status) params.append('status', status);
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings?${params}`, {
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

  createBooking: async (data: {
    slotId: string;
    siteId: string;
    dockId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'loading' | 'unloading';
    driver: { name: string; phone?: string };
    vehicle: { plate: string; trailerPlate?: string };
    cargo: { palletCount: number; description?: string; orderRef?: string };
  }) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, carrierId })
    });
    return res.json();
  },

  updateBooking: async (bookingId: string, data: {
    driver?: { name: string; phone?: string };
    vehicle?: { plate: string; trailerPlate?: string };
    cargo?: { palletCount: number; description?: string };
  }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
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

  // Driver Kiosk - Check-in/Check-out
  checkIn: async (bookingId: string, location?: { lat: number; lng: number }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/checkin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ location, checkinTime: new Date().toISOString() })
    });
    return res.json();
  },

  checkOut: async (bookingId: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ checkoutTime: new Date().toISOString() })
    });
    return res.json();
  },

  reportArrival: async (bookingId: string, location: { lat: number; lng: number }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/arrival`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ location, arrivalTime: new Date().toISOString() })
    });
    return res.json();
  },

  // Booking by confirmation code (for driver kiosk)
  getBookingByCode: async (confirmationCode: string) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/code/${confirmationCode}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Today's bookings for driver
  getTodayBookings: async () => {
    const carrierId = getCarrierId();
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings?carrierId=${carrierId}&date=${today}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Booking history
  getBookingHistory: async (params: { dateFrom?: string; dateTo?: string; limit?: number }) => {
    const carrierId = getCarrierId();
    const searchParams = new URLSearchParams({ carrierId });
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    searchParams.append('status', 'completed');
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings?${searchParams}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Geofence - Report position for automatic check-in
  reportPosition: async (bookingId: string, location: { lat: number; lng: number }) => {
    const res = await fetch(`${API_CONFIG.PLANNING_API}/api/v1/planning/bookings/${bookingId}/position`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ location, timestamp: new Date().toISOString() })
    });
    return res.json();
  }
};

// ============================================
// ORDERS API - Commandes transport
// ============================================

export const ordersApi = {
  list: async (filters?: { status?: string; date?: string }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId, ...filters as any });
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

  accept: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${id}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  decline: async (id: string, reason: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/orders/${id}/decline`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
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

  getTracking: async (id: string) => {
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/${id}`, {
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
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId, ...filters as any });
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

  sign: async (id: string, signature: { type: 'driver' | 'sender' | 'recipient'; signatureData: string; name: string; location?: { lat: number; lng: number } }) => {
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
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/pending?carrierId=${carrierId}`, {
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
// KPI API - Tableaux de bord
// ============================================

export const kpiApi = {
  getDashboard: async (period?: string) => {
    const carrierId = getCarrierId();
    const params = period ? `?period=${period}&carrierId=${carrierId}` : `?carrierId=${carrierId}`;
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/dashboard${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getMetrics: async (type: string, filters?: any) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId, ...filters as any });
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/metrics/${type}?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getTransportKpis: async (period?: string) => {
    const carrierId = getCarrierId();
    const params = period ? `?period=${period}&carrierId=${carrierId}` : `?carrierId=${carrierId}`;
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/transport${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getPerformance: async (period?: string) => {
    const carrierId = getCarrierId();
    const params = period ? `?period=${period}&carrierId=${carrierId}` : `?carrierId=${carrierId}`;
    const res = await fetch(`${API_CONFIG.KPI_API}/api/v1/kpi/performance${params}`, {
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
// TRAINING API - Formation
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
// SUBSCRIPTIONS API - Abonnements
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
  },

  getPaymentMethods: async () => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/api/v1/billing/payment-methods`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  addPaymentMethod: async (data: any) => {
    const res = await fetch(`${API_CONFIG.BILLING_API}/api/v1/billing/payment-methods`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// ============================================
// SCORING API - Score transporteur
// ============================================

export const scoringApi = {
  getScore: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.SCORING_API}/api/v1/scoring/carrier/${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getScoreHistory: async (period?: string) => {
    const carrierId = getCarrierId();
    const params = period ? `?period=${period}` : '';
    const res = await fetch(`${API_CONFIG.SCORING_API}/api/v1/scoring/carrier/${carrierId}/history${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getScoreDetails: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.SCORING_API}/api/v1/scoring/carrier/${carrierId}/details`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getBenchmark: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.SCORING_API}/api/v1/scoring/carrier/${carrierId}/benchmark`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// VIGILANCE API - Documents conformite
// ============================================

export const vigilanceApi = {
  getStatus: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.VIGILANCE_API}/api/v1/vigilance/carrier/${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getDocuments: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.VIGILANCE_API}/api/v1/vigilance/carrier/${carrierId}/documents`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  uploadDocument: async (type: string, file: File, expiryDate?: string) => {
    const carrierId = getCarrierId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (expiryDate) formData.append('expiryDate', expiryDate);

    const res = await fetch(`${API_CONFIG.VIGILANCE_API}/api/v1/vigilance/carrier/${carrierId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken() || ''}`
      },
      body: formData
    });
    return res.json();
  },

  deleteDocument: async (docId: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.VIGILANCE_API}/api/v1/vigilance/carrier/${carrierId}/documents/${docId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getAlerts: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.VIGILANCE_API}/api/v1/vigilance/carrier/${carrierId}/alerts`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

// ============================================
// PALETTES API - Gestion palettes Europe
// ============================================

export const palettesApi = {
  getBalance: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.PALETTES_API}/api/v1/palettes/balance/${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getTransactions: async (filters?: { dateFrom?: string; dateTo?: string }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId, ...filters as any });
    const res = await fetch(`${API_CONFIG.PALETTES_API}/api/v1/palettes/transactions?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createExchange: async (data: { type: 'give' | 'take'; quantity: number; partnerId: string; orderId?: string }) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.PALETTES_API}/api/v1/palettes/exchanges`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, carrierId })
    });
    return res.json();
  }
};

// ============================================
// AFFRET.IA API - Bourse de fret
// ============================================

export const affretIaApi = {
  // Liste des offres disponibles sur la bourse
  getOffers: async (filters?: { origin?: string; destination?: string; date?: string; type?: string }) => {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/bourse/offers?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getOffer: async (id: string) => {
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/bourse/offers/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Soumettre une proposition
  submitProposal: async (offerId: string, data: { price: number; availableDate: string; message?: string }) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/bourse/offers/${offerId}/proposals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, carrierId })
    });
    return res.json();
  },

  // Mes propositions
  getMyProposals: async (status?: string) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId });
    if (status) params.append('status', status);
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/bourse/proposals?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Retirer une proposition
  withdrawProposal: async (proposalId: string) => {
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/bourse/proposals/${proposalId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Confirmer attribution
  confirmAttribution: async (proposalId: string) => {
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/bourse/proposals/${proposalId}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Recherche intelligente
  searchMatches: async (criteria: { origin: string; destination: string; dateFrom: string; dateTo?: string }) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/bourse/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...criteria, carrierId })
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
      body: JSON.stringify({ message, conversationId, context: 'transporter' })
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

  updatePosition: async (orderId: string, position: { lat: number; lng: number; speed?: number; heading?: number }) => {
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/order/${orderId}/position`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...position, timestamp: new Date().toISOString() })
    });
    return res.json();
  },

  updateStatus: async (orderId: string, status: string, data?: { location?: { lat: number; lng: number }; notes?: string }) => {
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/order/${orderId}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, ...data, timestamp: new Date().toISOString() })
    });
    return res.json();
  },

  getActiveDeliveries: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/active?carrierId=${carrierId}`, {
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
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/status?carrierId=${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getConnections: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/connections?carrierId=${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  syncNow: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ carrierId })
    });
    return res.json();
  },

  getHistory: async (limit?: number) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId });
    if (limit) params.append('limit', limit.toString());
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/history?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getErrors: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.TMS_SYNC_API}/api/v1/tms/errors?carrierId=${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

export default planningApi;
