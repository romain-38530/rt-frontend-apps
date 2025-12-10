"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Service de gestion des documents - SYMPHONI.A
 * Upload, validation, signature et archivage des CMR/BL/POD
 */
const uuid_1 = require("uuid");
const nodemailer_1 = __importDefault(require("nodemailer"));
const Document_1 = __importDefault(require("../models/Document"));
const Order_1 = __importDefault(require("../models/Order"));
const event_service_1 = __importDefault(require("./event-service"));
// Configuration email
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'ssl0.ovh.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
class DocumentService {
    /**
     * Upload un nouveau document
     */
    static async uploadDocument(params) {
        try {
            // Vérifier que la commande existe
            const order = await Order_1.default.findOne({ orderId: params.orderId });
            if (!order) {
                return { success: false, error: 'Commande non trouvée' };
            }
            const documentId = `doc_${(0, uuid_1.v4)()}`;
            // Créer le document
            const document = new Document_1.default({
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
            await event_service_1.default.createEvent({
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
        }
        catch (error) {
            console.error('[DocumentService] Upload error:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Valide un document
     */
    static async validateDocument(documentId, validatedBy) {
        try {
            const document = await Document_1.default.findOne({ documentId });
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
            await event_service_1.default.createEvent({
                orderId: document.orderId,
                orderReference: document.orderReference,
                eventType: 'document_validated',
                source: validatedBy.role,
                data: {
                    documentId,
                    documentType: document.type,
                    validatedBy: validatedBy.name
                }
            });
            return { success: true, document };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Rejette un document
     */
    static async rejectDocument(documentId, rejectedBy, reason) {
        try {
            const document = await Document_1.default.findOne({ documentId });
            if (!document) {
                return { success: false, error: 'Document non trouvé' };
            }
            document.status = 'rejected';
            document.validatedBy = rejectedBy;
            document.validatedAt = new Date();
            document.rejectionReason = reason;
            await document.save();
            // Créer un événement
            await event_service_1.default.createEvent({
                orderId: document.orderId,
                orderReference: document.orderReference,
                eventType: 'document_rejected',
                source: rejectedBy.role,
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Signe un document (POD/BL) - Signature électronique
     */
    static async signDocument(documentId, signParams) {
        try {
            const document = await Document_1.default.findOne({ documentId });
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
            await event_service_1.default.createEvent({
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Récupère les documents d'une commande
     */
    static async getOrderDocuments(orderId) {
        return await Document_1.default.find({ orderId }).sort({ uploadedAt: -1 });
    }
    /**
     * Récupère un document par son ID
     */
    static async getDocument(documentId) {
        return await Document_1.default.findOne({ documentId });
    }
    /**
     * Vérifie si tous les documents requis sont présents et validés
     */
    static async checkRequiredDocuments(orderId) {
        const requiredTypes = ['cmr', 'pod'];
        const documents = await this.getOrderDocuments(orderId);
        const validated = [];
        const pending = [];
        const missing = [];
        for (const type of requiredTypes) {
            const doc = documents.find(d => d.type === type);
            if (!doc) {
                missing.push(type);
            }
            else if (doc.status === 'validated') {
                validated.push(type);
            }
            else if (doc.status === 'pending') {
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
    static async archiveOrderDocuments(orderId) {
        const result = await Document_1.default.updateMany({ orderId, status: 'validated' }, { $set: { status: 'archived' } });
        return result.modifiedCount;
    }
    /**
     * Notifie les parties de l'upload d'un document
     */
    static async notifyDocumentUploaded(order, document) {
        const documentLabels = {
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
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'SYMPHONI.A <documents@symphonia-controltower.com>',
                    to: order.createdBy?.email || process.env.INDUSTRIAL_EMAIL,
                    subject: `[SYMPHONI.A] ${docLabel} déposé - ${order.reference}`,
                    html
                });
            }
            catch (error) {
                console.error('[DocumentService] Error sending notification:', error);
            }
        }
    }
    /**
     * Notifie le transporteur du rejet d'un document
     */
    static async notifyDocumentRejected(document, reason) {
        const order = await Order_1.default.findOne({ orderId: document.orderId });
        if (!order?.carrierEmail)
            return;
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
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || 'SYMPHONI.A <documents@symphonia-controltower.com>',
                to: order.carrierEmail,
                subject: `[SYMPHONI.A] Document rejeté - ${order.reference}`,
                html
            });
        }
        catch (error) {
            console.error('[DocumentService] Error sending rejection notification:', error);
        }
    }
    /**
     * Statistiques des documents
     */
    static async getDocumentStats(industrialId) {
        const matchStage = {};
        if (industrialId) {
            const orders = await Order_1.default.find({ industrialId }).select('orderId');
            const orderIds = orders.map(o => o.orderId);
            matchStage.orderId = { $in: orderIds };
        }
        const [total, byType, byStatus, recentUploads] = await Promise.all([
            Document_1.default.countDocuments(matchStage),
            Document_1.default.aggregate([
                { $match: matchStage },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            Document_1.default.aggregate([
                { $match: matchStage },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Document_1.default.countDocuments({
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
exports.default = DocumentService;
//# sourceMappingURL=document-service.js.map