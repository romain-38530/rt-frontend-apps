/**
 * Transport Scraping Service
 * Service de scraping continu pour les entreprises de transport (B2PWeb, annuaires, etc.)
 * Enregistre les annonces et les routes associées
 * Utilise Puppeteer pour l'authentification et le scraping (B2PWeb = SPA JavaScript)
 */
import axios, { AxiosInstance } from 'axios';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import TransportCompany, { ITransportCompany } from '../models/TransportCompany';
import TransportOffer, { ITransportOffer } from '../models/TransportOffer';
import mongoose from 'mongoose';

// ============================================
// INTERFACES
// ============================================

interface ScrapingJob {
  id: string;
  source: string;
  type: 'companies' | 'offers' | 'continuous';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  startedAt?: Date;
  completedAt?: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
  totalFound: number;
  totalImported: number;
  totalUpdated: number;
  totalDuplicates: number;
  errors: string[];
  filters?: Record<string, any>;
  interval?: number; // minutes entre chaque run
  isActive: boolean;
}

interface B2PWebCredentials {
  username: string;
  password: string;
}

interface ScrapingConfig {
  b2pwebEnabled: boolean;
  b2pwebCredentials?: B2PWebCredentials;
  intervalMinutes: number;
  maxOffersPerRun: number;
}

// ============================================
// STATE
// ============================================

// Store des jobs en cours
const scrapingJobs: Map<string, ScrapingJob> = new Map();

// Intervals pour le scraping continu
const continuousIntervals: Map<string, NodeJS.Timeout> = new Map();

// Configuration globale avec identifiants B2PWeb par défaut
let scrapingConfig: ScrapingConfig = {
  b2pwebEnabled: false,
  b2pwebCredentials: {
    username: 'rtardy375',
    password: 'Sett.38530'
  },
  intervalMinutes: 30,
  maxOffersPerRun: 500
};

// ============================================
// SERVICE
// ============================================

