/**
 * Configuration Grille Tarifaire - Portail Industrie
 * Définir la structure de grille que les transporteurs devront renseigner
 * + Frais annexes prévus à l'exploitation
 */

import { useEffect, useState, useCallback } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';
import { API_CONFIG, pricingGridsApi } from '../lib/api';

// Types pour la configuration de grille
interface ZoneDefinition {
  id: string;
  code: string;
  name: string;
  type: 'region' | 'department' | 'country' | 'custom';
  isRequired: boolean;
}

interface PricingColumn {
  id: string;
  name: string;
  type: 'price' | 'rate' | 'percentage' | 'integer' | 'text';
  unit: string;
  isRequired: boolean;
  defaultValue?: string | number;
  minValue?: number;
  maxValue?: number;
  description?: string;
}

interface VehicleType {
  id: string;
  name: string;
  code: string;
  capacity: string;
  isActive: boolean;
}

interface AdditionalFee {
  id: string;
  code: string;
  name: string;
  description: string;
  calculationType: 'fixed' | 'percentage' | 'per_unit' | 'per_hour' | 'per_km';
  unit: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  isRequired: boolean;
  isActive: boolean;
  applicableTo: ('LTL' | 'FTL' | 'MESSAGERIE')[];
  category: 'manutention' | 'attente' | 'livraison' | 'administratif' | 'exceptionnel' | 'carburant' | 'autre';
}

// Fichiers joints à la demande de tarif
interface AttachedFile {
  id: string;
  name: string;
  originalName: string;
  type: 'excel' | 'pdf' | 'other';
  mimeType: string;
  size: number;
  url?: string;
  s3Key?: string;
  description?: string;
  category: 'template' | 'specifications' | 'conditions' | 'other';
  uploadedAt: string;
}

interface PricingGridConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  transportTypes: ('LTL' | 'FTL' | 'MESSAGERIE')[];
  zones: ZoneDefinition[];
  columns: PricingColumn[];
  vehicleTypes: VehicleType[];
  additionalFees: AdditionalFee[];
  attachedFiles: AttachedFile[];
  fuelSurcharge: {
    type: 'indexed' | 'fixed' | 'none';
    indexReference?: string;
    updateFrequency?: 'weekly' | 'monthly' | 'quarterly';
    minRate?: number;
    maxRate?: number;
  };
  paymentTerms: {
    defaultDays: number;
    options: number[];
  };
  volumeDiscounts: {
    enabled: boolean;
    thresholds: Array<{ minTransports: number; discountPercent: number }>;
  };
  validityPeriod: {
    defaultMonths: number;
    minMonths: number;
    maxMonths: number;
  };
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'archived';
}

// Frais annexes standards prédéfinis
const DEFAULT_FEES: AdditionalFee[] = [
  {
    id: 'fee-1',
    code: 'MANUT_PALETTE',
    name: 'Manutention palette',
    description: 'Manutention et déchargement par palette',
    calculationType: 'per_unit',
    unit: '€/palette',
    defaultValue: 3.50,
    minValue: 0,
    maxValue: 20,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'manutention'
  },
  {
    id: 'fee-2',
    code: 'ATTENTE_HEURE',
    name: 'Attente chauffeur',
    description: 'Temps d\'attente au-delà du temps gratuit (1h)',
    calculationType: 'per_hour',
    unit: '€/heure',
    defaultValue: 45,
    minValue: 20,
    maxValue: 100,
    isRequired: true,
    isActive: true,
    applicableTo: ['LTL', 'FTL', 'MESSAGERIE'],
    category: 'attente'
  },
  {
    id: 'fee-3',
    code: 'LIVRAISON_EXPRESS',
    name: 'Livraison express (J+1)',
    description: 'Supplément pour livraison le lendemain',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 30,
    minValue: 10,
    maxValue: 100,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'MESSAGERIE'],
    category: 'livraison'
  },
  {
    id: 'fee-4',
    code: 'LIVRAISON_SAMEDI',
    name: 'Livraison samedi',
    description: 'Supplément pour livraison le samedi',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 50,
    minValue: 20,
    maxValue: 150,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL', 'MESSAGERIE'],
    category: 'livraison'
  },
  {
    id: 'fee-5',
    code: 'RDV_FIXE',
    name: 'Rendez-vous fixe (créneau 2h)',
    description: 'Livraison sur créneau horaire précis',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 25,
    minValue: 10,
    maxValue: 80,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'livraison'
  },
  {
    id: 'fee-6',
    code: 'HAYON',
    name: 'Livraison hayon',
    description: 'Véhicule avec hayon élévateur requis',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 35,
    minValue: 15,
    maxValue: 100,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL'],
    category: 'manutention'
  },
  {
    id: 'fee-7',
    code: 'ADR',
    name: 'Transport ADR (matières dangereuses)',
    description: 'Supplément pour transport de matières dangereuses',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 40,
    minValue: 20,
    maxValue: 100,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'exceptionnel'
  },
  {
    id: 'fee-8',
    code: 'ETAGE',
    name: 'Livraison en étage',
    description: 'Montée en étage sans ascenseur',
    calculationType: 'per_unit',
    unit: '€/étage',
    defaultValue: 8,
    minValue: 5,
    maxValue: 25,
    isRequired: false,
    isActive: true,
    applicableTo: ['MESSAGERIE'],
    category: 'manutention'
  },
  {
    id: 'fee-9',
    code: 'CONTRE_REMBOURSEMENT',
    name: 'Contre-remboursement',
    description: 'Encaissement à la livraison',
    calculationType: 'percentage',
    unit: '% du montant',
    defaultValue: 2,
    minValue: 1,
    maxValue: 5,
    isRequired: false,
    isActive: true,
    applicableTo: ['MESSAGERIE'],
    category: 'administratif'
  },
  {
    id: 'fee-10',
    code: 'SURCHARGE_CARBURANT',
    name: 'Surcharge carburant',
    description: 'Indexation carburant (CNR Gazole)',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 15,
    minValue: 0,
    maxValue: 50,
    isRequired: true,
    isActive: true,
    applicableTo: ['LTL', 'FTL', 'MESSAGERIE'],
    category: 'carburant'
  },
  {
    id: 'fee-11',
    code: 'IMMOBILISATION',
    name: 'Immobilisation véhicule',
    description: 'Immobilisation du véhicule pour chargement/déchargement prolongé',
    calculationType: 'per_hour',
    unit: '€/heure',
    defaultValue: 75,
    minValue: 40,
    maxValue: 150,
    isRequired: false,
    isActive: true,
    applicableTo: ['FTL'],
    category: 'attente'
  },
  {
    id: 'fee-12',
    code: 'DOCUMENT_DOUANE',
    name: 'Formalités douanières',
    description: 'Gestion des documents douaniers (export/import)',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 50,
    minValue: 20,
    maxValue: 200,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'administratif'
  },
  {
    id: 'fee-13',
    code: 'TEMPERATURE_DIRIGEE',
    name: 'Transport température dirigée',
    description: 'Véhicule frigorifique ou isotherme',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 25,
    minValue: 10,
    maxValue: 80,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'exceptionnel'
  },
  {
    id: 'fee-14',
    code: 'NOTIFICATION_LIVRAISON',
    name: 'Notification de livraison (SMS/Email)',
    description: 'Avis de passage et notification au destinataire',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 1.50,
    minValue: 0.50,
    maxValue: 5,
    isRequired: false,
    isActive: true,
    applicableTo: ['MESSAGERIE'],
    category: 'administratif'
  },
  {
    id: 'fee-15',
    code: 'ASSURANCE_AD_VALOREM',
    name: 'Assurance Ad Valorem',
    description: 'Assurance complémentaire sur valeur déclarée',
    calculationType: 'percentage',
    unit: '% de la valeur',
    defaultValue: 0.3,
    minValue: 0.1,
    maxValue: 2,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL', 'MESSAGERIE'],
    category: 'administratif'
  }
];

// Types de véhicules prédéfinis
const DEFAULT_VEHICLES: VehicleType[] = [
  { id: 'v1', code: 'VL', name: 'Véhicule Léger (3.5T)', capacity: '1.5T / 12m³', isActive: true },
  { id: 'v2', code: 'PORTEUR', name: 'Porteur (19T)', capacity: '9T / 45m³', isActive: true },
  { id: 'v3', code: 'SEMI', name: 'Semi-remorque', capacity: '25T / 90m³', isActive: true },
  { id: 'v4', code: 'MEGA', name: 'Méga (Grand volume)', capacity: '24T / 100m³', isActive: true },
  { id: 'v5', code: 'FRIGO', name: 'Frigorifique', capacity: 'Variable', isActive: true },
  { id: 'v6', code: 'BACHE', name: 'Bâché / Tautliner', capacity: '25T / 90m³', isActive: true },
  { id: 'v7', code: 'PLATEAU', name: 'Plateau / Savoyarde', capacity: '25T', isActive: false },
  { id: 'v8', code: 'CITERNE', name: 'Citerne', capacity: '30m³', isActive: false },
];

