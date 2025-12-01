import Agent from '../models/Agent';
import Commission from '../models/Commission';
import AgentClient from '../models/AgentClient';

const COMMISSION_RATE = 70; // EUR per client per month

/**
 * Calculate monthly commissions for all active agents
 */
export async function calculateMonthlyCommissions(month: number, year: number) {
  try {
    // Get all active agents
    const activeAgents = await Agent.find({ status: 'active' });

    const commissions = [];

    for (const agent of activeAgents) {
      // Check if commission already exists for this period
      const existingCommission = await Commission.findOne({
        agentId: agent._id,
        'period.month': month,
        'period.year': year
      });

      if (existingCommission) {
        console.log(`Commission already exists for agent ${agent.agentId} for ${month}/${year}`);
        commissions.push(existingCommission);
        continue;
      }

      // Calculate commission for this agent
      const commission = await calculateAgentCommission(agent._id.toString(), month, year);

      if (commission) {
        commissions.push(commission);
      }
    }

    return commissions;
  } catch (error) {
    console.error('Error calculating monthly commissions:', error);
    throw error;
  }
}

/**
 * Calculate commission for a specific agent
 */
export async function calculateAgentCommission(agentId: string, month: number, year: number) {
  try {
    const agent = await Agent.findById(agentId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status !== 'active') {
      console.log(`Agent ${agent.agentId} is not active, skipping commission calculation`);
      return null;
    }

    // Get active clients for this agent
    const activeClients = await getActiveClients(agentId);

    if (activeClients.length === 0) {
      console.log(`Agent ${agent.agentId} has no active clients, skipping commission`);
      return null;
    }

    // Calculate total commission
    const totalClients = activeClients.length;
    const totalAmount = totalClients * COMMISSION_RATE;

    // Create commission record
    const commission = new Commission({
      agentId,
      period: {
        month,
        year
      },
      clients: activeClients.map(client => ({
        clientId: client._id,
        clientName: client.companyName,
        subscriptionAmount: client.subscriptionAmount,
        commissionAmount: COMMISSION_RATE
      })),
      totalClients,
      totalAmount,
      status: 'pending'
    });

    await commission.save();

    console.log(`Commission created for agent ${agent.agentId}: ${totalClients} clients, ${totalAmount}€`);

    return commission;
  } catch (error) {
    console.error('Error calculating agent commission:', error);
    throw error;
  }
}

/**
 * Get active clients for an agent
 */
export async function getActiveClients(agentId: string) {
  try {
    const clients = await AgentClient.find({
      agentId,
      status: 'active'
    });

    return clients;
  } catch (error) {
    console.error('Error getting active clients:', error);
    throw error;
  }
}

/**
 * Get commission statistics for an agent
 */
export async function getAgentCommissionStats(agentId: string) {
  try {
    const stats = await Commission.aggregate([
      {
        $match: { agentId }
      },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: '$totalAmount' },
          totalClients: { $sum: '$totalClients' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalCommissions: 0,
        totalClients: 0,
        count: 0
      };
    }

    return stats[0];
  } catch (error) {
    console.error('Error getting commission stats:', error);
    throw error;
  }
}
