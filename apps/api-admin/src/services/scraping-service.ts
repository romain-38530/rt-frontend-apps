/**
 * Scraping Service - Collecte des exposants de salons professionnels
 * Utilise Puppeteer pour le scraping dynamique et Cheerio pour le HTML statique
 */

import * as cheerio from 'cheerio';

// Dynamic import for puppeteer (optional dependency)
let puppeteerModule: any = null;
type Browser = any;
type Page = any;

async function loadPuppeteer(): Promise<any> {
  if (!puppeteerModule) {
    try {
      puppeteerModule = await import('puppeteer');
    } catch (e) {
      console.warn('Puppeteer not available - scraping features disabled');
      throw new Error('Puppeteer not installed. Scraping features are not available.');
    }
  }
  return puppeteerModule.default || puppeteerModule;
}

export interface ScrapedCompany {
  raisonSociale: string;
  siteWeb?: string;
  pays?: string;
  ville?: string;
  numeroStand?: string;
  secteurActivite?: string;
  descriptionActivite?: string;
  telephone?: string;
  email?: string;
  urlPageExposant?: string;
}

export interface SalonAdapter {
  name: string;
  baseUrl: string;
  scrape: (browser: Browser, config: AdapterConfig) => Promise<ScrapedCompany[]>;
}

export interface AdapterConfig {
  url: string;
  maxPages?: number;
  delay?: number;
  filters?: Record<string, string>;
}

export interface ScrapingResult {
  success: boolean;
  companies: ScrapedCompany[];
  totalScraped: number;
  errors: string[];
  duration: number;
}

class ScrapingService {
  private browser: Browser | null = null;
  private adapters: Map<string, SalonAdapter> = new Map();

  constructor() {
    // Enregistrer les adaptateurs par defaut
    this.registerAdapter(SITLAdapter);
    this.registerAdapter(TransportLogisticAdapter);
    this.registerAdapter(SIALComexposiumAdapter);
    this.registerAdapter(GenericExhibitorAdapter);
  }

  registerAdapter(adapter: SalonAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      };

