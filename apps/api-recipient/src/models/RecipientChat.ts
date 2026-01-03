import mongoose, { Document, Schema } from 'mongoose';

export interface IChatParticipant {
  participantId: string;
  type: 'recipient' | 'transporter' | 'industrial' | 'supplier' | 'driver' | 'admin';
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  isActive: boolean;
  joinedAt: Date;
  leftAt?: Date;
}

export interface IChatAttachment {
  attachmentId: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'location';
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  metadata?: any;
}

export interface IChatMessage {
  messageId: string;
  senderId: string;
  senderType: 'recipient' | 'transporter' | 'industrial' | 'supplier' | 'driver' | 'admin' | 'system';
  senderName: string;
  content: string;
  attachments?: IChatAttachment[];
  timestamp: Date;
  read: boolean;
  readBy?: Array<{
    userId: string;
    readAt: Date;
  }>;
  delivered: boolean;
  deliveredAt?: Date;
  edited: boolean;
  editedAt?: Date;
  deleted: boolean;
  deletedAt?: Date;
  replyTo?: string;
  metadata?: {
    type?: 'text' | 'system' | 'notification' | 'automated';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    action?: string;
  };
}

export interface IRecipientChat extends Document {
  chatId: string;
  recipientId: string;
  participants: IChatParticipant[];
  deliveryId?: string;
  incidentId?: string;
  orderId?: string;
  type: 'direct' | 'group' | 'support' | 'incident' | 'delivery';
  title?: string;
  description?: string;
  messages: IChatMessage[];
  status: 'active' | 'archived' | 'closed' | 'deleted';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: Map<string, number>;
  settings: {
    notifications: boolean;
    muteUntil?: Date;
    allowedParticipants?: string[];
    autoClose?: boolean;
    autoCloseAfterHours?: number;
  };
  metadata: {
    createdBy: string;
    source?: 'web' | 'mobile' | 'api' | 'system';
    context?: any;
  };
  closedAt?: Date;
  closedBy?: string;
  closedReason?: string;
  archivedAt?: Date;
  archivedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addMessage(
    senderId: string,
    senderType: IChatMessage['senderType'],
    senderName: string,
    content: string,
    attachments?: IChatAttachment[],
    replyTo?: string
  ): IChatMessage;
  markAsRead(userId: string): void;
  addParticipant(
    participantId: string,
    type: IChatParticipant['type'],
    name: string,
    email?: string
  ): void;
  removeParticipant(participantId: string): void;
  archive(userId: string): void;
  close(userId: string, reason?: string): void;
}

const ChatAttachmentSchema = new Schema<IChatAttachment>({
  attachmentId: { type: String, required: true },
  type: {
    type: String,
    enum: ['image', 'document', 'video', 'audio', 'location'],
    required: true
  },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  thumbnail: String,
  metadata: Schema.Types.Mixed
});

const ChatMessageSchema = new Schema<IChatMessage>({
  messageId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderType: {
    type: String,
    enum: ['recipient', 'transporter', 'industrial', 'supplier', 'driver', 'admin', 'system'],
    required: true
  },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  attachments: [ChatAttachmentSchema],
  timestamp: { type: Date, required: true, default: Date.now },
  read: { type: Boolean, default: false },
  readBy: [{
    userId: { type: String, required: true },
    readAt: { type: Date, required: true }
  }],
  delivered: { type: Boolean, default: false },
  deliveredAt: Date,
  edited: { type: Boolean, default: false },
  editedAt: Date,
  deleted: { type: Boolean, default: false },
  deletedAt: Date,
  replyTo: String,
  metadata: {
    type: {
      type: String,
      enum: ['text', 'system', 'notification', 'automated']
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent']
    },
    action: String
  }
});

const ChatParticipantSchema = new Schema<IChatParticipant>({
  participantId: { type: String, required: true },
  type: {
    type: String,
    enum: ['recipient', 'transporter', 'industrial', 'supplier', 'driver', 'admin'],
    required: true
  },
  name: { type: String, required: true },
  email: String,
  avatar: String,
  role: String,
  isActive: { type: Boolean, default: true },
  joinedAt: { type: Date, required: true, default: Date.now },
  leftAt: Date
});

