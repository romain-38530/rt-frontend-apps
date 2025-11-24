/**
 * Utilitaires de Mapping pour les Types de Comptes
 *
 * Ce fichier fournit des fonctions pour:
 * - Convertir entre anciens et nouveaux noms de types
 * - Obtenir les noms d'affichage
 * - Obtenir les URLs des portails
 * - Vérifier les permissions de création/upgrade
 *
 * Usage:
 * ```typescript
 * import { getDisplayName, isDirectlyCreatable } from '@/utils/accountTypeMapping';
 *
 * const displayName = getDisplayName('TRANSPORTEUR'); // "Transporteur"
 * const canCreate = isDirectlyCreatable('DOUANE'); // false
 * ```
 */

import { BackendAccountType } from '../hooks/usePricing';

// ==========================================
// Types Legacy (Rétrocompatibilité)
// ==========================================

/**
 * Types frontend (anciens) - À NE PLUS UTILISER
 * @deprecated Utiliser directement BackendAccountType du hook usePricing
 */
export type LegacyFrontendAccountType =
  | 'industry'
  | 'transporter'
  | 'logistician'
  | 'forwarder'
  | 'supplier'
  | 'recipient';

// ==========================================
// Fonctions de Mapping
// ==========================================

/**
 * Mapping des anciens types frontend vers les types backend officiels
 * @deprecated Cette fonction n'est nécessaire que pour la migration
 */
export function mapFrontendToBackend(frontendType: LegacyFrontendAccountType): BackendAccountType | null {
  const mapping: Partial<Record<LegacyFrontendAccountType, BackendAccountType>> = {
    industry: 'EXPEDITEUR',
    transporter: 'TRANSPORTEUR',
    logistician: 'PLATEFORME_LOGISTIQUE',
    forwarder: 'COMMISSIONNAIRE',
    // supplier et recipient n'ont pas d'équivalent backend direct
    // Ils deviennent des variantes "invitées" ou peuvent upgrade vers EXPEDITEUR
  };

  return mapping[frontendType] || null;
}

/**
 * Mapping des types backend vers les anciens types frontend
 * @deprecated Cette fonction n'est nécessaire que pour la rétrocompatibilité
 */
export function mapBackendToFrontend(backendType: BackendAccountType): LegacyFrontendAccountType | null {
  const reverseMapping: Partial<Record<BackendAccountType, LegacyFrontendAccountType>> = {
    EXPEDITEUR: 'industry',
    TRANSPORTEUR: 'transporter',
    PLATEFORME_LOGISTIQUE: 'logistician',
    COMMISSIONNAIRE: 'forwarder',
    // COMMISSIONNAIRE_AGRÉÉ et DOUANE n'ont pas d'équivalent frontend ancien
  };

  return reverseMapping[backendType] || null;
}

// ==========================================
// Informations d'Affichage
// ==========================================

/**
 * Obtenir le nom d'affichage en français pour un type de compte
 */
export function getDisplayName(backendType: BackendAccountType): string {
  const displayNames: Record<BackendAccountType, string> = {
    EXPEDITEUR: 'Industriel (Expéditeur)',
    TRANSPORTEUR: 'Transporteur',
    PLATEFORME_LOGISTIQUE: 'Plateforme Logistique',
    COMMISSIONNAIRE: 'Commissionnaire de Transport',
    COMMISSIONNAIRE_AGRÉÉ: 'Commissionnaire Agréé en Douane',
    DOUANE: 'Administration Douanière',
  };

  return displayNames[backendType];
}

/**
 * Obtenir le nom d'affichage court (sans parenthèses)
 */
export function getShortDisplayName(backendType: BackendAccountType): string {
  const shortNames: Record<BackendAccountType, string> = {
    EXPEDITEUR: 'Industriel',
    TRANSPORTEUR: 'Transporteur',
    PLATEFORME_LOGISTIQUE: 'Plateforme Logistique',
    COMMISSIONNAIRE: 'Commissionnaire',
    COMMISSIONNAIRE_AGRÉÉ: 'Commissionnaire Agréé',
    DOUANE: 'Administration Douanière',
  };

  return shortNames[backendType];
}

/**
 * Obtenir la description pour un type de compte
 */
export function getDescription(backendType: BackendAccountType): string {
  const descriptions: Record<BackendAccountType, string> = {
    EXPEDITEUR: 'Créez des commandes de transport et gérez vos expéditions',
    TRANSPORTEUR: 'Gérez vos missions de transport et signatures e-CMR',
    PLATEFORME_LOGISTIQUE: 'Gérez votre entrepôt, stocks et expéditions',
    COMMISSIONNAIRE: 'Organisez des transports et coordonnez les transporteurs',
    COMMISSIONNAIRE_AGRÉÉ: 'Gérez les opérations douanières et déclarations',
    DOUANE: 'Administration et contrôle des opérations douanières',
  };

  return descriptions[backendType];
}

