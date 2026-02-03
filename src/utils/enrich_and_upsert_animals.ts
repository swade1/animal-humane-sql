// enrich_and_upsert_animals.ts
// Enriches animals with location_info.jsonl and upserts into Supabase

import { createClient } from '@supabase/supabase-js';
import { fetchAllAnimals } from './fetch_all_animals';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env vars not set');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


// Directly use animal data as-is for upsert
function enrichAnimal(animal: Record<string, unknown>) {
  return animal;
}

export async function enrichAndUpsertAnimals() {
  const animals = await fetchAllAnimals();
  const enriched = animals.map(enrichAnimal);
  // Upsert into Supabase (by id/nid)
  const upsertRows = enriched.map(a => ({
    id: a.nid,
    name: a.name,
    location: a.location,
    origin: a.origin || null,
    status: a.status || 'available',
    url: a.public_url,
    intake_date: a.intake_date || null,
    birthdate: a.birthday || null,
    age_group: (a.age_group && typeof a.age_group === 'object' && 'name' in a.age_group) ? (a.age_group as { name?: string }).name ?? null : null,
    breed: a.breed,
    secondary_breed: a.secondary_breed,
    weight_group: a.weight_group,
    color: a.primary_color + (a.secondary_color ? ` and ${a.secondary_color}` : ''),
    notes: a.kennel_description || '',
    latitude: a.latitude || null,
    longitude: a.longitude || null,
    // Add more fields as needed
    updated_at: new Date().toISOString(),
    scraped: true
  }));
  console.log('[enrich_and_upsert_animals] Upsert rows:', upsertRows);
  const { error } = await supabase.from('dogs').upsert(upsertRows, { onConflict: 'id' });
  if (error) {
    console.error('Supabase upsert error:', error);
  } else {
    console.log(`Upserted ${upsertRows.length} animals to Supabase.`);
  }
}


