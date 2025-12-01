import express from 'express';
import AgentContract from '../models/AgentContract';
import Agent from '../models/Agent';
import { generateContract } from '../services/contract-generator';
import { sendContractEmail } from '../services/email-service';

const router = express.Router();

// POST /contracts/generate - Generate PDF contract for agent
router.post('/generate', async (req, res) => {
  try {
    const { agentId, region, duration = 'unlimited', clauses = [] } = req.body;

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Create contract
    const contract = new AgentContract({
      agentId,
      region: region || agent.region,
      duration,
      clauses,
      status: 'draft'
    });

    await contract.save();

    // Generate PDF
    const pdfUrl = await generateContract(contract._id.toString());
    contract.pdfUrl = pdfUrl;
    await contract.save();

    // Update agent's contractId
    agent.contractId = contract._id;
    await agent.save();

    res.status(201).json(contract);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /contracts/:id - Get contract details
router.get('/:id', async (req, res) => {
  try {
    const contract = await AgentContract.findById(req.params.id).populate('agentId');
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /contracts/:id/send - Send for signature
router.post('/:id/send', async (req, res) => {
  try {
    const contract = await AgentContract.findById(req.params.id).populate('agentId');

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'draft') {
      return res.status(400).json({ error: 'Contract must be in draft status to send' });
    }

    contract.status = 'sent';
    contract.sentAt = new Date();
    await contract.save();

    // Send email to agent
    await sendContractEmail(contract.agentId._id.toString(), contract._id.toString());

    res.json(contract);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /contracts/:id/sign - Sign electronically
router.post('/:id/sign', async (req, res) => {
  try {
    const { signatureData, ipAddress, deviceInfo } = req.body;

    const contract = await AgentContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'sent') {
      return res.status(400).json({ error: 'Contract must be sent before signing' });
    }

    contract.status = 'signed';
    contract.signedAt = new Date();
    contract.signature = {
      signedAt: new Date(),
      signatureData,
      ipAddress,
      deviceInfo
    };

    await contract.save();

    // Update agent status
    const agent = await Agent.findById(contract.agentId);
    if (agent && agent.status === 'pending_signature') {
      agent.status = 'active';
      agent.activatedAt = new Date();
      await agent.save();
    }

    res.json(contract);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /contracts/:id/pdf - Download PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const contract = await AgentContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (!contract.pdfUrl) {
      return res.status(404).json({ error: 'PDF not generated yet' });
    }

    // In production, redirect to S3 URL or serve file
    res.json({ pdfUrl: contract.pdfUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
