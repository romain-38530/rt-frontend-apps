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
 * Sites avec catalogue d'exposants dynamique (React) - Pagination agressive
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

      // Attendre que le catalogue charge
      console.log('[SIAL] Waiting for exhibitor elements...');
      await page.waitForSelector('a[href*="/Exposant/"], a[href*="/exposant/"], [class*="exhibitor"], [class*="Exhibitor"]', { timeout: 30000 }).catch(() => {
        console.log('[SIAL] No exhibitor elements found with primary selectors');
      });

      // Attendre le chargement initial
      await new Promise(r => setTimeout(r, 5000));

      // Detecter et cliquer sur "Afficher tous" ou "Load All" s'il existe
      const showAllClicked = await page.evaluate(() => {
        const showAllBtn = document.querySelector('button[class*="showAll"], button[class*="loadAll"], [class*="show-all"], a[class*="viewAll"]');
        if (showAllBtn) {
          (showAllBtn as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (showAllClicked) {
        console.log('[SIAL] Clicked "Show All" button');
        await new Promise(r => setTimeout(r, 10000));
      }

      // Pagination agressive: scroll et click "Load More" jusqu'a plus de nouveaux resultats
      const maxScrollAttempts = config.maxPages || 100; // Augmente significativement
      let previousCount = 0;
      let noNewResultsCount = 0;

      for (let attempt = 0; attempt < maxScrollAttempts; attempt++) {
        // Compter les elements actuels
        const currentCount = await page.evaluate(() => {
          return document.querySelectorAll('a[href*="/Exposant/"], a[href*="/exposant/"]').length;
        });

        console.log(`[SIAL] Scroll attempt ${attempt + 1}: ${currentCount} exhibitors found`);

        // Si pas de nouveaux resultats apres 3 tentatives, arreter
        if (currentCount === previousCount) {
          noNewResultsCount++;
          if (noNewResultsCount >= 3) {
            console.log('[SIAL] No new results after 3 attempts, stopping');
            break;
          }
        } else {
          noNewResultsCount = 0;
          previousCount = currentCount;
        }

        // Essayer de charger plus
        await page.evaluate(() => {
          // Cliquer sur tous les boutons "Load More" / "Voir plus"
          const loadMoreButtons = document.querySelectorAll(
            'button[class*="load"], button[class*="more"], button[class*="Load"], ' +
            '[class*="pagination"] button, [class*="load-more"], [class*="voir-plus"], ' +
            'button:not([disabled])[class*="next"], a[class*="next"]:not(.disabled)'
          );
          loadMoreButtons.forEach(btn => {
            if ((btn as HTMLElement).offsetParent !== null) { // Visible
              (btn as HTMLElement).click();
            }
          });

          // Scroll au bas de la page
          window.scrollTo(0, document.documentElement.scrollHeight);
        });

        await new Promise(r => setTimeout(r, 2000)); // Attendre le chargement
      }

      // Extraire tous les exposants
      console.log('[SIAL] Extracting all exhibitors...');
      const pageCompanies = await page.evaluate(() => {
        const items: any[] = [];
        const seen = new Set<string>();

        // Chercher tous les liens vers les exposants
        const exhibitorLinks = document.querySelectorAll('a[href*="/Exposant/"], a[href*="/exposant/"]');
        console.log(`[SIAL] Found ${exhibitorLinks.length} exhibitor links`);

        exhibitorLinks.forEach(el => {
          const link = el as HTMLAnchorElement;
          const name = link.textContent?.trim() || '';

          // Aussi chercher le nom dans les elements enfants
          const nameEl = link.querySelector('h3, h4, h5, span[class*="name"], span[class*="title"], div[class*="name"]');
          const extractedName = nameEl?.textContent?.trim() || name;

          // Chercher le pays et stand dans le parent
          const parent = link.closest('[class*="card"], [class*="Card"], [class*="item"], [class*="Item"], li, article');
          const countryEl = parent?.querySelector('[class*="country"], [class*="Country"], [class*="flag"], [class*="location"]');
          const standEl = parent?.querySelector('[class*="stand"], [class*="Stand"], [class*="booth"]');

          const cleanName = extractedName.replace(/\s+/g, ' ').trim();

          if (cleanName && cleanName.length > 2 && cleanName.length < 200 &&
              !cleanName.toLowerCase().includes('voir') &&
              !cleanName.toLowerCase().includes('exposant') &&
              !seen.has(cleanName.toLowerCase())) {
            seen.add(cleanName.toLowerCase());
            items.push({
              raisonSociale: cleanName,
              urlPageExposant: link.href || undefined,
              numeroStand: standEl?.textContent?.trim() || undefined,
              pays: countryEl?.textContent?.trim() || 'FR'
            });
          }
        });

        // Aussi essayer les cartes/items generiques
        const cards = document.querySelectorAll('[class*="ExhibitorCard"], [class*="exhibitor-card"], [class*="CardExhibitor"]');
        cards.forEach(card => {
          const nameEl = card.querySelector('h3, h4, h5, [class*="title"], [class*="name"]');
          const linkEl = card.querySelector('a') as HTMLAnchorElement;
          const name = nameEl?.textContent?.trim();

          if (name && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            items.push({
              raisonSociale: name.replace(/\s+/g, ' ').trim(),
              urlPageExposant: linkEl?.href || undefined,
              pays: 'FR'
            });
          }
        });

        return items;
      });

      console.log(`[SIAL] Extracted ${pageCompanies.length} unique companies`);
      companies.push(...pageCompanies);

    } catch (error: any) {
      console.error('[SIAL Adapter] Error:', error.message);
    } finally {
      await page.close();
    }

    console.log(`[SIAL] Total: ${companies.length} companies scraped`);
    return companies;
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
