import { Router } from 'express';
import Module from '../models/Module';
import Company from '../models/Company';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// List modules
router.get('/', async (req, res) => {
  try {
    const modules = await Module.find().sort({ category: 1, name: 1 });
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get module
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Toggle module status
router.put('/:id/toggle', async (req: AuthRequest, res) => {
  try {
    const { enabled } = req.body;
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    module.status = enabled ? 'active' : 'inactive';
    await module.save();

    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get module usage stats
router.get('/:id/usage', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    // Count companies using this module
    const companiesWithModule = await Company.countDocuments({ modules: module.code });
    const subscriptionsWithModule = await Subscription.countDocuments({ modules: module.code });

    // Get companies by plan
    const byPlan = await Subscription.aggregate([
      { $match: { modules: module.code } },
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        module: module.code,
        companiesCount: companiesWithModule,
        subscriptionsCount: subscriptionsWithModule,
        byPlan: byPlan.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Create module (admin only)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { code, name, description, category, pricing, dependencies, permissions, configSchema } = req.body;

    const existingModule = await Module.findOne({ code });
    if (existingModule) {
      return res.status(400).json({ success: false, error: 'Module code already exists' });
    }

    const module = new Module({
      code,
      name,
      description,
      category,
      pricing,
      dependencies,
      permissions,
      configSchema
    });

    await module.save();
    res.status(201).json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update module
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const updates = req.body;
    delete updates.code; // Cannot change code

    Object.assign(module, updates);
    await module.save();

    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
