/**
 * Service OpenStreetMap pour le geocodage et le routing
 * Utilise Nominatim pour le geocodage et OSRM pour le routing
 *
 * SYMPHONI.A - RT Technologie
 */

// ============================================
// INTERFACES
// ============================================

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    road?: string;
    houseNumber?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countryCode?: string;
  };
  boundingBox?: [number, number, number, number];
  importance?: number;
}

export interface ReverseGeocodingResult {
  address: string;
  city: string;
  postcode: string;
  country: string;
  displayName: string;
}

export interface RouteResult {
  distance: number; // en metres
  duration: number; // en secondes
  distanceKm: number;
  durationMinutes: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  polyline?: string; // encoded polyline
  steps: RouteStep[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
  mode: string;
  maneuver?: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

export interface RouteOptions {
  alternatives?: boolean;
  steps?: boolean;
  overview?: 'full' | 'simplified' | 'false';
  profile?: 'driving' | 'walking' | 'cycling';
}

// ============================================
// NOMINATIM GEOCODING SERVICE
// ============================================

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Rate limiting: Nominatim requires max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'SYMPHONIA-ControlTower/1.0 (contact@rt-technologie.fr)',
      'Accept-Language': 'fr,en',
      ...options?.headers,
    },
  });
}

// ============================================
// SERVICE CLASS
// ============================================

export class OpenStreetMapService {
  /**
   * Geocoder une adresse (obtenir lat/lng depuis une adresse)
   */
  static async geocode(address: string, options?: {
    countrycodes?: string;
    limit?: number;
  }): Promise<GeocodingResult[]> {
    try {
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: '1',
        limit: (options?.limit || 5).toString(),
      });

      if (options?.countrycodes) {
        params.append('countrycodes', options.countrycodes);
      }

