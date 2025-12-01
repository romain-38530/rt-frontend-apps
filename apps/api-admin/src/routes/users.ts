import { Router } from 'express';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import Company from '../models/Company';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List users
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, status, role, companyId, search } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (role) query.roles = role;
    if (companyId) query.companyId = companyId;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: users,
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

// Get user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('companyId', 'name');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Create user
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { email, firstName, lastName, companyId, roles, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({ success: false, error: 'Company not found' });
    }

    const user = new User({
      email,
      firstName,
      lastName,
      companyId,
      roles: roles || ['viewer'],
      phone,
      status: 'pending'
    });

    await user.save();

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      userName: `${req.user!.email}`,
      companyId: req.user!.companyId || companyId,
      companyName: company.name,
      action: 'create',
      resource: 'user',
      resourceId: user._id.toString(),
      newValue: { email, firstName, lastName, roles },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update user
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const oldValue = user.toObject();
    const updates = req.body;
    delete updates.email; // Email cannot be changed

    Object.assign(user, updates);
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Delete user
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = 'deleted';
    await user.save();

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Activate user
router.post('/:id/activate', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = 'active';
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Deactivate user
router.post('/:id/deactivate', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = 'inactive';
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Reset password
router.post('/:id/reset-password', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.passwordResetToken = uuidv4();
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // TODO: Send email with reset link

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get user activity
router.get('/:id/activity', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const total = await AuditLog.countDocuments({ userId: req.params.id });
    const logs = await AuditLog.find({ userId: req.params.id })
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: logs,
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

// Update user roles
router.put('/:id/roles', async (req: AuthRequest, res) => {
  try {
    const { roles } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.roles = roles;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
