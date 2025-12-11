/**
 * Hunter.io API Service
 * Recherche et validation d'emails
 */

const HUNTER_API_URL = 'https://api.hunter.io/v2';
const HUNTER_API_KEY = process.env.HUNTER_API_KEY || '';

interface HunterEmail {
  value: string;
  type: 'personal' | 'generic';
  confidence: number;
  first_name?: string;
  last_name?: string;
  position?: string;
  seniority?: string;
  department?: string;
  linkedin?: string;
  phone_number?: string;
  verification?: {
    date: string;
    status: string;
  };
}

interface HunterDomainSearchResult {
  domain: string;
  disposable: boolean;
  webmail: boolean;
  accept_all: boolean;
  pattern?: string;
  organization?: string;
  emails: HunterEmail[];
}

interface HunterVerifyResult {
  status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown';
  result: string;
  score: number;
  email: string;
  regexp: boolean;
  gibberish: boolean;
  disposable: boolean;
  webmail: boolean;
  mx_records: boolean;
  smtp_server: boolean;
  smtp_check: boolean;
  accept_all: boolean;
  block: boolean;
}

interface HunterEmailFinderResult {
  email: string;
  score: number;
  domain: string;
  accept_all: boolean;
  position?: string;
  company?: string;
  first_name: string;
  last_name: string;
  verification?: {
    date: string;
    status: string;
  };
}

class HunterService {
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!HUNTER_API_KEY) {
      console.error('[HunterService] API key not configured');
      return null;
    }

    try {
      const url = new URL(`${HUNTER_API_URL}${endpoint}`);
      url.searchParams.set('api_key', HUNTER_API_KEY);

      for (const [key, value] of Object.entries(params)) {
        if (value) url.searchParams.set(key, value);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[HunterService] API error ${response.status}: ${errorText}`);
        return null;
      }

      const result = await response.json();
      return result.data as T;
    } catch (error) {
      console.error('[HunterService] Request failed:', error);
      return null;
    }
  }

  /**
   * Rechercher tous les emails d'un domaine
   */
  async domainSearch(domain: string, options?: {
    department?: string;
    seniority?: string;
    limit?: number;
  }): Promise<HunterDomainSearchResult | null> {
    const params: Record<string, string> = { domain };

    if (options?.department) params.department = options.department;
    if (options?.seniority) params.seniority = options.seniority;
    if (options?.limit) params.limit = String(options.limit);

    return this.makeRequest<HunterDomainSearchResult>('/domain-search', params);
  }

  /**
   * Vérifier la validité d'un email
   */
  async verifyEmail(email: string): Promise<HunterVerifyResult | null> {
    return this.makeRequest<HunterVerifyResult>('/email-verifier', { email });
  }

  /**
   * Trouver l'email d'une personne à partir de son nom et domaine
   */
  async findEmail(params: {
    domain: string;
    firstName: string;
    lastName: string;
    company?: string;
  }): Promise<HunterEmailFinderResult | null> {
    const queryParams: Record<string, string> = {
      domain: params.domain,
      first_name: params.firstName,
      last_name: params.lastName
    };

    if (params.company) queryParams.company = params.company;

    return this.makeRequest<HunterEmailFinderResult>('/email-finder', queryParams);
  }

  /**
   * Mapper le statut Hunter vers notre format
   */
  mapEmailStatus(hunterStatus: string): 'VALID' | 'INVALID' | 'UNKNOWN' | 'CATCH_ALL' | 'DISPOSABLE' {
    const statusMap: Record<string, 'VALID' | 'INVALID' | 'UNKNOWN' | 'CATCH_ALL' | 'DISPOSABLE'> = {
      'valid': 'VALID',
      'invalid': 'INVALID',
      'accept_all': 'CATCH_ALL',
      'webmail': 'VALID',
      'disposable': 'DISPOSABLE',
      'unknown': 'UNKNOWN'
    };
    return statusMap[hunterStatus?.toLowerCase()] || 'UNKNOWN';
  }

  /**
   * Rechercher des contacts supply chain pour un domaine
   */
  async searchSupplyChainContacts(domain: string): Promise<HunterEmail[]> {
    // Rechercher dans les départements pertinents
    const departments = ['logistics', 'operations', 'supply chain', 'procurement'];
    const allEmails: HunterEmail[] = [];

    for (const dept of departments) {
      const result = await this.domainSearch(domain, {
        department: dept,
        seniority: 'senior',
        limit: 10
      });

      if (result?.emails) {
        allEmails.push(...result.emails);
      }
    }

    // Dédupliquer par email
    const uniqueEmails = allEmails.filter((email, index, self) =>
      index === self.findIndex(e => e.value === email.value)
    );

    return uniqueEmails;
  }

  /**
   * Vérifier plusieurs emails en batch
   */
  async verifyEmailsBatch(emails: string[]): Promise<Map<string, HunterVerifyResult>> {
    const results = new Map<string, HunterVerifyResult>();

    // Hunter n'a pas d'endpoint batch, on fait les requêtes séquentiellement avec un délai
    for (const email of emails) {
      const result = await this.verifyEmail(email);
      if (result) {
        results.set(email, result);
      }
      // Respecter le rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }
}

export default new HunterService();
export { HunterEmail, HunterVerifyResult, HunterEmailFinderResult };
