// Direct fetch from known API endpoints (no Puppeteer)
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const knownEndpoints = [
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=9274&embedded=1&iframeId=shelterluv_wrap_1742914295&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=8888&embedded=1&iframeId=shelterluv_wrap_1772061557&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=8887&embedded=1&iframeId=shelterluv_wrap_1741279189&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=8889&embedded=1&iframeId=shelterluv_wrap_1741279482&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=12946&embedded=1&iframeId=shelterluv_wrap_1764539274&columns=1',
  'https://new.shelterluv.com/api/v3/available-animals/1255?saved_query=12363&embedded=1&iframeId=shelterluv_wrap_1772060458&columns=1',
];

async function fetchAllDogs() {
  const allDogIds: number[] = [];
  
  for (const url of knownEndpoints) {
    try {
      console.log(`Fetching: ${url}`);
      const res = await fetch(url);
      
      if (!res.ok) {
        console.error(`Failed to fetch ${url}: ${res.status}`);
        continue;
      }
      
      const data = await res.json() as { animals?: Array<{ nid: number; name: string }> };
      
      if (data.animals) {
        console.log(`Found ${data.animals.length} dogs`);
        data.animals.forEach(animal => {
          if (!allDogIds.includes(animal.nid)) {
            allDogIds.push(animal.nid);
          }
        });
      }
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
    }
  }
  
  // Write to latest_scraped_ids.json
  const filePath = path.join(process.cwd(), 'public', 'latest_scraped_ids.json');
  fs.writeFileSync(filePath, JSON.stringify(allDogIds));
  console.log(`\nWrote ${allDogIds.length} dog IDs to latest_scraped_ids.json`);
  
  // Check if our target dogs are included
  const targetIds = [213012292, 213012498, 213029641];
  const found = targetIds.filter(id => allDogIds.includes(id));
  console.log(`\nTarget dogs found: ${found.length}/${targetIds.length}`);
  found.forEach(id => console.log(`  ✓ ${id}`));
}

fetchAllDogs();
