/**
 * Apollo.io API Service
 * Enrichissement des entreprises et recherche de contacts
 */

const APOLLO_API_URL = 'https://api.apollo.io/v1';
const APOLLO_API_KEY = process.env.APOLLO_API_KEY || '';

// Titres de postes recherchés pour supply chain
const SUPPLY_CHAIN_TITLES = [
  'Directeur Supply Chain',
  'VP Supply Chain',
  'Chief Supply Chain Officer',
  'Directeur Logistique',
  'Directeur des Opérations',
  'COO',
  'Directeur Transport',
  'Responsable Supply Chain',
  'Responsable Logistique',
  'Responsable Transport',
  'Supply Chain Manager',
  'Logistics Manager',
  'Directeur des Achats',
  'Head of Supply Chain',
  'Head of Logistics',
  'Operations Director'
];

interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  linkedin_url?: string;
  founded_year?: number;
  industry?: string;
  estimated_num_employees?: number;
  phone?: string;
  primary_domain?: string;
  technologies?: string[];
}

interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  email: string;
  email_status: string;
  linkedin_url?: string;
  phone_numbers?: { raw_number: string; type: string }[];
  seniority: string;
  organization_id: string;
}

interface ApolloApiResponse<T> {
  organization?: T;
  people?: T[];
  pagination?: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

class ApolloService {
  private async makeRequest<T>(endpoint: string, method: string = 'GET', body?: unknown): Promise<T | null> {
    if (!APOLLO_API_KEY) {
      console.error('[ApolloService] API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${APOLLO_API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': APOLLO_API_KEY
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ApolloService] API error ${response.status}: ${errorText}`);
        return null;
      }

      return await response.json() as T;
    } catch (error) {
      console.error('[ApolloService] Request failed:', error);
      return null;
    }
  }

  /**
   * Enrichir une entreprise via son domaine web
   */
  async enrichOrganization(domain: string): Promise<ApolloOrganization | null> {
    const result = await this.makeRequest<ApolloApiResponse<ApolloOrganization>>(
      '/organizations/enrich',
      'POST',
      { domain }
    );

    return result?.organization || null;
  }

  /**
   * Rechercher des contacts dans une organisation
   */
  async searchPeople(organizationId: string, titles?: string[]): Promise<ApolloPerson[]> {
    const searchTitles = titles || SUPPLY_CHAIN_TITLES;

    const result = await this.makeRequest<ApolloApiResponse<ApolloPerson>>(
      '/people/search',
      'POST',
      {
        organization_ids: [organizationId],
        person_titles: searchTitles,
        contact_email_status: ['verified', 'guessed'],
        per_page: 25
      }
    );

    return result?.people || [];
  }

  /**
   * Rechercher une personne spécifique
   */
  async matchPerson(params: {
    firstName: string;
    lastName: string;
    organizationName?: string;
    domain?: string;
  }): Promise<ApolloPerson | null> {
    const result = await this.makeRequest<{ person: ApolloPerson }>(
      '/people/match',
      'POST',
      {
        first_name: params.firstName,
        last_name: params.lastName,
        organization_name: params.organizationName,
        domain: params.domain,
        reveal_personal_emails: false
      }
    );

    return result?.person || null;
  }

  /**
   * Enrichir une entreprise et trouver ses contacts supply chain
   */
  async enrichCompanyWithContacts(domain: string): Promise<{
    organization: ApolloOrganization | null;
    contacts: ApolloPerson[];
  }> {
    // Étape 1: Enrichir l'organisation
    const organization = await this.enrichOrganization(domain);

    if (!organization) {
      return { organization: null, contacts: [] };
    }

    // Étape 2: Rechercher les contacts
    const contacts = await this.searchPeople(organization.id);

    return { organization, contacts };
  }

  /**
   * Mapper le seniority Apollo vers notre format
   */
  mapSeniority(apolloSeniority: string): 'director' | 'vp' | 'manager' | 'senior' | 'entry' | 'unknown' {
    const seniorityMap: Record<string, 'director' | 'vp' | 'manager' | 'senior' | 'entry' | 'unknown'> = {
      'director': 'director',
      'vp': 'vp',
      'c_suite': 'director',
      'manager': 'manager',
      'senior': 'senior',
      'entry': 'entry'
    };
    return seniorityMap[apolloSeniority?.toLowerCase()] || 'unknown';
  }

  /**
   * Mapper le statut email Apollo vers notre format
   */
  mapEmailStatus(apolloStatus: string): 'VALID' | 'INVALID' | 'UNKNOWN' | 'CATCH_ALL' {
    const statusMap: Record<string, 'VALID' | 'INVALID' | 'UNKNOWN' | 'CATCH_ALL'> = {
      'verified': 'VALID',
      'guessed': 'UNKNOWN',
      'unavailable': 'INVALID',
      'bounced': 'INVALID'
    };
    return statusMap[apolloStatus?.toLowerCase()] || 'UNKNOWN';
  }
}

export default new ApolloService();
export { ApolloOrganization, ApolloPerson };
