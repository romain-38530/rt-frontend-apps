import { Router, Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

const router = Router();

// POST /conversations - Créer une nouvelle conversation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, botType, context } = req.body;

    if (!userId || !botType) {
      return res.status(400).json({
        error: 'Missing required fields: userId, botType',
      });
    }

    const conversation = new Conversation({
      userId,
      botType,
      status: 'active',
      priority: 'medium',
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        context,
      },
      transferredToTechnician: false,
      interactionCount: 0,
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      error: 'Failed to create conversation',
      message: error.message,
    });
  }
});

// GET /conversations - Liste des conversations de l'utilisateur
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, status, botType, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: userId',
      });
    }

    const query: any = { userId };

    if (status) {
      query.status = status;
    }

    if (botType) {
      query.botType = botType;
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('messages');

    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      conversations,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      error: 'Failed to fetch conversations',
      message: error.message,
    });
  }
});

// GET /conversations/:id - Détail d'une conversation
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id).populate('messages');

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    // Récupérer tous les messages
    const messages = await Message.find({
      conversationId: id,
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation',
      message: error.message,
    });
  }
});

// POST /conversations/:id/close - Fermer une conversation
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    conversation.status = 'closed';
    conversation.resolvedAt = new Date();
    await conversation.save();

    res.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error('Error closing conversation:', error);
    res.status(500).json({
      error: 'Failed to close conversation',
      message: error.message,
    });
  }
});

// POST /conversations/:id/feedback - Ajouter un feedback
router.post('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5',
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    conversation.rating = rating;
    conversation.feedback = feedback;
    await conversation.save();

    res.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      error: 'Failed to add feedback',
      message: error.message,
    });
  }
});

// POST /conversations/:id/escalate - Escalader vers technicien
router.post('/:id/escalate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, priority } = req.body;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    conversation.status = 'escalated';
    conversation.transferredToTechnician = true;
    if (priority) {
      conversation.priority = priority;
    }

    await conversation.save();

    // Créer un message système pour indiquer l'escalade
    const systemMessage = new Message({
      conversationId: id,
      role: 'system',
      content: `Conversation escaladée vers un technicien. Raison: ${reason || 'Non spécifiée'}`,
      metadata: {
        shouldTransfer: true,
      },
      timestamp: new Date(),
    });

    await systemMessage.save();

    res.json({
      success: true,
      conversation,
      message: 'Conversation escalated to technician',
    });
  } catch (error: any) {
    console.error('Error escalating conversation:', error);
    res.status(500).json({
      error: 'Failed to escalate conversation',
      message: error.message,
    });
  }
});

export default router;
