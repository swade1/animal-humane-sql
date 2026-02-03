// backup-tables.ts
// Utility to export dogs and dog_history tables to SQL files using Supabase SQL API

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backupTable(table: string, outFile: string) {
  // Use Supabase SQL API to export table as SQL insert statements
  const { data, error } = await supabase.rpc('pg_export_table', { table_name: table });
  if (error) {
    console.error(`Error exporting ${table}:`, error);
    return;
  }
  fs.writeFileSync(outFile, data);
  console.log(`Backed up ${table} to ${outFile}`);
}

export async function backupDogsAndHistory() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  await backupTable('dogs', path.join(backupDir, 'dogs_rows.sql'));
  await backupTable('dog_history', path.join(backupDir, 'dog_history_rows.sql'));
}

// If run directly, perform backup
if (require.main === module) {
  backupDogsAndHistory();
}
