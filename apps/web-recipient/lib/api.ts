// API Client for web-recipient
import { getAuthToken, getRecipientId, getCompanyId } from './auth';

// Base URLs from environment variables with CloudFront HTTPS fallbacks
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://ddaywxps9n701.cloudfront.net';
const ORDERS_API_URL = process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net';
const TRACKING_API_URL = process.env.NEXT_PUBLIC_TRACKING_API_URL || 'https://d2mn43ccfvt3ub.cloudfront.net';
const NOTIFICATIONS_API_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || 'https://d2t9age53em7o5.cloudfront.net';
const ECMR_API_URL = process.env.NEXT_PUBLIC_ECMR_API_URL || 'https://d28q05cx5hmg9q.cloudfront.net';
const CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://de1913kh0ya48.cloudfront.net';
const SUBSCRIPTIONS_API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Orders API
export const ordersApi = {
  list: async () => {
    const recipientId = getRecipientId();
    const res = await fetch(`${ORDERS_API_URL}/api/orders?recipientId=${recipientId}`, {
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
  confirmDelivery: async (id: string, signature?: string) => {
    const res = await fetch(`${ORDERS_API_URL}/api/orders/${id}/confirm-delivery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ signature }),
    });
    return res.json();
  },
  reportIssue: async (id: string, issue: string) => {
    const res = await fetch(`${ORDERS_API_URL}/api/orders/${id}/report-issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ issue }),
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
  getDeliveryStatus: async (orderId: string) => {
    const res = await fetch(`${TRACKING_API_URL}/api/tracking/delivery/${orderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getEstimatedArrival: async (orderId: string) => {
    const res = await fetch(`${TRACKING_API_URL}/api/tracking/eta/${orderId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Notifications API
export const notificationsApi = {
  list: async () => {
    const recipientId = getRecipientId();
    const res = await fetch(`${NOTIFICATIONS_API_URL}/api/notifications?userId=${recipientId}`, {
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
  markAllAsRead: async () => {
    const recipientId = getRecipientId();
    const res = await fetch(`${NOTIFICATIONS_API_URL}/api/notifications/mark-all-read`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: recipientId }),
    });
    return res.json();
  },
};

// eCMR API
export const ecmrApi = {
  list: async () => {
    const recipientId = getRecipientId();
    const res = await fetch(`${ECMR_API_URL}/api/v1/ecmr?recipientId=${recipientId}`, {
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
  sign: async (id: string, data: { party: 'consignee'; signatureData: string; signerName: string; reservations?: string }) => {
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

// Chatbot API
export const chatbotApi = {
  sendMessage: async (message: string) => {
    const recipientId = getRecipientId();
    const res = await fetch(`${CHATBOT_API_URL}/api/chatbot/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: recipientId, message, context: 'recipient' }),
    });
    return res.json();
  },
  getHistory: async () => {
    const recipientId = getRecipientId();
    const res = await fetch(`${CHATBOT_API_URL}/api/chatbot/history?userId=${recipientId}`, {
      headers: getAuthHeaders(),
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
