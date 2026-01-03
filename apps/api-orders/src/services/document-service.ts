/**
 * Service de gestion des documents - SYMPHONI.A
 * Upload, validation, signature et archivage des CMR/BL/POD
 */
import { v4 as uuidv4 } from 'uuid';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import Document, { DocumentType, DocumentStatus, IDocument } from '../models/Document';
import Order from '../models/Order';
import EventService from './event-service';

// Configuration AWS SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@symphonia-controltower.com',
  fromName: process.env.SES_FROM_NAME || 'SYMPHONI.A',
  replyTo: process.env.SES_REPLY_TO || 'support@symphonia-controltower.com'
};

let sesClient: SESClient | null = null;
function getSESClient(): SESClient | null {
  if (sesClient) return sesClient;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    sesClient = new SESClient({ region: SES_CONFIG.region, credentials: { accessKeyId, secretAccessKey } });
    return sesClient;
  }
  return null;
}

interface UploadDocumentParams {
  orderId: string;
  type: DocumentType;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileData?: string;  // Base64 encoded file data
  s3Key?: string;
  s3Bucket?: string;
  url?: string;
  uploadedBy: {
    id: string;
    name: string;
    role: 'carrier' | 'supplier' | 'recipient' | 'industrial' | 'system';
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

interface SignDocumentParams {
  signedBy: string;
  signatureData: string;
  ipAddress?: string;
  deviceInfo?: string;
}

class DocumentService {
  /**
   * Upload un nouveau document
   */
  static async uploadDocument(params: UploadDocumentParams): Promise<{
    success: boolean;
    document?: IDocument;
    error?: string;
  }> {
    try {
      // Vérifier que la commande existe
      const order = await Order.findOne({ orderId: params.orderId });
      if (!order) {
        return { success: false, error: 'Commande non trouvée' };
      }

      const documentId = `doc_${uuidv4()}`;

      // Créer le document
      const document = new Document({
        documentId,
        orderId: params.orderId,
        orderReference: order.reference,
        type: params.type,
        status: 'pending',
        fileName: params.fileName,
        originalName: params.originalName,
        mimeType: params.mimeType,
        fileSize: params.fileSize,
        s3Key: params.s3Key,
        s3Bucket: params.s3Bucket,
        url: params.url,
        uploadedBy: params.uploadedBy,
        uploadedAt: new Date(),
        location: params.location,
        notes: params.notes
      });

      await document.save();

      // Créer un événement
      await EventService.createEvent({
        orderId: params.orderId,
        orderReference: order.reference,
        eventType: 'document_uploaded',
        source: params.uploadedBy.role,
        data: {
          documentId,
          documentType: params.type,
          fileName: params.originalName,
          uploadedBy: params.uploadedBy.name
        }
      });

      // Notifier les parties concernées
      await this.notifyDocumentUploaded(order, document);

      return { success: true, document };
    } catch (error: any) {
      console.error('[DocumentService] Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Valide un document
   */
  static async validateDocument(
    documentId: string,
    validatedBy: { id: string; name: string; role: string }
  ): Promise<{ success: boolean; document?: IDocument; error?: string }> {
    try {
      const document = await Document.findOne({ documentId });
      if (!document) {
        return { success: false, error: 'Document non trouvé' };
      }

      if (document.status !== 'pending') {
        return { success: false, error: `Document déjà ${document.status}` };
      }

      document.status = 'validated';
      document.validatedBy = validatedBy;
      document.validatedAt = new Date();
      await document.save();

      // Créer un événement
      await EventService.createEvent({
        orderId: document.orderId,
        orderReference: document.orderReference,
        eventType: 'document_validated',
        source: validatedBy.role as any,
        data: {
          documentId,
          documentType: document.type,
          validatedBy: validatedBy.name
        }
      });

      return { success: true, document };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rejette un document
   */
  static async rejectDocument(
    documentId: string,
    rejectedBy: { id: string; name: string; role: string },
    reason: string
  ): Promise<{ success: boolean; document?: IDocument; error?: string }> {
    try {
      const document = await Document.findOne({ documentId });
      if (!document) {
        return { success: false, error: 'Document non trouvé' };
      }

      document.status = 'rejected';
      document.validatedBy = rejectedBy;
      document.validatedAt = new Date();
      document.rejectionReason = reason;
      await document.save();

      // Créer un événement
      await EventService.createEvent({
        orderId: document.orderId,
        orderReference: document.orderReference,
        eventType: 'document_rejected',
        source: rejectedBy.role as any,
        data: {
          documentId,
          documentType: document.type,
          rejectedBy: rejectedBy.name,
          reason
        }
      });

      // Notifier le transporteur du rejet
      await this.notifyDocumentRejected(document, reason);

      return { success: true, document };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Signe un document (POD/BL) - Signature électronique
   */
  static async signDocument(
    documentId: string,
    signParams: SignDocumentParams
  ): Promise<{ success: boolean; document?: IDocument; error?: string }> {
    try {
      const document = await Document.findOne({ documentId });
      if (!document) {
        return { success: false, error: 'Document non trouvé' };
      }

      if (!['pod', 'bl'].includes(document.type)) {
        return { success: false, error: 'Seuls les POD et BL peuvent être signés' };
      }

      if (document.signature?.signedAt) {
        return { success: false, error: 'Document déjà signé' };
      }

      document.signature = {
        signedBy: signParams.signedBy,
        signedAt: new Date(),
        signatureData: signParams.signatureData,
        ipAddress: signParams.ipAddress,
        deviceInfo: signParams.deviceInfo
      };
      document.status = 'validated';
      document.validatedAt = new Date();
      await document.save();

      // Créer un événement
      await EventService.createEvent({
        orderId: document.orderId,
        orderReference: document.orderReference,
        eventType: 'document_signed',
        source: 'recipient',
        data: {
          documentId,
          documentType: document.type,
          signedBy: signParams.signedBy
        }
      });

      return { success: true, document };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les documents d'une commande
   */
  static async getOrderDocuments(orderId: string): Promise<IDocument[]> {
    return await Document.find({ orderId }).sort({ uploadedAt: -1 });
  }

  /**
   * Récupère un document par son ID
   */
  static async getDocument(documentId: string): Promise<IDocument | null> {
    return await Document.findOne({ documentId });
  }

  /**
   * Vérifie si tous les documents requis sont présents et validés
   */
  static async checkRequiredDocuments(orderId: string): Promise<{
    complete: boolean;
    missing: DocumentType[];
    pending: DocumentType[];
    validated: DocumentType[];
  }> {
    const requiredTypes: DocumentType[] = ['cmr', 'pod'];
    const documents = await this.getOrderDocuments(orderId);

    const validated: DocumentType[] = [];
    const pending: DocumentType[] = [];
    const missing: DocumentType[] = [];

    for (const type of requiredTypes) {
      const doc = documents.find(d => d.type === type);
      if (!doc) {
        missing.push(type);
      } else if (doc.status === 'validated') {
        validated.push(type);
      } else if (doc.status === 'pending') {
        pending.push(type);
      }
    }

    return {
      complete: missing.length === 0 && pending.length === 0,
      missing,
      pending,
      validated
    };
  }

  /**
   * Archive les documents d'une commande
   */
  static async archiveOrderDocuments(orderId: string): Promise<number> {
    const result = await Document.updateMany(
      { orderId, status: 'validated' },
      { $set: { status: 'archived' } }
    );
    return result.modifiedCount;
  }

  /**
   * Notifie les parties de l'upload d'un document
   */
  private static async notifyDocumentUploaded(order: any, document: IDocument): Promise<void> {
    const documentLabels: Record<string, string> = {
      cmr: 'CMR (Lettre de voiture)',
      bl: 'Bon de livraison',
      pod: 'Preuve de livraison (POD)',
      invoice: 'Facture',
      packing_list: 'Liste de colisage',
      certificate: 'Certificat',
      customs: 'Document douanier',
      photo: 'Photo',
      damage_report: 'Rapport de dommages',
      other: 'Document'
    };

    const docLabel = documentLabels[document.type] || 'Document';

    // Email pour l'industriel
    if (order.industrialId) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .doc-info { background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Nouveau Document</h1>
              <p>SYMPHONI.A</p>
            </div>
            <div class="content">
              <p>Un nouveau document a été déposé pour la commande <strong>${order.reference}</strong>.</p>

              <div class="doc-info">
                <p><strong>Type :</strong> ${docLabel}</p>
                <p><strong>Fichier :</strong> ${document.originalName}</p>
                <p><strong>Déposé par :</strong> ${document.uploadedBy.name} (${document.uploadedBy.role})</p>
                <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
              </div>

              <p>Vous pouvez consulter et valider ce document depuis votre espace.</p>

              <p style="text-align: center; margin-top: 20px;">
                <a href="https://app.symphonia-controltower.com/orders/${order.orderId}/documents" class="button">
                  Voir le document
                </a>
              </p>
            </div>
            <div class="footer">
              <p>SYMPHONI.A - Plateforme de gestion logistique<br>
              RT Technologie - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const client = getSESClient();
      const fromAddress = `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`;
      const toEmail = order.createdBy?.email || process.env.INDUSTRIAL_EMAIL;
      const subject = `[SYMPHONI.A] ${docLabel} déposé - ${order.reference}`;

      if (!client) {
        console.log(`[DocumentService] MOCK EMAIL - To: ${toEmail}, Subject: ${subject}`);
        return;
      }

      if (toEmail) {
        const params: SendEmailCommandInput = {
          Source: fromAddress,
          Destination: { ToAddresses: [toEmail] },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Html: { Data: html, Charset: 'UTF-8' } }
          },
          ReplyToAddresses: [SES_CONFIG.replyTo]
        };

        try {
          const command = new SendEmailCommand(params);
          const response = await client.send(command);
          console.log(`[DocumentService] Email sent to ${toEmail}: ${response.MessageId}`);
        } catch (error: any) {
          console.error('[DocumentService] AWS SES error:', error.message);
        }
      }
    }
  }

  /**
   * Notifie le transporteur du rejet d'un document
   */
  private static async notifyDocumentRejected(document: IDocument, reason: string): Promise<void> {
    const order = await Order.findOne({ orderId: document.orderId });
    if (!order?.carrierEmail) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .reason { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Document Rejeté</h1>
            <p>SYMPHONI.A</p>
          </div>
          <div class="content">
            <p>Votre document pour la commande <strong>${order.reference}</strong> a été rejeté.</p>

            <p><strong>Document :</strong> ${document.originalName}</p>

            <div class="reason">
              <strong>Motif du rejet :</strong><br>
              ${reason}
            </div>

            <p>Merci de déposer un nouveau document conforme.</p>

            <p style="text-align: center; margin-top: 20px;">
              <a href="https://portail-transporteur.symphonia-controltower.com/orders/${order.orderId}" class="button">
                Déposer un nouveau document
              </a>
            </p>
          </div>
          <div class="footer">
            <p>SYMPHONI.A - Plateforme de gestion logistique<br>
            RT Technologie - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const client = getSESClient();
    const fromAddress = `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`;
    const subject = `[SYMPHONI.A] Document rejeté - ${order.reference}`;

    if (!client) {
      console.log(`[DocumentService] MOCK EMAIL - To: ${order.carrierEmail}, Subject: ${subject}`);
      return;
    }

    const params: SendEmailCommandInput = {
      Source: fromAddress,
      Destination: { ToAddresses: [order.carrierEmail] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      },
      ReplyToAddresses: [SES_CONFIG.replyTo]
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await client.send(command);
      console.log(`[DocumentService] Rejection email sent to ${order.carrierEmail}: ${response.MessageId}`);
    } catch (error: any) {
      console.error('[DocumentService] AWS SES error:', error.message);
    }
  }

  /**
   * Statistiques des documents
   */
  static async getDocumentStats(industrialId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    recentUploads: number;
  }> {
    const matchStage: any = {};
    if (industrialId) {
      const orders = await Order.find({ industrialId }).select('orderId');
      const orderIds = orders.map(o => o.orderId);
      matchStage.orderId = { $in: orderIds };
    }

    const [total, byType, byStatus, recentUploads] = await Promise.all([
      Document.countDocuments(matchStage),
      Document.aggregate([
        { $match: matchStage },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Document.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Document.countDocuments({
        ...matchStage,
        uploadedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      total,
      byType: Object.fromEntries(byType.map(t => [t._id, t.count])),
      byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
      recentUploads
    };
  }
}

export default DocumentService;
