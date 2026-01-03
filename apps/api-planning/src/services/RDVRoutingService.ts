/**
 * RDV Routing Service - Service de routage des demandes de rendez-vous
 * SYMPHONI.A - RT Technologie
 *
 * Determine automatiquement le destinataire d'une demande de RDV selon:
 * - La configuration de la commande (delegation logistique)
 * - Le type d'operation (chargement/livraison)
 * - Le site concerne (industriel, logisticien delegue, fournisseur)
 *
 * @version 1.0.0
 */

import { RDVRecipientType } from '../models/AppointmentRequest';

// ============================================
// INTERFACES
// ============================================

export interface OrderInfo {
  orderId: string;
  orderReference: string;
  type: 'FTL' | 'LTL' | 'Express' | 'Groupage';

  // Donneur d'ordre (industriel)
  organizationId: string;
  organizationName: string;

  // Sites de chargement/livraison
  pickupSite: SiteInfo;
  deliverySite: SiteInfo;

  // Delegation logistique (si applicable)
  delegatedLogistics?: DelegatedLogisticsInfo;

  // Fournisseur (si applicable)
  supplier?: SupplierInfo;
}

export interface SiteInfo {
  siteId?: string;
  siteName: string;
  address: string;
  organizationId: string;
  organizationType: 'industrial' | 'logistician' | 'supplier' | 'recipient';
  managedBy?: string; // ID de l'organisation qui gere ce site
}

export interface DelegatedLogisticsInfo {
  partnerId: string;
  partnerName: string;
  partnerType: '3PL' | '4PL';
  managedOperations: ('pickup' | 'delivery' | 'both')[];
  partnerSites: string[];
  contractStartDate: Date;
  contractEndDate?: Date;
  isActive: boolean;
}

export interface SupplierInfo {
  supplierId: string;
  supplierName: string;
  supplierSiteId?: string;
  managedByIndustrial: boolean;
}

export interface RDVRoutingResult {
  targetOrganizationId: string;
  targetOrganizationName: string;
  targetOrganizationType: RDVRecipientType;
  targetSiteId?: string;
  targetSiteName?: string;
  routing: {
    determinedBy: 'auto' | 'manual';
    determinedAt: Date;
    routingReason: string;
    originalIndustrialId: string;
    originalIndustrialName: string;
    delegatedLogisticsId?: string;
    delegatedLogisticsName?: string;
    supplierId?: string;
    supplierName?: string;
  };
}

// ============================================
// SERVICE CLASS
// ============================================

export class RDVRoutingService {

