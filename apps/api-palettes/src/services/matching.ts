import { calculateDistanceKm, Coordinates } from './geofencing';
import PalletSite, { IPalletSite, SitePriority } from '../models/PalletSite';
import { PalletType } from '../models/PalletCheque';

export interface MatchingRequest {
  location: Coordinates;
  quantity: number;
  palletType: PalletType;
  radiusKm?: number;
  companyId?: string; // Pour prioriser les sites internes
  excludeSiteIds?: string[];
}

export interface MatchedSite {
  siteId: string;
  siteName: string;
  companyName: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  coordinates: Coordinates;
  distance: number; // km
  quotaRemaining: number;
  capacityTotal: number;
  openingHours: string;
  priority: SitePriority;
  priorityScore: number;
  matchingScore: number; // Score global 0-100
  rank: number;
  isOpen: boolean;
  avgRating: number;
}

// Poids des critères pour le calcul du score
const WEIGHTS = {
  distance: 0.35,      // 35% - Distance
  quota: 0.25,         // 25% - Quota disponible
  priority: 0.20,      // 20% - Priorité du site
  rating: 0.10,        // 10% - Note moyenne
  openNow: 0.10,       // 10% - Ouvert maintenant
};

/**
 * Vérifie si un site est ouvert à une heure donnée
 */
function isSiteOpen(site: IPalletSite, date: Date = new Date()): boolean {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[date.getDay()] as keyof typeof site.openingHours;
  const dayHours = site.openingHours[dayName];

  if (dayHours.closed) return false;

  const currentTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

/**
 * Formate les horaires d'ouverture pour affichage
 */
function formatOpeningHours(site: IPalletSite): string {
  const today = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[today.getDay()] as keyof typeof site.openingHours;
  const dayHours = site.openingHours[dayName];

  if (dayHours.closed) return 'Fermé aujourd\'hui';
  return `${dayHours.open} - ${dayHours.close}`;
}

/**
 * Calcule le score de matching pour un site
 */
function calculateMatchingScore(
  site: IPalletSite,
  distance: number,
  maxDistance: number,
  quantity: number,
  palletType: PalletType,
  isInternal: boolean
): number {
  // Score distance (0-100, inversé - plus proche = meilleur)
  const distanceScore = Math.max(0, 100 - (distance / maxDistance) * 100);

  // Score quota (0-100)
  const quotaRemaining = site.quota.maxDaily - site.quota.currentDaily;
  const quotaRatio = quotaRemaining / Math.max(quantity, 1);
  const quotaScore = Math.min(100, quotaRatio * 50); // 50 si exactement la quantité, 100 si 2x

  // Score priorité (0-100)
  let priorityScore = site.priorityScore;
  if (isInternal && site.priority === 'INTERNAL') {
    priorityScore = Math.min(100, priorityScore + 30); // Bonus pour site interne
  }

  // Score rating (0-100)
  const ratingScore = (site.stats.avgRating / 5) * 100;

  // Score ouverture (0 ou 100)
  const openScore = isSiteOpen(site) ? 100 : 0;

  // Calcul pondéré
  const finalScore =
    distanceScore * WEIGHTS.distance +
    quotaScore * WEIGHTS.quota +
    priorityScore * WEIGHTS.priority +
    ratingScore * WEIGHTS.rating +
    openScore * WEIGHTS.openNow;

  return Math.round(finalScore);
}

/**
 * Trouve les meilleurs sites de restitution
 * @param request - Paramètres de recherche
 * @returns Liste des sites triés par score de matching
 */
export async function findBestSites(request: MatchingRequest): Promise<MatchedSite[]> {
  const {
    location,
    quantity,
    palletType,
    radiusKm = 30,
    companyId,
    excludeSiteIds = [],
  } = request;

  // Récupérer tous les sites actifs
  const sites = await PalletSite.find({
    active: true,
    siteId: { $nin: excludeSiteIds },
  });

  // Filtrer et calculer les scores
  const matchedSites: MatchedSite[] = [];

  for (const site of sites) {
    const distance = calculateDistanceKm(location, {
      latitude: site.address.coordinates.latitude,
      longitude: site.address.coordinates.longitude,
    });

    // Ignorer si trop loin
    if (distance > radiusKm) continue;

    // Vérifier quota disponible
    const quotaRemaining = site.quota.maxDaily - site.quota.currentDaily;
    if (quotaRemaining < quantity) continue;

    // Vérifier capacité pour le type de palette
    const capacity = site.capacities[palletType];
    if (capacity < quantity) continue;

    // Calculer le score
    const isInternal = companyId === site.companyId;
    const matchingScore = calculateMatchingScore(
      site,
      distance,
      radiusKm,
      quantity,
      palletType,
      isInternal
    );

    matchedSites.push({
      siteId: site.siteId,
      siteName: site.siteName,
      companyName: site.companyName,
      address: {
        street: site.address.street,
        city: site.address.city,
        postalCode: site.address.postalCode,
      },
      coordinates: {
        latitude: site.address.coordinates.latitude,
        longitude: site.address.coordinates.longitude,
      },
      distance: Math.round(distance * 10) / 10,
      quotaRemaining,
      capacityTotal: capacity,
      openingHours: formatOpeningHours(site),
      priority: site.priority,
      priorityScore: site.priorityScore,
      matchingScore,
      rank: 0, // Sera mis à jour après tri
      isOpen: isSiteOpen(site),
      avgRating: site.stats.avgRating,
    });
  }

  // Trier par score décroissant
  matchedSites.sort((a, b) => b.matchingScore - a.matchingScore);

  // Assigner les rangs
  matchedSites.forEach((site, index) => {
    site.rank = index + 1;
  });

  return matchedSites;
}

/**
 * Trouve le meilleur site automatiquement
 */
export async function findBestSite(request: MatchingRequest): Promise<MatchedSite | null> {
  const sites = await findBestSites(request);
  return sites.length > 0 ? sites[0] : null;
}

/**
 * Récupère les statistiques de matching
 */
export async function getMatchingStats(): Promise<{
  totalSites: number;
  activeSites: number;
  avgQuotaUsage: number;
  sitesByPriority: Record<SitePriority, number>;
}> {
  const sites = await PalletSite.find();
  const activeSites = sites.filter(s => s.active);

  const avgQuotaUsage = activeSites.length > 0
    ? activeSites.reduce((sum, s) => sum + (s.quota.currentDaily / s.quota.maxDaily), 0) / activeSites.length * 100
    : 0;

  const sitesByPriority: Record<SitePriority, number> = {
    INTERNAL: 0,
    NETWORK: 0,
    EXTERNAL: 0,
  };

  activeSites.forEach(s => {
    sitesByPriority[s.priority]++;
  });

  return {
    totalSites: sites.length,
    activeSites: activeSites.length,
    avgQuotaUsage: Math.round(avgQuotaUsage),
    sitesByPriority,
  };
}

export default {
  findBestSites,
  findBestSite,
  getMatchingStats,
};
