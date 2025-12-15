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
  rue?: string;
  codePostal?: string;
  produits?: string[];  // Types de produits fabriques
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
 * Utilise l'interception reseau pour capturer les donnees API
 */
const SIALComexposiumAdapter: SalonAdapter = {
  name: 'SIAL',
  baseUrl: 'https://www.sialparis.com',

  async scrape(browser: Browser, config: AdapterConfig): Promise<ScrapedCompany[]> {
    const companies: ScrapedCompany[] = [];
    const seen = new Set<string>();
    const page = await browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Intercepter les requetes pour capturer les donnees API
      const apiData: any[] = [];
      await page.setRequestInterception(true);

      page.on('request', (request: any) => {
        request.continue();
      });

      page.on('response', async (response: any) => {
        const url = response.url();
        // Capturer les reponses API qui pourraient contenir les exposants
        if (url.includes('exhibitor') || url.includes('exposant') ||
            url.includes('catalog') || url.includes('search') ||
            url.includes('graphql') || url.includes('/api/')) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('json')) {
              const data = await response.json();
              apiData.push({ url, data });
              console.log(`[SIAL] Captured API response from: ${url.substring(0, 100)}`);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });

      console.log('[SIAL] Loading page:', config.url);
      await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 5000));

      // Methode 1: Essayer de trouver un champ de recherche et chercher par lettre
      console.log('[SIAL] Trying alphabetical search...');
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

      for (const letter of alphabet.slice(0, 10)) { // Limiter pour le test
        try {
          // Chercher un input de recherche
          const searchInput = await page.$('input[type="search"], input[type="text"][class*="search"], input[placeholder*="recherch"], input[placeholder*="search"]');

          if (searchInput) {
            console.log(`[SIAL] Searching for letter: ${letter}`);
            await searchInput.click({ clickCount: 3 }); // Select all
            await searchInput.type(letter, { delay: 50 });
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 3000));

            // Extraire les resultats
            const results = await extractExhibitors(page, seen);
            companies.push(...results);
            console.log(`[SIAL] Letter ${letter}: found ${results.length} new exhibitors`);
          } else {
            break; // Pas de champ de recherche
          }
        } catch (e) {
          console.log(`[SIAL] Search error for ${letter}:`, (e as Error).message);
        }
      }

      // Methode 2: Scroll infini agressif
      console.log('[SIAL] Aggressive infinite scroll...');
      let previousCount = 0;
      let noNewResultsCount = 0;

      for (let i = 0; i < 200; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          // Cliquer sur tous les boutons possibles
          document.querySelectorAll('button, [role="button"]').forEach(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            if (text.includes('plus') || text.includes('more') || text.includes('load') || text.includes('affich')) {
              (btn as HTMLElement).click();
            }
          });
        });

        await new Promise(r => setTimeout(r, 1000));

        const currentCount = await page.evaluate(() =>
          document.querySelectorAll('a[href*="/Exposant/"], a[href*="/exposant/"], [class*="exhibitor"]').length
        );

        if (currentCount === previousCount) {
          noNewResultsCount++;
          if (noNewResultsCount >= 5) break;
        } else {
          noNewResultsCount = 0;
          previousCount = currentCount;
        }

        if (i % 20 === 0) {
          const results = await extractExhibitors(page, seen);
          companies.push(...results);
          console.log(`[SIAL] Scroll ${i}: ${companies.length} total exhibitors`);
        }
      }

      // Extraction finale
      const finalResults = await extractExhibitors(page, seen);
      companies.push(...finalResults);

      // Methode 3: Extraire les donnees des reponses API capturees
      console.log('[SIAL] Processing captured API data...');
      for (const { data } of apiData) {
        extractFromApiData(data, companies, seen);
      }

      console.log(`[SIAL] Total: ${companies.length} unique companies`);

      // Methode 4: Enrichir avec les pages de detail (adresse, tel, email, produits)
      // LIMITE A 20 pour eviter timeout - utiliser /enrich-pool pour enrichir le reste
      const MAX_ENRICH = 20;
      const companiesWithUrl = companies.filter(c => c.urlPageExposant);
      const toEnrich = companiesWithUrl.slice(0, MAX_ENRICH);

      console.log(`[SIAL] Quick enriching ${toEnrich.length}/${companiesWithUrl.length} companies (use /enrich-pool for more)...`);
      const detailPage = await browser.newPage();
      await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      let enrichedCount = 0;

      for (const company of toEnrich) {
        try {
          console.log(`[SIAL] Enriching ${enrichedCount + 1}/${toEnrich.length}: ${company.raisonSociale}`);
          await detailPage.goto(company.urlPageExposant, { waitUntil: 'networkidle2', timeout: 20000 });
          await new Promise(r => setTimeout(r, 2000));

          const details = await detailPage.evaluate(() => {
            const result: any = {};
            const pageText = document.body.innerText;
            const pageHtml = document.body.innerHTML;

            // Methode 1: Chercher dans les elements specifiques SIAL/Comexposium
            const cardSelectors = [
              '[class*="exhibitor"]', '[class*="exposant"]', '[class*="company"]',
              '[class*="contact"]', '[class*="detail"]', '[class*="profile"]',
              '[class*="info"]', 'main', 'article', '.content'
            ];

            let contentText = pageText;
            for (const sel of cardSelectors) {
              const el = document.querySelector(sel);
              if (el?.textContent && el.textContent.length > 100) {
                contentText = el.textContent;
                break;
              }
            }

            // Extraire adresse francaise (format: rue, CP Ville)
            // Pattern: code postal 5 chiffres suivi de la ville
            const cpVilleMatch = contentText.match(/(\d{5})\s+([A-Z][A-Za-zÀ-ÿ\s-]+?)(?:\s*[,\n]|$)/);
            if (cpVilleMatch) {
              result.codePostal = cpVilleMatch[1];
              result.ville = cpVilleMatch[2].trim();
            }

            // Chercher aussi format international
            if (!result.ville) {
              const cityMatch = contentText.match(/(?:City|Ville|Ciudad)[:\s]+([A-Za-zÀ-ÿ\s-]+)/i);
              if (cityMatch) result.ville = cityMatch[1].trim();
            }

            // Extraire la rue (ligne avant le code postal ou apres "Adresse")
            const adresseMatch = contentText.match(/(?:Adresse|Address|Rue|Street)[:\s]*([^\n]+)/i);
            if (adresseMatch) {
              result.rue = adresseMatch[1].trim().substring(0, 100);
            }

            // Extraire pays
            const paysPatterns = ['France', 'Germany', 'Allemagne', 'Italy', 'Italie', 'Spain', 'Espagne', 'Belgium', 'Belgique', 'Netherlands', 'Pays-Bas', 'United Kingdom', 'Royaume-Uni', 'Switzerland', 'Suisse', 'Vietnam', 'China', 'Chine', 'USA', 'United States'];
            for (const pays of paysPatterns) {
              if (contentText.includes(pays)) {
                result.pays = pays;
                break;
              }
            }

            // Extraire telephone - plusieurs formats
            const telPatterns = [
              /(?:Tel|Phone|Telephone|T)[.:\s]*(\+?[\d\s.-]{10,20})/i,
              /(\+33[\s.-]?\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/,
              /(\+84[\s.-]?\d{9,11})/,  // Vietnam
              /(\+49[\s.-]?\d{10,12})/,  // Germany
              /(\+39[\s.-]?\d{10,12})/,  // Italy
              /(0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/
            ];
            for (const pattern of telPatterns) {
              const match = contentText.match(pattern);
              if (match) {
                result.telephone = match[1].replace(/[\s.-]/g, '');
                break;
              }
            }

            // Chercher aussi dans les liens tel:
            const telLink = document.querySelector('a[href^="tel:"]');
            if (telLink) {
              const href = telLink.getAttribute('href');
              if (href) result.telephone = href.replace('tel:', '').replace(/[\s.-]/g, '');
            }

            // Extraire email
            const emailLink = document.querySelector('a[href^="mailto:"]');
            if (emailLink) {
              const href = emailLink.getAttribute('href');
              if (href) result.email = href.replace('mailto:', '').split('?')[0];
            }
            if (!result.email) {
              const emailMatch = contentText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
              if (emailMatch) result.email = emailMatch[0];
            }

            // Extraire site web
            const webLinks = Array.from(document.querySelectorAll('a[href^="http"]'));
            for (const link of webLinks) {
              const href = (link as HTMLAnchorElement).href;
              if (href &&
                  !href.includes('sial') &&
                  !href.includes('comexposium') &&
                  !href.includes('linkedin') &&
                  !href.includes('facebook') &&
                  !href.includes('twitter') &&
                  !href.includes('instagram') &&
                  !href.includes('youtube')) {
                result.siteWeb = href;
                break;
              }
            }

            // Extraire les categories/activites
            const produits: string[] = [];
            const categorySelectors = [
              '[class*="tag"]', '[class*="category"]', '[class*="sector"]',
              '[class*="activity"]', '[class*="product"]', 'span[class*="label"]'
            ];
            for (const sel of categorySelectors) {
              document.querySelectorAll(sel).forEach(el => {
                const text = el.textContent?.trim();
                if (text && text.length > 2 && text.length < 80 && !produits.includes(text)) {
                  produits.push(text);
                }
              });
              if (produits.length >= 5) break;
            }
            if (produits.length > 0) result.produits = produits.slice(0, 10);

            // Extraire description
            const descSelectors = [
              '[class*="description"]', '[class*="about"]', '[class*="presentation"]',
              '[class*="summary"]', '[class*="overview"]', 'p'
            ];
            for (const sel of descSelectors) {
              const el = document.querySelector(sel);
              if (el?.textContent && el.textContent.length > 80 && el.textContent.length < 2000) {
                result.descriptionActivite = el.textContent.trim().substring(0, 500);
                break;
              }
            }

            // Debug: log what we found
            console.log('[SIAL Detail] Found:', JSON.stringify(result));

            return result;
          });

          // Merger les details
          if (details.rue) company.rue = details.rue;
          if (details.codePostal) company.codePostal = details.codePostal;
          if (details.ville) company.ville = details.ville;
          if (details.pays) company.pays = details.pays;
          if (details.telephone) company.telephone = details.telephone;
          if (details.email) company.email = details.email;
          if (details.siteWeb) company.siteWeb = details.siteWeb;
          if (details.produits) company.produits = details.produits;
          if (details.descriptionActivite && !company.descriptionActivite) {
            company.descriptionActivite = details.descriptionActivite;
          }

          enrichedCount++;
          await new Promise(r => setTimeout(r, 500));

        } catch (e) {
          console.log(`[SIAL] Error enriching ${company.raisonSociale}:`, (e as Error).message);
        }
      }

      await detailPage.close();
      console.log(`[SIAL] Enriched ${enrichedCount} companies with details`);


    } catch (error: any) {
      console.error('[SIAL Adapter] Error:', error.message);
    } finally {
      await page.close();
    }

    return companies;
  }
};

