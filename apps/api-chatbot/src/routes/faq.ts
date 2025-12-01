import { Router, Request, Response } from 'express';
import {
  searchFAQ,
  getFAQByBotType,
  markFAQHelpful,
} from '../services/knowledge-service';

const router = Router();

// GET /faq - Liste des FAQ par botType
router.get('/', async (req: Request, res: Response) => {
  try {
    const { botType, category, limit = 50, offset = 0 } = req.query;

    if (!botType) {
      return res.status(400).json({
        error: 'botType parameter is required',
      });
    }

    const result = await searchFAQ({
      botType: botType as string,
      category: category as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      faqs: result.faqs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error: any) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      error: 'Failed to fetch FAQ',
      message: error.message,
    });
  }
});

// GET /faq/search - Rechercher dans les FAQ
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      query,
      botType,
      category,
      limit = 20,
      offset = 0,
    } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'query parameter is required',
      });
    }

    const result = await searchFAQ({
      query: query as string,
      botType: botType as string,
      category: category as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      faqs: result.faqs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error: any) {
    console.error('Error searching FAQ:', error);
    res.status(500).json({
      error: 'Failed to search FAQ',
      message: error.message,
    });
  }
});

// GET /faq/grouped/:botType - FAQ groupées par catégorie
router.get('/grouped/:botType', async (req: Request, res: Response) => {
  try {
    const { botType } = req.params;

    const grouped = await getFAQByBotType(botType);

    res.json({
      success: true,
      faqsByCategory: grouped,
    });
  } catch (error: any) {
    console.error('Error fetching grouped FAQ:', error);
    res.status(500).json({
      error: 'Failed to fetch FAQ',
      message: error.message,
    });
  }
});

// POST /faq/:id/helpful - Marquer une FAQ comme utile ou non
router.post('/:id/helpful', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({
        error: 'helpful must be a boolean',
      });
    }

    const faq = await markFAQHelpful(id, helpful);

    res.json({
      success: true,
      faq,
    });
  } catch (error: any) {
    console.error('Error marking FAQ helpful:', error);

    if (error.message === 'FAQ not found') {
      return res.status(404).json({
        error: 'FAQ not found',
      });
    }

    res.status(500).json({
      error: 'Failed to mark FAQ',
      message: error.message,
    });
  }
});

export default router;
