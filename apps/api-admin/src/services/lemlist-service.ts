/**
 * Lemlist API Service
 * Enrichissement de leads, validation emails, recherche contacts
 * Documentation: https://developer.lemlist.com/
 */

const LEMLIST_API_KEY = process.env.LEMLIST_API_KEY || '';
const LEMLIST_API_URL = 'https://api.lemlist.com/api';

interface LemlistEnrichRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyDomain?: string;
  linkedinUrl?: string;
  phone?: string;
}

interface LemlistEnrichResult {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  email?: string;
  emailStatus?: 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN';
  phone?: string;
  phoneStatus?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyDomain?: string;
  linkedinUrl?: string;
  jobTitle?: string;
  location?: string;
  confidence?: number;
  raw?: any;
}

interface LemlistBulkEnrichRequest {
  entities: LemlistEnrichRequest[];
}

interface LemlistLead {
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  linkedinUrl?: string;
  position?: string;
  enrichedAt?: string;
  enrichmentStatus?: string;
}

interface LemlistCampaign {
  _id: string;
  name: string;
}

class LemlistService {
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LEMLIST_API_KEY}`
    };
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!LEMLIST_API_KEY) {
      console.error('[LemlistService] API key not configured');
      return null;
    }

    try {
      const url = `${LEMLIST_API_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[LemlistService] API error ${response.status}: ${errorText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[LemlistService] Request failed:', error);
      return null;
    }
  }

  /**
   * Enrichir un lead (trouver email, telephone, infos LinkedIn)
   */
  async enrichLead(data: LemlistEnrichRequest): Promise<LemlistEnrichResult | null> {
    const result = await this.request('/enrich', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        companyDomain: data.companyDomain,
        linkedinUrl: data.linkedinUrl
      })
    });

    if (!result) return null;

    return {
      id: result.enrichId || result.id,
      status: result.status || 'pending',
      email: result.email,
      emailStatus: this.mapEmailStatus(result.emailStatus || result.email_status),
      phone: result.phone,
      phoneStatus: result.phoneStatus,
      firstName: result.firstName,
      lastName: result.lastName,
      companyName: result.companyName,
      companyDomain: result.companyDomain,
      linkedinUrl: result.linkedinUrl,
      jobTitle: result.jobTitle || result.position,
      location: result.location,
      confidence: result.confidence,
      raw: result
    };
  }

  /**
   * Enrichir en masse (jusqu'a 500 entites)
   */
  async bulkEnrich(entities: LemlistEnrichRequest[]): Promise<{ enrichId: string } | null> {
    const result = await this.request('/v2/enrichments/bulk', {
      method: 'POST',
      body: JSON.stringify({ entities })
    });

    if (!result) return null;
    return { enrichId: result.enrichId || result.id };
  }

  /**
   * Recuperer le resultat d'un enrichissement
   */
  async getEnrichmentResult(enrichId: string): Promise<LemlistEnrichResult | null> {
    const result = await this.request(`/enrich/${enrichId}`);
    if (!result) return null;

    return {
      id: enrichId,
      status: result.status || 'done',
      email: result.email,
      emailStatus: this.mapEmailStatus(result.emailStatus),
      phone: result.phone,
      firstName: result.firstName,
      lastName: result.lastName,
      companyName: result.companyName,
      companyDomain: result.companyDomain,
      linkedinUrl: result.linkedinUrl,
      jobTitle: result.jobTitle,
      confidence: result.confidence,
      raw: result
    };
  }

  /**
   * Trouver l'email d'une personne a partir de son nom et entreprise
   */
  async findEmail(firstName: string, lastName: string, companyDomain: string): Promise<{ email: string; status: string; confidence: number } | null> {
    const result = await this.enrichLead({
      firstName,
      lastName,
      companyDomain
    });

    if (!result || !result.email) return null;

    return {
      email: result.email,
      status: result.emailStatus || 'unknown',
      confidence: result.confidence || 0
    };
  }

  /**
   * Verifier un email
   */
  async verifyEmail(email: string): Promise<{ email: string; status: string; isValid: boolean } | null> {
    const result = await this.enrichLead({ email });

    if (!result) return null;

    const status = result.emailStatus || 'UNKNOWN';
    return {
      email: result.email || email,
      status,
      isValid: status === 'VALID'
    };
  }

  /**
   * Trouver des contacts dans une entreprise via le domaine
   */
  async findContactsByDomain(domain: string, jobTitles?: string[]): Promise<LemlistLead[]> {
    // Lemlist utilise l'enrichissement pour trouver des contacts
    // Pour une recherche plus complete, on peut utiliser l'API People Database
    const result = await this.request('/people-database/search', {
      method: 'POST',
      body: JSON.stringify({
        companyDomain: domain,
        jobTitles: jobTitles || [],
        limit: 50
      })
    });

    if (!result || !result.data) return [];

    return result.data.map((person: any) => ({
      email: person.email,
      firstName: person.firstName,
      lastName: person.lastName,
      companyName: person.companyName,
      phone: person.phone,
      linkedinUrl: person.linkedinUrl,
      position: person.jobTitle || person.position,
      enrichmentStatus: person.emailStatus
    }));
  }

  /**
   * Enrichir une entreprise (trouver infos + contacts cles)
   */
  async enrichCompany(domain: string): Promise<{
    company: any;
    contacts: LemlistLead[];
  }> {
    // Titres supply chain, logistique et transport pour cibler les bons contacts
    const supplyChainTitles = [
      // Anglais - Direction
      'Supply Chain Director', 'VP Supply Chain', 'Logistics Director',
      'Operations Director', 'COO', 'Transport Director', 'Fleet Director',
      'Distribution Director', 'Warehouse Director', 'Shipping Director',
      // Anglais - Management
      'Supply Chain Manager', 'Logistics Manager', 'Transport Manager',
      'Fleet Manager', 'Distribution Manager', 'Warehouse Manager',
      'Shipping Manager', 'Freight Manager', 'Procurement Director',
      'Purchasing Director', 'Operations Manager', 'Import Export Manager',
      // Francais - Direction
      'Directeur Supply Chain', 'Directeur Logistique', 'Directeur Transport',
      'Directeur des Operations', 'Directeur de Flotte', 'Directeur Distribution',
      'Directeur Entrepot', 'Directeur des Expeditions', 'Directeur Achats',
      'Directeur Import Export', 'Directeur Fret',
      // Francais - Responsable
      'Responsable Supply Chain', 'Responsable Logistique', 'Responsable Transport',
      'Responsable Flotte', 'Responsable Distribution', 'Responsable Entrepot',
      'Responsable Expeditions', 'Responsable Achats', 'Responsable Import Export',
      'Responsable Fret', 'Responsable Exploitation', 'Chef de Quai',
      // Allemand (pour pays germanophones)
      'Logistikleiter', 'Transportleiter', 'Lagerleiter', 'Supply Chain Leiter',
      // Italien
      'Direttore Logistica', 'Responsabile Logistica', 'Direttore Trasporti',
      'Responsabile Trasporti', 'Direttore Supply Chain'
    ];

    // Rechercher des contacts
    const contacts = await this.findContactsByDomain(domain, supplyChainTitles);

    // Enrichir le premier contact pour avoir des infos entreprise
    let company = null;
    if (contacts.length > 0 && contacts[0].email) {
      const enriched = await this.enrichLead({ email: contacts[0].email });
      if (enriched) {
        company = {
          name: enriched.companyName,
          domain: enriched.companyDomain || domain,
          linkedinUrl: enriched.linkedinUrl
        };
      }
    }

    return { company, contacts };
  }

  // ==================== CAMPAIGNS ====================

  /**
   * Lister les campagnes
   */
  async getCampaigns(): Promise<LemlistCampaign[]> {
    const result = await this.request('/campaigns');
    if (!result) return [];
    return result;
  }

  /**
   * Ajouter un lead a une campagne
   */
  async addLeadToCampaign(campaignId: string, lead: {
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    linkedinUrl?: string;
    customFields?: Record<string, string>;
  }): Promise<{ success: boolean; leadId?: string }> {
    const result = await this.request(`/campaigns/${campaignId}/leads/${encodeURIComponent(lead.email)}`, {
      method: 'POST',
      body: JSON.stringify({
        firstName: lead.firstName,
        lastName: lead.lastName,
        companyName: lead.companyName,
        phone: lead.phone,
        linkedinUrl: lead.linkedinUrl,
        ...lead.customFields
      })
    });

    if (!result) return { success: false };
    return { success: true, leadId: result._id };
  }

  /**
   * Mettre a jour un lead dans une campagne
   */
  async updateLeadInCampaign(campaignId: string, email: string, data: Record<string, any>): Promise<boolean> {
    const result = await this.request(`/campaigns/${campaignId}/leads/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return result !== null;
  }

  /**
   * Supprimer un lead d'une campagne
   */
  async removeLeadFromCampaign(campaignId: string, email: string): Promise<boolean> {
    const result = await this.request(`/campaigns/${campaignId}/leads/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
    return result !== null;
  }

  /**
   * Obtenir les statistiques d'un lead
   */
  async getLeadActivity(campaignId: string, email: string): Promise<any> {
    return await this.request(`/campaigns/${campaignId}/leads/${encodeURIComponent(email)}/activity`);
  }

  // ==================== UNSUBSCRIBE ====================

  /**
   * Ajouter a la liste de desabonnement
   */
  async unsubscribeEmail(email: string): Promise<boolean> {
    const result = await this.request('/unsubscribes', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return result !== null;
  }

  /**
   * Verifier si un email est desabonne
   */
  async isUnsubscribed(email: string): Promise<boolean> {
    const result = await this.request(`/unsubscribes/${encodeURIComponent(email)}`);
    return result !== null && result.unsubscribed === true;
  }

  // ==================== HELPERS ====================

  /**
   * Mapper le statut email Lemlist vers notre format
   */
  mapEmailStatus(status?: string): 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN' {
    if (!status) return 'UNKNOWN';
    const normalized = status.toLowerCase();
    if (normalized === 'valid' || normalized === 'deliverable') return 'VALID';
    if (normalized === 'invalid' || normalized === 'undeliverable' || normalized === 'bounce') return 'INVALID';
    if (normalized === 'risky' || normalized === 'catch-all' || normalized === 'accept_all') return 'RISKY';
    return 'UNKNOWN';
  }

  /**
   * Mapper la seniorite
   */
  mapSeniority(title?: string): 'director' | 'vp' | 'manager' | 'senior' | 'entry' | 'unknown' {
    if (!title) return 'unknown';
    const t = title.toLowerCase();
    if (t.includes('director') || t.includes('directeur') || t.includes('chief') || t.includes('coo') || t.includes('ceo')) return 'director';
    if (t.includes('vp') || t.includes('vice president')) return 'vp';
    if (t.includes('manager') || t.includes('responsable') || t.includes('head of')) return 'manager';
    if (t.includes('senior') || t.includes('lead')) return 'senior';
    if (t.includes('junior') || t.includes('assistant')) return 'entry';
    return 'unknown';
  }
}

export default new LemlistService();
export { LemlistEnrichRequest, LemlistEnrichResult, LemlistLead };
