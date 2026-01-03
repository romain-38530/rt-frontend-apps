import express from 'express';
import Agent from '../models/Agent';
import AgentContract from '../models/AgentContract';
import bcrypt from 'bcryptjs';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// POST /agents - Create agent
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const agent = new Agent(req.body);
    await agent.save();
    res.status(201).json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /agents - List with filters
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, region, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (region) query.region = region;

    const agents = await Agent.find(query)
      .populate('contractId')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Agent.countDocuments(query);

    res.json({
      agents,
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

// GET /agents/:id - Get details
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate('contractId');
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /agents/:id - Update agent
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /agents/:id/status - Change status
router.put('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.status = status;

    if (status === 'terminated') {
      agent.terminatedAt = new Date();
    }

    await agent.save();
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /agents/:id/documents - Upload document
router.post('/:id/documents', authenticateAdmin, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const { type, url, expiresAt } = req.body;

    // Check if document type already exists
    const existingDocIndex = agent.documents.findIndex(doc => doc.type === type);

    if (existingDocIndex >= 0) {
      // Update existing document
      agent.documents[existingDocIndex] = {
        type,
        url,
        uploadedAt: new Date(),
        verified: false,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      };
    } else {
      // Add new document
      agent.documents.push({
        type,
        url,
        uploadedAt: new Date(),
        verified: false,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });
    }

    await agent.save();
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /agents/:id/documents/:docType/verify - Verify document
router.put('/:id/documents/:docType/verify', authenticateAdmin, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const document = agent.documents.find(doc => doc.type === req.params.docType);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    document.verified = true;
    document.verifiedAt = new Date();

    // Check if all required documents are verified
    const requiredDocs = ['id_card', 'kbis', 'urssaf', 'rib'];
    const allVerified = requiredDocs.every(docType => {
      const doc = agent.documents.find(d => d.type === docType);
      return doc && doc.verified;
    });

    // If all documents verified and contract signed, update status
    if (allVerified && agent.status === 'non_compliant') {
      agent.status = 'active';
    }

    await agent.save();
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /agents/:id/activate - Activate agent
router.post('/:id/activate', authenticateAdmin, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate('contractId');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check if contract is signed
    const contract = await AgentContract.findById(agent.contractId);
    if (!contract || contract.status !== 'signed') {
      return res.status(400).json({ error: 'Agent must have a signed contract to be activated' });
    }

    // Check if all required documents are verified
    const requiredDocs = ['id_card', 'kbis', 'urssaf', 'rib'];
    const allVerified = requiredDocs.every(docType => {
      const doc = agent.documents.find(d => d.type === docType);
      return doc && doc.verified;
    });

    if (!allVerified) {
      return res.status(400).json({ error: 'All required documents must be verified' });
    }

    agent.status = 'active';
    agent.activatedAt = new Date();
    agent.portalAccess.enabled = true;

    await agent.save();
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /agents/:id - Soft delete (terminate)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.status = 'terminated';
    agent.terminatedAt = new Date();
    agent.portalAccess.enabled = false;

    await agent.save();
    res.json({ message: 'Agent terminated successfully', agent });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
