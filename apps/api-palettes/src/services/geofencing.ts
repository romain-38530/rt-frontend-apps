import { getDistance, isPointWithinRadius } from 'geolib';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceResult {
  isValid: boolean;
  distance: number;
  maxRadius: number;
  withinRadius: boolean;
  message: string;
}

/**
 * Vérifie si une position est dans le périmètre d'un site
 * @param userLocation - Position de l'utilisateur
 * @param siteLocation - Position du site
 * @param radiusMeters - Rayon de tolérance en mètres
 * @returns Résultat de la validation geofencing
 */
export function validateGeofence(
  userLocation: Coordinates,
  siteLocation: Coordinates,
  radiusMeters: number = 100
): GeofenceResult {
  const distance = getDistance(
    { latitude: userLocation.latitude, longitude: userLocation.longitude },
    { latitude: siteLocation.latitude, longitude: siteLocation.longitude }
  );

  const withinRadius = isPointWithinRadius(
    { latitude: userLocation.latitude, longitude: userLocation.longitude },
    { latitude: siteLocation.latitude, longitude: siteLocation.longitude },
    radiusMeters
  );

  let message: string;
  if (withinRadius) {
    message = `Position validée - Distance: ${distance}m (max: ${radiusMeters}m)`;
  } else {
    message = `Position hors périmètre - Distance: ${distance}m (max autorisé: ${radiusMeters}m)`;
  }

  return {
    isValid: withinRadius,
    distance,
    maxRadius: radiusMeters,
    withinRadius,
    message,
  };
}

/**
 * Calcule la distance entre deux points
 * @param from - Point de départ
 * @param to - Point d'arrivée
 * @returns Distance en mètres
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  return getDistance(
    { latitude: from.latitude, longitude: from.longitude },
    { latitude: to.latitude, longitude: to.longitude }
  );
}

/**
 * Calcule la distance en kilomètres
 */
export function calculateDistanceKm(from: Coordinates, to: Coordinates): number {
  return calculateDistance(from, to) / 1000;
}

/**
 * Trouve les sites dans un rayon donné
 * @param userLocation - Position de l'utilisateur
 * @param sites - Liste des sites avec leurs coordonnées
 * @param radiusKm - Rayon de recherche en kilomètres
 * @returns Sites triés par distance
 */
export function findSitesInRadius<T extends { coordinates: Coordinates }>(
  userLocation: Coordinates,
  sites: T[],
  radiusKm: number
): Array<T & { distance: number }> {
  const radiusMeters = radiusKm * 1000;

  return sites
    .map(site => ({
      ...site,
      distance: calculateDistance(userLocation, site.coordinates),
    }))
    .filter(site => site.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Valide que les coordonnées sont dans une plage valide
 */
export function validateCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Formate les coordonnées pour affichage
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

export default {
  validateGeofence,
  calculateDistance,
  calculateDistanceKm,
  findSitesInRadius,
  validateCoordinates,
  formatCoordinates,
};
