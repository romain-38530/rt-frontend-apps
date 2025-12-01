import { Router } from 'express';
import Announcement from '../models/Announcement';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// List announcements
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const query: any = {};

    if (active !== undefined) {
      query.active = active === 'true';
      if (active === 'true') {
        query.startDate = { $lte: new Date() };
        query.$or = [
          { endDate: null },
          { endDate: { $gte: new Date() } }
        ];
      }
    }

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ priority: -1, startDate: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: announcements,
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

// Create announcement
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, content, type, target, targetIds, priority, startDate, endDate } = req.body;

    const announcement = new Announcement({
      title,
      content,
      type: type || 'info',
      target: target || 'all',
      targetIds: targetIds || [],
      priority: priority || 0,
      active: true,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: req.user!.id
    });

    await announcement.save();

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Update announcement
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    const { title, content, type, target, targetIds, priority, active, startDate, endDate } = req.body;

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (type) announcement.type = type;
    if (target) announcement.target = target;
    if (targetIds) announcement.targetIds = targetIds;
    if (priority !== undefined) announcement.priority = priority;
    if (active !== undefined) announcement.active = active;
    if (startDate) announcement.startDate = new Date(startDate);
    if (endDate !== undefined) announcement.endDate = endDate ? new Date(endDate) : undefined;

    await announcement.save();

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Delete announcement
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Broadcast notification
router.post('/notifications/broadcast', async (req: AuthRequest, res) => {
  try {
    const { title, message, type, channels, target, targetIds, scheduledAt } = req.body;

    // In a real implementation, this would:
    // 1. Create notification records
    // 2. Send via selected channels (email, push, sms, inApp)
    // 3. Handle scheduling if scheduledAt is provided

    res.json({
      success: true,
      message: 'Notification broadcast initiated',
      data: {
        title,
        message,
        type,
        channels,
        target,
        targetIds,
        scheduledAt,
        status: scheduledAt ? 'scheduled' : 'sent'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