      const response = await rateLimitedFetch(
        `${NOMINATIM_BASE_URL}/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Nominatim geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        address: {
          road: item.address?.road,
          houseNumber: item.address?.house_number,
          city: item.address?.city || item.address?.town || item.address?.village,
          municipality: item.address?.municipality,
          county: item.address?.county,
          state: item.address?.state,
          postcode: item.address?.postcode,
          country: item.address?.country,
          countryCode: item.address?.country_code,
        },
        boundingBox: item.boundingbox?.map(parseFloat),
        importance: item.importance,
      }));
    } catch (error) {
      console.error('[OpenStreetMap] Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Geocodage inverse (obtenir l'adresse depuis lat/lng)
   */
  static async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
      });

      const response = await rateLimitedFetch(
        `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Nominatim reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        address: [
          data.address?.road,
          data.address?.house_number,
        ].filter(Boolean).join(' '),
        city: data.address?.city || data.address?.town || data.address?.village || '',
        postcode: data.address?.postcode || '',
        country: data.address?.country || '',
        displayName: data.display_name,
      };
    } catch (error) {
      console.error('[OpenStreetMap] Reverse geocoding error:', error);
      throw error;
    }
  }

  // ============================================
  // OSRM ROUTING SERVICE
  // ============================================

  /**
   * Calculer un itineraire entre deux points
   * Utilise OSRM (Open Source Routing Machine) - serveur public gratuit
   */
  static async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: RouteOptions = {}
  ): Promise<RouteResult> {
    const profile = options.profile || 'driving';
    const overview = options.overview || 'full';

    // OSRM public demo server (limite: usage raisonnable)
    // Pour production: deployer son propre serveur OSRM
    const OSRM_BASE_URL = 'https://router.project-osrm.org';

    try {
      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const params = new URLSearchParams({
        overview: overview,
        steps: (options.steps !== false).toString(),
        alternatives: (options.alternatives || false).toString(),
        geometries: 'geojson',
      });

      const response = await fetch(
        `${OSRM_BASE_URL}/route/v1/${profile}/${coordinates}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`OSRM routing failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`No route found: ${data.code}`);
      }

      const route = data.routes[0];

      return {
        distance: route.distance,
        duration: route.duration,
        distanceKm: Math.round(route.distance / 100) / 10, // Convert to km with 1 decimal
        durationMinutes: Math.round(route.duration / 60),
        geometry: route.geometry,
        steps: (route.legs || []).flatMap((leg: any) =>
          (leg.steps || []).map((step: any) => ({
            distance: step.distance,
            duration: step.duration,
            instruction: step.maneuver?.instruction || '',
            name: step.name || '',
            mode: step.mode || 'driving',
            maneuver: step.maneuver ? {
              type: step.maneuver.type,
              modifier: step.maneuver.modifier,
              location: step.maneuver.location,
            } : undefined,
          }))
        ),
      };
    } catch (error) {
      console.error('[OpenStreetMap] Routing error:', error);
      throw error;
    }
  }

  /**
   * Calculer un itineraire avec plusieurs points de passage (waypoints)
   */
  static async getRouteWithWaypoints(
    points: Array<{ lat: number; lng: number }>,
    options: RouteOptions = {}
  ): Promise<RouteResult> {
    if (points.length < 2) {
      throw new Error('At least 2 points are required for routing');
    }

    const profile = options.profile || 'driving';
    const overview = options.overview || 'full';
    const OSRM_BASE_URL = 'https://router.project-osrm.org';

    try {
      const coordinates = points.map(p => `${p.lng},${p.lat}`).join(';');
      const params = new URLSearchParams({
        overview: overview,
        steps: (options.steps !== false).toString(),
        geometries: 'geojson',
      });

      const response = await fetch(
        `${OSRM_BASE_URL}/route/v1/${profile}/${coordinates}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`OSRM routing failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`No route found: ${data.code}`);
      }

      const route = data.routes[0];

      return {
        distance: route.distance,
        duration: route.duration,
        distanceKm: Math.round(route.distance / 100) / 10,
        durationMinutes: Math.round(route.duration / 60),
        geometry: route.geometry,
        steps: (route.legs || []).flatMap((leg: any) =>
          (leg.steps || []).map((step: any) => ({
            distance: step.distance,
            duration: step.duration,
            instruction: step.maneuver?.instruction || '',
            name: step.name || '',
            mode: step.mode || 'driving',
            maneuver: step.maneuver ? {
              type: step.maneuver.type,
              modifier: step.maneuver.modifier,
              location: step.maneuver.location,
            } : undefined,
          }))
        ),
      };
    } catch (error) {
      console.error('[OpenStreetMap] Routing with waypoints error:', error);
      throw error;
    }
  }

  /**
   * Calculer la distance et duree estimees entre deux points
   * Methode simplifiee sans itineraire complet
   */
  static async getDistanceAndDuration(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distanceKm: number; durationMinutes: number }> {
    const route = await this.getRoute(origin, destination, {
      steps: false,
      overview: 'false',
    });

    return {
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
    };
  }

  /**
   * Calculer l'ETA (Estimated Time of Arrival)
   */
  static async calculateETA(
    currentPosition: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{
    eta: Date;
    durationMinutes: number;
    distanceKm: number;
  }> {
    const { distanceKm, durationMinutes } = await this.getDistanceAndDuration(
      currentPosition,
      destination
    );

    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + durationMinutes);

    return {
      eta,
      durationMinutes,
      distanceKm,
    };
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Calculer la distance a vol d'oiseau entre deux points (Haversine)
   */
  static calculateHaversineDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Generer l'URL d'une tuile OpenStreetMap
   */
  static getTileUrl(x: number, y: number, z: number): string {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  /**
   * Convertir lat/lng en coordonnees de tuile
   */
  static latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  }

  /**
   * Formater une distance en texte lisible
   */
  static formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  /**
   * Formater une duree en texte lisible
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  }
}

export default OpenStreetMapService;