const RecipientChatSchema = new Schema<IRecipientChat>(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    recipientId: {
      type: String,
      required: true,
      index: true
    },
    participants: [ChatParticipantSchema],
    deliveryId: {
      type: String,
      index: true
    },
    incidentId: {
      type: String,
      index: true
    },
    orderId: {
      type: String,
      index: true
    },
    type: {
      type: String,
      enum: ['direct', 'group', 'support', 'incident', 'delivery'],
      required: true,
      index: true
    },
    title: String,
    description: String,
    messages: [ChatMessageSchema],
    status: {
      type: String,
      enum: ['active', 'archived', 'closed', 'deleted'],
      default: 'active',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    tags: [String],
    lastMessage: {
      content: String,
      senderId: String,
      senderName: String,
      timestamp: Date
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    },
    settings: {
      notifications: { type: Boolean, default: true },
      muteUntil: Date,
      allowedParticipants: [String],
      autoClose: { type: Boolean, default: false },
      autoCloseAfterHours: { type: Number, default: 24 }
    },
    metadata: {
      createdBy: { type: String, required: true },
      source: {
        type: String,
        enum: ['web', 'mobile', 'api', 'system']
      },
      context: Schema.Types.Mixed
    },
    closedAt: Date,
    closedBy: String,
    closedReason: String,
    archivedAt: Date,
    archivedBy: String
  },
  {
    timestamps: true
  }
);

// Indexes composites pour les recherches fréquentes
RecipientChatSchema.index({ recipientId: 1, status: 1, updatedAt: -1 });
RecipientChatSchema.index({ 'participants.participantId': 1, status: 1 });
RecipientChatSchema.index({ deliveryId: 1, type: 1 });
RecipientChatSchema.index({ incidentId: 1, type: 1 });

// Méthode pour générer un chatId unique
RecipientChatSchema.statics.generateChatId = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ chatId: new RegExp(`^CHAT-${year}-`) });
  return `CHAT-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Méthode pour ajouter un message
RecipientChatSchema.methods.addMessage = function(
  senderId: string,
  senderType: IChatMessage['senderType'],
  senderName: string,
  content: string,
  attachments?: IChatAttachment[],
  replyTo?: string
): IChatMessage {
  const message: IChatMessage = {
    messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    senderId,
    senderType,
    senderName,
    content,
    attachments,
    timestamp: new Date(),
    read: false,
    delivered: false,
    edited: false,
    deleted: false,
    replyTo
  } as IChatMessage;

  this.messages.push(message);

  // Mettre à jour le dernier message
  this.lastMessage = {
    content,
    senderId,
    senderName,
    timestamp: new Date()
  };

  // Incrémenter le compteur de messages non lus pour tous les participants sauf l'expéditeur
  this.participants.forEach((participant: IChatParticipant) => {
    if (participant.participantId !== senderId && participant.isActive) {
      const currentCount = this.unreadCount.get(participant.participantId) || 0;
      this.unreadCount.set(participant.participantId, currentCount + 1);
    }
  });

  return message;
};

// Méthode pour marquer les messages comme lus
RecipientChatSchema.methods.markAsRead = function(userId: string): void {
  const now = new Date();

  this.messages.forEach((message: IChatMessage) => {
    if (message.senderId !== userId && !message.read) {
      message.read = true;
      if (!message.readBy) {
        message.readBy = [];
      }
      message.readBy.push({
        userId,
        readAt: now
      });
    }
  });

  // Réinitialiser le compteur de messages non lus pour cet utilisateur
  this.unreadCount.set(userId, 0);
};

// Méthode pour ajouter un participant
RecipientChatSchema.methods.addParticipant = function(
  participantId: string,
  type: IChatParticipant['type'],
  name: string,
  email?: string
): void {
  const existingParticipant = this.participants.find(
    (p: IChatParticipant) => p.participantId === participantId
  );

  if (!existingParticipant) {
    this.participants.push({
      participantId,
      type,
      name,
      email,
      isActive: true,
      joinedAt: new Date()
    } as IChatParticipant);

    // Initialiser le compteur de messages non lus pour ce participant
    this.unreadCount.set(participantId, this.messages.length);

    // Ajouter un message système
    this.addMessage(
      'system',
      'system',
      'System',
      `${name} a rejoint la conversation`
    );
  }
};

// Méthode pour retirer un participant
RecipientChatSchema.methods.removeParticipant = function(participantId: string): void {
  const participant = this.participants.find(
    (p: IChatParticipant) => p.participantId === participantId
  );

  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();

    // Ajouter un message système
    this.addMessage(
      'system',
      'system',
      'System',
      `${participant.name} a quitté la conversation`
    );
  }
};

// Méthode pour archiver la conversation
RecipientChatSchema.methods.archive = function(userId: string): void {
  this.status = 'archived';
  this.archivedAt = new Date();
  this.archivedBy = userId;
};

// Méthode pour fermer la conversation
RecipientChatSchema.methods.close = function(userId: string, reason?: string): void {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = userId;
  this.closedReason = reason;

  // Ajouter un message système
  this.addMessage(
    'system',
    'system',
    'System',
    `Conversation fermée${reason ? ': ' + reason : ''}`
  );
};

export const RecipientChat = mongoose.model<IRecipientChat>('RecipientChat', RecipientChatSchema);