// Départements France (101 départements)
const ZONES_FRANCE = [
  // Métropole
  { code: '01', name: 'Ain' },
  { code: '02', name: 'Aisne' },
  { code: '03', name: 'Allier' },
  { code: '04', name: 'Alpes-de-Haute-Provence' },
  { code: '05', name: 'Hautes-Alpes' },
  { code: '06', name: 'Alpes-Maritimes' },
  { code: '07', name: 'Ardèche' },
  { code: '08', name: 'Ardennes' },
  { code: '09', name: 'Ariège' },
  { code: '10', name: 'Aube' },
  { code: '11', name: 'Aude' },
  { code: '12', name: 'Aveyron' },
  { code: '13', name: 'Bouches-du-Rhône' },
  { code: '14', name: 'Calvados' },
  { code: '15', name: 'Cantal' },
  { code: '16', name: 'Charente' },
  { code: '17', name: 'Charente-Maritime' },
  { code: '18', name: 'Cher' },
  { code: '19', name: 'Corrèze' },
  { code: '2A', name: 'Corse-du-Sud' },
  { code: '2B', name: 'Haute-Corse' },
  { code: '21', name: 'Côte-d\'Or' },
  { code: '22', name: 'Côtes-d\'Armor' },
  { code: '23', name: 'Creuse' },
  { code: '24', name: 'Dordogne' },
  { code: '25', name: 'Doubs' },
  { code: '26', name: 'Drôme' },
  { code: '27', name: 'Eure' },
  { code: '28', name: 'Eure-et-Loir' },
  { code: '29', name: 'Finistère' },
  { code: '30', name: 'Gard' },
  { code: '31', name: 'Haute-Garonne' },
  { code: '32', name: 'Gers' },
  { code: '33', name: 'Gironde' },
  { code: '34', name: 'Hérault' },
  { code: '35', name: 'Ille-et-Vilaine' },
  { code: '36', name: 'Indre' },
  { code: '37', name: 'Indre-et-Loire' },
  { code: '38', name: 'Isère' },
  { code: '39', name: 'Jura' },
  { code: '40', name: 'Landes' },
  { code: '41', name: 'Loir-et-Cher' },
  { code: '42', name: 'Loire' },
  { code: '43', name: 'Haute-Loire' },
  { code: '44', name: 'Loire-Atlantique' },
  { code: '45', name: 'Loiret' },
  { code: '46', name: 'Lot' },
  { code: '47', name: 'Lot-et-Garonne' },
  { code: '48', name: 'Lozère' },
  { code: '49', name: 'Maine-et-Loire' },
  { code: '50', name: 'Manche' },
  { code: '51', name: 'Marne' },
  { code: '52', name: 'Haute-Marne' },
  { code: '53', name: 'Mayenne' },
  { code: '54', name: 'Meurthe-et-Moselle' },
  { code: '55', name: 'Meuse' },
  { code: '56', name: 'Morbihan' },
  { code: '57', name: 'Moselle' },
  { code: '58', name: 'Nièvre' },
  { code: '59', name: 'Nord' },
  { code: '60', name: 'Oise' },
  { code: '61', name: 'Orne' },
  { code: '62', name: 'Pas-de-Calais' },
  { code: '63', name: 'Puy-de-Dôme' },
  { code: '64', name: 'Pyrénées-Atlantiques' },
  { code: '65', name: 'Hautes-Pyrénées' },
  { code: '66', name: 'Pyrénées-Orientales' },
  { code: '67', name: 'Bas-Rhin' },
  { code: '68', name: 'Haut-Rhin' },
  { code: '69', name: 'Rhône' },
  { code: '70', name: 'Haute-Saône' },
  { code: '71', name: 'Saône-et-Loire' },
  { code: '72', name: 'Sarthe' },
  { code: '73', name: 'Savoie' },
  { code: '74', name: 'Haute-Savoie' },
  { code: '75', name: 'Paris' },
  { code: '76', name: 'Seine-Maritime' },
  { code: '77', name: 'Seine-et-Marne' },
  { code: '78', name: 'Yvelines' },
  { code: '79', name: 'Deux-Sèvres' },
  { code: '80', name: 'Somme' },
  { code: '81', name: 'Tarn' },
  { code: '82', name: 'Tarn-et-Garonne' },
  { code: '83', name: 'Var' },
  { code: '84', name: 'Vaucluse' },
  { code: '85', name: 'Vendée' },
  { code: '86', name: 'Vienne' },
  { code: '87', name: 'Haute-Vienne' },
  { code: '88', name: 'Vosges' },
  { code: '89', name: 'Yonne' },
  { code: '90', name: 'Territoire de Belfort' },
  { code: '91', name: 'Essonne' },
  { code: '92', name: 'Hauts-de-Seine' },
  { code: '93', name: 'Seine-Saint-Denis' },
  { code: '94', name: 'Val-de-Marne' },
  { code: '95', name: 'Val-d\'Oise' },
  // DOM-TOM
  { code: '971', name: 'Guadeloupe' },
  { code: '972', name: 'Martinique' },
  { code: '973', name: 'Guyane' },
  { code: '974', name: 'La Réunion' },
  { code: '976', name: 'Mayotte' },
];

