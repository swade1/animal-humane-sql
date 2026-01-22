import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { runScraper } from './scraper';

(async () => {
  try {
    await runScraper();
    console.log('Scraper ran successfully.');
  } catch (error) {
    console.error('Scraper error:', error);
    process.exit(1); // Ensures workflow fails on error
  }
})();
