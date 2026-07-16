// CLI entrypoint for the daily unlisted-returns check.
// Run manually with: npx tsx src/utils/run-unlisted-returns-check.ts

import { checkForUnlistedReturns } from './check-unlisted-returns';

async function main() {
  console.log('=== Unlisted returns check started ===');
  try {
    await checkForUnlistedReturns();
    console.log('=== Unlisted returns check completed ===');
  } catch (err) {
    console.error('[ERROR] checkForUnlistedReturns failed:', err);
    process.exit(1);
  }
}

main();
