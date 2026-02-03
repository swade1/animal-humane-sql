// Logs suspected adoptions by comparing Supabase and API data (no DB changes)
import { createClient } from '@supabase/supabase-js';

export async function checkForAdoptionsApiOnly(apiUrl: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env vars not set');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Get all dogs with status 'available' from Supabase
  const { data: availableDogs, error } = await supabase
    .from('dogs')
    .select('id, name, location, url, status')
    .eq('status', 'available');
  if (error) {
    console.error('[adoption-check-api] Error fetching available dogs:', error);
    return;
  }
  if (!availableDogs || availableDogs.length === 0) {
    console.log('[adoption-check-api] No available dogs to check.');
    return;
  }

  // 2. Fetch the latest available-animals JSON from the API endpoint
  let apiDogIds: Set<number> = new Set();
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.error(`[adoption-check-api] Failed to fetch available-animals JSON: ${apiUrl} (status: ${res.status})`);
      return;
    }
    const data = await res.json() as { animals?: Array<Record<string, unknown>> };
    if (!data.animals || !Array.isArray(data.animals)) {
      console.error(`[adoption-check-api] No animals array in JSON: ${apiUrl}`);
      return;
    }
    apiDogIds = new Set(data.animals.map((a: Record<string, unknown>) => typeof a.nid === 'number' ? a.nid : parseInt(a.nid as string, 10)));
  } catch (err) {
    console.error('[adoption-check-api] Error fetching/parsing API data:', err);
    return;
  }

  // 3. Compare IDs and log suspected adoptions
  const suspectedAdoptions = availableDogs.filter(dog => !apiDogIds.has(dog.id));
  if (suspectedAdoptions.length === 0) {
    console.log('[adoption-check-api] No suspected adoptions. All available dogs are present in the API data.');
  } else {
    console.log(`[adoption-check-api] Suspected adoptions (present in DB, missing from API):`);
    for (const dog of suspectedAdoptions) {
      console.log(`  - ID: ${dog.id}, Name: ${dog.name}, Location: ${dog.location}, URL: ${dog.url}`);
    }
    console.log(`[adoption-check-api] Total suspected adoptions: ${suspectedAdoptions.length}`);
  }
}
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
      // Extract location and AHNM-A number from <iframe-animal> element's animal attribute (JSON) using page.evaluate (faster, more robust)
      const { location } = await page.evaluate(() => {
        const el = document.querySelector('iframe-animal');
        let location = '';
        // let ahnmA = null; // removed unused variable
        if (el && el.hasAttribute('animal')) {
          try {
            const animalObj = JSON.parse(el.getAttribute('animal') ?? '{}');
            location = animalObj.location || '';
            if (animalObj.uniqueId && typeof animalObj.uniqueId === 'string') {
              // const match = animalObj.uniqueId.match(/AHNM-A-(\d+)/); // removed unused variable
            }
          } catch {}
        }
        return { location };
      });
      // Log the dog's name and the value of the location field
      console.log(`[SCRAPER][LOCATION] Dog: ${dog.name} (ID: ${dog.id}), Location: '${location}'`);
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
import { toZonedTime } from 'date-fns-tz';

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
  scraped: boolean;
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
    const mapped: Dog[] = data.animals.map((parsed: Record<string, unknown>, idx: number) => {
      // Helper for safe property extraction
      const getString = (obj: Record<string, unknown>, key: string): string => typeof obj[key] === 'string' ? obj[key] as string : '';
      const getNumber = (obj: Record<string, unknown>, key: string): number => typeof obj[key] === 'number' ? obj[key] as number : (typeof obj[key] === 'string' ? parseInt(obj[key] as string, 10) : 0);

      const p = parsed;
      // Log the raw JSON for each dog
      console.log(`[SCRAPER][RAW] Dog #${idx + 1}:`, JSON.stringify(p));
      const intakeDate = p.intake_date ? new Date(getNumber(p, 'intake_date') * 1000) : null;
      let lengthOfStay: number | null = null;
      if (intakeDate) {
        // Calculate difference in days (UTC)
        const diffTime = today.setHours(0,0,0,0) - intakeDate.setHours(0,0,0,0);
        lengthOfStay = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      // Handle age_group as nested object and normalize to 'Puppy', 'Adult', or 'Senior'
      let ageGroupRaw = '';
      if (typeof p.age_group === 'object' && p.age_group !== null && 'name' in p.age_group) {
        ageGroupRaw = (p.age_group as { name?: string }).name || '';
      }
      let ageGroup = '';
      const ag = ageGroupRaw.toLowerCase();
      if (ag.includes('puppy')) {
        ageGroup = 'Puppy';
      } else if (ag.includes('senior')) {
        ageGroup = 'Senior';
      } else if (ag.includes('adult')) {
        ageGroup = 'Adult';
      } else {
        ageGroup = ageGroupRaw || '';
      }
      // All dogs are adoptable unless their status is 'adopted'
      let status = 'available';
      if (typeof p.status === 'string' && p.status.trim().toLowerCase() === 'adopted') {
        status = 'adopted';
      }
      const dogObj = {
        id: getNumber(p, 'nid'),
        name: getString(p, 'name'),
        location: getString(p, 'location'),
        origin: '', // Manual entry required
        status: status.trim(),
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
        // Only set created_at for new dogs; preserve for existing
        created_at: '', // will be set below if new or filled in later
        updated_at: new Date().toISOString(),
        scraped: true,
      };
      // Log the mapped dog object
      console.log(`[SCRAPER][MAPPED] Dog #${idx + 1}: id=${dogObj.id}, name=${dogObj.name}`);
      return dogObj;
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
    console.log('[SCRAPER] All discovered URLs:', allUrls);
    // Filter for available-animals JSON endpoints
    const availableAnimalsUrls = allUrls.filter(url => url.includes('available-animals'));
    console.log('[SCRAPER] available-animals JSON URLs:', availableAnimalsUrls);
    if (availableAnimalsUrls.length === 0) {
      console.error('No available-animals JSON URLs found.');
      return;
    }
    // Fetch and merge all dogs from all endpoints
    let allDogs: Dog[] = [];
    const fs = await import('fs');
    const path = await import('path');
    for (const [i, jsonUrl] of availableAnimalsUrls.entries()) {
      try {
        const res = await fetch(jsonUrl);
        const text = await res.text();
        // Save raw response to file for debugging
        const filePath = path.join(process.cwd(), `public/debug-available-animals-${i + 1}.json`);
        fs.writeFileSync(filePath, text);
        console.log(`[SCRAPER] Saved raw JSON response for URL #${i + 1} to`, filePath);
        // Parse and process as before
        const data = JSON.parse(text);
        if (!data.animals || !Array.isArray(data.animals)) {
          console.error(`No animals array in JSON: ${jsonUrl}`);
          continue;
        }
        const dogDataArr = await scrapeAvailableAnimalsJson(jsonUrl);
        allDogs = allDogs.concat(dogDataArr);
      } catch (err) {
        console.error(`[SCRAPER] Error fetching/parsing JSON from ${jsonUrl}:`, err);
      }
    }
    // De-duplicate by dog id
    const dogMap = new Map<number, Dog>();
    for (const dog of allDogs) {
      dogMap.set(dog.id, dog);
    }
    const mergedDogs = Array.from(dogMap.values());

    // Save scraped dog IDs to public/latest_scraped_ids.json for UI set comparison
    try {
      const fs = await import('fs');
      const path = await import('path');
      console.log('[debug] Current working directory:', process.cwd());
      console.log('[debug] mergedDogs before writing IDs:', mergedDogs);
      const scrapedDogIds = mergedDogs.map(dog => dog.id);
      const filePath = path.join(process.cwd(), 'public', 'latest_scraped_ids.json');
      // Ensure the public directory exists
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      // Write or create the file
      fs.writeFileSync(filePath, JSON.stringify(scrapedDogIds));
      console.log(`Saved ${scrapedDogIds.length} scraped dog IDs to public/latest_scraped_ids.json`);
    } catch (err) {
      console.error('Error saving scraped dog IDs to public/latest_scraped_ids.json:', err);
    }

    // Fetch name, location, status, and all manual fields for comparison
    // Fetch all previously available dogs (all statuses) for manual field preservation
    const { data: prevDogs, error: prevFetchError } = await supabase
      .from('dogs')
      .select('id,location,status,name,url,origin,latitude,longitude,bite_quarantine,returned,created_at,scraped');
    if (prevFetchError) {
      console.error('Error fetching previous dogs:', prevFetchError);
    }
    // Maps for quick lookup
    const locationMap = new Map<number, string>();
    const statusMap = new Map<number, string>();
    const nameMap = new Map<number, string>();
    const originMap = new Map<number, string>();
    const latitudeMap = new Map<number, string | null>();
    const longitudeMap = new Map<number, string | null>();
    const biteQuarantineMap = new Map<number, number | null>();
    const returnedMap = new Map<number, number | null>();
    if (prevDogs) {
      for (const d of prevDogs) {
        locationMap.set(d.id, d.location);
        // Always trim status from DB
        statusMap.set(d.id, typeof d.status === 'string' ? d.status.trim() : d.status);
        nameMap.set(d.id, d.name);
        originMap.set(d.id, d.origin);
        latitudeMap.set(d.id, d.latitude);
        longitudeMap.set(d.id, d.longitude);
        biteQuarantineMap.set(d.id, d.bite_quarantine);
        returnedMap.set(d.id, d.returned);
      }
    }

    // Preserve manual fields and created_at for mergedDogs
    for (const dog of mergedDogs) {
      // Preserve created_at for existing dogs, unless Available Soon and scraped for the first time
      const prevDog = prevDogs?.find(d => d.id === dog.id);
      if (prevDog && prevDog.created_at) {
        // Type assertion to allow access to scraped property if it exists
        const prevDogWithScraped = prevDog as typeof prevDog & { scraped?: boolean };
        const prevScraped = typeof prevDogWithScraped.scraped !== 'undefined' ? prevDogWithScraped.scraped : undefined;
        if ((prevScraped === false || prevScraped === null || typeof prevScraped === 'undefined') && (prevDog.status === null || prevDog.status === undefined) && dog.scraped === true) {
          // Update created_at to now and mark as scraped
          const now = new Date();
          let iso = now.toISOString();
          if (!iso.endsWith('Z')) iso = iso + 'Z';
          dog.created_at = iso;
          console.log('[SCRAPER] Updated created_at for first-time scraped Available Soon dog:', {
            id: dog.id,
            name: dog.name,
            local: now.toString(),
            utc: dog.created_at
          });
        } else {
          dog.created_at = prevDog.created_at;
        }
      } else {
        const now = new Date();
        let iso = now.toISOString();
        if (!iso.endsWith('Z')) iso = iso + 'Z';
        dog.created_at = iso;
        console.log('[SCRAPER] New dog created:', {
          id: dog.id,
          name: dog.name,
          local: now.toString(),
          utc: dog.created_at
        });
      }
      const existingOrigin = originMap.get(dog.id);
      if (existingOrigin && existingOrigin.trim() !== '') {
        dog.origin = existingOrigin;
      }
      const existingLat = latitudeMap.get(dog.id);
      if (existingLat && existingLat !== null) {
        dog.latitude = existingLat;
      }
      const existingLng = longitudeMap.get(dog.id);
      if (existingLng && existingLng !== null) {
        dog.longitude = existingLng;
      }
      const existingBite = biteQuarantineMap.get(dog.id);
      if (existingBite !== undefined && existingBite !== null) {
        dog.bite_quarantine = existingBite;
      }
      const existingReturned = returnedMap.get(dog.id);
      if (existingReturned !== undefined && existingReturned !== null) {
        dog.returned = existingReturned;
      }
    }

    // Log changes for dogs still present

      // Prepare prevAvailableDogs for adoption/status-change logic (always trim status)
      // const prevAvailableDogs = prevDogs ? prevDogs.filter(d => typeof d.status === 'string' && d.status.trim() === 'available') : []; // removed unused variable
    for (const dog of mergedDogs) {
      // Location change with extra logging
      const oldLocation = locationMap.get(dog.id) ?? null;
      const newLocation = dog.location ?? null;
      const normOldLocation = oldLocation ? oldLocation.trim() : '';
      const normNewLocation = newLocation ? newLocation.trim() : '';
      console.log(`[debug] Checking location for dog ID ${dog.id} (${dog.name}): old='${oldLocation}' new='${newLocation}' | normOld='${normOldLocation}' normNew='${normNewLocation}'`);
      if (normOldLocation && normNewLocation && normOldLocation !== normNewLocation) {
        console.log(`[debug] Location change detected for dog ID ${dog.id} (${dog.name}): '${normOldLocation}' -> '${normNewLocation}'`);
        await logDogHistory({
          dogId: dog.id,
          eventType: 'location_change',
          oldValue: oldLocation,
          newValue: newLocation,
          notes: 'Location updated by scraper'
        });
        await supabase
          .from('dogs')
          .update({ location: newLocation })
          .eq('id', dog.id);
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
        await supabase
          .from('dogs')
          .update({ status: newStatus })
          .eq('id', dog.id);
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
        await supabase
          .from('dogs')
          .update({ name: newName })
          .eq('id', dog.id);
        console.error(`Name change detected for dog ID ${dog.id}: '${oldName}' -> '${newName}'`);
      }
      // Origin change
      const oldOrigin = originMap.get(dog.id) ?? null;
      const newOrigin = dog.origin ?? null;
      if (oldOrigin && newOrigin && oldOrigin !== newOrigin) {
        await logDogHistory({
          dogId: dog.id,
          eventType: 'origin_change',
          oldValue: oldOrigin,
          newValue: newOrigin,
          notes: 'Origin updated by scraper'
        });
        await supabase
          .from('dogs')
          .update({ origin: newOrigin })
          .eq('id', dog.id);
        console.error(`Origin change detected for dog ID ${dog.id}: '${oldOrigin}' -> '${newOrigin}'`);
      }
    }

    // Log status_change for dogs previously available or Available Soon but now missing (check web page location before marking as adopted)
    // Include both status='available' and status=null (Available Soon) dogs
    const prevAvailableAndSoonDogs = prevDogs ? prevDogs.filter(d => {
      const status = typeof d.status === 'string' ? d.status.trim() : d.status;
      return status === 'available' || status === null || status === undefined;
    }) : [];
    
    if (prevAvailableAndSoonDogs.length > 0) {
      const mergedDogIds = new Set(mergedDogs.map(d => d.id));
      // Debug: log all missing dogs being checked
      const missingDogs = prevAvailableAndSoonDogs.filter(prevDog => !mergedDogIds.has(prevDog.id));
      console.log(`[debug] Missing dogs to check (not in mergedDogs, status=available or null):`, missingDogs.map(d => ({ id: d.id, name: d.name, location: d.location, status: d.status })));
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      for (const prevDog of prevAvailableAndSoonDogs) {
        if (!mergedDogIds.has(prevDog.id)) {
          try {
            const page = await browser.newPage();
            const mergedDogUrlMap = new Map<number, string>();
            for (const dog of mergedDogs) {
              mergedDogUrlMap.set(dog.id, dog.url);
            }
            const urlToCheck = mergedDogUrlMap.get(prevDog.id) || prevDog.url;
            if (!urlToCheck) {
              console.warn(`[scraper] No valid url for missing dog ${prevDog.name} (ID: ${prevDog.id}), skipping adoption check.`);
              continue;
            }
            await page.goto(urlToCheck, { waitUntil: 'networkidle2', timeout: 60000 });
            let location = '';
            let nameFromPage = '';
            try {
              // Extract both location and name from visible HTML structure
              const pageData = await page.evaluate(() => {
                let location = '';
                let name = '';
                
                // Find all divs with class 'inline-flex' and text 'Location'
                const labelDivs = Array.from(document.querySelectorAll('div.inline-flex'));
                for (const labelDiv of labelDivs) {
                  if (labelDiv.textContent && labelDiv.textContent.trim().toLowerCase() === 'location') {
                    // The value is in the next sibling div with class 'pl-2'
                    let sibling = labelDiv.nextElementSibling;
                    while (sibling) {
                      if (sibling.classList.contains('pl-2')) {
                        location = sibling.textContent?.trim() || '';
                        break;
                      }
                      sibling = sibling.nextElementSibling;
                    }
                  }
                }
                
                // Extract name from h1 or title element
                const h1Element = document.querySelector('h1');
                if (h1Element) {
                  name = h1Element.textContent?.trim() || '';
                }
                
                return { location, name };
              });
              
              location = pageData.location;
              nameFromPage = pageData.name;
              
              if (!location || !nameFromPage) {
                // Fallback: Use :animal attribute if visible HTML extraction fails
                const animalJson = await page.evaluate(() => {
                  const allElements = document.querySelectorAll('*');
                  for (const el of allElements) {
                    if (el.hasAttribute(':animal')) {
                      return el.getAttribute(':animal');
                    }
                  }
                  return null;
                });
                console.log(`[scraper] Raw :animal attribute for dog ID ${prevDog.id} (${prevDog.name}):`, animalJson);
                if (animalJson) {
                  // Unescape HTML entities and parse JSON
                  const decoded = animalJson.replace(/&quot;/g, '"');
                  const animalObj = JSON.parse(decoded);
                  if (!location) location = animalObj.location || '';
                  if (!nameFromPage) nameFromPage = animalObj.name || '';
                } else {
                  // If :animal attribute is missing, log the page HTML for debugging
                  const pageHtml = await page.content();
                  console.error(`[scraper] Could not find :animal attribute for dog ${prevDog.name} (ID: ${prevDog.id}). Page HTML:\n`, pageHtml);
                }
              }
            } catch (selErr) {
              // If extraction fails, log the error
              console.error(`[scraper] Could not extract location/name for dog ${prevDog.name} (ID: ${prevDog.id}):`, selErr);
              location = '';
              nameFromPage = '';
            }
            console.log(`[scraper] Raw location value for dog ID ${prevDog.id} (${prevDog.name}): '${location}'`);
            console.log(`[scraper] Raw name value for dog ID ${prevDog.id} (${prevDog.name}): '${nameFromPage}'`);
            
            // Check for name change
            if (nameFromPage && nameFromPage !== prevDog.name) {
              await logDogHistory({
                dogId: prevDog.id,
                eventType: 'name_change',
                oldValue: prevDog.name,
                newValue: nameFromPage,
                notes: `Name updated for missing dog during scrape.`
              });
              await supabase
                .from('dogs')
                .update({ name: nameFromPage })
                .eq('id', prevDog.id);
              console.log(`[scraper] Updated name for missing dog ID ${prevDog.id}: '${prevDog.name}' -> '${nameFromPage}'`);
            }
            
            await page.close();
            if (!location) {
              // Check if most recent location (new_value) in dog_history contains 'Clinic'
              let lastLocation = prevDog.location || '';
              // Try to get last new_value from dog_history (location_change)
              const { data: history, error: histErr } = await supabase
                .from('dog_history')
                .select('new_value')
                .eq('dog_id', prevDog.id)
                .eq('event_type', 'location_change')
                .order('id', { ascending: false })
                .limit(1);
              if (!histErr && history && history.length > 0) {
                lastLocation = history[0].new_value || lastLocation;
              }
              if (lastLocation && lastLocation.toLowerCase().includes('clinic')) {
                // Set status to pending_review and location to 'unknown'
                await logDogHistory({
                  dogId: prevDog.id,
                  name: prevDog.name,
                  eventType: 'status_change',
                  oldValue: 'available',
                  newValue: 'pending_review',
                  notes: `Location empty and most recent location in dog_history contains 'Clinic'. Marked as pending_review.`
                });
                const updateResult = await supabase
                  .from('dogs')
                  .update({ status: 'pending_review', location: 'unknown' })
                  .eq('id', prevDog.id);
                if (updateResult.error) {
                  console.error(`[pending-review-update] ERROR updating dogs table for dog ID ${prevDog.id} (${prevDog.name}):`, updateResult.error);
                } else {
                  console.log(`[pending-review-update] Update result for dog ID ${prevDog.id} (${prevDog.name}):`, updateResult);
                }
                console.error(`Status/location change detected for dog ID ${prevDog.id} (${prevDog.name}): 'available' -> 'pending_review', location set to 'unknown', most recent location in dog_history contains 'Clinic'.`);
              } else {
                // Get current date in America/Denver (MST) as YYYY-MM-DD
                const { format: formatTz } = await import('date-fns-tz');
                const now = new Date();
                const timeZone = 'America/Denver';
                const mstNow = toZonedTime(now, timeZone);
                const adoptionDate = formatTz(mstNow, 'yyyy-MM-dd', { timeZone });
                // Log location_change
                await logDogHistory({
                  dogId: prevDog.id,
                  name: prevDog.name,
                  eventType: 'location_change',
                  oldValue: prevDog.location,
                  newValue: null,
                  notes: `Location cleared (adopted) at ${adoptionDate}`
                });
                // Log status_change
                await logDogHistory({
                  dogId: prevDog.id,
                  name: prevDog.name,
                  eventType: 'status_change',
                  oldValue: 'available',
                  newValue: 'adopted',
                  notes: `Dog no longer present in available-animals JSON and location is empty; likely adopted at ${adoptionDate}.`,
                  adopted_date: adoptionDate
                });
                // Update dog record in DB (set location to NULL)
                const updateResult = await supabase
                  .from('dogs')
                  .update({ status: 'adopted', location: null, adopted_date: adoptionDate })
                  .eq('id', prevDog.id);
                if (updateResult.error) {
                  console.error(`[adoption-update] ERROR updating dogs table for dog ID ${prevDog.id} (${prevDog.name}):`, updateResult.error);
                } else {
                  console.log(`[adoption-update] Update result for dog ID ${prevDog.id} (${prevDog.name}):`, updateResult);
                }
                console.error(`Status/location change detected for dog ID ${prevDog.id} (${prevDog.name}): 'available' -> 'adopted', location cleared (missing from new scrape, location empty)`);
              }
            } else if (location !== prevDog.location) {
              // If location changed but not adopted, update dogs table and log
              // For Available Soon dogs (status=null), also set status to 'available' when they get a real location
              const prevStatus = typeof prevDog.status === 'string' ? prevDog.status.trim() : prevDog.status;
              const shouldUpdateStatus = (prevStatus === null || prevStatus === undefined) && location && location.trim() !== '';
              
              await logDogHistory({
                dogId: prevDog.id,
                eventType: 'location_change',
                oldValue: prevDog.location,
                newValue: location,
                notes: `Location updated for missing dog during scrape${shouldUpdateStatus ? ' (Available Soon -> Available)' : ''}.`
              });
              
              const updateFields: { location: string; status?: string } = { location };
              if (shouldUpdateStatus) {
                updateFields.status = 'available';
                await logDogHistory({
                  dogId: prevDog.id,
                  eventType: 'status_change',
                  oldValue: prevStatus,
                  newValue: 'available',
                  notes: `Status updated from Available Soon (null) to available due to location assignment.`
                });
              }
              
              await supabase
                .from('dogs')
                .update(updateFields)
                .eq('id', prevDog.id);
              console.log(`[scraper] Updated location for missing dog ID ${prevDog.id} (${prevDog.name}): '${prevDog.location}' -> '${location}'${shouldUpdateStatus ? ' and status: null -> available' : ''}`);
            } else {
              console.log(`[scraper] Dog ID ${prevDog.id} (${prevDog.name}) missing from JSON but location is not empty and unchanged; not marking as adopted.`);
            }
          } catch (err) {
            console.error(`[scraper] Error checking location for missing dog ${prevDog.name} (ID: ${prevDog.id}):`, err);
          }
        }
      }
      await browser.close();
    }

    // Set scraped=true for all scraped dogs
    for (const dog of mergedDogs) {
      dog.scraped = true;
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

    // --- NEW LOGIC: Update created_at and status for manually added dogs now scraped ---
    // Find all dogs with status == NULL
    const { data: manualDogs, error: manualError } = await supabase
      .from('dogs')
      .select('id, created_at, status, scraped')
      .is('status', null);
    if (manualError) {
      console.error('Error fetching manually added dogs:', manualError);
    } else if (manualDogs && manualDogs.length > 0) {
      // For each, if the dog is now scraped, update created_at and status
      const now = new Date().toISOString();
      for (const dog of manualDogs) {
        if (dog.scraped) {
          await supabase
            .from('dogs')
            .update({ created_at: now, status: 'available' })
            .eq('id', dog.id);
          console.log(`[scraper] Updated manually added dog ID ${dog.id}: set created_at to now and status to 'available'`);
        }
      }
    }

    // Set scraped=false for all dogs not in the latest scrape
    // (REMOVED) Do not set scraped=false for any dog. scraped only transitions from FALSE to TRUE.
    // Automatic backup after scraping
    try {
      const fs = await import('fs');
      const path = await import('path');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseBackup = createClient(supabaseUrl, supabaseKey);

      async function backupTable(table: string, outFile: string) {
        const { data, error } = await supabaseBackup.rpc('pg_export_table', { table_name: table });
        if (error) {
          console.error(`[SCRAPER][BACKUP] Error exporting ${table}:`, error);
          return;
        }
        fs.writeFileSync(outFile, data);
        console.log(`[SCRAPER][BACKUP] Backed up ${table} to ${outFile}`);
      }

      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
      await backupTable('dogs', path.join(backupDir, 'dogs_rows.sql'));
      await backupTable('dog_history', path.join(backupDir, 'dog_history_rows.sql'));
      console.log('[SCRAPER] Backed up dogs and dog_history tables after scrape.');
    } catch (backupErr) {
      console.error('[SCRAPER] Error during automatic backup:', backupErr);
    }
  } catch (err) {
    console.error('Error in runScraper:', err);
  }
}
