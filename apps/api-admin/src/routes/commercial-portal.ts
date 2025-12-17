/**
 * Commercial Portal Routes
 * Routes pour le portail des commerciaux (authentification, pool, pipeline)
 */
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import CrmCommercial from '../models/CrmCommercial';
import LeadCompany from '../models/LeadCompany';
import LeadContact from '../models/LeadContact';
import LeadInteraction from '../models/LeadInteraction';
import CrmSalesStage, { SALES_STAGES } from '../models/CrmSalesStage';
import CrmCommission from '../models/CrmCommission';
import CrmEmailService from '../services/email-service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'commercial-portal-secret-key';

// Interface pour la requete authentifiée
interface CommercialRequest extends Request {
  commercial?: any;
}

// Middleware d'authentification commercial
const authenticateCommercial = async (req: CommercialRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const commercial = await CrmCommercial.findById(decoded.commercialId);
    if (!commercial || commercial.status !== 'active') {
      return res.status(401).json({ error: 'Commercial non trouve ou inactif' });
    }

    req.commercial = commercial;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// ==================== AUTHENTIFICATION ====================

// Login commercial
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { accessCode, password } = req.body;

    if (!accessCode || !password) {
      return res.status(400).json({ error: 'Code d\'acces et mot de passe requis' });
    }

    // Trouver le commercial par code d'acces ou email
    const commercial = await CrmCommercial.findOne({
      $or: [
        { accessCode: accessCode.toUpperCase() },
        { email: accessCode.toLowerCase() }
      ]
    });

    if (!commercial) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Verifier si le compte est verrouillé
    if (commercial.lockedUntil && commercial.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((commercial.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({ error: `Compte verrouille. Reessayez dans ${minutesLeft} minutes.` });
    }

    // Verifier le mot de passe
    const isMatch = await commercial.comparePassword(password);
    if (!isMatch) {
      // Incrementer les tentatives
      commercial.loginAttempts = (commercial.loginAttempts || 0) + 1;
      if (commercial.loginAttempts >= 5) {
        commercial.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      await commercial.save();
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Reset les tentatives et mettre a jour lastLogin
    commercial.loginAttempts = 0;
    commercial.lockedUntil = undefined;
    commercial.lastLogin = new Date();
    await commercial.save();

    // Generer le token JWT
    const token = jwt.sign(
      { commercialId: commercial._id, email: commercial.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      commercial: {
        id: commercial._id,
        firstName: commercial.firstName,
        lastName: commercial.lastName,
        email: commercial.email,
        accessCode: commercial.accessCode,
        type: commercial.type,
        region: commercial.region,
        mustChangePassword: commercial.mustChangePassword
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Changer le mot de passe
router.post('/auth/change-password', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caracteres' });
    }

    // Si c'est le premier changement, pas besoin du mot de passe actuel
    if (!req.commercial!.mustChangePassword) {
      const isMatch = await req.commercial!.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      }
    }

    req.commercial!.passwordHash = await bcrypt.hash(newPassword, 10);
    req.commercial!.mustChangePassword = false;
    req.commercial!.tempPassword = undefined;
    await req.commercial!.save();

    res.json({ success: true, message: 'Mot de passe change avec succes' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir le profil commercial
router.get('/auth/me', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const commercial = req.commercial!;

    // Compter mes leads
    const leadsCount = await LeadCompany.countDocuments({ commercialAssigneId: commercial._id });
    const leadsEnCours = await LeadCompany.countDocuments({
      commercialAssigneId: commercial._id,
      statutProspection: { $in: ['ASSIGNED', 'CONTACTED', 'IN_PROGRESS'] }
    });
    const leadsConverts = await LeadCompany.countDocuments({
      commercialAssigneId: commercial._id,
      statutProspection: 'CONVERTED'
    });

    res.json({
      id: commercial._id,
      firstName: commercial.firstName,
      lastName: commercial.lastName,
      email: commercial.email,
      accessCode: commercial.accessCode,
      type: commercial.type,
      region: commercial.region,
      objectifMensuel: commercial.objectifMensuel,
      stats: {
        leadsAssignes: leadsCount,
        leadsEnCours,
        leadsConverts,
        tauxConversion: leadsCount > 0 ? Math.round((leadsConverts / leadsCount) * 100) : 0
      },
      commissionConfig: commercial.commissionConfig
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== POOL DE LEADS ====================

// Liste des leads disponibles dans le pool
router.get('/pool', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { pays, ville, secteur, minScore, search, page = 1, limit = 20 } = req.query;
    const filter: any = {
      inPool: true,
      commercialAssigneId: { $exists: false }
    };

    if (pays) filter['adresse.pays'] = pays;
    if (ville) filter['adresse.ville'] = { $regex: ville, $options: 'i' };
    if (secteur) filter.secteurActivite = { $regex: secteur, $options: 'i' };
    if (minScore) filter.scoreLead = { $gte: Number(minScore) };
    if (search) {
      filter.$or = [
        { raisonSociale: { $regex: search, $options: 'i' } },
        { siteWeb: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      LeadCompany.find(filter)
        .select('raisonSociale siteWeb telephone emailGenerique adresse secteurActivite scoreLead prioritePool nbContactsEnrichis dateAddedToPool salonSourceId')
        .populate('salonSourceId', 'nom')
        .sort({ prioritePool: -1, scoreLead: -1, dateAddedToPool: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LeadCompany.countDocuments(filter)
    ]);

    res.json({
      leads,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Selectionner un lead du pool (claim)
router.post('/pool/claim/:id', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const lead = await LeadCompany.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouve' });
    }

    if (lead.commercialAssigneId) {
      return res.status(400).json({ error: 'Ce lead est deja assigne a un autre commercial' });
    }

    if (!lead.inPool) {
      return res.status(400).json({ error: 'Ce lead n\'est pas dans le pool' });
    }

    const commercial = req.commercial!;

    // Assigner le lead au commercial
    lead.commercialAssigneId = commercial._id;
    lead.dateAssignation = new Date();
    lead.inPool = false;
    // Garder statut NEW jusqu'au premier contact
    await lead.save();

    // Creer les etapes du pipeline de vente
    for (const stage of SALES_STAGES) {
      await CrmSalesStage.create({
        leadCompanyId: lead._id,
        commercialId: commercial._id,
        stageCode: stage.code,
        stageOrder: stage.order,
        stageLabel: stage.label,
        status: stage.order === 1 ? 'in_progress' : 'pending'
      });
    }

    // Log interaction
    await LeadInteraction.create({
      entrepriseId: lead._id,
      typeInteraction: 'ASSIGNATION',
      description: `Lead assigne a ${commercial.firstName} ${commercial.lastName}`,
      metadata: { commercialId: commercial._id, commercialName: `${commercial.firstName} ${commercial.lastName}` },
      createdBy: commercial._id.toString()
    });

    // Envoyer email de notification au prospect si email disponible
    if (lead.emailGenerique) {
      try {
        await CrmEmailService.sendEmail({
          to: lead.emailGenerique,
          subject: `Votre interlocuteur commercial - ${commercial.firstName} ${commercial.lastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Bonjour,</h2>
              <p>Nous avons le plaisir de vous informer que <strong>${commercial.firstName} ${commercial.lastName}</strong>
              est desormais votre interlocuteur commercial dedie.</p>
              <p>N'hesitez pas a le contacter pour toute question concernant nos services.</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Contact:</strong> ${commercial.firstName} ${commercial.lastName}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${commercial.email}</p>
                ${commercial.telephone ? `<p style="margin: 5px 0;"><strong>Tel:</strong> ${commercial.telephone}</p>` : ''}
              </div>
              <p>Cordialement,<br>L'equipe commerciale</p>
            </div>
          `
        });

        await LeadInteraction.create({
          entrepriseId: lead._id,
          typeInteraction: 'EMAIL_ENVOYE',
          description: 'Email de notification du commercial assigne envoye au prospect',
          createdBy: 'system'
        });
      } catch (emailError) {
        console.error('Erreur envoi email notification:', emailError);
      }
    }

    // Charger les contacts du lead
    const contacts = await LeadContact.find({ entrepriseId: lead._id });

    res.json({
      success: true,
      message: 'Lead assigne avec succes',
      lead,
      contacts,
      pipeline: await CrmSalesStage.find({ leadCompanyId: lead._id }).sort({ stageOrder: 1 })
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MES LEADS ====================

// Liste de mes leads assignes
router.get('/my-leads', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter: any = { commercialAssigneId: req.commercial!._id };

    if (status) {
      filter.statutProspection = status;
    }
    if (search) {
      filter.$or = [
        { raisonSociale: { $regex: search, $options: 'i' } },
        { siteWeb: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      LeadCompany.find(filter)
        .select('raisonSociale siteWeb telephone emailGenerique adresse secteurActivite scoreLead statutProspection dateAssignation')
        .sort({ dateAssignation: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LeadCompany.countDocuments(filter)
    ]);

    // Pour chaque lead, recuperer l'etape actuelle du pipeline
    const leadsWithPipeline = await Promise.all(leads.map(async (lead) => {
      const currentStage = await CrmSalesStage.findOne({
        leadCompanyId: lead._id,
        status: 'in_progress'
      });
      const completedStages = await CrmSalesStage.countDocuments({
        leadCompanyId: lead._id,
        status: 'completed'
      });
      return {
        ...lead.toObject(),
        currentStage: currentStage?.stageLabel || 'Non demarre',
        currentStageCode: currentStage?.stageCode,
        completedStages,
        totalStages: SALES_STAGES.length
      };
    }));

    res.json({
      leads: leadsWithPipeline,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Detail d'un de mes leads
router.get('/my-leads/:id', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const lead = await LeadCompany.findOne({
      _id: req.params.id,
      commercialAssigneId: req.commercial!._id
    }).populate('salonSourceId', 'nom');

    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouve ou non assigne a vous' });
    }

    const [contacts, pipeline, interactions] = await Promise.all([
      LeadContact.find({ entrepriseId: lead._id }),
      CrmSalesStage.find({ leadCompanyId: lead._id }).sort({ stageOrder: 1 }),
      LeadInteraction.find({ entrepriseId: lead._id }).sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      lead,
      contacts,
      pipeline,
      interactions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PIPELINE DE VENTE ====================

// Obtenir le pipeline d'un lead
router.get('/pipeline/:leadId', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const lead = await LeadCompany.findOne({
      _id: req.params.leadId,
      commercialAssigneId: req.commercial!._id
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouve ou non assigne a vous' });
    }

    const pipeline = await CrmSalesStage.find({ leadCompanyId: lead._id }).sort({ stageOrder: 1 });
    res.json({ pipeline, leadStatus: lead.statutProspection });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre a jour une etape du pipeline
router.put('/pipeline/:leadId/stage/:stageCode', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { status, notes, actionsTaken, nextAction, nextActionDate } = req.body;

    const lead = await LeadCompany.findOne({
      _id: req.params.leadId,
      commercialAssigneId: req.commercial!._id
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouve ou non assigne a vous' });
    }

    const stage = await CrmSalesStage.findOne({
      leadCompanyId: lead._id,
      stageCode: req.params.stageCode
    });

    if (!stage) {
      return res.status(404).json({ error: 'Etape non trouvee' });
    }

    // Mettre a jour l'etape
    if (status) {
      stage.status = status;
      if (status === 'in_progress' && !stage.dateDebut) {
        stage.dateDebut = new Date();
      }
      if (status === 'completed') {
        stage.dateFin = new Date();
        // Demarrer l'etape suivante automatiquement
        const nextStage = await CrmSalesStage.findOne({
          leadCompanyId: lead._id,
          stageOrder: stage.stageOrder + 1,
          status: 'pending'
        });
        if (nextStage) {
          nextStage.status = 'in_progress';
          nextStage.dateDebut = new Date();
          await nextStage.save();
        }
      }
    }
    if (notes !== undefined) stage.notes = notes;
    if (actionsTaken) stage.actionsTaken = actionsTaken;
    if (nextAction !== undefined) stage.nextAction = nextAction;
    if (nextActionDate) stage.nextActionDate = new Date(nextActionDate);

    await stage.save();

    // Mettre a jour le statut du lead selon le pipeline
    const allCompleted = await CrmSalesStage.countDocuments({
      leadCompanyId: lead._id,
      status: { $ne: 'completed' }
    }) === 0;

    if (allCompleted) {
      lead.statutProspection = 'CONVERTED';
      await lead.save();

      // Creer la commission pour le commercial
      const now = new Date();
      await CrmCommission.create({
        commercialId: req.commercial!._id,
        type: 'conversion',
        leadCompanyId: lead._id,
        montant: req.commercial!.commissionConfig?.tauxConversion || 50,
        periode: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        description: `Conversion du lead ${lead.raisonSociale}`
      });

      // Log interaction
      await LeadInteraction.create({
        entrepriseId: lead._id,
        typeInteraction: 'CONVERSION',
        description: `Lead converti en client par ${req.commercial!.firstName} ${req.commercial!.lastName}`,
        createdBy: req.commercial!._id.toString()
      });
    } else {
      // Mettre a jour le statut selon l'etape en cours
      const inProgressStage = await CrmSalesStage.findOne({
        leadCompanyId: lead._id,
        status: 'in_progress'
      });
      if (inProgressStage) {
        if (['PREMIER_CONTACT', 'DECOUVERTE'].includes(inProgressStage.stageCode)) {
          lead.statutProspection = 'CONTACTED';
        } else if (['PROPOSITION', 'NEGOCIATION', 'CLOSING'].includes(inProgressStage.stageCode)) {
          lead.statutProspection = 'IN_PROGRESS';
        }
        await lead.save();
      }
    }

    // Log interaction
    await LeadInteraction.create({
      entrepriseId: lead._id,
      typeInteraction: 'PIPELINE_UPDATE',
      description: `Etape "${stage.stageLabel}" mise a jour: ${status || 'notes ajoutees'}`,
      metadata: { stageCode: stage.stageCode, status: stage.status },
      createdBy: req.commercial!._id.toString()
    });

    // Retourner le pipeline mis a jour
    const pipeline = await CrmSalesStage.find({ leadCompanyId: lead._id }).sort({ stageOrder: 1 });
    res.json({ success: true, pipeline, leadStatus: lead.statutProspection });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer un lead comme perdu
router.post('/my-leads/:id/lost', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { reason } = req.body;

    const lead = await LeadCompany.findOne({
      _id: req.params.id,
      commercialAssigneId: req.commercial!._id
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouve' });
    }

    lead.statutProspection = 'LOST';
    await lead.save();

    await LeadInteraction.create({
      entrepriseId: lead._id,
      typeInteraction: 'PERDU',
      description: `Lead marque comme perdu: ${reason || 'Raison non specifiee'}`,
      metadata: { reason },
      createdBy: req.commercial!._id.toString()
    });

    res.json({ success: true, message: 'Lead marque comme perdu' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter une interaction/note a un lead
router.post('/my-leads/:id/interaction', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { type, description, metadata } = req.body;

    const lead = await LeadCompany.findOne({
      _id: req.params.id,
      commercialAssigneId: req.commercial!._id
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouve' });
    }

    const interaction = await LeadInteraction.create({
      entrepriseId: lead._id,
      typeInteraction: type || 'NOTE',
      description,
      metadata,
      createdBy: req.commercial!._id.toString()
    });

    res.status(201).json(interaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTIQUES ====================

// Dashboard commercial personnel
router.get('/dashboard', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const commercial = req.commercial!;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLeads,
      leadsEnCours,
      leadsConverts,
      leadsPerdusMois,
      commissionsThisMonth,
      recentLeads
    ] = await Promise.all([
      LeadCompany.countDocuments({ commercialAssigneId: commercial._id }),
      LeadCompany.countDocuments({
        commercialAssigneId: commercial._id,
        statutProspection: { $in: ['ASSIGNED', 'CONTACTED', 'IN_PROGRESS'] }
      }),
      LeadCompany.countDocuments({
        commercialAssigneId: commercial._id,
        statutProspection: 'CONVERTED'
      }),
      LeadCompany.countDocuments({
        commercialAssigneId: commercial._id,
        statutProspection: 'LOST',
        updatedAt: { $gte: startOfMonth }
      }),
      CrmCommission.aggregate([
        {
          $match: {
            commercialId: commercial._id,
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$montant' }
          }
        }
      ]),
      LeadCompany.find({ commercialAssigneId: commercial._id })
        .select('raisonSociale statutProspection dateAssignation')
        .sort({ dateAssignation: -1 })
        .limit(5)
    ]);

    const commissionsPending = commissionsThisMonth.find(c => c._id === 'pending')?.total || 0;
    const commissionsPaid = commissionsThisMonth.find(c => c._id === 'paid')?.total || 0;

    // Progression vers objectif
    const objectif = commercial.objectifMensuel || 10;
    const progressionObjectif = Math.round((leadsConverts / objectif) * 100);

    res.json({
      stats: {
        totalLeads,
        leadsEnCours,
        leadsConverts,
        leadsPerdusMois,
        tauxConversion: totalLeads > 0 ? Math.round((leadsConverts / totalLeads) * 100) : 0,
        objectifMensuel: objectif,
        progressionObjectif: Math.min(progressionObjectif, 100),
        commissionsThisMonth: {
          pending: commissionsPending,
          paid: commissionsPaid,
          total: commissionsPending + commissionsPaid
        }
      },
      recentLeads
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
