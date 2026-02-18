
import { createClient } from '@supabase/supabase-js';
import { logDogHistory } from './dogHistory';
import { format as formatTz, toZonedTime } from 'date-fns-tz';
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
	// Get all current available animal IDs from API first (used for both returns and adoptions)
	const apiDogIds = await getCurrentAvailableAnimalIds();
	
	// 1. Check for returned dogs (dogs that were adopted but are now back in the API)
	
	// Get all dogs currently marked as adopted
	const { data: adoptedDogs, error: adoptedError } = await supabase
		.from('dogs')
		.select('id, name, status, location, returned, verified_adoption, adopted_date')
		.eq('status', 'adopted');
	
	if (adoptedError) {
		console.error('[adoption-check-api] Error fetching adopted dogs:', adoptedError);
	} else if (adoptedDogs && adoptedDogs.length > 0) {
		// Check if any adopted dogs are now back in the API (returned)
		const returnedDogs = adoptedDogs.filter(dog => apiDogIds.has(dog.id));
		
		if (returnedDogs.length > 0) {
			console.log(`[adoption-check-api] Found ${returnedDogs.length} returned dogs`);
			
			for (const dog of returnedDogs) {
				try {
					console.log(`[adoption-check-api] Processing returned dog: ID ${dog.id}, Name: ${dog.name}`);
					// Preserve the adoption date before clearing it
					const lastAdoptionDate = dog.adopted_date;
					// Increment returned count (if null/undefined, treat as 0)
					const newReturnedCount = (typeof dog.returned === 'number' && !isNaN(dog.returned) ? dog.returned : 0) + 1;
					// Fetch current location from embed page
					const embedUrl = `https://new.shelterluv.com/embed/animal/${dog.id}`;
					const res = await fetch(embedUrl);
					let currentLocation = '';
					if (res.ok) {
						const html = await res.text();
						const $ = load(html);
						const iframeAnimal = $('iframe-animal');
						let raw = '';
						if (iframeAnimal.length) {
							const animalAttr = iframeAnimal.attr('animal') ?? '';
							const colonAnimalAttr = iframeAnimal.attr(':animal') ?? '';
							if (animalAttr) {
								raw = animalAttr;
							} else if (colonAnimalAttr) {
								raw = he.decode(colonAnimalAttr);
							}
							if (raw) {
								try {
									const animalObj = JSON.parse(raw);
									currentLocation = animalObj.location || '';
								} catch (parseErr) {
									console.warn(`[adoption-check-api] Could not parse animal JSON for returned dog ID ${dog.id}`);
								}
							}
						}
					}
					// Increment returned count with the preserved adoption date
					await logDogHistory({
						dogId: dog.id,
						name: dog.name,
						eventType: 'status_change',
						oldValue: 'adopted',
						newValue: 'available',
						notes: `Dog returned to shelter (return #${newReturnedCount}). Was adopted on ${lastAdoptionDate || 'unknown date'}.`,
						adopted_date: null
					});
					// Log location change in dog_history
					await logDogHistory({
						dogId: dog.id,
						name: dog.name,
						eventType: 'location_change',
						oldValue: null,
						newValue: currentLocation,
						notes: `Location set to '${currentLocation}' for returned dog`
					});
					// Update dogs table
					const { error: updateErr } = await supabase
						.from('dogs')
						.update({
							status: 'available',
							verified_adoption: 0,
							returned: newReturnedCount,
							location: currentLocation,
							adopted_date: null
						})
						.eq('id', dog.id);
					if (updateErr) {
						console.error(`[adoption-check-api] Error updating returned dog ID ${dog.id}:`, updateErr);
					} else {
						console.log(`[adoption-check-api] Successfully updated returned dog ID ${dog.id}: status=available, verified_adoption=0, returned=${newReturnedCount}, location='${currentLocation}'`);
					}
				} catch (err) {
					console.error(`[adoption-check-api] Error processing returned dog ID ${dog.id}:`, err);
				}
			}
		} else {
			console.log('[adoption-check-api] No returned dogs detected');
		}
	}

	// 1b. Check for dogs marked as 'available' but still have adopted_date (manually updated returns that bypassed the return detection)
	const { data: availableWithAdoptionDate, error: availableAdoptedError } = await supabase
		.from('dogs')
		.select('id, name, status, location, returned, adopted_date')
		.eq('status', 'available')
		.not('adopted_date', 'is', null);
	
	if (availableAdoptedError) {
		console.error('[adoption-check-api] Error fetching available dogs with adopted_date:', availableAdoptedError);
	} else if (availableWithAdoptionDate && availableWithAdoptionDate.length > 0) {
		console.log(`[adoption-check-api] Found ${availableWithAdoptionDate.length} available dogs with adopted_date (likely manually updated returns)`);
		
		for (const dog of availableWithAdoptionDate) {
			try {
				console.log(`[adoption-check-api] Cleaning up dog: ID ${dog.id}, Name: ${dog.name}, adopted_date: ${dog.adopted_date}`);
				
				// Check if we need to log the return (check if there's already a status_change from adopted to available)
				const { data: recentReturn, error: historyError } = await supabase
					.from('dog_history')
					.select('id')
					.eq('dog_id', dog.id)
					.eq('event_type', 'status_change')
					.eq('old_value', 'adopted')
					.eq('new_value', 'available')
					.order('id', { ascending: false })
					.limit(1);
				
				if (historyError) {
					console.error(`[adoption-check-api] Error checking history for dog ID ${dog.id}:`, historyError);
				}
				
				// If no return was logged, log it now
				if (!recentReturn || recentReturn.length === 0) {
					const lastAdoptionDate = dog.adopted_date;
					const newReturnedCount = (typeof dog.returned === 'number' && !isNaN(dog.returned) ? dog.returned : 0) + 1;
					
					await logDogHistory({
						dogId: dog.id,
						name: dog.name,
						eventType: 'status_change',
						oldValue: 'adopted',
						newValue: 'available',
						notes: `Dog returned to shelter (return #${newReturnedCount}). Was adopted on ${lastAdoptionDate || 'unknown date'}. (Backfilled - manual status update bypassed automatic detection)`,
						adopted_date: null
					});
					
					// Update the returned count
					const { error: updateErr } = await supabase
						.from('dogs')
						.update({
							returned: newReturnedCount
						})
						.eq('id', dog.id);
					
					if (updateErr) {
						console.error(`[adoption-check-api] Error updating returned count for dog ID ${dog.id}:`, updateErr);
					} else {
						console.log(`[adoption-check-api] Logged missing return and updated returned count for dog ID ${dog.id} to ${newReturnedCount}`);
					}
				}
				
				// Always clear the adopted_date if it's still set
				const { error: clearErr } = await supabase
					.from('dogs')
					.update({ adopted_date: null })
					.eq('id', dog.id);
				
				if (clearErr) {
					console.error(`[adoption-check-api] Error clearing adopted_date for dog ID ${dog.id}:`, clearErr);
				} else {
					console.log(`[adoption-check-api] Cleared adopted_date for dog ID ${dog.id}`);
				}
			} catch (err) {
				console.error(`[adoption-check-api] Error processing available dog with adopted_date ID ${dog.id}:`, err);
			}
		}
	}

		// 4. Check and update location for all Available Soon dogs
		// Available Soon: status is null and notes contains 'Available Soon'
		const { data: soonDogs, error: soonError } = await supabase
			.from('dogs')
			.select('id, name, location, url, notes')
			.is('status', null);
		if (soonError) {
			console.error('[adoption-check-api] Error fetching Available Soon dogs:', soonError);
		} else if (soonDogs && Array.isArray(soonDogs)) {
			const availableSoonDogs = soonDogs.filter(dog => typeof dog.notes === 'string' && dog.notes.includes('Available Soon'));
			for (const dog of availableSoonDogs) {
				const embedUrl = dog.url;
				let location = '';
				try {
					console.log(`[adoption-check-api] Checking Available Soon dog ID ${dog.id}, Name: ${dog.name}, URL: ${embedUrl}`);
					const res = await fetch(embedUrl);
					if (!res.ok) {
						console.warn(`[adoption-check-api] Failed to fetch embed page for Available Soon dog ID ${dog.id}: HTTP ${res.status}`);
						continue;
					}
					const html = await res.text();
					const $ = load(html);
					const iframeAnimal = $('iframe-animal');
					let raw = '';
					if (iframeAnimal.length) {
						const animalAttr = iframeAnimal.attr('animal') ?? '';
						const colonAnimalAttr = iframeAnimal.attr(':animal') ?? '';
						if (animalAttr) {
							raw = animalAttr;
						} else if (colonAnimalAttr) {
							raw = he.decode(colonAnimalAttr);
						}
						if (raw) {
							try {
								const animalObj = JSON.parse(raw);
								location = animalObj.location || '';
							} catch {
								console.warn(`[adoption-check-api] Could not parse animal JSON for Available Soon dog ID ${dog.id}:`, raw);
							}
						}
					} else {
						console.warn(`[adoption-check-api] <iframe-animal> not found for Available Soon dog ID ${dog.id}`);
					}
					// Always check for location change
					if ((dog.location || '').trim() !== (location || '').trim()) {
						await logDogHistory({
							dogId: dog.id,
							name: dog.name,
							eventType: 'location_change',
							oldValue: dog.location,
							newValue: location,
							notes: `Location updated for Available Soon dog by adoption-check-api`
						});
						
						// Check if location is now empty (adopted from trial adoption)
						if (!location || location.trim() === '') {
							// Dog was adopted - log status_change and update status
							const timeZone = 'America/Denver';
							const now = new Date();
							const mstNow = toZonedTime(now, timeZone);
							const adoptionDate = formatTz(mstNow, 'yyyy-MM-dd', { timeZone });
							
							await logDogHistory({
								dogId: dog.id,
								name: dog.name,
								eventType: 'status_change',
								oldValue: null, // Available Soon status is null
								newValue: 'adopted',
								notes: `Available Soon dog location became empty; likely adopted at ${adoptionDate}.`,
								adopted_date: adoptionDate
							});
							
							const { error: updateErr } = await supabase
								.from('dogs')
								.update({ status: 'adopted', location: null, adopted_date: adoptionDate })
								.eq('id', dog.id);
							if (updateErr) {
								console.error(`[adoption-check-api] Error updating dogs table for Available Soon dog ID ${dog.id}:`, updateErr);
							} else {
								console.log(`[adoption-check-api] Updated dogs table for adopted Available Soon dog ID ${dog.id}`);
							}
						} else {
							// Location changed to a non-empty value
							const { error: updateLocationErr } = await supabase
								.from('dogs')
								.update({ location })
								.eq('id', dog.id);
							if (updateLocationErr) {
								console.error(`[adoption-check-api] Error updating location for Available Soon dog ID ${dog.id}:`, updateLocationErr);
							} else {
								console.log(`[adoption-check-api] Updated location for Available Soon dog ID ${dog.id} to '${location}'`);
							}
						}
					} else {
						console.log(`[adoption-check-api] No location change for Available Soon dog ID ${dog.id}`);
					}
				} catch (err) {
					console.error(`[adoption-check-api] Error fetching/parsing embed page for Available Soon dog ID ${dog.id}:`, err);
				}
			}
		}
	// 2. Get all dogs with status 'available' from Supabase
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
				const animalAttr = iframeAnimal.attr('animal') ?? '';
				const colonAnimalAttr = iframeAnimal.attr(':animal') ?? '';
				if (animalAttr) {
					raw = animalAttr;
				} else if (colonAnimalAttr) {
					raw = he.decode(colonAnimalAttr);
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
						// Always check for location change, even if not adopted
						const { data: prevDog, error: prevDogErr } = await supabase
							.from('dogs')
							.select('id, name, status, location')
							.eq('id', dog.id)
							.single();
						if (prevDogErr) {
							console.error(`[adoption-check-api] Error fetching previous dog record for history logging:`, prevDogErr);
						} else if (prevDog) {
							if ((prevDog.location || '').trim() !== (location || '').trim()) {
								await logDogHistory({
									dogId: dog.id,
									name: dog.name,
									eventType: 'location_change',
									oldValue: prevDog.location,
									newValue: location,
									notes: `Location updated by adoption-check-api` 
								});
								// Update the dogs table location field
								const { error: updateLocationErr } = await supabase
									.from('dogs')
									.update({ location })
									.eq('id', dog.id);
								if (updateLocationErr) {
									console.error(`[adoption-check-api] Error updating location for dog ID ${dog.id}:`, updateLocationErr);
								} else {
									console.log(`[adoption-check-api] Updated location for dog ID ${dog.id} to '${location}'`);
								}
							}
							if (!location || location.trim() === '') {
								// Only log status_change and update DB if adopted
								const timeZone = 'America/Denver';
								const now = new Date();
								const mstNow = toZonedTime(now, timeZone);
								const adoptionDate = formatTz(mstNow, 'yyyy-MM-dd', { timeZone });
								await logDogHistory({
									dogId: dog.id,
									name: dog.name,
									eventType: 'status_change',
									oldValue: prevDog.status,
									newValue: 'adopted',
									notes: `Dog no longer present in available-animals JSON and location is empty; likely adopted at ${adoptionDate}.`,
									adopted_date: adoptionDate
								});
								const { error: updateErr } = await supabase
									.from('dogs')
									.update({ status: 'adopted', location: null, adopted_date: adoptionDate })
									.eq('id', dog.id);
								if (updateErr) {
									console.error(`[adoption-check-api] Error updating dogs table for dog ID ${dog.id}:`, updateErr);
								} else {
									console.log(`[adoption-check-api] Updated dogs table for adopted dog ID ${dog.id}`);
								}
							} else {
								console.log(`STILL PRESENT: ID: ${dog.id}, Name: ${dog.name}, Location: '${location}', URL: ${embedUrl}`);
							}
						}
		} catch (err) {
			console.error(`[adoption-check-api] Error fetching/parsing embed page for dog ID ${dog.id}:`, err);
		}
	}
	console.log(`[adoption-check-api] Finished checking suspected adoptions.`);
}


export { main };

