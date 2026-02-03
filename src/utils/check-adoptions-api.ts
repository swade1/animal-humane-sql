
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { load } from 'cheerio';
import he from 'he';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env vars not set');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MAIN_URL = 'https://animalhumanenm.org/adopt/adoptable-dogs';


// Helper to extract all available-animals JSON URLs from the main page
async function getAvailableAnimalsJsonUrls() {
	const res = await fetch(MAIN_URL);
	const html = await res.text();
	const urlRegex = /https:\/\/animalhumanenm\.org\/available-animals\?location=[^"']+/g;
	const matches = html.match(urlRegex) || [];
	return Array.from(new Set(matches));
}

// Get all available animal IDs from all endpoints
async function getCurrentAvailableAnimalIds() {
	const urls = await getAvailableAnimalsJsonUrls();
	const ids = new Set();
	for (const url of urls) {
		try {
			const res = await fetch(url);
			const data = await res.json() as { animals?: Array<{ nid: number | string }> };
			if (data.animals && Array.isArray(data.animals)) {
				for (const a of data.animals) {
					ids.add(typeof a.nid === 'number' ? a.nid : parseInt(a.nid, 10));
				}
			}
		} catch (err) {
			console.error(`[adoption-check-api] Error fetching/parsing ${url}:`, err);
		}
	}
	return ids;
}

// Main adoption check logic
async function main() {
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

	// 2. Get all current available animal IDs from API
	const apiDogIds = await getCurrentAvailableAnimalIds();

	// 3. For each dog in DB not in API, check their embed page
	const suspectedAdoptions = availableDogs.filter(dog => !apiDogIds.has(dog.id));
	if (suspectedAdoptions.length === 0) {
		console.log('[adoption-check-api] No suspected adoptions. All available dogs are present in the API data.');
		return;
	}

	console.log(`[adoption-check-api] Checking embed pages for ${suspectedAdoptions.length} suspected adoptions...`);
	// Use Puppeteer to extract the animal attribute from the rendered page
	for (const dog of suspectedAdoptions) {
		const embedUrl = dog.url;
		let location = '';
		try {
			console.log(`[adoption-check-api] Checking dog ID ${dog.id}, Name: ${dog.name}, URL: ${embedUrl}`);
			const res = await fetch(embedUrl);
			if (!res.ok) {
				console.warn(`[adoption-check-api] Failed to fetch embed page for dog ID ${dog.id}: HTTP ${res.status}`);
				continue;
			}
			const html = await res.text();
			const $ = load(html);
			const iframeAnimal = $('iframe-animal');
			let raw = '';
			if (iframeAnimal.length) {
				if (iframeAnimal.attr('animal')) {
					raw = iframeAnimal.attr('animal');
				} else if (iframeAnimal.attr(':animal')) {
					raw = he.decode(iframeAnimal.attr(':animal'));
				}
				if (raw) {
					try {
						const animalObj = JSON.parse(raw);
						location = animalObj.location || '';
					} catch {
						console.warn(`[adoption-check-api] Could not parse animal JSON for dog ID ${dog.id}:`, raw);
					}
				}
			} else {
				console.warn(`[adoption-check-api] <iframe-animal> not found for dog ID ${dog.id}`);
			}
			if (!location || location.trim() === '') {
				console.log(`LIKELY ADOPTED: ID: ${dog.id}, Name: ${dog.name}, Location: [empty], URL: ${embedUrl}`);
				if (raw) {
					console.log(`[adoption-check-api] Raw animal attribute for dog ID ${dog.id}:`, raw);
				}
			} else {
				console.log(`STILL PRESENT: ID: ${dog.id}, Name: ${dog.name}, Location: '${location}', URL: ${embedUrl}`);
			}
		} catch (err) {
			console.error(`[adoption-check-api] Error fetching/parsing embed page for dog ID ${dog.id}:`, err);
		}
	}
	console.log(`[adoption-check-api] Finished checking suspected adoptions.`);
}


export { main };

if (require.main === module) {
	main();
}
