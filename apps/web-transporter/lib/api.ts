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

  // Carriers API (Référencement Transporteurs - subscriptions-contracts-eb)
  CARRIERS_API: process.env.NEXT_PUBLIC_CARRIERS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net',

  // Pricing Grids API (Grilles tarifaires LTL/FTL/Messagerie)
  PRICING_GRIDS_API: process.env.NEXT_PUBLIC_PRICING_GRIDS_API_URL || 'https://dxakwgzrkhboh.cloudfront.net',
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
// Note: Backend uses /api/orders (not /api/v1/orders)
// ============================================

export const ordersApi = {
  list: async (filters?: { status?: string; date?: string }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId, ...filters as any });
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/orders?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  get: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/orders/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  accept: async (id: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/orders/${id}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  decline: async (id: string, reason: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/orders/${id}/decline`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  updateStatus: async (id: string, status: string, data?: any) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, ...data })
    });
    return res.json();
  },

  // Mise à jour des informations chauffeur pour la borne
  updateDriverInfo: async (id: string, driverInfo: {
    driverFirstName: string;
    driverLastName: string;
    driverPhone?: string;
    tractorPlate: string;
    trailerPlate?: string;
    vehicleType?: 'semi' | 'porteur' | 'fourgon' | 'VUL' | 'autre';
  }) => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/orders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        assignedCarrier: {
          ...driverInfo,
          driverName: `${driverInfo.driverFirstName} ${driverInfo.driverLastName}`.trim(),
          vehiclePlate: driverInfo.tractorPlate,
          driverInfoUpdatedAt: new Date().toISOString(),
          driverInfoUpdatedBy: user.id || getCarrierId()
        }
      })
    });
    return res.json();
  },

  getTracking: async (id: string) => {
    const res = await fetch(`${API_CONFIG.TRACKING_API}/api/v1/tracking/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Order Events
  getEvents: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/orders/${orderId}/events`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Documents with S3
  getDocumentUploadUrl: async (orderId: string, data: {
    type: 'cmr' | 'bl' | 'pod' | 'invoice' | 'photo' | 'damage_report' | 'other';
    fileName: string;
    contentType: string;
  }) => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/documents/${orderId}/upload-url`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        uploadedBy: {
          id: user.id || getCarrierId(),
          name: user.name || user.companyName || 'Transporteur',
          role: 'carrier'
        }
      })
    });
    return res.json();
  },

  uploadToS3: async (uploadUrl: string, file: File): Promise<boolean> => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    return res.ok;
  },

  confirmDocumentUpload: async (orderId: string, data: {
    type: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    s3Key: string;
    s3Bucket: string;
    location?: { latitude: number; longitude: number; address?: string };
    notes?: string;
  }) => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/documents/${orderId}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        uploadedBy: {
          id: user.id || getCarrierId(),
          name: user.name || user.companyName || 'Transporteur',
          role: 'carrier'
        }
      })
    });
    return res.json();
  },

  getOrderDocuments: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/documents/${orderId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getDocumentDownloadUrl: async (documentId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/documents/${documentId}/download-url`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  signDocument: async (documentId: string, data: {
    signedBy: string;
    signatureData: string;
    deviceInfo?: string;
  }) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/documents/${documentId}/sign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Delivery Confirmation
  confirmDelivery: async (orderId: string, data: {
    recipientName: string;
    signatureData: string;
    notes?: string;
    photos?: string[];
    location?: { latitude: number; longitude: number };
    issues?: Array<{
      type: 'damage' | 'shortage' | 'wrong_product' | 'delay' | 'other';
      description: string;
      photos?: string[];
    }>;
  }) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/delivery/${orderId}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        confirmedBy: {
          id: getCarrierId(),
          name: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').name || 'Transporteur' : 'Transporteur',
          role: 'carrier'
        }
      })
    });
    return res.json();
  },

  reportDeliveryIssue: async (orderId: string, data: {
    type: 'damage' | 'shortage' | 'wrong_product' | 'delay' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    photos?: string[];
    location?: { latitude: number; longitude: number };
  }) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/delivery/${orderId}/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        reportedBy: {
          id: getCarrierId(),
          name: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').name || 'Transporteur' : 'Transporteur',
          role: 'carrier'
        }
      })
    });
    return res.json();
  },

  // Get orders with pending documents (for Documents module)
  getPendingDocuments: async () => {
    const carrierId = getCarrierId();
    // Get orders that are delivered but missing documents
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/orders?carrierId=${carrierId}&status=delivered,completed`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    // Filter orders that have missing documents
    const orders = data.data || data.orders || [];
    return orders.filter((order: any) => {
      const docs = order.documentIds || [];
      const hasPoD = docs.some((d: any) => d.type === 'pod');
      const hasCmr = docs.some((d: any) => d.type === 'cmr');
      return !hasPoD || !hasCmr;
    }).map((order: any) => {
      const docs = order.documentIds || [];
      const missingDocs: string[] = [];
      if (!docs.some((d: any) => d.type === 'pod')) missingDocs.push('pod');
      if (!docs.some((d: any) => d.type === 'cmr')) missingDocs.push('cmr');
      if (!docs.some((d: any) => d.type === 'bl')) missingDocs.push('bl');

      return {
        id: order._id || order.id,
        reference: order.reference,
        route: `${order.pickupAddress?.city || ''} → ${order.deliveryAddress?.city || ''}`,
        date: order.dates?.deliveryDate || order.createdAt,
        missingDocs
      };
    });
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

  sign: async (id: string, data: { party: 'shipper' | 'carrier' | 'consignee'; signatureData: string; signerName: string; reservations?: string }) => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/sign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
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

  downloadPdf: async (id: string): Promise<Blob> => {
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/${id}/pdf`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to download PDF: ${res.status}`);
    }
    return res.blob();
  },

  getPendingSignatures: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.ECMR_API}/api/v1/ecmr/pending?carrierId=${carrierId}`, {
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
// NOTIFICATIONS API
// ============================================

export const notificationsApi = {
  list: async (filters?: { read?: boolean; type?: string }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ userId: carrierId, ...filters as any });
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getUnreadCount: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/unread-count?userId=${carrierId}`, {
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
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.NOTIFICATIONS_API}/api/v1/notifications/mark-all-read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: carrierId })
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
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/affretia/bourse?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getOffer: async (id: string) => {
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/affretia/session/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Soumettre une proposition via la bourse
  submitProposal: async (sessionId: string, data: { price: number; availableDate: string; message?: string }) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/affretia/bourse/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        sessionId,
        carrierId,
        carrierName: localStorage.getItem('carrierName') || 'Transporteur',
        proposedPrice: data.price,
        estimatedPickupDate: data.availableDate,
        message: data.message,
        source: 'bourse'
      })
    });
    return res.json();
  },

  // Mes propositions
  getMyProposals: async (status?: string) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId });
    if (status) params.append('status', status);
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/affretia/proposals/carrier/${carrierId}?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Retirer une proposition
  withdrawProposal: async (proposalId: string) => {
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/affretia/proposals/${proposalId}/withdraw`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Confirmer attribution
  confirmAttribution: async (proposalId: string) => {
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/affretia/proposals/${proposalId}/confirm`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Recherche intelligente
  searchMatches: async (criteria: { origin: string; destination: string; dateFrom: string; dateTo?: string }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams(criteria as any);
    const res = await fetch(`${API_CONFIG.AFFRET_IA_API}/api/v1/affretia/bourse?${params}`, {
      headers: getAuthHeaders()
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
// Note: Backend uses /api/documents (not /api/v1/documents)
// ============================================

export const documentsApi = {
  list: async (filters?: { type?: string; orderId?: string }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId, ...filters as any });
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/documents?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  get: async (id: string) => {
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/documents/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  upload: async (file: File, metadata: { type: string; orderId?: string; description?: string }) => {
    const carrierId = getCarrierId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', metadata.type);
    formData.append('carrierId', carrierId);
    if (metadata.orderId) formData.append('orderId', metadata.orderId);
    if (metadata.description) formData.append('description', metadata.description);

    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken() || ''}`
      },
      body: formData
    });
    return res.json();
  },

  download: async (id: string) => {
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/documents/${id}/download`, {
      headers: getAuthHeaders()
    });
    return res.blob();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Get documents for a specific order (inter-module with Orders)
  getByOrder: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.DOCUMENTS_API}/api/documents?orderId=${orderId}`, {
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

// ============================================
// PRE-INVOICES API - Prefacturation consolidee
// ============================================

export interface PreInvoiceLine {
  orderId: string;
  orderReference: string;
  pickupCity: string;
  deliveryCity: string;
  deliveryDate: string;
  baseAmount: number;
  waitingAmount: number;
  fuelSurcharge: number;
  tolls: number;
  delayPenalty: number;
  totalAmount: number;
  cmrValidated: boolean;
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
  carrierSiret: string;
  lines: PreInvoiceLine[];
  totals: {
    baseAmount: number;
    waitingAmount: number;
    fuelSurcharge: number;
    tolls: number;
    delayPenalty: number;
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
  };
  status: 'pending' | 'sent_to_industrial' | 'validated_industrial' | 'invoice_uploaded' | 'invoice_accepted' | 'invoice_rejected' | 'payment_pending' | 'paid' | 'disputed';
  carrierInvoice?: {
    uploadedAt: string;
    fileName: string;
    s3Key: string;
    invoiceNumber: string;
    invoiceAmount: number;
    matchScore: number;
    discrepancies: Array<{ field: string; expected: any; received: any }>;
    status: 'pending_review' | 'accepted' | 'rejected';
    rejectionReason?: string;
  };
  payment?: {
    dueDate: string;
    paymentTermDays: number;
    daysRemaining?: number;
    paidAt?: string;
    paymentReference?: string;
    paidAmount?: number;
    bankDetails?: {
      iban: string;
      bic: string;
      bankName: string;
      accountHolder: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PreInvoiceStats {
  total: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  pendingValidation: number;
  awaitingPayment: number;
  paid: number;
}

export const preinvoicesApi = {
  /**
   * Liste des prefactures du transporteur
   */
  list: async (filters?: { industrialId?: string; status?: string; month?: number; year?: number }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId });
    if (filters?.industrialId) params.append('industrialId', filters.industrialId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());

    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Statistiques prefactures du transporteur
   */
  getStats: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/stats?carrierId=${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Detail d'une prefacture
   */
  get: async (preInvoiceId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/${preInvoiceId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Upload facture transporteur (pre-signed URL)
   */
  getInvoiceUploadUrl: async (preInvoiceId: string, data: { fileName: string; contentType: string }) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/${preInvoiceId}/invoice/upload-url`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Upload fichier vers S3
   */
  uploadToS3: async (uploadUrl: string, file: File): Promise<boolean> => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    return res.ok;
  },

  /**
   * Confirmer upload facture transporteur
   */
  confirmInvoiceUpload: async (preInvoiceId: string, data: {
    fileName: string;
    s3Key: string;
    invoiceNumber: string;
    invoiceAmount: number;
  }) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/${preInvoiceId}/invoice`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Telecharger facture transporteur
   */
  getInvoiceDownloadUrl: async (preInvoiceId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/${preInvoiceId}/invoice/download-url`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Contester une prefacture
   */
  dispute: async (preInvoiceId: string, data: {
    reason: string;
    details?: string;
    category?: 'price' | 'quantity' | 'service' | 'damage' | 'delay' | 'other';
    amountDisputed?: number;
    documents?: string[];
  }) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/${preInvoiceId}/dispute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Valider une prefacture (accepter les montants)
   */
  validate: async (preInvoiceId: string, data: {
    comment?: string;
    acceptedAmount?: number;
  }) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/${preInvoiceId}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Lister les contestations du transporteur
   */
  getDisputes: async (filters?: { status?: string; month?: number; year?: number }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());

    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/disputes?${params}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Repondre a une contestation (ajouter un message)
   */
  addDisputeMessage: async (preInvoiceId: string, data: { message: string; documents?: string[] }) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/${preInvoiceId}/dispute/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Exporter les prefactures en CSV
   */
  exportCsv: async (filters?: { month?: number; year?: number }) => {
    const carrierId = getCarrierId();
    const params = new URLSearchParams({ carrierId });
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());

    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/preinvoices/export?${params}`, {
      headers: getAuthHeaders()
    });
    return res.text();
  }
};


// ============================================
// CARRIERS API - Référencement Transporteurs
// Connexion avec le backend authz-eb pour:
// - Profil transporteur et statut de référencement
// - Documents de conformité avec S3 et OCR
// - Alertes de vigilance
// - Performance et scoring
// - Liste des industriels partenaires
// ============================================

export const carriersApi = {
  // === PROFIL TRANSPORTEUR ===

  /** Récupérer son profil transporteur avec tous les détails */
  getMyProfile: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Mettre à jour son profil */
  updateProfile: async (data: {
    companyName?: string;
    contact?: { name?: string; email?: string; phone?: string };
    address?: { street?: string; city?: string; postalCode?: string; country?: string };
    fleet?: { trucks?: number; trailers?: number; drivers?: number };
    certifications?: string[];
    serviceZones?: string[];
  }) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // === RÉFÉRENCEMENT PAR INDUSTRIELS ===

  /** Liste des industriels qui m'ont référencé */
  getMyReferencings: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/referencings`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Détail du référencement avec un industriel */
  getReferencingDetails: async (industrialId: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/referencings/${industrialId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Accepter une invitation de référencement */
  acceptInvitation: async (invitationId: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Refuser une invitation de référencement */
  declineInvitation: async (invitationId: string, reason?: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/invitations/${invitationId}/decline`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  // === DOCUMENTS DE CONFORMITÉ AVEC S3 + OCR ===

  /** Liste de mes documents de conformité */
  getDocuments: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/documents`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Obtenir une URL présignée pour upload S3 */
  getDocumentUploadUrl: async (params: {
    type: 'kbis' | 'urssaf' | 'insurance' | 'license' | 'identity' | 'rib' | 'capacite_financiere' | 'other';
    fileName: string;
    contentType: string;
  }) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/documents/upload-url`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  },

  /** Upload vers S3 avec URL présignée */
  uploadToS3: async (uploadUrl: string, file: File): Promise<boolean> => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    return res.ok;
  },

  /** Confirmer l'upload et déclencher l'OCR */
  confirmDocumentUpload: async (params: {
    type: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    s3Key: string;
  }) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/documents/confirm-upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  },

  /** Upload complet: URL + S3 + confirm + OCR auto */
  uploadDocument: async (params: {
    type: 'kbis' | 'urssaf' | 'insurance' | 'license' | 'identity' | 'rib' | 'capacite_financiere' | 'other';
    file: File;
  }) => {
    // 1. Obtenir l'URL présignée
    const { uploadUrl, s3Key, bucket } = await carriersApi.getDocumentUploadUrl({
      type: params.type,
      fileName: params.file.name,
      contentType: params.file.type
    });

    // 2. Upload vers S3
    const uploadSuccess = await carriersApi.uploadToS3(uploadUrl, params.file);
    if (!uploadSuccess) {
      throw new Error('Échec upload S3');
    }

    // 3. Confirmer et déclencher OCR
    const result = await carriersApi.confirmDocumentUpload({
      type: params.type,
      fileName: s3Key.split('/').pop() || params.file.name,
      originalName: params.file.name,
      mimeType: params.file.type,
      fileSize: params.file.size,
      s3Key
    });

    return result;
  },

  /** Analyser un document avec OCR (Textract) */
  analyzeDocument: async (documentId: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/documents/${documentId}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Définir manuellement la date d'expiration */
  setDocumentExpiry: async (documentId: string, expiryDate: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/documents/${documentId}/set-expiry`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ expiryDate })
    });
    return res.json();
  },

  /** Télécharger un document */
  getDocumentDownloadUrl: async (documentId: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/documents/${documentId}/download`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Supprimer un document */
  deleteDocument: async (documentId: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // === VIGILANCE & ALERTES ===

  /** Statut de conformité global */
  getVigilanceStatus: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/vigilance`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Alertes de vigilance (documents expirés ou bientôt) */
  getVigilanceAlerts: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/vigilance/alerts`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // === PERFORMANCE & SCORING ===

  /** Score et performance globale */
  getPerformance: async (params?: { period?: string; industrialId?: string }) => {
    const carrierId = getCarrierId();
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.append('period', params.period);
    if (params?.industrialId) searchParams.append('industrialId', params.industrialId);
    const query = searchParams.toString() ? `?${searchParams}` : '';

    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/performance${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Historique des performances */
  getPerformanceHistory: async (params?: { period?: string; limit?: number }) => {
    const carrierId = getCarrierId();
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.append('period', params.period);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString() ? `?${searchParams}` : '';

    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/performance/history${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Score détaillé par critère */
  getScoreDetails: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/score/details`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // === ÉVÉNEMENTS & HISTORIQUE ===

  /** Historique des événements (référencements, upgrades, etc.) */
  getEvents: async (params?: { type?: string; limit?: number }) => {
    const carrierId = getCarrierId();
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString() ? `?${searchParams}` : '';

    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/events${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // === ONBOARDING ===

  /** Statut d'onboarding */
  getOnboardingStatus: async () => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/onboarding`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /** Compléter une étape d'onboarding */
  completeOnboardingStep: async (step: string) => {
    const carrierId = getCarrierId();
    const res = await fetch(`${API_CONFIG.CARRIERS_API}/api/carriers/${carrierId}/onboarding/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ step })
    });
    return res.json();
  }
};

