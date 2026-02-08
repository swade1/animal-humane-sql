import { logDogHistory } from './dogHistory';
// enrich_and_upsert_animals.ts
// Enriches animals with location_info.jsonl and upserts into Supabase

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { fetchAllAnimals } from './fetch_all_animals';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env vars not set');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


// Directly use animal data as-is for upsert
function enrichAnimal(animal: Record<string, unknown>): Record<string, unknown> {
  // Convert intake_date and birthday from Unix timestamp (seconds) to ISO string if present, but preserve all properties
  const convertTimestamp = (val: unknown) => {
    if (typeof val === 'string' && /^\d{9,}$/.test(val)) {
      // Convert seconds to milliseconds
      const ms = parseInt(val, 10) * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return val;
  };
  // Strict normalization for age_group
  const normalizeAgeGroup = (val: string | { name?: string } | null) => {
    if (!val) return null;
    const name = typeof val === 'object' && 'name' in val ? val.name : val;
    if (!name) return null;
    const n = String(name).toLowerCase();
    if (n.includes('puppy')) return 'Puppy';
    if (n.includes('senior')) return 'Senior';
    if (n.includes('adult')) return 'Adult';
    return null;
  };
  return {
    ...animal,
    intake_date: convertTimestamp(animal.intake_date),
    birthday: convertTimestamp(animal.birthday),
    age_group: normalizeAgeGroup(animal.age_group as string | { name?: string } | null),
  };
}

export async function enrichAndUpsertAnimals() {
  const animals: Record<string, unknown>[] = await fetchAllAnimals();
  const enriched: Record<string, unknown>[] = animals.map(enrichAnimal);
  
  // Save scraped dog IDs to public/latest_scraped_ids.json for UI comparison
  try {
    const fs = await import('fs');
    const path = await import('path');
    const scrapedDogIds = enriched.map(a => a.nid).filter(Boolean);
    const filePath = path.join(process.cwd(), 'public', 'latest_scraped_ids.json');
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(scrapedDogIds));
    console.log(`[enrich_and_upsert_animals] Saved ${scrapedDogIds.length} scraped dog IDs to public/latest_scraped_ids.json`);
  } catch (err) {
    console.error('[enrich_and_upsert_animals] Error saving scraped dog IDs:', err);
  }
  
  // Upsert into Supabase (by id/nid)
  // Fetch current origins from Supabase to preserve manual edits
  const ids = enriched.map(a => a.nid).filter(Boolean);
  const { data: existingDogs } = await supabase
    .from('dogs')
    .select('id, name, origin, latitude, longitude')
    .in('id', ids);
  const manualMap = new Map();
  if (existingDogs && Array.isArray(existingDogs)) {
    for (const dog of existingDogs) {
      manualMap.set(dog.id, {
        origin: dog.origin,
        latitude: dog.latitude,
        longitude: dog.longitude
      });
    }
  }
  const upsertRows = [];
  for (const a of enriched) {
    const manual = manualMap.get(a.nid) || {};
    const existing = existingDogs?.find(d => d.id === a.nid);
    // Check for name change
    if (existing && existing.name && a.name && existing.name !== a.name) {
      await logDogHistory({
        dogId: Number(a.nid),
        name: typeof a.name === 'string' ? a.name : '',
        eventType: 'name_change',
        oldValue: existing.name,
        newValue: a.name,
      });
    }
    upsertRows.push({
      id: a.nid,
      name: a.name,
      location: a.location,
      // Only set origin, latitude, longitude if not already present in DB
      origin: manual.origin !== undefined ? manual.origin : (a.origin || null),
      latitude: manual.latitude !== undefined ? manual.latitude : (a.latitude || null),
      longitude: manual.longitude !== undefined ? manual.longitude : (a.longitude || null),
      status: a.status || 'available',
      url: a.public_url,
      intake_date: a.intake_date || null,
      birthdate: a.birthday || null,
      age_group: a.age_group ?? null,
      breed: a.breed,
      secondary_breed: a.secondary_breed,
      weight_group: a.weight_group,
      color: a.primary_color + (a.secondary_color ? ` and ${a.secondary_color}` : ''),
      notes: a.kennel_description || '',
      // Add more fields as needed
      updated_at: new Date().toISOString(),
      scraped: true
    });
  }
  console.log('[enrich_and_upsert_animals] Upsert rows:', upsertRows);
  const { error } = await supabase.from('dogs').upsert(upsertRows, { onConflict: 'id' });
  if (error) {
    console.error('Supabase upsert error:', error);
  } else {
    console.log(`Upserted ${upsertRows.length} animals to Supabase.`);
  }
}


