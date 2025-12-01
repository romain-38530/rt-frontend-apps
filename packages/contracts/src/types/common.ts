/**
 * Types communs partagés dans SYMPHONI.A
 */

export interface SubscriptionInfo {
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  startDate: string;
  endDate?: string;
  features: string[];
  limits: Record<string, number>;
}

export interface TransportInfo {
  carrierId?: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleRegistration?: string;
  vehicleType?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export interface CargoInfo {
  description: string;
  weight: number; // en kg
  volume?: number; // en m³
  quantity: number;
  palettes?: number;
  packaging?: string;
  references?: string[];
  specialInstructions?: string;
}

export interface TimelineEvent {
  eventId: string;
  type: string;
  timestamp: string;
  description: string;
  actor?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  data?: any;
}
