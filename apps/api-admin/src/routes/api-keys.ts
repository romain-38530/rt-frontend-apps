import { Router } from 'express';
import ApiKey from '../models/ApiKey';
import Company from '../models/Company';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = Router();

// List API keys
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, companyId, status } = req.query;
    const query: any = {};

    if (companyId) query.companyId = companyId;
    if (status) query.status = status;

    const total = await ApiKey.countDocuments(query);
    const keys = await ApiKey.find(query)
      .populate('companyId', 'name')
      .populate('createdBy', 'firstName lastName email')
      .select('-key -keyHash') // Don't expose full key
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Add key preview (last 4 chars)
    const keysWithPreview = keys.map(k => ({
      ...k.toObject(),
      keyPreview: '****' + k._id.toString().slice(-4)
    }));

    res.json({
      success: true,
      data: keysWithPreview,
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

// Create API key
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, companyId, permissions, rateLimit, expiresAt } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({ success: false, error: 'Company not found' });
    }

    // Generate API key
    const key = `rt_${uuidv4().replace(/-/g, '')}`;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    const apiKey = new ApiKey({
      name,
      key,
      keyHash,
      companyId,
      permissions: permissions || ['read'],
      rateLimit: rateLimit || 1000,
      status: 'active',
      createdBy: req.user!.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await apiKey.save();

    // Return the full key only on creation
    res.status(201).json({
      success: true,
      data: {
        id: apiKey._id,
        name: apiKey.name,
        key: key, // Only time the full key is returned
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      },
      message: 'Store this API key securely. It will not be shown again.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Revoke API key
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }

    apiKey.status = 'revoked';
    apiKey.revokedAt = new Date();
    apiKey.revokedBy = req.user!.id as any;

    await apiKey.save();

    res.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update API key (permissions, rate limit)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { permissions, rateLimit, name } = req.body;
    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }

    if (apiKey.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Cannot update revoked or expired key' });
    }

    if (name) apiKey.name = name;
    if (permissions) apiKey.permissions = permissions;
    if (rateLimit) apiKey.rateLimit = rateLimit;

    await apiKey.save();

    res.json({ success: true, data: apiKey });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
