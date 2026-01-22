// Scraper for animalhumanenm.org and its iframes
// Uses node-fetch and cheerio for HTML parsing

import puppeteer from 'puppeteer';

// Example: Scrape main page and extract iframe URLs
export async function getIframeUrls(mainUrl: string): Promise<string[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const availableAnimalsUrls: string[] = [];

  // Intercept network requests and responses
  page.on('response', async (response) => {
    try {
      const url = response.url();
      if (url.includes('available-animals')) {
        if (!availableAnimalsUrls.includes(url)) {
          availableAnimalsUrls.push(url);
          console.log('Captured available-animals URL:', url);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  });

  await page.goto(mainUrl, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForSelector('.shelterluv', { timeout: 60000 });

  // Extract all iframe src URLs (for completeness)
  const iframeUrls = await page.$$eval('iframe', iframes =>
    iframes.map(iframe => iframe.src)
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

export async function scrapeAvailableAnimalsJson(jsonUrl: string): Promise<any[]> {
  try {
    const res = await fetch(jsonUrl);
    if (!res.ok) {
      console.error(`Failed to fetch available-animals JSON: ${jsonUrl} (status: ${res.status})`);
      return [];
    }
    const data = await res.json() as { animals?: any[] };
    if (!data.animals || !Array.isArray(data.animals)) {
      console.error(`No animals array in JSON: ${jsonUrl}`);
      return [];
    }
    // Map each animal to Supabase schema
    const today = new Date();
    const mapped = data.animals.map((parsed: any) => {
      const intakeDate = parsed.intake_date ? new Date(parseInt(parsed.intake_date, 10) * 1000) : null;
      let lengthOfStay = null;
      if (intakeDate) {
        // Calculate difference in days (UTC)
        const diffTime = today.setHours(0,0,0,0) - intakeDate.setHours(0,0,0,0);
        lengthOfStay = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      return {
        id: parsed.nid,
        name: parsed.name,
        location: parsed.location,
        origin: '', // Manual entry required
        status: parsed.adoptable === 1 ? 'Available' : '', // Needs logic for other statuses
        url: parsed.public_url,
        intake_date: intakeDate ? intakeDate.toISOString().slice(0, 10) : null,
        length_of_stay_days: lengthOfStay,
        birthdate: parsed.birthday ? new Date(parseInt(parsed.birthday, 10) * 1000).toISOString().slice(0, 10) : null,
        age_group: parsed.age_group?.name || '',
        breed: parsed.breed,
        secondary_breed: parsed.secondary_breed,
        weight_group: parsed.weight_group,
        color: parsed.secondary_color ? `${parsed.primary_color} and ${parsed.secondary_color}` : parsed.primary_color,
        bite_quarantine: null, // Manual entry required
        returned: null, // Manual entry required
        latitude: null, // Manual entry required
        longitude: null, // Manual entry required
        notes: parsed.kennel_description || '',
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
      const { data: existingDogs, error: fetchError } = await supabase
        .from('dogs')
        .select('id,location,status,name')
        .in('id', ids);
      if (fetchError) {
        console.error('Error fetching existing dogs for history logging:', fetchError, 'Dog IDs:', ids);
      }
      // Maps for quick lookup
      const locationMap = new Map();
      const statusMap = new Map();
      const nameMap = new Map();
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

      // Upsert each dog record into Supabase
      const { error, data } = await supabase
        .from('dogs')
        .upsert(dogDataArr, { onConflict: 'id' });
      if (error) {
        const dogIds = dogDataArr.map(d => d.id).join(', ');
        const dogNames = dogDataArr.map(d => d.name).join(', ');
        console.error(`Supabase upsert error:`, error, `Dog IDs: ${dogIds}`, `Dog Names: ${dogNames}`);
      } else {
        console.log(`Upserted ${dogDataArr.length} dogs to Supabase.`);
      }
    }
  } catch (err) {
    console.error('Error in runScraper:', err);
  }
}
