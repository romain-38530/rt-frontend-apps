import express, { Response } from 'express';
import { RecipientChat } from '../models/RecipientChat';
import { authenticate, AuthRequest, requireActiveRecipient } from '../middleware/auth';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);
router.use(requireActiveRecipient);

// GET /chats - Liste des conversations
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status = 'active',
      type,
      deliveryId,
      incidentId,
      page = '1',
      limit = '20',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const recipientId = req.user!.recipientId;

    // Construire le filtre
    const filter: any = {
      recipientId
    };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (deliveryId) filter.deliveryId = deliveryId;
    if (incidentId) filter.incidentId = incidentId;

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Tri
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Exécuter la requête
    const [chats, total] = await Promise.all([
      RecipientChat.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-messages') // Exclure les messages de la liste
        .lean(),
      RecipientChat.countDocuments(filter)
    ]);

    // Ajouter le nombre de messages non lus pour l'utilisateur
    const chatsWithUnread = chats.map((chat: any) => ({
      ...chat,
      unreadCount: chat.unreadCount?.get(req.user!.id) || 0
    }));

    res.json({
      chats: chatsWithUnread,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Error fetching chats', details: error.message });
  }
});

// POST /chats - Créer une nouvelle conversation
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      participants,
      deliveryId,
      incidentId,
      orderId,
      type = 'direct',
      title,
      description,
      initialMessage
    } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      res.status(400).json({ error: 'Participants are required' });
      return;
    }

    const recipientId = req.user!.recipientId;

    // Générer un chatId
    const chatId = await (RecipientChat as any).generateChatId();

    // Créer la conversation
    const chat = new RecipientChat({
      chatId,
      recipientId,
      participants: participants.map((p: any) => ({
        participantId: p.participantId,
        type: p.type,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        role: p.role,
        isActive: true,
        joinedAt: new Date()
      })),
      deliveryId,
      incidentId,
      orderId,
      type,
      title,
      description,
      messages: [],
      status: 'active',
      unreadCount: new Map(),
      settings: {
        notifications: true
      },
      metadata: {
        createdBy: req.user!.id,
        source: 'web'
      }
    });

    // Ajouter un message initial si fourni
    if (initialMessage) {
      chat.addMessage(
        req.user!.id,
        'recipient',
        req.user!.email,
        initialMessage
      );
    }

    await chat.save();

    res.status(201).json({
      message: 'Chat created successfully',
      chat: {
        chatId: chat.chatId,
        type: chat.type,
        participants: chat.participants,
        deliveryId: chat.deliveryId,
        incidentId: chat.incidentId,
        createdAt: chat.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Error creating chat', details: error.message });
  }
});

// GET /chats/:id - Détail d'une conversation avec messages
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    const recipientId = req.user!.recipientId;

    const chat = await RecipientChat.findOne({
      chatId: id,
      recipientId
    });

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    // Pagination des messages
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const messages = chat.messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offsetNum, offsetNum + limitNum);

    res.json({
      chatId: chat.chatId,
      recipientId: chat.recipientId,
      participants: chat.participants,
      deliveryId: chat.deliveryId,
      incidentId: chat.incidentId,
      type: chat.type,
      title: chat.title,
      status: chat.status,
      messages,
      totalMessages: chat.messages.length,
      unreadCount: chat.unreadCount.get(req.user!.id) || 0,
      settings: chat.settings,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    });
  } catch (error: any) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Error fetching chat', details: error.message });
  }
});

// POST /chats/:id/messages - Envoyer un message
router.post('/:id/messages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, attachments, replyTo } = req.body;
    const recipientId = req.user!.recipientId;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const chat = await RecipientChat.findOne({
      chatId: id,
      recipientId
    });

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    if (chat.status !== 'active') {
      res.status(400).json({
        error: 'Cannot send message to inactive chat',
        status: chat.status
      });
      return;
    }

    // Ajouter le message
    const message = chat.addMessage(
      req.user!.id,
      'recipient',
      req.user!.email,
      content,
      attachments,
      replyTo
    );

    await chat.save();

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message', details: error.message });
  }
});

// PUT /chats/:id/read - Marquer les messages comme lus
router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const chat = await RecipientChat.findOne({
      chatId: id,
      recipientId
    });

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    // Marquer tous les messages comme lus
    chat.markAsRead(req.user!.id);

    await chat.save();

    res.json({
      message: 'Messages marked as read',
      chatId: chat.chatId,
      unreadCount: 0
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Error marking messages as read', details: error.message });
  }
});

// PUT /chats/:id/archive - Archiver une conversation
router.put('/:id/archive', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipientId = req.user!.recipientId;

    const chat = await RecipientChat.findOne({
      chatId: id,
      recipientId
    });

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    chat.archive(req.user!.id);

    await chat.save();

    res.json({
      message: 'Chat archived successfully',
      chatId: chat.chatId,
      status: chat.status
    });
  } catch (error: any) {
    console.error('Error archiving chat:', error);
    res.status(500).json({ error: 'Error archiving chat', details: error.message });
  }
});

// PUT /chats/:id/close - Fermer une conversation
router.put('/:id/close', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const recipientId = req.user!.recipientId;

    const chat = await RecipientChat.findOne({
      chatId: id,
      recipientId
    });

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    chat.close(req.user!.id, reason);

    await chat.save();

    res.json({
      message: 'Chat closed successfully',
      chatId: chat.chatId,
      status: chat.status
    });
  } catch (error: any) {
    console.error('Error closing chat:', error);
    res.status(500).json({ error: 'Error closing chat', details: error.message });
  }
});

// POST /chats/:id/participants - Ajouter un participant
router.post('/:id/participants', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { participantId, type, name, email } = req.body;
    const recipientId = req.user!.recipientId;

    if (!participantId || !type || !name) {
      res.status(400).json({ error: 'Missing required fields: participantId, type, name' });
      return;
    }

    const chat = await RecipientChat.findOne({
      chatId: id,
      recipientId
    });

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    chat.addParticipant(participantId, type, name, email);

    await chat.save();

    res.json({
      message: 'Participant added successfully',
      chatId: chat.chatId,
      participants: chat.participants
    });
  } catch (error: any) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Error adding participant', details: error.message });
  }
});

// DELETE /chats/:id/participants/:participantId - Retirer un participant
router.delete('/:id/participants/:participantId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, participantId } = req.params;
    const recipientId = req.user!.recipientId;

    const chat = await RecipientChat.findOne({
      chatId: id,
      recipientId
    });

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    chat.removeParticipant(participantId);

    await chat.save();

    res.json({
      message: 'Participant removed successfully',
      chatId: chat.chatId,
      participants: chat.participants
    });
  } catch (error: any) {
    console.error('Error removing participant:', error);
    res.status(500).json({ error: 'Error removing participant', details: error.message });
  }
});

// GET /chats/unread/count - Nombre total de messages non lus
router.get('/unread/count', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recipientId = req.user!.recipientId;

    const chats = await RecipientChat.find({
      recipientId,
      status: 'active'
    }).select('unreadCount');

    let totalUnread = 0;
    chats.forEach((chat: any) => {
      const unread = chat.unreadCount.get(req.user!.id) || 0;
      totalUnread += unread;
    });

    res.json({
      totalUnread,
      chatsWithUnread: chats.filter((chat: any) =>
        (chat.unreadCount.get(req.user!.id) || 0) > 0
      ).length
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Error fetching unread count', details: error.message });
  }
});

export default router;
