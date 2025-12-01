import axios from 'axios';
import Ticket from '../models/Ticket';
import Conversation from '../models/Conversation';

interface CreateTicketParams {
  conversationId: string;
  userId: string;
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags?: string[];
  attachments?: Array<{
    type: string;
    url: string;
    filename: string;
  }>;
}

export async function createTicketFromConversation(params: CreateTicketParams) {
  try {
    // Vérifier que la conversation existe
    const conversation = await Conversation.findById(params.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Créer le ticket
    const ticket = new Ticket({
      conversationId: params.conversationId,
      userId: params.userId,
      subject: params.subject,
      description: params.description,
      priority: params.priority || detectPriorityFromDescription(params.description),
      category: params.category,
      tags: params.tags || [],
      attachments: params.attachments || [],
      status: 'open',
      comments: [],
      relatedTickets: [],
    });

    await ticket.save();

    // Mettre à jour la conversation
    conversation.status = 'escalated';
    await conversation.save();

    // Notifier via notifications-api
    await sendTicketNotification(ticket, 'created');

    // Auto-assigner si possible
    const assignedTechnician = await autoAssignTicket(ticket);
    if (assignedTechnician) {
      ticket.assignedTo = assignedTechnician;
      ticket.status = 'assigned';
      await ticket.save();
      await sendTicketNotification(ticket, 'assigned');
    }

    return ticket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

export async function assignTicket(ticketId: string, technicianId: string) {
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.assignedTo = technicianId;
    ticket.status = 'assigned';

    // Marquer comme répondu si c'était le premier contact
    if (!ticket.sla.responded) {
      ticket.sla.responded = true;
      ticket.sla.respondedAt = new Date();
    }

    await ticket.save();

    // Notifier
    await sendTicketNotification(ticket, 'assigned');

    return ticket;
  } catch (error) {
    console.error('Error assigning ticket:', error);
    throw error;
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled',
  resolvedBy?: string
) {
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    if (status === 'resolved' && resolvedBy) {
      ticket.resolution = {
        description: 'Ticket resolved',
        resolvedBy,
        resolvedAt: new Date(),
      };
    }

    await ticket.save();

    // Notifier si changement significatif
    if (oldStatus !== status && ['resolved', 'closed', 'cancelled'].includes(status)) {
      await sendTicketNotification(ticket, 'status_changed');
    }

    return ticket;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
}

export async function addTicketComment(ticketId: string, userId: string, content: string) {
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.comments.push({
      userId,
      content,
      timestamp: new Date(),
    });

    // Marquer comme répondu si c'était un technicien
    if (!ticket.sla.responded && userId !== ticket.userId) {
      ticket.sla.responded = true;
      ticket.sla.respondedAt = new Date();
    }

    await ticket.save();

    // Notifier
    await sendTicketNotification(ticket, 'comment_added');

    return ticket;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export async function getTicketsByCriteria(criteria: {
  userId?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const query: any = {};

    if (criteria.userId) query.userId = criteria.userId;
    if (criteria.status) query.status = criteria.status;
    if (criteria.priority) query.priority = criteria.priority;
    if (criteria.assignedTo) query.assignedTo = criteria.assignedTo;
    if (criteria.category) query.category = criteria.category;

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .limit(criteria.limit || 50)
      .skip(criteria.offset || 0);

    const total = await Ticket.countDocuments(query);

    return {
      tickets,
      total,
      limit: criteria.limit || 50,
      offset: criteria.offset || 0,
    };
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}

export async function getSLAStatus(ticketId: string) {
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const now = new Date();
    const responseOverdue = !ticket.sla.responded && now > ticket.sla.responseBy;
    const resolveOverdue = ticket.status !== 'resolved' && now > ticket.sla.resolveBy;

    const responseTimeRemaining = ticket.sla.responded
      ? 0
      : Math.max(0, ticket.sla.responseBy.getTime() - now.getTime());

    const resolveTimeRemaining = ticket.status === 'resolved'
      ? 0
      : Math.max(0, ticket.sla.resolveBy.getTime() - now.getTime());

    return {
      ticketId,
      priority: ticket.priority,
      sla: {
        responseBy: ticket.sla.responseBy,
        resolveBy: ticket.sla.resolveBy,
        responded: ticket.sla.responded,
        respondedAt: ticket.sla.respondedAt,
      },
      status: {
        responseOverdue,
        resolveOverdue,
        responseTimeRemaining: Math.floor(responseTimeRemaining / 1000 / 60), // minutes
        resolveTimeRemaining: Math.floor(resolveTimeRemaining / 1000 / 60 / 60), // hours
      },
    };
  } catch (error) {
    console.error('Error getting SLA status:', error);
    throw error;
  }
}

// Helpers
function detectPriorityFromDescription(description: string): 'low' | 'medium' | 'high' | 'urgent' {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('urgent') || lowerDesc.includes('critique') || lowerDesc.includes('production')) {
    return 'urgent';
  }
  if (lowerDesc.includes('important') || lowerDesc.includes('bloqué') || lowerDesc.includes('ne fonctionne pas')) {
    return 'high';
  }
  if (lowerDesc.includes('problème') || lowerDesc.includes('erreur')) {
    return 'medium';
  }

  return 'low';
}

async function autoAssignTicket(ticket: any): Promise<string | null> {
  // Logique d'auto-assignation basée sur:
  // - Catégorie du ticket
  // - Charge de travail des techniciens
  // - Disponibilité
  // - Expertise

  // Pour l'instant, retourner null (assignation manuelle)
  // TODO: Implémenter logique d'auto-assignation intelligente
  return null;
}

async function sendTicketNotification(ticket: any, event: string) {
  try {
    const notificationsApiUrl = process.env.NOTIFICATIONS_API_URL;
    if (!notificationsApiUrl) {
      console.warn('NOTIFICATIONS_API_URL not configured');
      return;
    }

    await axios.post(`${notificationsApiUrl}/api/v1/notifications`, {
      userId: ticket.userId,
      type: 'ticket',
      title: getNotificationTitle(event, ticket),
      message: getNotificationMessage(event, ticket),
      priority: ticket.priority,
      data: {
        ticketId: ticket._id,
        event,
      },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    // Ne pas rejeter - la notification est secondaire
  }
}

function getNotificationTitle(event: string, ticket: any): string {
  switch (event) {
    case 'created':
      return 'Nouveau ticket créé';
    case 'assigned':
      return 'Ticket assigné';
    case 'status_changed':
      return 'Statut du ticket mis à jour';
    case 'comment_added':
      return 'Nouveau commentaire sur votre ticket';
    default:
      return 'Mise à jour du ticket';
  }
}

function getNotificationMessage(event: string, ticket: any): string {
  switch (event) {
    case 'created':
      return `Votre ticket "${ticket.subject}" a été créé avec succès.`;
    case 'assigned':
      return `Votre ticket "${ticket.subject}" a été assigné à un technicien.`;
    case 'status_changed':
      return `Le statut de votre ticket "${ticket.subject}" est maintenant: ${ticket.status}`;
    case 'comment_added':
      return `Un nouveau commentaire a été ajouté à votre ticket "${ticket.subject}".`;
    default:
      return `Votre ticket "${ticket.subject}" a été mis à jour.`;
  }
}
