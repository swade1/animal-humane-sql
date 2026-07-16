// Detects dogs that were adopted, then returned to the shelter, but were never
// re-listed on the website (so they never reappear in the available-animals API JSON
// and the existing reappearance-based return check in check-adoptions-api.ts can't catch them).
//
// Checks every dog with status='adopted' directly against its own embed page
// (new.shelterluv.com/embed/animal/{id}). A non-empty 'location' field there means
// the dog is physically back at the shelter, regardless of whether it's listed.
//
// Runs once daily (after the final scheduled scrape) rather than on every scrape cycle,
// since it iterates every adopted dog individually (hundreds of requests).

import fetch from 'node-fetch';
import { load } from 'cheerio';
import he from 'he';
import { supabase } from '../lib/supabaseClient';
import { logDogHistory } from './dogHistory';

const trimString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Small delay between requests to avoid bursting the site with ~500+ back-to-back
// requests; this project has previously been blocked by shelterluv's bot detection.
const REQUEST_DELAY_MS = 500;

async function fetchEmbedLocation(dogId: number): Promise<string> {
  const embedUrl = `https://new.shelterluv.com/embed/animal/${dogId}`;
  const res = await fetch(embedUrl);
  if (!res.ok) {
    console.warn(`[unlisted-returns] Failed to fetch embed page for dog ID ${dogId}: HTTP ${res.status}`);
    return '';
  }
  const html = await res.text();
  const $ = load(html);
  const iframeAnimal = $('iframe-animal');
  if (!iframeAnimal.length) {
    console.warn(`[unlisted-returns] <iframe-animal> not found for dog ID ${dogId}`);
    return '';
  }
  const animalAttr = iframeAnimal.attr('animal') ?? '';
  const colonAnimalAttr = iframeAnimal.attr(':animal') ?? '';
  const raw = animalAttr || (colonAnimalAttr ? he.decode(colonAnimalAttr) : '');
  if (!raw) return '';
  try {
    const animalObj = JSON.parse(raw);
    return trimString(animalObj.location);
  } catch {
    console.warn(`[unlisted-returns] JSON parse failed for dog ID ${dogId}, attempting regex extraction`);
    const locationMatch = raw.match(/"location"\s*:\s*"([^"]*)"/);
    return locationMatch ? locationMatch[1].trim() : '';
  }
}

export async function checkForUnlistedReturns() {
  const { data: adoptedDogs, error } = await supabase
    .from('dogs')
    .select('id, name, returned, adopted_date')
    .eq('status', 'adopted');

  if (error) {
    console.error('[unlisted-returns] Error fetching adopted dogs:', error);
    return;
  }
  if (!adoptedDogs || adoptedDogs.length === 0) {
    console.log('[unlisted-returns] No adopted dogs to check.');
    return;
  }

  console.log(`[unlisted-returns] Checking ${adoptedDogs.length} adopted dogs for unlisted returns...`);

  let foundCount = 0;
  for (const dog of adoptedDogs) {
    try {
      const location = await fetchEmbedLocation(dog.id);
      if (location) {
        foundCount++;
        console.log(`[unlisted-returns] Detected unlisted return: ID ${dog.id} (${dog.name}), location: '${location}'`);

        const lastAdoptionDate = dog.adopted_date;
        const newReturnedCount = (typeof dog.returned === 'number' && !isNaN(dog.returned) ? dog.returned : 0) + 1;

        await logDogHistory({
          dogId: dog.id,
          name: dog.name,
          eventType: 'status_change',
          oldValue: 'adopted',
          newValue: 'available',
          notes: `Dog returned to shelter but was never re-listed on the website (return #${newReturnedCount}). Detected via embed page location check. Was adopted on ${lastAdoptionDate || 'unknown date'}.`,
          adopted_date: null
        });
        await logDogHistory({
          dogId: dog.id,
          name: dog.name,
          eventType: 'location_change',
          oldValue: null,
          newValue: location,
          notes: `Location set to '${location}' for unlisted returned dog`
        });

        const { error: updateErr } = await supabase
          .from('dogs')
          .update({
            status: 'available',
            verified_adoption: 0,
            returned: newReturnedCount,
            location,
            adopted_date: null
          })
          .eq('id', dog.id);

        if (updateErr) {
          console.error(`[unlisted-returns] Error updating dog ID ${dog.id}:`, updateErr);
        } else {
          console.log(`[unlisted-returns] Successfully updated dog ID ${dog.id}: status=available, returned=${newReturnedCount}, location='${location}'`);
        }
      }
    } catch (err) {
      console.error(`[unlisted-returns] Error checking dog ID ${dog.id} (${dog.name}):`, err);
    }
    await delay(REQUEST_DELAY_MS);
  }

  console.log(`[unlisted-returns] Finished. ${foundCount} unlisted return(s) detected out of ${adoptedDogs.length} adopted dogs checked.`);
}
