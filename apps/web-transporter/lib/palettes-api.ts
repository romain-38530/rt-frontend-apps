/**
 * Palettes Order API - Suivi palettes sur commandes
 */
import { API_CONFIG } from './api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    'Authorization': `Bearer ${token || ''}`,
    'Content-Type': 'application/json'
  };
};

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

export interface PalletExchangeData {
  quantity: number;
  palletType: 'EURO_EPAL' | 'EURO_EPAL_2' | 'DEMI_PALETTE' | 'PALETTE_PERDUE';
  givenBySender?: number;
  takenByCarrier?: number;
  givenByCarrier?: number;
  receivedByRecipient?: number;
  senderId?: string;
  senderName?: string;
  senderType?: string;
  carrierId?: string;
  carrierName?: string;
  recipientId?: string;
  recipientName?: string;
  recipientType?: string;
  confirmedBy: string;
  notes?: string;
}

export interface PalletTracking {
  enabled: boolean;
  palletType?: string;
  expectedQuantity?: number;
  pickup?: {
    quantity: number;
    palletType: string;
    givenBySender: number;
    takenByCarrier: number;
    chequeId?: string;
    confirmedAt: string;
    confirmedBy: string;
  };
  delivery?: {
    quantity: number;
    palletType: string;
    givenByCarrier: number;
    receivedByRecipient: number;
    status: 'confirmed' | 'disputed';
    confirmedAt: string;
    confirmedBy: string;
  };
  balance: number;
  settled: boolean;
  settledAt?: string;
}

export const palettesOrderApi = {
  getStatus: async (orderId: string) => {
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/palettes/${orderId}/status`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  confirmPickup: async (orderId: string, data: PalletExchangeData) => {
    const carrierId = getCarrierId();
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/palettes/${orderId}/pickup`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        carrierId: data.carrierId || carrierId,
        carrierName: data.carrierName || user.companyName || 'Transporteur',
        confirmedBy: data.confirmedBy || user.name || 'Chauffeur'
      })
    });
    return res.json();
  },

  confirmDelivery: async (orderId: string, data: PalletExchangeData) => {
    const carrierId = getCarrierId();
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/palettes/${orderId}/delivery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        carrierId: data.carrierId || carrierId,
        carrierName: data.carrierName || user.companyName || 'Transporteur',
        confirmedBy: data.confirmedBy || user.name || 'Chauffeur'
      })
    });
    return res.json();
  },

  getCompanyBalance: async (companyId?: string) => {
    const id = companyId || getCarrierId();
    const res = await fetch(`${API_CONFIG.ORDERS_API}/api/v1/palettes/company/${id}/balance`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
