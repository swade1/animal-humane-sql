// Global error handlers for diagnostics
process.on('uncaughtException', (err) => {
  console.error('[GLOBAL ERROR] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[GLOBAL ERROR] Unhandled Rejection:', reason);
});

console.log('=== File loaded: run-scraper-pipeline.ts ===');

// run-scraper-pipeline.ts
// Orchestrates the full animal data pipeline: fetch, enrich/upsert, adoption check

import { enrichAndUpsertAnimals } from './enrich_and_upsert_animals';

export async function main() {
  console.log('=== Entered main() in run-scraper-pipeline.ts ===');
  console.log('=== Scraper pipeline main() started ===');
  try {
    console.log('[STEP] About to call enrichAndUpsertAnimals');
    await enrichAndUpsertAnimals();
    console.log('[STEP] enrichAndUpsertAnimals completed');
  } catch (err) {
    console.error('[ERROR] enrichAndUpsertAnimals failed:', err);
    process.exit(1);
  }
  let adoptionCheck;
  try {
    console.log('[STEP] About to import check-adoptions-api');
    adoptionCheck = await import('./check-adoptions-api');
    console.log('[STEP] check-adoptions-api imported');
  } catch (err) {
    console.error('[ERROR] import check-adoptions-api failed:', err);
    process.exit(1);
  }
  try {
    console.log('[STEP] About to call adoptionCheck.main');
    if (adoptionCheck && typeof adoptionCheck.main === 'function') {
      await adoptionCheck.main();
      console.log('[STEP] adoptionCheck.main completed');
    } else {
      throw new Error('Could not find a callable main export in check-adoptions-api.ts');
    }
  } catch (err) {
    console.error('[ERROR] adoptionCheck.main failed:', err);
    process.exit(1);
  }
  console.log('Pipeline completed successfully.');
}


// Always invoke main (ESM-compatible)
main();



