/**
 * Salon Discovery Service - Recherche automatique de salons Transport & Logistique
 * Utilise des sources web pour trouver des salons a scraper
 */

import puppeteer, { Browser, Page } from 'puppeteer';

interface DiscoveredSalon {
  nom: string;
  edition?: string;
  lieu?: string;
  pays: string;
  dateDebut?: string;
  dateFin?: string;
  url?: string;
  urlListeExposants?: string;
  description?: string;
  source: string;
  confiance: number; // 0-100
}

interface DiscoveryConfig {
  maxResults?: number;
  countries?: string[];
  year?: number;
  keywords?: string[];
}

// Sources connues de salons Transport & Logistique
const KNOWN_SALON_SOURCES = [
  {
    name: 'SITL Paris',
    url: 'https://www.sitl.eu',
    exhibitorsUrl: 'https://www.sitl.eu/fr/exposants',
    country: 'France',
    recurring: true,
    months: [3, 4] // Mars-Avril
  },
  {
    name: 'Transport Logistic Munich',
    url: 'https://transportlogistic.de',
    exhibitorsUrl: 'https://transportlogistic.de/en/trade-fair/exhibitors/',
    country: 'Allemagne',
    recurring: true,
    months: [5, 6] // Mai-Juin
  },
  {
    name: 'Solutrans Lyon',
    url: 'https://www.solutrans.fr',
    exhibitorsUrl: 'https://www.solutrans.fr/exposants',
    country: 'France',
    recurring: true,
    months: [11] // Novembre
  },
  {
    name: 'SIL Barcelona',
    url: 'https://www.silbcn.com',
    exhibitorsUrl: 'https://www.silbcn.com/en/exhibitors',
    country: 'Espagne',
    recurring: true,
    months: [6] // Juin
  },
  {
    name: 'Logistica',
    url: 'https://www.logistica.nl',
    exhibitorsUrl: 'https://www.logistica.nl/bezoeker/exposanten',
    country: 'Pays-Bas',
    recurring: true,
    months: [11] // Novembre
  },
  {
    name: 'Intralogistics Europe',
    url: 'https://www.intralogistics-europe.com',
    exhibitorsUrl: 'https://www.intralogistics-europe.com/exposants',
    country: 'France',
    recurring: true,
    months: [3] // Mars
  },
  {
    name: 'Multimodal UK',
    url: 'https://www.multimodal.org.uk',
    exhibitorsUrl: 'https://www.multimodal.org.uk/exhibitor-list',
    country: 'Royaume-Uni',
    recurring: true,
    months: [6] // Juin
  },
  {
    name: 'Transpotec Logitec',
    url: 'https://www.transpotec.com',
    exhibitorsUrl: 'https://www.transpotec.com/it/espositori',
    country: 'Italie',
    recurring: true,
    months: [5] // Mai
  },
  {
    name: 'Log!ville',
    url: 'https://www.logville.be',
    exhibitorsUrl: 'https://www.logville.be/fr/exposants',
    country: 'Belgique',
    recurring: true,
    months: [10] // Octobre
  },
  {
    name: 'Supply Chain Event',
    url: 'https://www.supplychain-event.com',
    exhibitorsUrl: 'https://www.supplychain-event.com/exposants',
    country: 'France',
    recurring: true,
    months: [11, 12] // Novembre-Decembre
  }
];

// Keywords pour la recherche de salons
const TRANSPORT_LOGISTICS_KEYWORDS = [
  'salon transport logistique',
  'trade show logistics',
  'exhibition supply chain',
  'foire transport',
  'messe logistik',
  'feria transporte',
  'expo freight',
  'salon supply chain',
  'conference logistique exposants',
  'trade fair forwarding'
];

