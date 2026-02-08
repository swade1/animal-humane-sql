// fetch_all_animals.ts
// Fetches and combines all available-animals JSON endpoints for animalhumanenm.org
// To be used for enrichment and upsert pipeline


import fetch from 'node-fetch';

// Always use the 6 provided API URLs
const ANIMAL_API_URLS = [
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=12363&embedded=1&iframeId=shelterluv_wrap_1761166982&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=8888&embedded=1&iframeId=shelterluv_wrap_1764539234&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=9274&embedded=1&iframeId=shelterluv_wrap_1742914295&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=12946&embedded=1&iframeId=shelterluv_wrap_1764539274&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=8889&embedded=1&iframeId=shelterluv_wrap_1741279482&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=8887&embedded=1&iframeId=shelterluv_wrap_1741279189&columns=1',
];

// Fetch and combine all animals from all endpoints
export async function fetchAllAnimals(): Promise<Record<string, unknown>[]> {
  let allAnimals: Record<string, unknown>[] = [];
  for (const url of ANIMAL_API_URLS) {
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


