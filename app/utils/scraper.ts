// Scraper for animalhumanenm.org and its iframes
// Uses node-fetch and cheerio for HTML parsing

import puppeteer from 'puppeteer';

// Define Dog type for mapping
type Dog = {
  id: number;
  name: string;
  location: string;
  origin: string;
  status: string;
  url: string;
  intake_date: string | null;
  length_of_stay_days: number | null;
  birthdate: string | null;
  age_group: string;
  breed: string;
  secondary_breed: string;
  weight_group: string;
  color: string;
  bite_quarantine: number | null;
  returned: number | null;
  latitude: string | null;
  longitude: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

// Example: Scrape main page and extract iframe URLs
export async function getIframeUrls(mainUrl: string): Promise<string[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const availableAnimalsUrls: string[] = [];

  // Intercept network requests and responses
  page.on('response', async (response: { url: () => string }) => {
    try {
      const url = response.url();
      if (url.includes('available-animals')) {
        if (!availableAnimalsUrls.includes(url)) {
          availableAnimalsUrls.push(url);
          console.log('Captured available-animals URL:', url);
        }
      }
    } catch {
      // Ignore errors
    }
  });

  await page.goto(mainUrl, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForSelector('.shelterluv', { timeout: 60000 });

  // Extract all iframe src URLs (for completeness)
  const iframeUrls = await page.$$eval('iframe', (iframes: HTMLIFrameElement[]) =>
    iframes.map((iframe: HTMLIFrameElement) => iframe.src)
  );

  await browser.close();
  // Combine iframe URLs and captured available-animals URLs, removing duplicates
  const allUrls = Array.from(new Set([...iframeUrls, ...availableAnimalsUrls]));
  console.log('Found iframe URLs:', iframeUrls);
  console.log('Found available-animals URLs:', availableAnimalsUrls);
  console.log('All combined URLs:', allUrls);
  return allUrls;
}



import fetch from 'node-fetch';
import { supabase } from '../lib/supabaseClient';
import { logDogHistory } from './dogHistory';

export async function scrapeAvailableAnimalsJson(jsonUrl: string): Promise<Dog[]> {
  try {
    const res = await fetch(jsonUrl);
    if (!res.ok) {
      console.error(`Failed to fetch available-animals JSON: ${jsonUrl} (status: ${res.status})`);
      return [];
    }
    const data = await res.json() as { animals?: Record<string, unknown>[] };
    if (!data.animals || !Array.isArray(data.animals)) {
      console.error(`No animals array in JSON: ${jsonUrl}`);
      return [];
    }
    const today = new Date();
    const mapped: Dog[] = data.animals.map((parsed: Record<string, unknown>) => {
      // Helper for safe property extraction
      const getString = (obj: Record<string, unknown>, key: string): string => typeof obj[key] === 'string' ? obj[key] as string : '';
      const getNumber = (obj: Record<string, unknown>, key: string): number => typeof obj[key] === 'number' ? obj[key] as number : (typeof obj[key] === 'string' ? parseInt(obj[key] as string, 10) : 0);

      const p = parsed;
      const intakeDate = p.intake_date ? new Date(getNumber(p, 'intake_date') * 1000) : null;
      let lengthOfStay: number | null = null;
      if (intakeDate) {
        // Calculate difference in days (UTC)
        const diffTime = today.setHours(0,0,0,0) - intakeDate.setHours(0,0,0,0);
        lengthOfStay = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      // Handle age_group as nested object
      let ageGroup = '';
      if (typeof p.age_group === 'object' && p.age_group !== null && 'name' in p.age_group) {
        const rawAgeGroup = (p.age_group as { name?: string }).name || '';
        if (['Puppy', 'Adult', 'Senior'].includes(rawAgeGroup)) {
          ageGroup = rawAgeGroup;
        } else {
          ageGroup = '';
        }
      }
      return {
        id: getNumber(p, 'nid'),
        name: getString(p, 'name'),
        location: getString(p, 'location'),
        origin: '', // Manual entry required
        status: getNumber(p, 'adoptable') === 1 ? 'Available' : '', // Needs logic for other statuses
        url: getString(p, 'public_url'),
        intake_date: intakeDate ? intakeDate.toISOString().slice(0, 10) : null,
        length_of_stay_days: lengthOfStay,
        birthdate: p.birthday ? new Date(getNumber(p, 'birthday') * 1000).toISOString().slice(0, 10) : null,
        age_group: ageGroup,
        breed: getString(p, 'breed'),
        secondary_breed: getString(p, 'secondary_breed'),
        weight_group: getString(p, 'weight_group'),
        color: getString(p, 'secondary_color') ? `${getString(p, 'primary_color')} and ${getString(p, 'secondary_color')}` : getString(p, 'primary_color'),
        bite_quarantine: null, // Manual entry required
        returned: null, // Manual entry required
        latitude: null, // Manual entry required
        longitude: null, // Manual entry required
        notes: getString(p, 'kennel_description') || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
    console.log('Mapped dog data from available-animals JSON:', mapped);
    return mapped;
  } catch (err) {
    console.error('Error scraping available-animals JSON:', jsonUrl, err);
    return [];
  }
}

// Main entry for scheduled scraping
export async function runScraper() {
  const mainUrl = 'https://animalhumanenm.org/adopt/adoptable-dogs';
  console.log('Using mainUrl:', mainUrl);
  try {
    const allUrls = await getIframeUrls(mainUrl);
    // Filter for available-animals JSON endpoints
    const availableAnimalsUrls = allUrls.filter(url => url.includes('available-animals'));
    if (availableAnimalsUrls.length === 0) {
      console.error('No available-animals JSON URLs found.');
      return;
    }
    for (const jsonUrl of availableAnimalsUrls) {
      const dogDataArr = await scrapeAvailableAnimalsJson(jsonUrl);
      if (dogDataArr.length === 0) continue;


      // Fetch name, location, and status for comparison
      const ids = dogDataArr.map(d => d.id);
      const { data: existingDogs, error: fetchError } = await supabase
        .from('dogs')
        .select('id,location,status,name')
        .in('id', ids);
      if (fetchError) {
        console.error('Error fetching existing dogs for history logging:', fetchError, 'Dog IDs:', ids);
      }
      // Maps for quick lookup
      const locationMap = new Map<number, string>();
      const statusMap = new Map<number, string>();
      const nameMap = new Map<number, string>();
      if (existingDogs) {
        for (const d of existingDogs) {
          locationMap.set(d.id, d.location);
          statusMap.set(d.id, d.status);
          nameMap.set(d.id, d.name);
        }
      }

      for (const dog of dogDataArr) {
        // Location change
        const oldLocation = locationMap.get(dog.id) ?? null;
        const newLocation = dog.location ?? null;
        if (oldLocation && newLocation && oldLocation !== newLocation) {
          await logDogHistory({
            dogId: dog.id,
            name: dog.name,
            eventType: 'location_change',
            oldValue: oldLocation,
            newValue: newLocation,
            notes: 'Location updated by scraper'
          });
          console.error(`Location change detected for dog ID ${dog.id} (${dog.name}): '${oldLocation}' -> '${newLocation}'`);
        }
        // Status change
        const oldStatus = statusMap.get(dog.id) ?? null;
        const newStatus = dog.status ?? null;
        if (oldStatus && newStatus && oldStatus !== newStatus) {
          await logDogHistory({
            dogId: dog.id,
            name: dog.name,
            eventType: 'status_change',
            oldValue: oldStatus,
            newValue: newStatus,
            notes: 'Status updated by scraper'
          });
          console.error(`Status change detected for dog ID ${dog.id} (${dog.name}): '${oldStatus}' -> '${newStatus}'`);
        }
        // Name change
        const oldName = nameMap.get(dog.id) ?? null;
        const newName = dog.name ?? null;
        if (oldName && newName && oldName !== newName) {
          await logDogHistory({
            dogId: dog.id,
            name: dog.name,
            eventType: 'name_change',
            oldValue: oldName,
            newValue: newName,
            notes: 'Name updated by scraper'
          });
          console.error(`Name change detected for dog ID ${dog.id}: '${oldName}' -> '${newName}'`);
        }
      }

      // Upsert each dog record into Supabase
      const { error } = await supabase
        .from('dogs')
        .upsert(dogDataArr, { onConflict: 'id' });
      if (error) {
        const dogIds = dogDataArr.map(d => d.id).join(', ');
        const dogNames = dogDataArr.map(d => d.name).join(', ');
        console.error(`Supabase upsert error:`, error, `Dog IDs: ${dogIds}`, `Dog Names: ${dogNames}`);
      } else {
        const dogNames = dogDataArr.map(d => d.name).join(', ');
        console.log(`Upserted ${dogDataArr.length} dogs to Supabase.`);
        console.log(`Upserted dog names: ${dogNames}`);
      }
    }
  } catch (err) {
    console.error('Error in runScraper:', err);
  }
}