  /**
   * Determine le destinataire d'une demande de RDV pour chargement
   */
  determinePickupRDVRecipient(order: OrderInfo): RDVRoutingResult {
    const baseRouting = {
      determinedBy: 'auto' as const,
      determinedAt: new Date(),
      originalIndustrialId: order.organizationId,
      originalIndustrialName: order.organizationName,
    };

    // CAS 1: Chargement chez un fournisseur
    if (order.supplier && order.pickupSite.organizationType === 'supplier') {
      // Si le fournisseur gere lui-meme ses RDV
      if (!order.supplier.managedByIndustrial) {
        return {
          targetOrganizationId: order.supplier.supplierId,
          targetOrganizationName: order.supplier.supplierName,
          targetOrganizationType: 'supplier',
          targetSiteId: order.supplier.supplierSiteId,
          targetSiteName: order.pickupSite.siteName,
          routing: {
            ...baseRouting,
            routingReason: 'Chargement chez fournisseur - RDV gere par le fournisseur',
            supplierId: order.supplier.supplierId,
            supplierName: order.supplier.supplierName,
          },
        };
      }
      // Sinon, l'industriel gere le RDV pour le compte du fournisseur
      return {
        targetOrganizationId: order.organizationId,
        targetOrganizationName: order.organizationName,
        targetOrganizationType: 'industrial',
        targetSiteId: order.supplier.supplierSiteId,
        targetSiteName: order.pickupSite.siteName,
        routing: {
          ...baseRouting,
          routingReason: 'Chargement chez fournisseur - RDV gere par l\'industriel',
          supplierId: order.supplier.supplierId,
          supplierName: order.supplier.supplierName,
        },
      };
    }

    // CAS 2: Logistique deleguee active pour le chargement
    if (
      order.delegatedLogistics &&
      order.delegatedLogistics.isActive &&
      (order.delegatedLogistics.managedOperations.includes('pickup') ||
       order.delegatedLogistics.managedOperations.includes('both'))
    ) {
      return {
        targetOrganizationId: order.delegatedLogistics.partnerId,
        targetOrganizationName: order.delegatedLogistics.partnerName,
        targetOrganizationType: 'logistician',
        targetSiteId: order.pickupSite.siteId,
        targetSiteName: order.pickupSite.siteName,
        routing: {
          ...baseRouting,
          routingReason: `Chargement delegue au logisticien ${order.delegatedLogistics.partnerType}`,
          delegatedLogisticsId: order.delegatedLogistics.partnerId,
          delegatedLogisticsName: order.delegatedLogistics.partnerName,
        },
      };
    }

    // CAS 3: Chargement chez l'industriel (cas par defaut)
    return {
      targetOrganizationId: order.organizationId,
      targetOrganizationName: order.organizationName,
      targetOrganizationType: 'industrial',
      targetSiteId: order.pickupSite.siteId,
      targetSiteName: order.pickupSite.siteName,
      routing: {
        ...baseRouting,
        routingReason: 'Chargement chez le donneur d\'ordre',
      },
    };
  }

  /**
   * Determine le destinataire d'une demande de RDV pour livraison
   */
  determineDeliveryRDVRecipient(order: OrderInfo): RDVRoutingResult {
    const baseRouting = {
      determinedBy: 'auto' as const,
      determinedAt: new Date(),
      originalIndustrialId: order.organizationId,
      originalIndustrialName: order.organizationName,
    };

    // CAS 1: Livraison chez le destinataire final (client de l'industriel)
    if (order.deliverySite.organizationType === 'recipient') {
      // Le destinataire gere-t-il ses propres RDV ?
      if (order.deliverySite.managedBy && order.deliverySite.managedBy !== order.organizationId) {
        return {
          targetOrganizationId: order.deliverySite.managedBy,
          targetOrganizationName: order.deliverySite.siteName,
          targetOrganizationType: 'industrial', // Le destinataire est considere comme industriel
          targetSiteId: order.deliverySite.siteId,
          targetSiteName: order.deliverySite.siteName,
          routing: {
            ...baseRouting,
            routingReason: 'Livraison chez destinataire - RDV gere par le destinataire',
          },
        };
      }
    }

    // CAS 2: Logistique deleguee active pour la livraison
    if (
      order.delegatedLogistics &&
      order.delegatedLogistics.isActive &&
      (order.delegatedLogistics.managedOperations.includes('delivery') ||
       order.delegatedLogistics.managedOperations.includes('both'))
    ) {
      return {
        targetOrganizationId: order.delegatedLogistics.partnerId,
        targetOrganizationName: order.delegatedLogistics.partnerName,
        targetOrganizationType: 'logistician',
        targetSiteId: order.deliverySite.siteId,
        targetSiteName: order.deliverySite.siteName,
        routing: {
          ...baseRouting,
          routingReason: `Livraison deleguee au logisticien ${order.delegatedLogistics.partnerType}`,
          delegatedLogisticsId: order.delegatedLogistics.partnerId,
          delegatedLogisticsName: order.delegatedLogistics.partnerName,
        },
      };
    }

    // CAS 3: Livraison geree par l'industriel (cas par defaut)
    return {
      targetOrganizationId: order.organizationId,
      targetOrganizationName: order.organizationName,
      targetOrganizationType: 'industrial',
      targetSiteId: order.deliverySite.siteId,
      targetSiteName: order.deliverySite.siteName,
      routing: {
        ...baseRouting,
        routingReason: 'Livraison geree par le donneur d\'ordre',
      },
    };
  }

