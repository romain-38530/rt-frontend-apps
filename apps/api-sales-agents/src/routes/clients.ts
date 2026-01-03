import express from 'express';
import AgentClient from '../models/AgentClient';
import Agent from '../models/Agent';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// POST /clients - Add client for agent
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { agentId } = req.body;

    // Verify agent exists and is active
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (agent.status !== 'active') {
      return res.status(400).json({ error: 'Agent must be active to add clients' });
    }

    const client = new AgentClient(req.body);
    await client.save();

    res.status(201).json(client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /clients - List clients with filters
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { agentId, status, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (agentId) query.agentId = agentId;
    if (status) query.status = status;

    const clients = await AgentClient.find(query)
      .populate('agentId')
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

// GET /clients/:id - Get client details
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const client = await AgentClient.findById(req.params.id).populate('agentId');

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /clients/:id - Update client
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const client = await AgentClient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /clients/:id/activate - Activate client
router.put('/:id/activate', authenticateAdmin, async (req, res) => {
  try {
    const client = await AgentClient.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (client.status !== 'prospect') {
      return res.status(400).json({ error: 'Only prospect clients can be activated' });
    }

    client.status = 'active';
    client.signedAt = new Date();

    await client.save();

    res.json(client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /clients/:id/churn - Mark as churned
router.put('/:id/churn', authenticateAdmin, async (req, res) => {
  try {
    const client = await AgentClient.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (client.status !== 'active') {
      return res.status(400).json({ error: 'Only active clients can be churned' });
    }

    client.status = 'churned';
    client.churnedAt = new Date();

    await client.save();

    res.json(client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
