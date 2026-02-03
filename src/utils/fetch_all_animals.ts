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
    const urlRegex = /https:\/\/new\.shelterluv\.com\/api\/v3\/available-animals\/[0-9]+\?saved_query=[0-9]+[^"']*/g;
    // Diagnostic: print a summary of the HTML
    console.log('[getAvailableAnimalsJsonUrls] Main page HTML length:', html.length);
    console.log('[getAvailableAnimalsJsonUrls] Main page HTML preview:', html.slice(0, 500));
  const matches = html.match(urlRegex) || [];
  // Remove duplicates
    console.log('[getAvailableAnimalsJsonUrls] Matched URLs:', matches);
  return Array.from(new Set(matches));
    console.log('[getAvailableAnimalsJsonUrls] Unique URLs:', Array.from(new Set(matches)));
}

// Fetch and combine all animals from all endpoints
export async function fetchAllAnimals(): Promise<Record<string, unknown>[]> {
  const urls = await getAvailableAnimalsJsonUrls();
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
  console.log('[fetch_all_animals] Fetched animals (pre-deduplication):', allAnimals.map(a => ({ nid: a.nid, name: a.name })));
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


