/**
 * API Configuration for SYMPHONI.A Transporter Portal
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

export default planningApi;
