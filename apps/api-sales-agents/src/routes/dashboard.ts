import express from 'express';
import Agent from '../models/Agent';
import Commission from '../models/Commission';
import AgentClient from '../models/AgentClient';
import Challenge from '../models/Challenge';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// GET /dashboard/overview - Direction overview (national stats)
router.get('/overview', authenticateAdmin, async (req, res) => {
  try {
    // Agent statistics
    const totalAgents = await Agent.countDocuments();
    const activeAgents = await Agent.countDocuments({ status: 'active' });
    const pendingAgents = await Agent.countDocuments({ status: 'pending_signature' });
    const suspendedAgents = await Agent.countDocuments({ status: 'suspended' });

    // Client statistics
    const totalClients = await AgentClient.countDocuments();
    const activeClients = await AgentClient.countDocuments({ status: 'active' });
    const prospects = await AgentClient.countDocuments({ status: 'prospect' });

    // Commission statistics
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentMonthCommissions = await Commission.aggregate([
      {
        $match: {
          'period.month': currentMonth,
          'period.year': currentYear
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCommissionsResult = await Commission.aggregate([
      {
        $match: {
          status: { $in: ['validated', 'paid'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const pendingCommissions = await Commission.countDocuments({ status: 'pending' });

    // Challenge statistics
    const activeChallenges = await Challenge.countDocuments({ status: 'active' });

    res.json({
      agents: {
        total: totalAgents,
        active: activeAgents,
        pending: pendingAgents,
        suspended: suspendedAgents
      },
      clients: {
        total: totalClients,
        active: activeClients,
        prospects: prospects
      },
      commissions: {
        currentMonth: {
          total: currentMonthCommissions.length > 0 ? currentMonthCommissions[0].total : 0,
          count: currentMonthCommissions.length > 0 ? currentMonthCommissions[0].count : 0
        },
        totalPaid: totalCommissionsResult.length > 0 ? totalCommissionsResult[0].total : 0,
        pending: pendingCommissions
      },
      challenges: {
        active: activeChallenges
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /dashboard/agents/:id - Agent detail view
router.get('/agents/:id', authenticateAdmin, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate('contractId');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get client statistics
    const totalClients = await AgentClient.countDocuments({ agentId: agent._id });
    const activeClients = await AgentClient.countDocuments({ agentId: agent._id, status: 'active' });
    const prospects = await AgentClient.countDocuments({ agentId: agent._id, status: 'prospect' });

    // Get recent clients
    const recentClients = await AgentClient.find({ agentId: agent._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get commission history
    const commissions = await Commission.find({ agentId: agent._id })
      .sort({ 'period.year': -1, 'period.month': -1 })
      .limit(12);

    // Get total commissions
    const totalCommissionsResult = await Commission.aggregate([
      { $match: { agentId: agent._id, status: { $in: ['validated', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalCommissions = totalCommissionsResult.length > 0 ? totalCommissionsResult[0].total : 0;

    // Get monthly performance (last 12 months)
    const monthlyPerformance = await Commission.aggregate([
      {
        $match: { agentId: agent._id }
      },
      {
        $group: {
          _id: { year: '$period.year', month: '$period.month' },
          clients: { $sum: '$totalClients' },
          amount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      agent,
      statistics: {
        clients: {
          total: totalClients,
          active: activeClients,
          prospects: prospects
        },
        commissions: {
          total: totalCommissions,
          count: commissions.length
        }
      },
      recentClients,
      commissions,
      monthlyPerformance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /dashboard/regions - Regional statistics
router.get('/regions', authenticateAdmin, async (req, res) => {
  try {
    // Get agent count by region
    const agentsByRegion = await Agent.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get clients by region
    const clientsByRegion = await Agent.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $lookup: {
          from: 'agentclients',
          localField: '_id',
          foreignField: 'agentId',
          as: 'clients'
        }
      },
      {
        $unwind: '$clients'
      },
      {
        $match: { 'clients.status': 'active' }
      },
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get commissions by region
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const commissionsByRegion = await Agent.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $lookup: {
          from: 'commissions',
          localField: '_id',
          foreignField: 'agentId',
          as: 'commissions'
        }
      },
      {
        $unwind: '$commissions'
      },
      {
        $match: {
          'commissions.period.month': currentMonth,
          'commissions.period.year': currentYear
        }
      },
      {
        $group: {
          _id: '$region',
          total: { $sum: '$commissions.totalAmount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.json({
      agents: agentsByRegion,
      clients: clientsByRegion,
      commissions: commissionsByRegion
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /dashboard/kpis - Key performance indicators
router.get('/kpis', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Client acquisition rate (current month)
    const newClientsThisMonth = await AgentClient.countDocuments({
      status: 'active',
      signedAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1)
      }
    });

    const newClientsLastMonth = await AgentClient.countDocuments({
      status: 'active',
      signedAt: {
        $gte: new Date(lastMonthYear, lastMonth - 1, 1),
        $lt: new Date(lastMonthYear, lastMonth, 1)
      }
    });

    const clientGrowth = newClientsLastMonth > 0
      ? ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100
      : 0;

    // Average clients per agent
    const activeAgents = await Agent.countDocuments({ status: 'active' });
    const activeClients = await AgentClient.countDocuments({ status: 'active' });
    const avgClientsPerAgent = activeAgents > 0 ? activeClients / activeAgents : 0;

    // Commission statistics
    const currentMonthCommission = await Commission.aggregate([
      {
        $match: {
          'period.month': currentMonth,
          'period.year': currentYear
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const lastMonthCommission = await Commission.aggregate([
      {
        $match: {
          'period.month': lastMonth,
          'period.year': lastMonthYear
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const currentCommissionTotal = currentMonthCommission.length > 0 ? currentMonthCommission[0].total : 0;
    const lastCommissionTotal = lastMonthCommission.length > 0 ? lastMonthCommission[0].total : 0;

    const commissionGrowth = lastCommissionTotal > 0
      ? ((currentCommissionTotal - lastCommissionTotal) / lastCommissionTotal) * 100
      : 0;

    // Top performing agents
    const topAgents = await Commission.aggregate([
      {
        $match: {
          'period.month': currentMonth,
          'period.year': currentYear
        }
      },
      {
        $group: {
          _id: '$agentId',
          totalClients: { $sum: '$totalClients' },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { totalClients: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'agents',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      {
        $unwind: '$agent'
      }
    ]);

    res.json({
      clientAcquisition: {
        thisMonth: newClientsThisMonth,
        lastMonth: newClientsLastMonth,
        growth: Number(clientGrowth.toFixed(2))
      },
      avgClientsPerAgent: Number(avgClientsPerAgent.toFixed(2)),
      commissions: {
        thisMonth: currentCommissionTotal,
        lastMonth: lastCommissionTotal,
        growth: Number(commissionGrowth.toFixed(2))
      },
      topPerformers: topAgents.map(item => ({
        agentId: item.agent.agentId,
        name: `${item.agent.firstName} ${item.agent.lastName}`,
        region: item.agent.region,
        clients: item.totalClients,
        commission: item.totalAmount
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