// ============================================
// PRICING GRIDS API - Grilles Tarifaires (Inter-univers)
// ============================================

export interface PricingGridZone {
  zoneId: string;
  zoneName: string;
  origin: string;
  destination: string;
  distance?: number;
  basePrice: number;
  negotiatedPrice?: number;
  lastUpdated?: string;
  status: 'active' | 'pending' | 'expired';
}

export interface FuelIndexation {
  enabled: boolean;
  referenceIndex: number;
  referenceDate: string;
  indexType: 'CNR' | 'TICPE' | 'CUSTOM';
  adjustmentFormula: 'LINEAR' | 'STEPPED' | 'PERCENTAGE';
  adjustmentThreshold: number;
  maxAdjustment: number;
  currentIndex?: number;
  currentIndexDate?: string;
}

export interface AnnexFees {
  handling: {
    enabled: boolean;
    loadingFee?: number;
    unloadingFee?: number;
    palletHandling?: number;
    waitingHourlyRate?: number;
  };
  delivery: {
    enabled: boolean;
    tailgateFee?: number;
    appointmentFee?: number;
    expressDeliveryFee?: number;
    weekendFee?: number;
    nightDeliveryFee?: number;
    multiDropFee?: number;
  };
  administrative: {
    enabled: boolean;
    documentFee?: number;
    customsFee?: number;
    insuranceFeePercent?: number;
    adValorem?: number;
  };
  special: {
    enabled: boolean;
    adrFee?: number;
    temperatureControlFee?: number;
    fragileHandlingFee?: number;
    oversizeFee?: number;
    heavyLoadFee?: number;
  };
  custom?: Array<{
    name: string;
    code: string;
    type: 'fixed' | 'percentage' | 'per_unit';
    value: number;
    unit?: string;
    mandatory: boolean;
    conditions?: string;
  }>;
}