class SalonDiscoveryService {
  private browser: Browser | null = null;

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Retourne les salons connus de la base de donnees interne
   */
  getKnownSalons(config: DiscoveryConfig = {}): DiscoveredSalon[] {
    const year = config.year || new Date().getFullYear();
    const countries = config.countries || [];

    return KNOWN_SALON_SOURCES
      .filter(s => countries.length === 0 || countries.includes(s.country))
      .map(salon => ({
        nom: salon.name,
        edition: String(year),
        pays: salon.country,
        url: salon.url,
        urlListeExposants: salon.exhibitorsUrl,
        source: 'database',
        confiance: 100,
        description: `Salon recurrent - ${salon.months.map(m => getMonthName(m)).join('/')}`
      }));
  }

  /**
   * Recherche de nouveaux salons via Google
   */
  async discoverSalonsFromWeb(config: DiscoveryConfig = {}): Promise<DiscoveredSalon[]> {
    const discovered: DiscoveredSalon[] = [];
    const year = config.year || new Date().getFullYear();
    const maxResults = config.maxResults || 20;
    const keywords = config.keywords || TRANSPORT_LOGISTICS_KEYWORDS;

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Rechercher pour chaque keyword
      for (const keyword of keywords.slice(0, 3)) { // Limiter a 3 recherches
        try {
          const searchQuery = encodeURIComponent(`${keyword} ${year} exposants liste`);
          await page.goto(`https://www.google.com/search?q=${searchQuery}&num=20`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });

          await new Promise(r => setTimeout(r, 2000));

          // Extraire les resultats
          const results = await page.evaluate(() => {
            const items: { title: string; url: string; description: string }[] = [];
            const searchResults = document.querySelectorAll('div.g');

            searchResults.forEach(result => {
              const titleEl = result.querySelector('h3');
              const linkEl = result.querySelector('a');
              const descEl = result.querySelector('div[data-sncf]') || result.querySelector('span');

              if (titleEl && linkEl) {
                items.push({
                  title: titleEl.textContent || '',
                  url: linkEl.getAttribute('href') || '',
                  description: descEl?.textContent?.substring(0, 200) || ''
                });
              }
            });

            return items;
          });

          // Filtrer et transformer les resultats
          for (const result of results) {
            if (discovered.length >= maxResults) break;
            if (!result.url.startsWith('http')) continue;

            // Verifier si c'est potentiellement un salon
            const titleLower = result.title.toLowerCase();
            const descLower = result.description.toLowerCase();
            const combined = titleLower + ' ' + descLower;

            const isSalon = (
              combined.includes('salon') ||
              combined.includes('expo') ||
              combined.includes('trade') ||
              combined.includes('fair') ||
              combined.includes('foire') ||
              combined.includes('messe')
            ) && (
              combined.includes('transport') ||
              combined.includes('logisti') ||
              combined.includes('supply') ||
              combined.includes('freight') ||
              combined.includes('fret')
            );

            if (isSalon) {
              const salon = this.parseSalonFromSearch(result, year);
              if (salon && !discovered.some(d => d.url === salon.url)) {
                discovered.push(salon);
              }
            }
          }

          await new Promise(r => setTimeout(r, 3000)); // Delai entre recherches
        } catch (e) {
          console.error(`[SalonDiscovery] Error searching for "${keyword}":`, e);
        }
      }

