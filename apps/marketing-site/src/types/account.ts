// Types pour le système de gestion des comptes

export type AccountType =
  | 'industry'
  | 'transporter'
  | 'logistician'
  | 'forwarder'
  | 'supplier'
  | 'recipient';

export type AccountStatus =
  | 'pending_selection'  // En attente de sélection du type
  | 'active'             // Compte actif
  | 'suspended'          // Compte suspendu
  | 'expired';           // Abonnement expiré

export interface AccountTypeInfo {
  type: AccountType;
  displayName: string;
  description: string;
  features: string[];
  portalUrl: string;
  amplifyAppId: string;
  canGenerateOrders: boolean;
  isDirectlyCreatable: boolean;
  permissions: string[];
  icon?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Données entreprise
  company?: {
    vatNumber: string;
    name: string;
    address: string;
    countryCode: string;
  };

  // Type de compte
  accountType: AccountType | null;
  accountStatus: AccountStatus;

  // Abonnement
  subscription?: {
    id: string;
    planId: string;
    planName: string;
    status: 'active' | 'cancelled' | 'expired';
    startDate: string;
    endDate: string;
    price: number;
    currency: string;
  };

  // Contrat
  contract?: {
    id: string;
    signedAt: string;
    signatureId: string;
    documentUrl?: string;
  };

  // Permissions
  permissions: string[];