// Provinces/Régions Europe par pays
const ZONES_EUROPE = [
  // 🇧🇪 Belgique - 10 provinces
  { code: 'BE-VAN', name: 'Anvers', country: 'BE' },
  { code: 'BE-BRU', name: 'Bruxelles-Capitale', country: 'BE' },
  { code: 'BE-VBR', name: 'Brabant flamand', country: 'BE' },
  { code: 'BE-WBR', name: 'Brabant wallon', country: 'BE' },
  { code: 'BE-VLI', name: 'Limbourg', country: 'BE' },
  { code: 'BE-VWV', name: 'Flandre-Occidentale', country: 'BE' },
  { code: 'BE-VOV', name: 'Flandre-Orientale', country: 'BE' },
  { code: 'BE-WHT', name: 'Hainaut', country: 'BE' },
  { code: 'BE-WLG', name: 'Liège', country: 'BE' },
  { code: 'BE-WLX', name: 'Luxembourg', country: 'BE' },
  { code: 'BE-WNA', name: 'Namur', country: 'BE' },

  // 🇱🇺 Luxembourg - 12 cantons
  { code: 'LU-CA', name: 'Capellen', country: 'LU' },
  { code: 'LU-CL', name: 'Clervaux', country: 'LU' },
  { code: 'LU-DI', name: 'Diekirch', country: 'LU' },
  { code: 'LU-EC', name: 'Echternach', country: 'LU' },
  { code: 'LU-ES', name: 'Esch-sur-Alzette', country: 'LU' },
  { code: 'LU-GR', name: 'Grevenmacher', country: 'LU' },
  { code: 'LU-LU', name: 'Luxembourg', country: 'LU' },
  { code: 'LU-ME', name: 'Mersch', country: 'LU' },
  { code: 'LU-RD', name: 'Redange', country: 'LU' },
  { code: 'LU-RM', name: 'Remich', country: 'LU' },
  { code: 'LU-VD', name: 'Vianden', country: 'LU' },
  { code: 'LU-WI', name: 'Wiltz', country: 'LU' },

  // 🇩🇪 Allemagne - 16 Länder
  { code: 'DE-BW', name: 'Bade-Wurtemberg', country: 'DE' },
  { code: 'DE-BY', name: 'Bavière', country: 'DE' },
  { code: 'DE-BE', name: 'Berlin', country: 'DE' },
  { code: 'DE-BB', name: 'Brandebourg', country: 'DE' },
  { code: 'DE-HB', name: 'Brême', country: 'DE' },
  { code: 'DE-HH', name: 'Hambourg', country: 'DE' },
  { code: 'DE-HE', name: 'Hesse', country: 'DE' },
  { code: 'DE-MV', name: 'Mecklembourg-Poméranie', country: 'DE' },
  { code: 'DE-NI', name: 'Basse-Saxe', country: 'DE' },
  { code: 'DE-NW', name: 'Rhénanie-du-Nord-Westphalie', country: 'DE' },
  { code: 'DE-RP', name: 'Rhénanie-Palatinat', country: 'DE' },
  { code: 'DE-SL', name: 'Sarre', country: 'DE' },
  { code: 'DE-SN', name: 'Saxe', country: 'DE' },
  { code: 'DE-ST', name: 'Saxe-Anhalt', country: 'DE' },
  { code: 'DE-SH', name: 'Schleswig-Holstein', country: 'DE' },
  { code: 'DE-TH', name: 'Thuringe', country: 'DE' },

  // 🇳🇱 Pays-Bas - 12 provinces
  { code: 'NL-DR', name: 'Drenthe', country: 'NL' },
  { code: 'NL-FL', name: 'Flevoland', country: 'NL' },
  { code: 'NL-FR', name: 'Frise', country: 'NL' },
  { code: 'NL-GE', name: 'Gueldre', country: 'NL' },
  { code: 'NL-GR', name: 'Groningue', country: 'NL' },
  { code: 'NL-LI', name: 'Limbourg', country: 'NL' },
  { code: 'NL-NB', name: 'Brabant-Septentrional', country: 'NL' },
  { code: 'NL-NH', name: 'Hollande-Septentrionale', country: 'NL' },
  { code: 'NL-OV', name: 'Overijssel', country: 'NL' },
  { code: 'NL-UT', name: 'Utrecht', country: 'NL' },
  { code: 'NL-ZE', name: 'Zélande', country: 'NL' },
  { code: 'NL-ZH', name: 'Hollande-Méridionale', country: 'NL' },

  // 🇪🇸 Espagne - 17 communautés autonomes
  { code: 'ES-AN', name: 'Andalousie', country: 'ES' },
  { code: 'ES-AR', name: 'Aragon', country: 'ES' },
  { code: 'ES-AS', name: 'Asturies', country: 'ES' },
  { code: 'ES-IB', name: 'Îles Baléares', country: 'ES' },
  { code: 'ES-CN', name: 'Îles Canaries', country: 'ES' },
  { code: 'ES-CB', name: 'Cantabrie', country: 'ES' },
  { code: 'ES-CL', name: 'Castille-et-León', country: 'ES' },
  { code: 'ES-CM', name: 'Castille-La Manche', country: 'ES' },
  { code: 'ES-CT', name: 'Catalogne', country: 'ES' },
  { code: 'ES-EX', name: 'Estrémadure', country: 'ES' },
  { code: 'ES-GA', name: 'Galice', country: 'ES' },
  { code: 'ES-MD', name: 'Madrid', country: 'ES' },
  { code: 'ES-MC', name: 'Murcie', country: 'ES' },
  { code: 'ES-NC', name: 'Navarre', country: 'ES' },
  { code: 'ES-PV', name: 'Pays basque', country: 'ES' },
  { code: 'ES-RI', name: 'La Rioja', country: 'ES' },
  { code: 'ES-VC', name: 'Communauté valencienne', country: 'ES' },

  // 🇮🇹 Italie - 20 régions
  { code: 'IT-21', name: 'Piémont', country: 'IT' },
  { code: 'IT-23', name: 'Val d\'Aoste', country: 'IT' },
  { code: 'IT-25', name: 'Lombardie', country: 'IT' },
  { code: 'IT-32', name: 'Trentin-Haut-Adige', country: 'IT' },
  { code: 'IT-34', name: 'Vénétie', country: 'IT' },
  { code: 'IT-36', name: 'Frioul-Vénétie Julienne', country: 'IT' },
  { code: 'IT-42', name: 'Ligurie', country: 'IT' },
  { code: 'IT-45', name: 'Émilie-Romagne', country: 'IT' },
  { code: 'IT-52', name: 'Toscane', country: 'IT' },
  { code: 'IT-55', name: 'Ombrie', country: 'IT' },
  { code: 'IT-57', name: 'Marches', country: 'IT' },
  { code: 'IT-62', name: 'Latium', country: 'IT' },
  { code: 'IT-65', name: 'Abruzzes', country: 'IT' },
  { code: 'IT-67', name: 'Molise', country: 'IT' },
  { code: 'IT-72', name: 'Campanie', country: 'IT' },
  { code: 'IT-75', name: 'Pouilles', country: 'IT' },
  { code: 'IT-77', name: 'Basilicate', country: 'IT' },
  { code: 'IT-78', name: 'Calabre', country: 'IT' },
  { code: 'IT-82', name: 'Sicile', country: 'IT' },
  { code: 'IT-88', name: 'Sardaigne', country: 'IT' },

  // 🇨🇭 Suisse - 26 cantons
  { code: 'CH-AG', name: 'Argovie', country: 'CH' },
  { code: 'CH-AR', name: 'Appenzell Rhodes-Extérieures', country: 'CH' },
  { code: 'CH-AI', name: 'Appenzell Rhodes-Intérieures', country: 'CH' },
  { code: 'CH-BL', name: 'Bâle-Campagne', country: 'CH' },
  { code: 'CH-BS', name: 'Bâle-Ville', country: 'CH' },
  { code: 'CH-BE', name: 'Berne', country: 'CH' },
  { code: 'CH-FR', name: 'Fribourg', country: 'CH' },
  { code: 'CH-GE', name: 'Genève', country: 'CH' },
  { code: 'CH-GL', name: 'Glaris', country: 'CH' },
  { code: 'CH-GR', name: 'Grisons', country: 'CH' },
  { code: 'CH-JU', name: 'Jura', country: 'CH' },
  { code: 'CH-LU', name: 'Lucerne', country: 'CH' },
  { code: 'CH-NE', name: 'Neuchâtel', country: 'CH' },
  { code: 'CH-NW', name: 'Nidwald', country: 'CH' },
  { code: 'CH-OW', name: 'Obwald', country: 'CH' },
  { code: 'CH-SG', name: 'Saint-Gall', country: 'CH' },
  { code: 'CH-SH', name: 'Schaffhouse', country: 'CH' },
  { code: 'CH-SZ', name: 'Schwytz', country: 'CH' },
  { code: 'CH-SO', name: 'Soleure', country: 'CH' },
  { code: 'CH-TG', name: 'Thurgovie', country: 'CH' },
  { code: 'CH-TI', name: 'Tessin', country: 'CH' },
  { code: 'CH-UR', name: 'Uri', country: 'CH' },
  { code: 'CH-VS', name: 'Valais', country: 'CH' },
  { code: 'CH-VD', name: 'Vaud', country: 'CH' },
  { code: 'CH-ZG', name: 'Zoug', country: 'CH' },
  { code: 'CH-ZH', name: 'Zurich', country: 'CH' },

  // 🇬🇧 Royaume-Uni - régions principales
  { code: 'UK-ENG-NE', name: 'North East England', country: 'UK' },
  { code: 'UK-ENG-NW', name: 'North West England', country: 'UK' },
  { code: 'UK-ENG-YH', name: 'Yorkshire and Humber', country: 'UK' },
  { code: 'UK-ENG-EM', name: 'East Midlands', country: 'UK' },
  { code: 'UK-ENG-WM', name: 'West Midlands', country: 'UK' },
  { code: 'UK-ENG-EE', name: 'East of England', country: 'UK' },
  { code: 'UK-ENG-LO', name: 'London', country: 'UK' },
  { code: 'UK-ENG-SE', name: 'South East England', country: 'UK' },
  { code: 'UK-ENG-SW', name: 'South West England', country: 'UK' },
  { code: 'UK-SCT', name: 'Scotland', country: 'UK' },
  { code: 'UK-WLS', name: 'Wales', country: 'UK' },
  { code: 'UK-NIR', name: 'Northern Ireland', country: 'UK' },

  // 🇵🇹 Portugal - 18 districts + régions autonomes
  { code: 'PT-01', name: 'Aveiro', country: 'PT' },
  { code: 'PT-02', name: 'Beja', country: 'PT' },
  { code: 'PT-03', name: 'Braga', country: 'PT' },
  { code: 'PT-04', name: 'Bragance', country: 'PT' },
  { code: 'PT-05', name: 'Castelo Branco', country: 'PT' },
  { code: 'PT-06', name: 'Coimbra', country: 'PT' },
  { code: 'PT-07', name: 'Évora', country: 'PT' },
  { code: 'PT-08', name: 'Faro', country: 'PT' },
  { code: 'PT-09', name: 'Guarda', country: 'PT' },
  { code: 'PT-10', name: 'Leiria', country: 'PT' },
  { code: 'PT-11', name: 'Lisbonne', country: 'PT' },
  { code: 'PT-12', name: 'Portalegre', country: 'PT' },
  { code: 'PT-13', name: 'Porto', country: 'PT' },
  { code: 'PT-14', name: 'Santarém', country: 'PT' },
  { code: 'PT-15', name: 'Setúbal', country: 'PT' },
  { code: 'PT-16', name: 'Viana do Castelo', country: 'PT' },
  { code: 'PT-17', name: 'Vila Real', country: 'PT' },
  { code: 'PT-18', name: 'Viseu', country: 'PT' },
  { code: 'PT-20', name: 'Açores', country: 'PT' },
  { code: 'PT-30', name: 'Madère', country: 'PT' },

  // 🇦🇹 Autriche - 9 Länder
  { code: 'AT-1', name: 'Burgenland', country: 'AT' },
  { code: 'AT-2', name: 'Carinthie', country: 'AT' },
  { code: 'AT-3', name: 'Basse-Autriche', country: 'AT' },
  { code: 'AT-4', name: 'Haute-Autriche', country: 'AT' },
  { code: 'AT-5', name: 'Salzbourg', country: 'AT' },
  { code: 'AT-6', name: 'Styrie', country: 'AT' },
  { code: 'AT-7', name: 'Tyrol', country: 'AT' },
  { code: 'AT-8', name: 'Vorarlberg', country: 'AT' },
  { code: 'AT-9', name: 'Vienne', country: 'AT' },

  // 🇵🇱 Pologne - 16 voïvodies
  { code: 'PL-DS', name: 'Basse-Silésie', country: 'PL' },
  { code: 'PL-KP', name: 'Cujavie-Poméranie', country: 'PL' },
  { code: 'PL-LU', name: 'Lublin', country: 'PL' },
  { code: 'PL-LB', name: 'Lubusz', country: 'PL' },
  { code: 'PL-LD', name: 'Łódź', country: 'PL' },
  { code: 'PL-MA', name: 'Petite-Pologne', country: 'PL' },
  { code: 'PL-MZ', name: 'Mazovie', country: 'PL' },
  { code: 'PL-OP', name: 'Opole', country: 'PL' },
  { code: 'PL-PK', name: 'Basses-Carpates', country: 'PL' },
  { code: 'PL-PD', name: 'Podlachie', country: 'PL' },
  { code: 'PL-PM', name: 'Poméranie', country: 'PL' },
  { code: 'PL-SL', name: 'Silésie', country: 'PL' },
  { code: 'PL-SK', name: 'Sainte-Croix', country: 'PL' },
  { code: 'PL-WN', name: 'Warmie-Mazurie', country: 'PL' },
  { code: 'PL-WP', name: 'Grande-Pologne', country: 'PL' },
  { code: 'PL-ZP', name: 'Poméranie-Occidentale', country: 'PL' },

  // 🇨🇿 République tchèque - 14 régions
  { code: 'CZ-PR', name: 'Prague', country: 'CZ' },
  { code: 'CZ-ST', name: 'Bohême centrale', country: 'CZ' },
  { code: 'CZ-JC', name: 'Bohême du Sud', country: 'CZ' },
  { code: 'CZ-PL', name: 'Plzeň', country: 'CZ' },
  { code: 'CZ-KA', name: 'Karlovy Vary', country: 'CZ' },
  { code: 'CZ-US', name: 'Ústí nad Labem', country: 'CZ' },
  { code: 'CZ-LI', name: 'Liberec', country: 'CZ' },
  { code: 'CZ-KR', name: 'Hradec Králové', country: 'CZ' },
  { code: 'CZ-PA', name: 'Pardubice', country: 'CZ' },
  { code: 'CZ-VY', name: 'Vysočina', country: 'CZ' },
  { code: 'CZ-JM', name: 'Moravie du Sud', country: 'CZ' },
  { code: 'CZ-OL', name: 'Olomouc', country: 'CZ' },
  { code: 'CZ-ZL', name: 'Zlín', country: 'CZ' },
  { code: 'CZ-MO', name: 'Moravie-Silésie', country: 'CZ' },

  // 🇸🇰 Slovaquie - 8 régions
  { code: 'SK-BL', name: 'Bratislava', country: 'SK' },
  { code: 'SK-TA', name: 'Trnava', country: 'SK' },
  { code: 'SK-TC', name: 'Trenčín', country: 'SK' },
  { code: 'SK-NI', name: 'Nitra', country: 'SK' },
  { code: 'SK-ZI', name: 'Žilina', country: 'SK' },
  { code: 'SK-BC', name: 'Banská Bystrica', country: 'SK' },
  { code: 'SK-PV', name: 'Prešov', country: 'SK' },
  { code: 'SK-KI', name: 'Košice', country: 'SK' },

  // 🇭🇺 Hongrie - 19 comitats + Budapest
  { code: 'HU-BU', name: 'Budapest', country: 'HU' },
  { code: 'HU-PE', name: 'Pest', country: 'HU' },
  { code: 'HU-FE', name: 'Fejér', country: 'HU' },
  { code: 'HU-KE', name: 'Komárom-Esztergom', country: 'HU' },
  { code: 'HU-VE', name: 'Veszprém', country: 'HU' },
  { code: 'HU-GS', name: 'Győr-Moson-Sopron', country: 'HU' },
  { code: 'HU-VA', name: 'Vas', country: 'HU' },
  { code: 'HU-ZA', name: 'Zala', country: 'HU' },
  { code: 'HU-BA', name: 'Baranya', country: 'HU' },
  { code: 'HU-SO', name: 'Somogy', country: 'HU' },
  { code: 'HU-TO', name: 'Tolna', country: 'HU' },
  { code: 'HU-BK', name: 'Bács-Kiskun', country: 'HU' },
  { code: 'HU-CS', name: 'Csongrád', country: 'HU' },
  { code: 'HU-BE', name: 'Békés', country: 'HU' },
  { code: 'HU-JN', name: 'Jász-Nagykun-Szolnok', country: 'HU' },
  { code: 'HU-HE', name: 'Heves', country: 'HU' },
  { code: 'HU-NO', name: 'Nógrád', country: 'HU' },
  { code: 'HU-HB', name: 'Hajdú-Bihar', country: 'HU' },
  { code: 'HU-SZ', name: 'Szabolcs-Szatmár-Bereg', country: 'HU' },
  { code: 'HU-BZ', name: 'Borsod-Abaúj-Zemplén', country: 'HU' },

  // 🇷🇴 Roumanie - 41 județe + Bucarest
  { code: 'RO-B', name: 'Bucarest', country: 'RO' },
  { code: 'RO-AB', name: 'Alba', country: 'RO' },
  { code: 'RO-AR', name: 'Arad', country: 'RO' },
  { code: 'RO-BC', name: 'Bacău', country: 'RO' },
  { code: 'RO-BH', name: 'Bihor', country: 'RO' },
  { code: 'RO-BN', name: 'Bistrița-Năsăud', country: 'RO' },
  { code: 'RO-BR', name: 'Brăila', country: 'RO' },
  { code: 'RO-BV', name: 'Brașov', country: 'RO' },
  { code: 'RO-BT', name: 'Botoșani', country: 'RO' },
  { code: 'RO-BZ', name: 'Buzău', country: 'RO' },
  { code: 'RO-CL', name: 'Călărași', country: 'RO' },
  { code: 'RO-CS', name: 'Caraș-Severin', country: 'RO' },
  { code: 'RO-CJ', name: 'Cluj', country: 'RO' },
  { code: 'RO-CT', name: 'Constanța', country: 'RO' },
  { code: 'RO-CV', name: 'Covasna', country: 'RO' },
  { code: 'RO-DB', name: 'Dâmbovița', country: 'RO' },
  { code: 'RO-DJ', name: 'Dolj', country: 'RO' },
  { code: 'RO-GL', name: 'Galați', country: 'RO' },
  { code: 'RO-GR', name: 'Giurgiu', country: 'RO' },
  { code: 'RO-GJ', name: 'Gorj', country: 'RO' },
  { code: 'RO-HR', name: 'Harghita', country: 'RO' },
  { code: 'RO-HD', name: 'Hunedoara', country: 'RO' },
  { code: 'RO-IL', name: 'Ialomița', country: 'RO' },
  { code: 'RO-IS', name: 'Iași', country: 'RO' },
  { code: 'RO-IF', name: 'Ilfov', country: 'RO' },
  { code: 'RO-MM', name: 'Maramureș', country: 'RO' },
  { code: 'RO-MH', name: 'Mehedinți', country: 'RO' },
  { code: 'RO-MS', name: 'Mureș', country: 'RO' },
  { code: 'RO-NT', name: 'Neamț', country: 'RO' },
  { code: 'RO-OT', name: 'Olt', country: 'RO' },
  { code: 'RO-PH', name: 'Prahova', country: 'RO' },
  { code: 'RO-SJ', name: 'Sălaj', country: 'RO' },
  { code: 'RO-SM', name: 'Satu Mare', country: 'RO' },
  { code: 'RO-SB', name: 'Sibiu', country: 'RO' },
  { code: 'RO-SV', name: 'Suceava', country: 'RO' },
  { code: 'RO-TR', name: 'Teleorman', country: 'RO' },
  { code: 'RO-TM', name: 'Timiș', country: 'RO' },
  { code: 'RO-TL', name: 'Tulcea', country: 'RO' },
  { code: 'RO-VL', name: 'Vâlcea', country: 'RO' },
  { code: 'RO-VS', name: 'Vaslui', country: 'RO' },
  { code: 'RO-VN', name: 'Vrancea', country: 'RO' },

  // 🇧🇬 Bulgarie - 28 oblasts
  { code: 'BG-01', name: 'Blagoevgrad', country: 'BG' },
  { code: 'BG-02', name: 'Bourgas', country: 'BG' },
  { code: 'BG-03', name: 'Dobrich', country: 'BG' },
  { code: 'BG-04', name: 'Gabrovo', country: 'BG' },
  { code: 'BG-05', name: 'Haskovo', country: 'BG' },
  { code: 'BG-06', name: 'Kardjali', country: 'BG' },
  { code: 'BG-07', name: 'Kyoustendil', country: 'BG' },
  { code: 'BG-08', name: 'Lovetch', country: 'BG' },
  { code: 'BG-09', name: 'Montana', country: 'BG' },
  { code: 'BG-10', name: 'Pazardjik', country: 'BG' },
  { code: 'BG-11', name: 'Pernik', country: 'BG' },
  { code: 'BG-12', name: 'Pleven', country: 'BG' },
  { code: 'BG-13', name: 'Plovdiv', country: 'BG' },
  { code: 'BG-14', name: 'Razgrad', country: 'BG' },
  { code: 'BG-15', name: 'Rousse', country: 'BG' },
  { code: 'BG-16', name: 'Choumen', country: 'BG' },
  { code: 'BG-17', name: 'Silistra', country: 'BG' },
  { code: 'BG-18', name: 'Sliven', country: 'BG' },
  { code: 'BG-19', name: 'Smolyan', country: 'BG' },
  { code: 'BG-20', name: 'Sofia-ville', country: 'BG' },
  { code: 'BG-21', name: 'Sofia-région', country: 'BG' },
  { code: 'BG-22', name: 'Stara Zagora', country: 'BG' },
  { code: 'BG-23', name: 'Targovichte', country: 'BG' },
  { code: 'BG-24', name: 'Varna', country: 'BG' },
  { code: 'BG-25', name: 'Veliko Tarnovo', country: 'BG' },
  { code: 'BG-26', name: 'Vidin', country: 'BG' },
  { code: 'BG-27', name: 'Vratsa', country: 'BG' },
  { code: 'BG-28', name: 'Yambol', country: 'BG' },

  // 🇭🇷 Croatie - 21 comitats
  { code: 'HR-01', name: 'Zagreb (comitat)', country: 'HR' },
  { code: 'HR-02', name: 'Krapina-Zagorje', country: 'HR' },
  { code: 'HR-03', name: 'Sisak-Moslavina', country: 'HR' },
  { code: 'HR-04', name: 'Karlovac', country: 'HR' },
  { code: 'HR-05', name: 'Varaždin', country: 'HR' },
  { code: 'HR-06', name: 'Koprivnica-Križevci', country: 'HR' },
  { code: 'HR-07', name: 'Bjelovar-Bilogora', country: 'HR' },
  { code: 'HR-08', name: 'Primorje-Gorski Kotar', country: 'HR' },
  { code: 'HR-09', name: 'Lika-Senj', country: 'HR' },
  { code: 'HR-10', name: 'Virovitica-Podravina', country: 'HR' },
  { code: 'HR-11', name: 'Požega-Slavonie', country: 'HR' },
  { code: 'HR-12', name: 'Brod-Posavina', country: 'HR' },
  { code: 'HR-13', name: 'Zadar', country: 'HR' },
  { code: 'HR-14', name: 'Osijek-Baranja', country: 'HR' },
  { code: 'HR-15', name: 'Šibenik-Knin', country: 'HR' },
  { code: 'HR-16', name: 'Vukovar-Syrmie', country: 'HR' },
  { code: 'HR-17', name: 'Split-Dalmatie', country: 'HR' },
  { code: 'HR-18', name: 'Istrie', country: 'HR' },
  { code: 'HR-19', name: 'Dubrovnik-Neretva', country: 'HR' },
  { code: 'HR-20', name: 'Međimurje', country: 'HR' },
  { code: 'HR-21', name: 'Zagreb (ville)', country: 'HR' },

  // 🇸🇮 Slovénie - régions statistiques
  { code: 'SI-PO', name: 'Pomurska', country: 'SI' },
  { code: 'SI-PD', name: 'Podravska', country: 'SI' },
  { code: 'SI-KO', name: 'Koroška', country: 'SI' },
  { code: 'SI-SA', name: 'Savinjska', country: 'SI' },
  { code: 'SI-ZS', name: 'Zasavska', country: 'SI' },
  { code: 'SI-SP', name: 'Spodnjeposavska', country: 'SI' },
  { code: 'SI-JV', name: 'Jugovzhodna Slovenija', country: 'SI' },
  { code: 'SI-OS', name: 'Osrednjeslovenska', country: 'SI' },
  { code: 'SI-GO', name: 'Gorenjska', country: 'SI' },
  { code: 'SI-NO', name: 'Notranjsko-kraška', country: 'SI' },
  { code: 'SI-GP', name: 'Goriška', country: 'SI' },
  { code: 'SI-OB', name: 'Obalno-kraška', country: 'SI' },

  // 🇬🇷 Grèce - 13 périphéries
  { code: 'GR-A', name: 'Macédoine-Orientale-et-Thrace', country: 'GR' },
  { code: 'GR-B', name: 'Macédoine-Centrale', country: 'GR' },
  { code: 'GR-C', name: 'Macédoine-Occidentale', country: 'GR' },
  { code: 'GR-D', name: 'Épire', country: 'GR' },
  { code: 'GR-E', name: 'Thessalie', country: 'GR' },
  { code: 'GR-F', name: 'Îles Ioniennes', country: 'GR' },
  { code: 'GR-G', name: 'Grèce-Occidentale', country: 'GR' },
  { code: 'GR-H', name: 'Grèce-Centrale', country: 'GR' },
  { code: 'GR-I', name: 'Attique', country: 'GR' },
  { code: 'GR-J', name: 'Péloponnèse', country: 'GR' },
  { code: 'GR-K', name: 'Égée-Septentrionale', country: 'GR' },
  { code: 'GR-L', name: 'Égée-Méridionale', country: 'GR' },
  { code: 'GR-M', name: 'Crète', country: 'GR' },

  // 🇩🇰 Danemark - 5 régions
  { code: 'DK-84', name: 'Hovedstaden (Capitale)', country: 'DK' },
  { code: 'DK-82', name: 'Midtjylland (Jutland central)', country: 'DK' },
  { code: 'DK-81', name: 'Nordjylland (Jutland du Nord)', country: 'DK' },
  { code: 'DK-85', name: 'Sjælland (Seeland)', country: 'DK' },
  { code: 'DK-83', name: 'Syddanmark (Danemark du Sud)', country: 'DK' },

  // 🇸🇪 Suède - 21 comtés
  { code: 'SE-AB', name: 'Stockholm', country: 'SE' },
  { code: 'SE-AC', name: 'Västerbotten', country: 'SE' },
  { code: 'SE-BD', name: 'Norrbotten', country: 'SE' },
  { code: 'SE-C', name: 'Uppsala', country: 'SE' },
  { code: 'SE-D', name: 'Södermanland', country: 'SE' },
  { code: 'SE-E', name: 'Östergötland', country: 'SE' },
  { code: 'SE-F', name: 'Jönköping', country: 'SE' },
  { code: 'SE-G', name: 'Kronoberg', country: 'SE' },
  { code: 'SE-H', name: 'Kalmar', country: 'SE' },
  { code: 'SE-I', name: 'Gotland', country: 'SE' },
  { code: 'SE-K', name: 'Blekinge', country: 'SE' },
  { code: 'SE-M', name: 'Skåne', country: 'SE' },
  { code: 'SE-N', name: 'Halland', country: 'SE' },
  { code: 'SE-O', name: 'Västra Götaland', country: 'SE' },
  { code: 'SE-S', name: 'Värmland', country: 'SE' },
  { code: 'SE-T', name: 'Örebro', country: 'SE' },
  { code: 'SE-U', name: 'Västmanland', country: 'SE' },
  { code: 'SE-W', name: 'Dalarna', country: 'SE' },
  { code: 'SE-X', name: 'Gävleborg', country: 'SE' },
  { code: 'SE-Y', name: 'Västernorrland', country: 'SE' },
  { code: 'SE-Z', name: 'Jämtland', country: 'SE' },

  // 🇫🇮 Finlande - 19 régions
  { code: 'FI-01', name: 'Åland', country: 'FI' },
  { code: 'FI-02', name: 'Finlande du Sud', country: 'FI' },
  { code: 'FI-04', name: 'Ostrobotnie du Sud', country: 'FI' },
  { code: 'FI-05', name: 'Savonie du Sud', country: 'FI' },
  { code: 'FI-06', name: 'Carélie du Sud', country: 'FI' },
  { code: 'FI-07', name: 'Kajanaland', country: 'FI' },
  { code: 'FI-08', name: 'Tavastie', country: 'FI' },
  { code: 'FI-09', name: 'Finlande centrale', country: 'FI' },
  { code: 'FI-10', name: 'Kymenlaakso', country: 'FI' },
  { code: 'FI-11', name: 'Laponie', country: 'FI' },
  { code: 'FI-12', name: 'Pirkanmaa', country: 'FI' },
  { code: 'FI-13', name: 'Ostrobotnie', country: 'FI' },
  { code: 'FI-14', name: 'Carélie du Nord', country: 'FI' },
  { code: 'FI-15', name: 'Ostrobotnie du Nord', country: 'FI' },
  { code: 'FI-16', name: 'Savonie du Nord', country: 'FI' },
  { code: 'FI-17', name: 'Päijänne-Tavastie', country: 'FI' },
  { code: 'FI-18', name: 'Satakunta', country: 'FI' },
  { code: 'FI-19', name: 'Uusimaa', country: 'FI' },
  { code: 'FI-20', name: 'Finlande du Sud-Ouest', country: 'FI' },

  // 🇮🇪 Irlande - 4 provinces
  { code: 'IE-C', name: 'Connacht', country: 'IE' },
  { code: 'IE-L', name: 'Leinster', country: 'IE' },
  { code: 'IE-M', name: 'Munster', country: 'IE' },
  { code: 'IE-U', name: 'Ulster (Irlande)', country: 'IE' },

  // 🇳🇴 Norvège - 11 comtés
  { code: 'NO-03', name: 'Oslo', country: 'NO' },
  { code: 'NO-11', name: 'Rogaland', country: 'NO' },
  { code: 'NO-15', name: 'Møre og Romsdal', country: 'NO' },
  { code: 'NO-18', name: 'Nordland', country: 'NO' },
  { code: 'NO-30', name: 'Viken', country: 'NO' },
  { code: 'NO-34', name: 'Innlandet', country: 'NO' },
  { code: 'NO-38', name: 'Vestfold og Telemark', country: 'NO' },
  { code: 'NO-42', name: 'Agder', country: 'NO' },
  { code: 'NO-46', name: 'Vestland', country: 'NO' },
  { code: 'NO-50', name: 'Trøndelag', country: 'NO' },
  { code: 'NO-54', name: 'Troms og Finnmark', country: 'NO' },

  // 🇪🇪 Estonie - 15 comtés
  { code: 'EE-37', name: 'Harjumaa', country: 'EE' },
  { code: 'EE-39', name: 'Hiiumaa', country: 'EE' },
  { code: 'EE-45', name: 'Ida-Virumaa', country: 'EE' },
  { code: 'EE-50', name: 'Jõgevamaa', country: 'EE' },
  { code: 'EE-52', name: 'Järvamaa', country: 'EE' },
  { code: 'EE-56', name: 'Läänemaa', country: 'EE' },
  { code: 'EE-60', name: 'Lääne-Virumaa', country: 'EE' },
  { code: 'EE-64', name: 'Põlvamaa', country: 'EE' },
  { code: 'EE-68', name: 'Pärnumaa', country: 'EE' },
  { code: 'EE-71', name: 'Raplamaa', country: 'EE' },
  { code: 'EE-74', name: 'Saaremaa', country: 'EE' },
  { code: 'EE-79', name: 'Tartumaa', country: 'EE' },
  { code: 'EE-81', name: 'Valgamaa', country: 'EE' },
  { code: 'EE-84', name: 'Viljandimaa', country: 'EE' },
  { code: 'EE-87', name: 'Võrumaa', country: 'EE' },

  // 🇱🇻 Lettonie - régions
  { code: 'LV-RIX', name: 'Riga', country: 'LV' },
  { code: 'LV-KUR', name: 'Kurzeme', country: 'LV' },
  { code: 'LV-LAT', name: 'Latgale', country: 'LV' },
  { code: 'LV-VID', name: 'Vidzeme', country: 'LV' },
  { code: 'LV-ZEM', name: 'Zemgale', country: 'LV' },
  { code: 'LV-PIE', name: 'Pierīga', country: 'LV' },

  // 🇱🇹 Lituanie - 10 comtés
  { code: 'LT-AL', name: 'Alytus', country: 'LT' },
  { code: 'LT-KU', name: 'Kaunas', country: 'LT' },
  { code: 'LT-KL', name: 'Klaipėda', country: 'LT' },
  { code: 'LT-MR', name: 'Marijampolė', country: 'LT' },
  { code: 'LT-PN', name: 'Panevėžys', country: 'LT' },
  { code: 'LT-SA', name: 'Šiauliai', country: 'LT' },
  { code: 'LT-TA', name: 'Tauragė', country: 'LT' },
  { code: 'LT-TE', name: 'Telšiai', country: 'LT' },
  { code: 'LT-UT', name: 'Utena', country: 'LT' },
  { code: 'LT-VL', name: 'Vilnius', country: 'LT' },
];