export interface PricingGrid {
  id: string;
  gridId: string;
  industrialId: string;
  industrialName: string;
  carrierId: string;
  carrierName: string;
  gridType: 'FTL' | 'LTL' | 'MESSAGERIE' | 'EXPRESS' | 'COMBINED';
  name: string;
  description?: string;
  zones: PricingGridZone[];
  fuelIndexation?: FuelIndexation;
  annexFees?: AnnexFees;
  validFrom: string;
  validUntil: string;
  status: 'draft' | 'active' | 'suspended' | 'expired';
  volumeDiscounts?: Array<{
    threshold: number;
    discount: number;
  }>;
  paymentTerms?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricingGridStats {
  totalGrids: number;
  activeGrids: number;
  byIndustrial: Array<{
    _id: string;
    industrialName: string;
    totalGrids: number;
    activeGrids: number;
  }>;
}

export const pricingGridsApi = {
  /**
   * Liste des grilles tarifaires assignées au transporteur
   * (Créées par les industriels)
   */
  getMyGrids: async (params?: { status?: string; page?: number; limit?: number }) => {
    const carrierId = getCarrierId();
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString() ? `?${searchParams}` : '';

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/api/pricing-grids/carrier/${carrierId}${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Détail d'une grille tarifaire
   */
  getGrid: async (gridId: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/api/pricing-grids/${gridId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Proposer une mise à jour de tarifs à l'industriel
   * (Le transporteur remplit les prix dans le squelette créé par l'industriel)
   */
  proposeUpdate: async (gridId: string, data: {
    proposedZones: Array<{
      zoneId: string;
      proposedPrice: number;
      justification?: string;
    }>;
    message?: string;
    validUntil?: string;
  }) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/api/pricing-grids/${gridId}/propose-update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Liste des demandes de tarifs reçues (envoyées par les industriels)
   */
  getReceivedRequests: async (params?: { status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString() ? `?${searchParams}` : '';

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/requests/received${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Détail d'une demande de tarif
   */
  getRequest: async (requestId: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/requests/${requestId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Soumettre une proposition tarifaire en réponse à une demande
   */
  submitProposal: async (data: {
    requestId: string;
    configId?: string;
    proposedPrices: Array<{
      zoneId: string;
      zoneName?: string;
      basePrice: number;
      discountPercent?: number;
    }>;
    notes?: string;
    validUntil?: string;
    globalDiscount?: number;
  }) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Liste des propositions envoyées par le transporteur
   */
  getSentProposals: async (params?: { status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString() ? `?${searchParams}` : '';

    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals/sent${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Détail d'une proposition
   */
  getProposal: async (proposalId: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals/${proposalId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Répondre à une contre-proposition (négociation)
   */
  negotiate: async (proposalId: string, data: {
    newPrices?: Array<{ zoneId: string; price: number }>;
    message?: string;
    accept?: boolean;
  }) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/proposals/${proposalId}/negotiate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Calculer le prix total avec frais annexes et indexation gasoil
   */
  calculateTotal: async (gridId: string, data: {
    zoneId: string;
    basePrice: number;
    options?: {
      tailgate?: boolean;
      appointment?: boolean;
      weekend?: boolean;
      night?: boolean;
      adr?: boolean;
      temperatureControl?: boolean;
      express?: boolean;
    };
    weight?: number;
    palletCount?: number;
    additionalDrops?: number;
    currentFuelIndex?: number;
  }) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/api/pricing-grids/${gridId}/calculate-total`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Télécharger un fichier joint à une demande
   */
  downloadFile: async (fileId: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/files/${fileId}/download`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Historique d'indexation gasoil d'une grille
   */
  getFuelIndexationHistory: async (gridId: string) => {
    const res = await fetch(`${API_CONFIG.PRICING_GRIDS_API}/api/pricing-grids/${gridId}/fuel-indexation/history`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};

export default planningApi;