      await page.close();
    } catch (error) {
      console.error('[SalonDiscovery] Web discovery error:', error);
    }

    return discovered;
  }

  /**
   * Valider et enrichir un salon decouvert
   */
  async validateAndEnrichSalon(salon: DiscoveredSalon): Promise<DiscoveredSalon | null> {
    if (!salon.url) return null;

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      await page.goto(salon.url, { waitUntil: 'networkidle2', timeout: 20000 });

      // Chercher la page des exposants
      const exhibitorsUrl = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        for (const link of links) {
          const href = link.href?.toLowerCase() || '';
          const text = link.textContent?.toLowerCase() || '';
          if (
            href.includes('exposant') ||
            href.includes('exhibitor') ||
            href.includes('aussteller') ||
            text.includes('exposant') ||
            text.includes('exhibitor') ||
            text.includes('list')
          ) {
            return link.href;
          }
        }
        return null;
      });

      if (exhibitorsUrl) {
        salon.urlListeExposants = exhibitorsUrl;
        salon.confiance = Math.min(salon.confiance + 20, 100);
      }

      // Extraire plus d'infos
      const pageInfo = await page.evaluate(() => {
        const text = document.body.innerText;
        const title = document.title;

        // Chercher les dates
        const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g;
        const dates = text.match(datePattern) || [];

        // Chercher le lieu
        const locationPatterns = [
          /paris/i, /lyon/i, /marseille/i, /munich/i, /barcelona/i,
          /amsterdam/i, /brussels/i, /london/i, /milan/i
        ];
        let location = '';
        for (const pattern of locationPatterns) {
          if (pattern.test(text)) {
            location = pattern.source.replace(/\\/g, '');
            break;
          }
        }

        return { title, dates, location };
      });

      if (pageInfo.location && !salon.lieu) {
        salon.lieu = pageInfo.location.charAt(0).toUpperCase() + pageInfo.location.slice(1);
      }

      if (pageInfo.dates.length >= 1) {
        salon.dateDebut = pageInfo.dates[0];
      }
      if (pageInfo.dates.length >= 2) {
        salon.dateFin = pageInfo.dates[1];
      }

      await page.close();
      return salon;
    } catch (error) {
      console.error('[SalonDiscovery] Validation error:', error);
      return salon;
    }
  }

  /**
   * Recherche complete: salons connus + decouverte web
   */
  async discoverAll(config: DiscoveryConfig = {}): Promise<{
    known: DiscoveredSalon[];
    discovered: DiscoveredSalon[];
    total: number;
  }> {
    // Salons connus
    const known = this.getKnownSalons(config);

    // Decouverte web
    const discovered = await this.discoverSalonsFromWeb(config);

    // Filtrer les doublons (salons decouverts qui sont deja connus)
    const knownUrls = new Set(known.map(s => s.url?.toLowerCase()));
    const filteredDiscovered = discovered.filter(s =>
      !knownUrls.has(s.url?.toLowerCase())
    );

    return {
      known,
      discovered: filteredDiscovered,
      total: known.length + filteredDiscovered.length
    };
  }

  /**
   * Parser un resultat de recherche en salon
   */
  private parseSalonFromSearch(result: { title: string; url: string; description: string }, year: number): DiscoveredSalon | null {
    try {
      const url = new URL(result.url);
      const domain = url.hostname.replace('www.', '');

      // Deviner le pays depuis l'URL ou le contenu
      const pays = this.guessCountryFromUrl(domain) || 'France';

      return {
        nom: this.cleanSalonName(result.title),
        edition: String(year),
        pays,
        url: result.url,
        description: result.description,
        source: 'google',
        confiance: 50
      };
    } catch {
      return null;
    }
  }

  /**
   * Nettoyer le nom du salon
   */
  private cleanSalonName(title: string): string {
    return title
      .replace(/\s*[-–|]\s*.*/g, '') // Enlever tout apres - | ou --
      .replace(/\d{4}/g, '') // Enlever les annees
      .replace(/exposants?/gi, '')
      .replace(/liste/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Deviner le pays depuis l'URL
   */
  private guessCountryFromUrl(domain: string): string | null {
    const tldMap: Record<string, string> = {
      '.fr': 'France',
      '.de': 'Allemagne',
      '.es': 'Espagne',
      '.it': 'Italie',
      '.uk': 'Royaume-Uni',
      '.nl': 'Pays-Bas',
      '.be': 'Belgique',
      '.ch': 'Suisse',
      '.at': 'Autriche',
      '.pl': 'Pologne'
    };

    for (const [tld, country] of Object.entries(tldMap)) {
      if (domain.endsWith(tld)) return country;
    }
    return null;
  }
}

function getMonthName(month: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

export default new SalonDiscoveryService();
export { DiscoveredSalon, DiscoveryConfig };