// Liste des pays pour regroupement
const EUROPEAN_COUNTRIES = [
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'UK', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'AT', name: 'Autriche', flag: '🇦🇹' },
  { code: 'PL', name: 'Pologne', flag: '🇵🇱' },
  { code: 'CZ', name: 'République tchèque', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovaquie', flag: '🇸🇰' },
  { code: 'HU', name: 'Hongrie', flag: '🇭🇺' },
  { code: 'RO', name: 'Roumanie', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgarie', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatie', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovénie', flag: '🇸🇮' },
  { code: 'GR', name: 'Grèce', flag: '🇬🇷' },
  { code: 'DK', name: 'Danemark', flag: '🇩🇰' },
  { code: 'SE', name: 'Suède', flag: '🇸🇪' },
  { code: 'FI', name: 'Finlande', flag: '🇫🇮' },
  { code: 'IE', name: 'Irlande', flag: '🇮🇪' },
  { code: 'NO', name: 'Norvège', flag: '🇳🇴' },
  { code: 'EE', name: 'Estonie', flag: '🇪🇪' },
  { code: 'LV', name: 'Lettonie', flag: '🇱🇻' },
  { code: 'LT', name: 'Lituanie', flag: '🇱🇹' },
];

export default function GrilleTarifaireConfigPage() {
  const router = useSafeRouter();
  const [activeTab, setActiveTab] = useState<'structure' | 'fees' | 'vehicles' | 'zones' | 'attachments' | 'settings'>('structure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Configuration state
  const [configName, setConfigName] = useState('Grille Tarifaire 2024');
  const [configDescription, setConfigDescription] = useState('Configuration standard pour les transporteurs référencés');
  const [selectedTransportTypes, setSelectedTransportTypes] = useState<string[]>(['LTL', 'FTL']);
  const [additionalFees, setAdditionalFees] = useState<AdditionalFee[]>(DEFAULT_FEES);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(DEFAULT_VEHICLES);
  const [selectedZones, setSelectedZones] = useState<string[]>(['75', '77', '78', '91', '92', '93', '94', '95', '69', '13', '59', '33', '31']);
  const [includeEurope, setIncludeEurope] = useState(false);

  // Fichiers joints
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Settings
  const [fuelSurchargeType, setFuelSurchargeType] = useState<'indexed' | 'fixed' | 'none'>('indexed');
  const [fuelIndexReference, setFuelIndexReference] = useState('CNR Gazole');
  const [defaultPaymentDays, setDefaultPaymentDays] = useState(30);
  const [enableVolumeDiscounts, setEnableVolumeDiscounts] = useState(true);
  const [volumeThresholds, setVolumeThresholds] = useState([
    { minTransports: 50, discountPercent: 3 },
    { minTransports: 100, discountPercent: 5 },
    { minTransports: 200, discountPercent: 8 },
  ]);
  const [validityMonths, setValidityMonths] = useState(12);

  // Modal state
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<AdditionalFee | null>(null);
  const [newFee, setNewFee] = useState<Partial<AdditionalFee>>({
    code: '',
    name: '',
    description: '',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 0,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'autre'
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { setError(null); setSuccess(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const toggleFeeActive = (feeId: string) => {
    setAdditionalFees(fees =>
      fees.map(f => f.id === feeId ? { ...f, isActive: !f.isActive } : f)
    );
  };

  const updateFeeValue = (feeId: string, field: keyof AdditionalFee, value: any) => {
    setAdditionalFees(fees =>
      fees.map(f => f.id === feeId ? { ...f, [field]: value } : f)
    );
  };

  const addNewFee = () => {
    if (!newFee.code || !newFee.name) {
      setError('Code et nom requis');
      return;
    }
    const fee: AdditionalFee = {
      id: `fee-custom-${Date.now()}`,
      code: newFee.code!,
      name: newFee.name!,
      description: newFee.description || '',
      calculationType: newFee.calculationType as any || 'fixed',
      unit: newFee.unit || '€',
      defaultValue: newFee.defaultValue || 0,
      minValue: newFee.minValue,
      maxValue: newFee.maxValue,
      isRequired: newFee.isRequired || false,
      isActive: true,
      applicableTo: newFee.applicableTo as any || ['LTL', 'FTL'],
      category: newFee.category as any || 'autre'
    };
    setAdditionalFees([...additionalFees, fee]);
    setShowAddFeeModal(false);
    setNewFee({
      code: '', name: '', description: '', calculationType: 'fixed',
      unit: '€', defaultValue: 0, isRequired: false, isActive: true,
      applicableTo: ['LTL', 'FTL'], category: 'autre'
    });
    setSuccess('Frais ajouté');
  };

  const deleteFee = (feeId: string) => {
    if (!confirm('Supprimer ce frais ?')) return;
    setAdditionalFees(fees => fees.filter(f => f.id !== feeId));
    setSuccess('Frais supprimé');
  };

  const toggleVehicle = (vehicleId: string) => {
    setVehicleTypes(vehicles =>
      vehicles.map(v => v.id === vehicleId ? { ...v, isActive: !v.isActive } : v)
    );
  };

  const toggleZone = (zoneCode: string) => {
    setSelectedZones(zones =>
      zones.includes(zoneCode)
        ? zones.filter(z => z !== zoneCode)
        : [...zones, zoneCode]
    );
  };

  // === Gestion des fichiers joints ===
  const getFileType = (mimeType: string): 'excel' | 'pdf' | 'other' => {
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('xlsx') || mimeType.includes('xls')) {
      return 'excel';
    }
    if (mimeType.includes('pdf')) {
      return 'pdf';
    }
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileUpload = async (files: FileList | null, category: AttachedFile['category'] = 'other') => {
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        // Vérifier le type de fichier
        const allowedTypes = [
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv'
        ];
        if (!allowedTypes.includes(file.type)) {
          setError(`Type de fichier non autorisé: ${file.name}. Seuls les fichiers Excel, PDF et CSV sont acceptés.`);
          continue;
        }

        // Vérifier la taille (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`Fichier trop volumineux: ${file.name}. Taille max: 10 MB`);
          continue;
        }

        // Upload vers S3 via l'API
        const response = await pricingGridsApi.uploadFile(file, category);

        if (response.error) {
          setError(`Erreur upload ${file.name}: ${response.error}`);
          continue;
        }

        // Ajouter le fichier uploadé à la liste
        const uploadedFile: AttachedFile = {
          id: response.file.id,
          name: response.file.name,
          originalName: response.file.originalName,
          type: response.file.type,
          mimeType: response.file.mimeType,
          size: response.file.size,
          url: response.file.url,
          s3Key: response.file.s3Key,
          category: response.file.category,
          description: response.file.description || '',
          uploadedAt: response.file.uploadedAt
        };

        setAttachedFiles(prev => [...prev, uploadedFile]);
        setSuccess(`Fichier "${file.name}" uploadé avec succès sur S3`);
      }
    } catch (err: any) {
      setError(`Erreur lors de l'upload: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const updateFileCategory = (fileId: string, category: AttachedFile['category']) => {
    setAttachedFiles(files =>
      files.map(f => f.id === fileId ? { ...f, category } : f)
    );
  };

  const updateFileDescription = (fileId: string, description: string) => {
    setAttachedFiles(files =>
      files.map(f => f.id === fileId ? { ...f, description } : f)
    );
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Supprimer ce fichier ?')) return;

    try {
      // Supprimer de S3 via l'API
      const response = await pricingGridsApi.deleteFile(fileId);

      if (response.error) {
        setError(`Erreur suppression: ${response.error}`);
        return;
      }

      // Retirer de la liste locale
      setAttachedFiles(files => files.filter(f => f.id !== fileId));
      setSuccess('Fichier supprimé de S3');
    } catch (err: any) {
      // Si erreur API, supprimer quand même localement (fichier peut ne pas exister sur S3)
      setAttachedFiles(files => files.filter(f => f.id !== fileId));
      setSuccess('Fichier supprimé');
    }
  };

  const getFileIcon = (type: AttachedFile['type']): string => {
    switch (type) {
      case 'excel': return '📊';
      case 'pdf': return '📄';
      default: return '📎';
    }
  };

  const getFileCategoryLabel = (category: AttachedFile['category']): string => {
    const labels: Record<AttachedFile['category'], string> = {
      template: '📝 Modèle à remplir',
      specifications: '📋 Cahier des charges',
      conditions: '⚖️ Conditions générales',
      other: '📎 Autre document'
    };
    return labels[category];
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      // Préparer les zones sélectionnées
      const selectedZonesFrance = selectedZones
        .filter(code => ZONES_FRANCE.some(z => z.code === code))
        .map(code => {
          const zone = ZONES_FRANCE.find(z => z.code === code);
          return { code, name: zone?.name || code, type: 'department' as const };
        });

      const selectedZonesEurope = selectedZones
        .filter(code => ZONES_EUROPE.some(z => z.code === code))
        .map(code => {
          const zone = ZONES_EUROPE.find(z => z.code === code);
          return { code, name: zone?.name || code, country: (zone as any)?.country, type: 'region' as const };
        });

      // Préparer les frais
      const standardFees = additionalFees.filter(f => f.isActive).map(f => ({
        id: f.id,
        name: f.name,
        type: f.calculationType === 'fixed' ? 'fixed' as const : 'percentage' as const,
        value: f.defaultValue || 0,
        description: f.description,
        mandatory: f.isRequired,
        conditions: f.applicableTo.join(', ')
      }));

      // Préparer les véhicules
      const selectedVehicles = vehicleTypes.filter(v => v.isActive).map(v => ({
        id: v.id,
        name: v.name,
        category: v.code,
        description: v.capacity
      }));

      // Préparer la configuration pour l'API
      const configData = {
        name: configName,
        description: configDescription,
        zonesConfig: {
          type: 'department' as const,
          selectedZonesFrance,
          selectedZonesEurope
        },
        feesConfig: {
          standardFees,
          customFees: []
        },
        vehiclesConfig: {
          selectedVehicles,
          customVehicles: []
        },
        attachedFilesData: attachedFiles.map(f => ({
          id: f.id,
          name: f.name,
          originalName: f.originalName,
          type: f.type,
          mimeType: f.mimeType,
          size: f.size,
          url: f.url,
          s3Key: f.s3Key,
          description: f.description,
          category: f.category,
          uploadedAt: f.uploadedAt
        })),
        settings: {
          currency: 'EUR',
          taxRate: 20,
          validityDays: validityMonths * 30,
          paymentTermsDays: defaultPaymentDays,
          notes: ''
        }
      };

      // Appel API pour créer la configuration
      const response = await pricingGridsApi.createConfig(configData);

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('Configuration saved:', response.config);
      setSuccess('Configuration enregistrée avec succès !');
    } catch (err: any) {
      console.error('Error saving configuration:', err);
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '20px' };
  const buttonStyle = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' as const };
  const inputStyle = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '100%' };
  const selectStyle = { ...inputStyle, background: 'rgba(30,30,50,0.8)' };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      manutention: '🏗️ Manutention',
      attente: '⏱️ Attente',
      livraison: '🚚 Livraison',
      administratif: '📋 Administratif',
      exceptionnel: '⚠️ Exceptionnel',
      carburant: '⛽ Carburant',
      autre: '📦 Autre'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      manutention: '#f59e0b',
      attente: '#ef4444',
      livraison: '#3b82f6',
      administratif: '#8b5cf6',
      exceptionnel: '#ec4899',
      carburant: '#10b981',
      autre: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  return (
    <>
      <Head><title>Configuration Grille Tarifaire | SYMPHONI.A</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>⚙️</span>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Configuration Grille Tarifaire</h1>
                <p style={{ fontSize: '13px', margin: 0, opacity: 0.7 }}>Définir la structure que les transporteurs devront renseigner</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => router.push('/pricing-grids')} style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)' }}>
              📋 Voir les grilles
            </button>
            <button onClick={saveConfiguration} style={buttonStyle} disabled={loading}>
              {loading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && <div style={{ background: 'rgba(239,68,68,0.3)', padding: '15px 40px', borderBottom: '1px solid rgba(239,68,68,0.5)' }}>❌ {error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.3)', padding: '15px 40px', borderBottom: '1px solid rgba(16,185,129,0.5)' }}>✅ {success}</div>}

        {/* Tabs */}
        <div style={{ padding: '0 40px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'structure', label: '📊 Structure', desc: 'Types de transport' },
              { id: 'fees', label: '💰 Frais Annexes', desc: 'Frais d\'exploitation' },
              { id: 'vehicles', label: '🚛 Véhicules', desc: 'Types de véhicules' },
              { id: 'zones', label: '🗺️ Zones', desc: 'Zones géographiques' },
              { id: 'attachments', label: `📎 Documents${attachedFiles.length > 0 ? ` (${attachedFiles.length})` : ''}`, desc: 'Fichiers joints' },
              { id: 'settings', label: '⚙️ Paramètres', desc: 'Carburant, remises' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '16px 24px',
                  background: activeTab === tab.id ? 'rgba(102,126,234,0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '700' : '400',
                  opacity: activeTab === tab.id ? 1 : 0.7,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>

          {/* Tab: Structure */}
          {activeTab === 'structure' && (
            <>
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Informations générales</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Nom de la configuration</label>
                    <input
                      style={inputStyle}
                      value={configName}
                      onChange={e => setConfigName(e.target.value)}
                      placeholder="Ex: Grille Tarifaire 2024"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Description</label>
                    <input
                      style={inputStyle}
                      value={configDescription}
                      onChange={e => setConfigDescription(e.target.value)}
                      placeholder="Description de la grille"
                    />
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Types de transport acceptés</h3>
                <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '20px' }}>
                  Sélectionnez les types de transport pour lesquels les transporteurs devront fournir des tarifs
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'LTL', icon: '📦', name: 'Groupage (LTL)', desc: 'Tarification par palette' },
                    { id: 'FTL', icon: '🚛', name: 'Lot complet (FTL)', desc: 'Tarification par véhicule' },
                    { id: 'MESSAGERIE', icon: '📬', name: 'Messagerie', desc: 'Tarification par poids' },
                  ].map(type => (
                    <div
                      key={type.id}
                      onClick={() => {
                        setSelectedTransportTypes(types =>
                          types.includes(type.id)
                            ? types.filter(t => t !== type.id)
                            : [...types, type.id]
                        );
                      }}
                      style={{
                        padding: '20px',
                        background: selectedTransportTypes.includes(type.id)
                          ? 'rgba(102,126,234,0.3)'
                          : 'rgba(255,255,255,0.05)',
                        border: selectedTransportTypes.includes(type.id)
                          ? '2px solid #667eea'
                          : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        minWidth: '200px',
                        flex: 1,
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{type.icon}</div>
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>{type.name}</div>
                      <div style={{ fontSize: '13px', opacity: 0.7 }}>{type.desc}</div>
                      {selectedTransportTypes.includes(type.id) && (
                        <div style={{ marginTop: '8px', color: '#667eea', fontSize: '13px', fontWeight: '600' }}>
                          ✓ Activé
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Structure des tarifs</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {selectedTransportTypes.includes('LTL') && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>📦 Groupage (LTL)</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', opacity: 0.8 }}>
                        <li>Tarif par zone origine → destination</li>
                        <li>Paliers par nombre de palettes</li>
                        <li>Prix minimum par expédition</li>
                        <li>Délai de transit</li>
                      </ul>
                    </div>
                  )}
                  {selectedTransportTypes.includes('FTL') && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>🚛 Lot complet (FTL)</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', opacity: 0.8 }}>
                        <li>Tarif forfaitaire par zone</li>
                        <li>Tarif au km (option)</li>
                        <li>Par type de véhicule</li>
                        <li>Délai de transit</li>
                      </ul>
                    </div>
                  )}
                  {selectedTransportTypes.includes('MESSAGERIE') && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>📬 Messagerie</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', opacity: 0.8 }}>
                        <li>Tarif par département</li>
                        <li>Paliers par tranche de poids</li>
                        <li>Diviseur volumétrique</li>
                        <li>Prix minimum</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tab: Frais Annexes */}
          {activeTab === 'fees' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Frais Annexes d'Exploitation</h2>
                  <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '14px' }}>
                    Définissez les frais supplémentaires que les transporteurs devront renseigner
                  </p>
                </div>
                <button onClick={() => setShowAddFeeModal(true)} style={buttonStyle}>
                  + Ajouter un frais
                </button>
              </div>

              {/* Grouper par catégorie */}
              {['manutention', 'attente', 'livraison', 'administratif', 'exceptionnel', 'carburant', 'autre'].map(category => {
                const categoryFees = additionalFees.filter(f => f.category === category);
                if (categoryFees.length === 0) return null;

                return (
                  <div key={category} style={{ ...cardStyle, marginBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: getCategoryColor(category) }}>{getCategoryLabel(category)}</span>
                      <span style={{ fontSize: '12px', opacity: 0.5 }}>({categoryFees.length})</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {categoryFees.map(fee => (
                        <div
                          key={fee.id}
                          style={{
                            background: fee.isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                            padding: '16px',
                            borderRadius: '8px',
                            opacity: fee.isActive ? 1 : 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                          }}
                        >
                          {/* Toggle */}
                          <div
                            onClick={() => toggleFeeActive(fee.id)}
                            style={{
                              width: '48px',
                              height: '24px',
                              borderRadius: '12px',
                              background: fee.isActive ? '#10b981' : 'rgba(255,255,255,0.2)',
                              position: 'relative',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'white',
                              position: 'absolute',
                              top: '2px',
                              left: fee.isActive ? '26px' : '2px',
                              transition: 'left 0.2s',
                            }} />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                              {fee.name}
                              {fee.isRequired && <span style={{ color: '#ef4444', marginLeft: '8px' }}>*</span>}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>{fee.description}</div>
                            <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                              Applicable: {fee.applicableTo.join(', ')}
                            </div>
                          </div>

                          {/* Valeur */}
                          <div style={{ textAlign: 'right', minWidth: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                value={fee.defaultValue}
                                onChange={e => updateFeeValue(fee.id, 'defaultValue', parseFloat(e.target.value))}
                                style={{ ...inputStyle, width: '80px', textAlign: 'right', padding: '6px 10px' }}
                                disabled={!fee.isActive}
                              />
                              <span style={{ fontSize: '13px', opacity: 0.7 }}>{fee.unit}</span>
                            </div>
                            {fee.minValue !== undefined && fee.maxValue !== undefined && (
                              <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                                Min: {fee.minValue} / Max: {fee.maxValue}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <button
                            onClick={() => deleteFee(fee.id)}
                            style={{
                              background: 'rgba(239,68,68,0.2)',
                              border: 'none',
                              color: '#ef4444',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Tab: Véhicules */}
          {activeTab === 'vehicles' && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Types de véhicules</h3>
              <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '20px' }}>
                Sélectionnez les types de véhicules pour lesquels les transporteurs devront fournir des tarifs
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {vehicleTypes.map(vehicle => (
                  <div
                    key={vehicle.id}
                    onClick={() => toggleVehicle(vehicle.id)}
                    style={{
                      padding: '20px',
                      background: vehicle.isActive
                        ? 'rgba(102,126,234,0.2)'
                        : 'rgba(255,255,255,0.02)',
                      border: vehicle.isActive
                        ? '2px solid #667eea'
                        : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      opacity: vehicle.isActive ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{vehicle.name}</div>
                    <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>
                      Code: {vehicle.code}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>
                      Capacité: {vehicle.capacity}
                    </div>
                    {vehicle.isActive && (
                      <div style={{ marginTop: '8px', color: '#667eea', fontSize: '12px', fontWeight: '600' }}>
                        ✓ Sélectionné
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Zones */}
          {activeTab === 'zones' && (
            <>
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Départements France</h3>
                <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '20px' }}>
                  Départements pour lesquels les transporteurs devront fournir des tarifs
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ZONES_FRANCE.map(zone => (
                    <button
                      key={zone.code}
                      onClick={() => toggleZone(zone.code)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: selectedZones.includes(zone.code)
                          ? '2px solid #667eea'
                          : '1px solid rgba(255,255,255,0.2)',
                        background: selectedZones.includes(zone.code)
                          ? 'rgba(102,126,234,0.3)'
                          : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {selectedZones.includes(zone.code) && '✓ '}
                      <strong>{zone.code}</strong> {zone.name}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => setSelectedZones(ZONES_FRANCE.map(z => z.code))}
                    style={{ ...buttonStyle, padding: '8px 16px', fontSize: '12px', marginRight: '8px' }}
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => setSelectedZones([])}
                    style={{ ...buttonStyle, padding: '8px 16px', fontSize: '12px', background: 'rgba(255,255,255,0.1)' }}
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Régions Europe ({ZONES_EUROPE.length} régions dans {EUROPEAN_COUNTRIES.length} pays)</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeEurope}
                      onChange={e => setIncludeEurope(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Inclure les zones européennes
                  </label>
                </div>
                {includeEurope && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {EUROPEAN_COUNTRIES.map(country => {
                      const countryZones = ZONES_EUROPE.filter(z => z.country === country.code);
                      const selectedCount = countryZones.filter(z => selectedZones.includes(z.code)).length;
                      const isAllSelected = selectedCount === countryZones.length;

                      return (
                        <div key={country.code} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '20px' }}>{country.flag}</span>
                              <span style={{ fontWeight: '600' }}>{country.name}</span>
                              <span style={{ fontSize: '12px', opacity: 0.6 }}>({selectedCount}/{countryZones.length})</span>
                            </div>
                            <button
                              onClick={() => {
                                if (isAllSelected) {
                                  setSelectedZones(zones => zones.filter(z => !countryZones.some(cz => cz.code === z)));
                                } else {
                                  setSelectedZones(zones => [...new Set([...zones, ...countryZones.map(z => z.code)])]);
                                }
                              }}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: isAllSelected ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.05)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
                            >
                              {isAllSelected ? '✓ Tout sélectionné' : 'Tout sélectionner'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {countryZones.map(zone => (
                              <button
                                key={zone.code}
                                onClick={() => toggleZone(zone.code)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  border: selectedZones.includes(zone.code)
                                    ? '2px solid #667eea'
                                    : '1px solid rgba(255,255,255,0.15)',
                                  background: selectedZones.includes(zone.code)
                                    ? 'rgba(102,126,234,0.3)'
                                    : 'rgba(255,255,255,0.02)',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                              >
                                {selectedZones.includes(zone.code) && '✓ '}
                                {zone.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: Documents joints */}
          {activeTab === 'attachments' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Documents à envoyer aux transporteurs</h2>
                  <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '14px' }}>
                    Joignez des fichiers Excel ou PDF que les transporteurs recevront avec la demande de tarif
                  </p>
                </div>
              </div>

              {/* Zone de drop */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  ...cardStyle,
                  border: dragOver ? '2px dashed #667eea' : '2px dashed rgba(255,255,255,0.2)',
                  background: dragOver ? 'rgba(102,126,234,0.1)' : 'rgba(255,255,255,0.05)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.xls,.xlsx,.csv"
                  style={{ display: 'none' }}
                  onChange={e => handleFileUpload(e.target.files)}
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: uploadingFile ? 0.5 : 1 }}>
                    {uploadingFile ? '⏳' : '📤'}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    {uploadingFile ? 'Upload en cours...' : 'Glissez-déposez vos fichiers ici'}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: '14px' }}>
                    ou cliquez pour sélectionner des fichiers
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(16,185,129,0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px' }}>
                      📊 Excel (.xlsx, .xls)
                    </span>
                    <span style={{ background: 'rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px' }}>
                      📄 PDF
                    </span>
                    <span style={{ background: 'rgba(59,130,246,0.2)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px' }}>
                      📋 CSV
                    </span>
                  </div>
                  <div style={{ marginTop: '12px', opacity: 0.5, fontSize: '12px' }}>
                    Taille max: 10 MB par fichier
                  </div>
                </label>
              </div>

              {/* Catégories de fichiers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { id: 'template', icon: '📝', label: 'Modèle à remplir', desc: 'Template Excel que le transporteur doit compléter' },
                  { id: 'specifications', icon: '📋', label: 'Cahier des charges', desc: 'Spécifications techniques, contraintes' },
                  { id: 'conditions', icon: '⚖️', label: 'Conditions générales', desc: 'CGV, conditions de paiement' },
                  { id: 'other', icon: '📎', label: 'Autre document', desc: 'Documentation complémentaire' },
                ].map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      ...cardStyle,
                      marginBottom: 0,
                      padding: '16px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.pdf,.xls,.xlsx,.csv';
                      input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, cat.id as any);
                      input.click();
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{cat.icon}</div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{cat.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>{cat.desc}</div>
                  </div>
                ))}
              </div>

              {/* Liste des fichiers joints */}
              {attachedFiles.length > 0 && (
                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📎 Fichiers joints
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>({attachedFiles.length})</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {attachedFiles.map(file => (
                      <div
                        key={file.id}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '16px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '16px',
                        }}
                      >
                        {/* Icône */}
                        <div style={{ fontSize: '36px', flexShrink: 0 }}>
                          {getFileIcon(file.type)}
                        </div>

                        {/* Infos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px', wordBreak: 'break-word' }}>
                            {file.originalName}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>
                            {formatFileSize(file.size)} • Ajouté le {new Date(file.uploadedAt).toLocaleDateString('fr-FR')}
                          </div>

                          {/* Catégorie */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <select
                              value={file.category}
                              onChange={e => updateFileCategory(file.id, e.target.value as AttachedFile['category'])}
                              style={{
                                background: 'rgba(30,30,50,0.8)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                              }}
                            >
                              <option value="template">📝 Modèle à remplir</option>
                              <option value="specifications">📋 Cahier des charges</option>
                              <option value="conditions">⚖️ Conditions générales</option>
                              <option value="other">📎 Autre</option>
                            </select>
                          </div>

                          {/* Description */}
                          <input
                            placeholder="Description du fichier (optionnel)"
                            value={file.description || ''}
                            onChange={e => updateFileDescription(file.id, e.target.value)}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'white',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              width: '100%',
                            }}
                          />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          {/* Télécharger */}
                          {file.url && (
                            <button
                              onClick={() => window.open(file.url, '_blank')}
                              style={{
                                background: 'rgba(59,130,246,0.2)',
                                border: 'none',
                                color: '#3b82f6',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                              }}
                              title="Télécharger"
                            >
                              ⬇️
                            </button>
                          )}
                          {/* Supprimer */}
                          <button
                            onClick={() => deleteFile(file.id)}
                            style={{
                              background: 'rgba(239,68,68,0.2)',
                              border: 'none',
                              color: '#ef4444',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucun fichier */}
              {attachedFiles.length === 0 && (
                <div style={{ ...cardStyle, textAlign: 'center', opacity: 0.6 }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun fichier joint</div>
                  <div style={{ fontSize: '14px' }}>
                    Ajoutez des fichiers Excel ou PDF pour les envoyer aux transporteurs
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab: Paramètres */}
          {activeTab === 'settings' && (
            <>
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Surcharge carburant</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Type d'indexation</label>
                    <select
                      style={selectStyle}
                      value={fuelSurchargeType}
                      onChange={e => setFuelSurchargeType(e.target.value as any)}
                    >
                      <option value="indexed">Indexé (CNR ou autre)</option>
                      <option value="fixed">Taux fixe</option>
                      <option value="none">Aucun</option>
                    </select>
                  </div>
                  {fuelSurchargeType === 'indexed' && (
                    <div>
                      <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Référence d'index</label>
                      <input
                        style={inputStyle}
                        value={fuelIndexReference}
                        onChange={e => setFuelIndexReference(e.target.value)}
                        placeholder="Ex: CNR Gazole"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Conditions de paiement</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Délai de paiement par défaut</label>
                    <select
                      style={selectStyle}
                      value={defaultPaymentDays}
                      onChange={e => setDefaultPaymentDays(parseInt(e.target.value))}
                    >
                      <option value="15">15 jours</option>
                      <option value="30">30 jours</option>
                      <option value="45">45 jours</option>
                      <option value="60">60 jours</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Durée de validité par défaut</label>
                    <select
                      style={selectStyle}
                      value={validityMonths}
                      onChange={e => setValidityMonths(parseInt(e.target.value))}
                    >
                      <option value="3">3 mois</option>
                      <option value="6">6 mois</option>
                      <option value="12">12 mois</option>
                      <option value="24">24 mois</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Remises volume</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enableVolumeDiscounts}
                      onChange={e => setEnableVolumeDiscounts(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Activer les remises volume
                  </label>
                </div>
                {enableVolumeDiscounts && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {volumeThresholds.map((threshold, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ opacity: 0.7 }}>À partir de</span>
                        <input
                          type="number"
                          value={threshold.minTransports}
                          onChange={e => {
                            const newThresholds = [...volumeThresholds];
                            newThresholds[idx].minTransports = parseInt(e.target.value);
                            setVolumeThresholds(newThresholds);
                          }}
                          style={{ ...inputStyle, width: '80px' }}
                        />
                        <span style={{ opacity: 0.7 }}>transports →</span>
                        <input
                          type="number"
                          value={threshold.discountPercent}
                          onChange={e => {
                            const newThresholds = [...volumeThresholds];
                            newThresholds[idx].discountPercent = parseFloat(e.target.value);
                            setVolumeThresholds(newThresholds);
                          }}
                          style={{ ...inputStyle, width: '60px' }}
                        />
                        <span style={{ opacity: 0.7 }}>% de remise</span>
                        <button
                          onClick={() => setVolumeThresholds(t => t.filter((_, i) => i !== idx))}
                          style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setVolumeThresholds([...volumeThresholds, { minTransports: 0, discountPercent: 0 }])}
                      style={{ ...buttonStyle, width: 'fit-content', padding: '8px 16px', fontSize: '13px' }}
                    >
                      + Ajouter un palier
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal: Ajouter un frais */}
        {showAddFeeModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ ...cardStyle, width: '600px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>Ajouter un frais annexe</h3>
                <button onClick={() => setShowAddFeeModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Code *</label>
                    <input
                      style={inputStyle}
                      value={newFee.code}
                      onChange={e => setNewFee({ ...newFee, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: FRAIS_CUSTOM"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Nom *</label>
                    <input
                      style={inputStyle}
                      value={newFee.name}
                      onChange={e => setNewFee({ ...newFee, name: e.target.value })}
                      placeholder="Nom du frais"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Description</label>
                  <input
                    style={inputStyle}
                    value={newFee.description}
                    onChange={e => setNewFee({ ...newFee, description: e.target.value })}
                    placeholder="Description du frais"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Type de calcul</label>
                    <select
                      style={selectStyle}
                      value={newFee.calculationType}
                      onChange={e => setNewFee({ ...newFee, calculationType: e.target.value as any })}
                    >
                      <option value="fixed">Montant fixe</option>
                      <option value="percentage">Pourcentage</option>
                      <option value="per_unit">Par unité</option>
                      <option value="per_hour">Par heure</option>
                      <option value="per_km">Par km</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Unité</label>
                    <input
                      style={inputStyle}
                      value={newFee.unit}
                      onChange={e => setNewFee({ ...newFee, unit: e.target.value })}
                      placeholder="€, %, €/h..."
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Valeur par défaut</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={newFee.defaultValue}
                      onChange={e => setNewFee({ ...newFee, defaultValue: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Catégorie</label>
                  <select
                    style={selectStyle}
                    value={newFee.category}
                    onChange={e => setNewFee({ ...newFee, category: e.target.value as any })}
                  >
                    <option value="manutention">🏗️ Manutention</option>
                    <option value="attente">⏱️ Attente</option>
                    <option value="livraison">🚚 Livraison</option>
                    <option value="administratif">📋 Administratif</option>
                    <option value="exceptionnel">⚠️ Exceptionnel</option>
                    <option value="carburant">⛽ Carburant</option>
                    <option value="autre">📦 Autre</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Applicable à</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {['LTL', 'FTL', 'MESSAGERIE'].map(type => (
                      <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newFee.applicableTo?.includes(type as any)}
                          onChange={e => {
                            const current = newFee.applicableTo || [];
                            setNewFee({
                              ...newFee,
                              applicableTo: e.target.checked
                                ? [...current, type as any]
                                : current.filter(t => t !== type)
                            });
                          }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newFee.isRequired}
                    onChange={e => setNewFee({ ...newFee, isRequired: e.target.checked })}
                  />
                  Ce frais est obligatoire
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={addNewFee} style={buttonStyle}>
                  Ajouter le frais
                </button>
                <button onClick={() => setShowAddFeeModal(false)} style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)' }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
