// API Client for Backoffice Admin
import { getAuthToken } from './auth';

// Base URLs from environment variables with CloudFront HTTPS fallbacks
// CloudFront domains from cloudfront-results.json registry
const ADMIN_GATEWAY_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://ddaywxps9n701.cloudfront.net';
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://ddaywxps9n701.cloudfront.net';
const ORDERS_API_URL = process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net';
const NOTIFICATIONS_API_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || 'https://d2t9age53em7o5.cloudfront.net';
const PLANNING_API_URL = process.env.NEXT_PUBLIC_PLANNING_API_URL || 'https://dpw23bg2dclr1.cloudfront.net';
const TRACKING_API_URL = process.env.NEXT_PUBLIC_TRACKING_API_URL || 'https://d2mn43ccfvt3ub.cloudfront.net';
const ECMR_API_URL = process.env.NEXT_PUBLIC_ECMR_API_URL || 'https://d28q05cx5hmg9q.cloudfront.net';
const BILLING_API_URL = process.env.NEXT_PUBLIC_BILLING_API_URL || 'https://d1ciol606nbfs0.cloudfront.net';
const SUBSCRIPTIONS_API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net';
const KPI_API_URL = process.env.NEXT_PUBLIC_KPI_API_URL || 'https://d57lw7v3zgfpy.cloudfront.net';
const TRAINING_API_URL = process.env.NEXT_PUBLIC_TRAINING_API_URL || 'https://d39f1h56c4jwz4.cloudfront.net';
const CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://de1913kh0ya48.cloudfront.net';
const SALES_AGENTS_API_URL = process.env.NEXT_PUBLIC_SALES_AGENTS_API_URL || 'https://d3tr75b4e76icu.cloudfront.net';
const VIGILANCE_API_URL = process.env.NEXT_PUBLIC_VIGILANCE_API_URL || 'https://d23m3oa6ef3tr1.cloudfront.net';
const SCORING_API_URL = process.env.NEXT_PUBLIC_SCORING_API_URL || 'https://d1uyscmpcwc65a.cloudfront.net';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken() || (typeof window !== 'undefined' ? localStorage.getItem('admin_jwt') : null);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Admin Gateway API (Organizations, Users)
export const adminApi = {
  // Organizations
  getOrgs: async (query?: string) => {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await fetch(`${ADMIN_GATEWAY_URL}/admin/orgs${params}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getOrg: async (id: string) => {
    const res = await fetch(`${ADMIN_GATEWAY_URL}/admin/orgs/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  createOrg: async (data: any) => {
    const res = await fetch(`${ADMIN_GATEWAY_URL}/admin/orgs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateOrg: async (id: string, data: any) => {
    const res = await fetch(`${ADMIN_GATEWAY_URL}/admin/orgs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  // Users
  getUsers: async (orgId?: string) => {
    const params = orgId ? `?orgId=${orgId}` : '';
    const res = await fetch(`${ADMIN_GATEWAY_URL}/admin/users${params}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getUser: async (id: string) => {
    const res = await fetch(`${ADMIN_GATEWAY_URL}/admin/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  // Invitations
  getInvitations: async (orgId: string) => {
    const res = await fetch(`${ADMIN_GATEWAY_URL}/admin/orgs/${orgId}/invitations`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  createInvitation: async (orgId: string, data: any) => {
    const res = await fetch(`${ADMIN_GATEWAY_URL}/admin/orgs/${orgId}/invitations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// KPI API
export const kpiApi = {
  getDashboard: async () => {
    const res = await fetch(`${KPI_API_URL}/api/kpi/dashboard`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getStats: async (period?: string) => {
    const params = period ? `?period=${period}` : '';
    const res = await fetch(`${KPI_API_URL}/api/kpi/stats${params}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getRevenue: async () => {
    const res = await fetch(`${KPI_API_URL}/api/kpi/revenue`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Subscriptions API (Admin)
export const subscriptionsAdminApi = {
  getAll: async (filters?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    const queryString = params.toString();
    const res = await fetch(`${SUBSCRIPTIONS_API_URL}/api/subscriptions${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`${SUBSCRIPTIONS_API_URL}/api/subscriptions/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getRevenueStats: async () => {
    const res = await fetch(`${SUBSCRIPTIONS_API_URL}/api/subscriptions/stats/revenue`, {
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
  updateSubscription: async (id: string, data: any) => {
    const res = await fetch(`${SUBSCRIPTIONS_API_URL}/api/subscriptions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// Billing API
export const billingApi = {
  getPrefacturations: async (filters?: { status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', String(filters.limit));
    const queryString = params.toString();
    const res = await fetch(`${BILLING_API_URL}/api/billing/prefacturations${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getBlocks: async (active?: boolean) => {
    const params = active !== undefined ? `?active=${active}` : '';
    const res = await fetch(`${BILLING_API_URL}/api/billing/blocks${params}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getTariffs: async () => {
    const res = await fetch(`${BILLING_API_URL}/api/billing/tariffs`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getStats: async () => {
    const res = await fetch(`${BILLING_API_URL}/api/billing/stats`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  finalize: async (prefacturationId: string) => {
    const res = await fetch(`${BILLING_API_URL}/api/billing/finalize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prefacturationId }),
    });
    return res.json();
  },
  exportERP: async (prefacturationId: string, erpConfig: any) => {
    const res = await fetch(`${BILLING_API_URL}/api/billing/export`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prefacturationId, erpConfig }),
    });
    return res.json();
  },
  block: async (data: { prefacturationId: string; type: string; reason: string }) => {
    const res = await fetch(`${BILLING_API_URL}/api/billing/block`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  unblock: async (blockId: string, reason: string) => {
    const res = await fetch(`${BILLING_API_URL}/api/billing/unblock`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ blockId, reason }),
    });
    return res.json();
  },
};

// Sales Agents API
export const salesAgentsApi = {
  getAll: async () => {
    const res = await fetch(`${SALES_AGENTS_API_URL}/api/sales-agents`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getById: async (id: string) => {
    const res = await fetch(`${SALES_AGENTS_API_URL}/api/sales-agents/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getCommissions: async (agentId?: string) => {
    const params = agentId ? `?agentId=${agentId}` : '';
    const res = await fetch(`${SALES_AGENTS_API_URL}/api/sales-agents/commissions${params}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getPerformance: async (agentId: string) => {
    const res = await fetch(`${SALES_AGENTS_API_URL}/api/sales-agents/${agentId}/performance`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Notifications API (Admin)
export const notificationsAdminApi = {
  getAll: async () => {
    const res = await fetch(`${NOTIFICATIONS_API_URL}/api/notifications/admin`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  send: async (data: { userId?: string; type: string; message: string }) => {
    const res = await fetch(`${NOTIFICATIONS_API_URL}/api/notifications/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  broadcast: async (data: { type: string; message: string; targetRole?: string }) => {
    const res = await fetch(`${NOTIFICATIONS_API_URL}/api/notifications/broadcast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// Vigilance API
export const vigilanceApi = {
  getAlerts: async () => {
    const res = await fetch(`${VIGILANCE_API_URL}/api/vigilance/alerts`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getCompanyStatus: async (companyId: string) => {
    const res = await fetch(`${VIGILANCE_API_URL}/api/vigilance/company/${companyId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Scoring API
export const scoringApi = {
  getTransporterScore: async (transporterId: string) => {
    const res = await fetch(`${SCORING_API_URL}/api/scoring/transporter/${transporterId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getLeaderboard: async () => {
    const res = await fetch(`${SCORING_API_URL}/api/scoring/leaderboard`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Training API (Admin)
export const trainingAdminApi = {
  getModules: async () => {
    const res = await fetch(`${TRAINING_API_URL}/api/training/modules`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getProgress: async (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${TRAINING_API_URL}/api/training/progress${params}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  createModule: async (data: any) => {
    const res = await fetch(`${TRAINING_API_URL}/api/training/modules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// Orders API (Admin view)
export const ordersAdminApi = {
  getAll: async (filters?: { status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', String(filters.limit));
    const queryString = params.toString();
    const res = await fetch(`${ORDERS_API_URL}/api/orders${queryString ? `?${queryString}` : ''}`, {
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
  getStats: async () => {
    const res = await fetch(`${ORDERS_API_URL}/api/orders/stats`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Tracking API (Admin view)
export const trackingAdminApi = {
  getAll: async () => {
    const res = await fetch(`${TRACKING_API_URL}/api/tracking/admin`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getLivePositions: async () => {
    const res = await fetch(`${TRACKING_API_URL}/api/tracking/live`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// eCMR API (Admin view)
export const ecmrAdminApi = {
  getAll: async () => {
    const res = await fetch(`${ECMR_API_URL}/api/ecmr/admin`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getStats: async () => {
    const res = await fetch(`${ECMR_API_URL}/api/ecmr/stats`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Chatbot API (Admin)
export const chatbotAdminApi = {
  getConversations: async () => {
    const res = await fetch(`${CHATBOT_API_URL}/api/chatbot/admin/conversations`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  getStats: async () => {
    const res = await fetch(`${CHATBOT_API_URL}/api/chatbot/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Health Check API
export const healthApi = {
  checkAll: async () => {
    const services = [
      { name: 'Admin Gateway', url: ADMIN_GATEWAY_URL },
      { name: 'Auth', url: AUTH_API_URL },
      { name: 'Orders', url: ORDERS_API_URL },
      { name: 'Notifications', url: NOTIFICATIONS_API_URL },
      { name: 'Planning', url: PLANNING_API_URL },
      { name: 'Tracking', url: TRACKING_API_URL },
      { name: 'eCMR', url: ECMR_API_URL },
      { name: 'Billing', url: BILLING_API_URL },
      { name: 'Subscriptions', url: SUBSCRIPTIONS_API_URL },
      { name: 'KPI', url: KPI_API_URL },
    ];

    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const res = await fetch(`${service.url}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          return {
            name: service.name,
            url: service.url,
            status: res.ok ? 'healthy' : 'unhealthy',
            statusCode: res.status,
          };
        } catch (error) {
          return {
            name: service.name,
            url: service.url,
            status: 'error',
            error: (error as Error).message,
          };
        }
      })
    );

    return { services: results };
  },
};
