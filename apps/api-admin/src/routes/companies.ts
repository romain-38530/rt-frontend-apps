import { Router } from 'express';
import Company from '../models/Company';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Invoice from '../models/Invoice';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// List companies
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, verified, search } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (verified !== undefined) query.verified = verified === 'true';
    if (search) {
      query.$text = { $search: search as string };
    }

    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .populate('subscriptionId', 'plan status')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Add users count for each company
    const companiesWithCount = await Promise.all(
      companies.map(async (company) => {
        const usersCount = await User.countDocuments({ companyId: company._id, status: { $ne: 'deleted' } });
        return { ...company.toObject(), usersCount };
      })
    );

    res.json({
      success: true,
      data: companiesWithCount,
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

// Get company
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('subscriptionId');

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const usersCount = await User.countDocuments({ companyId: company._id, status: { $ne: 'deleted' } });

    res.json({
      success: true,
      data: { ...company.toObject(), usersCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Create company
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, legalName, type, registrationNumber, vatNumber, address, contact } = req.body;

    const existingCompany = await Company.findOne({ registrationNumber });
    if (existingCompany) {
      return res.status(400).json({ success: false, error: 'Registration number already exists' });
    }

    const company = new Company({
      name,
      legalName,
      type,
      registrationNumber,
      vatNumber,
      address,
      contact,
      status: 'pending'
    });

    await company.save();

    // Create default free subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription = new Subscription({
      companyId: company._id,
      plan: 'free',
      status: 'active',
      billingCycle: 'yearly',
      price: 0,
      currency: 'EUR',
      modules: ['core'],
      limits: { users: 2, orders: 50, storage: 100, apiCalls: 1000 },
      startDate,
      endDate
    });

    await subscription.save();
    company.subscriptionId = subscription._id as any;
    await company.save();

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update company
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const updates = req.body;
    delete updates.registrationNumber; // Cannot change registration number

    Object.assign(company, updates);
    await company.save();

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Delete company
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    company.status = 'cancelled';
    await company.save();

    // Deactivate all users
    await User.updateMany({ companyId: company._id }, { status: 'inactive' });

    res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Verify company
router.post('/:id/verify', async (req: AuthRequest, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    company.verified = true;
    company.verifiedAt = new Date();
    company.verifiedBy = req.user!.id as any;
    company.status = 'active';
    await company.save();

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Suspend company
router.post('/:id/suspend', async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    company.status = 'suspended';
    await company.save();

    // Suspend subscription
    if (company.subscriptionId) {
      await Subscription.findByIdAndUpdate(company.subscriptionId, { status: 'suspended' });
    }

    res.json({ success: true, data: company, message: `Company suspended: ${reason}` });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get company billing
router.get('/:id/billing', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('subscriptionId');
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const invoices = await Invoice.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json({
      success: true,
      data: {
        subscription: company.subscriptionId,
        invoices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update company subscription
router.put('/:id/subscription', async (req: AuthRequest, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const { plan, billingCycle, modules, limits } = req.body;

    let subscription = await Subscription.findById(company.subscriptionId);
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    if (plan) subscription.plan = plan;
    if (billingCycle) subscription.billingCycle = billingCycle;
    if (modules) subscription.modules = modules;
    if (limits) subscription.limits = { ...subscription.limits, ...limits };

    await subscription.save();

    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Assign modules to company
router.put('/:id/modules', async (req: AuthRequest, res) => {
  try {
    const { moduleIds } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    company.modules = moduleIds;
    await company.save();

    // Also update subscription modules
    if (company.subscriptionId) {
      await Subscription.findByIdAndUpdate(company.subscriptionId, { modules: moduleIds });
    }

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
