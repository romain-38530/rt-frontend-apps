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
      const maxOffers = Math.min(500, scrapingConfig.maxOffersPerRun); // Increased to 500 offers per run for longer scraping sessions
      const maxTransportersPerSection = 2500; // Increased to capture all transporters per offer

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

      // Track processed offers by their unique identifier (route + date)
      const processedOffers = new Set<string>();

      // Process each offer
      for (let i = 0; i < Math.min(offerCount, maxOffers); i++) {
        try {
          console.log(`[B2PWeb] Processing offer ${i + 1}/${Math.min(offerCount, maxOffers)}...`);

          // For virtual scroller: scroll to position i, then get and click the row
          const scrollAndGetInfo = await this.page.evaluate((rowIndex) => {
            const logs: string[] = [];

            // Try multiple scroller selectors (B2PWeb may use different ones)
            const scrollerSelectors = [
              '.vue-recycle-scroller',
              '[class*="virtual-scroller"]',
              '[class*="recycle-scroller"]',
              '.v-data-table__wrapper',
              '.table-responsive',
              'table tbody',
              '[class*="scroll"]'
            ];

            let scroller: Element | null = null;
            for (const selector of scrollerSelectors) {
              scroller = document.querySelector(selector);
              if (scroller) {
                logs.push(`Found scroller with selector: ${selector}`);
                break;
              }
            }

            if (scroller) {
              // Each row is approximately 50px high - scroll to make row i visible
              const targetScroll = rowIndex * 50;
              (scroller as HTMLElement).scrollTop = targetScroll;
              logs.push(`Scrolled to ${targetScroll}px for row ${rowIndex}`);
            } else {
              logs.push('No scroller found, trying window scroll');
              // Fallback: scroll the window
              window.scrollTo(0, rowIndex * 50);
            }

            // Get all visible scroller items - try multiple selectors
            const itemSelectors = [
              '.vue-recycle-scroller__item-wrapper > div',
              '.vue-recycle-scroller__item-view',
              'tr[class*="row"]',
              'table tbody tr',
              '[class*="list-item"]',
              '[class*="grid-row"]'
            ];

            let scrollerItems: NodeListOf<Element> = document.querySelectorAll(itemSelectors[0]);
            for (const selector of itemSelectors) {
              const items = document.querySelectorAll(selector);
              if (items.length > scrollerItems.length) {
                scrollerItems = items;
                logs.push(`Using item selector: ${selector} (${items.length} items)`);
              }
            }
            logs.push(`Found ${scrollerItems.length} scroller items total`);

            // Find visible items and their positions
            const visibleItems: { index: number; top: number; text: string }[] = [];
            scrollerItems.forEach((item, idx) => {
              const rect = (item as HTMLElement).getBoundingClientRect();
              if (rect.top > 0 && rect.top < 800 && rect.height > 0) {
                visibleItems.push({
                  index: idx,
                  top: rect.top,
                  text: (item.textContent || '').substring(0, 60)
                });
              }
            });
            logs.push(`Visible items: ${visibleItems.length}`);
            if (visibleItems.length > 0) {
              logs.push(`First visible: ${JSON.stringify(visibleItems[0])}`);
            }

            return { logs, visibleCount: visibleItems.length };
          }, i);

          console.log(`[B2PWeb] Scroll result: ${JSON.stringify(scrollAndGetInfo)}`);
          await delay(500); // Wait for virtual scroller to render

          // Now get the row info - try to get the Nth visible item (matching i modulo visible count)
          const offerInfo = await this.page.evaluate((rowIndex) => {
            // Find items using multiple selectors
            const itemSelectors = [
              '.vue-recycle-scroller__item-wrapper > div',
              '.vue-recycle-scroller__item-view',
              'tr[class*="row"]',
              'table tbody tr',
              '[class*="list-item"]',
              '[class*="grid-row"]'
            ];

            let scrollerItems: NodeListOf<Element> = document.querySelectorAll(itemSelectors[0]);
            for (const selector of itemSelectors) {
              const items = document.querySelectorAll(selector);
              if (items.length > scrollerItems.length) {
                scrollerItems = items;
              }
            }

            // Get visible items
            const visibleItems: HTMLElement[] = [];
            for (const item of Array.from(scrollerItems)) {
              const rect = (item as HTMLElement).getBoundingClientRect();
              if (rect.top > 0 && rect.top < 800 && rect.height > 0) {
                visibleItems.push(item as HTMLElement);
              }
            }

            // Get the first visible item (after scrolling, this should be the target row)
            const targetItem = visibleItems[0];
            if (!targetItem) return null;

            const text = targetItem.textContent || '';
            // More flexible pattern - find department codes
            const deptMatches = text.match(/(\d{2})[,\s]+([A-ZÉÈÀÙÂÊÎÔÛ][A-Za-zéèàùâêîôûÉÈÀÙÂÊÎÔÛ\-\s]+)/gi) || [];

            let departure = '';
            let delivery = '';
            let departureDept = '';
            let deliveryDept = '';

            if (deptMatches.length >= 2) {
              departure = (deptMatches[0] || '').trim();
              delivery = (deptMatches[1] || '').trim();
              departureDept = departure.match(/^(\d{2})/)?.[1] || '';
              deliveryDept = delivery.match(/^(\d{2})/)?.[1] || '';
            }

            // Use row index as primary identifier since virtual scroller recycles elements
            const uniqueId = `offer-${rowIndex}`;

            return {
              departure: departure || 'Unknown',
              delivery: delivery || 'Unknown',
              departureDept,
              deliveryDept,
              uniqueId,
              rowText: text.substring(0, 80)
            };
          }, i);

          if (!offerInfo) {
            console.log(`[B2PWeb] Could not find visible row for offer ${i + 1}`);
            continue;
          }

          console.log(`[B2PWeb] Route ${i + 1}: ${offerInfo.departure} -> ${offerInfo.delivery} (${offerInfo.rowText.substring(0, 40)}...)`);

          // ==========================================
          // STEP 1: CLICK ON THE OFFER ROW TO OPEN "OFFER INFORMATIONS" PANEL
          // ==========================================
          console.log(`[B2PWeb] Clicking on offer row ${i} to open Offer informations panel...`);

          const rowClicked = await this.page.evaluate(() => {
            const logs: string[] = [];

            // Find items in virtual scroller
            const scrollerItems = document.querySelectorAll('.vue-recycle-scroller__item-wrapper > div, .vue-recycle-scroller__item-view');
            logs.push(`Found ${scrollerItems.length} scroller items`);

            // Find the first visible row in viewport
            let targetRow: HTMLElement | null = null;
            for (const item of Array.from(scrollerItems)) {
              const rect = (item as HTMLElement).getBoundingClientRect();
              if (rect.top >= 0 && rect.top < window.innerHeight) {
                targetRow = item as HTMLElement;
                break;
              }
            }

            if (!targetRow) {
              return { success: false, error: 'No visible row found', logs };
            }

            const rowText = (targetRow.textContent || '').substring(0, 80);
            logs.push(`Clicking row with text: ${rowText}`);

            // Click on the middle of the row (avoid checkbox on left)
            const rect = targetRow.getBoundingClientRect();
            const clickX = rect.left + rect.width * 0.5;
            const clickY = rect.top + rect.height / 2;

            // Dispatch click event
            const clickEvent = new MouseEvent('click', {
              bubbles: true, cancelable: true, view: window,
              clientX: clickX, clientY: clickY, button: 0
            });
            targetRow.dispatchEvent(clickEvent);

            logs.push(`Clicked row at (${Math.round(clickX)}, ${Math.round(clickY)})`);
            return { success: true, logs };
          });

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

            // B2PWeb uses Vue.js with virtual scrolling
            // The History button can use icon "history" OR "schedule" (clock icon)
            // We need to find the right one in the panel toolbar area

            // Icons that could be the History button
            const historyIconNames = ['history', 'schedule', 'clock', 'clock-outline', 'access-time'];

            // STRATEGY 1: Find all buttons on page and their SVG icons
            const allButtons = document.querySelectorAll('button');
            logs.push(`Found ${allButtons.length} total buttons`);

            // Collect info about all buttons with SVGs
            const buttonsWithSvg: { btn: Element, icon: string, x: number, y: number, classes: string }[] = [];
            for (const btn of Array.from(allButtons)) {
              const svg = btn.querySelector('svg');
              if (svg) {
                const dataIcon = svg.getAttribute('data-icon') || '';
                const rect = btn.getBoundingClientRect();
                const classes = btn.className || '';
                if (rect.width > 5 && rect.top > 50 && rect.top < 800) {
                  buttonsWithSvg.push({
                    btn,
                    icon: dataIcon,
                    x: Math.round(rect.left),
                    y: Math.round(rect.top),
                    classes: classes.substring(0, 50)
                  });
                }
              }
            }
            logs.push(`Buttons with SVG: ${buttonsWithSvg.map(b => b.icon + '@(' + b.x + ',' + b.y + ')').join(', ')}`);

            // Find history/schedule button
            const historyButton = buttonsWithSvg.find(b => historyIconNames.includes(b.icon));
            if (historyButton) {
              logs.push(`Found ${historyButton.icon} button at (${historyButton.x}, ${historyButton.y})`);
              (historyButton.btn as HTMLElement).scrollIntoView({ block: 'center' });
              (historyButton.btn as HTMLElement).click();
              return { success: true, method: 'button-with-svg', icon: historyButton.icon, logs };
            }

            // STRATEGY 2: Find clickable elements (div, span) containing history/schedule SVG
            // Sometimes Vue.js apps use divs with cursor-pointer instead of buttons
            const clickableSelectors = 'button, [role="button"], .cursor-pointer, div[class*="btn"], span[class*="btn"]';
            const clickables = document.querySelectorAll(clickableSelectors);
            logs.push(`Found ${clickables.length} clickable elements`);

            for (const el of Array.from(clickables)) {
              const svg = el.querySelector('svg');
              if (svg) {
                const dataIcon = svg.getAttribute('data-icon') || '';
                if (historyIconNames.includes(dataIcon)) {
                  const rect = el.getBoundingClientRect();
                  if (rect.width > 5 && rect.top > 50 && rect.top < 800) {
                    logs.push(`Found ${dataIcon} in clickable at (${Math.round(rect.left)}, ${Math.round(rect.top)})`);
                    (el as HTMLElement).scrollIntoView({ block: 'center' });
                    (el as HTMLElement).click();
                    return { success: true, method: 'clickable-with-svg', icon: dataIcon, logs };
                  }
                }
              }
            }

            // STRATEGY 3: Find SVGs directly and click their parent
            for (const iconName of historyIconNames) {
              const svgs = document.querySelectorAll(`svg[data-icon="${iconName}"]`);
              logs.push(`Found ${svgs.length} SVGs with data-icon=${iconName}`);

              for (const svg of Array.from(svgs)) {
                const rect = svg.getBoundingClientRect();
                // Skip icons in the offer list rows (they are at y=135, 190, 245, etc - spaced by ~55px)
                // The panel toolbar should be at a unique Y position
                if (rect.top > 50 && rect.top < 800 && rect.width > 5) {
                  logs.push(`${iconName} SVG at (${Math.round(rect.left)}, ${Math.round(rect.top)})`);

                  // Find closest clickable parent
                  const parent = svg.closest('button, [role="button"], .cursor-pointer, div') as HTMLElement;
                  if (parent) {
                    logs.push(`Clicking parent: ${parent.tagName}.${parent.className?.substring(0, 30)}`);
                    parent.scrollIntoView({ block: 'center' });
                    parent.click();
                    return { success: true, method: 'svg-parent', icon: iconName, logs };
                  }
                }
              }
            }

            // Debug: List all unique data-icon values
            const allDataIcons = new Set<string>();
            document.querySelectorAll('svg[data-icon]').forEach(svg => {
              allDataIcons.add(svg.getAttribute('data-icon') || '');
            });
            logs.push(`All unique data-icons: ${Array.from(allDataIcons).join(', ')}`);

            return { success: false, error: 'History button not found', logs };
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
            results.push(this.createTransporterResult(t, offerInfo, 'consultant'));
          }

          // ==========================================
          // GO BACK TO OFFER LIST
          // ==========================================
          console.log(`[B2PWeb] Closing popups and returning to offer list...`);

          // Try clicking outside popup to close it (click on left side of screen)
          await this.page.mouse.click(100, 300);
          await delay(500);

          // Close all popups with multiple Escape presses
          await this.page.keyboard.press('Escape');
          await delay(500);
          await this.page.keyboard.press('Escape');
          await delay(500);
          await this.page.keyboard.press('Escape');
          await delay(1000);

          // Check if we're still on the offer detail page (URL contains offer ID)
          const currentUrl = this.page.url();
          const isOnOfferDetail = currentUrl.includes('/offer/') && currentUrl.match(/\/offer\/\d+/);

          // Check if popup is still visible
          const stillHasPopup = await this.page.evaluate(() => {
            return document.body.innerText.includes('Consultants') ||
                   document.body.innerText.includes('Historique') ||
                   document.body.innerText.includes('Activités') ||
                   document.body.innerText.includes('Active searches') ||
                   document.body.innerText.includes('Recherches actives') ||
                   document.body.innerText.includes('Utilisateurs ayant consulté');
          });

          console.log(`[B2PWeb] Current URL: ${currentUrl}, isOnOfferDetail: ${isOnOfferDetail}, stillHasPopup: ${stillHasPopup}`);

          // If popup is still visible, try more aggressive closing
          if (stillHasPopup) {
            console.log(`[B2PWeb] Popup still visible, trying more clicks outside...`);
            // Click multiple times in different positions to ensure popup closes
            await this.page.mouse.click(50, 400);
            await delay(300);
            await this.page.mouse.click(50, 500);
            await delay(300);
            await this.page.keyboard.press('Escape');
            await delay(500);
          }

          // Check if panel is still open and close it by clicking X button
          const panelClosed = await this.page.evaluate(() => {
            // Look for close button in panel
            const closeSelectors = [
              '[aria-label="Close"]',
              '[aria-label="Fermer"]',
              'button[class*="close"]',
              '.close-button',
              'button svg[class*="close"]',
              '[class*="panel"] button:first-child'
            ];
            for (const sel of closeSelectors) {
              const closeBtn = document.querySelector(sel);
              if (closeBtn) {
                (closeBtn as HTMLElement).click();
                return `Closed via ${sel}`;
              }
            }
            return null;
          });

          if (panelClosed) {
            console.log(`[B2PWeb] ${panelClosed}`);
            await delay(500);
          }

          // Final escape presses to ensure clean state
          await this.page.keyboard.press('Escape');
          await delay(300);
          await this.page.keyboard.press('Escape');
          await delay(500);

          // Only navigate back if absolutely necessary (if we're on wrong URL)
          const finalUrl = this.page.url();
          const needsNavigation = !finalUrl.includes('/offer') || (finalUrl.includes('/offer/') && finalUrl.match(/\/offer\/\d+/));

          if (needsNavigation) {
            console.log(`[B2PWeb] URL changed, navigating back to offer list...`);
            await this.page.goto('https://app.b2pweb.com/offer', {
              waitUntil: 'networkidle2',
              timeout: 60000
            });
            await delay(2000);

            // Re-apply the Déposant filter after navigation
            console.log(`[B2PWeb] Re-applying Déposant filter...`);
            await this.setDeposantFilter();
            await delay(1500);
          } else {
            console.log(`[B2PWeb] Still on offer list, no navigation needed`);
          }

          // Small delay before processing next offer
          console.log(`[B2PWeb] Offer ${i + 1} completed. Moving to next offer...`);
          await delay(1000);

        } catch (err: any) {
          console.log(`[B2PWeb] Error processing offer ${i + 1}: ${err.message}`);
          // Try to recover by going back to offer list
          try {
            console.log(`[B2PWeb] Recovering - navigating to offer list...`);
            await this.page.goto('https://app.b2pweb.com/offer', {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
            await delay(2000);
            // Re-apply filter after recovery
            await this.setDeposantFilter();
            await delay(1000);
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

  // Helper: Extract transporters from current view
  // B2PWeb uses DIVs instead of TABLE for the data grid
  // Structure: Score (icon) | Company | Contact | E-mail | Telephone | Date of the search
  private async extractTransportersFromTable(maxRows: number): Promise<any[]> {
    if (!this.page) return [];

    // First, scroll down the transporters list to load all items (virtual scroller)
    console.log('[B2PWeb Extract] Scrolling to load all transporters...');

    // Debug: log what containers we can find
    const debugContainers = await this.page.evaluate(() => {
      const allScrollable: string[] = [];
      document.querySelectorAll('*').forEach(el => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.scrollHeight > htmlEl.clientHeight + 50) {
          allScrollable.push(`${el.tagName}.${el.className.split(' ').slice(0,2).join('.')} (h:${htmlEl.scrollHeight}, ch:${htmlEl.clientHeight})`);
        }
      });
      return allScrollable.slice(0, 10);
    });
    console.log('[B2PWeb Extract] Scrollable containers found:', JSON.stringify(debugContainers));

    let previousEmailCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50; // Max 50 scrolls to avoid infinite loop

    while (scrollAttempts < maxScrollAttempts) {
      // Scroll the transporters list container
      const scrollResult = await this.page.evaluate(() => {
        const logs: string[] = [];
        let scrolled = false;

        // Try ALL scrollable elements on the page
        document.querySelectorAll('*').forEach(el => {
          const htmlEl = el as HTMLElement;
          // Check if element is scrollable (has more content than visible)
          if (htmlEl.scrollHeight > htmlEl.clientHeight + 100) {
            const prevScroll = htmlEl.scrollTop;
            htmlEl.scrollTop += 500; // Scroll down 500px
            if (htmlEl.scrollTop !== prevScroll) {
              scrolled = true;
              logs.push(`Scrolled ${el.tagName}.${el.className.split(' ')[0]}`);
            }
          }
        });

        // Count current emails visible
        const pageText = document.body.innerText;
        const emailMatches = pageText.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/gi) || [];
        const uniqueEmails = new Set(emailMatches.map(e => e.toLowerCase()));

        return {
          scrolled,
          emailCount: uniqueEmails.size,
          logs: logs.slice(0, 5)
        };
      });

      console.log(`[B2PWeb Extract] Scroll ${scrollAttempts + 1}: ${scrollResult.emailCount} emails, scrolled: ${scrollResult.scrolled}, logs: ${scrollResult.logs.join(', ')}`);

      // If no new emails loaded after scroll, we've reached the end
      // Wait for 5 consecutive scrolls with no new emails before stopping
      if (scrollResult.emailCount === previousEmailCount && scrollAttempts > 10) {
        console.log('[B2PWeb Extract] No new emails after multiple scrolls, stopping');
        break;
      }

      previousEmailCount = scrollResult.emailCount;
      scrollAttempts++;

      // Stop if we have enough
      if (scrollResult.emailCount >= maxRows) {
        console.log(`[B2PWeb Extract] Reached max rows (${maxRows}), stopping scroll`);
        break;
      }

      await delay(800); // Wait for virtual scroller to load more items (increased for network latency)
    }

    console.log(`[B2PWeb Extract] Finished scrolling after ${scrollAttempts} attempts, found ${previousEmailCount} emails`);

    // Now extract all the data
    const debugInfo = await this.page.evaluate(() => {
      const pageText = document.body.innerText;
      const emailMatches = pageText.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/gi) || [];
      const phoneMatches = pageText.match(/(?:\+\d{2}\s?\d[\d\s]{8,}|0[1-9](?:[\s.-]?\d{2}){4})/g) || [];

      return {
        emailsFoundInPage: emailMatches.length,
        phonesFoundInPage: phoneMatches.length,
        pageTextLength: pageText.length
      };
    });

    console.log('[B2PWeb Extract] Final count:', JSON.stringify(debugInfo));

    const results = await this.page.evaluate((limit) => {
      const extracted: any[] = [];
      const seenEmails = new Set<string>();

      // Get full page text to find emails
      const pageText = document.body.innerText;

      // Find ALL emails in the page using regex
      const emailPattern = /[\w.-]+@[\w.-]+\.[a-z]{2,}/gi;
      const allEmails = pageText.match(emailPattern) || [];

      // For each email, try to find its surrounding context (row data)
      for (const email of allEmails) {
        if (extracted.length >= limit) break;
        if (seenEmails.has(email.toLowerCase())) continue;
        seenEmails.add(email.toLowerCase());

        // Skip admin/system emails
        if (email.includes('b2pweb') || email.includes('admin') || email.includes('support')) continue;

        // Find the DOM element containing this email
        const xpath = `//*[contains(text(), '${email}')]`;
        const emailElements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        let companyName = '';
        let contactName = '';
        let phone = '';
        let consultationDate = '';

        if (emailElements.snapshotLength > 0) {
          // Get the first element containing the email
          const emailEl = emailElements.snapshotItem(0) as Element;

          // Go up to find a row-like container
          let container = emailEl.parentElement;
          for (let i = 0; i < 5 && container; i++) {
            const text = container.textContent || '';
            // If container has phone and date, it's likely the row
            if (text.match(/\+\d{2}/) && text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
              break;
            }
            container = container.parentElement;
          }

          if (container) {
            const rowText = container.textContent || '';

            // Extract phone - support both international and French national formats
            const phoneMatch = rowText.match(/(\+\d{2}\s?\d[\d\s]{8,}|0[1-9](?:[\s.-]?\d{2}){4})/);
            phone = phoneMatch ? phoneMatch[1].replace(/[\s.-]+/g, ' ').trim() : '';

            // Extract date
            const dateMatch = rowText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
            consultationDate = dateMatch ? dateMatch[1] : '';

            // Try to find company name - look for text blocks that look like company names
            // Usually UPPERCASE or contains TRANSPORT, TRANS, LOGISTIC, etc.
            const textBlocks = rowText.split(/[\s\n]+/).filter(t => t.length > 2);
            for (const block of textBlocks) {
              if (block === block.toUpperCase() && block.length > 3 && block.length < 40) {
                if (!block.includes('@') && !block.match(/^\+?\d/) && !block.match(/^(Score|Company|Contact|E-mail|Telephone|Date)/i)) {
                  if (!companyName) {
                    companyName = block;
                  }
                }
              }
            }

            // Look for contact name - B2PWeb format: "Prénom NOM" or "Prénom-Prénom NOM"
            // Examples: "Mathis CHASSAT", "Jean-Michel SOUSA", "Émilie CHARLEMAGNE"
            const contactMatch = rowText.match(/([A-ZÀ-Ü][a-zà-ÿ]+(?:-[A-ZÀ-Ü][a-zà-ÿ]+)?\s+[A-ZÀ-Ü]{2,})/);
            if (contactMatch && !contactMatch[1].includes('@') && !contactMatch[1].match(/^(TRANSPORT|LOGISTIC|EXPRESS|SARL|SAS|EURL)/i)) {
              contactName = contactMatch[1];
            }
          }
        }

        // If no company name found, use email domain as company identifier
        if (!companyName && email) {
          const domain = email.split('@')[1]?.split('.')[0];
          if (domain && domain.length > 2) {
            companyName = domain.toUpperCase();
          }
        }

        extracted.push({
          companyName: companyName || 'Unknown',
          contactName,
          email,
          phone,
          consultationDate
        });
      }

      return extracted;
    }, maxRows);

    console.log(`[B2PWeb Extract] Found ${results.length} transporters`);
    if (results.length > 0) {
      console.log('[B2PWeb Extract] First 3 results:', JSON.stringify(results.slice(0, 3), null, 2));
    }

    return results;
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
    try {
      // Extraire l'ID externe
      const externalId = rawOffer.id?.toString() || rawOffer._id?.toString() || rawOffer.reference || `${Date.now()}-${Math.random()}`;

      // Parser les données de l'offre
      const offerData = this.parseB2PWebOffer(rawOffer);

      console.log(`[B2PWeb processOffer] Processing: ${offerData.company?.name || 'Unknown'} | ${offerData.contact?.email || 'no email'}`);

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
        console.log(`[B2PWeb processOffer] Updated existing offer: ${externalId}`);
        return;
      }

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
      console.log(`[B2PWeb processOffer] Created new offer: ${externalId} | Company: ${offerData.company?.name}`);

      // Créer ou mettre à jour l'entreprise de transport
      await this.upsertTransportCompany(offerData, offer._id);
    } catch (error: any) {
      console.error(`[B2PWeb processOffer] Error: ${error.message}`);
      job.errors.push(`processOffer error: ${error.message}`);
    }
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

    // Handle our scrapeOffersWithPuppeteer format where contact info is in company object
    const companyName = company.name || company.companyName || company.raison_sociale || raw.companyName || 'Inconnu';
    const contactName = company.contactName || contact.name || contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || undefined;
    const contactEmail = company.email || contact.email || contact.mail;
    const contactPhone = company.phone || contact.phone || contact.tel || contact.telephone || contact.mobile;

    // Build the result object - only include fields with actual data
    const result: Partial<ITransportOffer> = {
      offerType: raw.type === 'demand' || raw.type === 'freight' ? 'demand' : 'offer',

      company: {
        name: companyName,
        externalId: company.id?.toString() || company._id?.toString()
      },

      contact: {
        name: contactName,
        email: contactEmail,
        phone: contactPhone
      },

      route: {
        origin: {
          city: origin.city || origin.ville || origin.locality,
          postalCode: origin.postalCode || origin.zipCode || origin.cp || origin.code_postal,
          department: origin.department || origin.departement,
          country: origin.country || origin.pays || 'France'
        },
        destination: {
          city: destination.city || destination.ville || destination.locality,
          postalCode: destination.postalCode || destination.zipCode || destination.cp || destination.code_postal,
          department: destination.department || destination.departement,
          country: destination.country || destination.pays || 'France'
        }
      },

      status: raw.status === 'expired' ? 'expired' : 'active',
      tags: ['b2pweb', raw.source || 'consultant']
    };

    // Only add cargo if there's actual data
    const cargoType = cargo.type || cargo.nature || cargo.category;
    const cargoWeight = parseFloat(cargo.weight || cargo.poids || cargo.tonnage) || undefined;
    if (cargoType || cargoWeight) {
      result.cargo = {
        type: cargoType,
        weight: cargoWeight,
        description: cargo.description || cargo.details
      };
    }

    // Only add vehicle if there's data
    const vehicleType = vehicle.type || vehicle.vehicleType || vehicle.typeVehicule;
    if (vehicleType) {
      result.vehicle = {
        type: vehicleType
      };
    }

    return result;
  }

  private async upsertTransportCompany(offerData: Partial<ITransportOffer>, offerId: mongoose.Types.ObjectId): Promise<void> {
    const companyName = offerData.company?.name;
    if (!companyName || companyName === 'Inconnu') {
      console.log(`[B2PWeb upsertCompany] Skipping - no company name`);
      return;
    }
    console.log(`[B2PWeb upsertCompany] Processing: ${companyName} | email: ${offerData.contact?.email || 'none'} | phone: ${offerData.contact?.phone || 'none'} | contact: ${offerData.contact?.name || 'none'}`);

    // Chercher l'entreprise existante
    let company = await TransportCompany.findOne({
      companyName: { $regex: new RegExp(`^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    const originDept = offerData.route?.origin?.postalCode?.substring(0, 2) || offerData.route?.origin?.department;
    const destDept = offerData.route?.destination?.postalCode?.substring(0, 2) || offerData.route?.destination?.department;

    // Créer l'objet de recherche active
    const activeSearch = {
      route: {
        origin: {
          city: offerData.route?.origin?.city,
          postalCode: offerData.route?.origin?.postalCode,
          department: offerData.route?.origin?.department,
          departmentCode: originDept,
          country: offerData.route?.origin?.country || 'France'
        },
        destination: {
          city: offerData.route?.destination?.city,
          postalCode: offerData.route?.destination?.postalCode,
          department: offerData.route?.destination?.department,
          departmentCode: destDept,
          country: offerData.route?.destination?.country || 'France'
        }
      },
      consultationDate: new Date(),
      source: 'b2pweb',
      lastSeenAt: new Date()
    };

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

      // Ajouter ou mettre à jour la recherche active
      const existingSearchIndex = (company.activeSearches || []).findIndex(s =>
        s.route.origin.departmentCode === originDept &&
        s.route.destination.departmentCode === destDept
      );

      if (existingSearchIndex >= 0) {
        // Mettre à jour la date de dernière consultation
        company.activeSearches[existingSearchIndex].lastSeenAt = new Date();
        company.activeSearches[existingSearchIndex].consultationDate = new Date();
      } else {
        // Ajouter une nouvelle recherche active
        if (!company.activeSearches) {
          company.activeSearches = [];
        }
        company.activeSearches.push(activeSearch as any);
      }

      company.source.lastUpdated = new Date();
      await company.save();
      console.log(`[B2PWeb upsertCompany] Updated existing company: ${companyName} | Routes: ${company.activeSearches?.length || 0}`);

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
        activeSearches: [activeSearch],
        isActive: true
      });

      await company.save();
      console.log(`[B2PWeb upsertCompany] Created NEW company: ${companyName} | ID: ${company._id}`);

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