      // Use system Chrome for EB deployment
      const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';
      // Check if running on Linux (EB) - use system Chrome
      if (process.platform === 'linux') {
        launchOptions.executablePath = chromePath;
        console.log(`[Scraping] Using Chrome at: ${chromePath}`);
      } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        console.log(`[Scraping] Using Chrome at: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
      }

      this.browser = await (await loadPuppeteer()).launch(launchOptions);
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeUrl(url: string, adapterName: string, config?: Partial<AdapterConfig>): Promise<ScrapingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let companies: ScrapedCompany[] = [];

    try {
      const adapter = this.adapters.get(adapterName);
      if (!adapter) {
        throw new Error(`Adapter "${adapterName}" not found. Available: ${this.getAvailableAdapters().join(', ')}`);
      }

      const browser = await this.initBrowser();
      const fullConfig: AdapterConfig = {
        url,
        maxPages: config?.maxPages || 10,
        delay: config?.delay || 2000,
        filters: config?.filters || {}
      };

      companies = await adapter.scrape(browser, fullConfig);

    } catch (error: any) {
      errors.push(error.message);
      console.error('[ScrapingService] Error:', error.message);
    }

    return {
      success: errors.length === 0,
      companies,
      totalScraped: companies.length,
      errors,
      duration: Date.now() - startTime
    };
  }

  // Methode utilitaire pour extraire du texte propre
  static cleanText(text: string | undefined): string {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  // Methode utilitaire pour extraire un domaine depuis une URL
  static extractDomain(url: string | undefined): string | undefined {
    if (!url) return undefined;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  // Methode utilitaire pour deviner le pays depuis une ville/texte
  static guessCountry(text: string): string {
    const countryPatterns: Record<string, RegExp[]> = {
      'FR': [/france/i, /paris/i, /lyon/i, /marseille/i, /toulouse/i, /bordeaux/i, /nantes/i, /lille/i],
      'DE': [/germany|allemagne|deutschland/i, /berlin/i, /munich|munchen/i, /hamburg/i, /frankfurt/i],
      'ES': [/spain|espagne|espana/i, /madrid/i, /barcelona/i, /valencia/i],
      'IT': [/italy|italie|italia/i, /roma|rome/i, /milan/i, /napoli/i],
      'GB': [/united kingdom|uk|royaume-uni/i, /london/i, /manchester/i, /birmingham/i],
      'NL': [/netherlands|pays-bas|nederland/i, /amsterdam/i, /rotterdam/i],
      'BE': [/belgium|belgique|belgie/i, /brussels|bruxelles/i, /antwerp/i],
      'CH': [/switzerland|suisse|schweiz/i, /zurich/i, /geneva|geneve/i, /basel/i],
      'PL': [/poland|pologne|polska/i, /warsaw|varsovie/i, /krakow/i],
      'AT': [/austria|autriche/i, /vienna|vienne|wien/i]
    };

    for (const [code, patterns] of Object.entries(countryPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) return code;
      }
    }
    return 'FR'; // Default
  }
}

// ==================== ADAPTATEURS ====================

/**
 * Adaptateur SITL (Salon International du Transport et de la Logistique)
 */
const SITLAdapter: SalonAdapter = {
  name: 'SITL',
  baseUrl: 'https://www.sitl.eu',

  async scrape(browser: Browser, config: AdapterConfig): Promise<ScrapedCompany[]> {
    const companies: ScrapedCompany[] = [];
    const page = await browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Attendre le chargement de la liste
      await page.waitForSelector('.exhibitor-item, .company-card, [class*="exhibitor"]', { timeout: 10000 }).catch(() => {});

      let currentPage = 1;
      const maxPages = config.maxPages || 10;

      while (currentPage <= maxPages) {
        console.log(`[SITL] Scraping page ${currentPage}...`);

        // Extraire les exposants de la page courante
        const pageCompanies = await page.evaluate(() => {
          const items: any[] = [];
          const selectors = [
            '.exhibitor-item',
            '.company-card',
            '[class*="exhibitor-list"] > div',
            '.list-exhibitors .item'
          ];

          let elements: Element[] = [];
          for (const selector of selectors) {
            elements = Array.from(document.querySelectorAll(selector));
            if (elements.length > 0) break;
          }

          elements.forEach(el => {
            const nameEl = el.querySelector('h3, h4, .name, .company-name, [class*="title"]');
            const linkEl = el.querySelector('a[href*="exhibitor"], a[href*="exposant"]') as HTMLAnchorElement;
            const standEl = el.querySelector('.stand, .booth, [class*="stand"]');
            const countryEl = el.querySelector('.country, .location, [class*="country"]');

            if (nameEl?.textContent) {
              items.push({
                raisonSociale: nameEl.textContent.trim(),
                urlPageExposant: linkEl?.href || undefined,
                numeroStand: standEl?.textContent?.trim() || undefined,
                pays: countryEl?.textContent?.trim() || undefined
              });
            }
          });

          return items;
        });

        companies.push(...pageCompanies);

        // Pagination - chercher le bouton suivant
        const hasNextPage = await page.evaluate(() => {
          const nextBtn = document.querySelector('a.next, button.next, [class*="pagination"] a:last-child, .pagination .next');
          if (nextBtn && !nextBtn.classList.contains('disabled')) {
            (nextBtn as HTMLElement).click();
            return true;
          }
          return false;
        });

        if (!hasNextPage) break;

        currentPage++;
        await new Promise(r => setTimeout(r, config.delay || 2000));
      }

      // Enrichir avec les pages de detail si disponibles
      for (const company of companies.slice(0, 50)) { // Limiter pour eviter trop de requetes
        if (company.urlPageExposant) {
          try {
            await page.goto(company.urlPageExposant, { waitUntil: 'networkidle2', timeout: 15000 });
            const details = await page.evaluate(() => {
              const website = document.querySelector('a[href*="http"]:not([href*="sitl"]):not([href*="linkedin"]):not([href*="facebook"])') as HTMLAnchorElement;
              const description = document.querySelector('.description, .about, [class*="description"]');
              const sector = document.querySelector('.sector, .category, [class*="sector"]');

              return {
                siteWeb: website?.href || undefined,
                descriptionActivite: description?.textContent?.trim().substring(0, 500) || undefined,
                secteurActivite: sector?.textContent?.trim() || undefined
              };
            });

            Object.assign(company, details);
            await new Promise(r => setTimeout(r, 1000));
          } catch (e) {
            // Ignorer les erreurs de detail
          }
        }
      }

    } catch (error: any) {
      console.error('[SITL Adapter] Error:', error.message);
    } finally {
      await page.close();
    }

    return companies;
  }
};

/**
 * Adaptateur Transport Logistic Munich
 */
const TransportLogisticAdapter: SalonAdapter = {
  name: 'TransportLogistic',
  baseUrl: 'https://transportlogistic.de',

  async scrape(browser: Browser, config: AdapterConfig): Promise<ScrapedCompany[]> {
    const companies: ScrapedCompany[] = [];
    const page = await browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('.exhibitor, .company, [class*="aussteller"]', { timeout: 10000 }).catch(() => {});

      const pageCompanies = await page.evaluate(() => {
        const items: any[] = [];
        const elements = document.querySelectorAll('.exhibitor-item, .company-item, [class*="aussteller"]');

        elements.forEach(el => {
          const name = el.querySelector('h3, h4, .name, .title')?.textContent?.trim();
          const link = (el.querySelector('a') as HTMLAnchorElement)?.href;
          const stand = el.querySelector('.stand, .hall, [class*="stand"]')?.textContent?.trim();
          const country = el.querySelector('.country, [class*="country"]')?.textContent?.trim();

          if (name) {
            items.push({
              raisonSociale: name,
              urlPageExposant: link,
              numeroStand: stand,
              pays: country || 'DE'
            });
          }
        });

        return items;
      });

      companies.push(...pageCompanies);

    } catch (error: any) {
      console.error('[TransportLogistic Adapter] Error:', error.message);
    } finally {
      await page.close();
    }

    return companies;
  }
};

/**
 * Adaptateur SIAL / Comexposium
 * Sites avec catalogue d'exposants dynamique (React)
 */
const SIALComexposiumAdapter: SalonAdapter = {
  name: 'SIAL',
  baseUrl: 'https://www.sialparis.com',

  async scrape(browser: Browser, config: AdapterConfig): Promise<ScrapedCompany[]> {
    const companies: ScrapedCompany[] = [];
    const page = await browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      console.log('[SIAL] Loading page:', config.url);
      await page.goto(config.url, { waitUntil: 'networkidle0', timeout: 60000 });

      // Attendre que le catalogue charge (jusqu'a 20 secondes)
      console.log('[SIAL] Waiting for exhibitor cards...');
      await page.waitForSelector('[class*="ExhibitorCard"], [class*="exhibitor-card"], [class*="CardExhibitor"], a[href*="/Exposant/"]', { timeout: 20000 }).catch(() => {
        console.log('[SIAL] No exhibitor cards found, trying alternative selectors');
      });

      // Attendre encore un peu pour le chargement complet
      await new Promise(r => setTimeout(r, 5000));

      let currentPage = 1;
      const maxPages = config.maxPages || 10;

      while (currentPage <= maxPages) {
        console.log(`[SIAL] Scraping page ${currentPage}...`);

        // Extraire les exposants
        const pageCompanies = await page.evaluate(() => {
          const items: any[] = [];

          // Selecteurs specifiques Comexposium
          const selectors = [
            '[class*="ExhibitorCard"]',
            '[class*="exhibitor-card"]',
            '[class*="CardExhibitor"]',
            'a[href*="/Exposant/"]',
            '[data-testid*="exhibitor"]',
            '.exhibitor-item',
            '[class*="catalog"] [class*="card"]'
          ];

          let elements: Element[] = [];
          for (const selector of selectors) {
            elements = Array.from(document.querySelectorAll(selector));
            console.log(`[SIAL] Selector ${selector}: ${elements.length} elements`);
            if (elements.length > 0) break;
          }

          elements.forEach(el => {
            // Chercher le nom
            const nameEl = el.querySelector('h3, h4, h5, [class*="title"], [class*="name"], span[class*="Title"]') ||
                          (el.tagName === 'A' ? el : null);
            const name = nameEl?.textContent?.trim();

            // Chercher le lien
            const linkEl = el.tagName === 'A' ? el as HTMLAnchorElement :
                          el.querySelector('a[href*="Exposant"], a[href*="exposant"]') as HTMLAnchorElement;
            const href = linkEl?.href;

            // Chercher le stand
            const standEl = el.querySelector('[class*="stand"], [class*="booth"], [class*="Stand"]');
            const stand = standEl?.textContent?.trim();

            // Chercher le pays
            const countryEl = el.querySelector('[class*="country"], [class*="Country"], [class*="location"]');
            const country = countryEl?.textContent?.trim();

            if (name && name.length > 2 && name.length < 200 && !name.toLowerCase().includes('exposant')) {
              items.push({
                raisonSociale: name.replace(/\s+/g, ' ').trim(),
                urlPageExposant: href || undefined,
                numeroStand: stand || undefined,
                pays: country || 'FR'
              });
            }
          });

          return items;
        });

        console.log(`[SIAL] Found ${pageCompanies.length} companies on page ${currentPage}`);
        companies.push(...pageCompanies);

        // Pagination - charger plus de resultats
        const hasMore = await page.evaluate(() => {
          const loadMoreBtn = document.querySelector('[class*="loadMore"], button[class*="more"], [class*="pagination"] button:not([disabled])');
          if (loadMoreBtn) {
            (loadMoreBtn as HTMLElement).click();
            return true;
          }
          // Scroll infini
          const scrollHeight = document.documentElement.scrollHeight;
          window.scrollTo(0, scrollHeight);
          return document.documentElement.scrollHeight > scrollHeight;
        });

        if (!hasMore || pageCompanies.length === 0) break;

        currentPage++;
        await new Promise(r => setTimeout(r, 3000));
      }

    } catch (error: any) {
      console.error('[SIAL Adapter] Error:', error.message);
    } finally {
      await page.close();
    }

    // Dedupliquer
    const seen = new Set<string>();
    return companies.filter(c => {
      const key = c.raisonSociale.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

/**
 * Adaptateur Generique - Pour les sites avec structure standard
 */
const GenericExhibitorAdapter: SalonAdapter = {
  name: 'Generic',
  baseUrl: '',

  async scrape(browser: Browser, config: AdapterConfig): Promise<ScrapedCompany[]> {
    const companies: ScrapedCompany[] = [];
    const page = await browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      console.log('[Generic] Loading page:', config.url);
      await page.goto(config.url, { waitUntil: 'networkidle0', timeout: 60000 });

      // Attendre plus longtemps pour les SPA
      await new Promise(r => setTimeout(r, 8000));

      // Recuperer tout le HTML et parser avec Cheerio
      const html = await page.content();
      const $ = cheerio.load(html);

      // Chercher les listes d'exposants avec divers selecteurs
      const selectors = [
        '.exhibitor-list .item',
        '.exhibitors-list li',
        '.company-list .company',
        '[class*="exhibitor"] [class*="item"]',
        'table.exhibitors tr',
        '.list-group-item',
        '.card',
        'article'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 5) { // Au moins 5 elements pour etre pertinent
          elements.each((_, el) => {
            const $el = $(el);
            const name = $el.find('h3, h4, h5, .name, .title, strong').first().text().trim();
            const link = $el.find('a').first().attr('href');
            const stand = $el.find('[class*="stand"], [class*="booth"]').text().trim();
            const website = $el.find('a[href^="http"]:not([href*="linkedin"]):not([href*="facebook"])').attr('href');
            const description = $el.find('p, .description').first().text().trim();

            if (name && name.length > 2 && name.length < 200) {
              companies.push({
                raisonSociale: ScrapingService.cleanText(name),
                siteWeb: website ? ScrapingService.extractDomain(website) : undefined,
                numeroStand: stand || undefined,
                descriptionActivite: description?.substring(0, 300) || undefined,
                urlPageExposant: link?.startsWith('http') ? link : (link ? new URL(link, config.url).href : undefined)
              });
            }
          });

          if (companies.length > 0) break;
        }
      }

      // Si aucun resultat avec les selecteurs, essayer une approche plus aggressive
      if (companies.length === 0) {
        // Chercher tous les liens qui ressemblent a des entreprises
        $('a').each((_, el) => {
          const $el = $(el);
          const text = $el.text().trim();
          const href = $el.attr('href');

          // Filtrer les liens qui ressemblent a des noms d'entreprises
          if (text.length > 3 && text.length < 100 &&
              !text.includes('@') &&
              !/^(home|contact|about|menu|login|register)/i.test(text) &&
              href && (href.includes('exhibitor') || href.includes('exposant') || href.includes('company'))) {
            companies.push({
              raisonSociale: ScrapingService.cleanText(text),
              urlPageExposant: href.startsWith('http') ? href : new URL(href, config.url).href
            });
          }
        });
      }

    } catch (error: any) {
      console.error('[Generic Adapter] Error:', error.message);
    } finally {
      await page.close();
    }

    // Dedupliquer par nom
    const seen = new Set<string>();
    return companies.filter(c => {
      const key = c.raisonSociale.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

export default new ScrapingService();
export { ScrapingService };
