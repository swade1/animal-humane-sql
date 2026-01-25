// Check for adoptions by scraping each available dog's page
export async function checkForAdoptions() {
  // 1. Get all dogs with status 'available'
  const { data: availableDogs, error } = await supabase
    .from('dogs')
    .select('id, name, location, url, status')
    .eq('status', 'available');
  if (error) {
    console.error('[adoption-check] Error fetching available dogs:', error);
    return;
  }
  if (!availableDogs || availableDogs.length === 0) {
    console.log('[adoption-check] No available dogs to check.');
    return;
  }
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const dog of availableDogs) {
    try {
      const page = await browser.newPage();
      await page.goto(dog.url, { waitUntil: 'networkidle2', timeout: 60000 });
      // Adjust selector as needed to match the location field on the dog's page
      const location = await page.$eval('.location, .dog-location', el => el.textContent?.trim() || '');
      if (!location) {
        // Location is empty: dog has been adopted
        // 1. Find most recent location (prefer current, else from dog_history)
        let oldLocation = dog.location;
        if (!oldLocation) {
          // Try to get last non-empty location from dog_history
          const { data: history, error: histErr } = await supabase
            .from('dog_history')
            .select('old_value')
            .eq('dog_id', dog.id)
            .eq('event_type', 'location_change')
            .order('id', { ascending: false })
            .limit(1);
          if (!histErr && history && history.length > 0) {
            oldLocation = history[0].old_value;
          }
        }
        const adoptionDate = new Date().toISOString();
        // Log location_change
        await logDogHistory({
          dogId: dog.id,
          eventType: 'location_change',
          oldValue: oldLocation,
          newValue: '',
          notes: `Location cleared (adopted) at ${adoptionDate}`
        });
        // Log status_change
        await logDogHistory({
          dogId: dog.id,
          eventType: 'status_change',
          oldValue: 'available',
          newValue: 'adopted',
          notes: `Status set to adopted at ${adoptionDate}`
        });
        // Update dog record in DB
        await supabase
          .from('dogs')
          .update({ status: 'adopted', location: '', adopted_date: adoptionDate })
          .eq('id', dog.id);
        console.log(`[adoption-check] Dog adopted: ${dog.name} (ID: ${dog.id}) at ${adoptionDate}`);
      }
      await page.close();
    } catch (err) {
      console.error(`[adoption-check] Error checking dog ${dog.name} (ID: ${dog.id}):`, err);
    }
  }
  await browser.close();
}
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
  // Uses node-fetch and cheerio for HTML parsing
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
  let browser;
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  console.log('[scraper] Puppeteer launch options:', JSON.stringify(launchOptions));
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (err) {
    console.error('[scraper] FATAL: Failed to launch Puppeteer browser.');
    console.error('[scraper] This likely means the sandbox flags are not being honored or the environment is too restricted.');
    console.error('[scraper] Error details:', err);
    throw err;
  }
  let page;
  try {
    page = await browser.newPage();
  } catch (err) {
    console.error('Failed to create Puppeteer page:', err);
    await browser.close();
    throw err;
  }
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

  try {
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
  } catch (err) {
    console.error('Error during Puppeteer page operations:', err);
    if (browser) await browser.close();
    throw err;
  }
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
        ageGroup = (p.age_group as { name?: string }).name || '';
      }
      return {
        id: getNumber(p, 'nid'),
        name: getString(p, 'name'),
        location: getString(p, 'location'),
        origin: '', // Manual entry required
        status: getNumber(p, 'adoptable') === 1 ? 'available' : '', // Needs logic for other statuses
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
    // Fetch and merge all dogs from all endpoints
    let allDogs: Dog[] = [];
    for (const jsonUrl of availableAnimalsUrls) {
      const dogDataArr = await scrapeAvailableAnimalsJson(jsonUrl);
      allDogs = allDogs.concat(dogDataArr);
    }
    // De-duplicate by dog id
    const dogMap = new Map<number, Dog>();
    for (const dog of allDogs) {
      dogMap.set(dog.id, dog);
    }
    const mergedDogs = Array.from(dogMap.values());

    // Fetch name, location, and status for comparison
    const ids = mergedDogs.map(d => d.id);
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

    for (const dog of mergedDogs) {
      // Location change
      const oldLocation = locationMap.get(dog.id) ?? null;
      const newLocation = dog.location ?? null;
      if (oldLocation && newLocation && oldLocation !== newLocation) {
        await logDogHistory({
          dogId: dog.id,
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
          eventType: 'name_change',
          oldValue: oldName,
          newValue: newName,
          notes: 'Name updated by scraper'
        });
        console.error(`Name change detected for dog ID ${dog.id}: '${oldName}' -> '${newName}'`);
      }
    }

    // Upsert all merged dogs into Supabase
    const { error } = await supabase
      .from('dogs')
      .upsert(mergedDogs, { onConflict: 'id' });
    if (error) {
      const dogIds = mergedDogs.map(d => d.id).join(', ');
      const dogNames = mergedDogs.map(d => d.name).join(', ');
      console.error(`Supabase upsert error:`, error, `Dog IDs: ${dogIds}`, `Dog Names: ${dogNames}`);
    } else {
      console.log(`Upserted ${mergedDogs.length} dogs to Supabase.`);
    }
  } catch (err) {
    console.error('Error in runScraper:', err);
  }
}
