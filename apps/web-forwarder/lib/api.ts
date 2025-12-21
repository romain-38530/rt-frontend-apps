// API Client for web-forwarder
import { getAuthToken, getForwarderId, getCompanyId } from './auth';

// Base URLs from environment variables with CloudFront HTTPS fallbacks
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://ddaywxps9n701.cloudfront.net';
const PLANNING_API_URL = process.env.NEXT_PUBLIC_PLANNING_API_URL || 'https://dpw23bg2dclr1.cloudfront.net';
const ORDERS_API_URL = process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net';
const TRACKING_API_URL = process.env.NEXT_PUBLIC_TRACKING_API_URL || 'https://d2mn43ccfvt3ub.cloudfront.net';
const NOTIFICATIONS_API_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || 'https://d2t9age53em7o5.cloudfront.net';
const ECMR_API_URL = process.env.NEXT_PUBLIC_ECMR_API_URL || 'https://d28q05cx5hmg9q.cloudfront.net';
const STORAGE_MARKET_API_URL = process.env.NEXT_PUBLIC_STORAGE_MARKET_API_URL || 'https://d1ea8wbaf6ws9i.cloudfront.net';
const TRAINING_API_URL = process.env.NEXT_PUBLIC_TRAINING_API_URL || 'https://d39f1h56c4jwz4.cloudfront.net';
const SUBSCRIPTIONS_API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net';
const PALETTES_API_URL = process.env.NEXT_PUBLIC_PALETTES_API_URL || 'https://d2o4ng8nutcmou.cloudfront.net';
const CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://de1913kh0ya48.cloudfront.net';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Planning API
export const planningApi = {
  getSites: async () => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${PLANNING_API_URL}/api/planning/sites?forwarderId=${forwarderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getSlots: async (siteId: string, date?: string) => {
    const params = new URLSearchParams({ siteId });
    if (date) params.append('date', date);
    const res = await fetch(`${PLANNING_API_URL}/api/planning/slots?${params}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  bookSlot: async (slotId: string, data: any) => {
    const res = await fetch(`${PLANNING_API_URL}/api/planning/slots/${slotId}/book`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// Orders API
export const ordersApi = {
  list: async () => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${ORDERS_API_URL}/api/orders?forwarderId=${forwarderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`${ORDERS_API_URL}/api/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  create: async (orderData: any) => {
    const res = await fetch(`${ORDERS_API_URL}/api/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    return res.json();
  },
  update: async (id: string, orderData: any) => {
    const res = await fetch(`${ORDERS_API_URL}/api/orders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    return res.json();
  },
};

// Tracking API
export const trackingApi = {
  getOrderTracking: async (orderId: string) => {
    const res = await fetch(`${TRACKING_API_URL}/api/tracking/order/${orderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getShipments: async () => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${TRACKING_API_URL}/api/tracking/shipments?forwarderId=${forwarderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Notifications API
export const notificationsApi = {
  list: async () => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${NOTIFICATIONS_API_URL}/api/notifications?userId=${forwarderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  markAsRead: async (id: string) => {
    const res = await fetch(`${NOTIFICATIONS_API_URL}/api/notifications/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// eCMR API
export const ecmrApi = {
  list: async () => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${ECMR_API_URL}/api/v1/ecmr?forwarderId=${forwarderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`${ECMR_API_URL}/api/v1/ecmr/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  sign: async (id: string, data: { party: 'shipper' | 'carrier' | 'consignee'; signatureData: string; signerName: string }) => {
    const res = await fetch(`${ECMR_API_URL}/api/v1/ecmr/${id}/sign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  downloadPdf: async (id: string): Promise<Blob> => {
    const res = await fetch(`${ECMR_API_URL}/api/v1/ecmr/${id}/pdf`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to download PDF: ${res.status}`);
    }
    return res.blob();
  },
  history: async (id: string) => {
    const res = await fetch(`${ECMR_API_URL}/api/v1/ecmr/${id}/history`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Storage Market API
export const storageMarketApi = {
  listSpaces: async () => {
    const res = await fetch(`${STORAGE_MARKET_API_URL}/api/storage/spaces`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  bookSpace: async (spaceId: string, bookingData: any) => {
    const res = await fetch(`${STORAGE_MARKET_API_URL}/api/storage/spaces/${spaceId}/book`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });
    return res.json();
  },
};

// Training API
export const trainingApi = {
  getModules: async () => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${TRAINING_API_URL}/api/training/modules?userId=${forwarderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  updateProgress: async (moduleId: string, progress: number) => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${TRAINING_API_URL}/api/training/modules/${moduleId}/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: forwarderId, progress }),
    });
    return res.json();
  },
};

// Subscriptions API
export const subscriptionsApi = {
  getCurrentPlan: async () => {
    const companyId = getCompanyId();
    const res = await fetch(`${SUBSCRIPTIONS_API_URL}/api/subscriptions/current?companyId=${companyId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getPlans: async () => {
    const res = await fetch(`${SUBSCRIPTIONS_API_URL}/api/subscriptions/plans`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  changePlan: async (planId: string) => {
    const companyId = getCompanyId();
    const res = await fetch(`${SUBSCRIPTIONS_API_URL}/api/subscriptions/change`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ companyId, planId }),
    });
    return res.json();
  },
};

// Palettes API
export const palettesApi = {
  getBalance: async () => {
    const companyId = getCompanyId();
    const res = await fetch(`${PALETTES_API_URL}/api/palettes/balance?companyId=${companyId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getTransactions: async () => {
    const companyId = getCompanyId();
    const res = await fetch(`${PALETTES_API_URL}/api/palettes/transactions?companyId=${companyId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Chatbot API
export const chatbotApi = {
  sendMessage: async (message: string) => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${CHATBOT_API_URL}/api/chatbot/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: forwarderId, message, context: 'forwarder' }),
    });
    return res.json();
  },
  getHistory: async () => {
    const forwarderId = getForwarderId();
    const res = await fetch(`${CHATBOT_API_URL}/api/chatbot/history?userId=${forwarderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};
