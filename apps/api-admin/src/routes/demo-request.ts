/**
 * Demo Request Routes - Public endpoints for demo/contact form submissions
 * These leads will appear in the CRM backoffice
 */
import { Router, Request, Response } from 'express';
import LeadCompany from '../models/LeadCompany';
import LeadContact from '../models/LeadContact';
import LeadInteraction from '../models/LeadInteraction';
import { logger } from '../config/logger';

const router = Router();

// Types for demo request
interface DemoRequestBody {
  // Contact info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;

  // Company info
  companyName: string;
  siret?: string;
  website?: string;

  // Request details
  portalType?: 'industry' | 'transporter' | 'logistician' | 'supplier' | 'forwarder' | 'recipient';
  message?: string;
  source?: string; // Page source (e.g., 'homepage', 'industry-page', 'contact-page')
}

/**
 * POST /api/v1/public/demo-request
 * Submit a demo request from the marketing site
 * Creates a LeadCompany, LeadContact, and logs the interaction
 */
router.post('/demo-request', async (req: Request, res: Response) => {
  try {
    const body: DemoRequestBody = req.body;

    // Validation
    if (!body.firstName || !body.lastName || !body.email || !body.companyName) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis manquants: firstName, lastName, email, companyName'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return res.status(400).json({
        success: false,
        error: 'Format email invalide'
      });
    }

    // Check if company already exists (by email domain or SIRET)
    const emailDomain = body.email.split('@')[1];
    let existingCompany = null;

    if (body.siret) {
      existingCompany = await LeadCompany.findOne({ siret: body.siret });
    }

    if (!existingCompany) {
      existingCompany = await LeadCompany.findOne({ emailGenerique: { $regex: emailDomain, $options: 'i' } });
    }

    let company;
    let isNewCompany = false;

    if (existingCompany) {
      company = existingCompany;
      logger.info(`Demo request: existing company found - ${company.raisonSociale}`);
    } else {
      // Create new company
      company = new LeadCompany({
        raisonSociale: body.companyName,
        siret: body.siret || undefined,
        siteWeb: body.website || undefined,
        emailGenerique: body.email,
        adresse: {
          pays: 'France' // Default, can be enriched later
        },
        secteurActivite: mapPortalToSector(body.portalType),
        statutProspection: 'NEW',
        inPool: true,
        dateAddedToPool: new Date(),
        prioritePool: 5, // High priority for inbound leads
        scoreLead: 80 // High score for demo requests (inbound = qualified)
      });

      await company.save();
      isNewCompany = true;
      logger.info(`Demo request: new company created - ${company.raisonSociale} (${company.numeroLead})`);
    }

    // Check if contact already exists
    let existingContact = await LeadContact.findOne({
      entrepriseId: company._id,
      email: body.email.toLowerCase()
    });

    let contact;
    let isNewContact = false;

    if (existingContact) {
      contact = existingContact;
      // Update contact status if they're requesting a demo again
      if (contact.statutContact === 'OPTED_OUT' || contact.statutContact === 'BOUNCED') {
        contact.statutContact = 'INTERESTED';
        contact.optOut = false;
        await contact.save();
      }
      logger.info(`Demo request: existing contact found - ${contact.prenom} ${contact.nom}`);
    } else {
      // Create new contact
      contact = new LeadContact({
        entrepriseId: company._id,
        prenom: body.firstName,
        nom: body.lastName,
        email: body.email.toLowerCase(),
        telephoneDirect: body.phone || undefined,
        poste: body.position || undefined,
        seniority: guessSeniority(body.position),
        sourceEnrichissement: 'MANUAL',
        statutContact: 'INTERESTED', // Demo request = interested
        estContactPrincipal: true,
        emailStatus: 'UNKNOWN' // Will be verified later
      });

      await contact.save();
      isNewContact = true;

      // Update company contact count
      company.nbContactsEnrichis = (company.nbContactsEnrichis || 0) + 1;
      await company.save();

      logger.info(`Demo request: new contact created - ${contact.prenom} ${contact.nom}`);
    }

    // Log the interaction
    const interaction = new LeadInteraction({
      entrepriseId: company._id,
      contactId: contact._id,
      typeInteraction: 'CREATION',
      description: `Demande de demo depuis le site marketing${body.source ? ` (${body.source})` : ''}${body.portalType ? ` - Portail: ${body.portalType}` : ''}`,
      metadata: {
        source: body.source || 'website',
        portalType: body.portalType,
        message: body.message,
        isNewCompany,
        isNewContact,
        requestDate: new Date().toISOString()
      },
      createdBy: 'website-form'
    });

    await interaction.save();

    // If there's a message, log it as a note
    if (body.message) {
      const noteInteraction = new LeadInteraction({
        entrepriseId: company._id,
        contactId: contact._id,
        typeInteraction: 'NOTE',
        description: `Message du formulaire: ${body.message}`,
        createdBy: 'website-form'
      });
      await noteInteraction.save();
    }

    logger.info(`Demo request processed successfully: ${company.numeroLead} - ${contact.email}`);

    res.status(201).json({
      success: true,
      message: 'Demande de demo enregistree avec succes',
      data: {
        leadNumber: company.numeroLead,
        companyName: company.raisonSociale,
        contactName: `${contact.prenom} ${contact.nom}`,
        isNewLead: isNewCompany
      }
    });

  } catch (error: any) {
    logger.error('Error processing demo request', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors de l\'enregistrement de votre demande'
    });
  }
});

/**
 * POST /api/v1/public/contact
 * Generic contact form submission (redirects to demo-request logic)
 */
router.post('/contact', async (req: Request, res: Response) => {
  // Add source if not present
  req.body.source = req.body.source || 'contact-page';

  // Forward to demo-request handler
  return router.handle(req, res, () => {});
});

// Helper functions

function mapPortalToSector(portalType?: string): string {
  const sectorMap: Record<string, string> = {
    'industry': 'Industrie / Manufacturing',
    'transporter': 'Transport routier',
    'logistician': 'Logistique / Entreposage',
    'supplier': 'Fournisseur / Distribution',
    'forwarder': 'Transit / Freight Forwarding',
    'recipient': 'Distribution / Retail'
  };
  return portalType ? sectorMap[portalType] || 'Autre' : 'Non specifie';
}

function guessSeniority(position?: string): 'director' | 'vp' | 'manager' | 'senior' | 'entry' | 'unknown' {
  if (!position) return 'unknown';

  const posLower = position.toLowerCase();

  if (posLower.includes('directeur') || posLower.includes('director') || posLower.includes('dg') || posLower.includes('pdg') || posLower.includes('ceo') || posLower.includes('cto') || posLower.includes('cfo')) {
    return 'director';
  }
  if (posLower.includes('vp') || posLower.includes('vice') || posLower.includes('president')) {
    return 'vp';
  }
  if (posLower.includes('manager') || posLower.includes('responsable') || posLower.includes('chef') || posLower.includes('head')) {
    return 'manager';
  }
  if (posLower.includes('senior') || posLower.includes('lead') || posLower.includes('principal')) {
    return 'senior';
  }
  if (posLower.includes('junior') || posLower.includes('assistant') || posLower.includes('stagiaire')) {
    return 'entry';
  }

  return 'unknown';
}

export default router;
