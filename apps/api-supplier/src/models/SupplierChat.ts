import mongoose, { Document, Schema } from 'mongoose';

export interface IParticipant {
  id: string;
  type: 'supplier' | 'transporter' | 'industrial' | 'logistician';
  name: string;
}

export interface IAttachment {
  filename: string;
  url: string;
  type: string;
  size: number;
}

export interface IMessage {
  senderId: string;
  senderType: 'supplier' | 'transporter' | 'industrial' | 'logistician';
  content: string;
  attachments?: IAttachment[];
  timestamp: Date;
  read: boolean;
}

export interface ISupplierChat extends Document {
  chatId: string;
  supplierId: string;
  participants: IParticipant[];
  orderId?: string;
  messages: IMessage[];
  status: 'active' | 'archived';
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true }
});

const MessageSchema = new Schema<IMessage>({
  senderId: { type: String, required: true },
  senderType: {
    type: String,
    enum: ['supplier', 'transporter', 'industrial', 'logistician'],
    required: true
  },
  content: { type: String, required: true },
  attachments: [AttachmentSchema],
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const ParticipantSchema = new Schema<IParticipant>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['supplier', 'transporter', 'industrial', 'logistician'],
    required: true
  },
  name: { type: String, required: true }
});

const SupplierChatSchema = new Schema<ISupplierChat>(
  {
    chatId: {
      type: String,
      unique: true,
      required: true
    },
    supplierId: {
      type: String,
      required: true,
      index: true
    },
    participants: {
      type: [ParticipantSchema],
      required: true
    },
    orderId: {
      type: String,
      index: true
    },
    messages: {
      type: [MessageSchema],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index composés pour les requêtes fréquentes
SupplierChatSchema.index({ supplierId: 1, status: 1 });
SupplierChatSchema.index({ orderId: 1, status: 1 });
SupplierChatSchema.index({ supplierId: 1, lastMessageAt: -1 });

// Génération automatique du chatId
SupplierChatSchema.pre('save', async function (next) {
  if (this.isNew && !this.chatId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('SupplierChat').countDocuments();
    this.chatId = `CHAT-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }

  // Mise à jour de lastMessageAt lors de l'ajout d'un message
  if (this.isModified('messages') && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }

  next();
});

export default mongoose.model<ISupplierChat>('SupplierChat', SupplierChatSchema);
