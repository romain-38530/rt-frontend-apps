import { Router, Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { generateContextualResponse } from '../services/claude-service';
import { getRecommendedContent } from '../services/knowledge-service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /conversations/:id/messages - Envoyer un message et recevoir réponse IA
router.post('/:id/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, attachments } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Message content is required',
      });
    }

    // Vérifier que la conversation existe
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    // Vérifier que la conversation n'est pas fermée
    if (conversation.status === 'closed') {
      return res.status(400).json({
        error: 'Cannot send messages to a closed conversation',
      });
    }

    // Créer le message utilisateur
    const userMessage = new Message({
      conversationId: id,
      role: 'user',
      content,
      attachments: attachments || [],
      timestamp: new Date(),
    });

    await userMessage.save();

    // Ajouter à la conversation
    conversation.messages.push(userMessage._id as any);
    conversation.interactionCount += 1;
    await conversation.save();

    // Récupérer l'historique de la conversation
    const conversationHistory = await Message.find({
      conversationId: id,
    })
      .sort({ timestamp: 1 })
      .limit(20); // Garder seulement les 20 derniers messages pour le contexte

    // Préparer le contexte
    const context = {
      userId: conversation.userId,
      previousInteractions: conversation.interactionCount,
      relatedData: conversation.metadata.context,
    };

    // Générer réponse avec Claude
    const aiResponse = await generateContextualResponse(
      conversation.botType,
      content,
      conversationHistory.map(m => ({
        role: m.role,
        content: m.content,
      })),
      context
    );

    // Créer le message assistant
    const assistantMessage = new Message({
      conversationId: id,
      role: 'assistant',
      content: aiResponse.content,
      metadata: {
        suggestedActions: aiResponse.suggestedActions,
        shouldTransfer: aiResponse.shouldTransfer,
        detectedIntent: aiResponse.detectedIntent,
        confidence: aiResponse.confidence,
        relatedArticles: aiResponse.relatedArticles,
      },
      timestamp: new Date(),
    });

    await assistantMessage.save();

    // Ajouter à la conversation
    conversation.messages.push(assistantMessage._id as any);

    // Mettre à jour la priorité si détectée
    if (aiResponse.priority && aiResponse.priority !== conversation.priority) {
      conversation.priority = aiResponse.priority;
    }

    // Vérifier si transfert nécessaire
    if (aiResponse.shouldTransfer || conversation.interactionCount >= 3) {
      conversation.transferredToTechnician = true;
      conversation.status = 'escalated';
    }

    await conversation.save();

    // Récupérer contenu recommandé
    const recommended = await getRecommendedContent({
      botType: conversation.botType,
      userMessage: content,
      limit: 3,
    });

    res.json({
      success: true,
      userMessage,
      assistantMessage,
      conversation: {
        id: conversation._id,
        status: conversation.status,
        priority: conversation.priority,
        interactionCount: conversation.interactionCount,
        transferredToTechnician: conversation.transferredToTechnician,
      },
      recommended,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message,
    });
  }
});

// GET /conversations/:id/messages - Récupérer l'historique des messages
router.get('/:id/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Vérifier que la conversation existe
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    // Récupérer les messages
    const messages = await Message.find({
      conversationId: id,
    })
      .sort({ timestamp: 1 })
      .limit(Number(limit))
      .skip(Number(offset));

    const total = await Message.countDocuments({ conversationId: id });

    res.json({
      success: true,
      messages,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      error: 'Failed to fetch messages',
      message: error.message,
    });
  }
});

export default router;
