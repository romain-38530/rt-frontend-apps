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
import CommercialAvailability from '../models/CommercialAvailability';
import CommercialMeeting from '../models/CommercialMeeting';
import CrmEmailService from '../services/email-service';
import crypto from 'crypto';

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
        const bookingUrl = `https://commercial.symphonia-controltower.com/book/${commercial._id}`;
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
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bookingUrl}"
                   style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Reserver un creneau de presentation (30 min)
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Choisissez le creneau qui vous convient le mieux pour une presentation personnalisee de nos solutions.
              </p>
              <p>Cordialement,<br>L'equipe commerciale SYMPHONI.A</p>
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

// ==================== CALENDRIER & DISPONIBILITES ====================

// Obtenir mes disponibilites
router.get('/availability', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    let availability = await CommercialAvailability.findOne({ commercialId: req.commercial!._id });

    // Si pas de config, creer une config par defaut (Lundi-Vendredi 9h-12h, 14h-18h)
    if (!availability) {
      availability = await CommercialAvailability.create({
        commercialId: req.commercial!._id,
        weeklySchedule: [
          { dayOfWeek: 1, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }], isActive: true },
          { dayOfWeek: 2, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }], isActive: true },
          { dayOfWeek: 3, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }], isActive: true },
          { dayOfWeek: 4, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }], isActive: true },
          { dayOfWeek: 5, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }], isActive: true },
          { dayOfWeek: 6, slots: [], isActive: false },
          { dayOfWeek: 0, slots: [], isActive: false }
        ],
        meetingDuration: 30,
        bufferTime: 15,
        maxDaysInAdvance: 30,
        isActive: true
      });
    }

    res.json(availability);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre a jour mes disponibilites
