import { Router } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// List audit logs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, companyId, action, resource, from, to } = req.query;
    const query: any = {};

    if (userId) query.userId = userId;
    if (companyId) query.companyId = companyId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from as string);
      if (to) query.timestamp.$lte = new Date(to as string);
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
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

// Export audit logs
router.get('/export', async (req: AuthRequest, res) => {
  try {
    const { from, to, format = 'json' } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'from and to dates required' });
    }

    const logs = await AuditLog.find({
      timestamp: {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      }
    }).sort({ timestamp: -1 });

    if (format === 'csv') {
      // Generate CSV
      const headers = ['timestamp', 'userId', 'userName', 'companyId', 'companyName', 'action', 'resource', 'resourceId', 'ipAddress'];
      const csvRows = [headers.join(',')];

      logs.forEach(log => {
        csvRows.push([
          log.timestamp.toISOString(),
          log.userId,
          log.userName,
          log.companyId,
          log.companyName,
          log.action,
          log.resource,
          log.resourceId || '',
          log.ipAddress
        ].map(v => `"${v}"`).join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-${from}-${to}.csv`);
      return res.send(csvRows.join('\n'));
    }

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// GDPR requests (simplified)
router.get('/gdpr/requests', async (req, res) => {
  try {
    // In a real implementation, this would be a separate model
    res.json({
      success: true,
      data: [],
      message: 'GDPR request management - implementation pending'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/gdpr/requests/:id/process', async (req: AuthRequest, res) => {
  try {
    const { response, approved } = req.body;
    // In a real implementation, this would process the GDPR request
    res.json({
      success: true,
      message: `GDPR request ${approved ? 'approved' : 'rejected'}: ${response}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