// Helper function pour extraire les exposants de la page
async function extractExhibitors(page: Page, seen: Set<string>): Promise<ScrapedCompany[]> {
  const items: ScrapedCompany[] = [];

  const pageCompanies = await page.evaluate(() => {
    const results: any[] = [];

    // Methode 1: Liens vers exposants
    document.querySelectorAll('a[href*="/Exposant/"], a[href*="/exposant/"]').forEach(el => {
      const link = el as HTMLAnchorElement;
      let name = link.textContent?.trim() || '';

      // Chercher le nom dans les enfants
      const nameEl = link.querySelector('h3, h4, h5, span, div');
      if (nameEl) name = nameEl.textContent?.trim() || name;

      // Extraire le nom du href si vide
      if (!name && link.href) {
        const match = link.href.match(/\/Exposant\/([^\/\?]+)/i);
        if (match) name = decodeURIComponent(match[1]).replace(/-/g, ' ');
      }

      const parent = link.closest('[class*="card"], [class*="item"], li, article, div');
      const country = parent?.querySelector('[class*="country"], [class*="flag"]')?.textContent?.trim();

      if (name && name.length > 2 && name.length < 200) {
        results.push({
          raisonSociale: name.replace(/\s+/g, ' ').trim(),
          urlPageExposant: link.href,
          pays: country || 'France'
        });
      }
    });

    // Methode 2: Elements avec data attributes
    document.querySelectorAll('[data-exhibitor], [data-company], [data-vendor]').forEach(el => {
      const name = el.getAttribute('data-exhibitor') || el.getAttribute('data-company') || el.textContent?.trim();
      if (name && name.length > 2) {
        results.push({
          raisonSociale: name.replace(/\s+/g, ' ').trim(),
          pays: 'France'
        });
      }
    });

    return results;
  });

  for (const company of pageCompanies) {
    const key = company.raisonSociale.toLowerCase();
    if (!seen.has(key) && !key.includes('voir') && !key.includes('exposant')) {
      seen.add(key);
      items.push(company);
    }
  }

  return items;
}

// Helper function pour extraire les donnees des reponses API
function extractFromApiData(data: any, companies: ScrapedCompany[], seen: Set<string>): void {
  if (!data) return;

  // Parcourir recursivement pour trouver les donnees d'exposants
  if (Array.isArray(data)) {
    for (const item of data) {
      extractFromApiData(item, companies, seen);
    }
  } else if (typeof data === 'object') {
    // Chercher les champs typiques d'exposants
    const name = data.name || data.nom || data.raisonSociale || data.companyName ||
                 data.exhibitorName || data.title || data.label;

    if (name && typeof name === 'string' && name.length > 2 && name.length < 200) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        companies.push({
          raisonSociale: name.replace(/\s+/g, ' ').trim(),
          siteWeb: data.website || data.url || data.siteWeb,
          pays: data.country || data.pays || 'France',
          ville: data.city || data.ville,
          descriptionActivite: data.description || data.activity
        });
      }
    }

    // Continuer la recursion
    for (const key of Object.keys(data)) {
      if (data[key] && typeof data[key] === 'object') {
        extractFromApiData(data[key], companies, seen);
      }
    }
  }
}

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
