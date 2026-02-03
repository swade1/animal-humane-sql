// run-scraper-pipeline.ts
// Orchestrates the full animal data pipeline: fetch, enrich/upsert, adoption check

import { enrichAndUpsertAnimals } from './enrich_and_upsert_animals';

export async function main() {
  console.log('=== Scraper pipeline started ===');
  try {
    console.log('Step 1: Fetch, enrich, and upsert animal data...');
    await enrichAndUpsertAnimals();
    console.log('Step 2: Check for adoptions and update statuses...');
    // Dynamically import to avoid circular dependency
    const adoptionCheck = await import('./check-adoptions-api');
    if (adoptionCheck && typeof adoptionCheck.main === 'function') {
      await adoptionCheck.main();
    } else {
      throw new Error('Could not find a callable main export in check-adoptions-api.ts');
    }
    console.log('Pipeline completed successfully.');
  } catch (err) {
    console.error('Pipeline failed:', err);
    process.exit(1);
  }
}

// Invoke main if this script is run directly
if (typeof require !== 'undefined' && require.main === module) {
  main();
}


