const fs = require('fs');
const file = 'c:/Users/rtard/rt-frontend-apps/apps/api-admin/src/services/scraping-service.ts';
let content = fs.readFileSync(file, 'utf8');

const oldImport = `import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';`;

const newImport = `import * as cheerio from 'cheerio';

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
}`;

if (content.includes("import puppeteer")) {
  content = content.replace(oldImport, newImport);
  // Also update puppeteer.launch to use loadPuppeteer
  content = content.replace(/puppeteer\.launch/g, '(await loadPuppeteer()).launch');
  fs.writeFileSync(file, content);
  console.log('File updated successfully');
} else {
  console.log('Import already modified or not found');
}
