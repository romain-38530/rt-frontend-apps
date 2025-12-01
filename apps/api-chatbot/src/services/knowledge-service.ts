import KnowledgeArticle from '../models/KnowledgeArticle';
import FAQ from '../models/FAQ';

export async function searchKnowledgeArticles(params: {
  query?: string;
  category?: string;
  botType?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}) {
  try {
    const query: any = { status: 'published' };

    // Filtre par catégorie
    if (params.category) {
      query.category = params.category;
    }

    // Filtre par botType
    if (params.botType) {
      query.botTypes = params.botType;
    }

    // Filtre par tags
    if (params.tags && params.tags.length > 0) {
      query.tags = { $in: params.tags };
    }

    let articles;

    // Recherche textuelle si query fournie
    if (params.query) {
      articles = await KnowledgeArticle.find(
        {
          ...query,
          $text: { $search: params.query },
        },
        {
          score: { $meta: 'textScore' },
        }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(params.limit || 20)
        .skip(params.offset || 0);
    } else {
      // Sinon, trier par pertinence (views + helpful)
      articles = await KnowledgeArticle.find(query)
        .sort({ helpful: -1, views: -1 })
        .limit(params.limit || 20)
        .skip(params.offset || 0);
    }

    const total = await KnowledgeArticle.countDocuments(query);

    return {
      articles,
      total,
      limit: params.limit || 20,
      offset: params.offset || 0,
    };
  } catch (error) {
    console.error('Error searching knowledge articles:', error);
    throw error;
  }
}

export async function getArticleById(articleId: string) {
  try {
    const article = await KnowledgeArticle.findById(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Incrémenter le compteur de vues
    article.views += 1;
    await article.save();

    // Charger les articles liés
    const relatedArticles = await KnowledgeArticle.find({
      _id: { $in: article.relatedArticles },
      status: 'published',
    }).select('title summary category');

    return {
      article,
      relatedArticles,
    };
  } catch (error) {
    console.error('Error getting article:', error);
    throw error;
  }
}

export async function markArticleHelpful(articleId: string, helpful: boolean) {
  try {
    const article = await KnowledgeArticle.findById(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (helpful) {
      article.helpful += 1;
    } else {
      article.notHelpful += 1;
    }

    await article.save();
    return article;
  } catch (error) {
    console.error('Error marking article helpful:', error);
    throw error;
  }
}

export async function searchFAQ(params: {
  query?: string;
  category?: string;
  botType?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const query: any = { active: true };

    // Filtre par catégorie
    if (params.category) {
      query.category = params.category;
    }

    // Filtre par botType
    if (params.botType) {
      query.$or = [
        { botType: params.botType },
        { botType: 'all' },
      ];
    }

    let faqs;

    // Recherche textuelle si query fournie
    if (params.query) {
      faqs = await FAQ.find(
        {
          ...query,
          $text: { $search: params.query },
        },
        {
          score: { $meta: 'textScore' },
        }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(params.limit || 20)
        .skip(params.offset || 0);
    } else {
      // Sinon, trier par order puis helpful
      faqs = await FAQ.find(query)
        .sort({ order: 1, helpful: -1 })
        .limit(params.limit || 20)
        .skip(params.offset || 0);
    }

    const total = await FAQ.countDocuments(query);

    return {
      faqs,
      total,
      limit: params.limit || 20,
      offset: params.offset || 0,
    };
  } catch (error) {
    console.error('Error searching FAQ:', error);
    throw error;
  }
}

export async function getFAQByBotType(botType: string) {
  try {
    const faqs = await FAQ.find({
      active: true,
      $or: [
        { botType },
        { botType: 'all' },
      ],
    })
      .sort({ order: 1 })
      .limit(50);

    // Grouper par catégorie
    const grouped = faqs.reduce((acc: any, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {});

    return grouped;
  } catch (error) {
    console.error('Error getting FAQ by bot type:', error);
    throw error;
  }
}

export async function markFAQHelpful(faqId: string, helpful: boolean) {
  try {
    const faq = await FAQ.findById(faqId);
    if (!faq) {
      throw new Error('FAQ not found');
    }

    faq.views += 1;
    if (helpful) {
      faq.helpful += 1;
    } else {
      faq.notHelpful += 1;
    }

    await faq.save();
    return faq;
  } catch (error) {
    console.error('Error marking FAQ helpful:', error);
    throw error;
  }
}

export async function getRecommendedContent(params: {
  botType: string;
  userMessage?: string;
  limit?: number;
}) {
  try {
    // Extraire mots-clés du message utilisateur
    const keywords = params.userMessage
      ? extractKeywords(params.userMessage)
      : [];

    // Rechercher articles pertinents
    const articles = await KnowledgeArticle.find({
      status: 'published',
      botTypes: params.botType,
      ...(keywords.length > 0 && {
        $or: [
          { tags: { $in: keywords } },
          { title: { $regex: keywords.join('|'), $options: 'i' } },
        ],
      }),
    })
      .sort({ helpful: -1, views: -1 })
      .limit(params.limit || 5)
      .select('title summary category');

    // Rechercher FAQ pertinentes
    const faqs = await FAQ.find({
      active: true,
      $or: [
        { botType: params.botType },
        { botType: 'all' },
      ],
      ...(keywords.length > 0 && {
        $or: [
          { tags: { $in: keywords } },
          { question: { $regex: keywords.join('|'), $options: 'i' } },
        ],
      }),
    })
      .sort({ helpful: -1 })
      .limit(params.limit || 5)
      .select('question category');

    return {
      articles,
      faqs,
    };
  } catch (error) {
    console.error('Error getting recommended content:', error);
    throw error;
  }
}

// Helper pour extraire mots-clés
function extractKeywords(text: string): string[] {
  // Mots vides à ignorer
  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du',
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'est', 'sont', 'a', 'ai', 'as', 'avez', 'ont',
    'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
    'comment', 'quoi', 'quel', 'quelle', 'où', 'pourquoi',
  ];

  // Nettoyer et tokenizer
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));

  // Retourner mots uniques
  return [...new Set(words)];
}
