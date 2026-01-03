import { Router, Request, Response } from 'express';
import Ticket from '../models/Ticket';
import {
  createTicketFromConversation,
  assignTicket,
  updateTicketStatus,
  addTicketComment,
  getTicketsByCriteria,
  getSLAStatus,
} from '../services/ticketing-service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /tickets - Créer un nouveau ticket
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      conversationId,
      userId,
      subject,
      description,
      priority,
      category,
      tags,
      attachments,
    } = req.body;

    if (!conversationId || !userId || !subject || !description || !category) {
      return res.status(400).json({
        error: 'Missing required fields: conversationId, userId, subject, description, category',
      });
    }

    const ticket = await createTicketFromConversation({
      conversationId,
      userId,
      subject,
      description,
      priority,
      category,
      tags,
      attachments,
    });

    res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      error: 'Failed to create ticket',
      message: error.message,
    });
  }
});

// GET /tickets - Liste des tickets avec filtres
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      status,
      priority,
      assignedTo,
      category,
      limit = 50,
      offset = 0,
    } = req.query;

    const result = await getTicketsByCriteria({
      userId: userId as string,
      status: status as string,
      priority: priority as string,
      assignedTo: assignedTo as string,
      category: category as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      tickets: result.tickets,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      error: 'Failed to fetch tickets',
      message: error.message,
    });
  }
});

// GET /tickets/:id - Détail d'un ticket
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate('conversationId')
      .populate('relatedTickets');

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
      });
    }

    // Récupérer le statut SLA
    const slaStatus = await getSLAStatus(id);

    res.json({
      success: true,
      ticket,
      slaStatus,
    });
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      error: 'Failed to fetch ticket',
      message: error.message,
    });
  }
});

// PUT /tickets/:id - Mettre à jour un ticket
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
      });
    }

    // Appliquer les mises à jour
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt') {
        (ticket as any)[key] = updates[key];
      }
    });

    await ticket.save();

    res.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      error: 'Failed to update ticket',
      message: error.message,
    });
  }
});

// POST /tickets/:id/assign - Assigner un ticket à un technicien
router.post('/:id/assign', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        error: 'technicianId is required',
      });
    }

    const ticket = await assignTicket(id, technicianId);

    res.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      error: 'Failed to assign ticket',
      message: error.message,
    });
  }
});

// POST /tickets/:id/resolve - Résoudre un ticket
router.post('/:id/resolve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution, resolvedBy } = req.body;

    if (!resolvedBy) {
      return res.status(400).json({
        error: 'resolvedBy is required',
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
      });
    }

    ticket.status = 'resolved';
    ticket.resolution = {
      description: resolution || 'Ticket resolved',
      resolvedBy,
      resolvedAt: new Date(),
    };

    await ticket.save();

    res.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error resolving ticket:', error);
    res.status(500).json({
      error: 'Failed to resolve ticket',
      message: error.message,
    });
  }
});

// POST /tickets/:id/comments - Ajouter un commentaire
router.post('/:id/comments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        error: 'userId and content are required',
      });
    }

    const ticket = await addTicketComment(id, userId, content);

    res.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message,
    });
  }
});

// GET /tickets/:id/sla - Récupérer le statut SLA
router.get('/:id/sla', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const slaStatus = await getSLAStatus(id);

    res.json({
      success: true,
      slaStatus,
    });
  } catch (error: any) {
    console.error('Error fetching SLA status:', error);
    res.status(500).json({
      error: 'Failed to fetch SLA status',
      message: error.message,
    });
  }
});

export default router;
