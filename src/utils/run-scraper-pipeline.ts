
// run-scraper-pipeline.ts
// Orchestrates the full animal data pipeline: fetch, enrich/upsert, adoption check

import { enrichAndUpsertAnimals } from './enrich_and_upsert_animals';

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


// Invoke main if this script is run directly (ESM-safe)
if (typeof require !== 'undefined' && require.main === module) {
  main();
}


