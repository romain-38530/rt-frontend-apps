import { Router, Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Ticket from '../models/Ticket';
import Message from '../models/Message';

const router = Router();

// GET /stats/conversations - Statistiques des conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { botType, userId, startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    const query: any = {};
    if (botType) query.botType = botType;
    if (userId) query.userId = userId;
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    // Statistiques globales
    const total = await Conversation.countDocuments(query);
    const active = await Conversation.countDocuments({ ...query, status: 'active' });
    const resolved = await Conversation.countDocuments({ ...query, status: 'resolved' });
    const escalated = await Conversation.countDocuments({ ...query, status: 'escalated' });

    // Statistiques par priorité
    const byPriority = await Conversation.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Statistiques par bot type
    const byBotType = await Conversation.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$botType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Moyenne d'interactions
    const avgInteractions = await Conversation.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgCount: { $avg: '$interactionCount' },
        },
      },
    ]);

    // Rating moyen
    const avgRating = await Conversation.aggregate([
      { $match: { ...query, rating: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        byStatus: {
          active,
          resolved,
          escalated,
          closed: total - active - resolved - escalated,
        },
        byPriority: byPriority.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byBotType: byBotType.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        avgInteractions: avgInteractions[0]?.avgCount || 0,
        rating: {
          average: avgRating[0]?.avgRating || 0,
          count: avgRating[0]?.count || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching conversation stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

// GET /stats/resolution - Taux de résolution
router.get('/resolution', async (req: Request, res: Response) => {
  try {
    const { botType, startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    const query: any = {};
    if (botType) query.botType = botType;
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    const total = await Conversation.countDocuments(query);
    const resolved = await Conversation.countDocuments({
      ...query,
      status: 'resolved',
    });
    const escalated = await Conversation.countDocuments({
      ...query,
      status: 'escalated',
    });

    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    const escalationRate = total > 0 ? (escalated / total) * 100 : 0;
    const autoResolvedRate = total > 0
      ? ((resolved - escalated) / total) * 100
      : 0;

    // Temps moyen de résolution
    const avgResolutionTime = await Conversation.aggregate([
      {
        $match: {
          ...query,
          status: 'resolved',
          resolvedAt: { $exists: true },
        },
      },
      {
        $project: {
          duration: {
            $subtract: ['$resolvedAt', '$createdAt'],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
        },
      },
    ]);

    const avgDurationMinutes = avgResolutionTime[0]?.avgDuration
      ? Math.round(avgResolutionTime[0].avgDuration / 1000 / 60)
      : 0;

    res.json({
      success: true,
      stats: {
        total,
        resolved,
        escalated,
        rates: {
          resolution: Math.round(resolutionRate * 10) / 10,
          escalation: Math.round(escalationRate * 10) / 10,
          autoResolved: Math.round(autoResolvedRate * 10) / 10,
        },
        avgResolutionTime: {
          minutes: avgDurationMinutes,
          hours: Math.round((avgDurationMinutes / 60) * 10) / 10,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching resolution stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

// GET /stats/tickets - Statistiques des tickets
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { assignedTo, priority, status, startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    const query: any = {};
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    const total = await Ticket.countDocuments(query);

    // Par statut
    const byStatus = await Ticket.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Par priorité
    const byPriority = await Ticket.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Par catégorie
    const byCategory = await Ticket.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // SLA respect
    const slaCompliant = await Ticket.countDocuments({
      ...query,
      status: 'resolved',
      'sla.responded': true,
      $expr: {
        $lt: ['$resolution.resolvedAt', '$sla.resolveBy'],
      },
    });

    const slaViolated = await Ticket.countDocuments({
      ...query,
      status: 'resolved',
      $expr: {
        $gt: ['$resolution.resolvedAt', '$sla.resolveBy'],
      },
    });

    const resolvedTickets = await Ticket.countDocuments({
      ...query,
      status: 'resolved',
    });

    const slaComplianceRate = resolvedTickets > 0
      ? (slaCompliant / resolvedTickets) * 100
      : 0;

    // Temps moyen de première réponse
    const avgFirstResponse = await Ticket.aggregate([
      {
        $match: {
          ...query,
          'sla.responded': true,
          'sla.respondedAt': { $exists: true },
        },
      },
      {
        $project: {
          duration: {
            $subtract: ['$sla.respondedAt', '$createdAt'],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
        },
      },
    ]);

    const avgFirstResponseMinutes = avgFirstResponse[0]?.avgDuration
      ? Math.round(avgFirstResponse[0].avgDuration / 1000 / 60)
      : 0;

    res.json({
      success: true,
      stats: {
        total,
        byStatus: byStatus.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byCategory: byCategory.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        sla: {
          compliant: slaCompliant,
          violated: slaViolated,
          complianceRate: Math.round(slaComplianceRate * 10) / 10,
        },
        avgFirstResponse: {
          minutes: avgFirstResponseMinutes,
          hours: Math.round((avgFirstResponseMinutes / 60) * 10) / 10,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

// GET /stats/messages - Statistiques des messages
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    const query: any = {};
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    const total = await Message.countDocuments(query);

    // Par rôle
    const byRole = await Message.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // Temps de réponse moyen
    const avgResponseTime = await Message.aggregate([
      {
        $match: {
          ...query,
          role: 'assistant',
          'metadata.responseTime': { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$metadata.responseTime' },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        byRole: byRole.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        avgResponseTime: avgResponseTime[0]?.avgTime || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

export default router;
