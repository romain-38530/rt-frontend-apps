import express from 'express';
import Challenge from '../models/Challenge';
import AgentClient from '../models/AgentClient';
import Agent from '../models/Agent';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// POST /challenges - Create challenge
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const challenge = new Challenge(req.body);
    await challenge.save();
    res.status(201).json(challenge);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /challenges - List challenges
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status) query.status = status;

    const challenges = await Challenge.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ startDate: -1 });

    const total = await Challenge.countDocuments(query);

    res.json({
      challenges,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /challenges/:id - Get challenge details
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('ranking.agentId');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /challenges/:id - Update challenge
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /challenges/:id/refresh-ranking - Recalculate rankings
router.post('/:id/refresh-ranking', authenticateAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Get all active agents
    const agents = await Agent.find({ status: 'active' });

    // Calculate scores for each agent during challenge period
    const scores = await Promise.all(agents.map(async (agent) => {
      const clientCount = await AgentClient.countDocuments({
        agentId: agent._id,
        status: 'active',
        signedAt: {
          $gte: challenge.startDate,
          $lte: challenge.endDate
        }
      });

      return {
        agentId: agent._id,
        score: clientCount
      };
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Update ranking
    challenge.ranking = scores.map((item, index) => ({
      agentId: item.agentId,
      score: item.score,
      rank: index + 1,
      lastUpdated: new Date()
    }));

    await challenge.save();

    res.json(challenge);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /challenges/:id/leaderboard - Get leaderboard
router.get('/:id/leaderboard', authenticateAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('ranking.agentId');

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const leaderboard = challenge.ranking.map(entry => {
      const agent = entry.agentId as any;
      const prize = challenge.prizes.find(p => p.rank === entry.rank);

      return {
        rank: entry.rank,
        agent: {
          id: agent._id,
          agentId: agent.agentId,
          name: `${agent.firstName} ${agent.lastName}`,
          region: agent.region
        },
        score: entry.score,
        prize: prize || null,
        lastUpdated: entry.lastUpdated
      };
    });

    res.json({
      challenge: {
        id: challenge._id,
        name: challenge.name,
        description: challenge.description,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        status: challenge.status,
        target: challenge.target
      },
      leaderboard
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
