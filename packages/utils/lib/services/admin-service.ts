/**
 * Service Admin Gateway pour SYMPHONI.A
 * Gestion centralisee de l'administration plateforme
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3020/api/v1';

export interface AdminServiceConfig {
  baseUrl?: string;
  token?: string;
}

export class AdminService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(config?: AdminServiceConfig) {
    this.baseUrl = config?.baseUrl || API_BASE_URL;
    this.token = config?.token || null;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ USER MANAGEMENT ============

  async getUsers(params?: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
    companyId?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.role) query.set('role', params.role);
    if (params?.companyId) query.set('companyId', params.companyId);
    if (params?.search) query.set('search', params.search);
    return this.request(`/admin/users?${query}`);
  }

  async getUser(userId: string) {
    return this.request(`/admin/users/${userId}`);
  }

  async createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    roles: string[];
  }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: string, data: Record<string, unknown>) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  async activateUser(userId: string) {
    return this.request(`/admin/users/${userId}/activate`, { method: 'POST' });
  }

  async deactivateUser(userId: string) {
    return this.request(`/admin/users/${userId}/deactivate`, { method: 'POST' });
  }

  async resetUserPassword(userId: string) {
    return this.request(`/admin/users/${userId}/reset-password`, { method: 'POST' });
  }

  async getUserActivity(userId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.request(`/admin/users/${userId}/activity?${query}`);
  }

  async updateUserRoles(userId: string, roles: string[]) {
    return this.request(`/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles }),
    });
  }

  // ============ COMPANY MANAGEMENT ============

  async getCompanies(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    verified?: boolean;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    if (params?.verified !== undefined) query.set('verified', String(params.verified));
    if (params?.search) query.set('search', params.search);
    return this.request(`/admin/companies?${query}`);
  }

  async getCompany(companyId: string) {
    return this.request(`/admin/companies/${companyId}`);
  }

  async createCompany(data: {
    name: string;
    legalName: string;
    type: string;
    registrationNumber: string;
    address: Record<string, string>;
    contact: Record<string, string>;
  }) {
    return this.request('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(companyId: string, data: Record<string, unknown>) {
    return this.request(`/admin/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(companyId: string) {
    return this.request(`/admin/companies/${companyId}`, { method: 'DELETE' });
  }

  async verifyCompany(companyId: string) {
    return this.request(`/admin/companies/${companyId}/verify`, { method: 'POST' });
  }

  async suspendCompany(companyId: string, reason: string) {
    return this.request(`/admin/companies/${companyId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getCompanyBilling(companyId: string) {
    return this.request(`/admin/companies/${companyId}/billing`);
  }

  async updateCompanySubscription(companyId: string, subscriptionData: Record<string, unknown>) {
    return this.request(`/admin/companies/${companyId}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    });
  }

  async assignModulesToCompany(companyId: string, moduleIds: string[]) {
    return this.request(`/admin/companies/${companyId}/modules`, {
      method: 'PUT',
      body: JSON.stringify({ moduleIds }),
    });
  }

  // ============ SUBSCRIPTION & BILLING ============

  async getSubscriptions(params?: {
    page?: number;
    limit?: number;
    plan?: string;
    status?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.plan) query.set('plan', params.plan);
    if (params?.status) query.set('status', params.status);
    return this.request(`/admin/subscriptions?${query}`);
  }

  async getSubscription(subscriptionId: string) {
    return this.request(`/admin/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId: string, data: Record<string, unknown>) {
    return this.request(`/admin/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelSubscription(subscriptionId: string, reason: string) {
    return this.request(`/admin/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    companyId?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.companyId) query.set('companyId', params.companyId);
    return this.request(`/admin/invoices?${query}`);
  }

  async refundInvoice(invoiceId: string, amount?: number, reason?: string) {
    return this.request(`/admin/invoices/${invoiceId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  // ============ PLATFORM MONITORING ============

  async getDashboard() {
    return this.request('/admin/dashboard');
  }

  async getServicesHealth() {
    return this.request('/admin/services/health');
  }

  async getMetrics(params?: { from?: Date; to?: Date; interval?: string }) {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from.toISOString());
    if (params?.to) query.set('to', params.to.toISOString());
    if (params?.interval) query.set('interval', params.interval);
    return this.request(`/admin/metrics?${query}`);
  }

  async getLogs(params?: {
    page?: number;
    limit?: number;
    level?: string;
    service?: string;
    from?: Date;
    to?: Date;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.level) query.set('level', params.level);
    if (params?.service) query.set('service', params.service);
    if (params?.from) query.set('from', params.from.toISOString());
    if (params?.to) query.set('to', params.to.toISOString());
    return this.request(`/admin/logs?${query}`);
  }

  async getErrors(params?: { page?: number; limit?: number; resolved?: boolean }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.resolved !== undefined) query.set('resolved', String(params.resolved));
    return this.request(`/admin/errors?${query}`);
  }

  // ============ MODULE MANAGEMENT ============

  async getModules() {
    return this.request('/admin/modules');
  }

  async toggleModule(moduleId: string, enabled: boolean) {
    return this.request(`/admin/modules/${moduleId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  async getModuleUsage(moduleId: string) {
    return this.request(`/admin/modules/${moduleId}/usage`);
  }

  // ============ API KEYS ============

  async getApiKeys(params?: { page?: number; limit?: number; companyId?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.companyId) query.set('companyId', params.companyId);
    return this.request(`/admin/api-keys?${query}`);
  }

  async createApiKey(data: {
    name: string;
    companyId: string;
    permissions: string[];
    rateLimit?: number;
    expiresAt?: Date;
  }) {
    return this.request('/admin/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeApiKey(keyId: string) {
    return this.request(`/admin/api-keys/${keyId}`, { method: 'DELETE' });
  }

  // ============ INTEGRATIONS ============

  async getIntegrations(params?: { companyId?: string; type?: string }) {
    const query = new URLSearchParams();
    if (params?.companyId) query.set('companyId', params.companyId);
    if (params?.type) query.set('type', params.type);
    return this.request(`/admin/integrations?${query}`);
  }

  async configureIntegration(integrationId: string, config: Record<string, unknown>) {
    return this.request(`/admin/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  // ============ AUDIT & COMPLIANCE ============

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    companyId?: string;
    action?: string;
    resource?: string;
    from?: Date;
    to?: Date;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.userId) query.set('userId', params.userId);
    if (params?.companyId) query.set('companyId', params.companyId);
    if (params?.action) query.set('action', params.action);
    if (params?.resource) query.set('resource', params.resource);
    if (params?.from) query.set('from', params.from.toISOString());
    if (params?.to) query.set('to', params.to.toISOString());
    return this.request(`/admin/audit?${query}`);
  }

  async exportAuditLogs(params: { from: Date; to: Date; format?: 'csv' | 'json' }) {
    const query = new URLSearchParams();
    query.set('from', params.from.toISOString());
    query.set('to', params.to.toISOString());
    if (params.format) query.set('format', params.format);
    return this.request(`/admin/audit/export?${query}`);
  }

  async getGdprRequests(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    return this.request(`/admin/gdpr/requests?${query}`);
  }

  async processGdprRequest(requestId: string, response: string, approved: boolean) {
    return this.request(`/admin/gdpr/requests/${requestId}/process`, {
      method: 'POST',
      body: JSON.stringify({ response, approved }),
    });
  }

  // ============ NOTIFICATIONS & ANNOUNCEMENTS ============

  async broadcastNotification(data: {
    title: string;
    message: string;
    type: string;
    channels: string[];
    target: string;
    targetIds?: string[];
    scheduledAt?: Date;
  }) {
    return this.request('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAnnouncements(params?: { page?: number; limit?: number; active?: boolean }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.active !== undefined) query.set('active', String(params.active));
    return this.request(`/admin/announcements?${query}`);
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    type: string;
    target: string;
    targetIds?: string[];
    priority?: number;
    startDate: Date;
    endDate?: Date;
  }) {
    return this.request('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(announcementId: string, data: Record<string, unknown>) {
    return this.request(`/admin/announcements/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(announcementId: string) {
    return this.request(`/admin/announcements/${announcementId}`, { method: 'DELETE' });
  }
}

// Singleton instance
let adminServiceInstance: AdminService | null = null;

export function getAdminService(config?: AdminServiceConfig): AdminService {
  if (!adminServiceInstance) {
    adminServiceInstance = new AdminService(config);
  }
  return adminServiceInstance;
}

export function createAdminService(config?: AdminServiceConfig): AdminService {
  return new AdminService(config);
}

export default AdminService;