router.put('/availability', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { weeklySchedule, exceptions, meetingDuration, bufferTime, maxDaysInAdvance, isActive } = req.body;

    const availability = await CommercialAvailability.findOneAndUpdate(
      { commercialId: req.commercial!._id },
      {
        $set: {
          ...(weeklySchedule && { weeklySchedule }),
          ...(exceptions && { exceptions }),
          ...(meetingDuration && { meetingDuration }),
          ...(bufferTime !== undefined && { bufferTime }),
          ...(maxDaysInAdvance && { maxDaysInAdvance }),
          ...(isActive !== undefined && { isActive })
        }
      },
      { new: true, upsert: true }
    );

    res.json(availability);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter une exception (conge, indisponibilite)
router.post('/availability/exception', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { date, type, customSlots, reason } = req.body;

    const availability = await CommercialAvailability.findOneAndUpdate(
      { commercialId: req.commercial!._id },
      {
        $push: {
          exceptions: { date: new Date(date), type, customSlots, reason }
        }
      },
      { new: true }
    );

    res.json(availability);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une exception
router.delete('/availability/exception/:date', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const exceptionDate = new Date(req.params.date);
    const startOfDay = new Date(exceptionDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(exceptionDate.setHours(23, 59, 59, 999));

    const availability = await CommercialAvailability.findOneAndUpdate(
      { commercialId: req.commercial!._id },
      {
        $pull: {
          exceptions: { date: { $gte: startOfDay, $lte: endOfDay } }
        }
      },
      { new: true }
    );

    res.json(availability);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MES RENDEZ-VOUS ====================

// Liste de mes rendez-vous
router.get('/meetings', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

    const filter: any = { commercialId: req.commercial!._id };

    if (startDate && endDate) {
      filter.scheduledAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [meetings, total] = await Promise.all([
      CommercialMeeting.find(filter)
        .populate('leadCompanyId', 'raisonSociale')
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(Number(limit)),
      CommercialMeeting.countDocuments(filter)
    ]);

    res.json({
      meetings,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les RDV du jour/semaine pour le calendrier
router.get('/meetings/calendar', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { view = 'week' } = req.query;
    const now = new Date();
    let startDate: Date, endDate: Date;

    if (view === 'day') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (view === 'week') {
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const meetings = await CommercialMeeting.find({
      commercialId: req.commercial!._id,
      scheduledAt: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    })
      .populate('leadCompanyId', 'raisonSociale')
      .sort({ scheduledAt: 1 });

    res.json({ meetings, startDate, endDate, view });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Creer un RDV manuellement
router.post('/meetings', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const {
      leadCompanyId, leadContactId, prospectInfo,
      title, description, type, scheduledAt, duration,
      meetingLink, meetingProvider
    } = req.body;

    const meeting = await CommercialMeeting.create({
      commercialId: req.commercial!._id,
      leadCompanyId,
      leadContactId,
      prospectInfo,
      title: title || 'Presentation SYMPHONI.A',
      description,
      type: type || 'presentation',
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      meetingLink,
      meetingProvider,
      bookingToken: crypto.randomBytes(16).toString('hex'),
      bookedAt: new Date()
    });

    // Log interaction si lead associe
    if (leadCompanyId) {
      await LeadInteraction.create({
        entrepriseId: leadCompanyId,
        typeInteraction: 'RDV_PLANIFIE',
        description: `RDV planifie le ${new Date(scheduledAt).toLocaleString('fr-FR')}`,
        metadata: { meetingId: meeting._id, type },
        createdBy: req.commercial!._id.toString()
      });
    }

    res.status(201).json(meeting);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre a jour un RDV
router.put('/meetings/:id', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { status, notes, outcome, nextSteps, meetingLink } = req.body;

    const meeting = await CommercialMeeting.findOneAndUpdate(
      { _id: req.params.id, commercialId: req.commercial!._id },
      {
        $set: {
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
          ...(outcome !== undefined && { outcome }),
          ...(nextSteps !== undefined && { nextSteps }),
          ...(meetingLink && { meetingLink }),
          ...(status === 'cancelled' && { cancelledAt: new Date() })
        }
      },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ error: 'RDV non trouve' });
    }

    // Log interaction si lead associe
    if (meeting.leadCompanyId && status) {
      await LeadInteraction.create({
        entrepriseId: meeting.leadCompanyId,
        typeInteraction: status === 'completed' ? 'RDV_TERMINE' : status === 'cancelled' ? 'RDV_ANNULE' : 'RDV_UPDATE',
        description: status === 'completed' ? `RDV termine - ${outcome || 'Pas de feedback'}` :
                     status === 'cancelled' ? 'RDV annule' : 'RDV mis a jour',
        metadata: { meetingId: meeting._id, status },
        createdBy: req.commercial!._id.toString()
      });
    }

    res.json(meeting);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Annuler un RDV
router.delete('/meetings/:id', authenticateCommercial, async (req: CommercialRequest, res: Response) => {
  try {
    const { reason } = req.body;

    const meeting = await CommercialMeeting.findOneAndUpdate(
      { _id: req.params.id, commercialId: req.commercial!._id },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason
        }
      },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ error: 'RDV non trouve' });
    }

    // Envoyer email d'annulation au prospect
    if (meeting.prospectInfo?.email) {
      try {
        await CrmEmailService.sendEmail({
          to: meeting.prospectInfo.email,
          subject: 'Annulation de votre rendez-vous',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Rendez-vous annule</h2>
              <p>Bonjour ${meeting.prospectInfo.contactName},</p>
              <p>Nous sommes desoles de vous informer que le rendez-vous prevu le
                <strong>${new Date(meeting.scheduledAt).toLocaleString('fr-FR')}</strong>
                a ete annule.</p>
              ${reason ? `<p>Raison: ${reason}</p>` : ''}
              <p>Nous vous contacterons prochainement pour reprogrammer un nouveau creneau.</p>
              <p>Cordialement,<br>L'equipe commerciale SYMPHONI.A</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Erreur envoi email annulation:', emailError);
      }
    }

    res.json({ success: true, message: 'RDV annule' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RESERVATION PUBLIQUE (sans auth) ====================

// Obtenir les creneaux disponibles d'un commercial (public)
router.get('/public/availability/:commercialId', async (req: Request, res: Response) => {
  try {
    const { commercialId } = req.params;
    const { date } = req.query; // Format YYYY-MM-DD, si non fourni = 30 prochains jours

    const commercial = await CrmCommercial.findById(commercialId);
    if (!commercial || commercial.status !== 'active') {
      return res.status(404).json({ error: 'Commercial non trouve' });
    }

    const availability = await CommercialAvailability.findOne({ commercialId, isActive: true });
    if (!availability) {
      return res.status(404).json({ error: 'Aucune disponibilite configuree' });
    }

    // Calculer les creneaux disponibles
    const startDate = date ? new Date(date as string) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + availability.maxDaysInAdvance);

    // Recuperer les RDV existants
    const existingMeetings = await CommercialMeeting.find({
      commercialId,
      scheduledAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled'] }
    }).select('scheduledAt duration');

    // Generer les creneaux disponibles
    const slots: { date: string; time: string; datetime: Date }[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const daySchedule = availability.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);

      // Verifier les exceptions
      const exception = availability.exceptions.find(e => {
        const excDate = new Date(e.date);
        return excDate.toDateString() === current.toDateString();
      });

      if (exception?.type === 'unavailable') {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const slotsForDay = exception?.type === 'custom' ? exception.customSlots : daySchedule?.slots;

      if (daySchedule?.isActive && slotsForDay) {
        for (const slot of slotsForDay || []) {
          const [startHour, startMin] = slot.startTime.split(':').map(Number);
          const [endHour, endMin] = slot.endTime.split(':').map(Number);

          let slotTime = new Date(current);
          slotTime.setHours(startHour, startMin, 0, 0);

          const slotEnd = new Date(current);
          slotEnd.setHours(endHour, endMin, 0, 0);

          while (slotTime < slotEnd) {
            // Verifier si ce creneau est deja pris
            const slotEndTime = new Date(slotTime.getTime() + availability.meetingDuration * 60000);
            const isBooked = existingMeetings.some(m => {
              const meetingEnd = new Date(m.scheduledAt.getTime() + m.duration * 60000);
              return (slotTime < meetingEnd && slotEndTime > m.scheduledAt);
            });

            // Verifier si c'est dans le futur (avec un buffer de 2h)
            const now = new Date();
            const minBookingTime = new Date(now.getTime() + 2 * 60 * 60000);

            if (!isBooked && slotTime >= minBookingTime) {
              slots.push({
                date: slotTime.toISOString().split('T')[0],
                time: `${String(slotTime.getHours()).padStart(2, '0')}:${String(slotTime.getMinutes()).padStart(2, '0')}`,
                datetime: new Date(slotTime)
              });
            }

            slotTime = new Date(slotTime.getTime() + (availability.meetingDuration + availability.bufferTime) * 60000);
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    res.json({
      commercial: {
        id: commercial._id,
        firstName: commercial.firstName,
        lastName: commercial.lastName
      },
      meetingDuration: availability.meetingDuration,
      slots
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reserver un creneau (public)
router.post('/public/book/:commercialId', async (req: Request, res: Response) => {
  try {
    const { commercialId } = req.params;
    const { datetime, prospectInfo, leadCompanyId, type = 'presentation' } = req.body;

    if (!datetime || !prospectInfo?.companyName || !prospectInfo?.contactName || !prospectInfo?.email) {
      return res.status(400).json({ error: 'Informations manquantes (datetime, companyName, contactName, email)' });
    }

    const commercial = await CrmCommercial.findById(commercialId);
    if (!commercial || commercial.status !== 'active') {
      return res.status(404).json({ error: 'Commercial non trouve' });
    }

    const availability = await CommercialAvailability.findOne({ commercialId, isActive: true });
    if (!availability) {
      return res.status(400).json({ error: 'Reservations non disponibles' });
    }

    const scheduledAt = new Date(datetime);

    // Verifier que le creneau n'est pas deja pris
    const existingMeeting = await CommercialMeeting.findOne({
      commercialId,
      scheduledAt: {
        $gte: new Date(scheduledAt.getTime() - availability.meetingDuration * 60000),
        $lte: new Date(scheduledAt.getTime() + availability.meetingDuration * 60000)
      },
      status: { $nin: ['cancelled'] }
    });

    if (existingMeeting) {
      return res.status(409).json({ error: 'Ce creneau n\'est plus disponible' });
    }

    // Creer le RDV
    const bookingToken = crypto.randomBytes(16).toString('hex');
    const meeting = await CommercialMeeting.create({
      commercialId,
      leadCompanyId,
      prospectInfo,
      title: `Presentation SYMPHONI.A - ${prospectInfo.companyName}`,
      type,
      scheduledAt,
      duration: availability.meetingDuration,
      bookingToken,
      bookedAt: new Date()
    });

    // Envoyer email de confirmation au prospect
    try {
      await CrmEmailService.sendEmail({
        to: prospectInfo.email,
        subject: `Confirmation de votre rendez-vous - ${new Date(scheduledAt).toLocaleDateString('fr-FR')}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Rendez-vous confirme</h2>
            <p>Bonjour ${prospectInfo.contactName},</p>
            <p>Votre rendez-vous a bien ete enregistre avec les details suivants:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 8px 0;"><strong>Heure:</strong> ${new Date(scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 8px 0;"><strong>Duree:</strong> ${availability.meetingDuration} minutes</p>
              <p style="margin: 8px 0;"><strong>Commercial:</strong> ${commercial.firstName} ${commercial.lastName}</p>
            </div>
            <p>Vous recevrez un rappel 24h avant le rendez-vous.</p>
            <p style="margin-top: 30px;">
              <a href="https://commercial.symphonia-controltower.com/cancel/${bookingToken}"
                 style="color: #dc2626; text-decoration: underline;">
                Annuler ce rendez-vous
              </a>
            </p>
            <p style="margin-top: 20px;">Cordialement,<br>L'equipe SYMPHONI.A</p>
          </div>
        `
      });
      meeting.confirmationEmailSent = true;
      await meeting.save();
    } catch (emailError) {
      console.error('Erreur envoi email confirmation:', emailError);
    }

    // Envoyer notification au commercial
    try {
      await CrmEmailService.sendEmail({
        to: commercial.email,
        subject: `Nouveau RDV reserve - ${prospectInfo.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Nouveau rendez-vous</h2>
            <p>Bonjour ${commercial.firstName},</p>
            <p>Un nouveau rendez-vous a ete reserve:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Entreprise:</strong> ${prospectInfo.companyName}</p>
              <p style="margin: 8px 0;"><strong>Contact:</strong> ${prospectInfo.contactName}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${prospectInfo.email}</p>
              ${prospectInfo.phone ? `<p style="margin: 8px 0;"><strong>Tel:</strong> ${prospectInfo.phone}</p>` : ''}
              <hr style="margin: 15px 0;">
              <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 8px 0;"><strong>Heure:</strong> ${new Date(scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <p>
              <a href="https://commercial.symphonia-controltower.com/meetings"
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                Voir mon calendrier
              </a>
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur envoi notification commercial:', emailError);
    }

    // Log interaction si lead associe
    if (leadCompanyId) {
      await LeadInteraction.create({
        entrepriseId: leadCompanyId,
        typeInteraction: 'RDV_RESERVE',
        description: `RDV reserve par le prospect pour le ${new Date(scheduledAt).toLocaleString('fr-FR')}`,
        metadata: { meetingId: meeting._id, bookedBy: 'prospect' },
        createdBy: 'prospect'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Rendez-vous confirme',
      meeting: {
        id: meeting._id,
        scheduledAt: meeting.scheduledAt,
        duration: meeting.duration,
        commercial: {
          firstName: commercial.firstName,
          lastName: commercial.lastName
        }
      },
      cancelToken: bookingToken
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Annuler un RDV via token (public)
router.post('/public/cancel/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;

    const meeting = await CommercialMeeting.findOne({ bookingToken: token });
    if (!meeting) {
      return res.status(404).json({ error: 'Rendez-vous non trouve' });
    }

    if (meeting.status === 'cancelled') {
      return res.status(400).json({ error: 'Ce rendez-vous est deja annule' });
    }

    meeting.status = 'cancelled';
    meeting.cancelledAt = new Date();
    meeting.cancellationReason = reason || 'Annule par le prospect';
    await meeting.save();

    // Notifier le commercial
    const commercial = await CrmCommercial.findById(meeting.commercialId);
    if (commercial) {
      try {
        await CrmEmailService.sendEmail({
          to: commercial.email,
          subject: `RDV annule - ${meeting.prospectInfo.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Rendez-vous annule</h2>
              <p>Bonjour ${commercial.firstName},</p>
              <p>Le rendez-vous suivant a ete annule par le prospect:</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Entreprise:</strong> ${meeting.prospectInfo.companyName}</p>
                <p style="margin: 8px 0;"><strong>Date prevue:</strong> ${new Date(meeting.scheduledAt).toLocaleString('fr-FR')}</p>
                ${reason ? `<p style="margin: 8px 0;"><strong>Raison:</strong> ${reason}</p>` : ''}
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Erreur notification annulation:', emailError);
      }
    }

    res.json({ success: true, message: 'Rendez-vous annule' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
