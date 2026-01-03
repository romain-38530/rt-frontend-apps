import express from 'express';
import Agent from '../models/Agent';
import Commission from '../models/Commission';
import AgentClient from '../models/AgentClient';
import bcrypt from 'bcryptjs';
import { generateAgentToken, authenticateAgent, AuthRequest } from '../middleware/auth';

const router = express.Router();

// POST /portal/login - Agent login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const agent = await Agent.findOne({ email });

    if (!agent) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!agent.portalAccess.enabled) {
      return res.status(403).json({ error: 'Portal access disabled' });
    }

    if (!agent.portalAccess.passwordHash) {
      return res.status(401).json({ error: 'Password not set' });
    }

    const isValidPassword = await bcrypt.compare(password, agent.portalAccess.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    agent.portalAccess.lastLogin = new Date();
    await agent.save();

    // Generate JWT token
    const token = generateAgentToken(agent._id.toString(), { email: agent.email });

    res.json({
      token,
      agent: {
        id: agent._id,
        agentId: agent.agentId,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        region: agent.region,
        status: agent.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /portal/dashboard - Agent dashboard
router.get('/dashboard', authenticateAgent, async (req: AuthRequest, res) => {
  try {
    const agent = await Agent.findById(req.agentId).populate('contractId');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get client statistics
    const totalClients = await AgentClient.countDocuments({ agentId: agent._id });
    const activeClients = await AgentClient.countDocuments({ agentId: agent._id, status: 'active' });
    const prospects = await AgentClient.countDocuments({ agentId: agent._id, status: 'prospect' });

    // Get current month commission
    const now = new Date();
    const currentCommission = await Commission.findOne({
      agentId: agent._id,
      'period.month': now.getMonth() + 1,
      'period.year': now.getFullYear()
    });

    // Get total commissions
    const totalCommissionsResult = await Commission.aggregate([
      { $match: { agentId: agent._id, status: { $in: ['validated', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalCommissions = totalCommissionsResult.length > 0 ? totalCommissionsResult[0].total : 0;

    res.json({
      agent: {
        id: agent._id,
        agentId: agent.agentId,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        phone: agent.phone,
        region: agent.region,
        status: agent.status
      },
      statistics: {
        totalClients,
        activeClients,
        prospects,
        currentMonthCommission: currentCommission ? currentCommission.totalAmount : 0,
        totalCommissions
      },
      contract: agent.contractId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /portal/commissions - Agent commission history
router.get('/commissions', authenticateAgent, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const commissions = await Commission.find({ agentId: req.agentId })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ 'period.year': -1, 'period.month': -1 });

    const total = await Commission.countDocuments({ agentId: req.agentId });

    res.json({
      commissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /portal/clients - Agent's clients
router.get('/clients', authenticateAgent, async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const query: any = { agentId: req.agentId };
    if (status) query.status = status;

    const clients = await AgentClient.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await AgentClient.countDocuments(query);

    res.json({
      clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /portal/profile - Update profile
router.put('/profile', authenticateAgent, async (req: AuthRequest, res) => {
  try {
    const { phone, address, bankDetails } = req.body;

    const agent = await Agent.findById(req.agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (phone) agent.phone = phone;
    if (address) agent.address = { ...agent.address, ...address };
    if (bankDetails) agent.bankDetails = { ...agent.bankDetails, ...bankDetails };

    await agent.save();

    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /portal/password - Change password
router.put('/password', authenticateAgent, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const agent = await Agent.findById(req.agentId);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verify current password
    if (agent.portalAccess.passwordHash) {
      const isValid = await bcrypt.compare(currentPassword, agent.portalAccess.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    agent.portalAccess.passwordHash = hashedPassword;

    await agent.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
