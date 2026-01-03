import { Router, Request, Response } from 'express';
import {
  searchKnowledgeArticles,
  getArticleById,
  markArticleHelpful,
} from '../services/knowledge-service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /knowledge - Rechercher des articles
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      query,
      category,
      botType,
      tags,
      limit = 20,
      offset = 0,
    } = req.query;

    const tagsArray = tags ? (tags as string).split(',') : undefined;

    const result = await searchKnowledgeArticles({
      query: query as string,
      category: category as string,
      botType: botType as string,
      tags: tagsArray,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      articles: result.articles,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error: any) {
    console.error('Error searching knowledge articles:', error);
    res.status(500).json({
      error: 'Failed to search articles',
      message: error.message,
    });
  }
});

// GET /knowledge/:id - Détail d'un article
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getArticleById(id);

    res.json({
      success: true,
      article: result.article,
      relatedArticles: result.relatedArticles,
    });
  } catch (error: any) {
    console.error('Error fetching article:', error);

    if (error.message === 'Article not found') {
      return res.status(404).json({
        error: 'Article not found',
      });
    }

    res.status(500).json({
      error: 'Failed to fetch article',
      message: error.message,
    });
  }
});

// POST /knowledge/:id/helpful - Marquer un article comme utile ou non
router.post('/:id/helpful', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({
        error: 'helpful must be a boolean',
      });
    }

    const article = await markArticleHelpful(id, helpful);

    res.json({
      success: true,
      article,
    });
  } catch (error: any) {
    console.error('Error marking article helpful:', error);

    if (error.message === 'Article not found') {
      return res.status(404).json({
        error: 'Article not found',
      });
    }

    res.status(500).json({
      error: 'Failed to mark article',
      message: error.message,
    });
  }
});

export default router;