  /**
   * Determine le destinataire selon le type d'operation
   */
  determineRDVRecipient(order: OrderInfo, type: 'loading' | 'unloading'): RDVRoutingResult {
    if (type === 'loading') {
      return this.determinePickupRDVRecipient(order);
    } else {
      return this.determineDeliveryRDVRecipient(order);
    }
  }

  /**
   * Convertit les donnees d'une commande API en OrderInfo
   */
  static fromAPIOrder(apiOrder: any): OrderInfo {
    return {
      orderId: apiOrder._id || apiOrder.id,
      orderReference: apiOrder.reference || apiOrder.orderReference,
      type: apiOrder.transportType || 'FTL',
      organizationId: apiOrder.organizationId,
      organizationName: apiOrder.organizationName || apiOrder.shipper?.name || 'Industriel',

      pickupSite: {
        siteId: apiOrder.pickup?.siteId,
        siteName: apiOrder.pickup?.site || apiOrder.pickup?.address || 'Site de chargement',
        address: apiOrder.pickup?.address || '',
        organizationId: apiOrder.pickup?.organizationId || apiOrder.organizationId,
        organizationType: apiOrder.pickup?.organizationType || 'industrial',
        managedBy: apiOrder.pickup?.managedBy,
      },

      deliverySite: {
        siteId: apiOrder.delivery?.siteId,
        siteName: apiOrder.delivery?.site || apiOrder.delivery?.address || 'Site de livraison',
        address: apiOrder.delivery?.address || '',
        organizationId: apiOrder.delivery?.organizationId || apiOrder.recipientId,
        organizationType: apiOrder.delivery?.organizationType || 'recipient',
        managedBy: apiOrder.delivery?.managedBy,
      },

      delegatedLogistics: apiOrder.delegatedLogistics ? {
        partnerId: apiOrder.delegatedLogistics.partnerId,
        partnerName: apiOrder.delegatedLogistics.partnerName,
        partnerType: apiOrder.delegatedLogistics.partnerType || '3PL',
        managedOperations: apiOrder.delegatedLogistics.managedOperations || ['both'],
        partnerSites: apiOrder.delegatedLogistics.partnerSites || [],
        contractStartDate: new Date(apiOrder.delegatedLogistics.contractStartDate),
        contractEndDate: apiOrder.delegatedLogistics.contractEndDate
          ? new Date(apiOrder.delegatedLogistics.contractEndDate)
          : undefined,
        isActive: apiOrder.delegatedLogistics.isActive !== false,
      } : undefined,

      supplier: apiOrder.supplier ? {
        supplierId: apiOrder.supplier.supplierId,
        supplierName: apiOrder.supplier.supplierName,
        supplierSiteId: apiOrder.supplier.siteId,
        managedByIndustrial: apiOrder.supplier.managedByIndustrial !== false,
      } : undefined,
    };
  }

  /**
   * Genere un message systeme expliquant le routage
   */
  static generateRoutingMessage(result: RDVRoutingResult, language: 'fr' | 'en' = 'fr'): string {
    const messages = {
      fr: {
        industrial: `Demande de RDV envoyee a ${result.targetOrganizationName} (donneur d'ordre)`,
        logistician: `Demande de RDV envoyee a ${result.targetOrganizationName} (logisticien delegue)`,
        supplier: `Demande de RDV envoyee a ${result.targetOrganizationName} (fournisseur)`,
      },
      en: {
        industrial: `Appointment request sent to ${result.targetOrganizationName} (shipper)`,
        logistician: `Appointment request sent to ${result.targetOrganizationName} (delegated logistics)`,
        supplier: `Appointment request sent to ${result.targetOrganizationName} (supplier)`,
      },
    };

    return messages[language][result.targetOrganizationType];
  }
}

// Export singleton instance
export const rdvRoutingService = new RDVRoutingService();
