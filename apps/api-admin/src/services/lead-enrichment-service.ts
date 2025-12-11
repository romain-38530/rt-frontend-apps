/**
 * Lead Enrichment Service
 * Enrichissement automatique des leads apres scraping
 * Recherche des contacts decideurs via Lemlist
 */

import LemlistService from './lemlist-service';
import LeadCompany from '../models/LeadCompany';
import LeadContact from '../models/LeadContact';
import LeadInteraction from '../models/LeadInteraction';

// Postes cibles pour la prospection Transport & Logistique
const TARGET_JOB_TITLES = [
  // Direction
  'Directeur General', 'CEO', 'PDG', 'Gerant',
  'Chief Operating Officer', 'COO', 'Directeur des Operations',

  // Supply Chain
  'Directeur Supply Chain', 'VP Supply Chain', 'Supply Chain Director',
  'Responsable Supply Chain', 'Supply Chain Manager',
  'Head of Supply Chain',

  // Logistique
  'Directeur Logistique', 'Logistics Director', 'VP Logistics',
  'Responsable Logistique', 'Logistics Manager',
  'Head of Logistics', 'Directeur de la Logistique',

  // Transport
  'Directeur Transport', 'Transport Director', 'Transport Manager',
  'Responsable Transport', 'Fleet Manager', 'Directeur Flotte',
  'Head of Transport', 'Responsable des Transports',

  // Achats
  'Directeur des Achats', 'Purchasing Director', 'Procurement Director',
  'Responsable Achats', 'Procurement Manager', 'Acheteur Senior',
  'Head of Procurement', 'Chief Procurement Officer',

  // Operations
  'Directeur des Operations', 'Operations Director', 'Operations Manager',
  'Responsable des Operations', 'Head of Operations',
  'Directeur d\'Exploitation', 'Responsable Exploitation'
];

interface EnrichmentResult {
  companyId: string;
  companyName: string;
  contactsFound: number;
  contactsCreated: number;
  errors: string[];
  duration: number;
}

interface BulkEnrichmentResult {
  totalCompanies: number;
  totalContactsFound: number;
  totalContactsCreated: number;
  results: EnrichmentResult[];
  errors: string[];
  duration: number;
}

class LeadEnrichmentService {
  /**
   * Enrichir une entreprise - trouver les contacts decideurs
   */
  async enrichCompany(companyId: string): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let contactsFound = 0;
    let contactsCreated = 0;

