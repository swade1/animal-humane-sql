import fs from 'fs';

// At the end of your scraper, after collecting all dog IDs seen on the website:
export function saveLatestScrapedIds(scrapedDogIds: number[]) {
  fs.writeFileSync('public/latest_scraped_ids.json', JSON.stringify(scrapedDogIds));
}

// Usage in your scraper:
// saveLatestScrapedIds(scrapedDogIds);