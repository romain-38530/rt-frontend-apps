/**
 * Routes pour la gestion des modules de formation SYMPHONI.A
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import TrainingModule from '../models/TrainingModule';

const router = Router();

// GET /training/modules - Liste des modules de formation
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const { portal, category, status = 'published' } = req.query;

    const filter: any = { status };

    // Filtrer par portail
    if (portal) {
      filter.$or = [
        { portals: portal },
        { portals: 'all' }
      ];
    }

    if (category) {
      filter.category = category;
    }

    const modules = await TrainingModule.find(filter).sort({ order: 1, createdAt: -1 });

    // Grouper par catégorie
    const grouped = modules.reduce((acc: any, mod) => {
      if (!acc[mod.category]) {
        acc[mod.category] = [];
      }
      acc[mod.category].push({
        id: mod.moduleId,
        moduleId: mod.moduleId,
        title: mod.title,
        description: mod.description,
        category: mod.category,
        icon: mod.icon,
        duration: mod.duration,
        lessonsCount: mod.lessons.length,
        portals: mod.portals,
        tags: mod.tags,
        prerequisites: mod.prerequisites
      });
      return acc;
    }, {});

    res.json({
      modules: modules.map(m => ({
        id: m.moduleId,
        moduleId: m.moduleId,
        title: m.title,
        description: m.description,
        category: m.category,
        icon: m.icon,
        duration: m.duration,
        lessonsCount: m.lessons.length,
        portals: m.portals,
        tags: m.tags,
        prerequisites: m.prerequisites
      })),
      byCategory: grouped,
      total: modules.length
    });
  } catch (error) {
    console.error('Error fetching training modules:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des modules' });
  }
});

// GET /training/modules/:moduleId - Détail d'un module
router.get('/modules/:moduleId', async (req: Request, res: Response) => {
  try {
    const module = await TrainingModule.findOne({ moduleId: req.params.moduleId });
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    res.json({
      id: module.moduleId,
      ...module.toObject()
    });
  } catch (error) {
    console.error('Error fetching training module:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du module' });
  }
});

// GET /training/categories - Liste des catégories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { portal } = req.query;

    const filter: any = { status: 'published' };
    if (portal) {
      filter.$or = [
        { portals: portal },
        { portals: 'all' }
      ];
    }

    const categories = await TrainingModule.distinct('category', filter);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// POST /training/modules - Créer un module (admin)
router.post('/modules', async (req: Request, res: Response) => {
  try {
    const { title, description, category, portals, icon, duration, lessons, prerequisites, tags } = req.body;

    const moduleId = `mod_${uuidv4()}`;

    const module = new TrainingModule({
      moduleId,
      title,
      description,
      category,
      portals: portals || ['all'],
      icon,
      duration: duration || 30,
      lessons: (lessons || []).map((l: any, index: number) => ({
        lessonId: `les_${uuidv4()}`,
        title: l.title,
        description: l.description,
        contentType: l.contentType || 'video',
        contentUrl: l.contentUrl,
        duration: l.duration || 10,
        order: index
      })),
      prerequisites,
      tags,
      status: 'published',
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await module.save();

    res.status(201).json({
      id: module.moduleId,
      ...module.toObject()
    });
  } catch (error) {
    console.error('Error creating training module:', error);
    res.status(500).json({ error: 'Erreur lors de la création du module' });
  }
});

// PUT /training/modules/:moduleId - Mettre à jour un module
router.put('/modules/:moduleId', async (req: Request, res: Response) => {
  try {
    const { title, description, category, portals, icon, duration, lessons, prerequisites, tags, status } = req.body;

    const module = await TrainingModule.findOne({ moduleId: req.params.moduleId });
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    if (title) module.title = title;
    if (description) module.description = description;
    if (category) module.category = category;
    if (portals) module.portals = portals;
    if (icon) module.icon = icon;
    if (duration) module.duration = duration;
    if (prerequisites) module.prerequisites = prerequisites;
    if (tags) module.tags = tags;
    if (status) module.status = status;

    if (lessons) {
      module.lessons = lessons.map((l: any, index: number) => ({
        lessonId: l.lessonId || `les_${uuidv4()}`,
        title: l.title,
        description: l.description,
        contentType: l.contentType || 'video',
        contentUrl: l.contentUrl,
        duration: l.duration || 10,
        order: index
      }));
    }

    await module.save();

    res.json({
      id: module.moduleId,
      ...module.toObject()
    });
  } catch (error) {
    console.error('Error updating training module:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du module' });
  }
});

// DELETE /training/modules/:moduleId - Supprimer un module
router.delete('/modules/:moduleId', async (req: Request, res: Response) => {
  try {
    const module = await TrainingModule.findOneAndDelete({ moduleId: req.params.moduleId });
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    res.json({ success: true, message: 'Module supprimé' });
  } catch (error) {
    console.error('Error deleting training module:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du module' });
  }
});

// POST /training/seed - Initialiser les modules de base
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const existingCount = await TrainingModule.countDocuments();
    if (existingCount > 0) {
      return res.json({ message: 'Modules déjà initialisés', count: existingCount });
    }

    const baseModules = [
      // PRISE EN MAIN
      {
        moduleId: 'mod_dashboard',
        title: 'Navigation et Tableau de Bord',
        description: 'Maîtrisez l\'interface SYMPHONI.A : navigation, widgets, personnalisation',
        category: 'Prise en main',
        portals: ['all'],
        icon: '🏠',
        duration: 20,
        order: 1,
        lessons: [
          { lessonId: 'les_1', title: 'Découverte de l\'interface', contentType: 'video', duration: 8, order: 0 },
          { lessonId: 'les_2', title: 'Personnalisation du tableau de bord', contentType: 'interactive', duration: 7, order: 1 },
          { lessonId: 'les_3', title: 'Quiz de validation', contentType: 'quiz', duration: 5, order: 2 }
        ],
        tags: ['débutant', 'interface']
      },
      {
        moduleId: 'mod_profile',
        title: 'Profil et Paramètres',
        description: 'Configurez votre compte, notifications et préférences',
        category: 'Prise en main',
        portals: ['all'],
        icon: '⚙️',
        duration: 15,
        order: 2,
        lessons: [
          { lessonId: 'les_4', title: 'Configuration du profil', contentType: 'video', duration: 5, order: 0 },
          { lessonId: 'les_5', title: 'Gestion des notifications', contentType: 'video', duration: 5, order: 1 },
          { lessonId: 'les_6', title: 'Sécurité du compte', contentType: 'document', duration: 5, order: 2 }
        ],
        tags: ['débutant', 'configuration']
      },

      // GESTION DES COMMANDES - INDUSTRIE
      {
        moduleId: 'mod_orders_create',
        title: 'Création de Commandes',
        description: 'Apprenez à créer des commandes de transport étape par étape',
        category: 'Gestion des Commandes',
        portals: ['industry', 'logistician'],
        icon: '📝',
        duration: 30,
        order: 3,
        lessons: [
          { lessonId: 'les_7', title: 'Création simple', contentType: 'video', duration: 10, order: 0 },
          { lessonId: 'les_8', title: 'Options avancées', contentType: 'video', duration: 10, order: 1 },
          { lessonId: 'les_9', title: 'Import en masse', contentType: 'interactive', duration: 10, order: 2 }
        ],
        tags: ['commandes', 'création']
      },
      {
        moduleId: 'mod_orders_track',
        title: 'Suivi des Commandes',
        description: 'Suivez vos commandes en temps réel avec la tour de contrôle',
        category: 'Gestion des Commandes',
        portals: ['industry', 'logistician', 'supplier'],
        icon: '📍',
        duration: 25,
        order: 4,
        lessons: [
          { lessonId: 'les_10', title: 'Tour de contrôle', contentType: 'video', duration: 8, order: 0 },
          { lessonId: 'les_11', title: 'Alertes et notifications', contentType: 'video', duration: 7, order: 1 },
          { lessonId: 'les_12', title: 'Suivi GPS', contentType: 'interactive', duration: 10, order: 2 }
        ],
        tags: ['suivi', 'temps-réel']
      },

      // AFFRETEMENT
      {
        moduleId: 'mod_dispatch_manual',
        title: 'Affrètement Manuel',
        description: 'Sélectionnez et assignez manuellement les transporteurs',
        category: 'Affrètement',
        portals: ['industry', 'logistician', 'forwarder'],
        icon: '🚚',
        duration: 25,
        order: 5,
        lessons: [
          { lessonId: 'les_13', title: 'Recherche de transporteurs', contentType: 'video', duration: 8, order: 0 },
          { lessonId: 'les_14', title: 'Comparaison et sélection', contentType: 'video', duration: 9, order: 1 },
          { lessonId: 'les_15', title: 'Attribution et confirmation', contentType: 'interactive', duration: 8, order: 2 }
        ],
        tags: ['affrètement', 'transporteurs']
      },
      {
        moduleId: 'mod_dispatch_ai',
        title: 'Affrètement IA (Affret.IA)',
        description: 'Utilisez l\'intelligence artificielle pour l\'affrètement automatique',
        category: 'Affrètement',
        portals: ['industry', 'logistician', 'forwarder'],
        icon: '🤖',
        duration: 35,
        order: 6,
        lessons: [
          { lessonId: 'les_16', title: 'Configuration Affret.IA', contentType: 'video', duration: 10, order: 0 },
          { lessonId: 'les_17', title: 'Critères de scoring', contentType: 'document', duration: 10, order: 1 },
          { lessonId: 'les_18', title: 'Mode cascade automatique', contentType: 'video', duration: 8, order: 2 },
          { lessonId: 'les_19', title: 'Analyse des performances', contentType: 'interactive', duration: 7, order: 3 }
        ],
        tags: ['IA', 'automatisation', 'affrètement']
      },

      // TRANSPORTEUR
      {
        moduleId: 'mod_carrier_accept',
        title: 'Acceptation des Missions',
        description: 'Consultez et acceptez les demandes de transport',
        category: 'Portail Transporteur',
        portals: ['transporter'],
        icon: '✅',
        duration: 20,
        order: 7,
        lessons: [
          { lessonId: 'les_20', title: 'Liste des demandes', contentType: 'video', duration: 7, order: 0 },
          { lessonId: 'les_21', title: 'Détails et tarification', contentType: 'video', duration: 7, order: 1 },
          { lessonId: 'les_22', title: 'Acceptation et confirmation', contentType: 'interactive', duration: 6, order: 2 }
        ],
        tags: ['transporteur', 'missions']
      },
      {
        moduleId: 'mod_carrier_execution',
        title: 'Exécution du Transport',
        description: 'Gérez l\'exécution : RDV, chargement, livraison, POD',
        category: 'Portail Transporteur',
        portals: ['transporter'],
        icon: '📦',
        duration: 30,
        order: 8,
        lessons: [
          { lessonId: 'les_23', title: 'Prise de RDV', contentType: 'video', duration: 8, order: 0 },
          { lessonId: 'les_24', title: 'Confirmation chargement', contentType: 'video', duration: 8, order: 1 },
          { lessonId: 'les_25', title: 'Preuve de livraison (POD)', contentType: 'interactive', duration: 10, order: 2 },
          { lessonId: 'les_26', title: 'Gestion des incidents', contentType: 'video', duration: 4, order: 3 }
        ],
        tags: ['transporteur', 'exécution', 'POD']
      },

      // DOCUMENTS
      {
        moduleId: 'mod_documents',
        title: 'Gestion Documentaire',
        description: 'Gérez CMR, bons de livraison, photos et documents',
        category: 'Documents',
        portals: ['all'],
        icon: '📄',
        duration: 25,
        order: 9,
        lessons: [
          { lessonId: 'les_27', title: 'Types de documents', contentType: 'video', duration: 8, order: 0 },
          { lessonId: 'les_28', title: 'Upload et organisation', contentType: 'interactive', duration: 10, order: 1 },
          { lessonId: 'les_29', title: 'Signatures électroniques', contentType: 'video', duration: 7, order: 2 }
        ],
        tags: ['documents', 'CMR']
      },
      {
        moduleId: 'mod_ecmr',
        title: 'e-CMR - Lettre de Voiture Électronique',
        description: 'Maîtrisez la dématérialisation complète de la CMR',
        category: 'Documents',
        portals: ['industry', 'transporter', 'logistician'],
        icon: '📱',
        duration: 30,
        order: 10,
        lessons: [
          { lessonId: 'les_30', title: 'Introduction à l\'e-CMR', contentType: 'video', duration: 10, order: 0 },
          { lessonId: 'les_31', title: 'Création et signature', contentType: 'interactive', duration: 12, order: 1 },
          { lessonId: 'les_32', title: 'Conformité légale', contentType: 'document', duration: 8, order: 2 }
        ],
        tags: ['e-CMR', 'dématérialisation', 'légal']
      },

      // PALETTES
      {
        moduleId: 'mod_pallets',
        title: 'Gestion des Palettes Europe',
        description: 'Suivez les échanges de palettes et le compte palette',
        category: 'Palettes',
        portals: ['industry', 'transporter', 'supplier'],
        icon: '🎨',
        duration: 20,
        order: 11,
        lessons: [
          { lessonId: 'les_33', title: 'Compte palette', contentType: 'video', duration: 7, order: 0 },
          { lessonId: 'les_34', title: 'Échanges au chargement', contentType: 'video', duration: 7, order: 1 },
          { lessonId: 'les_35', title: 'Régularisation', contentType: 'interactive', duration: 6, order: 2 }
        ],
        tags: ['palettes', 'Europe', 'échange']
      },

      // ANALYTICS
      {
        moduleId: 'mod_analytics',
        title: 'Tableaux de Bord et Analytics',
        description: 'Analysez vos performances transport avec les KPIs',
        category: 'Analytics',
        portals: ['industry', 'logistician', 'forwarder'],
        icon: '📊',
        duration: 30,
        order: 12,
        lessons: [
          { lessonId: 'les_36', title: 'KPIs essentiels', contentType: 'video', duration: 10, order: 0 },
          { lessonId: 'les_37', title: 'Rapports personnalisés', contentType: 'interactive', duration: 12, order: 1 },
          { lessonId: 'les_38', title: 'Export des données', contentType: 'document', duration: 8, order: 2 }
        ],
        tags: ['analytics', 'KPI', 'rapports']
      },
      {
        moduleId: 'mod_ai_reports',
        title: 'Rapports IA',
        description: 'Générez des analyses automatiques avec l\'intelligence artificielle',
        category: 'Analytics',
        portals: ['industry', 'logistician'],
        icon: '🧠',
        duration: 25,
        order: 13,
        lessons: [
          { lessonId: 'les_39', title: 'Types de rapports IA', contentType: 'video', duration: 8, order: 0 },
          { lessonId: 'les_40', title: 'Configuration et planification', contentType: 'interactive', duration: 10, order: 1 },
          { lessonId: 'les_41', title: 'Interprétation des résultats', contentType: 'document', duration: 7, order: 2 }
        ],
        tags: ['IA', 'rapports', 'analyse']
      },

      // FACTURATION
      {
        moduleId: 'mod_invoicing',
        title: 'Pré-facturation et Facturation',
        description: 'Gérez le processus de facturation des transports',
        category: 'Facturation',
        portals: ['industry', 'logistician', 'transporter'],
        icon: '💰',
        duration: 25,
        order: 14,
        lessons: [
          { lessonId: 'les_42', title: 'Pré-factures automatiques', contentType: 'video', duration: 8, order: 0 },
          { lessonId: 'les_43', title: 'Validation et ajustements', contentType: 'interactive', duration: 10, order: 1 },
          { lessonId: 'les_44', title: 'Export comptable', contentType: 'document', duration: 7, order: 2 }
        ],
        tags: ['facturation', 'comptabilité']
      },

      // INCIDENTS
      {
        moduleId: 'mod_incidents',
        title: 'Gestion des Incidents',
        description: 'Déclarez et suivez les incidents de transport',
        category: 'Incidents',
        portals: ['all'],
        icon: '⚠️',
        duration: 20,
        order: 15,
        lessons: [
          { lessonId: 'les_45', title: 'Déclaration d\'incident', contentType: 'video', duration: 7, order: 0 },
          { lessonId: 'les_46', title: 'Suivi et résolution', contentType: 'video', duration: 7, order: 1 },
          { lessonId: 'les_47', title: 'Escalade automatique', contentType: 'document', duration: 6, order: 2 }
        ],
        tags: ['incidents', 'résolution']
      },

      // INTÉGRATIONS
      {
        moduleId: 'mod_integrations',
        title: 'Intégrations et API',
        description: 'Connectez SYMPHONI.A à vos outils (ERP, TMS, WMS)',
        category: 'Intégrations',
        portals: ['industry', 'logistician'],
        icon: '🔗',
        duration: 35,
        order: 16,
        lessons: [
          { lessonId: 'les_48', title: 'Vue d\'ensemble des intégrations', contentType: 'video', duration: 10, order: 0 },
          { lessonId: 'les_49', title: 'API REST', contentType: 'document', duration: 15, order: 1 },
          { lessonId: 'les_50', title: 'Webhooks', contentType: 'interactive', duration: 10, order: 2 }
        ],
        tags: ['API', 'ERP', 'intégration']
      },

      // EXPÉDITEUR
      {
        moduleId: 'mod_supplier_portal',
        title: 'Portail Expéditeur',
        description: 'Utilisez le portail pour suivre vos expéditions',
        category: 'Portail Expéditeur',
        portals: ['supplier'],
        icon: '📤',
        duration: 20,
        order: 17,
        lessons: [
          { lessonId: 'les_51', title: 'Accès et connexion', contentType: 'video', duration: 5, order: 0 },
          { lessonId: 'les_52', title: 'Suivi des expéditions', contentType: 'video', duration: 8, order: 1 },
          { lessonId: 'les_53', title: 'Communication', contentType: 'interactive', duration: 7, order: 2 }
        ],
        tags: ['expéditeur', 'portail']
      },

      // DESTINATAIRE
      {
        moduleId: 'mod_recipient',
        title: 'Portail Destinataire',
        description: 'Suivez vos livraisons et confirmez la réception',
        category: 'Portail Destinataire',
        portals: ['industry', 'supplier'],
        icon: '📥',
        duration: 15,
        order: 18,
        lessons: [
          { lessonId: 'les_54', title: 'Suivi des livraisons', contentType: 'video', duration: 5, order: 0 },
          { lessonId: 'les_55', title: 'Confirmation de réception', contentType: 'interactive', duration: 5, order: 1 },
          { lessonId: 'les_56', title: 'Signalement de problèmes', contentType: 'video', duration: 5, order: 2 }
        ],
        tags: ['destinataire', 'réception']
      },

      // MOBILE
      {
        moduleId: 'mod_mobile',
        title: 'Application Mobile',
        description: 'Utilisez SYMPHONI.A sur smartphone et tablette',
        category: 'Mobile',
        portals: ['all'],
        icon: '📱',
        duration: 20,
        order: 19,
        lessons: [
          { lessonId: 'les_57', title: 'Installation et configuration', contentType: 'video', duration: 5, order: 0 },
          { lessonId: 'les_58', title: 'Fonctionnalités mobiles', contentType: 'video', duration: 8, order: 1 },
          { lessonId: 'les_59', title: 'Mode hors-ligne', contentType: 'interactive', duration: 7, order: 2 }
        ],
        tags: ['mobile', 'application']
      },

      // BEST PRACTICES
      {
        moduleId: 'mod_best_practices',
        title: 'Bonnes Pratiques',
        description: 'Optimisez votre utilisation de SYMPHONI.A',
        category: 'Bonnes Pratiques',
        portals: ['all'],
        icon: '💡',
        duration: 25,
        order: 20,
        lessons: [
          { lessonId: 'les_60', title: 'Organisation quotidienne', contentType: 'video', duration: 8, order: 0 },
          { lessonId: 'les_61', title: 'Raccourcis et astuces', contentType: 'document', duration: 10, order: 1 },
          { lessonId: 'les_62', title: 'FAQ et dépannage', contentType: 'interactive', duration: 7, order: 2 }
        ],
        tags: ['bonnes pratiques', 'optimisation']
      }
    ];

    // Insérer les modules
    const modules = await TrainingModule.insertMany(
      baseModules.map(m => ({
        ...m,
        status: 'published',
        createdBy: 'system'
      }))
    );

    console.log(`[Training] Seeded ${modules.length} training modules`);

    res.json({
      success: true,
      message: `${modules.length} modules initialisés`,
      count: modules.length
    });
  } catch (error) {
    console.error('Error seeding training modules:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation des modules' });
  }
});

export default router;
