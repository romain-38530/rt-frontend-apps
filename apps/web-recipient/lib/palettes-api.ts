/**
 * Palettes Order API - Suivi palettes sur commandes (Recipient)
 */

const ORDERS_API_URL = process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    'Authorization': `Bearer ${token || ''}`,
    'Content-Type': 'application/json'
  };
};

export const palettesOrderApi = {
  getStatus: async (orderId: string) => {
    const res = await fetch(`${ORDERS_API_URL}/api/v1/palettes/${orderId}/status`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  confirmDelivery: async (orderId: string, data: {
    quantity: number;
    palletType: string;
    givenByCarrier: number;
    receivedByRecipient: number;
    carrierId: string;
    carrierName: string;
    recipientId: string;
    recipientName: string;
    recipientType?: string;
    confirmedBy: string;
    notes?: string;
  }) => {
    const res = await fetch(`${ORDERS_API_URL}/api/v1/palettes/${orderId}/delivery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getCompanyBalance: async (companyId: string) => {
    const res = await fetch(`${ORDERS_API_URL}/api/v1/palettes/company/${companyId}/balance`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
