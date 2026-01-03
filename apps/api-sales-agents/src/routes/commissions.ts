import express from 'express';
import Commission from '../models/Commission';
import { calculateMonthlyCommissions, calculateAgentCommission } from '../services/commission-calculator';
import { sendCommissionNotification } from '../services/email-service';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// POST /commissions/calculate - Calculate monthly commissions for all agents
router.post('/calculate', authenticateAdmin, async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      const now = new Date();
      const commissions = await calculateMonthlyCommissions(
        now.getMonth() + 1,
        now.getFullYear()
      );
      return res.json({
        message: 'Commissions calculated successfully',
        count: commissions.length,
        commissions
      });
    }

    const commissions = await calculateMonthlyCommissions(month, year);

    res.json({
      message: 'Commissions calculated successfully',
      count: commissions.length,
      commissions
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /commissions - List all commissions with filters
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { agentId, status, month, year, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (agentId) query.agentId = agentId;
    if (status) query.status = status;
    if (month) query['period.month'] = Number(month);
    if (year) query['period.year'] = Number(year);

    const commissions = await Commission.find(query)
      .populate('agentId')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ 'period.year': -1, 'period.month': -1, createdAt: -1 });

    const total = await Commission.countDocuments(query);

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

// GET /commissions/export - Export CSV for accounting
router.get('/export', authenticateAdmin, async (req, res) => {
  try {
    const { month, year, status = 'validated' } = req.query;

    const query: any = { status };
    if (month) query['period.month'] = Number(month);
    if (year) query['period.year'] = Number(year);

    const commissions = await Commission.find(query)
      .populate('agentId')
      .sort({ 'period.year': -1, 'period.month': -1 });

    // Generate CSV
    const csvHeader = 'Commission ID,Agent ID,Agent Name,Period,Total Clients,Total Amount,Status,Validated At,Payment Reference\n';
    const csvRows = commissions.map(c => {
      const agent = c.agentId as any;
      return `${c.commissionId},${agent.agentId},"${agent.firstName} ${agent.lastName}",${c.period.month}/${c.period.year},${c.totalClients},${c.totalAmount},${c.status},${c.validatedAt ? c.validatedAt.toISOString() : ''},${c.paymentReference || ''}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=commissions-${year}-${month}.csv`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /commissions/:id - Get commission details
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id)
      .populate('agentId')
      .populate('clients.clientId');

    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    res.json(commission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /commissions/:id/validate - Validate commission
router.put('/:id/validate', authenticateAdmin, async (req, res) => {
  try {
    const { validatedBy } = req.body;

    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    if (commission.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending commissions can be validated' });
    }

    commission.status = 'validated';
    commission.validatedBy = validatedBy;
    commission.validatedAt = new Date();

    await commission.save();

    // Send notification to agent
    await sendCommissionNotification(
      commission.agentId.toString(),
      commission._id.toString()
    );

    res.json(commission);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /commissions/:id/pay - Mark as paid
router.put('/:id/pay', authenticateAdmin, async (req, res) => {
  try {
    const { paymentReference } = req.body;

    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    if (commission.status !== 'validated') {
      return res.status(400).json({ error: 'Only validated commissions can be marked as paid' });
    }

    commission.status = 'paid';
    commission.paidAt = new Date();
    commission.paymentReference = paymentReference;

    await commission.save();

    res.json(commission);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /commissions/:id/statement - Generate statement PDF
router.get('/:id/statement', authenticateAdmin, async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id)
      .populate('agentId')
      .populate('clients.clientId');

    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    // In production, generate PDF statement
    // For now, return commission data
    res.json({
      message: 'Statement generation not implemented',
      commission
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
