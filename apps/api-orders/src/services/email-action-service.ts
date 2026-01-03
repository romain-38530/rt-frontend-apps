/**
 * EmailActionService - Gestion des actions par email
 * Cree des tokens uniques pour les boutons CTA des emails
 */
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import EmailAction, { IEmailAction, EmailActionType } from '../models/EmailAction';
import Order from '../models/Order';
import TrackingService from './tracking-service';
import EventService from './event-service';

// URL de base pour les actions
const ACTION_BASE_URL = process.env.ACTION_URL || 'https://api.symphonia-controltower.com/actions';

interface CreateActionParams {
  orderId: string;
  actionType: EmailActionType;
  targetEmail: string;
  targetRole: 'carrier' | 'industrial' | 'supplier' | 'recipient' | 'logistician';
  targetName: string;
  metadata?: Record<string, any>;
  expiresInHours?: number;  // Defaut: 72h
}

interface ActionResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

class EmailActionService {
  /**
   * Cree un token d'action pour un bouton email
   */
  static async createAction(params: CreateActionParams): Promise<{ action: IEmailAction; url: string }> {
    const order = await Order.findOne({ orderId: params.orderId });
    if (!order) {
      throw new Error('Commande non trouvee');
    }

    const actionId = `action_${uuidv4()}`;
    const token = this.generateSecureToken();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (params.expiresInHours || 72));

    const action = await EmailAction.create({
      actionId,
      token,
      orderId: params.orderId,
      orderReference: order.reference,
      actionType: params.actionType,
      targetEmail: params.targetEmail,
      targetRole: params.targetRole,
      targetName: params.targetName,
      metadata: params.metadata,
      expiresAt,
      status: 'pending'
    });

    // URL avec le token
    const url = `${ACTION_BASE_URL}/${token}`;

