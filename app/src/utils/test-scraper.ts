
import { runScraper } from './scraper.ts';

(async () => {
  try {
    await runScraper();
    console.log('Scraper ran successfully.');
  } catch (error) {
    console.error('Scraper error:', error);
    process.exit(1); // Ensures workflow fails on error
  }
})();