// ==========================================
// URLs et Navigation
// ==========================================

/**
 * Obtenir l'URL du portal pour un type de compte
 */
export function getPortalUrl(backendType: BackendAccountType): string {
  const portalUrls: Record<BackendAccountType, string> = {
    EXPEDITEUR: 'https://main.dbg6okncuyyiw.amplifyapp.com',
    TRANSPORTEUR: 'https://transporter.rt-technologie.com',
    PLATEFORME_LOGISTIQUE: 'https://logistics.rt-technologie.com',
    COMMISSIONNAIRE: 'https://forwarder.rt-technologie.com',
    COMMISSIONNAIRE_AGRÉÉ: 'https://forwarder.rt-technologie.com',
    DOUANE: 'https://customs.rt-technologie.com',
  };

  return portalUrls[backendType];
}

/**
 * Obtenir l'icône emoji pour un type de compte
 */
export function getIcon(backendType: BackendAccountType): string {
  const icons: Record<BackendAccountType, string> = {
    EXPEDITEUR: '🏭',
    TRANSPORTEUR: '🚚',
    PLATEFORME_LOGISTIQUE: '📦',
    COMMISSIONNAIRE: '🌐',
    COMMISSIONNAIRE_AGRÉÉ: '🛃',
    DOUANE: '🏛️',
  };

  return icons[backendType];
}

/**
 * Obtenir la couleur principale pour un type de compte (hex)
 */
export function getColor(backendType: BackendAccountType): string {
  const colors: Record<BackendAccountType, string> = {
    EXPEDITEUR: '#3b82f6', // Bleu
    TRANSPORTEUR: '#10b981', // Vert
    PLATEFORME_LOGISTIQUE: '#f59e0b', // Orange
    COMMISSIONNAIRE: '#8b5cf6', // Violet
    COMMISSIONNAIRE_AGRÉÉ: '#ec4899', // Rose
    DOUANE: '#6b7280', // Gris
  };

  return colors[backendType];
}

// ==========================================
// Permissions et Restrictions
// ==========================================

/**
 * Vérifier si un type de compte peut être créé directement
 */
export function isDirectlyCreatable(backendType: BackendAccountType): boolean {
  const creatableTypes: BackendAccountType[] = [
    'EXPEDITEUR',
    'TRANSPORTEUR',
    'PLATEFORME_LOGISTIQUE',
    'COMMISSIONNAIRE',
  ];

  return creatableTypes.includes(backendType);
}

/**
 * Vérifier si un type de compte est un upgrade seulement
 */
export function isUpgradeOnly(backendType: BackendAccountType): boolean {
  return backendType === 'COMMISSIONNAIRE_AGRÉÉ';
}

/**
 * Vérifier si un type de compte est admin seulement
 */
export function isAdminOnly(backendType: BackendAccountType): boolean {
  return backendType === 'DOUANE';
}

/**
 * Obtenir les types de comptes depuis lesquels on peut upgrade
 */
export function getUpgradeFromTypes(backendType: BackendAccountType): BackendAccountType[] {
  const upgradeMap: Partial<Record<BackendAccountType, BackendAccountType[]>> = {
    COMMISSIONNAIRE_AGRÉÉ: ['COMMISSIONNAIRE'],
  };

  return upgradeMap[backendType] || [];
}

/**
 * Vérifier si un upgrade est possible depuis un type vers un autre
 */
export function canUpgradeTo(fromType: BackendAccountType, toType: BackendAccountType): boolean {
  const allowedUpgrades = getUpgradeFromTypes(toType);
  return allowedUpgrades.includes(fromType);
}

// ==========================================
// Fonctionnalités par Type
// ==========================================

/**
 * Obtenir les fonctionnalités principales d'un type de compte
 */
