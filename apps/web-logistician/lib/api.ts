/**
 * API Configuration for SYMPHONI.A Logistician Portal
 * Backend Services URLs
 */

import { getAuthToken } from './auth';

export const API_CONFIG = {
  // Planning Sites API - Sites, Docks, Slots, Driver Check-in
  PLANNING_API: process.env.NEXT_PUBLIC_PLANNING_API_URL || 'http://rt-planning-api-prod.eba-gbhspa2p.eu-central-1.elasticbeanstalk.com',

  // Core API - Orders, Tracking, etc.
  CORE_API: process.env.NEXT_PUBLIC_API_URL || 'http://rt-api-prod.eba-mwaprcin.eu-central-1.elasticbeanstalk.com'
};

// Helper to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken() || ''}`,
  'Content-Type': 'application/json'
});

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

export default planningApi;
