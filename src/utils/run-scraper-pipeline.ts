// run-scraper-pipeline.ts
// Orchestrates the full animal data pipeline: fetch, enrich/upsert, adoption check

import { enrichAndUpsertAnimals } from './enrich_and_upsert_animals';

async function main() {
  try {
    console.log('Step 1: Fetch, enrich, and upsert animal data...');
    await enrichAndUpsertAnimals();
    console.log('Step 2: Check for adoptions and update statuses...');
    // Dynamically import to avoid circular dependency
    const adoptionCheck = await import('./check-adoptions-api');
    if (adoptionCheck && typeof adoptionCheck.default === 'function') {
      await adoptionCheck.default();
    } else if (adoptionCheck && typeof adoptionCheck.main === 'function') {
      await adoptionCheck.main();
    } else {
      throw new Error('Could not find a callable main/default export in check-adoptions-api.ts');
    }
    console.log('Pipeline completed successfully.');
  } catch (err) {
    console.error('Pipeline failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
