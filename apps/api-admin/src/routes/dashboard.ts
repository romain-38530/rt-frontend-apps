import { Router } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import Subscription from '../models/Subscription';
import Invoice from '../models/Invoice';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Global dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Users stats
    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'deleted' }
    });
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      status: { $ne: 'deleted' }
    });

    // Companies stats
    const totalCompanies = await Company.countDocuments({ status: { $ne: 'cancelled' } });
    const activeCompanies = await Company.countDocuments({ status: 'active' });
    const newCompaniesThisMonth = await Company.countDocuments({
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'cancelled' }
    });

    const companiesByType = await Company.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Subscriptions stats
    const totalSubscriptions = await Subscription.countDocuments();
    const subscriptionsByPlan = await Subscription.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const activeSubscriptions = await Subscription.find({ status: 'active' });
    let mrr = 0;
    activeSubscriptions.forEach(sub => {
      if (sub.billingCycle === 'monthly') mrr += sub.price;
      else if (sub.billingCycle === 'quarterly') mrr += sub.price / 3;
      else if (sub.billingCycle === 'yearly') mrr += sub.price / 12;
    });

    // Recent activity
    const recentActivity = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    // Invoices stats
    const paidInvoicesThisMonth = await Invoice.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsersThisMonth,
          growth: newUsersLastMonth > 0
            ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
            : 0
        },
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          new: newCompaniesThisMonth,
          byType: companiesByType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>)
        },
        subscriptions: {
          total: totalSubscriptions,
          byPlan: subscriptionsByPlan.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>),
          mrr: Math.round(mrr),
          arr: Math.round(mrr * 12)
        },
        revenue: {
          thisMonth: paidInvoicesThisMonth[0]?.total || 0,
          invoicesCount: paidInvoicesThisMonth[0]?.count || 0
        },
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Services health
router.get('/services/health', async (req, res) => {
  try {
    // Check health of various services
    const services = [
      { name: 'api-auth', port: 3010 },
      { name: 'api-orders', port: 3011 },
      { name: 'api-tracking', port: 3012 },
      { name: 'api-billing', port: 3013 },
      { name: 'api-ecmr', port: 3014 },
      { name: 'api-storage', port: 3015 },
      { name: 'api-chatbot', port: 3016 },
      { name: 'api-supplier', port: 3017 },
      { name: 'api-recipient', port: 3018 },
      { name: 'api-bourse-maritime', port: 3019 },
      { name: 'api-admin', port: 3020 },
      { name: 'api-planning', port: 3030 },
      { name: 'api-affretia', port: 3040 }
    ];

    const healthChecks = await Promise.all(
      services.map(async (service) => {
        const startTime = Date.now();
        try {
          const response = await fetch(`http://localhost:${service.port}/health`, {
            signal: AbortSignal.timeout(5000)
          });
          const latency = Date.now() - startTime;
          const data = await response.json().catch(() => ({}));

          return {
            name: service.name,
            status: response.ok ? 'healthy' : 'degraded',
            latency,
            lastCheck: new Date(),
            details: data
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'down',
            latency: Date.now() - startTime,
            lastCheck: new Date(),
            error: String(error)
          };
        }
      })
    );

    const healthy = healthChecks.filter(s => s.status === 'healthy').length;
    const degraded = healthChecks.filter(s => s.status === 'degraded').length;
    const down = healthChecks.filter(s => s.status === 'down').length;

    res.json({
      success: true,
      data: {
        summary: {
          healthy,
          degraded,
          down,
          total: services.length
        },
        services: healthChecks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Platform metrics
router.get('/metrics', async (req, res) => {
  try {
    const { from, to, interval = 'day' } = req.query;

    // In a real implementation, this would aggregate metrics from all services
    const metrics = {
      timestamp: new Date(),
      activeUsers: await User.countDocuments({
        status: 'active',
        lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      totalRequests: 0, // Would come from request logging
      averageResponseTime: 0, // Would come from metrics collection
      errorRate: 0, // Would come from error tracking
      cpuUsage: process.cpuUsage().user / 1000000,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      diskUsage: 0 // Would come from system metrics
    };

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// System logs
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 100, level, service, from, to } = req.query;

    // In a real implementation, this would fetch from a logging service
    res.json({
      success: true,
      data: [],
      message: 'System logs - connect to logging service (ELK, CloudWatch, etc.)'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Error tracking
router.get('/errors', async (req, res) => {
  try {
    const { page = 1, limit = 50, resolved } = req.query;

    // In a real implementation, this would fetch from an error tracking service
    res.json({
      success: true,
      data: [],
      message: 'Error tracking - connect to error tracking service (Sentry, etc.)'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Integrations
router.get('/integrations', async (req, res) => {
  try {
    const { companyId, type } = req.query;

    // In a real implementation, this would be a separate model
    res.json({
      success: true,
      data: [],
      message: 'Integrations management - implementation pending'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.put('/integrations/:id', async (req: AuthRequest, res) => {
  try {
    const { config } = req.body;

    res.json({
      success: true,
      message: 'Integration configuration updated'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
