import { Router, Request, Response } from 'express';
import SupplierChat from '../models/SupplierChat';
import notificationService from '../services/notification-service';
import { authenticateSupplier, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /chats/templates
 * Liste des templates de messages disponibles
 */
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = notificationService.getMessageTemplates();
    res.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /chats
 * Liste des conversations
 */
router.get('/', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      status = 'active',
      orderId,
      page = '1',
      limit = '20'
    } = req.query;

    const query: any = { supplierId };

    if (status) {
      query.status = status;
    }

    if (orderId) {
      query.orderId = orderId;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const chats = await SupplierChat.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await SupplierChat.countDocuments(query);

    res.json({
      chats: chats.map((chat) => ({
        chatId: chat.chatId,
        participants: chat.participants,
        orderId: chat.orderId,
        lastMessage: chat.messages[chat.messages.length - 1],
        unreadCount: chat.messages.filter((m) => !m.read && m.senderId !== supplierId).length,
        lastMessageAt: chat.lastMessageAt,
        status: chat.status
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /chats
 * Créer une nouvelle conversation
 */
router.post('/', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { participants, orderId, initialMessage } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        error: 'participants array is required'
      });
    }

    // Vérifier que le fournisseur est dans les participants
    const hasSupplier = participants.some(
      (p: any) => p.id === supplierId && p.type === 'supplier'
    );

    if (!hasSupplier) {
      // Ajouter automatiquement le fournisseur
      participants.push({
        id: supplierId,
        type: 'supplier',
        name: 'Supplier' // Dans un cas réel, on récupérerait le nom depuis la DB
      });
    }

    const chat = new SupplierChat({
      supplierId,
      participants,
      orderId,
      status: 'active',
      messages: []
    });

    // Ajouter le message initial si fourni
    if (initialMessage) {
      chat.messages.push({
        senderId: supplierId,
        senderType: 'supplier',
        content: initialMessage,
        timestamp: new Date(),
        read: false
      });
    }

    await chat.save();

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      chat: {
        chatId: chat.chatId,
        participants: chat.participants,
        orderId: chat.orderId,
        createdAt: chat.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /chats/:id
 * Détail d'une conversation
 */
router.get('/:id', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const chat = await SupplierChat.findOne({
      chatId: id,
      supplierId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Paginer les messages (les plus récents en premier)
    const messages = chat.messages
      .slice()
      .reverse()
      .slice(offsetNum, offsetNum + limitNum);

    res.json({
      chatId: chat.chatId,
      participants: chat.participants,
      orderId: chat.orderId,
      messages: messages.reverse(),
      totalMessages: chat.messages.length,
      status: chat.status,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt
    });
  } catch (error: any) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /chats/:id/messages
 * Envoyer un message dans une conversation
 */
router.post('/:id/messages', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;
    const { content, attachments } = req.body;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const chat = await SupplierChat.findOne({
      chatId: id,
      supplierId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = {
      senderId: supplierId,
      senderType: 'supplier' as const,
      content,
      attachments: attachments || [],
      timestamp: new Date(),
      read: false
    };

    chat.messages.push(message);
    chat.lastMessageAt = message.timestamp;
    await chat.save();

    // Notifier les autres participants
    const otherParticipants = chat.participants.filter((p) => p.id !== supplierId);
    for (const participant of otherParticipants) {
      if (participant.type === 'supplier') {
        await notificationService.notifyNewMessage(
          participant.id,
          chat.chatId,
          'Supplier', // Dans un cas réel, on récupérerait le nom
          content.substring(0, 100)
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /chats/:id/template
 * Envoyer un message template prédéfini
 */
router.post('/:id/template', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;
    const { templateType, additionalInfo } = req.body;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!templateType) {
      return res.status(400).json({ error: 'templateType is required' });
    }

    const chat = await SupplierChat.findOne({
      chatId: id,
      supplierId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const templates = notificationService.getMessageTemplates();
    const template = (templates as any)[templateType];

    if (!template) {
      return res.status(400).json({
        error: 'Invalid template type',
        availableTemplates: Object.keys(templates)
      });
    }

    let content = `**${template.title}**\n\n${template.message}`;
    if (additionalInfo) {
      content += `\n\n${additionalInfo}`;
    }

    const message = {
      senderId: supplierId,
      senderType: 'supplier' as const,
      content,
      timestamp: new Date(),
      read: false
    };

    chat.messages.push(message);
    chat.lastMessageAt = message.timestamp;
    await chat.save();

    res.status(201).json({
      success: true,
      message: 'Template message sent successfully',
      messageData: message
    });
  } catch (error: any) {
    console.error('Error sending template message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /chats/:id/read
 * Marquer les messages comme lus
 */
router.put('/:id/read', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const chat = await SupplierChat.findOne({
      chatId: id,
      supplierId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Marquer tous les messages non lus (sauf ceux envoyés par le fournisseur) comme lus
    let updatedCount = 0;
    chat.messages.forEach((message) => {
      if (!message.read && message.senderId !== supplierId) {
        message.read = true;
        updatedCount++;
      }
    });

    await chat.save();

    res.json({
      success: true,
      message: `${updatedCount} messages marked as read`
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /chats/:id/archive
 * Archiver une conversation
 */
router.put('/:id/archive', authenticateSupplier, async (req: AuthRequest, res: Response) => {
  try {
    const supplierId = req.supplierId;
    const { id } = req.params;

    if (!supplierId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const chat = await SupplierChat.findOne({
      chatId: id,
      supplierId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.status = 'archived';
    await chat.save();

    res.json({
      success: true,
      message: 'Chat archived successfully'
    });
  } catch (error: any) {
    console.error('Error archiving chat:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