  // Historique d'évolution
  accountHistory?: AccountHistoryEntry[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AccountHistoryEntry {
  previousType: AccountType;
  newType: AccountType;
  upgradedAt: string;
  reason: string;
}

export interface SelectAccountTypeRequest {
  userId: string;
  accountType: AccountType;
}

export interface SelectAccountTypeResponse {
  success: boolean;
  user: UserAccount;
  portalUrl: string;
  redirectUrl: string;
  message?: string;
}

export interface CheckEligibilityRequest {
  userId: string;
  desiredType: AccountType;
}

export interface CheckEligibilityResponse {
  eligible: boolean;
  reasons: string[];
  requiredSteps: string[];
}

export interface UpgradeAccountRequest {
  userId: string;
  fromType: AccountType;
  toType: AccountType;
  reason: string;
}

export interface UpgradeAccountResponse {
  success: boolean;
  newAccountType: AccountType;
  newPermissions: string[];
  newPortalUrl: string;
  message?: string;
}

export interface GetAccountInfoResponse {
  user: UserAccount;
  accountTypeInfo: AccountTypeInfo;
  canUpgrade: boolean;
  availableUpgrades: AccountType[];
}

export interface GetAvailableAccountTypesResponse {
  types: AccountTypeInfo[];
  currentType: AccountType | null;
  canCreate: AccountType[];  // Types directement créables
  canUpgradeTo: AccountType[]; // Types accessibles par upgrade
}

// Configuration des types de comptes
export const ACCOUNT_TYPES_CONFIG: Record<AccountType, AccountTypeInfo> = {
  industry: {
    type: 'industry',
    displayName: 'Industriel',
    description: 'Créez et gérez vos commandes de transport en toute autonomie',
    features: [
      'Créer des commandes de transport',
      'Gérer les palettes et stocks',
      'Analytics et rapports avancés',
      'Gestion de contrats transporteurs',
      'Suivi en temps réel'
    ],
    portalUrl: 'https://main.dbg6okncuyyiw.amplifyapp.com',
    amplifyAppId: 'dbg6okncuyyiw',
    canGenerateOrders: true,
    isDirectlyCreatable: true,
    permissions: ['create_orders', 'manage_palettes', 'view_analytics', 'manage_contracts'],
    icon: '🏭'
  },

  transporter: {
    type: 'transporter',
    displayName: 'Transporteur',
    description: 'Acceptez des missions et gérez votre flotte de véhicules',
    features: [
      'Accepter des missions de transport',
      'Gérer la flotte de véhicules',
      'Suivi des livraisons en temps réel',
      'Gestion des chauffeurs',
      'Planning et optimisation routes'
    ],
    portalUrl: 'https://main.d1tb834u144p4r.amplifyapp.com',
    amplifyAppId: 'd1tb834u144p4r',
    canGenerateOrders: true,
    isDirectlyCreatable: true,
    permissions: ['accept_missions', 'manage_fleet', 'update_delivery_status', 'driver_management'],
    icon: '🚛'
  },

  logistician: {
    type: 'logistician',
    displayName: 'Logisticien',
    description: 'Gérez votre entrepôt avec notre application mobile (PWA)',
    features: [
      'Scanner les QR codes',
      'Gérer les emplacements warehouse',
      'Suivi des palettes',
      'Mode hors ligne avec synchronisation',
      'Application mobile optimisée'
    ],
    portalUrl: 'https://main.d3hz3xvddrl94o.amplifyapp.com',
    amplifyAppId: 'd3hz3xvddrl94o',
    canGenerateOrders: true,
    isDirectlyCreatable: true,
    permissions: ['scan_qr', 'update_palette_status', 'warehouse_management', 'offline_sync'],
    icon: '📦'
  },

  forwarder: {
    type: 'forwarder',
    displayName: 'Transitaire',
    description: 'Coordonnez des transports multi-modaux et gérez plusieurs transporteurs',
    features: [
      'Coordonner les transports multi-modaux',
      'Gérer plusieurs transporteurs',
      'Suivi global des expéditions',
      'Génération de rapports personnalisés',
      'Optimisation AI des routes'
    ],
    portalUrl: 'https://main.dzvo8973zaqb.amplifyapp.com',
    amplifyAppId: 'dzvo8973zaqb',
    canGenerateOrders: true,
    isDirectlyCreatable: true,
    permissions: ['manage_multimodal', 'coordinate_carriers', 'track_shipments', 'generate_reports'],
    icon: '🌍'
  },

  supplier: {
    type: 'supplier',
    displayName: 'Fournisseur',
    description: 'Suivez les commandes de vos clients et gérez votre catalogue',
    features: [
      'Voir les commandes clients',
      'Planifier les enlèvements',
      'Gérer le catalogue produits',
      'Support chat en direct',
      'Notifications en temps réel'
    ],
    portalUrl: 'https://main.d3b6p09ihn5w7r.amplifyapp.com',
    amplifyAppId: 'd3b6p09ihn5w7r',
    canGenerateOrders: false,
    isDirectlyCreatable: false,
    permissions: ['view_orders', 'schedule_pickups', 'manage_catalog', 'chat_support'],
    icon: '🏪'
  },

  recipient: {
    type: 'recipient',
    displayName: 'Destinataire',
    description: 'Suivez vos livraisons et gérez votre planning de réception',
    features: [
      'Suivre les livraisons',
      'Confirmer les réceptions',
      'Gérer le planning de réception',
      'Support chat en direct',
      'Alertes de livraison'
    ],
    portalUrl: 'https://main.d3b6p09ihn5w7r.amplifyapp.com',
    amplifyAppId: 'd3b6p09ihn5w7r',
    canGenerateOrders: false,
    isDirectlyCreatable: false,
    permissions: ['track_shipments', 'confirm_deliveries', 'manage_schedule', 'chat_support'],
    icon: '📬'
  }
};

// Helper functions
export function getAccountTypeInfo(type: AccountType): AccountTypeInfo {
  return ACCOUNT_TYPES_CONFIG[type];
}

export function getCreatableAccountTypes(): AccountTypeInfo[] {
  return Object.values(ACCOUNT_TYPES_CONFIG).filter(t => t.isDirectlyCreatable);
}

export function canUpgradeAccountType(fromType: AccountType, toType: AccountType): boolean {
  // Supplier et Recipient peuvent évoluer vers Industry
  if ((fromType === 'supplier' || fromType === 'recipient') && toType === 'industry') {
    return true;
  }
  return false;
}

export function getPortalUrl(accountType: AccountType): string {
  return ACCOUNT_TYPES_CONFIG[accountType].portalUrl;
}

export function getDisplayName(accountType: AccountType): string {
  return ACCOUNT_TYPES_CONFIG[accountType].displayName;
}