    return { action, url };
  }

  /**
   * Genere un token securise
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Cree plusieurs actions pour un email (ex: Accepter/Refuser)
   */
  static async createMultipleActions(
    orderId: string,
    actions: Array<{
      actionType: EmailActionType;
      label: string;
      color?: string;
    }>,
    targetEmail: string,
    targetRole: 'carrier' | 'industrial' | 'supplier' | 'recipient' | 'logistician',
    targetName: string,
    metadata?: Record<string, any>
  ): Promise<Array<{ label: string; url: string; color: string }>> {
    const results = [];

    for (const actionDef of actions) {
      const { action, url } = await this.createAction({
        orderId,
        actionType: actionDef.actionType,
        targetEmail,
        targetRole,
        targetName,
        metadata
      });

      results.push({
        label: actionDef.label,
        url,
        color: actionDef.color || '#667eea'
      });
    }

    return results;
  }

  /**
   * Execute une action a partir du token
   */
  static async executeAction(token: string, executionData?: Record<string, any>): Promise<ActionResult> {
    const action = await EmailAction.findOne({ token });

    if (!action) {
      return { success: false, error: 'Action non trouvee ou lien invalide' };
    }

    if (action.status === 'executed') {
      return { success: false, error: 'Cette action a deja ete executee' };
    }

    if (action.status === 'expired' || action.expiresAt < new Date()) {
      action.status = 'expired';
      await action.save();
      return { success: false, error: 'Ce lien a expire' };
    }

    if (action.status === 'cancelled') {
      return { success: false, error: 'Cette action a ete annulee' };
    }

    // Executer l'action selon le type
    let result: ActionResult;

    try {
      switch (action.actionType) {
        case 'update_position':
          result = await this.handleUpdatePosition(action, executionData);
          break;

        case 'confirm_delivery':
          result = await this.handleConfirmDelivery(action, executionData);
          break;

        case 'report_issue':
          result = await this.handleReportIssue(action, executionData);
          break;

        case 'accept_offer':
          result = await this.handleAcceptOffer(action);
          break;

        case 'refuse_offer':
          result = await this.handleRefuseOffer(action, executionData);
          break;

        case 'view_tracking':
          result = await this.handleViewTracking(action);
          break;

        case 'upload_document':
          result = await this.handleUploadDocument(action, executionData);
          break;

        case 'approve_document':
          result = await this.handleApproveDocument(action);
          break;

        case 'reject_document':
          result = await this.handleRejectDocument(action, executionData);
          break;

        default:
          result = { success: false, error: 'Type d\'action non supporte' };
      }

      if (result.success) {
        action.status = 'executed';
        action.executedAt = new Date();
        action.executedData = { ...executionData, result: result.data };
        await action.save();
      }

      return result;
    } catch (error: any) {
      console.error(`[EmailActionService] Error executing action ${action.actionId}:`, error.message);
      return { success: false, error: 'Erreur lors de l\'execution de l\'action' };
    }
  }

  /**
   * Gere la mise a jour de position (transporteur)
   */
  private static async handleUpdatePosition(
    action: IEmailAction,
    data?: Record<string, any>
  ): Promise<ActionResult> {
    if (!data?.latitude || !data?.longitude) {
      // Retourne une page pour saisir la position
      return {
        success: true,
        data: {
          requiresInput: true,
          inputType: 'position',
          action: action.actionId,
          orderId: action.orderId,
          message: 'Veuillez autoriser la geolocalisation ou saisir votre position'
        }
      };
    }

    const carrierId = action.metadata?.carrierId;
    if (!carrierId) {
      return { success: false, error: 'Transporteur non identifie' };
    }

    const result = await TrackingService.updatePosition(action.orderId, carrierId, {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      speed: data.speed
    });

    if (result.success) {
      return {
        success: true,
        message: 'Position mise a jour avec succes',
        data: { order: result.order?.reference }
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Gere la confirmation de livraison
   */
  private static async handleConfirmDelivery(
    action: IEmailAction,
    data?: Record<string, any>
  ): Promise<ActionResult> {
    if (!data?.signature) {
      return {
        success: true,
        data: {
          requiresInput: true,
          inputType: 'signature',
          action: action.actionId,
          orderId: action.orderId,
          message: 'Veuillez signer pour confirmer la reception'
        }
      };
    }

    // Importer DeliveryService dynamiquement
    const DeliveryService = (await import('./delivery-service')).default;

    const result = await DeliveryService.confirmDelivery({
      orderId: action.orderId,
      confirmedBy: {
        id: action.targetEmail,
        name: action.targetName,
        role: action.targetRole as 'recipient' | 'industrial',
        email: action.targetEmail
      },
      signature: {
        data: data.signature,
        timestamp: new Date()
      },
      photos: data.photos,
      notes: data.notes,
      condition: data.condition || 'good'
    });

    if (result.success) {
      return {
        success: true,
        message: 'Livraison confirmee avec succes',
        data: result.order
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Gere le signalement d'incident
   */
  private static async handleReportIssue(
    action: IEmailAction,
    data?: Record<string, any>
  ): Promise<ActionResult> {
    if (!data?.issueType || !data?.description) {
      return {
        success: true,
        data: {
          requiresInput: true,
          inputType: 'issue_form',
          action: action.actionId,
          orderId: action.orderId,
          issueTypes: [
            { value: 'damaged_goods', label: 'Marchandise endommagee' },
            { value: 'missing_items', label: 'Articles manquants' },
            { value: 'wrong_delivery', label: 'Mauvaise adresse' },
            { value: 'delay', label: 'Retard important' },
            { value: 'other', label: 'Autre' }
          ]
        }
      };
    }

    const DeliveryService = (await import('./delivery-service')).default;

    // Mapper les types d'incident
    const issueTypeMap: Record<string, 'damage' | 'shortage' | 'wrong_product' | 'delay' | 'other'> = {
      'damaged_goods': 'damage',
      'missing_items': 'shortage',
      'wrong_delivery': 'wrong_product',
      'delay': 'delay',
      'other': 'other'
    };

    const result = await DeliveryService.reportDeliveryIssue({
      orderId: action.orderId,
      reportedBy: {
        id: action.targetEmail,
        name: action.targetName,
        role: action.targetRole,
        email: action.targetEmail
      },
      issueType: issueTypeMap[data.issueType] || 'other',
      severity: (data.severity as 'minor' | 'major' | 'critical') || 'major',
      description: data.description,
      photos: data.photos
    });

    if (result.success) {
      return {
        success: true,
        message: 'Incident signale avec succes',
        data: { issueId: result.issueId }
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Gere l'acceptation d'offre de transport
   */
  private static async handleAcceptOffer(action: IEmailAction): Promise<ActionResult> {
    const DispatchService = (await import('./dispatch-service')).default;

    const chainId = action.metadata?.chainId;

    if (!chainId) {
      return { success: false, error: 'Informations d\'offre manquantes' };
    }

    try {
      const result = await DispatchService.handleCarrierAccept(chainId, action.targetEmail);

      return {
        success: true,
        message: 'Offre acceptee! Vous pouvez maintenant suivre cette commande.',
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur lors de l\'acceptation' };
    }
  }

  /**
   * Gere le refus d'offre
   */
  private static async handleRefuseOffer(
    action: IEmailAction,
    data?: Record<string, any>
  ): Promise<ActionResult> {
    if (!data?.reason) {
      return {
        success: true,
        data: {
          requiresInput: true,
          inputType: 'refuse_reason',
          action: action.actionId,
          reasons: [
            { value: 'no_capacity', label: 'Pas de disponibilite' },
            { value: 'too_far', label: 'Trajet trop eloigne' },
            { value: 'price_too_low', label: 'Prix insuffisant' },
            { value: 'vehicle_incompatible', label: 'Vehicule non adapte' },
            { value: 'other', label: 'Autre raison' }
          ]
        }
      };
    }

    const DispatchService = (await import('./dispatch-service')).default;

    const chainId = action.metadata?.chainId;

    if (!chainId) {
      return { success: false, error: 'Informations d\'offre manquantes' };
    }

    try {
      const result = await DispatchService.handleCarrierRefuse(chainId, data.reason);

      return {
        success: true,
        message: 'Offre refusee. Merci pour votre reponse.',
        data: result
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur lors du refus' };
    }
  }

  /**
   * Redirige vers la page de suivi
   */
  private static async handleViewTracking(action: IEmailAction): Promise<ActionResult> {
    const portalUrls: Record<string, string> = {
      'carrier': process.env.CARRIER_PORTAL_URL || 'https://portail-transporteur.symphonia-controltower.com',
      'industrial': process.env.INDUSTRIAL_PORTAL_URL || 'https://industry.symphonia-controltower.com',
      'supplier': process.env.SUPPLIER_PORTAL_URL || 'https://supplier.symphonia-controltower.com',
      'recipient': process.env.RECIPIENT_PORTAL_URL || 'https://recipient.symphonia-controltower.com',
      'logistician': process.env.LOGISTICIAN_PORTAL_URL || 'https://logistician.symphonia-controltower.com'
    };

    const baseUrl = portalUrls[action.targetRole];
    const trackingUrl = `${baseUrl}/tracking/${action.orderId}`;

    return {
      success: true,
      data: {
        redirect: trackingUrl,
        orderId: action.orderId
      }
    };
  }

  /**
   * Gere l'upload de document
   */
  private static async handleUploadDocument(
    action: IEmailAction,
    data?: Record<string, any>
  ): Promise<ActionResult> {
    if (!data?.file) {
      return {
        success: true,
        data: {
          requiresInput: true,
          inputType: 'file_upload',
          action: action.actionId,
          orderId: action.orderId,
          acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          maxSize: 10 * 1024 * 1024, // 10MB
          documentType: action.metadata?.documentType || 'other'
        }
      };
    }

    const DocumentService = (await import('./document-service')).default;

    // Mapper les roles vers les roles acceptes par DocumentService
    const roleMap: Record<string, 'carrier' | 'supplier' | 'recipient' | 'industrial' | 'system'> = {
      'carrier': 'carrier',
      'supplier': 'supplier',
      'recipient': 'recipient',
      'industrial': 'industrial',
      'logistician': 'industrial' // Logisticien traite comme industriel
    };

    const result = await DocumentService.uploadDocument({
      orderId: action.orderId,
      type: action.metadata?.documentType || 'other',
      fileName: data.fileName,
      originalName: data.originalName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      uploadedBy: {
        id: action.targetEmail,
        name: action.targetName,
        role: roleMap[action.targetRole] || 'system'
      }
    });

    if (result.success) {
      return {
        success: true,
        message: 'Document telecharge avec succes',
        data: result.document
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Approuve un document
   */
  private static async handleApproveDocument(action: IEmailAction): Promise<ActionResult> {
    const DocumentService = (await import('./document-service')).default;

    const documentId = action.metadata?.documentId;
    if (!documentId) {
      return { success: false, error: 'Document non identifie' };
    }

    const result = await DocumentService.validateDocument(documentId, {
      id: action.targetEmail,
      name: action.targetName,
      role: action.targetRole
    });

    if (result.success) {
      return {
        success: true,
        message: 'Document approuve',
        data: result.document
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Rejette un document
   */
  private static async handleRejectDocument(
    action: IEmailAction,
    data?: Record<string, any>
  ): Promise<ActionResult> {
    if (!data?.reason) {
      return {
        success: true,
        data: {
          requiresInput: true,
          inputType: 'rejection_reason',
          action: action.actionId,
          reasons: [
            { value: 'illegible', label: 'Document illisible' },
            { value: 'incomplete', label: 'Informations incompletes' },
            { value: 'wrong_document', label: 'Mauvais document' },
            { value: 'missing_signature', label: 'Signature manquante' },
            { value: 'other', label: 'Autre raison' }
          ]
        }
      };
    }

    const DocumentService = (await import('./document-service')).default;

    const documentId = action.metadata?.documentId;
    if (!documentId) {
      return { success: false, error: 'Document non identifie' };
    }

    const result = await DocumentService.rejectDocument(
      documentId,
      {
        id: action.targetEmail,
        name: action.targetName,
        role: action.targetRole
      },
      data.reason
    );

    if (result.success) {
      return {
        success: true,
        message: 'Document rejete. Le transporteur sera notifie.',
        data: result.document
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Annule une action (par l'admin ou automatiquement)
   */
  static async cancelAction(actionId: string, reason?: string): Promise<boolean> {
    const result = await EmailAction.updateOne(
      { actionId, status: 'pending' },
      { status: 'cancelled', executedData: { cancelReason: reason } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Nettoie les actions expirees (cron job)
   */
  static async cleanupExpiredActions(): Promise<number> {
    const result = await EmailAction.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    );

    return result.modifiedCount;
  }

  /**
   * Recupere une action par token (pour afficher la page)
   */
  static async getActionByToken(token: string): Promise<IEmailAction | null> {
    return EmailAction.findOne({ token });
  }

  /**
   * Statistiques des actions
   */
  static async getActionStats(orderId?: string): Promise<any> {
    const match = orderId ? { orderId } : {};

    const stats = await EmailAction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const byType = await EmailAction.aggregate([
      { $match: { ...match, status: 'executed' } },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      byStatus: Object.fromEntries(stats.map(s => [s._id, s.count])),
      executedByType: Object.fromEntries(byType.map(t => [t._id, t.count]))
    };
  }
}

export default EmailActionService;