    try {
      const company = await LeadCompany.findById(companyId);
      if (!company) {
        throw new Error('Entreprise non trouvee');
      }

      const domain = this.extractDomain(company.siteWeb);
      if (!domain) {
        throw new Error('Domaine web non disponible pour cette entreprise');
      }

      console.log(`[LeadEnrichment] Enriching ${company.raisonSociale} (${domain})`);

      // Rechercher des contacts via Lemlist
      const { contacts } = await LemlistService.enrichCompany(domain);
      contactsFound = contacts.length;

      // Filtrer les contacts avec des postes pertinents
      const relevantContacts = contacts.filter(contact => {
        if (!contact.position) return false;
        const positionLower = contact.position.toLowerCase();
        return TARGET_JOB_TITLES.some(title =>
          positionLower.includes(title.toLowerCase())
        );
      });

      // Creer les contacts en base
      for (const contact of relevantContacts) {
        try {
          // Verifier si le contact existe deja
          const existingContact = await LeadContact.findOne({
            $or: [
              { email: contact.email },
              {
                entrepriseId: company._id,
                prenom: contact.firstName,
                nom: contact.lastName
              }
            ]
          });

          if (!existingContact && contact.email) {
            await LeadContact.create({
              entrepriseId: company._id,
              prenom: contact.firstName,
              nom: contact.lastName,
              email: contact.email,
              emailStatus: LemlistService.mapEmailStatus(contact.enrichmentStatus),
              telephone: contact.phone,
              linkedin: contact.linkedinUrl,
              poste: contact.position,
              seniority: LemlistService.mapSeniority(contact.position),
              sourceEnrichissement: 'LEMLIST',
              statutContact: 'NEW',
              scoreLead: this.calculateContactScore(contact)
            });
            contactsCreated++;
          }
        } catch (e: any) {
          errors.push(`Contact ${contact.email}: ${e.message}`);
        }
      }

      // Mettre a jour l'entreprise
      await LeadCompany.findByIdAndUpdate(companyId, {
        dateEnrichissement: new Date(),
        statutProspection: contactsCreated > 0 ? 'ENRICHED' : company.statutProspection,
        nbContactsEnrichis: (company.nbContactsEnrichis || 0) + contactsCreated
      });

      // Logger l'interaction
      await LeadInteraction.create({
        entrepriseId: company._id,
        typeInteraction: 'ENRICHMENT',
        description: `Enrichissement Lemlist: ${contactsFound} contacts trouves, ${contactsCreated} crees`,
        metadata: {
          domain,
          contactsFound,
          contactsCreated,
          duration: Date.now() - startTime
        },
        createdBy: 'system'
      });

      return {
        companyId,
        companyName: company.raisonSociale,
        contactsFound,
        contactsCreated,
        errors,
        duration: Date.now() - startTime
      };

    } catch (error: any) {
      errors.push(error.message);
      return {
        companyId,
        companyName: '',
        contactsFound,
        contactsCreated,
        errors,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Enrichir toutes les entreprises d'un salon
   */
  async enrichSalonCompanies(salonId: string, limit: number = 50): Promise<BulkEnrichmentResult> {
    const startTime = Date.now();
    const results: EnrichmentResult[] = [];
    const errors: string[] = [];

    try {
      // Recuperer les entreprises non enrichies du salon
      const companies = await LeadCompany.find({
        salonSourceId: salonId,
        siteWeb: { $exists: true, $ne: '' },
        $or: [
          { dateEnrichissement: { $exists: false } },
          { dateEnrichissement: null }
        ]
      }).limit(limit);

      console.log(`[LeadEnrichment] Found ${companies.length} companies to enrich for salon ${salonId}`);

      for (const company of companies) {
        try {
          const result = await this.enrichCompany(company._id.toString());
          results.push(result);

          // Delai pour eviter le rate limiting
          await new Promise(r => setTimeout(r, 2000));
        } catch (e: any) {
          errors.push(`${company.raisonSociale}: ${e.message}`);
        }
      }

    } catch (error: any) {
      errors.push(error.message);
    }

    const totalContactsFound = results.reduce((sum, r) => sum + r.contactsFound, 0);
    const totalContactsCreated = results.reduce((sum, r) => sum + r.contactsCreated, 0);

    return {
      totalCompanies: results.length,
      totalContactsFound,
      totalContactsCreated,
      results,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Enrichir les entreprises nouvellement scrapees (sans contacts)
   */
  async enrichNewCompanies(limit: number = 20): Promise<BulkEnrichmentResult> {
    const startTime = Date.now();
    const results: EnrichmentResult[] = [];
    const errors: string[] = [];

    try {
      // Trouver les entreprises avec site web mais sans enrichissement
      const companies = await LeadCompany.find({
        siteWeb: { $exists: true, $ne: '' },
        statutProspection: 'NEW',
        $or: [
          { dateEnrichissement: { $exists: false } },
          { dateEnrichissement: null }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit);

      console.log(`[LeadEnrichment] Found ${companies.length} new companies to enrich`);

      for (const company of companies) {
        try {
          const result = await this.enrichCompany(company._id.toString());
          results.push(result);
          await new Promise(r => setTimeout(r, 2000));
        } catch (e: any) {
          errors.push(`${company.raisonSociale}: ${e.message}`);
        }
      }

    } catch (error: any) {
      errors.push(error.message);
    }

    const totalContactsFound = results.reduce((sum, r) => sum + r.contactsFound, 0);
    const totalContactsCreated = results.reduce((sum, r) => sum + r.contactsCreated, 0);

    return {
      totalCompanies: results.length,
      totalContactsFound,
      totalContactsCreated,
      results,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Workflow automatique: Scraping -> Enrichissement
   * Lance apres un scraping reussi
   */
  async postScrapingEnrichment(salonId: string, maxCompanies: number = 30): Promise<{
    enrichmentStarted: boolean;
    message: string;
  }> {
    try {
      // Verifier qu'il y a des entreprises a enrichir
      const count = await LeadCompany.countDocuments({
        salonSourceId: salonId,
        siteWeb: { $exists: true, $ne: '' },
        dateEnrichissement: { $exists: false }
      });

      if (count === 0) {
        return {
          enrichmentStarted: false,
          message: 'Aucune entreprise a enrichir (pas de site web ou deja enrichies)'
        };
      }

      // Lancer l'enrichissement en arriere-plan
      // Note: Dans un vrai environnement, utiliser une queue (Bull, etc.)
      setImmediate(async () => {
        try {
          const result = await this.enrichSalonCompanies(salonId, maxCompanies);
          console.log(`[LeadEnrichment] Post-scraping enrichment completed:`, result);
        } catch (e) {
          console.error('[LeadEnrichment] Post-scraping enrichment failed:', e);
        }
      });

      return {
        enrichmentStarted: true,
        message: `Enrichissement lance pour ${Math.min(count, maxCompanies)} entreprises`
      };

    } catch (error: any) {
      return {
        enrichmentStarted: false,
        message: error.message
      };
    }
  }

  /**
   * Extraire le domaine depuis une URL ou site web
   */
  private extractDomain(siteWeb?: string): string | null {
    if (!siteWeb) return null;
    try {
      const url = siteWeb.startsWith('http') ? siteWeb : `https://${siteWeb}`;
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return siteWeb.replace('www.', '').split('/')[0];
    }
  }

  /**
   * Calculer le score d'un contact
   */
  private calculateContactScore(contact: any): number {
    let score = 50; // Base

    // Bonus pour email valide
    if (contact.enrichmentStatus === 'valid') score += 20;
    else if (contact.enrichmentStatus === 'risky') score += 5;

    // Bonus pour poste de direction
    const positionLower = (contact.position || '').toLowerCase();
    if (positionLower.includes('directeur') || positionLower.includes('director') || positionLower.includes('chief')) {
      score += 20;
    } else if (positionLower.includes('responsable') || positionLower.includes('manager') || positionLower.includes('head')) {
      score += 10;
    }

    // Bonus pour LinkedIn
    if (contact.linkedinUrl) score += 5;

    // Bonus pour telephone
    if (contact.phone) score += 5;

    return Math.min(score, 100);
  }
}

export default new LeadEnrichmentService();
export { EnrichmentResult, BulkEnrichmentResult, TARGET_JOB_TITLES };
