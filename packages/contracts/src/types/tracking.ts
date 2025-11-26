/**
 * Types TypeScript pour le système de tracking SYMPHONI.A
 */

export type TrackingLevel = 'basic' | 'gps' | 'premium';

export type TrackingStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: string;
}

export interface TrackingPosition extends GeoLocation {
  id: string;
  orderId: string;
  carrierId: string;
  speed?: number; // km/h
  heading?: number; // degrés (0-360)
  address?: string; // Adresse reverse-geocoded
  distanceFromPickup?: number; // km
  distanceFromDelivery?: number; // km
  createdAt: string;
}

export interface ETA {
  estimatedArrival: string; // ISO timestamp
  distanceRemaining: number; // km
  durationRemaining: number; // minutes
  confidence: number; // 0-100
  trafficDelay?: number; // minutes de retard dû au trafic
  calculatedAt: string;
}

export interface Route {
  id: string;
  orderId: string;
  points: GeoLocation[];
  distance: number; // km
  duration: number; // minutes
  polyline?: string; // Encoded polyline for map rendering
  alternativeRoutes?: {
    distance: number;
    duration: number;
    polyline: string;
  }[];
  createdAt: string;
}

export interface TrafficInfo {
  level: 'free' | 'light' | 'moderate' | 'heavy' | 'blocked';
  delayMinutes: number;
  incidents?: {
    type: 'accident' | 'construction' | 'weather' | 'other';
    description: string;
    location: GeoLocation;
  }[];
}

export interface TrackingSession {
  id: string;
  orderId: string;
  carrierId: string;
  trackingLevel: TrackingLevel;
  status: TrackingStatus;

  // Position actuelle
  currentPosition?: TrackingPosition;
  lastUpdate?: string;

  // Itinéraire
  route?: Route;

  // ETA
  pickupETA?: ETA;
  deliveryETA?: ETA;

  // Traffic
  traffic?: TrafficInfo;

  // Historique des positions
  positionHistory?: TrackingPosition[];

  // Métadonnées
  startedAt: string;
  completedAt?: string;
  totalDistance?: number; // km
  totalDuration?: number; // minutes

  // Configuration
  updateInterval: number; // secondes (60 pour basic, 30 pour gps, 10 pour premium)

  // Alertes
  alerts?: TrackingAlert[];
}

export interface TrackingAlert {
  id: string;
  type: 'delay' | 'route_deviation' | 'speed_limit' | 'stop_duration' | 'battery_low' | 'signal_lost';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  data?: any;
}

export interface TrackingStats {
  totalDistance: number; // km
  totalDuration: number; // minutes
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  stopCount: number;
  totalStopDuration: number; // minutes
  onTimePercentage: number; // 0-100
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'pickup' | 'delivery' | 'rest_area' | 'danger_zone';
  center: GeoLocation;
  radius: number; // meters
  entered?: boolean;
  enteredAt?: string;
  exitedAt?: string;
}

export interface TrackingSettings {
  orderId: string;
  trackingLevel: TrackingLevel;
  autoStartTracking: boolean;
  sendNotifications: boolean;
  notificationEmails?: string[];
  notificationPhones?: string[];
  geofences?: GeofenceZone[];
}

// Requêtes et réponses API

export interface StartTrackingRequest {
  orderId: string;
  carrierId: string;
  trackingLevel: TrackingLevel;
  settings?: Partial<TrackingSettings>;
}

export interface UpdatePositionRequest {
  sessionId: string;
  location: GeoLocation;
  speed?: number;
  heading?: number;
}

export interface GetTrackingHistoryParams {
  orderId?: string;
  sessionId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface TrackingHistoryResponse {
  data: TrackingPosition[];
  total: number;
  session: TrackingSession;
}

export interface CalculateETARequest {
  currentLocation: GeoLocation;
  destinationLocation: GeoLocation;
  includeTraffic?: boolean;
  departureTime?: string;
}

export interface GetRouteRequest {
  origin: GeoLocation;
  destination: GeoLocation;
  waypoints?: GeoLocation[];
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  includeAlternatives?: boolean;
}

// Types pour l'affichage

export interface MapMarker {
  id: string;
  type: 'current' | 'pickup' | 'delivery' | 'waypoint' | 'stop';
  position: GeoLocation;
  label?: string;
  icon?: string;
  color?: string;
  onClick?: () => void;
}

export interface MapBounds {
  northeast: GeoLocation;
  southwest: GeoLocation;
}

export interface MapViewport {
  center: GeoLocation;
  zoom: number;
  bounds?: MapBounds;
}
