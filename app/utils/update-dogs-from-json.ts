//Update dogs in the database using a json file for input
//From the app directory...
//Usage: npx tsx src/utils/update-dogs-from-json.ts path/to/your/file.jsonl
import 'dotenv/config';
import { createReadStream } from 'fs';
import * as readline from 'readline';
import { supabase } from '../lib/supabaseClient';

async function updateDog(dog: {
  id: number;
  origin?: string;
  latitude?: number;
  longitude?: number;
  bite_quarantine?: number;
  returned?: number;
}) {
  const { error } = await supabase
    .from('dogs')
    .update({
      origin: dog.origin,
      latitude: dog.latitude,
      longitude: dog.longitude,
      bite_quarantine: dog.bite_quarantine,
      returned: dog.returned,
    })
    .eq('id', dog.id);

  if (error) {
    console.error(`Failed to update dog id ${dog.id}:`, error);
  } else {
    console.log(`Updated dog id ${dog.id}`);
  }
}

async function main(filePath: string) {
  const fileStream = createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const dog = JSON.parse(line);
      await updateDog(dog);
    } catch (err) {
      console.error('Failed to parse line:', line, err);
    }
  }
}

if (process.argv.length < 3) {
  console.error('Usage: npx tsx src/utils/update-dogs-from-json.ts <file>');
  process.exit(1);
}

main(process.argv[2]);
