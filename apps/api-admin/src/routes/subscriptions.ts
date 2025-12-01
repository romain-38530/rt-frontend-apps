import { Router } from 'express';
import Subscription from '../models/Subscription';
import Invoice from '../models/Invoice';
import Company from '../models/Company';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// List subscriptions
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, plan, status } = req.query;
    const query: any = {};

    if (plan) query.plan = plan;
    if (status) query.status = status;

    const total = await Subscription.countDocuments(query);
    const subscriptions = await Subscription.find(query)
      .populate('companyId', 'name legalName')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get subscription
router.get('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('companyId', 'name legalName');

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update subscription
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    const { plan, status, billingCycle, price, modules, limits, autoRenew } = req.body;

    if (plan) subscription.plan = plan;
    if (status) subscription.status = status;
    if (billingCycle) subscription.billingCycle = billingCycle;
    if (price !== undefined) subscription.price = price;
    if (modules) subscription.modules = modules;
    if (limits) subscription.limits = { ...subscription.limits, ...limits };
    if (autoRenew !== undefined) subscription.autoRenew = autoRenew;

    await subscription.save();

    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Cancel subscription
router.post('/:id/cancel', async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    res.json({ success: true, data: subscription, message: `Subscription cancelled: ${reason}` });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// List invoices
router.get('/invoices', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, companyId } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (companyId) query.companyId = companyId;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Refund invoice
router.post('/invoices/:id/refund', async (req: AuthRequest, res) => {
  try {
    const { amount, reason } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (invoice.status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Can only refund paid invoices' });
    }

    const refundAmount = amount || invoice.total;
    if (refundAmount > invoice.total) {
      return res.status(400).json({ success: false, error: 'Refund amount exceeds invoice total' });
    }

    invoice.refundedAmount = refundAmount;
    invoice.refundedAt = new Date();
    invoice.status = refundAmount === invoice.total ? 'refunded' : 'paid';
    invoice.notes = reason ? `Refund: ${reason}` : invoice.notes;

    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
