import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../lib/api';

// ============================================================================
// TYPES
// ============================================================================

interface PalletTier {
  min: number;
  max: number;
  pricePerPallet: number;
}

interface ZonePricing {
  zoneOrigin: string;
  zoneDestination: string;
  palletTiers?: PalletTier[];
  vehicleType?: string;
  flatRate?: number;
  pricePerKm?: number;
  minKm?: number;
  minimumPrice: number;
  transitDays: number;
}

interface WeightTier {
  minKg: number;
  maxKg: number;
  price: number;
}

interface DepartmentPricing {
  departmentOrigin: string;
  departmentDestination: string;
  weightTiers: WeightTier[];
  minimumPrice: number;
  transitDays: number;
}

interface PricingGrid {
  gridId: string;
  name: string;
  description: string;
  carrierId: string;
  transportType: string;
  calculationType: string;
  status: string;
  ltlPricing?: { zonePricing: ZonePricing[] };
  ftlPricing?: { zonePricing: ZonePricing[] };
  messageriePricing?: { volumetricDivisor: number; departmentPricing: DepartmentPricing[] };
  basePricing?: {
    basePrice: number;
    pricePerKm: number;
    pricePerKg: number;
    minimumPrice: number;
    currency: string;
  };
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  importedFrom?: { type: string; fileName: string };
  carrier?: { companyName: string; score?: number; onTimeRate?: number };
}

interface CarrierScore {
  carrierId: string;
  carrierName: string;
  globalScore: number;
  priceScore: number;
  coverageScore: number;
  transitScore: number;
  reliabilityScore: number;
  totalRoutes: number;
  avgPrice: number;
  avgTransitDays: number;
  gridsCount: number;
  onTimeRate: number;
}

interface RouteOffer {
  routeKey: string;
  origin: string;
  destination: string;
  carrierId: string;
  carrierName: string;
  gridId: string;
  gridName: string;
  transportType: string;
  price: number;
  priceUnit: string;
  transitDays: number;
  vehicleType?: string;
  isLowestPrice: boolean;
  isFastestTransit: boolean;
  isBestScore: boolean;
  carrierScore: number;
  selected: boolean;
}

interface TransportPlan {
  routes: RouteOffer[];
  selectedOffers: Map<string, RouteOffer>;
  totalCost: number;
  avgTransitDays: number;
  carriersCount: number;
}

interface OptimizationWeights {
  price: number;
  transit: number;
  score: number;
}

interface RouteComparison {
  routeKey: string;
  origin: string;
  destination: string;
  transportType: string;
  offers: RouteOffer[];
  bestPrice: RouteOffer | null;
  bestTransit: RouteOffer | null;
  bestScore: RouteOffer | null;
  bestBalanced: RouteOffer | null;
  priceDiffPercent: number;
  transitDiffDays: number;
}

interface CostSimulation {
  monthlyVolume: number;
  routeDistribution: Map<string, number>;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
}

