// fetch_all_animals.ts
// Fetches and combines all available-animals JSON endpoints for animalhumanenm.org
// To be used for enrichment and upsert pipeline

import fetch from 'node-fetch';

const MAIN_URL = 'https://animalhumanenm.org/adopt/adoptable-dogs';

// Helper to extract all available-animals JSON URLs from the main page
export async function getAvailableAnimalsJsonUrls(): Promise<string[]> {
  const res = await fetch(MAIN_URL);
  const html = await res.text();
  // Regex to find all available-animals JSON URLs
  const urlRegex = /https:\/\/animalhumanenm\.org\/available-animals\?location=[^"']+/g;
  const matches = html.match(urlRegex) || [];
  // Remove duplicates
  return Array.from(new Set(matches));
}

// Fetch and combine all animals from all endpoints
export async function fetchAllAnimals(): Promise<any[]> {
  const urls = await getAvailableAnimalsJsonUrls();
  let allAnimals: any[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.animals && Array.isArray(data.animals)) {
        allAnimals = allAnimals.concat(data.animals);
      }
    } catch (err) {
      console.error(`[fetch_all_animals] Error fetching/parsing ${url}:`, err);
    }
  }
  // Deduplicate by nid
  const seen = new Set();
  const deduped = allAnimals.filter((a) => {
    if (seen.has(a.nid)) return false;
    seen.add(a.nid);
    return true;
  });
  return deduped;
}

if (require.main === module) {
  fetchAllAnimals().then((animals) => {
    console.log(`Fetched ${animals.length} unique animals.`);
    // Optionally print sample
    console.log(JSON.stringify(animals.slice(0, 2), null, 2));
  });
}