export function getMainFeatures(backendType: BackendAccountType): string[] {
  const features: Record<BackendAccountType, string[]> = {
    EXPEDITEUR: [
      'Création de commandes de transport',
      'Gestion des expéditions',
      'Suivi des livraisons',
      'Accès e-CMR complet',
      'Tableau de bord analytique',
      'Invitation de partenaires (transporteurs, logisticiens)',
    ],
    TRANSPORTEUR: [
      'Réception de missions',
      'Signature digitale e-CMR',
      'Suivi GPS en temps réel',
      'Gestion des livraisons',
      'Notifications en temps réel',
    ],
    PLATEFORME_LOGISTIQUE: [
      'Gestion des stocks',
      'Réception et expédition',
      'Signature e-CMR',
      'Suivi des palettes',
      'Inventaire en temps réel',
    ],
    COMMISSIONNAIRE: [
      'Organisation de transports',
      'Coordination des transporteurs',
      'Signature e-CMR',
      'Suivi multi-modal',
      'Gestion documentaire',
    ],
    COMMISSIONNAIRE_AGRÉÉ: [
      'Toutes fonctionnalités Commissionnaire',
      'Déclarations en douane',
      'Gestion des régimes douaniers',
      "Certificats d'origine",
      'Intégrations douane EU',
      'Support prioritaire',
    ],
    DOUANE: [
      'Consultation des déclarations',
      'Validation des documents',
      'Suivi des régimes douaniers',
      'Audit trail complet',
      'Exports réglementaires',
    ],
  };

  return features[backendType];
}

/**
 * Vérifier si un type de compte peut créer des commandes
 */
export function canCreateOrders(backendType: BackendAccountType): boolean {
  return backendType === 'EXPEDITEUR';
}

/**
 * Vérifier si un type de compte peut inviter d'autres utilisateurs
 */
export function canInviteOthers(backendType: BackendAccountType): boolean {
  return backendType === 'EXPEDITEUR';
}

/**
 * Vérifier si un type de compte peut signer des e-CMR
 */
export function canSignECMR(backendType: BackendAccountType): boolean {
  const signingTypes: BackendAccountType[] = [
    'EXPEDITEUR',
    'TRANSPORTEUR',
    'PLATEFORME_LOGISTIQUE',
    'COMMISSIONNAIRE',
    'COMMISSIONNAIRE_AGRÉÉ',
  ];

  return signingTypes.includes(backendType);
}

// ==========================================
// Helpers pour l'UI
// ==========================================

/**
 * Obtenir tous les types de comptes créables directement
 * (pour afficher dans une page de sélection)
 */
export function getAllCreatableTypes(): BackendAccountType[] {
  const all: BackendAccountType[] = [
    'EXPEDITEUR',
    'TRANSPORTEUR',
    'PLATEFORME_LOGISTIQUE',
    'COMMISSIONNAIRE',
    'COMMISSIONNAIRE_AGRÉÉ',
    'DOUANE',
  ];

  return all.filter(isDirectlyCreatable);
}

/**
 * Obtenir les informations complètes pour un type de compte
 */
export interface AccountTypeInfo {
  type: BackendAccountType;
  displayName: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  portalUrl: string;
  features: string[];
  isCreatable: boolean;
  isUpgradeOnly: boolean;
  isAdminOnly: boolean;
  upgradeFromTypes: BackendAccountType[];
  canCreateOrders: boolean;
  canInviteOthers: boolean;
  canSignECMR: boolean;
}

/**
 * Obtenir toutes les informations pour un type de compte
 */
export function getAccountTypeInfo(backendType: BackendAccountType): AccountTypeInfo {
  return {
    type: backendType,
    displayName: getDisplayName(backendType),
    shortName: getShortDisplayName(backendType),
    description: getDescription(backendType),
    icon: getIcon(backendType),
    color: getColor(backendType),
    portalUrl: getPortalUrl(backendType),
    features: getMainFeatures(backendType),
    isCreatable: isDirectlyCreatable(backendType),
    isUpgradeOnly: isUpgradeOnly(backendType),
    isAdminOnly: isAdminOnly(backendType),
    upgradeFromTypes: getUpgradeFromTypes(backendType),
    canCreateOrders: canCreateOrders(backendType),
    canInviteOthers: canInviteOthers(backendType),
    canSignECMR: canSignECMR(backendType),
  };
}

/**
 * Obtenir toutes les informations pour tous les types créables
 */
export function getAllCreatableTypesInfo(): AccountTypeInfo[] {
  return getAllCreatableTypes().map(getAccountTypeInfo);
}

// ==========================================
// Validation
// ==========================================

/**
 * Vérifier si une chaîne est un type de compte backend valide
 */
export function isValidBackendAccountType(value: string): value is BackendAccountType {
  const validTypes: string[] = [
    'TRANSPORTEUR',
    'EXPEDITEUR',
    'PLATEFORME_LOGISTIQUE',
    'COMMISSIONNAIRE',
    'COMMISSIONNAIRE_AGRÉÉ',
    'DOUANE',
  ];

  return validTypes.includes(value);
}

/**
 * Parser une chaîne en BackendAccountType (avec validation)
 */
export function parseBackendAccountType(value: string): BackendAccountType | null {
  const normalized = value.toUpperCase();

  if (isValidBackendAccountType(normalized)) {
    return normalized;
  }

  return null;
}
