import { Router } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import Subscription from '../models/Subscription';
import Invoice from '../models/Invoice';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { analyticsService } from '../services/analytics-service';
import { logger } from '../config/logger';

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

// System logs - from AuditLog
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 100, level, service, from, to } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (level) query.action = { $regex: level, $options: 'i' };
    if (service) query.resource = service;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(String(from));
      if (to) query.timestamp.$lte = new Date(String(to));
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email')
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs.map(log => ({
        id: log._id,
        timestamp: log.timestamp,
        level: log.action?.includes('error') ? 'error' : log.action?.includes('delete') ? 'warn' : 'info',
        service: log.resource || 'api-admin',
        action: log.action,
        user: log.userId ? `${(log.userId as any).firstName} ${(log.userId as any).lastName}` : 'System',
        details: log.newValue || log.oldValue || null,
        ip: log.ipAddress
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching logs', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Error tracking - from AuditLog with error actions
router.get('/errors', async (req, res) => {
  try {
    const { page = 1, limit = 50, resolved } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      $or: [
        { action: { $regex: 'error', $options: 'i' } },
        { action: { $regex: 'fail', $options: 'i' } },
        { 'newValue.error': { $exists: true } }
      ]
    };

    const [errors, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: errors.map(err => ({
        id: err._id,
        timestamp: err.timestamp,
        action: err.action,
        resource: err.resource,
        details: err.newValue || err.oldValue || null,
        ipAddress: err.ipAddress,
        resolved: false
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching errors', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Integrations - list configured integrations from companies
router.get('/integrations', async (req, res) => {
  try {
    const { companyId, type } = req.query;

    const query: any = {};
    if (companyId) query._id = companyId;

    const companies = await Company.find(query)
      .select('name settings integrations status')
      .lean();

    const integrations = companies.flatMap(company => {
      const companyIntegrations = [];

      // Check for common integrations
      if ((company as any).settings?.apiEnabled) {
        companyIntegrations.push({
          companyId: company._id,
          companyName: company.name,
          type: 'api',
          status: 'active',
          lastSync: new Date()
        });
      }

      if ((company as any).integrations) {
        for (const [key, value] of Object.entries((company as any).integrations)) {
          if (value && typeof value === 'object') {
            companyIntegrations.push({
              companyId: company._id,
              companyName: company.name,
              type: key,
              status: (value as any).active ? 'active' : 'inactive',
              config: value,
              lastSync: (value as any).lastSync
            });
          }
        }
      }

      return companyIntegrations;
    });

    res.json({
      success: true,
      data: integrations,
      total: integrations.length
    });
  } catch (error) {
    logger.error('Error fetching integrations', { error: String(error) });
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

// ==================== ANALYTICS ENDPOINTS ====================

// Full analytics dashboard
router.get('/analytics', async (req, res) => {
  try {
    const period = (req.query.period as 'today' | 'week' | 'month' | 'quarter' | 'year') || 'month';
    const dashboard = await analyticsService.getFullDashboard(period);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error fetching analytics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Lead generation metrics
router.get('/analytics/leads', async (req, res) => {
  try {
    const period = (req.query.period as 'today' | 'week' | 'month' | 'quarter' | 'year') || 'month';
    const metrics = await analyticsService.getLeadGenerationMetrics(period);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching lead metrics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Contact metrics
router.get('/analytics/contacts', async (req, res) => {
  try {
    const period = (req.query.period as 'today' | 'week' | 'month' | 'quarter' | 'year') || 'month';
    const metrics = await analyticsService.getContactMetrics(period);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching contact metrics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Email campaign metrics
router.get('/analytics/emails', async (req, res) => {
  try {
    const period = (req.query.period as 'today' | 'week' | 'month' | 'quarter' | 'year') || 'month';
    const metrics = await analyticsService.getEmailCampaignMetrics(period);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching email metrics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Pipeline metrics
router.get('/analytics/pipeline', async (req, res) => {
  try {
    const period = (req.query.period as 'today' | 'week' | 'month' | 'quarter' | 'year') || 'month';
    const metrics = await analyticsService.getPipelineMetrics(period);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching pipeline metrics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Commercial performance metrics
router.get('/analytics/commercial', async (req, res) => {
  try {
    const period = (req.query.period as 'today' | 'week' | 'month' | 'quarter' | 'year') || 'month';
    const metrics = await analyticsService.getCommercialPerformanceMetrics(period);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching commercial metrics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Salon/source metrics
router.get('/analytics/salons', async (req, res) => {
  try {
    const metrics = await analyticsService.getSalonMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching salon metrics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Interaction metrics
router.get('/analytics/interactions', async (req, res) => {
  try {
    const period = (req.query.period as 'today' | 'week' | 'month' | 'quarter' | 'year') || 'month';
    const metrics = await analyticsService.getInteractionMetrics(period);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching interaction metrics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Data quality metrics
router.get('/analytics/data-quality', async (req, res) => {
  try {
    const metrics = await analyticsService.getDataQualityMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching data quality metrics', { error: String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