interface TransportPlanSummary {
  id: string;
  name: string;
  createdAt: string;
  totalRoutes: number;
  totalCost: number;
  avgTransit: number;
  carriersUsed: number;
  optimizationStrategy: string;
  selectedOffers: RouteOffer[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ZONES = {
  IDF: 'Île-de-France', ARA: 'Auvergne-Rhône-Alpes', BFC: 'Bourgogne-Franche-Comté',
  BRE: 'Bretagne', CVL: 'Centre-Val de Loire', GES: 'Grand Est',
  HDF: 'Hauts-de-France', NOR: 'Normandie', NAQ: 'Nouvelle-Aquitaine',
  OCC: 'Occitanie', PDL: 'Pays de la Loire', PAC: "Provence-Alpes-Côte d'Azur",
  COR: 'Corse', BE: 'Belgique', LU: 'Luxembourg', DE: 'Allemagne',
  ES: 'Espagne', IT: 'Italie', NL: 'Pays-Bas', CH: 'Suisse'
};

const DEPARTMENTS: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube',
  '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal',
  '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '21': 'Côte-d\'Or',
  '22': 'Côtes-d\'Armor', '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs', '26': 'Drôme',
  '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne',
  '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine', '36': 'Indre',
  '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura', '40': 'Landes', '41': 'Loir-et-Cher',
  '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot',
  '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne',
  '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse', '56': 'Morbihan',
  '57': 'Moselle', '58': 'Nièvre', '59': 'Nord', '60': 'Oise', '61': 'Orne',
  '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques', '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales',
  '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône', '71': 'Saône-et-Loire',
  '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime',
  '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn',
  '82': 'Tarn-et-Garonne', '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne',
  '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne', '90': 'Territoire de Belfort', '91': 'Essonne',
  '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': 'Val-d\'Oise',
  '2A': 'Corse-du-Sud', '2B': 'Haute-Corse'
};

// ============================================================================
// SCORING ALGORITHMS
// ============================================================================

function calculateCarrierScores(grids: PricingGrid[]): CarrierScore[] {
  const carrierMap = new Map<string, {
    carrierId: string;
    carrierName: string;
    grids: PricingGrid[];
    totalRoutes: number;
    prices: number[];
    transitDays: number[];
  }>();

  // Aggregate data by carrier
  grids.forEach(grid => {
    if (grid.status !== 'ACTIVE') return;

    const existing = carrierMap.get(grid.carrierId) || {
      carrierId: grid.carrierId,
      carrierName: grid.carrier?.companyName || grid.carrierId,
      grids: [],
      totalRoutes: 0,
      prices: [],
      transitDays: []
    };

    existing.grids.push(grid);

    // Extract routes and prices
    if (grid.ltlPricing?.zonePricing) {
      grid.ltlPricing.zonePricing.forEach(zone => {
        existing.totalRoutes++;
        const avgPrice = zone.palletTiers?.reduce((sum, t) => sum + t.pricePerPallet, 0) || zone.minimumPrice;
        existing.prices.push(avgPrice / (zone.palletTiers?.length || 1));
        existing.transitDays.push(zone.transitDays);
      });
    }
    if (grid.ftlPricing?.zonePricing) {
      grid.ftlPricing.zonePricing.forEach(zone => {
        existing.totalRoutes++;
        existing.prices.push(zone.flatRate || (zone.pricePerKm || 0) * 500);
        existing.transitDays.push(zone.transitDays);
      });
    }
    if (grid.messageriePricing?.departmentPricing) {
      grid.messageriePricing.departmentPricing.forEach(dept => {
        existing.totalRoutes++;
        const avgPrice = dept.weightTiers?.reduce((sum, t) => sum + t.price, 0) || dept.minimumPrice;
        existing.prices.push(avgPrice / (dept.weightTiers?.length || 1));
        existing.transitDays.push(dept.transitDays);
      });
    }

    carrierMap.set(grid.carrierId, existing);
  });

  // Calculate scores
  const allPrices = Array.from(carrierMap.values()).flatMap(c => c.prices);
  const allTransits = Array.from(carrierMap.values()).flatMap(c => c.transitDays);
  const allRoutes = Array.from(carrierMap.values()).map(c => c.totalRoutes);

  const minPrice = Math.min(...allPrices) || 1;
  const maxPrice = Math.max(...allPrices) || 100;
  const minTransit = Math.min(...allTransits) || 1;
  const maxTransit = Math.max(...allTransits) || 10;
  const maxRoutes = Math.max(...allRoutes) || 1;

  return Array.from(carrierMap.values()).map(carrier => {
    const avgPrice = carrier.prices.length ? carrier.prices.reduce((a, b) => a + b, 0) / carrier.prices.length : 0;
    const avgTransit = carrier.transitDays.length ? carrier.transitDays.reduce((a, b) => a + b, 0) / carrier.transitDays.length : 0;

    // Price score (lower is better, inverted to 0-100)
    const priceScore = maxPrice > minPrice
      ? Math.round(100 - ((avgPrice - minPrice) / (maxPrice - minPrice)) * 100)
      : 50;

    // Coverage score (more routes is better)
    const coverageScore = Math.round((carrier.totalRoutes / maxRoutes) * 100);

    // Transit score (faster is better, inverted)
    const transitScore = maxTransit > minTransit
      ? Math.round(100 - ((avgTransit - minTransit) / (maxTransit - minTransit)) * 100)
      : 50;

    // Reliability score (simulated based on carrier data or default)
    const onTimeRate = carrier.grids[0]?.carrier?.onTimeRate || (80 + Math.random() * 15);
    const reliabilityScore = Math.round(onTimeRate);

    // Global score (weighted average)
    const globalScore = Math.round(
      priceScore * 0.35 +
      coverageScore * 0.20 +
      transitScore * 0.25 +
      reliabilityScore * 0.20
    );

    return {
      carrierId: carrier.carrierId,
      carrierName: carrier.carrierName,
      globalScore,
      priceScore,
      coverageScore,
      transitScore,
      reliabilityScore,
      totalRoutes: carrier.totalRoutes,
      avgPrice: Math.round(avgPrice * 100) / 100,
      avgTransitDays: Math.round(avgTransit * 10) / 10,
      gridsCount: carrier.grids.length,
      onTimeRate: Math.round(onTimeRate * 10) / 10
    };
  }).sort((a, b) => b.globalScore - a.globalScore);
}

function buildConsolidatedPlan(grids: PricingGrid[], carrierScores: CarrierScore[]): RouteOffer[] {
  const routeMap = new Map<string, RouteOffer[]>();
  const scoreMap = new Map<string, number>();
  carrierScores.forEach(cs => scoreMap.set(cs.carrierId, cs.globalScore));

  grids.forEach(grid => {
    if (grid.status !== 'ACTIVE') return;
    const carrierScore = scoreMap.get(grid.carrierId) || 50;
    const carrierName = grid.carrier?.companyName || grid.carrierId;

    // LTL pricing
    if (grid.ltlPricing?.zonePricing) {
      grid.ltlPricing.zonePricing.forEach(zone => {
        const routeKey = `${zone.zoneOrigin}-${zone.zoneDestination}`;
        const avgPrice = zone.palletTiers?.length
          ? zone.palletTiers.reduce((sum, t) => sum + t.pricePerPallet, 0) / zone.palletTiers.length
          : zone.minimumPrice;

        const offer: RouteOffer = {
          routeKey,
          origin: ZONES[zone.zoneOrigin as keyof typeof ZONES] || zone.zoneOrigin,
          destination: ZONES[zone.zoneDestination as keyof typeof ZONES] || zone.zoneDestination,
          carrierId: grid.carrierId,
          carrierName,
          gridId: grid.gridId,
          gridName: grid.name,
          transportType: 'LTL',
          price: Math.round(avgPrice * 100) / 100,
          priceUnit: 'EUR/palette',
          transitDays: zone.transitDays,
          isLowestPrice: false,
          isFastestTransit: false,
          isBestScore: false,
          carrierScore,
          selected: false
        };

        const existing = routeMap.get(routeKey) || [];
        existing.push(offer);
        routeMap.set(routeKey, existing);
      });
    }

    // FTL pricing
    if (grid.ftlPricing?.zonePricing) {
      grid.ftlPricing.zonePricing.forEach(zone => {
        const routeKey = `${zone.zoneOrigin}-${zone.zoneDestination}-FTL`;
        const price = zone.flatRate || (zone.pricePerKm || 0) * 500;

        const offer: RouteOffer = {
          routeKey,
          origin: ZONES[zone.zoneOrigin as keyof typeof ZONES] || zone.zoneOrigin,
          destination: ZONES[zone.zoneDestination as keyof typeof ZONES] || zone.zoneDestination,
          carrierId: grid.carrierId,
          carrierName,
          gridId: grid.gridId,
          gridName: grid.name,
          transportType: 'FTL',
          price: Math.round(price * 100) / 100,
          priceUnit: zone.flatRate ? 'EUR/forfait' : 'EUR/km',
          transitDays: zone.transitDays,
          vehicleType: zone.vehicleType,
          isLowestPrice: false,
          isFastestTransit: false,
          isBestScore: false,
          carrierScore,
          selected: false
        };

        const existing = routeMap.get(routeKey) || [];
        existing.push(offer);
        routeMap.set(routeKey, existing);
      });
    }

    // Messagerie pricing
    if (grid.messageriePricing?.departmentPricing) {
      grid.messageriePricing.departmentPricing.forEach(dept => {
        const routeKey = `${dept.departmentOrigin}-${dept.departmentDestination}-MSG`;
        const avgPrice = dept.weightTiers?.length
          ? dept.weightTiers.reduce((sum, t) => sum + t.price, 0) / dept.weightTiers.length
          : dept.minimumPrice;

        const offer: RouteOffer = {
          routeKey,
          origin: DEPARTMENTS[dept.departmentOrigin] || dept.departmentOrigin,
          destination: DEPARTMENTS[dept.departmentDestination] || dept.departmentDestination,
          carrierId: grid.carrierId,
          carrierName,
          gridId: grid.gridId,
          gridName: grid.name,
          transportType: 'MESSAGERIE',
          price: Math.round(avgPrice * 100) / 100,
          priceUnit: 'EUR/kg moyen',
          transitDays: dept.transitDays,
          isLowestPrice: false,
          isFastestTransit: false,
          isBestScore: false,
          carrierScore,
          selected: false
        };

        const existing = routeMap.get(routeKey) || [];
        existing.push(offer);
        routeMap.set(routeKey, existing);
      });
    }
  });

  // Mark best offers per route
  const allOffers: RouteOffer[] = [];
  routeMap.forEach((offers, routeKey) => {
    const lowestPrice = Math.min(...offers.map(o => o.price));
    const fastestTransit = Math.min(...offers.map(o => o.transitDays));
    const bestScore = Math.max(...offers.map(o => o.carrierScore));

    offers.forEach(offer => {
      offer.isLowestPrice = offer.price === lowestPrice;
      offer.isFastestTransit = offer.transitDays === fastestTransit;
      offer.isBestScore = offer.carrierScore === bestScore;
      // Auto-select best offer (balanced: price + score)
      if (offer.isLowestPrice && offer.carrierScore >= bestScore - 10) {
        offer.selected = true;
      } else if (offer.isBestScore && offer.price <= lowestPrice * 1.1) {
        offer.selected = true;
      } else if (offers.length === 1) {
        offer.selected = true;
      }
      allOffers.push(offer);
    });
  });

  return allOffers;
}

/**
 * Build route comparisons for analysis
 */
function buildRouteComparisons(offers: RouteOffer[]): RouteComparison[] {
  const routeMap = new Map<string, RouteOffer[]>();
  offers.forEach(offer => {
    const existing = routeMap.get(offer.routeKey) || [];
    existing.push(offer);
    routeMap.set(offer.routeKey, existing);
  });

  const comparisons: RouteComparison[] = [];
  routeMap.forEach((routeOffers, routeKey) => {
    if (routeOffers.length === 0) return;

    const bestPrice = routeOffers.reduce((a, b) => a.price < b.price ? a : b);
    const bestTransit = routeOffers.reduce((a, b) => a.transitDays < b.transitDays ? a : b);
    const bestScore = routeOffers.reduce((a, b) => a.carrierScore > b.carrierScore ? a : b);

    // Best balanced: normalize and weight (40% price, 30% transit, 30% score)
    const maxPrice = Math.max(...routeOffers.map(o => o.price));
    const minPrice = Math.min(...routeOffers.map(o => o.price));
    const maxTransit = Math.max(...routeOffers.map(o => o.transitDays));
    const minTransit = Math.min(...routeOffers.map(o => o.transitDays));
    const maxScore = Math.max(...routeOffers.map(o => o.carrierScore));
    const minScore = Math.min(...routeOffers.map(o => o.carrierScore));

    const bestBalanced = routeOffers.reduce((best, offer) => {
      const priceNorm = maxPrice > minPrice ? (maxPrice - offer.price) / (maxPrice - minPrice) : 0.5;
      const transitNorm = maxTransit > minTransit ? (maxTransit - offer.transitDays) / (maxTransit - minTransit) : 0.5;
      const scoreNorm = maxScore > minScore ? (offer.carrierScore - minScore) / (maxScore - minScore) : 0.5;
      const balanced = priceNorm * 0.4 + transitNorm * 0.3 + scoreNorm * 0.3;

      const bestPriceNorm = maxPrice > minPrice ? (maxPrice - best.price) / (maxPrice - minPrice) : 0.5;
      const bestTransitNorm = maxTransit > minTransit ? (maxTransit - best.transitDays) / (maxTransit - minTransit) : 0.5;
      const bestScoreNorm = maxScore > minScore ? (best.carrierScore - minScore) / (maxScore - minScore) : 0.5;
      const bestBalanced = bestPriceNorm * 0.4 + bestTransitNorm * 0.3 + bestScoreNorm * 0.3;

      return balanced > bestBalanced ? offer : best;
    });

    const priceDiffPercent = minPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 100) : 0;
    const transitDiffDays = maxTransit - minTransit;

    comparisons.push({
      routeKey,
      origin: routeOffers[0].origin,
      destination: routeOffers[0].destination,
      transportType: routeOffers[0].transportType,
      offers: routeOffers.sort((a, b) => a.price - b.price),
      bestPrice,
      bestTransit,
      bestScore,
      bestBalanced,
      priceDiffPercent,
      transitDiffDays
    });
  });

