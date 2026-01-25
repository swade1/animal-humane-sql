


console.log('[test-scraper] Script starting...');
console.log('[test-scraper] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '[set]' : '[not set]');
console.log('[test-scraper] Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[set]' : '[not set]');
console.log('[test-scraper] Node version:', process.version);
console.log('[test-scraper] Platform:', process.platform, process.arch);

import { runScraper, checkForAdoptions } from './scraper';

(async () => {
  try {
    console.log('[test-scraper] Invoking runScraper (will connect to Supabase and upsert dog data)...');
    await runScraper();
    console.log('[test-scraper] Scraper ran successfully.');
    console.log('[test-scraper] Checking for adoptions...');
    await checkForAdoptions();
    console.log('[test-scraper] Adoption check complete.');
  } catch (error) {
    console.error('[test-scraper] FATAL: runScraper failed.');
    console.error('[test-scraper] Error details:', error);
    process.exit(1); // Ensures workflow fails on error
  }
})();
