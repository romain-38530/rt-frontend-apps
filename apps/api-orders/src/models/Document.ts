/**
 * Modèle Document - Gestion des documents de transport SYMPHONI.A
 * CMR, BL, POD, Factures, Certificats, etc.
 */
import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export type DocumentType =
  | 'cmr'           // Lettre de voiture internationale
  | 'bl'            // Bon de livraison
  | 'pod'           // Proof of Delivery
  | 'invoice'       // Facture transporteur
  | 'packing_list'  // Liste de colisage
  | 'certificate'   // Certificat (phyto, origine, etc.)
  | 'customs'       // Documents douaniers
  | 'photo'         // Photo de marchandise
  | 'damage_report' // Rapport de dommages
  | 'other';        // Autre

export type DocumentStatus =
  | 'pending'       // En attente de validation
  | 'validated'     // Validé par le destinataire/industriel
  | 'rejected'      // Rejeté (erreur, illisible, etc.)
  | 'archived';     // Archivé

export interface IDocument extends MongoDocument {
  documentId: string;
  orderId: string;
  orderReference: string;
  type: DocumentType;
  status: DocumentStatus;

  // Fichier
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  s3Key?: string;
  s3Bucket?: string;
  url?: string;

  // Métadonnées
  uploadedBy: {
    id: string;
    name: string;
    role: 'carrier' | 'supplier' | 'recipient' | 'industrial' | 'system';
  };
  uploadedAt: Date;

  // Validation
  validatedBy?: {
    id: string;
    name: string;
    role: string;
  };
  validatedAt?: Date;
  rejectionReason?: string;

  // Signature électronique (pour POD/BL)
  signature?: {
    signedBy: string;
    signedAt: Date;
    signatureData: string;  // Base64 de la signature
    ipAddress?: string;
    deviceInfo?: string;
  };

  // Géolocalisation de l'upload
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  // Notes et commentaires
  notes?: string;

  // Dates
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  documentId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  orderReference: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['cmr', 'bl', 'pod', 'invoice', 'packing_list', 'certificate', 'customs', 'photo', 'damage_report', 'other']
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'validated', 'rejected', 'archived']
  },

  // Fichier
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  s3Key: String,
  s3Bucket: String,
  url: String,

  // Métadonnées
  uploadedBy: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['carrier', 'supplier', 'recipient', 'industrial', 'system'] }
  },
  uploadedAt: { type: Date, default: Date.now },

  // Validation
  validatedBy: {
    id: String,
    name: String,
    role: String
  },
  validatedAt: Date,
  rejectionReason: String,

  // Signature électronique
  signature: {
    signedBy: String,
    signedAt: Date,
    signatureData: String,
    ipAddress: String,
    deviceInfo: String
  },

  // Géolocalisation
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },

  notes: String
}, {
  timestamps: true
});

// Index composé pour recherche rapide
DocumentSchema.index({ orderId: 1, type: 1 });
DocumentSchema.index({ orderId: 1, status: 1 });
DocumentSchema.index({ 'uploadedBy.id': 1, uploadedAt: -1 });

export default mongoose.model<IDocument>('Document', DocumentSchema);