  return comparisons.sort((a, b) => b.offers.length - a.offers.length);
}

/**
 * Apply weighted optimization to select best offers
 */
function applyWeightedOptimization(offers: RouteOffer[], weights: OptimizationWeights): Map<string, RouteOffer> {
  const routeMap = new Map<string, RouteOffer[]>();
  offers.forEach(offer => {
    const existing = routeMap.get(offer.routeKey) || [];
    existing.push(offer);
    routeMap.set(offer.routeKey, existing);
  });

  const selected = new Map<string, RouteOffer>();
  routeMap.forEach((routeOffers, routeKey) => {
    if (routeOffers.length === 0) return;

    const maxPrice = Math.max(...routeOffers.map(o => o.price));
    const minPrice = Math.min(...routeOffers.map(o => o.price));
    const maxTransit = Math.max(...routeOffers.map(o => o.transitDays));
    const minTransit = Math.min(...routeOffers.map(o => o.transitDays));
    const maxScore = Math.max(...routeOffers.map(o => o.carrierScore));
    const minScore = Math.min(...routeOffers.map(o => o.carrierScore));

    let best = routeOffers[0];
    let bestWeightedScore = -Infinity;

    routeOffers.forEach(offer => {
      const priceNorm = maxPrice > minPrice ? (maxPrice - offer.price) / (maxPrice - minPrice) : 0.5;
      const transitNorm = maxTransit > minTransit ? (maxTransit - offer.transitDays) / (maxTransit - minTransit) : 0.5;
      const scoreNorm = maxScore > minScore ? (offer.carrierScore - minScore) / (maxScore - minScore) : 0.5;

      const weightedScore = priceNorm * weights.price + transitNorm * weights.transit + scoreNorm * weights.score;

      if (weightedScore > bestWeightedScore) {
        bestWeightedScore = weightedScore;
        best = offer;
      }
    });

    selected.set(routeKey, best);
  });

  return selected;
}

/**
 * Calculate cost simulation
 */
