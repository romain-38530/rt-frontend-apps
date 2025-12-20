/**
 * Odoo API Service
 * Connexion a Odoo via JSON-RPC
 */

interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password: string;
}

interface OdooSearchParams {
  model: string;
  domain?: any[];
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
}

interface OdooCreateParams {
  model: string;
  values: Record<string, any>;
}

interface OdooUpdateParams {
  model: string;
  ids: number[];
  values: Record<string, any>;
}

class OdooService {
  private config: OdooConfig;
  private uid: number | null = null;

  constructor() {
    this.config = {
      url: process.env.ODOO_URL || '',
      db: process.env.ODOO_DB || '',
      username: process.env.ODOO_USERNAME || '',
      password: process.env.ODOO_PASSWORD || ''
    };

    if (this.isConfigured()) {
      console.log(`[OdooService] Configured for ${this.config.url} (db: ${this.config.db})`);
    } else {
      console.warn('[OdooService] Not configured - set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD');
    }
  }

  /**
   * Verifier si le service est configure
   */
  isConfigured(): boolean {
    return !!(this.config.url && this.config.db && this.config.username && this.config.password);
  }

  /**
   * Appel JSON-RPC generique
   */
  private async jsonRpc(endpoint: string, method: string, params: any): Promise<any> {
    const url = `${this.config.url}${endpoint}`;

    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: method === 'authenticate' ? 'common' : 'object',
        method: method,
        args: params
      },
      id: Date.now()
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.data?.message || data.error.message || 'Erreur Odoo');
      }

      return data.result;
    } catch (error: any) {
      console.error('[OdooService] RPC Error:', error.message);
      throw error;
    }
  }

  /**
   * Authentification - obtenir l'UID utilisateur
   */
  async authenticate(): Promise<number> {
    if (!this.isConfigured()) {
      throw new Error('Odoo non configure');
    }

    if (this.uid) {
      return this.uid;
    }

    const result = await this.jsonRpc('/jsonrpc', 'authenticate', [
      this.config.db,
      this.config.username,
      this.config.password,
      {}
    ]);

    if (!result) {
      throw new Error('Authentification Odoo echouee - verifiez les credentials');
    }

    this.uid = result;
    console.log(`[OdooService] Authenticated as UID ${this.uid}`);
    return this.uid as number;
  }

  /**
   * Executer une methode sur un modele Odoo
   */
  private async execute(model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
    const uid = await this.authenticate();

    return this.jsonRpc('/jsonrpc', 'execute_kw', [
      this.config.db,
      uid,
      this.config.password,
      model,
      method,
      args,
      kwargs
    ]);
  }

  /**
   * Rechercher des enregistrements
   */
  async search(params: OdooSearchParams): Promise<number[]> {
    const { model, domain = [], limit, offset, order } = params;

    const kwargs: any = {};
    if (limit) kwargs.limit = limit;
    if (offset) kwargs.offset = offset;
    if (order) kwargs.order = order;

    return this.execute(model, 'search', [domain], kwargs);
  }

  /**
   * Lire des enregistrements par IDs
   */
  async read(model: string, ids: number[], fields?: string[]): Promise<any[]> {
    const kwargs: any = {};
    if (fields) kwargs.fields = fields;

    return this.execute(model, 'read', [ids], kwargs);
  }

  /**
   * Rechercher et lire en une seule requete
   */
  async searchRead(params: OdooSearchParams): Promise<any[]> {
    const { model, domain = [], fields, limit, offset, order } = params;

    const kwargs: any = {};
    if (fields) kwargs.fields = fields;
    if (limit) kwargs.limit = limit;
    if (offset) kwargs.offset = offset;
    if (order) kwargs.order = order;

    return this.execute(model, 'search_read', [domain], kwargs);
  }

  /**
   * Creer un enregistrement
   */
  async create(params: OdooCreateParams): Promise<number> {
    const { model, values } = params;
    return this.execute(model, 'create', [values]);
  }

  /**
   * Mettre a jour des enregistrements
   */
  async update(params: OdooUpdateParams): Promise<boolean> {
    const { model, ids, values } = params;
    return this.execute(model, 'write', [ids, values]);
  }

  /**
   * Supprimer des enregistrements
   */
  async delete(model: string, ids: number[]): Promise<boolean> {
    return this.execute(model, 'unlink', [ids]);
  }

  /**
   * Compter les enregistrements
   */
  async count(model: string, domain: any[] = []): Promise<number> {
    return this.execute(model, 'search_count', [domain]);
  }

  // ==================== METHODES METIER ====================

  /**
   * Recuperer les clients (res.partner)
   * Note: Utilise is_company=true et customer=true (ou active=true) pour compatibilite Odoo 12+
   */
  async getCustomers(options: { limit?: number; offset?: number; search?: string } = {}): Promise<any[]> {
    // Filtre de base: entreprises actives
    const domain: any[] = [['is_company', '=', true], ['active', '=', true]];

    if (options.search) {
      domain.push('|', '|');
      domain.push(['name', 'ilike', options.search]);
      domain.push(['email', 'ilike', options.search]);
      domain.push(['phone', 'ilike', options.search]);
    }

    return this.searchRead({
      model: 'res.partner',
      domain,
      fields: ['id', 'name', 'email', 'phone', 'street', 'city', 'zip', 'country_id', 'vat', 'website'],
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: 'name asc'
    });
  }

  /**
   * Recuperer les produits (product.product)
   */
  async getProducts(options: { limit?: number; offset?: number; search?: string; active?: boolean } = {}): Promise<any[]> {
    const domain: any[] = [];

    if (options.active !== undefined) {
      domain.push(['active', '=', options.active]);
    }

    if (options.search) {
      domain.push('|');
      domain.push(['name', 'ilike', options.search]);
      domain.push(['default_code', 'ilike', options.search]);
    }

    return this.searchRead({
      model: 'product.product',
      domain,
      fields: ['id', 'name', 'default_code', 'list_price', 'standard_price', 'qty_available', 'categ_id', 'active'],
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: 'name asc'
    });
  }

  /**
   * Recuperer les commandes de vente (sale.order)
   */
  async getSaleOrders(options: { limit?: number; offset?: number; state?: string; partnerId?: number } = {}): Promise<any[]> {
    const domain: any[] = [];

    if (options.state) {
      domain.push(['state', '=', options.state]);
    }

    if (options.partnerId) {
      domain.push(['partner_id', '=', options.partnerId]);
    }

    return this.searchRead({
      model: 'sale.order',
      domain,
      fields: ['id', 'name', 'partner_id', 'date_order', 'state', 'amount_total', 'currency_id', 'user_id'],
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: 'date_order desc'
    });
  }

  /**
   * Recuperer les factures (account.move)
   */
  async getInvoices(options: { limit?: number; offset?: number; state?: string; partnerId?: number } = {}): Promise<any[]> {
    const domain: any[] = [['move_type', 'in', ['out_invoice', 'out_refund']]];

    if (options.state) {
      domain.push(['state', '=', options.state]);
    }

    if (options.partnerId) {
      domain.push(['partner_id', '=', options.partnerId]);
    }

    return this.searchRead({
      model: 'account.move',
      domain,
      fields: ['id', 'name', 'partner_id', 'invoice_date', 'state', 'amount_total', 'amount_residual', 'currency_id'],
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: 'invoice_date desc'
    });
  }

  /**
   * Creer un client dans Odoo
   */
  async createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    zip?: string;
    countryCode?: string;
    vat?: string;
    website?: string;
  }): Promise<number> {
    const values: any = {
      name: data.name,
      is_company: true,
      customer: true // Compatible Odoo 12+
    };

    if (data.email) values.email = data.email;
    if (data.phone) values.phone = data.phone;
    if (data.street) values.street = data.street;
    if (data.city) values.city = data.city;
    if (data.zip) values.zip = data.zip;
    if (data.vat) values.vat = data.vat;
    if (data.website) values.website = data.website;

    // Chercher le pays par code si fourni
    if (data.countryCode) {
      const countries = await this.searchRead({
        model: 'res.country',
        domain: [['code', '=', data.countryCode.toUpperCase()]],
        fields: ['id'],
        limit: 1
      });
      if (countries.length > 0) {
        values.country_id = countries[0].id;
      }
    }

    return this.create({ model: 'res.partner', values });
  }

  /**
   * Synchroniser un lead CRM vers Odoo
   */
  async syncLeadToOdoo(lead: {
    companyName: string;
    contactName?: string;
    email?: string;
    phone?: string;
    city?: string;
    description?: string;
  }): Promise<number> {
    // Creer une opportunite CRM dans Odoo
    const values: any = {
      name: `Lead: ${lead.companyName}`,
      partner_name: lead.companyName,
      type: 'opportunity'
    };

    if (lead.contactName) values.contact_name = lead.contactName;
    if (lead.email) values.email_from = lead.email;
    if (lead.phone) values.phone = lead.phone;
    if (lead.city) values.city = lead.city;
    if (lead.description) values.description = lead.description;

    return this.create({ model: 'crm.lead', values });
  }

  /**
   * Obtenir la configuration (sans password)
   */
  getConfig(): Record<string, unknown> {
    return {
      url: this.config.url,
      db: this.config.db,
      username: this.config.username,
      password: this.config.password ? '***configured***' : 'not set',
      configured: this.isConfigured(),
      authenticated: this.uid !== null,
      uid: this.uid
    };
  }
}

export default new OdooService();
export { OdooConfig, OdooSearchParams, OdooCreateParams, OdooUpdateParams };
