// At the end of your scraping logic, after collecting all dog IDs seen on the website:
import fs from 'fs';

// Assume scrapedDogIds is an array of IDs, e.g. [212095229, 212097486, ...]
const scrapedDogIds = /* your array of scraped dog IDs */;

fs.writeFileSync('public/latest_scraped_ids.json', JSON.stringify(scrapedDogIds));

// This will save the file to public/latest_scraped_ids.json, making it accessible to your Next.js frontend.
