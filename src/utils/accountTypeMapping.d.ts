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
/**
 * Types frontend (anciens) - À NE PLUS UTILISER
 * @deprecated Utiliser directement BackendAccountType du hook usePricing
 */
export type LegacyFrontendAccountType = 'industry' | 'transporter' | 'logistician' | 'forwarder' | 'supplier' | 'recipient';
/**
 * Mapping des anciens types frontend vers les types backend officiels
 * @deprecated Cette fonction n'est nécessaire que pour la migration
 */
export declare function mapFrontendToBackend(frontendType: LegacyFrontendAccountType): BackendAccountType | null;
/**
 * Mapping des types backend vers les anciens types frontend
 * @deprecated Cette fonction n'est nécessaire que pour la rétrocompatibilité
 */
export declare function mapBackendToFrontend(backendType: BackendAccountType): LegacyFrontendAccountType | null;
/**
 * Obtenir le nom d'affichage en français pour un type de compte
 */
export declare function getDisplayName(backendType: BackendAccountType): string;
/**
 * Obtenir le nom d'affichage court (sans parenthèses)
 */
export declare function getShortDisplayName(backendType: BackendAccountType): string;
/**
 * Obtenir la description pour un type de compte
 */
export declare function getDescription(backendType: BackendAccountType): string;
/**
 * Obtenir l'URL du portal pour un type de compte
 */
export declare function getPortalUrl(backendType: BackendAccountType): string;
/**
 * Obtenir l'icône emoji pour un type de compte
 */
export declare function getIcon(backendType: BackendAccountType): string;
/**
 * Obtenir la couleur principale pour un type de compte (hex)
 */
export declare function getColor(backendType: BackendAccountType): string;
/**
 * Vérifier si un type de compte peut être créé directement
 */
export declare function isDirectlyCreatable(backendType: BackendAccountType): boolean;
/**
 * Vérifier si un type de compte est un upgrade seulement
 */
export declare function isUpgradeOnly(backendType: BackendAccountType): boolean;
/**
 * Vérifier si un type de compte est admin seulement
 */
export declare function isAdminOnly(backendType: BackendAccountType): boolean;
/**
 * Obtenir les types de comptes depuis lesquels on peut upgrade
 */
export declare function getUpgradeFromTypes(backendType: BackendAccountType): BackendAccountType[];
/**
 * Vérifier si un upgrade est possible depuis un type vers un autre
 */
export declare function canUpgradeTo(fromType: BackendAccountType, toType: BackendAccountType): boolean;
/**
 * Obtenir les fonctionnalités principales d'un type de compte
 */
export declare function getMainFeatures(backendType: BackendAccountType): string[];
/**
 * Vérifier si un type de compte peut créer des commandes
 */
export declare function canCreateOrders(backendType: BackendAccountType): boolean;
/**
 * Vérifier si un type de compte peut inviter d'autres utilisateurs
 */
export declare function canInviteOthers(backendType: BackendAccountType): boolean;
/**
 * Vérifier si un type de compte peut signer des e-CMR
 */
export declare function canSignECMR(backendType: BackendAccountType): boolean;
/**
 * Obtenir tous les types de comptes créables directement
 * (pour afficher dans une page de sélection)
 */
export declare function getAllCreatableTypes(): BackendAccountType[];
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
export declare function getAccountTypeInfo(backendType: BackendAccountType): AccountTypeInfo;
/**
 * Obtenir toutes les informations pour tous les types créables
 */
export declare function getAllCreatableTypesInfo(): AccountTypeInfo[];
/**
 * Vérifier si une chaîne est un type de compte backend valide
 */
export declare function isValidBackendAccountType(value: string): value is BackendAccountType;
/**
 * Parser une chaîne en BackendAccountType (avec validation)
 */
export declare function parseBackendAccountType(value: string): BackendAccountType | null;
//# sourceMappingURL=accountTypeMapping.d.ts.map