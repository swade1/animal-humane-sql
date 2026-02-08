// fetch_all_animals.ts
// Fetches and combines all available-animals JSON endpoints for animalhumanenm.org
// Dynamically discovers API URLs from the main page


import fetch from 'node-fetch';

const MAIN_URL = 'https://animalhumanenm.org/adopt/adoptable-dogs';

// Helper to extract all available-animals URLs from the main page
async function getAvailableAnimalsUrls() {
  const res = await fetch(MAIN_URL);
  const html = await res.text();
  const urlRegex = /https:\/\/animalhumanenm\.org\/available-animals\?location=[^"']+/g;
  const matches = html.match(urlRegex) || [];
  const urls = Array.from(new Set(matches));
  console.log('[fetch_all_animals] Discovered URLs from main page:', urls);
  return urls;
}

// Fetch and combine all animals from all endpoints
export async function fetchAllAnimals(): Promise<Record<string, unknown>[]> {
  const urls = await getAvailableAnimalsUrls();
  let allAnimals: Record<string, unknown>[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const data = await res.json() as { animals?: Array<Record<string, unknown>> };
      if (data.animals && Array.isArray(data.animals)) {
        allAnimals = allAnimals.concat(data.animals);
      }
    } catch (err) {
      console.error(`[fetch_all_animals] Error fetching/parsing ${url}:`, err);
    }
  }
  console.log('[fetch_all_animals] Fetched animals (pre-deduplication, full objects):', allAnimals);
  console.log('[fetch_all_animals] Fetched animals (pre-deduplication, summary):', allAnimals.map(a => ({ nid: a.nid, name: a.name })));
  // Deduplicate by nid
  const seen = new Set();
  const deduped = allAnimals.filter((a) => {
    if (seen.has(a.nid)) return false;
    seen.add(a.nid);
    return true;
  });
  console.log('[fetch_all_animals] Deduped animals:', deduped.map(a => ({ nid: a.nid, name: a.name })));
  return deduped;
}


