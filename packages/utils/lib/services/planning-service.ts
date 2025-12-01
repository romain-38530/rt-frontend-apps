/**
 * Planning Service
 * Client API pour le Module Planning Chargement & Livraison
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Site {
  id: string;
  reference: string;
  name: string;
  type: string;
  address: string;
  city: string;
  region: string;
  country: string;
  geofence: { latitude: number; longitude: number; radiusMeters: number };
  operatingHours: { dayOfWeek: number; open: string; close: string }[];
  defaultSlotDuration: number;
  slotCapacity: number;
  constraints: Record<string, any>;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  active: boolean;
}

export interface Dock {
  id: string;
  siteId: string;
  name: string;
  number: number;
  type: string;
  capacity: number;
  status: string;
  hasForklift: boolean;
  hasRamp: boolean;
  hasDockLeveler: boolean;
  hasRefrigeration: boolean;
  active: boolean;
}

export interface TimeSlot {
  id: string;
  siteId: string;
  dockId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  flowType: string;
  totalCapacity: number;
  bookedCapacity: number;
  availableCapacity: number;
  status: string;
  isPriority: boolean;
  isExpress: boolean;
  isAdr: boolean;
}

export interface Booking {
  id: string;
  reference: string;
  siteId: string;
  siteName: string;
  dockId?: string;
  dockName?: string;
  slotId?: string;
  orderId?: string;
  requester: { orgId: string; orgName: string; contactName: string; contactEmail: string };
  transporter: { orgId: string; orgName: string; contactName: string; contactEmail: string };
  flowType: 'pickup' | 'delivery';
  requestedDate: string;
  requestedTimeSlot: { start: string; end: string };
  confirmedDate?: string;
  confirmedTimeSlot?: { start: string; end: string };
  cargo: { description: string; palletCount?: number; weight?: number; isAdr: boolean };
  vehicle?: { plateNumber?: string; driverName?: string };
  status: string;
  timestamps: Record<string, Date>;
  metrics?: { waitTimeMinutes?: number; dockTimeMinutes?: number; totalTimeMinutes?: number };
}

export interface DriverCheckin {
  id: string;
  bookingId: string;
  bookingReference: string;
  siteId: string;
  driverName: string;
  plateNumber: string;
  status: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  assignedDockId?: string;
  assignedDockName?: string;
}

export interface ECMR {
  id: string;
  reference: string;
  bookingId: string;
  sender: { name: string; address: string; city: string };
  carrier: { name: string; address: string; city: string };
  recipient: { name: string; address: string; city: string };
  goods: { description: string; quantity: number; weight: number }[];
  totalWeight: number;
  signatures: { party: string; signedBy: string; signedAt: string }[];
  status: string;
  pdfUrl?: string;
}

export interface SlotSuggestion {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  dockId: string;
  dockName: string;
  score: number;
  estimatedWaitMinutes: number;
  confidence: number;
  reasons: string[];
}

export class PlanningService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://localhost:3030';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }

      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // SITES
  // ============================================

  async getSites(params?: {
    ownerOrgId?: string;
    type?: string;
    city?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Site[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return this.request(`/api/v1/planning/sites?${query}`);
  }

  async getSite(id: string): Promise<ApiResponse<Site & { docks: Dock[] }>> {
    return this.request(`/api/v1/planning/sites/${id}`);
  }

  async createSite(data: Partial<Site>): Promise<ApiResponse<Site>> {
    return this.request('/api/v1/planning/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSite(id: string, data: Partial<Site>): Promise<ApiResponse<Site>> {
    return this.request(`/api/v1/planning/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSite(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/planning/sites/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // DOCKS
  // ============================================

  async getDocks(siteId: string, params?: {
    active?: boolean;
    type?: string;
    status?: string;
  }): Promise<ApiResponse<Dock[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return this.request(`/api/v1/planning/sites/${siteId}/docks?${query}`);
  }

  async createDock(siteId: string, data: Partial<Dock>): Promise<ApiResponse<Dock>> {
    return this.request(`/api/v1/planning/sites/${siteId}/docks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDock(id: string, data: Partial<Dock>): Promise<ApiResponse<Dock>> {
    return this.request(`/api/v1/planning/docks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateDockStatus(id: string, status: string, reason?: string): Promise<ApiResponse<Dock>> {
    return this.request(`/api/v1/planning/docks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    });
  }

  // ============================================
  // TIME SLOTS
  // ============================================

  async getSlots(params: {
    siteId?: string;
    dockId?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    flowType?: string;
  }): Promise<ApiResponse<TimeSlot[]>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
    return this.request(`/api/v1/planning/slots?${query}`);
  }

  async generateSlots(data: {
    siteId: string;
    dockId: string;
    dateFrom: string;
    dateTo: string;
    slotDuration?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<TimeSlot[]>> {
    return this.request('/api/v1/planning/slots/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async blockSlot(id: string, reason: string, blockedBy?: string): Promise<ApiResponse<TimeSlot>> {
    return this.request(`/api/v1/planning/slots/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({ reason, blockedBy }),
    });
  }

  async unblockSlot(id: string): Promise<ApiResponse<TimeSlot>> {
    return this.request(`/api/v1/planning/slots/${id}/unblock`, {
      method: 'PUT',
    });
  }

  async getAvailability(params: {
    siteId: string;
    dateFrom: string;
    dateTo: string;
    dockId?: string;
    flowType?: string;
  }): Promise<ApiResponse<Record<string, any[]>>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
    return this.request(`/api/v1/planning/availability?${query}`);
  }

  // ============================================
  // BOOKINGS
  // ============================================

  async getBookings(params?: {
    siteId?: string;
    transporterOrgId?: string;
    status?: string | string[];
    flowType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Booking[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => query.append(key, v));
          } else {
            query.append(key, String(value));
          }
        }
      });
    }
    return this.request(`/api/v1/bookings?${query}`);
  }

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request(`/api/v1/bookings/${id}`);
  }

  async createBooking(data: Partial<Booking>): Promise<ApiResponse<Booking>> {
    return this.request('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async proposeAlternative(id: string, data: {
    date: string;
    timeSlot: { start: string; end: string };
    message?: string;
    proposedBy: string;
  }): Promise<ApiResponse<Booking>> {
    return this.request(`/api/v1/bookings/${id}/propose`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmBooking(id: string, data?: {
    slotId?: string;
    dockId?: string;
    confirmedBy?: string;
    notes?: string;
  }): Promise<ApiResponse<Booking>> {
    return this.request(`/api/v1/bookings/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async refuseBooking(id: string, reason: string, refusedBy?: string): Promise<ApiResponse<Booking>> {
    return this.request(`/api/v1/bookings/${id}/refuse`, {
      method: 'POST',
      body: JSON.stringify({ reason, refusedBy }),
    });
  }

  async cancelBooking(id: string, reason: string, cancelledBy?: string): Promise<ApiResponse<Booking>> {
    return this.request(`/api/v1/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, cancelledBy }),
    });
  }

  async rescheduleBooking(id: string, data: {
    newDate?: string;
    newTimeSlot?: { start: string; end: string };
    newSlotId?: string;
    reason?: string;
    rescheduledBy?: string;
  }): Promise<ApiResponse<Booking>> {
    return this.request(`/api/v1/bookings/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getTodayBookings(siteId: string): Promise<ApiResponse<Booking[]>> {
    return this.request(`/api/v1/bookings/today/${siteId}`);
  }

  async getPendingBookings(siteId: string): Promise<ApiResponse<Booking[]>> {
    return this.request(`/api/v1/bookings/pending/${siteId}`);
  }

  // ============================================
  // DRIVER CHECK-IN
  // ============================================

  async driverCheckin(data: {
    bookingId?: string;
    checkinCode?: string;
    driverName: string;
    driverPhone?: string;
    plateNumber: string;
    trailerNumber?: string;
    location?: { latitude: number; longitude: number; accuracy: number };
    checkinMode: 'app' | 'qr_code' | 'kiosk' | 'manual';
  }): Promise<ApiResponse<{ checkin: DriverCheckin; booking: Booking; instructions: any; queue: any }>> {
    return this.request('/api/v1/driver/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDriverStatus(bookingId: string): Promise<ApiResponse<DriverCheckin>> {
    return this.request(`/api/v1/driver/status/${bookingId}`);
  }

  async getDriverQueue(siteId: string, status?: string): Promise<ApiResponse<DriverCheckin[]>> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/v1/driver/queue/${siteId}${query}`);
  }

  async callDriver(checkinId: string, dockId: string): Promise<ApiResponse<DriverCheckin>> {
    return this.request(`/api/v1/driver/call/${checkinId}`, {
      method: 'POST',
      body: JSON.stringify({ dockId }),
    });
  }

  async driverArrivedAtDock(checkinId: string): Promise<ApiResponse<DriverCheckin>> {
    return this.request(`/api/v1/driver/arrive-dock/${checkinId}`, {
      method: 'POST',
    });
  }

  async startLoading(checkinId: string): Promise<ApiResponse<DriverCheckin>> {
    return this.request(`/api/v1/driver/start-loading/${checkinId}`, {
      method: 'POST',
    });
  }

  async endLoading(checkinId: string, data?: { palletCount?: number; weight?: number }): Promise<ApiResponse<DriverCheckin>> {
    return this.request(`/api/v1/driver/end-loading/${checkinId}`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async driverCheckout(checkinId: string): Promise<ApiResponse<DriverCheckin>> {
    return this.request(`/api/v1/driver/checkout/${checkinId}`, {
      method: 'POST',
    });
  }

  async sendGeofenceEvent(data: {
    bookingId: string;
    eventType: 'enter' | 'exit';
    location: { latitude: number; longitude: number };
  }): Promise<ApiResponse<any>> {
    return this.request('/api/v1/driver/geofence-event', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // eCMR
  // ============================================

  async getECMRs(params?: {
    status?: string;
    bookingId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ECMR[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return this.request(`/api/v1/ecmr?${query}`);
  }

  async getECMR(id: string): Promise<ApiResponse<ECMR>> {
    return this.request(`/api/v1/ecmr/${id}`);
  }

  async createECMR(data: { bookingId: string } & Partial<ECMR>): Promise<ApiResponse<ECMR>> {
    return this.request('/api/v1/ecmr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateECMR(id: string, data: Partial<ECMR>): Promise<ApiResponse<ECMR>> {
    return this.request(`/api/v1/ecmr/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async signECMR(id: string, data: {
    party: 'sender' | 'carrier' | 'recipient';
    signedBy: string;
    signatureData: string;
    comments?: string;
    geolocation?: { latitude: number; longitude: number };
  }): Promise<ApiResponse<ECMR>> {
    return this.request(`/api/v1/ecmr/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateECMR(id: string): Promise<ApiResponse<ECMR>> {
    return this.request(`/api/v1/ecmr/${id}/validate`, {
      method: 'POST',
    });
  }

  async downloadECMR(id: string): Promise<ApiResponse<{ pdfUrl: string; generatedAt: string }>> {
    return this.request(`/api/v1/ecmr/${id}/download`);
  }

  async getECMRHistory(id: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/v1/ecmr/${id}/history`);
  }

  async addECMRPhoto(id: string, data: {
    type: 'loading' | 'unloading' | 'damage' | 'other';
    url: string;
    takenBy: string;
  }): Promise<ApiResponse<ECMR>> {
    return this.request(`/api/v1/ecmr/${id}/photo`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // AI OPTIMIZATION
  // ============================================

  async suggestSlots(data: {
    siteId: string;
    requestedDate: string;
    requestedTimeSlot?: { start: string; end: string };
    flowType?: string;
    cargo?: { isAdr?: boolean; temperatureRequired?: string };
    transporterOrgId?: string;
    maxSuggestions?: number;
  }): Promise<ApiResponse<{
    suggestions: SlotSuggestion[];
    recommendedSlotId: string;
    factors: Record<string, number>;
    reasoning: string;
  }>> {
    return this.request('/api/v1/ai/suggest-slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async optimizePlanning(siteId: string, date: string): Promise<ApiResponse<{
    assignments: any[];
    stats: Record<string, any>;
    recommendation: string;
  }>> {
    return this.request('/api/v1/ai/optimize-planning', {
      method: 'POST',
      body: JSON.stringify({ siteId, date }),
    });
  }

  async resolveConflict(slotId: string, conflictingBookingIds: string[]): Promise<ApiResponse<{
    conflictType: string;
    affectedBookings: any[];
    proposedSolutions: any[];
    autoResolved: boolean;
    recommendation: string;
  }>> {
    return this.request('/api/v1/ai/resolve-conflict', {
      method: 'POST',
      body: JSON.stringify({ slotId, conflictingBookingIds }),
    });
  }

  async predictWaitTime(siteId: string, date: string, timeSlot: { start: string; end: string }): Promise<ApiResponse<{
    predictedWaitMinutes: number;
    confidence: number;
    range: { min: number; max: number };
    basedOn: number;
    currentQueueSize: number;
    factors: string[];
  }>> {
    return this.request('/api/v1/ai/predict-wait-time', {
      method: 'POST',
      body: JSON.stringify({ siteId, date, timeSlot }),
    });
  }

  async getAIStats(siteId: string, period?: '7d' | '30d' | '90d'): Promise<ApiResponse<{
    period: { start: string; end: string };
    volumes: Record<string, number>;
    rates: Record<string, number>;
    performance: Record<string, any>;
    recommendations: string[];
  }>> {
    const query = period ? `?period=${period}` : '';
    return this.request(`/api/v1/ai/stats/${siteId}${query}`);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    requested: 'Demandé',
    proposed: 'Alternative proposée',
    confirmed: 'Confirmé',
    refused: 'Refusé',
    checked_in: 'Chauffeur arrivé',
    at_dock: 'Au quai',
    loading: 'Chargement',
    completed: 'Terminé',
    no_show: 'Non présenté',
    cancelled: 'Annulé',
  };
  return labels[status] || status;
}

export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    requested: '#f59e0b',
    proposed: '#8b5cf6',
    confirmed: '#10b981',
    refused: '#ef4444',
    checked_in: '#3b82f6',
    at_dock: '#06b6d4',
    loading: '#6366f1',
    completed: '#22c55e',
    no_show: '#dc2626',
    cancelled: '#6b7280',
  };
  return colors[status] || '#6b7280';
}

export function getDriverStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    en_route: 'En route',
    arrived: 'Arrivé',
    waiting: 'En attente',
    called: 'Appelé',
    at_dock: 'Au quai',
    loading: 'Chargement',
    signing: 'Signature',
    completed: 'Terminé',
    departed: 'Parti',
  };
  return labels[status] || status;
}

export function getECMRStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending_sender: 'Attente expéditeur',
    pending_carrier: 'Attente transporteur',
    pending_recipient: 'Attente destinataire',
    signed: 'Signé',
    validated: 'Validé',
    disputed: 'Litige',
  };
  return labels[status] || status;
}

export function getDockStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponible',
    occupied: 'Occupé',
    maintenance: 'Maintenance',
    blocked: 'Bloqué',
  };
  return labels[status] || status;
}

export function getSlotStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponible',
    partial: 'Partiellement réservé',
    full: 'Complet',
    blocked: 'Bloqué',
  };
  return labels[status] || status;
}

// Export default instance
export default new PlanningService();
