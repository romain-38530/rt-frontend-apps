import { Router, Response } from 'express';
import Alert from '../models/Alert';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Create alert
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const alert = new Alert({
      ...req.body,
      userId: req.user?.userId,
      companyId: req.user?.companyId
    });

    await alert.save();

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get my alerts
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { active, type, page = 1, limit = 20 } = req.query;

    const query: any = {
      userId: req.user?.userId
    };

    if (active !== undefined) {
      query.active = active === 'true';
    }

    if (type) {
      query.type = type;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Alert.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get alert by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Check ownership
    if (alert.userId !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this alert'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update alert
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Check ownership
    if (alert.userId !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this alert'
      });
    }

    Object.assign(alert, req.body);
    await alert.save();

    res.json({
      success: true,
      data: alert,
      message: 'Alert updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Delete alert
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Check ownership
    if (alert.userId !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this alert'
      });
    }

    await Alert.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Toggle alert active status
router.patch('/:id/toggle', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Check ownership
    if (alert.userId !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this alert'
      });
    }

    alert.active = !alert.active;
    await alert.save();

    res.json({
      success: true,
      data: alert,
      message: `Alert ${alert.active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