function calculateCostSimulation(
  offers: RouteOffer[],
  selectedOffers: Map<string, RouteOffer>,
  monthlyVolume: number
): CostSimulation {
  const uniqueRoutes = new Set(offers.map(o => o.routeKey)).size;
  const volumePerRoute = monthlyVolume / uniqueRoutes;

  let currentCost = 0;
  let optimizedCost = 0;

  const routeDistribution = new Map<string, number>();

  const routeMap = new Map<string, RouteOffer[]>();
  offers.forEach(offer => {
    const existing = routeMap.get(offer.routeKey) || [];
    existing.push(offer);
    routeMap.set(offer.routeKey, existing);
  });

  routeMap.forEach((routeOffers, routeKey) => {
    routeDistribution.set(routeKey, volumePerRoute);
    // Current cost = average of all offers
    const avgPrice = routeOffers.reduce((sum, o) => sum + o.price, 0) / routeOffers.length;
    currentCost += avgPrice * volumePerRoute;

    // Optimized cost = selected offer
    const selected = selectedOffers.get(routeKey);
    if (selected) {
      optimizedCost += selected.price * volumePerRoute;
    } else {
      optimizedCost += avgPrice * volumePerRoute;
    }
  });

  const savings = currentCost - optimizedCost;
  const savingsPercent = currentCost > 0 ? (savings / currentCost) * 100 : 0;

  return {
    monthlyVolume,
    routeDistribution,
    currentCost: Math.round(currentCost),
    optimizedCost: Math.round(optimizedCost),
    savings: Math.round(savings),
    savingsPercent: Math.round(savingsPercent * 10) / 10
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PricingGridsPage() {
  const router = useSafeRouter();
  const apiUrl = API_CONFIG.PRICING_GRIDS_API;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState<'grids' | 'analysis' | 'plan'>('grids');
  const [grids, setGrids] = useState<PricingGrid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState<PricingGrid | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [planFilter, setPlanFilter] = useState({ origin: '', destination: '', type: '' });
  const [selectedOffers, setSelectedOffers] = useState<Map<string, RouteOffer>>(new Map());

  // Advanced analysis state
  const [optimizationWeights, setOptimizationWeights] = useState<OptimizationWeights>({ price: 40, transit: 30, score: 30 });
  const [monthlyVolume, setMonthlyVolume] = useState<number>(100);
  const [showRouteDetail, setShowRouteDetail] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<TransportPlanSummary[]>([]);
  const [planName, setPlanName] = useState<string>('');
  const [showSavePlanModal, setShowSavePlanModal] = useState(false);
  const [analysisView, setAnalysisView] = useState<'scoring' | 'routes' | 'simulation'>('scoring');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    carrierId: '',
    transportType: 'LTL',
    calculationType: 'PER_PALLET'
  });

  const [importData, setImportData] = useState({
    gridName: '',
    carrierId: '',
    transportType: 'LTL',
    file: null as File | null
  });

  // Computed values
  const carrierScores = useMemo(() => calculateCarrierScores(grids), [grids]);
  const consolidatedOffers = useMemo(() => buildConsolidatedPlan(grids, carrierScores), [grids, carrierScores]);
  const routeComparisons = useMemo(() => buildRouteComparisons(consolidatedOffers), [consolidatedOffers]);
  const costSimulation = useMemo(() => calculateCostSimulation(consolidatedOffers, selectedOffers, monthlyVolume), [consolidatedOffers, selectedOffers, monthlyVolume]);

  const filteredOffers = useMemo(() => {
    return consolidatedOffers.filter(offer => {
      if (planFilter.origin && !offer.origin.toLowerCase().includes(planFilter.origin.toLowerCase())) return false;
      if (planFilter.destination && !offer.destination.toLowerCase().includes(planFilter.destination.toLowerCase())) return false;
      if (planFilter.type && offer.transportType !== planFilter.type) return false;
      return true;
    });
  }, [consolidatedOffers, planFilter]);

  const planStats = useMemo(() => {
    const selected = Array.from(selectedOffers.values());
    return {
      totalRoutes: selected.length,
      totalCost: selected.reduce((sum, o) => sum + o.price, 0),
      avgTransit: selected.length ? selected.reduce((sum, o) => sum + o.transitDays, 0) / selected.length : 0,
      carriersUsed: new Set(selected.map(o => o.carrierId)).size,
      avgScore: selected.length ? Math.round(selected.reduce((sum, o) => sum + o.carrierScore, 0) / selected.length) : 0
    };
  }, [selectedOffers]);

  // Routes with competition (more than 1 offer)
  const routesWithCompetition = useMemo(() => routeComparisons.filter(r => r.offers.length > 1), [routeComparisons]);
  const routesWithoutCompetition = useMemo(() => routeComparisons.filter(r => r.offers.length === 1), [routeComparisons]);

  // API helpers
  const apiCall = useCallback(async (endpoint: string, method = 'GET', body?: any) => {
    const token = getAuthToken();
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${apiUrl}${endpoint}`, options);
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'API Error');
    return data;
  }, [apiUrl]);

  const loadGrids = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/pricing-grids';
      if (filterType) endpoint += `?transportType=${filterType}`;
      const data = await apiCall(endpoint);
      setGrids(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createGrid = async () => {
    if (!formData.name || !formData.carrierId) {
      setError('Nom et ID transporteur requis');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        carrierId: formData.carrierId,
        industrialId: 'demo-industrie-org',
        transportType: formData.transportType,
        calculationType: formData.calculationType,
        createdBy: 'demo-industrie'
      };
      const data = await apiCall('/api/pricing-grids', 'POST', payload);
      setSuccessMsg(`Grille ${data.data.name} creee`);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', carrierId: '', transportType: 'LTL', calculationType: 'PER_PALLET' });
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const importExcel = async () => {
    if (!importData.file || !importData.gridName || !importData.carrierId) {
      setError('Fichier, nom de grille et transporteur requis');
      return;
    }
    try {
      setLoading(true);
      const token = getAuthToken();
      const formDataObj = new FormData();
      formDataObj.append('file', importData.file);
      formDataObj.append('gridName', importData.gridName);
      formDataObj.append('carrierId', importData.carrierId);
      formDataObj.append('industrialId', 'demo-industrie-org');
      formDataObj.append('transportType', importData.transportType);
      formDataObj.append('importedBy', 'demo-industrie');

      const response = await fetch(`${apiUrl}/api/pricing-grids/import/excel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataObj
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message || 'Import failed');

      setSuccessMsg(`Grille importee: ${data.importStats?.rowsProcessed || 0} lignes, ${data.importStats?.zonesCreated || 0} zones`);
      setShowImportModal(false);
      setImportData({ gridName: '', carrierId: '', transportType: 'LTL', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (type: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/api/pricing-grids/import/template/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${type.toLowerCase()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const activateGrid = async (gridId: string) => {
    try {
      setLoading(true);
      await apiCall(`/api/pricing-grids/${gridId}/activate`, 'POST', { activatedBy: 'demo-industrie' });
      setSuccessMsg('Grille activee');
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const suspendGrid = async (gridId: string) => {
    try {
      setLoading(true);
      await apiCall(`/api/pricing-grids/${gridId}/suspend`, 'POST', { suspendedBy: 'demo-industrie', reason: 'Suspension manuelle' });
      setSuccessMsg('Grille suspendue');
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteGrid = async (gridId: string) => {
    if (!confirm('Supprimer cette grille ?')) return;
    try {
      setLoading(true);
      await apiCall(`/api/pricing-grids/${gridId}`, 'DELETE');
      setSuccessMsg('Grille supprimee');
      setSelectedGrid(null);
      loadGrids();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOfferSelection = (offer: RouteOffer) => {
    const newSelected = new Map(selectedOffers);
    if (newSelected.has(offer.routeKey) && newSelected.get(offer.routeKey)?.carrierId === offer.carrierId) {
      newSelected.delete(offer.routeKey);
    } else {
      newSelected.set(offer.routeKey, offer);
    }
    setSelectedOffers(newSelected);
  };

  // Apply weighted optimization
  const applyOptimization = () => {
    const normalized = {
      price: optimizationWeights.price / 100,
      transit: optimizationWeights.transit / 100,
      score: optimizationWeights.score / 100
    };
    const newSelected = applyWeightedOptimization(consolidatedOffers, normalized);
    setSelectedOffers(newSelected);
    setSuccessMsg(`Optimisation appliquee (Prix: ${optimizationWeights.price}%, Delai: ${optimizationWeights.transit}%, Score: ${optimizationWeights.score}%)`);
  };

  // Save transport plan for auto-dispatch
  const saveTransportPlan = async () => {
    if (!planName.trim()) {
      setError('Veuillez saisir un nom pour le plan');
      return;
    }

    const selected = Array.from(selectedOffers.values());
    if (selected.length === 0) {
      setError('Aucune offre selectionnee');
      return;
    }

    try {
      setLoading(true);

      // Create plan summary
      const planSummary: TransportPlanSummary = {
        id: `PLAN-${Date.now()}`,
        name: planName,
        createdAt: new Date().toISOString(),
        totalRoutes: selected.length,
        totalCost: planStats.totalCost,
        avgTransit: planStats.avgTransit,
        carriersUsed: planStats.carriersUsed,
        optimizationStrategy: `Prix: ${optimizationWeights.price}%, Delai: ${optimizationWeights.transit}%, Score: ${optimizationWeights.score}%`,
        selectedOffers: selected
      };

      // Save to backend for use in auto-dispatch
      const payload = {
        planId: planSummary.id,
        name: planSummary.name,
        industrialId: 'demo-industrie-org',
        routes: selected.map(offer => ({
          routeKey: offer.routeKey,
          origin: offer.origin,
          destination: offer.destination,
          carrierId: offer.carrierId,
          carrierName: offer.carrierName,
          gridId: offer.gridId,
          transportType: offer.transportType,
          price: offer.price,
          priceUnit: offer.priceUnit,
          transitDays: offer.transitDays,
          carrierScore: offer.carrierScore,
          priority: offer.isLowestPrice ? 1 : offer.isBestScore ? 2 : 3
        })),
        optimization: {
          priceWeight: optimizationWeights.price,
          transitWeight: optimizationWeights.transit,
          scoreWeight: optimizationWeights.score
        },
        stats: {
          totalRoutes: planStats.totalRoutes,
          totalCost: planStats.totalCost,
          avgTransit: planStats.avgTransit,
          avgScore: planStats.avgScore,
          carriersUsed: planStats.carriersUsed
        },
        status: 'active',
        createdBy: 'demo-industrie'
      };

      // Save to pricing-grids API for consolidated plan
      await apiCall('/api/pricing-grids/consolidated-plan', 'POST', payload);

      // Also notify orders API for auto-dispatch integration
      try {
        const ordersApiUrl = process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net';
        await fetch(`${ordersApiUrl}/api/v1/dispatch/transport-plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            planId: planSummary.id,
            industrialId: 'demo-industrie-org',
            routes: payload.routes,
            activatedAt: new Date().toISOString()
          })
        });
      } catch (e) {
        console.warn('Could not sync with orders API:', e);
      }

      // Save locally
      setSavedPlans(prev => [planSummary, ...prev]);
      setSuccessMsg(`Plan "${planName}" sauvegarde et active pour l'auto-dispatch`);
      setShowSavePlanModal(false);
      setPlanName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Activate a saved plan for auto-dispatch
  const activatePlanForDispatch = async (plan: TransportPlanSummary) => {
    try {
      setLoading(true);

      const ordersApiUrl = process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net';
      await fetch(`${ordersApiUrl}/api/v1/dispatch/transport-plan/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          planId: plan.id,
          industrialId: 'demo-industrie-org'
        })
      });

      setSuccessMsg(`Plan "${plan.name}" active pour l'auto-dispatch`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoSelectBestOffers = (criterion: 'price' | 'score' | 'transit') => {
    const routeMap = new Map<string, RouteOffer[]>();
    consolidatedOffers.forEach(offer => {
      const existing = routeMap.get(offer.routeKey) || [];
      existing.push(offer);
      routeMap.set(offer.routeKey, existing);
    });

    const newSelected = new Map<string, RouteOffer>();
    routeMap.forEach((offers, routeKey) => {
      let best: RouteOffer | null = null;
      if (criterion === 'price') {
        best = offers.reduce((a, b) => a.price < b.price ? a : b);
      } else if (criterion === 'score') {
        best = offers.reduce((a, b) => a.carrierScore > b.carrierScore ? a : b);
      } else if (criterion === 'transit') {
        best = offers.reduce((a, b) => a.transitDays < b.transitDays ? a : b);
      }
      if (best) newSelected.set(routeKey, best);
    });

    setSelectedOffers(newSelected);
    setSuccessMsg(`${newSelected.size} offres selectionnees par ${criterion === 'price' ? 'meilleur prix' : criterion === 'score' ? 'meilleur score' : 'delai le plus court'}`);
  };

  const exportPlan = () => {
    const selected = Array.from(selectedOffers.values());
    const csv = [
      ['Route', 'Origine', 'Destination', 'Transporteur', 'Type', 'Prix', 'Unite', 'Delai (j)', 'Score'],
      ...selected.map(o => [
        o.routeKey, o.origin, o.destination, o.carrierName, o.transportType,
        o.price.toString(), o.priceUnit, o.transitDays.toString(), o.carrierScore.toString()
      ])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-transport-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Plan de transport exporte');
  };

  // Effects
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadGrids();
  }, [router, filterType]);

  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => { setError(null); setSuccessMsg(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  // Initialize selected offers from auto-selected
  useEffect(() => {
    const initial = new Map<string, RouteOffer>();
    consolidatedOffers.filter(o => o.selected).forEach(o => {
      if (!initial.has(o.routeKey)) {
        initial.set(o.routeKey, o);
      }
    });
    setSelectedOffers(initial);
  }, [consolidatedOffers]);

  // Styles
  const cardStyle = { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '20px' };
  const buttonStyle = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' as const, marginRight: '10px', marginBottom: '10px' };
  const inputStyle = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '100%', marginBottom: '10px' };
  const selectStyle = { ...inputStyle, background: 'rgba(30,30,50,0.8)' };
  const tabStyle = (active: boolean) => ({
    padding: '12px 24px',
    background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' as const : '400' as const,
    marginRight: '4px'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#00D084';
      case 'DRAFT': return '#f39c12';
      case 'SUSPENDED': return '#e74c3c';
      case 'ARCHIVED': return '#95a5a6';
      default: return '#667eea';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LTL': return '📦';
      case 'FTL': return '🚛';
      case 'MESSAGERIE': return '📬';
      default: return '📋';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00D084';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const renderScoreBar = (score: number, label: string, color?: string) => (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ opacity: 0.7 }}>{label}</span>
        <span style={{ fontWeight: '600' }}>{score}/100</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color || getScoreColor(score), transition: 'width 0.3s' }} />
      </div>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Head><title>Grilles Tarifaires | SYMPHONI.A</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Retour</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📋</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Grilles Tarifaires</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ ...buttonStyle, background: 'rgba(0,208,132,0.6)' }} onClick={() => setShowImportModal(true)}>
              📥 Importer Excel
            </button>
            <button style={buttonStyle} onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Annuler' : '+ Nouvelle Grille'}
            </button>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(255,0,0,0.3)', padding: '15px 40px' }}>{error}</div>}
        {successMsg && <div style={{ background: 'rgba(0,255,0,0.2)', padding: '15px 40px' }}>{successMsg}</div>}

        {/* Tabs */}
        <div style={{ padding: '20px 40px 0', maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'flex' }}>
            <button style={tabStyle(activeTab === 'grids')} onClick={() => setActiveTab('grids')}>
              📋 Mes Grilles ({grids.length})
            </button>
            <button style={tabStyle(activeTab === 'analysis')} onClick={() => setActiveTab('analysis')}>
              📊 Analyse & Scoring
            </button>
            <button style={tabStyle(activeTab === 'plan')} onClick={() => setActiveTab('plan')}>
              🗺️ Plan Transport Consolide
            </button>
          </div>
        </div>

        <div style={{ padding: '0 40px 40px', maxWidth: '1600px', margin: '0 auto' }}>
          {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>}

          {/* ============================================================ */}
          {/* TAB: GRILLES */}
          {/* ============================================================ */}
          {activeTab === 'grids' && (
            <>
              {/* Filtres */}
              <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 24px', marginTop: '20px' }}>
                <span style={{ opacity: 0.7 }}>Filtrer par type:</span>
                {['', 'LTL', 'FTL', 'MESSAGERIE'].map(type => (
                  <button
                    key={type}
                    style={{ ...buttonStyle, background: filterType === type ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', padding: '6px 16px' }}
                    onClick={() => setFilterType(type)}
                  >
                    {type === '' ? 'Tous' : `${getTypeIcon(type)} ${type}`}
                  </button>
                ))}
              </div>

              {/* Formulaire de creation */}
              {showCreateForm && (
                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0 }}>Nouvelle Grille Tarifaire</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                    <div>
                      <label style={{ fontSize: '12px', opacity: 0.7 }}>Nom de la grille *</label>
                      <input style={inputStyle} placeholder="Ex: Tarif LTL 2024" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', opacity: 0.7 }}>ID Transporteur *</label>
                      <input style={inputStyle} placeholder="Ex: CARRIER-001" value={formData.carrierId} onChange={e => setFormData({ ...formData, carrierId: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', opacity: 0.7 }}>Type de transport</label>
                      <select style={selectStyle} value={formData.transportType} onChange={e => {
                        const type = e.target.value;
                        let calcType = 'PER_PALLET';
                        if (type === 'FTL') calcType = 'FLAT_RATE';
                        if (type === 'MESSAGERIE') calcType = 'PER_WEIGHT';
                        setFormData({ ...formData, transportType: type, calculationType: calcType });
                      }}>
                        <option value="LTL">📦 Groupage (LTL) - par palette</option>
                        <option value="FTL">🚛 Lot complet (FTL) - forfait/km</option>
                        <option value="MESSAGERIE">📬 Messagerie - par poids</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <button style={buttonStyle} onClick={createGrid}>Creer la grille</button>
                  </div>
                </div>
              )}

              {/* Liste des grilles */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Mes Grilles Tarifaires ({grids.length})</h3>
                </div>

                {grids.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', opacity: 0.7 }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <div>Aucune grille tarifaire</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {grids.map(grid => (
                      <div key={grid.gridId} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '24px' }}>{getTypeIcon(grid.transportType)}</span>
                              <strong style={{ fontSize: '16px' }}>{grid.name}</strong>
                              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: `${getStatusColor(grid.status)}30`, color: getStatusColor(grid.status) }}>
                                {grid.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.7 }}>
                              Transporteur: {grid.carrierId} | Cree le: {new Date(grid.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {grid.status === 'DRAFT' && (
                              <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(0,208,132,0.6)', marginRight: 0 }} onClick={() => activateGrid(grid.gridId)}>Activer</button>
                            )}
                            {grid.status === 'ACTIVE' && (
                              <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(243,156,18,0.6)', marginRight: 0 }} onClick={() => suspendGrid(grid.gridId)}>Suspendre</button>
                            )}
                            {grid.status === 'DRAFT' && (
                              <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px', background: 'rgba(231,76,60,0.6)', marginRight: 0 }} onClick={() => deleteGrid(grid.gridId)}>Supprimer</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* TAB: ANALYSE & SCORING */}
          {/* ============================================================ */}
          {activeTab === 'analysis' && (
            <>
              {/* Sub-tabs for analysis */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', marginBottom: '20px' }}>
                <button
                  style={{ ...buttonStyle, background: analysisView === 'scoring' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => setAnalysisView('scoring')}
                >
                  ⭐ Scoring Transporteurs
                </button>
                <button
                  style={{ ...buttonStyle, background: analysisView === 'routes' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => setAnalysisView('routes')}
                >
                  🗺️ Comparaison Routes ({routesWithCompetition.length} avec concurrence)
                </button>
                <button
                  style={{ ...buttonStyle, background: analysisView === 'simulation' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => setAnalysisView('simulation')}
                >
                  📈 Simulation Couts
                </button>
              </div>

              {/* Stats globales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚛</div>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>{carrierScores.length}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Transporteurs actifs</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>{grids.filter(g => g.status === 'ACTIVE').length}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Grilles actives</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>{routeComparisons.length}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Routes couvertes</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#00D084' }}>{routesWithCompetition.length}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Avec concurrence</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>{carrierScores.length > 0 ? Math.round(carrierScores.reduce((s, c) => s + c.globalScore, 0) / carrierScores.length) : 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Score moyen</div>
                </div>
              </div>

              {/* ============== VIEW: SCORING ============== */}
              {analysisView === 'scoring' && (
                <>
                  {/* Classement transporteurs */}
                  <div style={cardStyle}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Classement des Transporteurs par Score Global</h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {carrierScores.map((carrier, index) => (
                        <div key={carrier.carrierId} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: index === 0 ? '2px solid #00D084' : '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{
                                  width: '40px', height: '40px', borderRadius: '50%',
                                  background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'rgba(255,255,255,0.2)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '18px', fontWeight: '700', color: index < 3 ? '#000' : '#fff'
                                }}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{carrier.carrierName}</div>
                                  <div style={{ fontSize: '13px', opacity: 0.7 }}>{carrier.carrierId}</div>
                                </div>
                                <div style={{
                                  marginLeft: 'auto',
                                  padding: '8px 20px',
                                  borderRadius: '20px',
                                  background: `${getScoreColor(carrier.globalScore)}30`,
                                  color: getScoreColor(carrier.globalScore),
                                  fontSize: '24px',
                                  fontWeight: '700'
                                }}>
                                  {carrier.globalScore}
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                <div>{renderScoreBar(carrier.priceScore, 'Prix', '#3b82f6')}</div>
                                <div>{renderScoreBar(carrier.coverageScore, 'Couverture', '#8b5cf6')}</div>
                                <div>{renderScoreBar(carrier.transitScore, 'Delai', '#f59e0b')}</div>
                                <div>{renderScoreBar(carrier.reliabilityScore, 'Fiabilite', '#10b981')}</div>
                              </div>

                              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', fontSize: '13px' }}>
                                <div><span style={{ opacity: 0.6 }}>Routes:</span> <strong>{carrier.totalRoutes}</strong></div>
                                <div><span style={{ opacity: 0.6 }}>Prix moyen:</span> <strong>{carrier.avgPrice} EUR</strong></div>
                                <div><span style={{ opacity: 0.6 }}>Delai moyen:</span> <strong>{carrier.avgTransitDays}j</strong></div>
                                <div><span style={{ opacity: 0.6 }}>Ponctualite:</span> <strong>{carrier.onTimeRate}%</strong></div>
                                <div><span style={{ opacity: 0.6 }}>Grilles:</span> <strong>{carrier.gridsCount}</strong></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {carrierScores.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '60px', opacity: 0.7 }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                        <div>Aucun transporteur avec grille active</div>
                        <div style={{ fontSize: '13px', marginTop: '8px' }}>Activez des grilles tarifaires pour voir le scoring</div>
                      </div>
                    )}
                  </div>

                  {/* Legende scoring */}
                  <div style={cardStyle}>
                    <h4 style={{ marginTop: 0 }}>Comment fonctionne le scoring ?</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', fontSize: '13px' }}>
                      <div>
                        <div style={{ color: '#3b82f6', fontWeight: '600', marginBottom: '4px' }}>Prix (35%)</div>
                        <div style={{ opacity: 0.7 }}>Plus les prix sont competitifs, plus le score est eleve</div>
                      </div>
                      <div>
                        <div style={{ color: '#8b5cf6', fontWeight: '600', marginBottom: '4px' }}>Couverture (20%)</div>
                        <div style={{ opacity: 0.7 }}>Plus le nombre de routes couvertes est eleve, meilleur est le score</div>
                      </div>
                      <div>
                        <div style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '4px' }}>Delai (25%)</div>
                        <div style={{ opacity: 0.7 }}>Plus les delais de transit sont courts, plus le score est eleve</div>
                      </div>
                      <div>
                        <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>Fiabilite (20%)</div>
                        <div style={{ opacity: 0.7 }}>Base sur le taux de ponctualite historique du transporteur</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ============== VIEW: ROUTE COMPARISONS ============== */}
              {analysisView === 'routes' && (
                <>
                  <div style={cardStyle}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Comparaison des Offres par Route</h3>
                    <p style={{ opacity: 0.7, marginBottom: '20px' }}>
                      {routesWithCompetition.length} routes avec plusieurs offres concurrentes - identifiez les opportunites d'optimisation
                    </p>

                    {routesWithCompetition.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px', opacity: 0.7 }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                        <div>Aucune route avec concurrence</div>
                        <div style={{ fontSize: '13px', marginTop: '8px' }}>Ajoutez des grilles de plusieurs transporteurs pour comparer</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {routesWithCompetition.slice(0, 20).map((route) => (
                          <div key={route.routeKey} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                              <div>
                                <div style={{ fontSize: '16px', fontWeight: '700' }}>{route.origin} → {route.destination}</div>
                                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                                  {getTypeIcon(route.transportType)} {route.transportType} | {route.offers.length} offres
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Ecart prix</div>
                                  <div style={{ fontSize: '18px', fontWeight: '700', color: route.priceDiffPercent > 20 ? '#00D084' : '#f59e0b' }}>
                                    {route.priceDiffPercent}%
                                  </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Ecart delai</div>
                                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                                    {route.transitDiffDays}j
                                  </div>
                                </div>
                                <button
                                  style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px' }}
                                  onClick={() => setShowRouteDetail(showRouteDetail === route.routeKey ? null : route.routeKey)}
                                >
                                  {showRouteDetail === route.routeKey ? 'Masquer' : 'Details'}
                                </button>
                              </div>
                            </div>

                            {/* Meilleurs choix */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: showRouteDetail === route.routeKey ? '16px' : 0 }}>
                              <div style={{ background: 'rgba(0,208,132,0.2)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>💰 Meilleur prix</div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{route.bestPrice?.carrierName}</div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#00D084' }}>{route.bestPrice?.price} EUR</div>
                              </div>
                              <div style={{ background: 'rgba(245,158,11,0.2)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>⚡ Plus rapide</div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{route.bestTransit?.carrierName}</div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>{route.bestTransit?.transitDays}j</div>
                              </div>
                              <div style={{ background: 'rgba(139,92,246,0.2)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>⭐ Meilleur score</div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{route.bestScore?.carrierName}</div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#8b5cf6' }}>{route.bestScore?.carrierScore}/100</div>
                              </div>
                              <div style={{ background: 'rgba(102,126,234,0.2)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>⚖️ Meilleur equilibre</div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{route.bestBalanced?.carrierName}</div>
                                <div style={{ fontSize: '13px', color: '#667eea' }}>{route.bestBalanced?.price} EUR | {route.bestBalanced?.transitDays}j | {route.bestBalanced?.carrierScore}</div>
                              </div>
                            </div>

                            {/* Details expanded */}
                            {showRouteDetail === route.routeKey && (
                              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                      <th style={{ padding: '8px' }}>Transporteur</th>
                                      <th style={{ padding: '8px', textAlign: 'right' }}>Prix</th>
                                      <th style={{ padding: '8px', textAlign: 'center' }}>Delai</th>
                                      <th style={{ padding: '8px', textAlign: 'center' }}>Score</th>
                                      <th style={{ padding: '8px' }}>Tags</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {route.offers.map((offer, idx) => (
                                      <tr key={`${offer.carrierId}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '8px' }}>
                                          <div style={{ fontWeight: '600' }}>{offer.carrierName}</div>
                                          <div style={{ fontSize: '11px', opacity: 0.6 }}>{offer.gridName}</div>
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: offer.isLowestPrice ? '#00D084' : 'inherit' }}>
                                          {offer.price} EUR
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center', color: offer.isFastestTransit ? '#f59e0b' : 'inherit' }}>
                                          {offer.transitDays}j
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                          <span style={{ padding: '2px 8px', borderRadius: '10px', background: `${getScoreColor(offer.carrierScore)}30`, color: getScoreColor(offer.carrierScore) }}>
                                            {offer.carrierScore}
                                          </span>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                          {offer.isLowestPrice && <span style={{ marginRight: '4px', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,208,132,0.3)', color: '#00D084' }}>💰 Moins cher</span>}
                                          {offer.isFastestTransit && <span style={{ marginRight: '4px', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}>⚡ Rapide</span>}
                                          {offer.isBestScore && <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,92,246,0.3)', color: '#8b5cf6' }}>⭐ Score</span>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Routes sans concurrence */}
                  {routesWithoutCompetition.length > 0 && (
                    <div style={cardStyle}>
                      <h4 style={{ marginTop: 0, marginBottom: '16px' }}>Routes sans concurrence ({routesWithoutCompetition.length})</h4>
                      <p style={{ opacity: 0.7, marginBottom: '16px', fontSize: '13px' }}>
                        Ces routes n'ont qu'un seul transporteur - considerez d'ajouter des offres alternatives
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {routesWithoutCompetition.slice(0, 30).map(route => (
                          <span key={route.routeKey} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', fontSize: '12px' }}>
                            {route.origin} → {route.destination}
                          </span>
                        ))}
                        {routesWithoutCompetition.length > 30 && (
                          <span style={{ padding: '6px 12px', fontSize: '12px', opacity: 0.7 }}>
                            +{routesWithoutCompetition.length - 30} autres
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ============== VIEW: SIMULATION ============== */}
              {analysisView === 'simulation' && (
                <>
                  {/* Parametres simulation */}
                  <div style={cardStyle}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Simulation de Couts</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                      <div>
                        <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>Volume mensuel (transports)</label>
                        <input
                          type="number"
                          style={inputStyle}
                          value={monthlyVolume}
                          onChange={e => setMonthlyVolume(parseInt(e.target.value) || 0)}
                          min="1"
                        />
                        <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
                          Reparti equitablement sur {routeComparisons.length} routes
                        </p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Cout actuel (moyenne)</div>
                          <div style={{ fontSize: '28px', fontWeight: '700' }}>{costSimulation.currentCost.toLocaleString()} EUR</div>
                        </div>
                        <div style={{ background: 'rgba(0,208,132,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Cout optimise</div>
                          <div style={{ fontSize: '28px', fontWeight: '700', color: '#00D084' }}>{costSimulation.optimizedCost.toLocaleString()} EUR</div>
                        </div>
                        <div style={{ background: 'rgba(102,126,234,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Economies</div>
                          <div style={{ fontSize: '28px', fontWeight: '700', color: '#667eea' }}>{costSimulation.savings.toLocaleString()} EUR</div>
                          <div style={{ fontSize: '16px', color: '#00D084' }}>({costSimulation.savingsPercent}%)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optimisation pondérée */}
                  <div style={cardStyle}>
                    <h4 style={{ marginTop: 0, marginBottom: '20px' }}>Optimisation Ponderee</h4>
                    <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '13px' }}>
                      Ajustez les poids pour trouver le meilleur equilibre entre prix, delai et fiabilite
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#3b82f6', fontWeight: '600' }}>💰 Prix</span>
                          <span>{optimizationWeights.price}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={optimizationWeights.price}
                          onChange={e => setOptimizationWeights(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#f59e0b', fontWeight: '600' }}>⚡ Delai</span>
                          <span>{optimizationWeights.transit}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={optimizationWeights.transit}
                          onChange={e => setOptimizationWeights(prev => ({ ...prev, transit: parseInt(e.target.value) }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#10b981', fontWeight: '600' }}>⭐ Score fiabilite</span>
                          <span>{optimizationWeights.score}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={optimizationWeights.score}
                          onChange={e => setOptimizationWeights(prev => ({ ...prev, score: parseInt(e.target.value) }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={buttonStyle} onClick={applyOptimization}>
                        Appliquer l'optimisation
                      </button>
                      <button
                        style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)' }}
                        onClick={() => setOptimizationWeights({ price: 40, transit: 30, score: 30 })}
                      >
                        Reinitialiser (40/30/30)
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* TAB: PLAN TRANSPORT CONSOLIDE */}
          {/* ============================================================ */}
          {activeTab === 'plan' && (
            <>
              {/* Stats du plan */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginTop: '20px' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗺️</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{planStats.totalRoutes}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Routes selectionnees</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💶</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{Math.round(planStats.totalCost)} EUR</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Cout total estime</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏱️</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{planStats.avgTransit.toFixed(1)}j</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Delai moyen</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⭐</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{planStats.avgScore}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Score moyen</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚛</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{planStats.carriersUsed}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Transporteurs utilises</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <span style={{ opacity: 0.7, fontWeight: '600' }}>Selection automatique:</span>
                <button style={{ ...buttonStyle, background: 'rgba(59,130,246,0.6)' }} onClick={() => autoSelectBestOffers('price')}>
                  💰 Meilleur prix
                </button>
                <button style={{ ...buttonStyle, background: 'rgba(139,92,246,0.6)' }} onClick={() => autoSelectBestOffers('score')}>
                  ⭐ Meilleur score
                </button>
                <button style={{ ...buttonStyle, background: 'rgba(245,158,11,0.6)' }} onClick={() => autoSelectBestOffers('transit')}>
                  ⚡ Plus rapide
                </button>
                <button style={{ ...buttonStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} onClick={applyOptimization}>
                  ⚖️ Equilibre ({optimizationWeights.price}/{optimizationWeights.transit}/{optimizationWeights.score})
                </button>
                <div style={{ flex: 1 }} />
                <button style={{ ...buttonStyle, background: 'rgba(0,208,132,0.6)' }} onClick={exportPlan}>
                  📥 Exporter CSV
                </button>
                <button
                  style={{ ...buttonStyle, background: 'linear-gradient(135deg, #00D084 0%, #059669 100%)' }}
                  onClick={() => setShowSavePlanModal(true)}
                  disabled={planStats.totalRoutes === 0}
                >
                  🚀 Activer pour Auto-Dispatch
                </button>
              </div>

              {/* Filtres */}
              <div style={{ ...cardStyle, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Origine</label>
                  <input
                    style={inputStyle}
                    placeholder="Rechercher..."
                    value={planFilter.origin}
                    onChange={e => setPlanFilter({ ...planFilter, origin: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Destination</label>
                  <input
                    style={inputStyle}
                    placeholder="Rechercher..."
                    value={planFilter.destination}
                    onChange={e => setPlanFilter({ ...planFilter, destination: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Type</label>
                  <select
                    style={selectStyle}
                    value={planFilter.type}
                    onChange={e => setPlanFilter({ ...planFilter, type: e.target.value })}
                  >
                    <option value="">Tous</option>
                    <option value="LTL">LTL (Groupage)</option>
                    <option value="FTL">FTL (Complet)</option>
                    <option value="MESSAGERIE">Messagerie</option>
                  </select>
                </div>
                <button
                  style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)', marginBottom: '10px' }}
                  onClick={() => setPlanFilter({ origin: '', destination: '', type: '' })}
                >
                  Reinitialiser
                </button>
              </div>

              {/* Tableau des offres */}
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
                  Offres par Route ({filteredOffers.length} offres - {new Set(filteredOffers.map(o => o.routeKey)).size} routes)
                </h3>

                {filteredOffers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', opacity: 0.7 }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                    <div>Aucune offre disponible</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.1)', textAlign: 'left' }}>
                          <th style={{ padding: '12px', width: '40px' }}></th>
                          <th style={{ padding: '12px' }}>Origine</th>
                          <th style={{ padding: '12px' }}>Destination</th>
                          <th style={{ padding: '12px' }}>Transporteur</th>
                          <th style={{ padding: '12px' }}>Type</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Prix</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Delai</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Score</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOffers.map((offer, idx) => {
                          const isSelected = selectedOffers.get(offer.routeKey)?.carrierId === offer.carrierId;
                          return (
                            <tr
                              key={`${offer.routeKey}-${offer.carrierId}-${idx}`}
                              style={{
                                background: isSelected ? 'rgba(102,126,234,0.2)' : idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleOfferSelection(offer)}
                            >
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleOfferSelection(offer)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </td>
                              <td style={{ padding: '12px' }}>{offer.origin}</td>
                              <td style={{ padding: '12px' }}>{offer.destination}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: '600' }}>{offer.carrierName}</div>
                                <div style={{ fontSize: '11px', opacity: 0.6 }}>{offer.gridName}</div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '11px' }}>
                                  {getTypeIcon(offer.transportType)} {offer.transportType}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ fontWeight: '600', color: offer.isLowestPrice ? '#00D084' : 'inherit' }}>
                                  {offer.price} EUR
                                </div>
                                <div style={{ fontSize: '11px', opacity: 0.6 }}>{offer.priceUnit}</div>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <span style={{ color: offer.isFastestTransit ? '#00D084' : 'inherit', fontWeight: offer.isFastestTransit ? '600' : '400' }}>
                                  {offer.transitDays}j
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  background: `${getScoreColor(offer.carrierScore)}30`,
                                  color: getScoreColor(offer.carrierScore),
                                  fontWeight: '600',
                                  fontSize: '12px'
                                }}>
                                  {offer.carrierScore}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                  {offer.isLowestPrice && (
                                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,208,132,0.3)', color: '#00D084', fontSize: '10px' }}>
                                      💰 Moins cher
                                    </span>
                                  )}
                                  {offer.isFastestTransit && (
                                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '10px' }}>
                                      ⚡ Plus rapide
                                    </span>
                                  )}
                                  {offer.isBestScore && (
                                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,92,246,0.3)', color: '#8b5cf6', fontSize: '10px' }}>
                                      ⭐ Meilleur score
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Import Excel */}
        {showImportModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ ...cardStyle, width: '600px', maxWidth: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>📥 Importer une grille depuis Excel</h3>
                <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>x</button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Type de grille *</label>
                <select style={selectStyle} value={importData.transportType} onChange={e => setImportData({ ...importData, transportType: e.target.value })}>
                  <option value="LTL">📦 LTL (Groupage palette)</option>
                  <option value="FTL">🚛 FTL (Lot complet)</option>
                  <option value="MESSAGERIE">📬 Messagerie (Dept/Poids)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Nom de la grille *</label>
                <input style={inputStyle} placeholder="Ex: Tarif Geodis LTL 2024" value={importData.gridName} onChange={e => setImportData({ ...importData, gridName: e.target.value })} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>ID Transporteur *</label>
                <input style={inputStyle} placeholder="Ex: CARRIER-001" value={importData.carrierId} onChange={e => setImportData({ ...importData, carrierId: e.target.value })} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', opacity: 0.7 }}>Fichier Excel (.xlsx) *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ ...inputStyle, padding: '10px' }}
                  onChange={e => setImportData({ ...importData, file: e.target.files?.[0] || null })}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', marginBottom: '10px' }}>Telecharger un template:</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px' }} onClick={() => downloadTemplate('LTL')}>Template LTL</button>
                  <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px' }} onClick={() => downloadTemplate('FTL')}>Template FTL</button>
                  <button style={{ ...buttonStyle, padding: '6px 12px', fontSize: '12px' }} onClick={() => downloadTemplate('MESSAGERIE')}>Template Messagerie</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ ...buttonStyle, background: 'rgba(0,208,132,0.8)' }} onClick={importExcel}>
                  Importer
                </button>
                <button style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowImportModal(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sauvegarder Plan pour Auto-Dispatch */}
        {showSavePlanModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ ...cardStyle, width: '600px', maxWidth: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>🚀 Activer le Plan pour Auto-Dispatch</h3>
                <button onClick={() => setShowSavePlanModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>x</button>
              </div>

              <div style={{ background: 'rgba(0,208,132,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Ce plan sera utilise pour l'attribution automatique des commandes aux transporteurs.
                  Chaque nouvelle commande sera automatiquement assignee au transporteur optimal en fonction de la route et des criteres de ce plan.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Routes couvertes</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{planStats.totalRoutes}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Transporteurs</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{planStats.carriersUsed}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Cout moyen</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{Math.round(planStats.totalCost / planStats.totalRoutes || 0)} EUR</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Score moyen</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{planStats.avgScore}/100</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>Nom du plan *</label>
                <input
                  style={inputStyle}
                  placeholder="Ex: Plan Transport Q1 2024"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>Strategie d'optimisation appliquee:</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <span style={{ color: '#3b82f6' }}>💰 Prix: {optimizationWeights.price}%</span>
                  <span style={{ color: '#f59e0b' }}>⚡ Delai: {optimizationWeights.transit}%</span>
                  <span style={{ color: '#10b981' }}>⭐ Score: {optimizationWeights.score}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={{ ...buttonStyle, background: 'linear-gradient(135deg, #00D084 0%, #059669 100%)' }}
                  onClick={saveTransportPlan}
                  disabled={loading || !planName.trim()}
                >
                  {loading ? 'Activation...' : 'Activer le Plan'}
                </button>
                <button
                  style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => setShowSavePlanModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans sauvegardes */}
        {savedPlans.length > 0 && activeTab === 'plan' && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(30,30,50,0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '300px', zIndex: 100 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Plans Sauvegardes ({savedPlans.length})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {savedPlans.slice(0, 5).map(plan => (
                <div key={plan.id} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '8px', fontSize: '12px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{plan.name}</div>
                  <div style={{ opacity: 0.7 }}>{plan.totalRoutes} routes | {plan.carriersUsed} transporteurs</div>
                  <button
                    style={{ ...buttonStyle, padding: '4px 8px', fontSize: '11px', marginTop: '6px' }}
                    onClick={() => activatePlanForDispatch(plan)}
                  >
                    Reactiver
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
