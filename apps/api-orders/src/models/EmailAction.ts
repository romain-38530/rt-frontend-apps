/**
 * EmailAction - Tokens d'action pour les boutons email
 * Permet de tracker et executer des actions via liens email
 */
import mongoose, { Document, Schema } from 'mongoose';

export type EmailActionType =
  | 'update_position'      // Transporteur met a jour sa position
  | 'confirm_delivery'     // Confirmer livraison
  | 'report_issue'         // Signaler un incident
  | 'accept_offer'         // Accepter une offre de transport
  | 'refuse_offer'         // Refuser une offre
  | 'view_tracking'        // Voir le suivi
  | 'upload_document'      // Deposer un document
  | 'approve_document'     // Approuver un document
  | 'reject_document';     // Rejeter un document

export interface IEmailAction extends Document {
  actionId: string;
  token: string;           // Token unique pour le lien
  orderId: string;
  orderReference: string;
  actionType: EmailActionType;
  targetEmail: string;     // Email du destinataire
  targetRole: 'carrier' | 'industrial' | 'supplier' | 'recipient' | 'logistician';
  targetName: string;
  metadata?: Record<string, any>;  // Donnees supplementaires (carrierId, documentId, etc)
  status: 'pending' | 'executed' | 'expired' | 'cancelled';
  expiresAt: Date;
  executedAt?: Date;
  executedData?: Record<string, any>;  // Donnees de l'execution
  createdAt: Date;
}

const EmailActionSchema = new Schema<IEmailAction>({
  actionId: { type: String, required: true, unique: true },
  token: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  orderReference: { type: String, required: true },
  actionType: {
    type: String,
    required: true,
    enum: ['update_position', 'confirm_delivery', 'report_issue', 'accept_offer',
           'refuse_offer', 'view_tracking', 'upload_document', 'approve_document', 'reject_document']
  },
  targetEmail: { type: String, required: true, index: true },
  targetRole: {
    type: String,
    required: true,
    enum: ['carrier', 'industrial', 'supplier', 'recipient', 'logistician']
  },
  targetName: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'executed', 'expired', 'cancelled']
  },
  expiresAt: { type: Date, required: true, index: true },
  executedAt: { type: Date },
  executedData: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

// Index pour nettoyage des tokens expires
EmailActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IEmailAction>('EmailAction', EmailActionSchema);