// Helper function for delays (waitForTimeout is deprecated in newer Puppeteer)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class TransportScrapingService {
  private b2pwebClient: AxiosInstance | null = null;
  private b2pwebToken: string | null = null;
  private b2pwebCookies: string | null = null;
  private isAuthenticated: boolean = false;

  // Puppeteer browser instance
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {}

  // ============================================
  // CONFIGURATION
  // ============================================

  getConfig(): ScrapingConfig {
    return { ...scrapingConfig };
  }

  updateConfig(config: Partial<ScrapingConfig>): ScrapingConfig {
    scrapingConfig = { ...scrapingConfig, ...config };
    return scrapingConfig;
  }

  // ============================================
  // AUTHENTIFICATION B2PWEB (Puppeteer)
  // ============================================

  async authenticateB2PWeb(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[B2PWeb] Starting Puppeteer authentication...');

      // Close existing browser if any
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }

      // Launch Puppeteer browser with system Chrome/Chromium
      // On Amazon Linux, Chrome is installed via .ebextensions at /usr/bin/google-chrome-stable
      const executablePath = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
      console.log(`[B2PWeb] Using Chrome at: ${executablePath}`);

      this.browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--single-process'
        ]
      });

      this.page = await this.browser.newPage();

      // Set viewport and user agent
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      console.log('[B2PWeb] Navigating to app.b2pweb.com...');

      // Navigate to B2PWeb - it will redirect to auth.b2pweb.com (Keycloak)
      await this.page.goto('https://app.b2pweb.com/offer', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Wait for redirect to auth.b2pweb.com
      await delay(3000);

      const currentUrl = this.page.url();
      console.log(`[B2PWeb] Current URL after redirect: ${currentUrl}`);

      // Check if we're on the Keycloak login page (auth.b2pweb.com)
      if (!currentUrl.includes('auth.b2pweb.com')) {
        // Maybe already logged in?
        if (currentUrl.includes('app.b2pweb.com')) {
          console.log('[B2PWeb] Already authenticated or no redirect to login');
          this.isAuthenticated = true;
          return { success: true };
        }
      }

      console.log('[B2PWeb] On Keycloak login page, searching for login form...');

      // Keycloak uses standard input names
      const usernameInput = await this.page.$('#username');
      const passwordInput = await this.page.$('#password');

      if (!usernameInput || !passwordInput) {
        const pageContent = await this.page.content();
        console.log('[B2PWeb] Page HTML (looking for form):', pageContent.substring(0, 3000));
        return {
          success: false,
          error: `Formulaire de connexion non trouvé. URL actuelle: ${currentUrl}`
        };
      }

      console.log('[B2PWeb] Found Keycloak login form, filling credentials...');

      // Fill username
      await usernameInput.click({ clickCount: 3 });
      await usernameInput.type(username, { delay: 30 });

      // Fill password
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(password, { delay: 30 });

      // Submit the form - Keycloak uses id="kc-login"
      const submitSelectors = [
        '#kc-login',
        'input[type="submit"]',
        'button[type="submit"]',
        'input[name="login"]'
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const submitBtn = await this.page.$(selector);
          if (submitBtn) {
            console.log(`[B2PWeb] Clicking submit button with selector: ${selector}`);
            await submitBtn.click();
            submitted = true;
            break;
          }
        } catch (e) { /* continue */ }
      }

      if (!submitted) {
        // Try pressing Enter
        await this.page.keyboard.press('Enter');
      }

      console.log('[B2PWeb] Waiting for authentication and redirect...');

      // Wait for redirect back to app.b2pweb.com after successful Keycloak auth
      try {
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      } catch (e) {
        // Navigation might have already happened
      }
      await delay(3000);

      // Check current URL after login
      const postLoginUrl = this.page.url();
      console.log(`[B2PWeb] URL after login attempt: ${postLoginUrl}`);

      // Get cookies from all domains
      const cookies = await this.page.cookies();
      this.b2pwebCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      console.log(`[B2PWeb] Got ${cookies.length} cookies`);

      // Check for Keycloak error message
      const errorAlert = await this.page.$('#input-error');
      if (errorAlert) {
        const errorText = await errorAlert.evaluate(el => el.textContent);
        console.log(`[B2PWeb] Keycloak error: ${errorText}`);
        return { success: false, error: `Identifiants incorrects: ${errorText?.trim()}` };
      }

      // Check if we're back on app.b2pweb.com (success)
      if (postLoginUrl.includes('app.b2pweb.com') && !postLoginUrl.includes('auth')) {
        console.log('[B2PWeb] Authentication successful! Redirected to app.b2pweb.com');

        // ============================================
        // HANDLE POST-LOGIN POPUPS
        // B2PWeb shows up to 4 popups after login:
        // 1. "Continuer sur B2PWeb" (version update)
        // 2-4. "Compris" (feature notifications)
        // ============================================
        console.log('[B2PWeb] Handling post-login popups...');
        await this.handlePostLoginPopups();

        this.isAuthenticated = true;
        scrapingConfig.b2pwebEnabled = true;
        scrapingConfig.b2pwebCredentials = { username, password };

        // Create axios client with cookies for API calls
        this.b2pwebClient = axios.create({
          baseURL: 'https://app.b2pweb.com',
          headers: {
            'Cookie': this.b2pwebCookies || '',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        return { success: true };
      }

      // Still on auth page = login failed
      console.log('[B2PWeb] Still on auth page, authentication failed');
      return {
        success: false,
        error: `Authentification échouée. URL actuelle: ${postLoginUrl}`
      };

    } catch (error: any) {
      console.error('[B2PWeb] Authentication error:', error.message);

      // Cleanup on error
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }

      return { success: false, error: `Erreur Puppeteer: ${error.message}` };
    }
  }

  // Cleanup browser on service shutdown
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isAuthenticated = false;
    }
  }

  isB2PWebAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  // ============================================
  // HANDLE POST-LOGIN POPUPS
  // B2PWeb shows various popups after first login:
  // 1. "Continuer sur B2PWeb" / "Continue on B2PWeb" (version update)
  // 2-4. "Compris" / "Understood" (feature notifications)
  // Note: These may not appear on subsequent logins from same IP
  // ============================================
  private async handlePostLoginPopups(): Promise<void> {
    if (!this.page) return;

    const maxPopups = 5;
    let popupsClosed = 0;

    for (let i = 0; i < maxPopups; i++) {
      await delay(1500);

      const popupResult = await this.page.evaluate(() => {
        // List of button texts to look for (French and English)
        const buttonTexts = [
          'Continuer sur B2PWeb',
          'Continuer sur B2P',
          'Continue on B2PWeb',
          'Continue',
          'Compris',
          'Understood',
          'Got it',
          'OK',
          'Fermer',
          'Close'
        ];

        // Find all buttons and clickable elements
        const elements = Array.from(document.querySelectorAll('button, a, [role="button"], span'));

        for (const el of elements) {
          const text = (el.textContent || '').trim();

          // Check if text matches any popup button
          for (const btnText of buttonTexts) {
            if (text.toLowerCase() === btnText.toLowerCase() ||
                text.toLowerCase().includes(btnText.toLowerCase())) {
              // Check if it's visible (in a dialog/modal)
              const rect = (el as HTMLElement).getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                (el as HTMLElement).click();
                return { closed: true, text: text };
              }
            }
          }
        }

        // Also try to find and click any modal close button (X icon)
        const closeButtons = document.querySelectorAll('[aria-label="close"], [aria-label="Close"], .close-button, .modal-close');
        for (const btn of Array.from(closeButtons)) {
          (btn as HTMLElement).click();
          return { closed: true, text: 'close-icon' };
        }

        return { closed: false };
      });

      if (popupResult.closed) {
        popupsClosed++;
        console.log(`[B2PWeb] Closed popup ${popupsClosed}: "${popupResult.text}"`);
        await delay(1000);
      } else {
        // No more popups found
        console.log(`[B2PWeb] No more popups found after closing ${popupsClosed}`);
        break;
      }
    }

    console.log(`[B2PWeb] Total popups handled: ${popupsClosed}`);
  }

  // ============================================
  // SET DÉPOSANT FILTER TO "TOUS"
  // The Déposant dropdown has options: "Moi-même" (default), "Tous", etc.
  // We need "Tous" to see all offers from all users
  // ============================================
  private async setDeposantFilter(): Promise<{ success: boolean; error?: string }> {
    if (!this.page) return { success: false, error: 'Page not initialized' };

    try {
      // Step 1: Find and click the Déposant dropdown
      const dropdownOpened = await this.page.evaluate(() => {
        const logs: string[] = [];

        // Log all dropdown-like elements for debugging
        const dropdowns = Array.from(document.querySelectorAll('select, [role="combobox"], [role="listbox"], [class*="dropdown"], [class*="select"], [class*="filter"]'));
        logs.push(`Found ${dropdowns.length} dropdown-like elements`);

        // Log visible filter labels
        const filterLabels = Array.from(document.querySelectorAll('label, span, div')).filter(el => {
          const text = (el.textContent || '').trim().toLowerCase();
          return text.length > 0 && text.length < 30 && (text.includes('filter') || text.includes('déposant') || text.includes('depositor') || text.includes('myself') || text.includes('moi'));
        }).map(el => (el.textContent || '').trim());
        logs.push(`Filter-related labels: ${filterLabels.slice(0, 10).join(', ')}`);

        // Look for dropdown/select with label "Déposant" or "Depositor"
        const labels = Array.from(document.querySelectorAll('label, span, div'));
        for (const label of labels) {
          const text = (label.textContent || '').trim().toLowerCase();
          if (text.includes('déposant') || text.includes('deposant') || text.includes('depositor') || text.includes('submitter')) {
            // Find nearby dropdown or clickable element
            const parent = label.closest('div');
            if (parent) {
              // Look for select, dropdown button, or clickable div
              const clickable = parent.querySelector('select, [role="combobox"], [role="listbox"], button, [class*="dropdown"], [class*="select"]');
              if (clickable) {
                (clickable as HTMLElement).click();
                return { found: true, element: 'dropdown', logs };
              }
              // Try clicking the parent itself
              (parent as HTMLElement).click();
              return { found: true, element: 'parent', logs };
            }
          }
        }

        // Alternative: look for any dropdown showing "Moi-même" or "Myself"
        const allElements = Array.from(document.querySelectorAll('button, div, span'));
        for (const el of allElements) {
          const text = (el.textContent || '').trim();
          if (text === 'Moi-même' || text === 'Myself' || text.toLowerCase().includes('moi-même') || text.toLowerCase() === 'myself') {
            (el as HTMLElement).click();
            return { found: true, element: 'moi-meme-button', text, logs };
          }
        }

        return { found: false, logs };
      });

      console.log(`[B2PWeb] Déposant dropdown open result: ${JSON.stringify(dropdownOpened)}`);

      if (!dropdownOpened.found) {
        return { success: false, error: 'Could not find Déposant dropdown' };
      }

      await delay(1000);

      // Step 2: Select "Tous" option
      const optionSelected = await this.page.evaluate(() => {
        // Look for option "Tous" or "All" in the dropdown/menu
        const options = Array.from(document.querySelectorAll('li, option, [role="option"], [role="menuitem"], div, span, button'));
        for (const opt of options) {
          const text = (opt.textContent || '').trim();
          if (text === 'Tous' || text === 'All' || text.toLowerCase() === 'tous') {
            (opt as HTMLElement).click();
            return { selected: true, text: text };
          }
        }
        return { selected: false };
      });

      console.log(`[B2PWeb] Tous option select result: ${JSON.stringify(optionSelected)}`);

      if (!optionSelected.selected) {
        return { success: false, error: 'Could not select Tous option' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Take a screenshot for debugging
  async takeScreenshot(name?: string): Promise<{ success: boolean; screenshot?: string; url?: string; error?: string }> {
    if (!this.page) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      const currentUrl = this.page.url();
      console.log(`[B2PWeb] Taking screenshot at: ${currentUrl}`);

      // Take screenshot as base64
      const screenshot = await this.page.screenshot({
        encoding: 'base64',
        fullPage: false // Just viewport
      });

      return {
        success: true,
        screenshot: screenshot as string,
        url: currentUrl
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Navigate to a specific URL
  async navigateTo(url: string): Promise<{ success: boolean; currentUrl?: string; error?: string }> {
    if (!this.page) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      console.log(`[B2PWeb] Navigating to: ${url}`);
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      await delay(2000);

      return {
        success: true,
        currentUrl: this.page.url()
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Click on element by text content
  async clickByText(text: string): Promise<{ success: boolean; error?: string }> {
    if (!this.page) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      console.log(`[B2PWeb] Clicking element with text: ${text}`);

      const clicked = await this.page.evaluate((searchText) => {
        const elements = Array.from(document.querySelectorAll('*'));
        for (const el of elements) {
          if (el.textContent?.trim().toLowerCase().includes(searchText.toLowerCase())) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, text);

      if (!clicked) {
        return { success: false, error: `Element with text "${text}" not found` };
      }

      await delay(1500);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get page HTML for debugging
  async getPageHTML(): Promise<{ success: boolean; html?: string; url?: string; error?: string }> {
    if (!this.page) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      const html = await this.page.content();
      return {
        success: true,
        html: html.substring(0, 50000), // Limit to 50KB
        url: this.page.url()
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // GESTION DES JOBS
  // ============================================

  createScrapingJob(source: string, type: ScrapingJob['type'], filters?: Record<string, any>): ScrapingJob {
    const job: ScrapingJob = {
      id: new mongoose.Types.ObjectId().toString(),
      source,
      type,
      status: 'pending',
      totalFound: 0,
      totalImported: 0,
      totalUpdated: 0,
      totalDuplicates: 0,
      errors: [],
      filters,
      isActive: true
    };
    scrapingJobs.set(job.id, job);
    return job;
  }

  getJobStatus(jobId: string): ScrapingJob | undefined {
    return scrapingJobs.get(jobId);
  }

  getAllJobs(): ScrapingJob[] {
    return Array.from(scrapingJobs.values()).sort((a, b) =>
      (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0)
    );
  }

  stopJob(jobId: string): boolean {
    const job = scrapingJobs.get(jobId);
    if (job) {
      job.status = 'stopped';
      job.isActive = false;
      const interval = continuousIntervals.get(jobId);
      if (interval) {
        clearInterval(interval);
        continuousIntervals.delete(jobId);
      }
      return true;
    }
    return false;
  }

  // ============================================
  // SCRAPING CONTINU DES OFFRES B2PWEB
  // ============================================

  async startContinuousScraping(intervalMinutes?: number): Promise<ScrapingJob> {
    const interval = intervalMinutes || scrapingConfig.intervalMinutes;

    const job = this.createScrapingJob('b2pweb', 'continuous', { intervalMinutes: interval });
    job.interval = interval;
    job.status = 'running';
    job.startedAt = new Date();

    // Lancer immédiatement
    this.runOffersScraping(job.id);

    // Programmer les exécutions suivantes
    const intervalId = setInterval(() => {
      if (job.isActive) {
        this.runOffersScraping(job.id);
      }
    }, interval * 60 * 1000);

    continuousIntervals.set(job.id, intervalId);

    return job;
  }

  private async runOffersScraping(jobId: string): Promise<void> {
    const job = scrapingJobs.get(jobId);
    if (!job || !job.isActive) return;

    job.lastRunAt = new Date();
    job.nextRunAt = new Date(Date.now() + (job.interval || 30) * 60 * 1000);

    try {
      // Re-authenticate if needed
      if (!this.isAuthenticated && scrapingConfig.b2pwebCredentials) {
        await this.authenticateB2PWeb(
          scrapingConfig.b2pwebCredentials.username,
          scrapingConfig.b2pwebCredentials.password
        );
      }

      if (!this.isAuthenticated || !this.page) {
        job.errors.push('Non authentifié sur B2PWeb');
        return;
      }

      console.log('[B2PWeb] Starting offers scraping...');
      console.log('[B2PWeb] isAuthenticated:', this.isAuthenticated);
      console.log('[B2PWeb] hasPage:', !!this.page);
      console.log('[B2PWeb] hasB2pwebClient:', !!this.b2pwebClient);

      // Handle any popups that may have appeared (version updates, notifications)
      console.log('[B2PWeb] Checking for popups before scraping...');
      await this.handlePostLoginPopups();

      let rawOffers: any[] = [];

      // Skip API endpoints - go directly to Puppeteer scraping
      // API endpoints don't work reliably with B2PWeb
      console.log('[B2PWeb] Using Puppeteer page scraping directly...');
      if (this.page) {
        rawOffers = await this.scrapeOffersWithPuppeteer();
      }

      /* DISABLED: API endpoints don't work with B2PWeb
      // Try API endpoints first (with cookies from Puppeteer session)
      if (false && this.b2pwebClient) {
        const offerEndpoints = [
          '/api/offers',
          '/api/v1/offers',
          '/api/transport/offers',
          '/api/fret/offers',
          '/api/annonces',
          '/api/v1/annonces',
          '/api/freight/offers',
          '/api/loads'
        ];

        for (const endpoint of offerEndpoints) {
          try {
            let page = 1;
            let hasMore = true;

            while (hasMore && rawOffers.length < scrapingConfig.maxOffersPerRun) {
              const response = await this.b2pwebClient.get(endpoint, {
                params: {
                  page,
                  limit: 100,
                  per_page: 100,
                  pageSize: 100,
                  status: 'active'
                }
              });

              const data = response.data?.data || response.data?.offers || response.data?.results || response.data?.items || response.data;

              if (Array.isArray(data) && data.length > 0) {
                rawOffers = [...rawOffers, ...data];
                hasMore = data.length >= 100;
                page++;
              } else {
                hasMore = false;
              }

              await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (rawOffers.length > 0) break;
          } catch (e) {
            // Continue to next endpoint
          }
        }
      }

      // If API didn't work, use Puppeteer to scrape the page directly
      if (rawOffers.length === 0 && this.page) {
        console.log('[B2PWeb] API endpoints failed, using Puppeteer page scraping...');
        rawOffers = await this.scrapeOffersWithPuppeteer();
      }
      */

      job.totalFound += rawOffers.length;
      console.log(`[B2PWeb] Found ${rawOffers.length} offers`);

      // Process offers
      for (const rawOffer of rawOffers) {
        try {
          await this.processOffer(rawOffer, job);
        } catch (error: any) {
          job.errors.push(`Erreur traitement offre: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('[B2PWeb] Scraping error:', error.message);
      job.errors.push(`Erreur run scraping: ${error.message}`);
    }
  }

  // Scrape offers directly from B2PWeb page using Puppeteer
  // B2PWeb flow for each offer:
  // 1. Navigate to "Dépose" tab (not "Recherche")
  // 2. Set filter "Déposant" to "Tous" (shows all offers from all users)
  // 3. Click on offer row -> right panel opens
  // 4. Click "Activités" -> extract "Consultants" only
  // Each transporter is recorded with the route (departure -> delivery)
  private async scrapeOffersWithPuppeteer(): Promise<any[]> {
    if (!this.page) return [];

    try {
      const currentUrl = this.page.url();
      console.log(`[B2PWeb] Starting scrape from URL: ${currentUrl}`);

      // Navigate to /offer if not there
      if (!currentUrl.includes('/offer')) {
        console.log('[B2PWeb] Navigating to /offer page...');
        await this.page.goto('https://app.b2pweb.com/offer', {
          waitUntil: 'networkidle2',
          timeout: 60000
        });
        await delay(3000);
      }

      // ============================================
      // STEP 1: Click on "Dépose" tab
      // The default view might be "Recherche", we need "Dépose"
      // ============================================
      console.log('[B2PWeb] Looking for Dépose/Submission tab...');
      const deposeClicked = await this.page.evaluate(() => {
        const logs: string[] = [];

        // First, log all visible tabs/navigation items for debugging
        const allTabs = Array.from(document.querySelectorAll('a, button, [role="tab"], nav a, nav button, .nav-item, .tab'));
        const tabTexts = allTabs.map(t => (t.textContent || '').trim()).filter(t => t.length > 0 && t.length < 30);
        logs.push(`Available tabs/links: ${tabTexts.slice(0, 15).join(', ')}`);

        // Keywords for Dépose tab (French and English)
        const deposeKeywords = ['dépose', 'depose', 'deposit', 'submission', 'déposes', 'deposes', 'submissions', 'mes déposes', 'my submissions'];

        const tabs = Array.from(document.querySelectorAll('a, button, [role="tab"], span, div, nav a, nav button'));
        for (const tab of tabs) {
          const text = (tab.textContent || '').trim().toLowerCase();
          // Match any of the keywords
          if (deposeKeywords.some(kw => text === kw || text.includes(kw))) {
            (tab as HTMLElement).click();
            return { clicked: true, text: text, logs };
          }
        }
        return { clicked: false, logs };
      });
      console.log(`[B2PWeb] Dépose tab click result: ${JSON.stringify(deposeClicked)}`);
      await delay(2000);

      // ============================================
      // STEP 2: Set filter "Déposant" to "Tous"
      // By default it's "Moi-même" (only my offers), we need "Tous" (all offers)
      // ============================================
      console.log('[B2PWeb] Setting Déposant filter to Tous...');
      const filterResult = await this.setDeposantFilter();
      console.log(`[B2PWeb] Déposant filter result: ${JSON.stringify(filterResult)}`);
      await delay(2000);
      const results: any[] = [];
      const maxOffers = Math.min(30, scrapingConfig.maxOffersPerRun);
      const maxTransportersPerSection = 100; // Limit per section to avoid too long scraping

      // Get offer rows count
      const offerCount = await this.page.evaluate(() => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        return checkboxes.length;
      });

      console.log(`[B2PWeb] Found ${offerCount} offer rows`);

      if (offerCount === 0) {
        const pageContent = await this.page.content();
        console.log('[B2PWeb] Page HTML sample:', pageContent.substring(0, 3000));
        return [];
      }

      // Process each offer
      for (let i = 0; i < Math.min(offerCount, maxOffers); i++) {
        try {
          console.log(`[B2PWeb] Processing offer ${i + 1}/${Math.min(offerCount, maxOffers)}...`);

          // Get route info from the row before clicking
          const routeInfo = await this.page.evaluate((rowIndex) => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            const checkbox = checkboxes[rowIndex];
            if (!checkbox) return null;

            const row = checkbox.closest('tr, [class*="row"], div[role="row"]');
            if (!row) return null;

            const text = row.textContent || '';
            // Pattern: "38, VAULX-MILIEU" for departure, "31, TOULOUSE" for delivery
            const matches = text.match(/(\d{2}),\s*([A-ZÉÈÀÙÂÊÎÔÛ][A-ZÉÈÀÙÂÊÎÔÛ\-\s]+?)(?=\s*\d{2},|\s*J\+|\s*MG|\s*Taut|\s*\d{2}\/)/gi) || [];

            if (matches.length >= 2) {
              const dep = matches[0] || '';
              const del = matches[1] || '';
              return {
                departure: dep.trim(),
                delivery: del.trim(),
                departureDept: dep.match(/^(\d{2})/)?.[1] || '',
                deliveryDept: del.match(/^(\d{2})/)?.[1] || ''
              };
            }
            return null;
          }, i);

          if (!routeInfo) {
            console.log(`[B2PWeb] Could not extract route info for offer ${i + 1}`);
            continue;
          }

          console.log(`[B2PWeb] Route: ${routeInfo.departure} -> ${routeInfo.delivery}`);

          // ==========================================
          // STEP 1: CLICK ON THE OFFER ROW TO OPEN "OFFER INFORMATIONS" PANEL
          // ==========================================
          console.log(`[B2PWeb] Clicking on offer row ${i} to open Offer informations panel...`);

          const rowClicked = await this.page.evaluate((rowIndex) => {
            const logs: string[] = [];

            // Find items in virtual scroller
            const scrollerItems = document.querySelectorAll('.vue-recycle-scroller__item-wrapper > div, .vue-recycle-scroller__item-view');
            logs.push(`Found ${scrollerItems.length} scroller items`);

            if (scrollerItems.length <= rowIndex) {
              return { success: false, error: 'Row index out of bounds', logs };
            }

            const row = scrollerItems[rowIndex] as HTMLElement;
            const rowText = (row.textContent || '').substring(0, 80);
            logs.push(`Row ${rowIndex} text: ${rowText}`);

            // Click on the middle of the row (avoid checkbox on left)
            const rect = row.getBoundingClientRect();
            const clickX = rect.left + rect.width * 0.5;
            const clickY = rect.top + rect.height / 2;

            // Dispatch click event
            const clickEvent = new MouseEvent('click', {
              bubbles: true, cancelable: true, view: window,
              clientX: clickX, clientY: clickY, button: 0
            });
            row.dispatchEvent(clickEvent);

            logs.push(`Clicked row at (${Math.round(clickX)}, ${Math.round(clickY)})`);
            return { success: true, logs };
          }, i);

          console.log(`[B2PWeb] Row click result: ${JSON.stringify(rowClicked)}`);
          await delay(1500);

          // Check if Offer informations panel opened
          const panelOpened = await this.page.evaluate(() => {
            const body = document.body.innerText;
            return body.includes('Offer informations') || body.includes('Informations de l\'offre') ||
                   body.includes('Offer details') || body.includes('Offer\'s contact') ||
                   body.includes('Depositor') || body.includes('Déposant');
          });
          console.log(`[B2PWeb] Offer informations panel opened: ${panelOpened}`);

          if (!panelOpened) {
            console.log(`[B2PWeb] Panel did not open for offer ${i + 1}, skipping...`);
            continue;
          }

          // ==========================================
          // STEP 2: CLICK ON HISTORY BUTTON IN "OFFER INFORMATIONS" PANEL
          // The History button is a clock icon in the right panel
          // ==========================================
          console.log(`[B2PWeb] Looking for History button in Offer informations panel...`);

          const historyButtonClicked = await this.page.evaluate(() => {
            const logs: string[] = [];
            const pageWidth = window.innerWidth;

            // The History button is the "schedule" icon (clock) in the panel toolbar
            // Panel toolbar icons: pencil, arrow-collapse, format-list-text, trash, magnify, SCHEDULE(history), list, globe-europe
            // The panel is in the CENTER-RIGHT of the page, not necessarily at 70% width

            const allSvgs = document.querySelectorAll('svg');
            logs.push(`Found ${allSvgs.length} total SVGs`);

            // Navbar icons to EXCLUDE (these are at top right in the main navbar)
            const navbarIcons = ['truck', 'notebook', 'chat', 'bell', 'wrench', 'cog', 'help-circle', 'tune-vertical', 'account-circle'];

            // STRATEGY 1: Find panel toolbar Y position by locating unique panel icons first
            // Panel toolbar has: pencil, arrow-collapse, format-list-text, trash, magnify, schedule, list/format-list-bulleted, globe-europe
            // The "pencil" icon is unique to the panel toolbar - find it first to get the toolbar Y level

            let panelToolbarY = -1;
            let panelToolbarX = -1;

            // Find pencil icon (unique to panel toolbar, not in offer rows)
            for (const svg of Array.from(allSvgs)) {
              const dataIcon = svg.getAttribute('data-icon') || '';
              if (dataIcon === 'pencil') {
                const rect = svg.getBoundingClientRect();
                // Pencil should be in the top area and on the right side (panel area)
                if (rect.top > 30 && rect.top < 150 && rect.left > pageWidth * 0.4) {
                  panelToolbarY = rect.top;
                  panelToolbarX = rect.left;
                  logs.push(`Found pencil (panel toolbar) at (${Math.round(rect.left)}, ${Math.round(rect.top)})`);
                  break;
                }
              }
            }

            // If we found the panel toolbar, look for schedule icon at the same Y level
            if (panelToolbarY > 0) {
              logs.push(`Panel toolbar at Y=${Math.round(panelToolbarY)}, looking for schedule icon there...`);

              for (const svg of Array.from(allSvgs)) {
                const dataIcon = svg.getAttribute('data-icon') || '';
                if (dataIcon === 'schedule') {
                  const rect = svg.getBoundingClientRect();
                  const yDiff = Math.abs(rect.top - panelToolbarY);

                  // Must be at same Y level (within 20px) and to the right of pencil
                  if (yDiff < 20 && rect.left > panelToolbarX) {
                    logs.push(`Found schedule icon in panel toolbar at (${Math.round(rect.left)}, ${Math.round(rect.top)})`);
                    const clickTarget = svg.closest('button, [role="button"], .cursor-pointer') || svg.parentElement;
                    if (clickTarget) {
                      (clickTarget as HTMLElement).click();
                      return { success: true, method: 'schedule-same-y-as-pencil', logs };
                    }
                  }
                }
              }
            }

            // FALLBACK: Find ALL schedule icons and try to determine which one is in the toolbar
            const scheduleIcons: { svg: Element, rect: DOMRect }[] = [];
            for (const svg of Array.from(allSvgs)) {
              const dataIcon = svg.getAttribute('data-icon') || '';
              if (dataIcon === 'schedule') {
                const svgRect = svg.getBoundingClientRect();
                if (svgRect.width > 5 && svgRect.height > 5 && svgRect.top < 200 && svgRect.top > 0) {
                  scheduleIcons.push({ svg, rect: svgRect });
                  logs.push(`Schedule icon at (${Math.round(svgRect.left)}, ${Math.round(svgRect.top)})`);
                }
              }
            }
            logs.push(`Found ${scheduleIcons.length} schedule icons in top area`);

            // Try clicking the schedule icon with the smallest Y (topmost one - likely toolbar)
            if (scheduleIcons.length > 0) {
              scheduleIcons.sort((a, b) => a.rect.top - b.rect.top);
              const topSchedule = scheduleIcons[0];
              logs.push(`Trying topmost schedule at y=${Math.round(topSchedule.rect.top)}`);
              const clickTarget = topSchedule.svg.closest('button, [role="button"], .cursor-pointer') || topSchedule.svg.parentElement;
              if (clickTarget) {
                (clickTarget as HTMLElement).click();
                return { success: true, method: 'topmost-schedule', logs };
              }
            }

            // FALLBACK: Find toolbar buttons by looking for icons that are NOT navbar icons
            // and are in the top area of the page
            const toolbarButtons: { svg: Element, rect: DOMRect, dataIcon: string }[] = [];

            for (const svg of Array.from(allSvgs)) {
              const svgRect = svg.getBoundingClientRect();
              const dataIcon = svg.getAttribute('data-icon') || '';

              // Skip navbar icons
              if (navbarIcons.includes(dataIcon)) continue;

              // Must be in the top toolbar area (y < 150)
              if (svgRect.top > 150 || svgRect.top < 0) continue;
              if (svgRect.width < 10 || svgRect.height < 10) continue;

              const parent = svg.closest('button, [role="button"], .cursor-pointer, div');
              if (!parent) continue;

              const parentRect = (parent as HTMLElement).getBoundingClientRect();
              if (parentRect.width > 15 && parentRect.width < 70 && parentRect.height > 15 && parentRect.height < 70) {
                toolbarButtons.push({ svg, rect: parentRect, dataIcon });
                logs.push(`Toolbar btn: ${dataIcon} at (${Math.round(svgRect.left)}, ${Math.round(svgRect.top)})`);
              }
            }

            logs.push(`Found ${toolbarButtons.length} toolbar buttons (excluding navbar)`);

            // Sort by X position (left to right)
            toolbarButtons.sort((a, b) => a.rect.left - b.rect.left);

            // Log all toolbar button icons for debugging
            const iconNames = toolbarButtons.map(b => b.dataIcon || 'unknown');
            logs.push(`Toolbar icons: ${iconNames.join(', ')}`);

            // STRATEGY 1a: Find by exact data-icon name (schedule, history, clock-outline, update)
            const historyIconNames = ['schedule', 'history', 'clock-outline', 'update', 'clock', 'access-time', 'restore'];
            for (const btn of toolbarButtons) {
              if (historyIconNames.some(name => btn.dataIcon.toLowerCase().includes(name))) {
                logs.push(`Found history by icon name: ${btn.dataIcon}`);
                const clickTarget = btn.svg.closest('button, [role="button"], .cursor-pointer') || btn.svg.parentElement;
                if (clickTarget) {
                  (clickTarget as HTMLElement).click();
                  return { success: true, method: 'icon-name', icon: btn.dataIcon, logs };
                }
              }
            }

            // STRATEGY 1b: Click the 6th button in toolbar (History is typically 6th)
            if (toolbarButtons.length >= 6) {
              const historyBtn = toolbarButtons[5]; // 0-indexed, so 5 = 6th button
              logs.push(`Clicking 6th toolbar button (index 5): ${historyBtn.dataIcon} at x=${Math.round(historyBtn.rect.left)}`);
              const clickTarget = historyBtn.svg.closest('button, [role="button"], .cursor-pointer') || historyBtn.svg.parentElement;
              if (clickTarget) {
                (clickTarget as HTMLElement).click();
                return { success: true, method: 'position-6th', icon: historyBtn.dataIcon, logs };
              }
            }

            // STRATEGY 2: Look for SVG with clock-like path pattern
            for (const svg of Array.from(allSvgs)) {
              const svgRect = svg.getBoundingClientRect();
              if (svgRect.left < pageWidth * 0.5 || svgRect.top > 200) continue;

              const path = svg.querySelector('path');
              if (path) {
                const d = path.getAttribute('d') || '';
                // Clock icons typically have specific path patterns
                if (d.includes('M12 2C6.5 2') || d.includes('M11.99 2C6.47') ||
                    d.includes('M12,2A10') || d.includes('schedule') ||
                    (d.includes('12') && d.includes('10') && d.length > 80 && d.length < 300)) {
                  logs.push(`Found clock by path pattern`);
                  const clickTarget = svg.closest('button, [role="button"], .cursor-pointer') || svg.parentElement;
                  if (clickTarget) {
                    (clickTarget as HTMLElement).click();
                    return { success: true, method: 'path-pattern', logs };
                  }
                }
              }
            }

            // STRATEGY 3: If toolbar has 8 buttons, click the one after magnify (5th from left)
            // Order: pencil(0), arrows(1), copy(2), trash(3), magnify(4), HISTORY(5), list(6), globe(7)
            if (toolbarButtons.length >= 5) {
              // Try button at index 5 (6th button)
              const btn = toolbarButtons[Math.min(5, toolbarButtons.length - 1)];
              logs.push(`Fallback: clicking button at index 5: ${btn.dataIcon}`);
              const clickTarget = btn.svg.closest('button, [role="button"], .cursor-pointer') || btn.svg.parentElement;
              if (clickTarget) {
                (clickTarget as HTMLElement).click();
                return { success: true, method: 'fallback-position', icon: btn.dataIcon, logs };
              }
            }

            return { success: false, error: 'History button not found in toolbar', logs };
          });

          console.log(`[B2PWeb] History button click result: ${JSON.stringify(historyButtonClicked)}`);

          if (!historyButtonClicked.success) {
            console.log(`[B2PWeb] Could not find History button for offer ${i + 1}, skipping...`);
            // Press Escape to close panel and continue
            await this.page.keyboard.press('Escape');
            await delay(500);
            continue;
          }

          // Wait for History popup to open
          await delay(2000);

          // Check if History popup opened (should show "History", "Carriers", "Users", "Active searches")
          const historyPopupOpened = await this.page.evaluate(() => {
            const body = document.body.innerText;
            return body.includes('History') || body.includes('Historique') ||
                   body.includes('Active searches') || body.includes('Recherches actives') ||
                   body.includes('Carriers') || body.includes('Transporteurs');
          });
          console.log(`[B2PWeb] History popup opened: ${historyPopupOpened}`);

          // ==========================================
          // CLICK ON "ACTIVE SEARCHES" TAB
          // The History popup shows: Carriers, Users, Active searches
          // We want to click on "Active searches" to see transporters
          // ==========================================
          console.log(`[B2PWeb] Looking for Active searches tab in History popup...`);

          // Now look for "Active searches" tab - this shows transporters searching for this route
          const activeSearchesClicked = await this.page.evaluate(() => {
            const results: string[] = [];

            // STRATEGY 1: Find by SVG data-icon="search-check-mark"
            const searchIcon = document.querySelector('svg[data-icon="search-check-mark"]');
            if (searchIcon) {
              results.push(`Found SVG with data-icon="search-check-mark"`);
              // Click the closest clickable parent (div with cursor-pointer)
              const parent = searchIcon.closest('div.cursor-pointer') || searchIcon.closest('div') || searchIcon.parentElement;
              if (parent) {
                results.push(`Clicking parent: ${parent.tagName}, class="${(parent as HTMLElement).className?.substring(0, 50)}"`);
                (parent as HTMLElement).click();
                return { clicked: true, method: 'data-icon-search', logs: results };
              }
            }

            // STRATEGY 2: Find by text "Active searches"
            const allElements = Array.from(document.querySelectorAll('div, span, button, a'));
            for (const item of allElements) {
              const text = (item.textContent || '').trim();
              // Look for exact "Active searches" text (the span contains just this text)
              if (text === 'Active searches' || text === 'Recherches actives') {
                results.push(`Found exact Active searches text: ${item.tagName}`);
                // Click the parent div with cursor-pointer class
                const clickable = item.closest('div.cursor-pointer') || item;
                (clickable as HTMLElement).click();
                return { clicked: true, method: 'exact-text', text, logs: results };
              }
            }

            // STRATEGY 3: Find elements containing "Active searches" with number badge
            for (const item of allElements) {
              const text = (item.textContent || '').trim();
              // Match pattern like "Active searches962" (text + number)
              if (text.toLowerCase().includes('active searches') && text.length < 50) {
                results.push(`Found Active searches by partial: "${text.substring(0, 40)}" in ${item.tagName}`);
                const clickable = item.closest('div.cursor-pointer') || item;
                (clickable as HTMLElement).click();
                return { clicked: true, method: 'partial-text', text: text.substring(0, 40), logs: results };
              }
            }

            // STRATEGY 4: Look for "Consultants" as fallback (old terminology)
            for (const item of allElements) {
              const text = (item.textContent || '').trim().toLowerCase();
              if (text.includes('consultant') && text.length < 30) {
                results.push(`Found Consultants as fallback: "${text}" in ${item.tagName}`);
                (item as HTMLElement).click();
                return { clicked: true, method: 'consultants-fallback', text, logs: results };
              }
            }

            // Log all data-icon values for debugging
            const allDataIcons = document.querySelectorAll('svg[data-icon]');
            const iconValues = Array.from(allDataIcons).map(i => i.getAttribute('data-icon'));
            results.push(`All data-icon values: ${iconValues.join(', ')}`);

            // Log page state
            const pageText = document.body.innerText.substring(0, 500);
            results.push(`Page sample: ${pageText.replace(/\n/g, ' ').substring(0, 200)}`);

            return { clicked: false, logs: results };
          });
          console.log(`[B2PWeb] Active searches menu clicked: ${JSON.stringify(activeSearchesClicked)}`);
          await delay(2000);

          // Debug: check if table is visible
          const tableInfo = await this.page.evaluate(() => {
            const tables = document.querySelectorAll('table');
            const divRows = document.querySelectorAll('[class*="row"], [role="row"]');
            const pageText = document.body.innerText;
            const hasScore = pageText.includes('Score');
            const hasSociete = pageText.includes('Société') || pageText.includes('Company');
            return {
              tableCount: tables.length,
              divRowCount: divRows.length,
              hasScore,
              hasSociete,
              sample: pageText.substring(0, 1000)
            };
          });
          console.log(`[B2PWeb] Table info: ${JSON.stringify(tableInfo)}`);

          // Extract consultants
          const consultants = await this.extractTransportersFromTable(maxTransportersPerSection);
          console.log(`[B2PWeb] Found ${consultants.length} consultants`);

          for (const t of consultants) {
            results.push(this.createTransporterResult(t, routeInfo, 'consultant'));
          }

          // ==========================================
          // GO BACK TO OFFER LIST
          // ==========================================
          await this.page.keyboard.press('Escape');
          await delay(500);
          await this.page.keyboard.press('Escape');
          await delay(1000);

          // If still on detail view, navigate back
          const stillOnDetail = await this.page.evaluate(() => {
            return document.body.innerText.includes('Historique') || document.body.innerText.includes('Activités');
          });

          if (stillOnDetail) {
            await this.page.goto('https://app.b2pweb.com/offer', {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
            await delay(2000);
          }

        } catch (err: any) {
          console.log(`[B2PWeb] Error processing offer ${i + 1}: ${err.message}`);
          // Try to recover by going back to offer list
          try {
            await this.page.goto('https://app.b2pweb.com/offer', {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
            await delay(2000);
          } catch (e) { /* ignore */ }
        }
      }

      console.log(`[B2PWeb] Total transporters scraped: ${results.length}`);
      return results;
    } catch (error: any) {
      console.error('[B2PWeb] Puppeteer scraping error:', error.message);
      return [];
    }
  }

  // Helper: Extract transporters from current table view
  // Table structure: Score (icon) | Société | Contact | E-mail | Téléphone | Date de consultation
  // Note: Score column contains only an icon, no text
  private async extractTransportersFromTable(maxRows: number): Promise<any[]> {
    if (!this.page) return [];

    return await this.page.evaluate((limit) => {
      const results: any[] = [];

      // Find all table rows - use Array.from to find the target table
      const tables = Array.from(document.querySelectorAll('table'));
      let targetTable: HTMLTableElement | null = null;

      // Find the table containing "Consultants" data (look for Company/Société and Contact columns)
      for (const table of tables) {
        const headerText = table.textContent || '';
        // Look for Company/Société AND Contact OR E-mail (Score is just an icon, may not have text)
        // Support both French (Société) and English (Company) UI
        const hasCompanyCol = headerText.includes('Société') || headerText.includes('Company');
        const hasContactCol = headerText.includes('Contact') || headerText.includes('E-mail') || headerText.includes('Email');
        if (hasCompanyCol && hasContactCol) {
          targetTable = table;
          console.log(`[B2PWeb] Found target table with headers`);
          break;
        }
      }

      // If still no table, try any table with tbody
      if (!targetTable) {
        const tablesWithTbody = Array.from(document.querySelectorAll('table tbody'));
        if (tablesWithTbody.length > 0) {
          targetTable = tablesWithTbody[0].closest('table');
          console.log(`[B2PWeb] Using first table with tbody`);
        }
      }

      // If no table found, try looking for any table rows
      const rows: NodeListOf<Element> = targetTable !== null
        ? targetTable.querySelectorAll('tbody tr, tr')
        : document.querySelectorAll('table tr, tbody tr');

      console.log(`[B2PWeb] Found ${rows.length} rows to process`);

      rows.forEach((row: Element, index: number) => {
        if (results.length >= limit) return;

        const cells = row.querySelectorAll('td');
        const text = row.textContent || '';

        // Skip header rows (th or rows containing header text)
        if (row.querySelectorAll('th').length > 0) return;
        // Skip header rows in both French and English
        if ((text.includes('Société') || text.includes('Company')) && text.includes('Contact') && (text.includes('E-mail') || text.includes('Email'))) return;

        // Skip if no cells or less than 4 cells
        if (cells.length < 4) return;

        // Table structure: Score (icon) | Société | Contact | E-mail | Téléphone | Date de consultation
        // Index:              0         |    1    |    2    |    3   |     4     |         5
        // Note: Score column (index 0) contains only an icon, so we skip it
        const cellTexts = Array.from(cells).map((c: Element) => c.textContent?.trim() || '');

        console.log(`[B2PWeb] Row ${index} (${cells.length} cells): ${JSON.stringify(cellTexts)}`);

        // Detect if first column is empty (icon only) and shift accordingly
        let companyName: string, contactName: string, email: string, phone: string, consultationDate: string;

        // If cellTexts[0] is empty or very short (icon), start from index 1
        if (!cellTexts[0] || cellTexts[0].length < 2) {
          // Score is icon, real data starts at index 1
          companyName = cellTexts[1] || '';
          contactName = cellTexts[2] || '';
          email = cellTexts[3] || '';
          phone = cellTexts[4] || '';
          consultationDate = cellTexts[5] || '';
        } else {
          // First column has text, might be a different structure
          // Check if first column looks like company name (not a date, not a number)
          if (cellTexts[0].includes('@') || cellTexts[0].match(/^\+?\d/)) {
            // Shift - first useful data is actually later
            companyName = cellTexts[0] || '';
            contactName = cellTexts[1] || '';
            email = cellTexts[2] || '';
            phone = cellTexts[3] || '';
            consultationDate = cellTexts[4] || '';
          } else {
            // Standard structure with Score as icon
            companyName = cellTexts[1] || '';
            contactName = cellTexts[2] || '';
            email = cellTexts[3] || '';
            phone = cellTexts[4] || '';
            consultationDate = cellTexts[5] || '';
          }
        }

        // Validate: must have at least company name or email
        if (!companyName && !email) {
          console.log(`[B2PWeb] Row ${index} skipped: no company or email`);
          return;
        }

        // Skip if it looks like a header row
        if (companyName === 'Société' || email === 'E-mail' || companyName === 'Contact') {
          console.log(`[B2PWeb] Row ${index} skipped: header row`);
          return;
        }

        console.log(`[B2PWeb] Row ${index} extracted: ${companyName} | ${contactName} | ${email}`);
        results.push({
          companyName: companyName,
          contactName: contactName,
          email: email,
          phone: phone,
          consultationDate: consultationDate
        });
      });

      console.log(`[B2PWeb] Extracted ${results.length} transporters total`);
      return results;
    }, maxRows);
  }

  // Helper: Create transporter result object
  private createTransporterResult(transporter: any, routeInfo: any, source: string): any {
    return {
      id: `b2pweb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      origin: {
        city: routeInfo.departure.replace(/^\d{2},\s*/, ''),
        department: routeInfo.departureDept
      },
      destination: {
        city: routeInfo.delivery.replace(/^\d{2},\s*/, ''),
        department: routeInfo.deliveryDept
      },
      company: {
        name: transporter.companyName,
        contactName: transporter.contactName,
        phone: transporter.phone,
        email: transporter.email,
        score: transporter.score || ''
      },
      source: source, // 'consultant', 'contact_request', 'active_search', 'user'
      consultationDate: transporter.consultationDate || '',
      scrapedAt: new Date().toISOString()
    };
  }

  // ============================================
  // SCRAPE DIRECTORY (ANNUAIRE)
  // ============================================
  // Scrape the B2PWeb directory to get complete company profiles:
  // - Company info (name, address, phone, SIRET, TVA, etc.)
  // - Vehicle types and quantities
  // - Freight search axes (departure -> arrival departments)
  // - Responsables (contacts)
  async scrapeDirectory(maxCompanies: number = 100): Promise<any[]> {
    if (!this.page) {
      console.log('[B2PWeb Directory] Not authenticated');
      return [];
    }

    try {
      console.log('[B2PWeb Directory] Starting directory scraping...');

      // Navigate to directory
      await this.page.goto('https://app.b2pweb.com/directory', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      await delay(2000);

      // Trigger search by clicking on "Nom" input and pressing Enter
      const searchTriggered = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        for (const input of inputs) {
          const label = input.closest('div')?.textContent?.toLowerCase() || '';
          if (label.includes('nom')) {
            input.focus();
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            return true;
          }
        }
        // Try pressing Enter on any input
        if (inputs.length > 0) {
          inputs[0].focus();
          return true;
        }
        return false;
      });

      if (searchTriggered) {
        await this.page.keyboard.press('Enter');
      }
      await delay(3000);

      const results: any[] = [];
      let processedCount = 0;

      // Get total number of companies in list
      const totalCompanies = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        let count = 0;
        rows.forEach(row => {
          const text = row.textContent || '';
          // Skip header rows
          if (!text.includes('Société') || !text.includes('Nom') || !text.includes('Pays')) {
            if (text.match(/\d{5}/) && text.length > 20) { // Has postal code and some content
              count++;
            }
          }
        });
        return count;
      });

      console.log(`[B2PWeb Directory] Found ${totalCompanies} companies in list`);

      // Process each company
      while (processedCount < Math.min(totalCompanies, maxCompanies)) {
        try {
          // Click on the company row
          const clicked = await this.page.evaluate((index) => {
            const rows = Array.from(document.querySelectorAll('tr, [role="row"]'));
            let dataRowIndex = 0;

            for (const row of rows) {
              const text = row.textContent || '';
              // Skip header rows
              if (text.includes('Société') && text.includes('Nom') && text.includes('Pays')) {
                continue;
              }
              if (text.match(/\d{5}/) && text.length > 20) {
                if (dataRowIndex === index) {
                  (row as HTMLElement).click();
                  return true;
                }
                dataRowIndex++;
              }
            }
            return false;
          }, processedCount);

          if (!clicked) {
            console.log(`[B2PWeb Directory] Could not click company ${processedCount + 1}`);
            processedCount++;
            continue;
          }

          await delay(1500);

          // Click "Voir plus d'informations" if available
          await this.page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            for (const btn of buttons) {
              if (btn.textContent?.toLowerCase().includes('voir plus')) {
                (btn as HTMLElement).click();
                return true;
              }
            }
            return false;
          });
          await delay(1000);

          // Extract company data from the right panel
          const companyData = await this.page.evaluate(() => {
            const getText = (label: string): string => {
              const allText = document.body.innerText;
              const regex = new RegExp(`${label}[:\\s]+([^\\n]+)`, 'i');
              const match = allText.match(regex);
              return match ? match[1].trim() : '';
            };

            const result: any = {
              companyName: '',
              address: '',
              postalCode: '',
              city: '',
              country: 'France',
              phone: '',
              fax: '',
              website: '',
              tva: '',
              siret: '',
              ape: '',
              effectif: '',
              responsables: [] as any[],
              vehicles: [] as any[],
              freightAxes: [] as any[]
            };

            // Extract from "Fiche d'identité" panel
            const panelText = document.body.innerText;

            // Company name - look for text after logo/verified badge
            const nameMatch = panelText.match(/Fiche d'identité[\s\S]*?([A-Z0-9][A-Z0-9\s\-\.]+?)(?=\nAdresse|\n10,|\nTéléphone)/);
            if (nameMatch) result.companyName = nameMatch[1].trim();

            // Address - multi-line
            const addressMatch = panelText.match(/Adresse\s+([\s\S]*?)(?=Téléphone|Fax)/i);
            if (addressMatch) {
              const addrLines = addressMatch[1].trim().split('\n').filter(l => l.trim());
              result.address = addrLines.slice(0, -1).join(', ');
              const lastLine = addrLines[addrLines.length - 1] || '';
              const postalMatch = lastLine.match(/(\d{5})\s+(.+)/);
              if (postalMatch) {
                result.postalCode = postalMatch[1];
                result.city = postalMatch[2].trim();
              }
            }

            // Phone
            const phoneMatch = panelText.match(/Téléphone\s*\+?(\d[\d\s]+)/i);
            if (phoneMatch) result.phone = '+' + phoneMatch[1].replace(/\s/g, '');

            // Fax
            const faxMatch = panelText.match(/Fax\s*\+?(\d[\d\s]+)/i);
            if (faxMatch) result.fax = '+' + faxMatch[1].replace(/\s/g, '');

            // Website
            const webMatch = panelText.match(/Site web\s+(www\.[^\s\n]+|https?:\/\/[^\s\n]+)/i);
            if (webMatch) result.website = webMatch[1];

            // TVA
            const tvaMatch = panelText.match(/N°\s*de\s*TVA\s+([A-Z]{2}\d+)/i);
            if (tvaMatch) result.tva = tvaMatch[1];

            // SIRET
            const siretMatch = panelText.match(/SIRET\s+(\d+)/i);
            if (siretMatch) result.siret = siretMatch[1];

            // APE
            const apeMatch = panelText.match(/APE\s+(\d+[A-Z]?)/i);
            if (apeMatch) result.ape = apeMatch[1];

            // Effectif
            const effectifMatch = panelText.match(/Effectif\s+(\d+)/i);
            if (effectifMatch) result.effectif = effectifMatch[1];

            // Responsables
            const respLabels = ['Entreprise', 'Commercial', 'Affrètement', 'Exploitation', 'Informatique'];
            respLabels.forEach(label => {
              const match = panelText.match(new RegExp(`${label}\\s+([A-ZÉÈÀÙa-zéèàù]+\\s+[A-ZÉÈÀÙ]+)`, 'i'));
              if (match && match[1] !== '-') {
                result.responsables.push({ role: label, name: match[1].trim() });
              }
            });

            // Vehicles - look for table after "Types de véhicules"
            const vehicleSection = panelText.match(/Types de véhicules[\s\S]*?(?=Axes de recherche|Garanties|$)/i);
            if (vehicleSection) {
              const vehicleMatches = vehicleSection[0].matchAll(/(Fourgon|Taut|Plateau|Semi|Porteur|Moins de \d+T\s*\d*)\s+(\d+)\s+([^\n]+)/gi);
              for (const match of vehicleMatches) {
                result.vehicles.push({
                  type: match[1].trim(),
                  quantity: parseInt(match[2]),
                  comment: match[3].trim()
                });
              }
            }

            // Freight axes - "Axes de recherche de fret"
            const axesSection = panelText.match(/Axes de recherche de fret[\s\S]*?(?=Garanties|Commentaires|$)/i);
            if (axesSection) {
              // Pattern: departures (dept numbers) -> arrivals (dept numbers)
              const axeMatches = axesSection[0].matchAll(/🇫🇷?\s*([\d,\s]+)\s*🇫🇷?\s*([\d,\s]+)/g);
              for (const match of axeMatches) {
                const departures = match[1].split(',').map(d => d.trim()).filter(d => d);
                const arrivals = match[2].split(',').map(d => d.trim()).filter(d => d);
                if (departures.length > 0 && arrivals.length > 0) {
                  result.freightAxes.push({
                    departures,
                    arrivals
                  });
                }
              }
            }

            // Alternative: look for rows with department numbers
            const rows = document.querySelectorAll('tr, [role="row"]');
            rows.forEach(row => {
              const text = row.textContent || '';
              if (text.includes('Départ') || text.includes('Arrivée')) return; // Header

              const deptMatches = text.match(/(\d{2}(?:,\s*\d{2})*)/g);
              if (deptMatches && deptMatches.length >= 2) {
                const deps = deptMatches[0].split(',').map(d => d.trim());
                const arrs = deptMatches[1].split(',').map(d => d.trim());
                if (deps.length > 0 && arrs.length > 0 && !result.freightAxes.some((a: any) =>
                  JSON.stringify(a.departures) === JSON.stringify(deps))) {
                  result.freightAxes.push({ departures: deps, arrivals: arrs });
                }
              }
            });

            return result;
          });

          if (companyData.companyName || companyData.siret || companyData.phone) {
            results.push({
              id: `b2pweb-dir-${Date.now()}-${processedCount}`,
              ...companyData,
              source: 'directory',
              scrapedAt: new Date().toISOString()
            });
            console.log(`[B2PWeb Directory] Scraped: ${companyData.companyName} - ${companyData.city} - ${companyData.freightAxes.length} axes`);
          }

          processedCount++;

          // Scroll down to load more if needed
          if (processedCount % 20 === 0) {
            await this.page.evaluate(() => {
              const container = document.querySelector('[class*="scroll"], [class*="list"], main');
              if (container) container.scrollTop += 500;
            });
            await delay(1000);
          }

        } catch (err: any) {
          console.log(`[B2PWeb Directory] Error processing company ${processedCount + 1}: ${err.message}`);
          processedCount++;
        }
      }

      console.log(`[B2PWeb Directory] Total companies scraped: ${results.length}`);
      return results;

    } catch (error: any) {
      console.error('[B2PWeb Directory] Scraping error:', error.message);
      return [];
    }
  }

  // Save directory company to database
  async saveDirectoryCompany(companyData: any): Promise<void> {
    if (!companyData.companyName && !companyData.siret) return;

    // Check if company already exists
    let company = await TransportCompany.findOne({
      $or: [
        { siret: companyData.siret },
        { companyName: { $regex: new RegExp(`^${(companyData.companyName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    const coveredDepartments = new Set<string>();
    companyData.freightAxes?.forEach((axis: any) => {
      axis.departures?.forEach((d: string) => coveredDepartments.add(d));
      axis.arrivals?.forEach((d: string) => coveredDepartments.add(d));
    });

    if (company) {
      // Update existing
      company.phone = companyData.phone || company.phone;
      company.website = companyData.website || company.website;
      company.siret = companyData.siret || company.siret;
      company.address = {
        street: companyData.address || company.address?.street,
        postalCode: companyData.postalCode || company.address?.postalCode,
        city: companyData.city || company.address?.city,
        departmentCode: companyData.postalCode?.substring(0, 2) || company.address?.departmentCode,
        country: companyData.country || company.address?.country || 'France'
      };
      company.transportInfo = {
        ...company.transportInfo,
        vehicleTypes: companyData.vehicles?.map((v: any) => v.type) || company.transportInfo?.vehicleTypes || [],
        coveredDepartments: Array.from(coveredDepartments),
        freightAxes: companyData.freightAxes || []
      } as any;
      company.source.lastUpdated = new Date();
      await company.save();
    } else {
      // Create new
      company = new TransportCompany({
        companyName: companyData.companyName,
        siret: companyData.siret,
        phone: companyData.phone,
        website: companyData.website,
        address: {
          street: companyData.address,
          postalCode: companyData.postalCode,
          city: companyData.city,
          departmentCode: companyData.postalCode?.substring(0, 2),
          country: companyData.country || 'France'
        },
        transportInfo: {
          services: [],
          specializations: [],
          vehicleTypes: companyData.vehicles?.map((v: any) => v.type) || [],
          vehicles: companyData.vehicles || [],
          operatingZones: ['National'],
          coveredDepartments: Array.from(coveredDepartments),
          coveredCountries: ['France'],
          freightAxes: companyData.freightAxes || []
        },
        mainContact: companyData.responsables?.[0] ? {
          firstName: companyData.responsables[0].name.split(' ')[0],
          lastName: companyData.responsables[0].name.split(' ').slice(1).join(' '),
          role: companyData.responsables[0].role
        } : undefined,
        contacts: companyData.responsables?.map((r: any) => ({
          firstName: r.name.split(' ')[0],
          lastName: r.name.split(' ').slice(1).join(' '),
          role: r.role
        })) || [],
        source: {
          type: 'scraping',
          name: 'b2pweb-directory',
          scrapedAt: new Date()
        },
        prospectionStatus: 'new',
        addedToLeadPool: false,
        tags: ['b2pweb', 'directory', 'transport'],
        isActive: true
      });
      await company.save();
    }
  }

  private async processOffer(rawOffer: any, job: ScrapingJob): Promise<void> {
    // Extraire l'ID externe
    const externalId = rawOffer.id?.toString() || rawOffer._id?.toString() || rawOffer.reference || `${Date.now()}-${Math.random()}`;

    // Vérifier si l'offre existe déjà
    const existingOffer = await TransportOffer.findOne({
      externalId,
      'source.name': 'b2pweb'
    });

    if (existingOffer) {
      // Mettre à jour la date de dernière vue
      existingOffer.source.lastSeenAt = new Date();
      await existingOffer.save();
      job.totalUpdated++;
      return;
    }

    // Parser les données de l'offre
    const offerData = this.parseB2PWebOffer(rawOffer);

    // Créer l'offre
    const offer = new TransportOffer({
      externalId,
      source: {
        name: 'b2pweb',
        url: rawOffer.url || `https://app.b2pweb.com/offer/${externalId}`,
        scrapedAt: new Date(),
        lastSeenAt: new Date()
      },
      ...offerData
    });

    await offer.save();
    job.totalImported++;

    // Créer ou mettre à jour l'entreprise de transport
    await this.upsertTransportCompany(offerData, offer._id);
  }

  private parseB2PWebOffer(raw: any): Partial<ITransportOffer> {
    // Parser les différents formats possibles de B2PWeb
    const origin = raw.origin || raw.departure || raw.loading || raw.from || {};
    const destination = raw.destination || raw.arrival || raw.delivery || raw.to || {};
    const company = raw.company || raw.carrier || raw.transporteur || raw.advertiser || {};
    const contact = raw.contact || company.contact || {};
    const cargo = raw.cargo || raw.freight || raw.load || raw.merchandise || {};
    const vehicle = raw.vehicle || raw.truck || raw.equipment || {};
    const price = raw.price || raw.tarif || raw.cost || {};

    return {
      offerType: raw.type === 'demand' || raw.type === 'freight' ? 'demand' : 'offer',

      company: {
        name: company.name || company.companyName || company.raison_sociale || raw.companyName || 'Inconnu',
        externalId: company.id?.toString() || company._id?.toString()
      },

      contact: {
        name: contact.name || contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || undefined,
        email: contact.email || contact.mail,
        phone: contact.phone || contact.tel || contact.telephone || contact.mobile
      },

      route: {
        origin: {
          city: origin.city || origin.ville || origin.locality,
          postalCode: origin.postalCode || origin.zipCode || origin.cp || origin.code_postal,
          department: origin.department || origin.departement,
          country: origin.country || origin.pays || 'France',
          lat: parseFloat(origin.lat || origin.latitude) || undefined,
          lng: parseFloat(origin.lng || origin.longitude || origin.lon) || undefined
        },
        destination: {
          city: destination.city || destination.ville || destination.locality,
          postalCode: destination.postalCode || destination.zipCode || destination.cp || destination.code_postal,
          department: destination.department || destination.departement,
          country: destination.country || destination.pays || 'France',
          lat: parseFloat(destination.lat || destination.latitude) || undefined,
          lng: parseFloat(destination.lng || destination.longitude || destination.lon) || undefined
        },
        distance: parseFloat(raw.distance || raw.km) || undefined
      },

      loadingDate: raw.loadingDate || raw.departureDate || raw.dateChargement ? new Date(raw.loadingDate || raw.departureDate || raw.dateChargement) : undefined,
      deliveryDate: raw.deliveryDate || raw.arrivalDate || raw.dateLivraison ? new Date(raw.deliveryDate || raw.arrivalDate || raw.dateLivraison) : undefined,

      cargo: {
        type: cargo.type || cargo.nature || cargo.category,
        weight: parseFloat(cargo.weight || cargo.poids || cargo.tonnage) || undefined,
        volume: parseFloat(cargo.volume || cargo.m3) || undefined,
        length: parseFloat(cargo.length || cargo.longueur) || undefined,
        width: parseFloat(cargo.width || cargo.largeur) || undefined,
        height: parseFloat(cargo.height || cargo.hauteur) || undefined,
        quantity: parseInt(cargo.quantity || cargo.quantite || cargo.pallets || cargo.nb_palettes) || undefined,
        description: cargo.description || cargo.details,
        adr: cargo.adr || cargo.dangerous || cargo.matiereDangereuse || false,
        temperature: cargo.temperature ? {
          min: parseFloat(cargo.temperature.min || cargo.tempMin),
          max: parseFloat(cargo.temperature.max || cargo.tempMax)
        } : undefined
      },

      vehicle: {
        type: vehicle.type || vehicle.vehicleType || vehicle.typeVehicule,
        capacity: parseFloat(vehicle.capacity || vehicle.tonnage) || undefined,
        features: vehicle.features || vehicle.equipements || vehicle.options || []
      },

      price: {
        amount: parseFloat(price.amount || price.value || price.montant || raw.price) || undefined,
        currency: price.currency || price.devise || 'EUR',
        type: price.negotiable ? 'negotiable' : price.amount ? 'fixed' : 'on_demand'
      },

      status: raw.status === 'expired' ? 'expired' : 'active',
      tags: ['b2pweb']
    };
  }

  private async upsertTransportCompany(offerData: Partial<ITransportOffer>, offerId: mongoose.Types.ObjectId): Promise<void> {
    const companyName = offerData.company?.name;
    if (!companyName || companyName === 'Inconnu') return;

    // Chercher l'entreprise existante
    let company = await TransportCompany.findOne({
      companyName: { $regex: new RegExp(`^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    const originDept = offerData.route?.origin?.postalCode?.substring(0, 2);
    const destDept = offerData.route?.destination?.postalCode?.substring(0, 2);

    if (company) {
      // Mettre à jour les départements couverts
      const coveredDepts = new Set(company.transportInfo?.coveredDepartments || []);
      if (originDept) coveredDepts.add(originDept);
      if (destDept) coveredDepts.add(destDept);

      company.transportInfo = {
        ...company.transportInfo,
        coveredDepartments: Array.from(coveredDepts)
      } as any;

      // Ajouter info contact si manquant
      if (!company.email && offerData.contact?.email) {
        company.email = offerData.contact.email;
      }
      if (!company.phone && offerData.contact?.phone) {
        company.phone = offerData.contact.phone;
      }

      company.source.lastUpdated = new Date();
      await company.save();

      // Lier l'offre à l'entreprise
      await TransportOffer.findByIdAndUpdate(offerId, {
        'company.transportCompanyId': company._id
      });
    } else {
      // Créer nouvelle entreprise
      company = new TransportCompany({
        companyName,
        email: offerData.contact?.email,
        phone: offerData.contact?.phone,
        address: {
          city: offerData.route?.origin?.city,
          postalCode: offerData.route?.origin?.postalCode,
          departmentCode: originDept,
          country: offerData.route?.origin?.country || 'France'
        },
        transportInfo: {
          services: [],
          specializations: [],
          vehicleTypes: offerData.vehicle?.type ? [offerData.vehicle.type] : [],
          operatingZones: ['National'],
          coveredDepartments: [originDept, destDept].filter(Boolean) as string[],
          coveredCountries: ['France']
        },
        mainContact: offerData.contact?.name ? {
          firstName: offerData.contact.name.split(' ')[0],
          lastName: offerData.contact.name.split(' ').slice(1).join(' '),
          email: offerData.contact.email,
          phone: offerData.contact.phone
        } : undefined,
        source: {
          type: 'scraping',
          name: 'b2pweb',
          scrapedAt: new Date()
        },
        prospectionStatus: 'new',
        addedToLeadPool: false,
        tags: ['b2pweb', 'transport'],
        isActive: true
      });

      await company.save();

      // Lier l'offre à l'entreprise
      await TransportOffer.findByIdAndUpdate(offerId, {
        'company.transportCompanyId': company._id
      });
    }
  }

  // ============================================
  // STATISTIQUES DES OFFRES
  // ============================================

  async getOffersStats(): Promise<{
    total: number;
    active: number;
    bySource: Record<string, number>;
    byOriginDepartment: Record<string, number>;
    byDestinationDepartment: Record<string, number>;
    topRoutes: Array<{ origin: string; destination: string; count: number }>;
    lastScrapedAt?: Date;
  }> {
    const [
      total,
      active,
      bySource,
      byOriginDept,
      byDestDept,
      topRoutes,
      lastOffer
    ] = await Promise.all([
      TransportOffer.countDocuments(),
      TransportOffer.countDocuments({ status: 'active' }),
      TransportOffer.aggregate([
        { $group: { _id: '$source.name', count: { $sum: 1 } } }
      ]),
      TransportOffer.aggregate([
        { $match: { 'route.origin.department': { $exists: true } } },
        { $group: { _id: '$route.origin.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      TransportOffer.aggregate([
        { $match: { 'route.destination.department': { $exists: true } } },
        { $group: { _id: '$route.destination.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      TransportOffer.aggregate([
        {
          $group: {
            _id: {
              origin: '$route.origin.city',
              destination: '$route.destination.city'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      TransportOffer.findOne().sort({ 'source.scrapedAt': -1 })
    ]);

    return {
      total,
      active,
      bySource: Object.fromEntries(bySource.map(s => [s._id || 'unknown', s.count])),
      byOriginDepartment: Object.fromEntries(byOriginDept.map(s => [s._id || 'unknown', s.count])),
      byDestinationDepartment: Object.fromEntries(byDestDept.map(s => [s._id || 'unknown', s.count])),
      topRoutes: topRoutes.map(r => ({
        origin: r._id.origin || 'Inconnu',
        destination: r._id.destination || 'Inconnu',
        count: r.count
      })),
      lastScrapedAt: lastOffer?.source?.scrapedAt
    };
  }

  // ============================================
  // RECHERCHE DES OFFRES
  // ============================================

  async searchOffers(filters: {
    search?: string;
    originDepartment?: string;
    destinationDepartment?: string;
    originCity?: string;
    destinationCity?: string;
    vehicleType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    companyId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ offers: ITransportOffer[]; total: number; pages: number }> {
    const query: any = {};

    if (filters.search) {
      query.$or = [
        { 'company.name': { $regex: filters.search, $options: 'i' } },
        { 'route.origin.city': { $regex: filters.search, $options: 'i' } },
        { 'route.destination.city': { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.originDepartment) {
      query['route.origin.department'] = filters.originDepartment;
    }

    if (filters.destinationDepartment) {
      query['route.destination.department'] = filters.destinationDepartment;
    }

    if (filters.originCity) {
      query['route.origin.city'] = { $regex: filters.originCity, $options: 'i' };
    }

    if (filters.destinationCity) {
      query['route.destination.city'] = { $regex: filters.destinationCity, $options: 'i' };
    }

    if (filters.vehicleType) {
      query['vehicle.type'] = { $regex: filters.vehicleType, $options: 'i' };
    }

    if (filters.dateFrom) {
      query.loadingDate = { $gte: filters.dateFrom };
    }

    if (filters.dateTo) {
      query.loadingDate = { ...query.loadingDate, $lte: filters.dateTo };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.companyId) {
      query['company.transportCompanyId'] = new mongoose.Types.ObjectId(filters.companyId);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [offers, total] = await Promise.all([
      TransportOffer.find(query)
        .sort({ 'source.scrapedAt': -1 })
        .skip(skip)
        .limit(limit)
        .populate('company.transportCompanyId', 'companyName email phone'),
      TransportOffer.countDocuments(query)
    ]);

    return {
      offers,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  // ============================================
  // ROUTES PAR ENTREPRISE
  // ============================================

  async getCompanyRoutes(companyId: string): Promise<{
    routes: Array<{
      origin: { city?: string; department?: string };
      destination: { city?: string; department?: string };
      count: number;
      lastSeen: Date;
    }>;
    totalOffers: number;
  }> {
    const routes = await TransportOffer.aggregate([
      { $match: { 'company.transportCompanyId': new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: {
            originCity: '$route.origin.city',
            originDept: '$route.origin.department',
            destCity: '$route.destination.city',
            destDept: '$route.destination.department'
          },
          count: { $sum: 1 },
          lastSeen: { $max: '$source.lastSeenAt' }
        }
      },
      { $sort: { count: -1 } as any }
    ]);

    const totalOffers = await TransportOffer.countDocuments({
      'company.transportCompanyId': new mongoose.Types.ObjectId(companyId)
    });

    return {
      routes: routes.map(r => ({
        origin: { city: r._id.originCity, department: r._id.originDept },
        destination: { city: r._id.destCity, department: r._id.destDept },
        count: r.count,
        lastSeen: r.lastSeen
      })),
      totalOffers
    };
  }

  // ============================================
  // LEGACY METHODS (companies)
  // ============================================

  async getStats(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
    byDepartment: Record<string, number>;
    addedToLeadPool: number;
    withEmail: number;
    withPhone: number;
  }> {
    const [
      total,
      bySource,
      byStatus,
      byDepartment,
      addedToLeadPool,
      withEmail,
      withPhone
    ] = await Promise.all([
      TransportCompany.countDocuments({ isActive: true }),
      TransportCompany.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$source.name', count: { $sum: 1 } } }
      ]),
      TransportCompany.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$prospectionStatus', count: { $sum: 1 } } }
      ]),
      TransportCompany.aggregate([
        { $match: { isActive: true, 'address.departmentCode': { $exists: true } } },
        { $group: { _id: '$address.departmentCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      TransportCompany.countDocuments({ isActive: true, addedToLeadPool: true }),
      TransportCompany.countDocuments({ isActive: true, email: { $exists: true, $ne: null } }),
      TransportCompany.countDocuments({ isActive: true, phone: { $exists: true, $ne: null } })
    ]);

    return {
      total,
      bySource: Object.fromEntries(bySource.map(s => [s._id || 'unknown', s.count])),
      byStatus: Object.fromEntries(byStatus.map(s => [s._id || 'unknown', s.count])),
      byDepartment: Object.fromEntries(byDepartment.map(s => [s._id || 'unknown', s.count])),
      addedToLeadPool,
      withEmail,
      withPhone
    };
  }

  async searchCompanies(filters: {
    search?: string;
    status?: string;
    source?: string;
    department?: string;
    hasEmail?: boolean;
    addedToLeadPool?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ companies: ITransportCompany[]; total: number; pages: number }> {
    const query: any = { isActive: true };

    if (filters.search) {
      query.$or = [
        { companyName: { $regex: filters.search, $options: 'i' } },
        { 'address.city': { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.status) query.prospectionStatus = filters.status;
    if (filters.source) query['source.name'] = filters.source;
    if (filters.department) query['address.departmentCode'] = filters.department;

    if (filters.hasEmail !== undefined) {
      if (filters.hasEmail) {
        query.email = { $exists: true, $nin: [null, ''] };
      } else {
        query.$or = [{ email: { $exists: false } }, { email: null }, { email: '' }];
      }
    }

    if (filters.addedToLeadPool !== undefined) {
      query.addedToLeadPool = filters.addedToLeadPool;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      TransportCompany.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      TransportCompany.countDocuments(query)
    ]);

    return { companies, total, pages: Math.ceil(total / limit) };
  }

  async addToLeadPool(companyIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of companyIds) {
      try {
        await TransportCompany.findByIdAndUpdate(id, {
          addedToLeadPool: true,
          addedToLeadPoolAt: new Date(),
          prospectionStatus: 'to_contact'
        });
        success++;
      } catch (e) {
        failed++;
      }
    }

    return { success, failed };
  }

  async updateProspectionStatus(
    companyId: string,
    status: ITransportCompany['prospectionStatus'],
    notes?: string
  ): Promise<ITransportCompany | null> {
    return TransportCompany.findByIdAndUpdate(
      companyId,
      { prospectionStatus: status, ...(notes && { notes }) },
      { new: true }
    );
  }

  async deleteCompany(companyId: string): Promise<boolean> {
    const result = await TransportCompany.findByIdAndUpdate(companyId, { isActive: false }, { new: true });
    return !!result;
  }

  async exportToCSV(filters?: { status?: string; source?: string; department?: string }): Promise<string> {
    const query: any = { isActive: true };
    if (filters?.status) query.prospectionStatus = filters.status;
    if (filters?.source) query['source.name'] = filters.source;
    if (filters?.department) query['address.departmentCode'] = filters.department;

    const companies = await TransportCompany.find(query);

    const headers = ['Nom entreprise', 'Nom legal', 'SIRET', 'Email', 'Telephone', 'Ville', 'Code postal', 'Departement', 'Services', 'Types vehicules', 'Source', 'Statut', 'Score'];

    const rows = companies.map(c => [
      c.companyName || '', c.legalName || '', c.siret || '', c.email || '', c.phone || '',
      c.address?.city || '', c.address?.postalCode || '', c.address?.departmentCode || '',
      c.transportInfo?.services?.join(';') || '', c.transportInfo?.vehicleTypes?.join(';') || '',
      c.source?.name || '', c.prospectionStatus || '', c.score?.toString() || ''
    ]);

    return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  }

  // Import CSV
  async importFromCSV(jobId: string, data: Array<{
    companyName: string;
    email?: string;
    phone?: string;
    city?: string;
    postalCode?: string;
    services?: string;
    vehicleTypes?: string;
    siret?: string;
  }>, sourceName: string): Promise<void> {
    const job = scrapingJobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    job.startedAt = new Date();
    job.totalFound = data.length;

    try {
      for (const row of data) {
        try {
          const existing = await TransportCompany.findOne({
            $or: [
              { companyName: { $regex: new RegExp(`^${row.companyName}$`, 'i') } },
              ...(row.siret ? [{ siret: row.siret }] : []),
              ...(row.email ? [{ email: row.email.toLowerCase() }] : [])
            ]
          });

          if (existing) {
            job.totalDuplicates++;
            continue;
          }

          const company = new TransportCompany({
            companyName: row.companyName,
            siret: row.siret,
            email: row.email?.toLowerCase(),
            phone: row.phone,
            address: {
              city: row.city,
              postalCode: row.postalCode,
              departmentCode: row.postalCode?.substring(0, 2),
              country: 'France'
            },
            transportInfo: {
              services: row.services?.split(',').map(s => s.trim()) || [],
              vehicleTypes: row.vehicleTypes?.split(',').map(s => s.trim()) || [],
              specializations: [],
              operatingZones: ['National'],
              coveredDepartments: row.postalCode ? [row.postalCode.substring(0, 2)] : [],
              coveredCountries: ['France']
            },
            source: { type: 'import', name: sourceName, scrapedAt: new Date() },
            prospectionStatus: 'new',
            addedToLeadPool: false,
            tags: ['import', sourceName],
            isActive: true
          });

          await company.save();
          job.totalImported++;
        } catch (error: any) {
          job.errors.push(`Erreur ligne ${row.companyName}: ${error.message}`);
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error: any) {
      job.status = 'failed';
      job.errors.push(error.message);
      job.completedAt = new Date();
    }
  }
}

export const transportScrapingService = new TransportScrapingService();
